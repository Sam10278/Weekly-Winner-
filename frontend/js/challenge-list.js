
import { db } from "./app.js";

import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

const challengeList = document.getElementById("challenge-list");

function addText(parent, tag, text, className = "") {
  const element = document.createElement(tag);
  element.textContent = text;

  if (className) {
    element.className = className;
  }

  parent.appendChild(element);
  return element;
}

function formatTimeLeft(roundEndsAt) {
  if (!roundEndsAt || typeof roundEndsAt.toMillis !== "function") {
    return "Time unavailable";
  }

  const remaining = roundEndsAt.toMillis() - Date.now();

  if (remaining <= 0) {
    return "Round ended";
  }

  const minutes = Math.ceil(remaining / 60000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${mins}m left`;

  return `${mins}m left`;
}

async function getCategoryName(challenge) {
  if (challenge.categoryName) {
    return challenge.categoryName;
  }

  if (!challenge.categoryId) {
    return "Unknown Category";
  }

  try {
    const snapshot = await getDoc(
      doc(db, "categories", challenge.categoryId)
    );

    return snapshot.exists()
      ? snapshot.data().name || "Unknown Category"
      : "Unknown Category";
  } catch (error) {
    console.error("Failed to load category:", error);
    return "Unknown Category";
  }
}

function createChallengeCard(id, challenge, categoryName) {
  const card = document.createElement("a");
  card.className = "challenge-card";
  card.href = `/index.html?challenge=${encodeURIComponent(id)}`;

  addText(card, "h3", categoryName);

  addText(
    card,
    "p",
    `${challenge.bracketSize || "Unknown"} teams`
  );

  const finished = challenge.status === "finished";

  const roundEnded =
    challenge.roundEndsAt?.toMillis?.() <= Date.now();

  addText(
    card,
    "p",
    finished ? "Finished" : roundEnded ? "Round ended" : "Voting now",    "challenge-status"
  );

  if (finished) {
    const winnerName =
      challenge.winnerName ||
      challenge.winner?.name ||
      "Winner unavailable";

    addText(card, "p", `Winner: ${winnerName}`);
  } else {
    addText(
      card,
      "p",
      formatTimeLeft(challenge.roundEndsAt),
      "challenge-time"
    );
  }

  addText(card, "span", "View Bracket", "challenge-link");

  return card;
}

async function loadChallenges() {
  if (!challengeList) return;

  try {
    const challengesQuery = query(
      collection(db, "challenges"),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const snapshot = await getDocs(challengesQuery);

    challengeList.replaceChildren();

    if (snapshot.empty) {
      addText(
        challengeList,
        "p",
        "Next challenge starts Monday 9:00 AM",
        "challenge-empty"
      );
      return;
    }

    const cards = await Promise.all(
      snapshot.docs.map(async (documentSnapshot) => {
        const challenge = documentSnapshot.data();
        const categoryName = await getCategoryName(challenge);

        return createChallengeCard(
          documentSnapshot.id,
          challenge,
          categoryName
        );
      })
    );

    challengeList.append(...cards);

  } catch (error) {
    console.error("Failed to load challenges:", error);

    challengeList.replaceChildren();

    addText(
      challengeList,
      "p",
      "Could not load challenges. Please refresh the page.",
      "challenge-empty"
    );
  }
}

loadChallenges();
