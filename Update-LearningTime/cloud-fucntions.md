# Cloud Functions Setup — How It Works

## What are Cloud Functions?
Cloud Functions are small pieces of backend code that run on Google's servers.
You write the code, Google runs it — you don't manage any servers yourself.

---

## When do they run?
They run when something triggers them:
- A user makes a request (HTTP trigger)
- A Firestore document changes (database trigger)
- A timer goes off (Cloud Scheduler trigger)

---

## What we set up

### package.json
This file tells Node.js what libraries our backend needs.
The two main ones we installed are:

| Library | What it does |
|---|---|
| `firebase-admin` | Lets our backend talk to Firestore, Auth, and Storage |
| `firebase-functions` | Lets us write and deploy Cloud Functions |

---

### index.js
This is the main entry point for all our Cloud Functions.
Every function we write will be exported from this file.

```javascript
const functions = require("firebase-functions");
const admin = require("firebase-admin");

// initialize Firebase Admin
admin.initializeApp();

// example function
exports.helloWorld = functions.https.onRequest((request, response) => {
  response.send("Weekly Winner backend is running!");
});
```

Breaking it down:
- `require` — imports the library so we can use it
- `admin.initializeApp()` — connects our backend to our Firebase project
- `exports.helloWorld` — creates a function called helloWorld
- `functions.https.onRequest` — means this function runs when someone makes an HTTP request to it
- `response.send` — sends a response back to whoever called the function

---

## What we will add later
- `bracket.js` — generates the bracket when a challenge starts
- `rounds.js` — advances winners to the next round when a matchup expires
- `scheduler.js` — runs automatically every 24 hours to close matchups

---

## How to deploy Cloud Functions
When ready run this in the terminal from the project root:
```
firebase deploy --only functions
```
This pushes your functions to Google Cloud so they run on the server.