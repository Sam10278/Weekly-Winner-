// vote-page.js - the Vote page: one card for each matchup of the active round.
import { auth } from "./app.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";

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
let currentUser = null;
let myVotes = {};            // { matchupId: "A" or "B" }
let stopWatchingVotes = null;
let savingMatchups = {};     // matchups that are saving right now


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
// Make one piece of text with a class.
function addText(parent, tag, text, className) {
  const element = document.createElement(tag);
  element.textContent = text;

  if (className) {
    element.className = className;
  }

  parent.appendChild(element);
  return element;
}


// Make one side of a card: the picture, the name, and a Vote button.
// Make one side of a card: the picture, the name, and a Vote button.
function makeSide(matchup, side) {
  let item = matchup.itemB;
  if (side === "A") {
    item = matchup.itemA;
  }

  const box = document.createElement("div");
  box.className = "vote-side";
  box.dataset.side = side;

  if (!item) {
    addText(box, "p", "TBD", "vote-name");
    return box;
  }

  if (item.imageUrl) {
    const image = document.createElement("img");
    image.className = "vote-image";
    image.src = item.imageUrl;
    image.alt = "";
    image.referrerPolicy = "no-referrer";
    box.appendChild(image);
  }

  addText(box, "p", item.name || "(no name)", "vote-name");

  // Is voting allowed for this matchup right now?
  let timeLeft = false;
  if (challenge.roundEndsAt && typeof challenge.roundEndsAt.toMillis === "function") {
    timeLeft = challenge.roundEndsAt.toMillis() > Date.now();
  }

  let voted = false;
  let mySide = null;
  if (myVotes[matchup.id]) {
    voted = true;
    mySide = myVotes[matchup.id];
  }

  // Highlight the option the user voted for
  if (voted && mySide === side) {
    box.classList.add("my-vote");
    addText(box, "p", "Your vote", "your-vote")
  }
  
  let decided = false;
  if (matchup.winnerId) {
    decided = true;
  }

  let bothItems = false;
  if (matchup.itemA && matchup.itemB) {
    bothItems = true;
  }

  const state = getVoteState({
    isLoggedIn: currentUser !== null,
    hasVoted: voted,
    mySide: mySide,
    isDecided: decided,
    isOpen: challenge.status === "open",
    isCurrentRound: matchup.round === challenge.currentRound,
    hasTimeRemaining: timeLeft,
    hasBothItems: bothItems
  });

  const button = document.createElement("button");
  button.type = "button";
  button.className = "vote-button";
  button.dataset.matchupId = matchup.id;
  button.dataset.side = side;
  button.textContent = "Vote";
  button.disabled = state.disabled;
  button.title = state.reason || "";

  // a matchup that is saving right now stays off
  if (savingMatchups[matchup.id]) {
    button.disabled = true;
  }

  box.appendChild(button);
  return box;
}


// Make one card for one matchup.
function makeCard(matchup) {
  const card = document.createElement("article");
  card.className = "vote-card";
  card.dataset.matchupId = matchup.id;

  const sideA = makeSide(matchup, "A");
  const versus = document.createElement("div");
  versus.className = "vote-vs";
  versus.textContent = "VS";
  const sideB = makeSide(matchup, "B");

  card.append(sideA, versus, sideB);
  return card;
}
function showMessage(text, isError) {
  messageLine.textContent = text;

  if (isError) {
    messageLine.style.color = "#b91c1c";
  } else {
    messageLine.style.color = "#15803d";
  }
}

// Draw the page from what we know.
function render() {
  if (challenge === null) {
    return;
  }

  // the header
  let categoryName = "Challenge";
  if (challenge.categoryName) {
    categoryName = challenge.categoryName;
  }

  titleLine.textContent = categoryName;
  infoLine.textContent = challenge.bracketSize + " teams";

  // the cards: only the matchups of the active round
  cardsBox.replaceChildren();

  const activeMatchups = [];
  for (const matchup of matchups) {
    if (matchup.round === challenge.currentRound) {
      activeMatchups.push(matchup);
    }
  }

  // keep a steady order
  activeMatchups.sort(function (a, b) {
    return a.position - b.position;
  });

  if (activeMatchups.length === 0) {
    addText(cardsBox, "p", "No matchups to show.", "vote-empty");
    return;
  }

  for (const matchup of activeMatchups) {
    cardsBox.appendChild(makeCard(matchup));
  }
}

// Watch the login. When it changes, watch that user's votes.
onAuthStateChanged(auth, (user) => {
  currentUser = user;

  // stop the old watcher
  if (stopWatchingVotes) {
    stopWatchingVotes();
    stopWatchingVotes = null;
  }

  if (user) {
    stopWatchingVotes = watchMyVotes(user.uid, (votes) => {
      myVotes = votes;
      render();
    });
  } else {
    myVotes = {};
    render();
  }
});

// One click handler for all the Vote buttons.
cardsBox.addEventListener("click", async (event) => {
  const button = event.target.closest(".vote-button");

  if (!button || button.disabled) {
    return;
  }

  const matchupId = button.dataset.matchupId;
  const side = button.dataset.side;

  if (savingMatchups[matchupId]) {
    return;
  }

  savingMatchups[matchupId] = true;
  showMessage("Saving your vote...", false);
  render();

  const result = await submitVote(matchupId, side);

  delete savingMatchups[matchupId];

  if (result.ok) {
    showMessage("Vote saved.", false);
  } else {
    showMessage(result.message, true);
  }

  render();
});

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