// category-vote.js - vote for the next category (separate from bracket voting).

import { auth, db, functions } from "./app.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";

import {
  httpsCallable
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-functions.js";

import {
  collection,
  getDocs,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

const messageLine = document.getElementById("category-vote-message");
const listBox = document.getElementById("category-vote-list");

// What the page remembers
let currentUser = null;
let candidates = [];       // [{ id, name, itemCount }] open categories with 8+ items
let voteTotals = {};       // { categoryId: number of votes }
let myVotes = {};          // { categoryId: true }
let stopWatchingMine = null;
let savingCategories = {}; // categories that are saving right now


// Open categories that have at least 8 items.
async function loadCandidates() {
  const categorySnap = await getDocs(collection(db, "categories"));
  const result = [];

  for (const doc of categorySnap.docs) {
    const data = doc.data();

    if (data.closed === true) {
      continue;
    }

    const itemSnap = await getDocs(
      query(collection(db, "items"), where("categoryId", "==", doc.id))
    );

    if (itemSnap.size >= 8) {
      let name = "(no name)";
      if (data.name) {
        name = data.name;
      }

      result.push({ id: doc.id, name: name, itemCount: itemSnap.size });
    }
  }

  result.sort(function (a, b) {
    return a.name.localeCompare(b.name);
  });

  return result;
}


function showMessage(text, isError) {
  messageLine.textContent = text;

  if (isError) {
    messageLine.style.color = "#b91c1c";
  } else {
    messageLine.style.color = "#15803d";
  }
}


function addText(parent, tag, text, className) {
  const element = document.createElement(tag);
  element.textContent = text;

  if (className) {
    element.className = className;
  }

  parent.appendChild(element);
  return element;
}


// Make one card for one category.
function makeCard(category) {
  const card = document.createElement("article");
  card.className = "category-card";

  let voted = false;
  if (myVotes[category.id]) {
    voted = true;
    card.classList.add("my-vote");
  }

  addText(card, "h2", category.name, "category-card-name");
  addText(card, "p", category.itemCount + " items", "category-card-items");

  let total = 0;
  if (voteTotals[category.id]) {
    total = voteTotals[category.id];
  }

  let totalText = total + " votes";
  if (total === 1) {
    totalText = "1 vote";
  }
  addText(card, "p", totalText, "category-card-total");

  const button = document.createElement("button");
  button.type = "button";
  button.className = "category-vote-button";
  button.dataset.categoryId = category.id;

  if (voted) {
    button.textContent = "Voted (click to undo)";
  } else {
    button.textContent = "Vote";
  }

  if (currentUser === null) {
    button.disabled = true;
    button.title = "Please log in to vote.";
  }

  if (savingCategories[category.id]) {
    button.disabled = true;
  }

  card.appendChild(button);
  return card;
}


// Draw the page from what we know.
function render() {
  listBox.replaceChildren();

  if (candidates.length === 0) {
    addText(
      listBox,
      "p",
      "No categories can be voted on right now. A category needs at least 8 items.",
      "category-empty"
    );
    return;
  }

  // most votes first, then by name
  const sorted = candidates.slice();
  sorted.sort(function (a, b) {
    let votesA = 0;
    if (voteTotals[a.id]) {
      votesA = voteTotals[a.id];
    }

    let votesB = 0;
    if (voteTotals[b.id]) {
      votesB = voteTotals[b.id];
    }

    if (votesA !== votesB) {
      return votesB - votesA;
    }

    return a.name.localeCompare(b.name);
  });

  for (const category of sorted) {
    listBox.appendChild(makeCard(category));
  }
}


// Watch the login. When it changes, watch that user's votes.
onAuthStateChanged(auth, (user) => {
  currentUser = user;

  if (stopWatchingMine) {
    stopWatchingMine();
    stopWatchingMine = null;
  }

  myVotes = {};

  if (user) {
    stopWatchingMine = onSnapshot(
      query(collection(db, "categoryVotes"), where("userId", "==", user.uid)),
      (snap) => {
        myVotes = {};

        for (const voteDoc of snap.docs) {
          myVotes[voteDoc.data().categoryId] = true;
        }

        render();
      },
      (error) => {
        console.error("Could not load your votes:", error);
      }
    );
  }

  render();
});


// One click handler for all the Vote buttons.
listBox.addEventListener("click", async (event) => {
  const button = event.target.closest(".category-vote-button");

  if (!button || button.disabled) {
    return;
  }

  const categoryId = button.dataset.categoryId;

  if (savingCategories[categoryId]) {
    return;
  }

  savingCategories[categoryId] = true;
  showMessage("Saving...", false);
  render();

  try {
    const toggle = httpsCallable(functions, "toggleCategoryVote");
    const result = await toggle({ categoryId: categoryId });

    if (result.data.voted) {
      showMessage("Vote saved.", false);
    } else {
      showMessage("Vote removed.", false);
    }
  } catch (error) {
    console.error("toggleCategoryVote failed:", error);

    let text = "Could not save your vote. Please try again.";
    if (error.code === "functions/failed-precondition") {
      text = error.message;
    }
    showMessage(text, true);
  }

  delete savingCategories[categoryId];
  render();
});


async function start() {
  try {
    candidates = await loadCandidates();
  } catch (error) {
    console.error("Could not load categories:", error);
    listBox.textContent = "Could not load categories.";
    return;
  }

  // Live totals: every category vote from everyone
  onSnapshot(
    collection(db, "categoryVotes"),
    (snap) => {
      voteTotals = {};

      for (const voteDoc of snap.docs) {
        const id = voteDoc.data().categoryId;

        if (!voteTotals[id]) {
          voteTotals[id] = 0;
        }
        voteTotals[id] = voteTotals[id] + 1;
      }

      render();
    },
    (error) => {
      console.error("Could not load the totals:", error);
    }
  );

  render();
}

start();