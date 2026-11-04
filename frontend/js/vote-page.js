// vote-page.js - the Vote page: one card for each matchup of the active round.

import { db } from "./app.js";

import {
  doc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// These are used in the next steps. Importing them now checks that vote.js loads.
import {
  submitVote,
  watchMyVotes,
  canSeeCounts,
  getVoteCounts,
  formatVotes,
  getVoteState
} from "./vote.js";

const titleLine = document.getElementById("challenge-title");
const infoLine = document.getElementById("challenge-info");
const countdownLine = document.getElementById("round-countdown");
const messageLine = document.getElementById("vote-message");
const cardsBox = document.getElementById("matchups-container");
const winnerBox = document.getElementById("winner-container");

// What the page remembers
let challengeId = null;
let challenge = null;
let matchups = [];


// Which challenge? The address can say ?challenge=ID. If not, take the newest one.
async function findChallengeId() {
  const params = new URLSearchParams(location.search);
  const fromAddress = params.get("challenge");

  if (fromAddress) {
    return fromAddress;
  }

  const newest = query(
    collection(db, "challenges"),
    orderBy("createdAt", "desc"),
    limit(1)
  );

  const snap = await getDocs(newest);

  if (snap.empty) {
    return null;
  }

  return snap.docs[0].id;
}


// Step 2 only logs what it received. Step 3 draws the cards.
function render() {
  console.log("challenge:", challenge);
  console.log("matchups:", matchups.length);
}


async function start() {
  try {
    challengeId = await findChallengeId();
  } catch (error) {
    console.error("Could not find a challenge:", error);
    infoLine.textContent = "Could not load the challenge.";
    return;
  }

  if (challengeId === null) {
    infoLine.textContent = "No challenge yet. The next challenge starts Monday 9:00 AM.";
    return;
  }

  // Listen to the challenge. This runs again every time it changes.
  onSnapshot(
    doc(db, "challenges", challengeId),
    (snap) => {
      if (!snap.exists()) {
        infoLine.textContent = "This challenge was not found.";
        return;
      }

      challenge = snap.data();
      render();
    },
    (error) => {
      console.error("Could not load the challenge:", error);
      infoLine.textContent = "Could not load the challenge.";
    }
  );

  // Listen to all matchups of this challenge.
  onSnapshot(
    query(collection(db, "matchups"), where("challengeId", "==", challengeId)),
    (snap) => {
      matchups = [];

      for (const matchupDoc of snap.docs) {
        const data = matchupDoc.data();
        data.id = matchupDoc.id;
        matchups.push(data);
      }

      render();
    },
    (error) => {
      console.error("Could not load the matchups:", error);
      infoLine.textContent = "Could not load the matchups.";
    }
  );
}

start();