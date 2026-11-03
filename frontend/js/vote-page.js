
import { db } from "./app.js";
import { submitVote } from "./vote.js";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  where
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

const challengeTitle = document.getElementById("challenge-title");
const challengeInfo = document.getElementById("challenge-info");
const voteMessage = document.getElementById("vote-message");
const matchupsContainer = document.getElementById("matchups-container");

// Find the challenge specified in the URL, or the newest challenge.
async function loadChallenge() {
  try {
    const params = new URLSearchParams(window.location.search);
    const challengeId = params.get("challenge");

    let challengeDoc;

    if (challengeId) {
      challengeDoc = await getDoc(doc(db, "challenges", challengeId));
    } else {
      // Prefer an open challenge.
      const openQuery = query(
        collection(db, "challenges"),
        where("status", "==", "open")
      );

      const openSnapshot = await getDocs(openQuery);

      if (!openSnapshot.empty) {
        // IDs are dates in YYYY-MM-DD format.
        challengeDoc = openSnapshot.docs.sort(
          (a, b) => b.id.localeCompare(a.id)
        )[0];
      } else {
        const recentQuery = query(
          collection(db, "challenges"),
          orderBy("createdAt", "desc"),
          limit(1)
        );

        const recentSnapshot = await getDocs(recentQuery);
        challengeDoc = recentSnapshot.docs[0];
      }
    }

    if (!challengeDoc || !challengeDoc.exists()) {
      challengeInfo.textContent = "No active challenge";
      voteMessage.textContent = "Next challenge starts Monday 9:00 AM";
      return;
    }

    const challenge = challengeDoc.data();

    challengeTitle.textContent =
      challenge.categoryName || "Weekly Winner";

    const currentRound = challenge.currentRound ?? 1;

challengeInfo.textContent =
  `Round ${currentRound} â€¢ Status: ${challenge.status}`;

console.log("Challenge ID:", challengeDoc.id);
console.log("Challenge data:", challenge);

await loadMatchups(challengeDoc.id, currentRound);

  } catch (error) {
    console.error("Error loading challenge:", error);
    voteMessage.textContent = "Unable to load the challenge.";
  }
}

// Load matchups belonging to the active round.
async function loadMatchups(challengeId, round) {
  const matchupsQuery = query(
    collection(db, "matchups"),
    where("challengeId", "==", challengeId),
    where("round", "==", round)
  );

  const snapshot = await getDocs(matchupsQuery);

  matchupsContainer.replaceChildren();

  if (snapshot.empty) {
    voteMessage.textContent = "No matchups found for this round.";
    return;
  }

  snapshot.forEach((matchupDoc) => {
    const matchup = matchupDoc.data();

    const card = document.createElement("article");
    card.className = "matchup-card";

    const heading = document.createElement("h2");
    heading.textContent = `Matchup ${matchup.position + 1}`;

    const itemA = document.createElement("p");
    itemA.textContent = matchup.itemA?.name || "Item A";

    const versus = document.createElement("p");
    versus.textContent = "VS";

    const itemB = document.createElement("p");
    itemB.textContent = matchup.itemB?.name || "Item B";

    const voteAButton = document.createElement("button");
    voteAButton.textContent = "Vote for " + (matchup.itemA?.name || "Item A");

    const voteBButton = document.createElement("button");
    voteBButton.textContent = "Vote for " + (matchup.itemB?.name || "Item B");

    async function handleVote(side) {
      voteAButton.disabled = true;
      voteBButton.disabled = true;

      try {
        await submitVote(matchupDoc.id, side);
        alert("Vote submitted successfully!");
      } catch (error) {
        alert(error.message);
      } finally {
        voteAButton.disabled = false;
        voteBButton.disabled = false;
      }
    }

    voteAButton.addEventListener("click", () => handleVote("A"));
    voteBButton.addEventListener("click", () => handleVote("B"));

    card.append(
        heading,
        itemA,
        voteAButton,
        versus,
        itemB,
        voteBButton
    );
    matchupsContainer.appendChild(card);
  });

  console.log("Matchups loaded:", snapshot.size);
}

loadChallenge();
