// Draws the bracket and lets people vote on it.
//   index.html?challenge=ID    -> loads that challenge from Firestore (live)
//   index.html with no address -> loads the newest challenge
//   ?size=16 with no challenge -> empty demo bracket, for testing the layout
//
// What this file reads:
//   challenges/{id}: bracketSize, roundEndsAt, currentRound, status, categoryId
//   matchups/{id}:   challengeId, round, position, itemA, itemB, votesA, votesB, winnerId
//   itemA and itemB are { id, name, imageUrl }, or null (null = TBD).
//   winnerId is the id of the winning item, or null.
// Voting: submitVote and removeMyVote (vote.js) call the Cloud Functions.

import { auth, db } from "./app.js";

import { onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";

import {
  submitVote,
  removeMyVote,
  watchMyVotes,
  getVoteState
} from "./vote.js";

import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

const ALLOWED_SIZES = [8, 16, 32];

// 1 matchup = Final, 2 = Semi-final, otherwise "Round 1/4", "Round 1/8"...
function roundName(matchCount) {
  if (matchCount === 1) {
    return "Final";
  }
  if (matchCount === 2) {
    return "Semi-final";
  }
  return `Round 1/${matchCount}`;
}

// ---------- which item goes in which box ----------

// Turn one slot of a matchup into a small object for a box.
// Returns null when the slot is still TBD.
function getContender(matchup, slotName) {
  if (!matchup) {
    return null;
  }

  let item = null;
  let votes = 0;

  if (slotName === "A") {
    item = matchup.itemA;
    votes = matchup.votesA;
  } else {
    item = matchup.itemB;
    votes = matchup.votesB;
  }

  if (!item) {
    return null;
  }

  const decided = matchup.winnerId !== null && matchup.winnerId !== undefined;

  return {
    name: item.name || "(no name)",
    imageUrl: item.imageUrl || "",
    votes: Number(votes) || 0,
    isWinner: decided && matchup.winnerId === item.id,
    isLoser: decided && matchup.winnerId !== item.id
  };
}

// Which matchup and which slot (A or B) does a box belong to?
//   side: "left" or "right"
//   i: the box number from the top (0, 1, 2...)
function findSlot(matchCount, side, i) {
  if (matchCount === 1) {
    // the final: the left finalist is A, the right finalist is B
    if (side === "left") {
      return { position: 0, slotName: "A" };
    }
    return { position: 0, slotName: "B" };
  }

  // the left side has the first half of the matchups, the right side the rest
  let start = 0;
  if (side === "right") {
    start = matchCount / 2;
  }

  let slotName = "A";
  if (i % 2 === 1) {
    slotName = "B";
  }

  return { position: start + Math.floor(i / 2), slotName: slotName };
}

// ---------- building the page ----------

// One box = one item.
//   contender: { name, imageUrl, votes, isWinner, isLoser }, or null for TBD
//   showVote:  true -> box with a button, false -> no button (the winner box)
// Names are typed by users, so they go in with textContent, never innerHTML.
function makeBox(contender, showVote, matchup, side, state = getVoteState(), isSaving = false) {
  const box = document.createElement("div");
  box.className = "matchup";

  const slot = document.createElement("div");
  slot.className = "slot";

  if (contender && contender.imageUrl) {
    const image = document.createElement("img");
    image.className = "slot-image";
    image.src = contender.imageUrl;
    image.alt = "";
    image.referrerPolicy = "no-referrer";
    slot.append(image);
  }

  const name = document.createElement("span");
  name.className = "slot-name";
  if (contender) {
    name.textContent = contender.name;
  } else {
    name.textContent = "TBD";
  }
  slot.append(name);

  // Green highlight on the side the user picked
  if (contender && state.hasVoted && state.mySide === side) {
    box.classList.add("my-vote");
  }

  // The count: shown only after you voted, or when the matchup is decided.
  // Otherwise show "?".
  if (contender && contender.votes !== undefined) {
    const votes = document.createElement("span");
    votes.className = "slot-votes";

    if (state.canSeeCounts) {
      votes.textContent = contender.votes;
    } else {
      votes.textContent = "?";
      votes.title = "Vote to see the count";
    }

    slot.append(votes);
  }

  box.append(slot);

  if (contender && contender.isWinner) {
    box.classList.add("is-winner");
  }
  if (contender && contender.isLoser) {
    box.classList.add("is-loser");
  }

  // Vote / Remove button: only for real items inside a real matchup
  if (showVote && contender && matchup) {
    const voteBtn = document.createElement("button");
    voteBtn.type = "button";
    voteBtn.className = "vote-btn";
    voteBtn.dataset.matchupId = matchup.id;
    voteBtn.dataset.side = side;

    if (state.hasVoted && state.mySide === side && state.canRemove) {
      // my side: the button takes the vote back
      voteBtn.textContent = "Remove";
      voteBtn.dataset.action = "remove";
      voteBtn.disabled = false;
      voteBtn.title = "Remove my vote";
    } else {
      voteBtn.textContent = "Vote";
      voteBtn.dataset.action = "vote";
      voteBtn.disabled = state.disabled;
      voteBtn.title = state.reason || "";
    }

    // off while this matchup is saving
    if (isSaving) {
      voteBtn.disabled = true;
    }

    box.append(voteBtn);
  }

  return box;
}

function makeRound(roundNumber, totalRounds, size, side, matchupMap, getMatchupState, savingIds) {
  const matchCount = size / 2 ** roundNumber;   // matchups in this round, both sides together
  const perSide = matchCount;                   // one box per item, so boxes on one side = matchups

  const round = document.createElement("div");
  round.className = "round";
  round.style.setProperty("--span", 2 ** (roundNumber - 1));

  if (roundNumber === 1) {
    round.classList.add("round-first");
  }
  if (roundNumber <= totalRounds - 1) {
    round.classList.add("round-pairs");
  }
  if (roundNumber >= 2) {
    round.classList.add("round-in");
  }
  if (roundNumber === totalRounds) {
    round.classList.add("round-last");
  }

  const label = document.createElement("h3");
  label.className = "round-label";
  label.textContent = roundName(matchCount);
  round.append(label);

  for (let i = 0; i < perSide; i++) {
    const spot = findSlot(matchCount, side, i);
    const matchup = matchupMap.get(`${roundNumber}-${spot.position}`);

    let state = getVoteState();
    if (getMatchupState) {
      state = getMatchupState(matchup);
    }

    let isSaving = false;
    if (matchup && savingIds.has(matchup.id)) {
      isSaving = true;
    }

    round.append(makeBox(getContender(matchup, spot.slotName), true, matchup, spot.slotName, state, isSaving));
  }

  return round;
}

// The middle column: one box, no button
function makeWinner(totalRounds, matchupMap) {
  const round = document.createElement("div");
  round.className = "round round-winner";

  const label = document.createElement("h3");
  label.className = "round-label";
  label.textContent = "Winner";
  round.append(label);

  let winner = null;
  const finalMatchup = matchupMap.get(`${totalRounds}-0`);

  if (finalMatchup && finalMatchup.winnerId) {
    if (finalMatchup.itemA && finalMatchup.itemA.id === finalMatchup.winnerId) {
      winner = finalMatchup.itemA;
    } else if (finalMatchup.itemB && finalMatchup.itemB.id === finalMatchup.winnerId) {
      winner = finalMatchup.itemB;
    }
  }

  let contender = null;
  if (winner) {
    contender = {
      name: winner.name || "(no name)",
      imageUrl: winner.imageUrl || "",
      isWinner: true
    };
  }

  round.append(makeBox(contender, false));
  return round;
}

export function renderBracket(container, size = 8, matchups = [], myVotes = {}, getMatchupState = null, savingIds = new Set()) {
  if (!ALLOWED_SIZES.includes(size)) {
    size = 8;
  }
  const totalRounds = Math.log2(size);   // 8 -> 3, 16 -> 4, 32 -> 5

  // quick lookup: "round-position" -> matchup
  const matchupMap = new Map();
  matchups.forEach((matchup) => {
    matchupMap.set(`${matchup.round}-${matchup.position}`, matchup);
  });

  // remember the sideways scroll, so a live update does not jump back to the left
  const oldBracket = container.querySelector(".bracket");
  let scrollLeft = 0;
  if (oldBracket) {
    scrollLeft = oldBracket.scrollLeft;
  }

  const left = document.createElement("div");
  left.className = "bracket-half bracket-left";
  const right = document.createElement("div");
  right.className = "bracket-half bracket-right";

  for (let r = 1; r <= totalRounds; r++) {
    left.append(makeRound(r, totalRounds, size, "left", matchupMap, getMatchupState, savingIds));     // round 1 on the far left
    right.prepend(makeRound(r, totalRounds, size, "right", matchupMap, getMatchupState, savingIds));  // round 1 on the far right
  }

  const tree = document.createElement("div");
  tree.className = "bracket-tree";
  tree.append(left, makeWinner(totalRounds, matchupMap), right);

  const bracket = document.createElement("div");
  bracket.className = "bracket";
  bracket.style.setProperty("--rows", size / 2);   // boxes in round 1 on one side
  bracket.append(tree);

  container.replaceChildren(bracket);
  bracket.scrollLeft = scrollLeft;
}

// ---------- loading from Firestore ----------

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}

// The first round that still has an undecided matchup. null = everything is decided.
function activeRound(matchups, totalRounds) {
  for (let r = 1; r <= totalRounds; r++) {
    const undecided = matchups.some((m) => m.round === r && !m.winnerId);
    if (undecided) {
      return r;
    }
  }
  return null;
}

async function loadCategoryName(categoryId) {
  try {
    const snap = await getDoc(doc(db, "categories", categoryId));
    if (snap.exists()) {
      return snap.data().name || "";
    }
    return "";
  } catch (error) {
    console.error("Error loading the category name:", error);
    return "";
  }
}

async function findLatestChallengeId() {
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

// Listens to one challenge and its matchups. The page updates by itself.
function watchChallenge(root, info, challengeId) {
  let challenge = null;
  let matchups = [];
  let matchupsReady = false;
  let categoryName = "";
  let categoryRequested = false;
  let currentUser = auth.currentUser;
  let myVotes = {};
  let stopWatchingVotes = null;

  const savingIds = new Set();

  // the line of text above the bracket
  function updateInfo() {
    if (!challenge) {
      return;
    }

    const size = challenge.bracketSize;
    const totalRounds = Math.log2(size);
    const title = challenge.categoryName || categoryName || "Challenge";

    let status = "";

    if (matchupsReady && matchups.length > 0) {
      const round = activeRound(matchups, totalRounds);

      if (round === null) {
        status = "Finished";
      } else {
        const name = roundName(size / 2 ** round);

        let end = 0;
        if (challenge.roundEndsAt) {
          end = challenge.roundEndsAt.toMillis();
        }

        const remaining = end - Date.now();

        if (remaining <= 0) {
          status = `${name} has ended`;
        } else {
          status = `${name} ends in ${formatTime(remaining)}`;
        }
      }
    }

    const parts = [title, `${size} teams`];
    if (status) {
      parts.push(status);
    }
    info.textContent = parts.join(" · ");
  }

  
  function getMatchupVoteState(matchup) {
    if (!matchup || !challenge) {
      return getVoteState();
    }

    let mySide = null;
    if (myVotes[matchup.id]) {
      mySide = myVotes[matchup.id];
    }

    const hasVoted = mySide !== null;
    const isDecided = Boolean(matchup.winnerId);
    const isOpen = challenge.status === "open";
    const isCurrentRound = matchup.round === challenge.currentRound;

    let hasTimeRemaining = false;
    if (challenge.roundEndsAt && typeof challenge.roundEndsAt.toMillis === "function") {
      hasTimeRemaining = challenge.roundEndsAt.toMillis() > Date.now();
    }

    const hasBothItems = Boolean(matchup.itemA && matchup.itemB);

    return getVoteState({
      isLoggedIn: currentUser !== null,
      hasVoted: hasVoted,
      mySide: mySide,
      isDecided: isDecided,
      isOpen: isOpen,
      isCurrentRound: isCurrentRound,
      hasTimeRemaining: hasTimeRemaining,
      hasBothItems: hasBothItems
    });
  }

  function redraw() {
    if (!challenge || !matchupsReady) {
      return;
    }
    renderBracket(root, challenge.bracketSize, matchups, myVotes, getMatchupVoteState, savingIds);
    updateInfo();
  }

  function showVoteMessage(message, isError = false) {
    // The message line is in index.html, outside the bracket.
    const messageElement = document.getElementById("vote-message");
    if (!messageElement) {
      return;
    }

    messageElement.textContent = message;

    if (isError) {
      messageElement.style.color = "#c0392b";
    } else {
      messageElement.style.color = "#15803d";
    }
  }

  // One click handler for all the buttons (Vote and Remove).
  // It is on root because renderBracket() replaces the buttons on every redraw.
  root.addEventListener("click", async (event) => {
    const button = event.target.closest(".vote-btn");
    if (!button || button.disabled) {
      return;
    }

    const matchupId = button.dataset.matchupId;
    const side = button.dataset.side;
    const action = button.dataset.action;

    if (!matchupId || (side !== "A" && side !== "B")) {
      showVoteMessage("Invalid matchup or voting side.", true);
      return;
    }

    const matchup = matchups.find((m) => m.id === matchupId);

    if (!matchup) {
      showVoteMessage("This match is no longer available.", true);
      return;
    }

    const state = getMatchupVoteState(matchup);

    if (action === "remove") {
      if (!state.canRemove) {
        showVoteMessage("You can no longer remove your vote here.", true);
        return;
      }
    } else {
      if (!state.canVote) {
        showVoteMessage(state.reason || "Voting is unavailable.", true);
        return;
      }
    }

    // do not send a second request for the same matchup
    if (savingIds.has(matchupId)) {
      return;
    }

    savingIds.add(matchupId);
    redraw();

    try {
      let result = null;

      if (action === "remove") {
        showVoteMessage("Removing your vote...");
        result = await removeMyVote(matchupId);
      } else {
        showVoteMessage("Submitting your vote...");
        result = await submitVote(matchupId, side);
      }

      if (result.ok) {
        if (action === "remove") {
          showVoteMessage("Vote removed. You can vote again.");
        } else {
          showVoteMessage("Vote saved. You can remove it and vote again.");
        }
      } else {
        showVoteMessage(result.message || "Unable to save your vote.", true);
      }
    } catch (error) {
      console.error("Unexpected voting error:", error);
      showVoteMessage("Something went wrong while submitting your vote.", true);
    } finally {
      savingIds.delete(matchupId);
      // watchMyVotes updates myVotes when Firestore reports the change
      redraw();
    }
  });

  onAuthStateChanged(auth, (user) => {
    currentUser = user;

    // Stop listening to the previous user's votes
    if (stopWatchingVotes) {
      stopWatchingVotes();
      stopWatchingVotes = null;
    }

    // Clear votes from the previous user
    myVotes = {};
    redraw();

    if (user) {
      // Start listening to the current user's votes
      stopWatchingVotes = watchMyVotes(user.uid, (votes) => {
        myVotes = votes;
        redraw();
      });
    }
  });

  onSnapshot(
    doc(db, "challenges", challengeId),
    (snap) => {
      if (!snap.exists()) {
        info.textContent = "This challenge was not found.";
        root.replaceChildren();
        return;
      }

      challenge = snap.data();

      if (!ALLOWED_SIZES.includes(challenge.bracketSize)) {
        info.textContent = "This challenge has an invalid bracket size.";
        root.replaceChildren();
        challenge = null;
        return;
      }

      if (!categoryRequested && !challenge.categoryName && challenge.categoryId) {
        categoryRequested = true;
        loadCategoryName(challenge.categoryId).then((name) => {
          categoryName = name;
          updateInfo();
        });
      }

      redraw();
    },
    (error) => {
      console.error("Error loading the challenge:", error);
      info.textContent = `Could not load the challenge (${error.code || "unknown error"}).`;
    }
  );

  onSnapshot(
    query(collection(db, "matchups"), where("challengeId", "==", challengeId)),
    (snap) => {
      matchups = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      matchupsReady = true;
      redraw();
    },
    (error) => {
      console.error("Error loading the matchups:", error);
      info.textContent = `Could not load the matchups (${error.code || "unknown error"}).`;
    }
  );

  // keeps the countdown ticking
  setInterval(updateInfo, 1000);
}

async function start() {
  const root = document.getElementById("bracket-root");
  if (!root) {
    return;
  }

  // the line of text above the bracket
  const info = document.createElement("p");
  info.id = "bracket-info";
  root.before(info);

  const params = new URLSearchParams(location.search);
  let challengeId = params.get("challenge");
  const demoSize = Number(params.get("size"));

  // ?size=16 with no challenge: an empty bracket, for testing the layout
  if (!challengeId && demoSize) {
    info.textContent = `Demo bracket · ${demoSize} teams (empty)`;
    renderBracket(root, demoSize);
    return;
  }

  // no address: show the newest challenge
  if (!challengeId) {
    info.textContent = "Looking for the newest challenge...";

    try {
      challengeId = await findLatestChallengeId();
    } catch (error) {
      console.error("Error loading challenges:", error);
      info.textContent = `Could not load challenges (${error.code || "unknown error"}).`;
      return;
    }
  }

  if (!challengeId) {
    info.textContent = "No challenges yet. The next challenge starts Monday 9:00 AM.";
    renderBracket(root, 8);   // an empty bracket, so the page is not blank
    return;
  }

  watchChallenge(root, info, challengeId);
}

start();