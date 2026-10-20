
import { db, auth } from "./app.js";

import {
    collection,
    getDocs,
    query,
    where,
    doc,
    writeBatch,
    serverTimestamp,
    Timestamp
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";

const categorySelect = document.getElementById("category-select");
const message = document.getElementById("challenge-message");
const challengePreview = document.getElementById("challenge-preview");
const challengeForm = document.getElementById("challenge-form");
const startBtn = document.getElementById("start-btn");

const sizeOptions = document.querySelectorAll(
    'input[name="bracket-size"]'
);

let loggedInUser = null;
let authReady = false;
let countRequest = 0;

onAuthStateChanged(auth, (user) => {
    loggedInUser = user;
    authReady = true;
});

async function loadCategories() {
    try {
        const snapshot = await getDocs(collection(db, "categories"));

        if (snapshot.empty) {
            message.textContent = "No categories yet";
            return;
        }

        snapshot.forEach((category) => {
            const option = document.createElement("option");

            option.value = category.id;
            option.textContent = category.data().name;

            categorySelect.appendChild(option);
        });

    } catch (error) {
        console.error("Error loading categories:", error);
        message.textContent = "Failed to load categories.";
    }
}

async function updateItemCount() {
    const requestId = ++countRequest;
    const categoryId = categorySelect.value;

    const selectedSize = document.querySelector(
        'input[name="bracket-size"]:checked'
    );

    if (!categoryId || !selectedSize) {
        challengePreview.textContent =
            "Select a category to see available items.";
        return;
    }

    const size = Number(selectedSize.value);

    challengePreview.textContent = "Checking available items...";

    try {
        const itemsQuery = query(
            collection(db, "items"),
            where("categoryId", "==", categoryId)
        );

        const snapshot = await getDocs(itemsQuery);

        if (requestId !== countRequest) {
            return;
        }

        const count = snapshot.size;

        if (count < size) {
            challengePreview.textContent =
                `This category has only ${count} items. You need ${size}.`;
        } else {
            challengePreview.textContent =
                `${size} random items will be selected from ${count} available items.`;
        }

    } catch (error) {
        if (requestId !== countRequest) {
            return;
        }

        console.error("Error counting items:", error);

        challengePreview.textContent =
            "Unable to check available items.";
    }
}

function shuffleItems(items) {
    const shuffled = [...items];

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
}

async function saveChallenge(categoryId, size, selectedItems, userId) {

    const challengeRef = doc(collection(db, "challenges"));

    const batch = writeBatch(db);

    const roundEndsAt = Timestamp.fromDate(
        new Date(Date.now() + 24 * 60 * 60 * 1000)
    );

    batch.set(challengeRef, {
        categoryId: categoryId,
        bracketSize: size,
        status: "open",
        createdBy: userId,
        createdAt: serverTimestamp(),
        roundEndsAt: roundEndsAt
    });

    const totalRounds = Math.log2(size);

    for (let round = 1; round <= totalRounds; round++) {

        const matchCount = size / Math.pow(2, round);

        for (let position = 0; position < matchCount; position++) {

            const matchupRef = doc(collection(db, "matchups"));

            let itemA = null;
            let itemB = null;

            if (round === 1) {
                itemA = selectedItems[position * 2].id;
                itemB = selectedItems[position * 2 + 1].id;
            }

            // Later rounds stay empty until winners advance
            batch.set(matchupRef, {
                challengeId: challengeRef.id,
                round: round,
                position: position,
                itemA: itemA,
                itemB: itemB,
                votesA: 0,
                votesB: 0,
                winnerId: null
            });
        }
    }

    await batch.commit();

    return challengeRef.id;
}

challengeForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (startBtn.disabled) {
        return;
    }

    message.textContent = "";

    const categoryId = categorySelect.value;

    const selectedSize = document.querySelector(
        'input[name="bracket-size"]:checked'
    );

    if (!categoryId) {
        message.textContent = "Please select a category.";
        return;
    }

    if (!selectedSize) {
        message.textContent = "Please select a bracket size.";
        return;
    }

    const size = Number(selectedSize.value);

    if (![8, 16, 32].includes(size)) {
        message.textContent = "Invalid bracket size.";
        return;
    }

    if (!authReady) {
        message.textContent =
            "Checking login status. Please try again.";
        return;
    }

    if (!loggedInUser) {
        message.textContent =
            "Please log in to start a challenge.";
        return;
    }

    startBtn.disabled = true;
    startBtn.textContent = "Starting...";
    message.textContent = "Checking challenge requirements...";
    let created = false;
    try {
        const itemsQuery = query(
            collection(db, "items"),
            where("categoryId", "==", categoryId)
        );

        const snapshot = await getDocs(itemsQuery);

        if (snapshot.size < size) {
            message.textContent =
                `This category has only ${snapshot.size} items. You need ${size}.`;
            return;
        }

        const items = snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data()
        }));

        const selectedItems = shuffleItems(items).slice(0, size);

        console.log("Selected items:", selectedItems);

        message.textContent = "Saving challenge...";

        const challengeId = await saveChallenge(
            categoryId,
            size,
            selectedItems,
            loggedInUser.uid
        );
        created = true;

        message.textContent = "Challenge created successfully!";

        window.location.href =
            `/pages/bracket.html?challenge=${encodeURIComponent(challengeId)}`;

    } catch (error) {
        console.error("Error starting challenge:", error);

        message.textContent =
            "Failed to start challenge. Please try again.";

    } } finally {
            if (!created) {
                startBtn.disabled = false;
                startBtn.textContent = "Start Challenge";
            }
});

categorySelect.addEventListener("change", updateItemCount);

sizeOptions.forEach((option) => {
    option.addEventListener("change", updateItemCount);
});

loadCategories();
