// castVote.js - the voting function (runs on Google's servers).
// One vote for each user in each matchup. A vote cannot be changed.
// This file never calls initializeApp(). index.js does it one time.

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

exports.castVote = onCall(async (request) => {
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
  }

  const db = getFirestore();
  const matchupRef = db.collection("matchups").doc(matchupId);

  // One vote document for each user and matchup: "matchupId_userId".
  // Saving it twice fails, so nobody can vote twice in a matchup.
  const voteRef = db.collection("votes").doc(matchupId + "_" + uid);

  return db.runTransaction(async (transaction) => {
    // ---------- READS (all reads come before any write) ----------
    const matchupSnap = await transaction.get(matchupRef);

    if (!matchupSnap.exists) {
      throw new HttpsError("not-found", "Matchup not found.");
    }

    const matchup = matchupSnap.data();

    if (!matchup.challengeId) {
      throw new HttpsError("failed-precondition", "This matchup has no challenge.");
    }

    const challengeRef = db.collection("challenges").doc(matchup.challengeId);
    const challengeSnap = await transaction.get(challengeRef);
    const voteSnap = await transaction.get(voteRef);

    if (!challengeSnap.exists) {
      throw new HttpsError("not-found", "Challenge not found.");
    }

    const challenge = challengeSnap.data();

    // ---------- CHECKS ----------
    if (challenge.status !== "open") {
      throw new HttpsError("failed-precondition", "This challenge is not open for voting.");
    }

    if (!challenge.roundEndsAt || typeof challenge.roundEndsAt.toMillis !== "function") {
      throw new HttpsError("failed-precondition", "This challenge has no end time.");
    }

    if (challenge.roundEndsAt.toMillis() <= Date.now()) {
      throw new HttpsError("failed-precondition", "Voting for this round has ended.");
    }

    if (matchup.round !== challenge.currentRound) {
      throw new HttpsError("failed-precondition", "This matchup is not in the active round.");
    }

    if (!matchup.itemA || !matchup.itemB) {
      throw new HttpsError("failed-precondition", "This matchup is not ready for voting.");
    }

    if (matchup.winnerId) {
      throw new HttpsError("failed-precondition", "This matchup has already been decided.");
    }

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

    transaction.create(voteRef, {
      userId: uid,
      matchupId: matchupId,
      challengeId: matchup.challengeId,
      round: matchup.round,
      side: side,
      createdAt: FieldValue.serverTimestamp()
    });

    const change = {};
    change[countField] = FieldValue.increment(1);
    change[timeField] = FieldValue.serverTimestamp();
    transaction.update(matchupRef, change);

    return { success: true, message: "Vote submitted successfully." };
  });
});