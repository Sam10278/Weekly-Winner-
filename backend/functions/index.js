const { onSchedule } = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");
const { initializeApp } = require("firebase-admin/app");

// Start the Admin SDK ONE time, here, before anything else uses it.
// Calling initializeApp() a second time crashes with “The default Firebase app already exists”.
initializeApp();

