const { onSchedule } = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");
const { initializeApp } = require("firebase-admin/app");

// Start the Admin SDK ONE time, here, before anything else uses it.
// Calling initializeApp() a second time crashes with “The default Firebase app already exists”.
initializeApp();

// TEST ONLY: runs every day at 03:00 Chicago time and writes one log line.
// We deploy it to check that Cloud Scheduler works, then delete it.
exports.testSchedule = onSchedule(
  { schedule: "0 3 * * *", timeZone: "America/Chicago" },
  async (event) => {
    logger.info("testSchedule ran", { scheduledTime: event.scheduleTime });
  }
);