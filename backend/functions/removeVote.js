// removeVote.js - take back a vote in a bracket matchup.
// This file never calls initializeApp(). index.js does it one time.

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

exports.removeVote = onCall(async (request) => {
  // 1. The user must be logged in
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Please log in first.");
  }

  const uid = request.auth.uid;

  let data = request.data;
  if (!data) {
    data = {};
  }

  const matchupId = data.matchupId;

  // 2. Check the input
  if (typeof matchupId !== "string" || matchupId.trim() === "") {
    throw new HttpsError("invalid-argument", "A matchup id is required.");
  }

  if (matchupId.includes("/") || matchupId.length > 100) {
    throw new HttpsError("invalid-argument", "Invalid matchup id.");
  }

  const db = getFirestore();
  const matchupRef = db.collection("matchups").doc(matchupId);
  const voteRef = db.collection("votes").doc(matchupId + "_" + uid);

  return db.runTransaction(async (transaction) => {
    // ---------- READS (all reads come before any write) ----------
    const matchupSnap = await transaction.get(matchupRef);

    if (!matchupSnap.exists) {
      throw new HttpsError("not-found", "Matchup not found.");
    }

    const matchup = matchupSnap.data();

    const voteSnap = await transaction.get(voteRef);

    if (!voteSnap.exists) {
      throw new HttpsError("failed-precondition", "You have not voted in this matchup.");
    }

    const vote = voteSnap.data();
    const side = vote.side;

    const challengeRef = db.collection("challenges").doc(matchup.challengeId);
    const challengeSnap = await transaction.get(challengeRef);

    if (!challengeSnap.exists) {
      throw new HttpsError("not-found", "Challenge not found.");
    }

    const challenge = challengeSnap.data();

    // the other votes on the same side (to fix the tie-break time)
    const sideVotesSnap = await transaction.get(
      db.collection("votes")
        .where("matchupId", "==", matchupId)
        .where("side", "==", side)
    );

    // ---------- CHECKS ----------
    if (challenge.status !== "open") {
      throw new HttpsError("failed-precondition", "This challenge is not open.");
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

    if (matchup.winnerId) {
      throw new HttpsError("failed-precondition", "This matchup has already been decided.");
    }

    if (side !== "A" && side !== "B") {
      throw new HttpsError("failed-precondition", "This vote has no valid side.");
    }

    // ---------- WORK (no database calls) ----------
    // The newest time among the OTHER votes on this side. null if there are none.
    let newestTime = null;

    for (const otherDoc of sideVotesSnap.docs) {
      if (otherDoc.id === voteRef.id) {
        continue;
      }

      const created = otherDoc.data().createdAt;

      if (created && typeof created.toMillis === "function") {
        if (newestTime === null || created.toMillis() > newestTime.toMillis()) {
          newestTime = created;
        }
      }
    }

    let countField = "votesB";
    let timeField = "lastVoteAtB";

    if (side === "A") {
      countField = "votesA";
      timeField = "lastVoteAtA";
    }

    // ---------- WRITES ----------
    transaction.delete(voteRef);

    const change = {};
    change[countField] = FieldValue.increment(-1);
    change[timeField] = newestTime;
    transaction.update(matchupRef, change);

    return { success: true, message: "Vote removed." };
  });
});