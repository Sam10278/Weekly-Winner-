
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

exports.castVote = onCall(async (request) => {
  // 1. Require authentication
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Please log in before voting."
    );
  }

  const { matchupId, side } = request.data || {};
  const uid = request.auth.uid;

  // 2. Validate input
  if (
    typeof matchupId !== "string" ||
    !matchupId.trim() ||
    !["A", "B"].includes(side)
  ) {
    throw new HttpsError(
      "invalid-argument",
      "A valid matchup ID and side (A or B) are required."
    );
  }

  const db = getFirestore();
  const matchupRef = db.collection("matchups").doc(matchupId);

  // One vote record per user per matchup
  const voteRef = matchupRef.collection("votes").doc(uid);

  return db.runTransaction(async (transaction) => {
    // 3. Read matchup
    const matchupSnap = await transaction.get(matchupRef);

    if (!matchupSnap.exists) {
      throw new HttpsError("not-found", "Matchup not found.");
    }

    const matchup = matchupSnap.data();

    if (!matchup.challengeId) {
      throw new HttpsError(
        "failed-precondition",
        "Matchup has no associated challenge."
      );
    }

    const challengeRef = db
      .collection("challenges")
      .doc(matchup.challengeId);

    // All transaction reads happen before writes
    const challengeSnap = await transaction.get(challengeRef);
    const voteSnap = await transaction.get(voteRef);

    if (!challengeSnap.exists) {
      throw new HttpsError("not-found", "Challenge not found.");
    }

    const challenge = challengeSnap.data();

    // 4. Verify challenge is open
    if (challenge.status !== "open") {
      throw new HttpsError(
        "failed-precondition",
        "This challenge is not open for voting."
      );
    }

    // 5. Verify voting deadline
    if (
      !challenge.roundEndsAt ||
      challenge.roundEndsAt.toMillis() <= Date.now()
    ) {
      throw new HttpsError(
        "failed-precondition",
        "Voting for this round has ended."
      );
    }

    // 6. Verify active round and both participants
    if (
      matchup.round !== challenge.currentRound ||
      !matchup.itemA ||
      !matchup.itemB ||
      matchup.winnerId != null
    ) {
      throw new HttpsError(
        "failed-precondition",
        "This matchup is not available for voting."
      );
    }

    // 7. Prevent duplicate voting
    if (voteSnap.exists) {
      throw new HttpsError(
        "already-exists",
        "You have already voted in this matchup."
      );
    }

    // 8. Record the vote and update count atomically
    const countField = side === "A" ? "votesA" : "votesB";
    const timeField = side === "A" ? "lastVoteAtA" : "lastVoteAtB";

    transaction.create(voteRef, {
      userId: uid,
      side,
      createdAt: FieldValue.serverTimestamp()
    });

    transaction.update(matchupRef, {
      [countField]: FieldValue.increment(1),
      [timeField]: FieldValue.serverTimestamp()
    });

    return {
      success: true,
      message: "Vote submitted successfully."
    };
  });
});
