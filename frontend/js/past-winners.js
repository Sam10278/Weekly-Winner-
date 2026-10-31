
import { db } from "./app.js";

import {
    collection,
    getDocs,
    getDoc,
    doc,
    query,
    where,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

const winnersList = document.getElementById("past-winners-list");

function addText(parent, tag, value, className = "") {
    const element = document.createElement(tag);
    element.textContent = value;
    if (className) element.className = className;
    parent.appendChild(element);
    return element;
}

async function getCategoryName(challenge) {
    if (challenge.categoryName) return challenge.categoryName;
    if (!challenge.categoryId) return "Unknown Category";

    const snapshot = await getDoc(
        doc(db, "categories", challenge.categoryId)
    );

    return snapshot.exists()
        ? snapshot.data().name || "Unknown Category"
        : "Unknown Category";
}

async function getWinner(challengeId, bracketSize) {
    const totalRounds = Math.log2(Number(bracketSize));

    if (!Number.isInteger(totalRounds)) return null;

    const matchupsQuery = query(
        collection(db, "matchups"),
        where("challengeId", "==", challengeId)
    );

    const snapshot = await getDocs(matchupsQuery);

    const finalMatch = snapshot.docs
        .map(d => d.data())
        .find(m => Number(m.round) === totalRounds && Number(m.position) === 0);

    if (!finalMatch || !finalMatch.winnerId) return null;

    return [finalMatch.itemA, finalMatch.itemB]
        .find(item => item && item.id === finalMatch.winnerId) || null;
}

function makeWinnerCard(id, challenge, categoryName, winner) {
    const card = document.createElement("div");
    card.className = "winner-card";

    if (winner && winner.imageUrl) {
        const image = document.createElement("img");
        image.src = winner.imageUrl;
        image.alt = winner.name || "Winner";
        image.className = "winner-image";
        image.referrerPolicy = "no-referrer";
        card.appendChild(image);
    }

    const details = document.createElement("div");
    details.className = "winner-details";

    addText(details, "h2", categoryName);
    addText(details, "p", `Winner: ${winner?.name || "Not available"}`);
    addText(details, "p", `${challenge.bracketSize} teams`);

    if (challenge.finishedAt?.toDate) {
        addText(
            details,
            "p",
            `Finished: ${challenge.finishedAt.toDate().toLocaleDateString()}`
        );
    }

    const link = document.createElement("a");
    link.href = `/index.html?challenge=${encodeURIComponent(id)}`;
    link.textContent = "View Bracket";
    link.className = "winner-link";

    details.appendChild(link);
    card.appendChild(details);

    return card;
}

async function loadPastWinners() {
    if (!winnersList) return;

    try {
        const winnersQuery = query(
            collection(db, "challenges"),
            where("status", "==", "finished"),
            orderBy("finishedAt", "desc")
        );

        const snapshot = await getDocs(winnersQuery);
        winnersList.replaceChildren();

        if (snapshot.empty) {
            addText(
                winnersList,
                "p",
                "No past winners yet. Check back after the next challenge!"
            );
            return;
        }

        for (const challengeDoc of snapshot.docs) {
            const challenge = challengeDoc.data();

            try {
                const [categoryName, winner] = await Promise.all([
                    getCategoryName(challenge),
                    getWinner(challengeDoc.id, challenge.bracketSize)
                ]);

                winnersList.appendChild(
                    makeWinnerCard(
                        challengeDoc.id,
                        challenge,
                        categoryName,
                        winner
                    )
                );
            } catch (error) {
                console.error("Could not load winner:", error);

                winnersList.appendChild(
                    makeWinnerCard(
                        challengeDoc.id,
                        challenge,
                        challenge.categoryName || "Unknown Category",
                        null
                    )
                );
            }
        }
    } catch (error) {
        console.error("Failed to load past winners:", error);
        winnersList.textContent =
            "Could not load past winners. Please refresh the page.";
    }
}

loadPastWinners();
