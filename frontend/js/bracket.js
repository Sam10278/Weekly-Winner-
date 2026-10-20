// Draws the bracket.
//   bracket.html?challenge=ID  -> loads that challenge from Firestore (live)
//   index.html with no address -> loads the newest challenge
//   ?size=16 with no challenge -> empty demo bracket, for testing the layout
//
// What Start Challenge saves, and what this file reads:
//   challenges/{id}: bracketSize, roundEndsAt, categoryId
//   matchups/{id}:   challengeId, round, position, itemA, itemB, votesA, votesB, winnerId
//   itemA and itemB are { id, name, imageUrl }, or null (null = TBD).
//   winnerId is the id of the winning item, or null.

import { db } from "./app.js";

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
//   showVote:  true -> box with a Vote button, false -> no button (the winner box)
// Names are typed by users, so they go in with textContent, never innerHTML.
function makeBox(contender, showVote) {
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

  if (contender && contender.votes !== undefined) {
    const votes = document.createElement("span");
    votes.className = "slot-votes";
    votes.textContent = contender.votes;
    slot.append(votes);
  }

  box.append(slot);

  if (contender && contender.isWinner) {
    box.classList.add("is-winner");
  }
  if (contender && contender.isLoser) {
    box.classList.add("is-loser");
  }

  if (showVote) {
    const voteBtn = document.createElement("button");
    voteBtn.type = "button";
    voteBtn.className = "vote-btn";
    voteBtn.textContent = "Vote";
    voteBtn.disabled = true;   // voting comes later, with a Cloud Function
    box.append(voteBtn);
  }

  return box;
}

function makeRound(roundNumber, totalRounds, size, side, matchupMap) {
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

    round.append(makeBox(getContender(matchup, spot.slotName), true));
  }

  return round;
}

// The middle column: one box, no Vote button
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

export function renderBracket(container, size = 8, matchups = []) {
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
    left.append(makeRound(r, totalRounds, size, "left", matchupMap));     // round 1 on the far left
    right.prepend(makeRound(r, totalRounds, size, "right", matchupMap));  // round 1 on the far right
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

  function redraw() {
    if (!challenge || !matchupsReady) {
      return;
    }
    renderBracket(root, challenge.bracketSize, matchups);
    updateInfo();
  }

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
    info.textContent = "No challenges yet. Start one on the Start Challenge page.";
    renderBracket(root, 8);   // an empty bracket, so the page is not blank
    return;
  }

  watchChallenge(root, info, challengeId);
}

start();