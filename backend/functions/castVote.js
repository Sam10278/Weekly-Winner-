<<<<<<< HEAD
// castVote.js - the voting function (runs on Google's servers).
// One vote for each user in each matchup. A vote cannot be changed.
// This file never calls initializeApp(). index.js does it one time.
=======
>>>>>>> d2b1ead (feat: implement secure voting with Firebase Cloud Functions)

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

exports.castVote = onCall(async (request) => {
<<<<<<< HEAD
  // 1. The user must be logged in
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Please log in before voting.");
  }

  const uid = request.auth.uid;

  // request.data can be missing, so use an empty object in that case
  let data = request.data;
  if (!data) {
    data = {};
  }

  const matchupId = data.matchupId;
  const side = data.side;

  // 2. Check the input
  if (typeof matchupId !== "string" || matchupId.trim() === "") {
    throw new HttpsError("invalid-argument", "A matchup id is required.");
  }

  // a "/" would break the document path, and a huge id is not real
  if (matchupId.includes("/") || matchupId.length > 100) {
    throw new HttpsError("invalid-argument", "Invalid matchup id.");
  }

  if (side !== "A" && side !== "B") {
    throw new HttpsError("invalid-argument", "The side must be A or B.");
=======
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
>>>>>>> d2b1ead (feat: implement secure voting with Firebase Cloud Functions)
  }

  const db = getFirestore();
  const matchupRef = db.collection("matchups").doc(matchupId);

<<<<<<< HEAD
  // One vote document for each user and matchup: "matchupId_userId".
  // Saving it twice fails, so nobody can vote twice in a matchup.
  const voteRef = db.collection("votes").doc(matchupId + "_" + uid);

  return db.runTransaction(async (transaction) => {
    // ---------- READS (all reads come before any write) ----------
=======
  // One vote record per user per matchup
  const voteRef = matchupRef.collection("votes").doc(uid);

  return db.runTransaction(async (transaction) => {
    // 3. Read matchup
>>>>>>> d2b1ead (feat: implement secure voting with Firebase Cloud Functions)
    const matchupSnap = await transaction.get(matchupRef);

    if (!matchupSnap.exists) {
      throw new HttpsError("not-found", "Matchup not found.");
    }

    const matchup = matchupSnap.data();

    if (!matchup.challengeId) {
<<<<<<< HEAD
      throw new HttpsError("failed-precondition", "This matchup has no challenge.");
    }

    const challengeRef = db.collection("challenges").doc(matchup.challengeId);
=======
      throw new HttpsError(
        "failed-precondition",
        "Matchup has no associated challenge."
      );
    }

    const challengeRef = db
      .collection("challenges")
      .doc(matchup.challengeId);

    // All transaction reads happen before writes
>>>>>>> d2b1ead (feat: implement secure voting with Firebase Cloud Functions)
    const challengeSnap = await transaction.get(challengeRef);
    const voteSnap = await transaction.get(voteRef);

    if (!challengeSnap.exists) {
      throw new HttpsError("not-found", "Challenge not found.");
    }

    const challenge = challengeSnap.data();

<<<<<<< HEAD
    // ---------- CHECKS ----------
    // the challenge must be open
    if (challenge.status !== "open") {
      throw new HttpsError("failed-precondition", "This challenge is not open for voting.");
    }

    // the round must still be running
    if (!challenge.roundEndsAt || typeof challenge.roundEndsAt.toMillis !== "function") {
      throw new HttpsError("failed-precondition", "This challenge has no end time.");
    }

    if (challenge.roundEndsAt.toMillis() <= Date.now()) {
      throw new HttpsError("failed-precondition", "Voting for this round has ended.");
    }

    // the matchup must be in the active round
    if (matchup.round !== challenge.currentRound) {
      throw new HttpsError("failed-precondition", "This matchup is not in the active round.");
    }

    // both items must be there
    if (!matchup.itemA || !matchup.itemB) {
      throw new HttpsError("failed-precondition", "This matchup is not ready for voting.");
    }

    // it must not be decided already
    if (matchup.winnerId) {
      throw new HttpsError("failed-precondition", "This matchup has already been decided.");
    }

    // one vote only
    if (voteSnap.exists) {
      throw new HttpsError("already-exists", "You have already voted in this matchup.");
    }

    // ---------- WRITES ----------
    let countField = "votesB";
    let timeField = "lastVoteAtB";

    if (side === "A") {
      countField = "votesA";
      timeField = "lastVoteAtA";
    }

    // 1. save the vote (same fields as the data contract)
    transaction.create(voteRef, {
      userId: uid,
      matchupId: matchupId,
      challengeId: matchup.challengeId,
      round: matchup.round,
      side: side,
      createdAt: FieldValue.serverTimestamp()
    });

    // 2. add 1 to the count and save the time of this vote
    const change = {};
    change[countField] = FieldValue.increment(1);
    change[timeField] = FieldValue.serverTimestamp();
    transaction.update(matchupRef, change);

    return { success: true, message: "Vote submitted successfully." };
  });
});
=======
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
>>>>>>> d2b1ead (feat: implement secure voting with Firebase Cloud Functions)
