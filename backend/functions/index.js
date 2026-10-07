const functions = require("firebase-functions");
const admin = require("firebase-admin");

// initialize Firebase Admin
admin.initializeApp();

// test function - just to make sure everything works
exports.helloWorld = functions.https.onRequest((request, response) => {
  response.send("Weekly Winner backend is running!");
});