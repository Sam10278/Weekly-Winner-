const { onSchedule } = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

// Start the Admin SDK ONE time, here, before anything else uses it.
// Calling initializeApp() a second time crashes with “The default Firebase app already exists”.
initializeApp();

// Our helper file goes BELOW initializeApp(). It never calls initializeApp itself.
const { pickCategory, saveChallenge, chicagoDate } = require("./startChallenge");

// Every Monday at 9:00 AM Chicago time: start a new challenge.
exports.startChallenge = onSchedule(
  { schedule: "0 9 * * 1", timeZone: "America/Chicago", timeoutSeconds: 120 },
  async () => {
    const db = getFirestore();
    // pick the category to start challenge on
    const picked = await pickCategory(db);

    if (picked === null) {
      logger.warn("No challenge started: no unused category has enough items.");
      return;
    }
    // challenge id its the date it starts
    const challengeId = chicagoDate();

    try {
      // save everything related to challenge in one batch(it also updates state as used)
      await saveChallenge(db, picked, challengeId);
    } catch (error) {
      logger.error("Could not save the challenge", {
        challengeId: challengeId,
        message: error.message
      });
      throw error;
    }

    logger.info("Challenge started", {
      challengeId: challengeId,
      category: picked.category.name,
      size: picked.size
    });
  }
);