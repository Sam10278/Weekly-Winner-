# Auto-Start: startChallenge.js and index.js

Every Monday at 9:00 AM (Chicago time), a function starts a new challenge. 

## The files

| File | Job |
|---|---|
| `backend/functions/index.js` | Starts the Admin SDK. Defines the scheduled function |
| `backend/functions/startChallenge.js` | Helper functions: pick, build, save |

The flow:

```
Cloud Scheduler (Monday 9:00) -> startChallenge function (index.js)
  -> pickCategory -> saveChallenge -> logs the result
```

## What the function does

1. Picks a size, 8 or 16, at random
2. Finds a category that is **not closed** (meaning we did not have a challenge on it before) and has enough items
3. If none fits, tries the other size
4. If still none, logs a warning and stops
5. Saves the challenge, all its matchups, and marks the category closed. All in one "batch"
6. Logs what happened

---

# Part 1: startChallenge.js

## The import (top of the file)

```javascript
const { FieldValue, Timestamp } = require("firebase-admin/firestore");
```

- This is the **Admin SDK**, not the browser SDK
- `FieldValue.serverTimestamp()` makes the server write the time
- `Timestamp` makes a Firestore time value
- This file does not start Firebase. `index.js` does that once

## shuffle(list)

Mixes a list fairly (Fisher-Yates). Returns a new list.

- It copies the list, so the original stays as it was
- The loop goes from the last item to the second one
- Each step swaps the item with a random earlier one
- Same method we used in the browser version

## chicagoDate()

Returns today's date in Chicago, like `2026-11-02`.

- `Intl.DateTimeFormat` with `timeZone: "America/Chicago"` gets the Chicago date
- `formatToParts` gives year, month, and day as separate pieces
- We join them with `-`. The result is always `YYYY-MM-DD`
- It is the **challenge id**
- Slashes are not allowed in a Firestore id, so the dash format matters

## buildMatchups(challengeId, size, items)

Makes every matchup as a plain object. It saves nothing.

- `totalRounds` is `Math.log2(size)`: 3 for 8, 4 for 16
- Round `r` has `size / 2 ** r` matchups
- Round 1 gets items in pairs: matchup 0 gets items 0 and 1, matchup 1 gets items 2 and 3
- Later rounds have `itemA` and `itemB` as `null`, because winners are not known yet
- Every matchup starts with `votesA: 0`, `votesB: 0`, `lastVoteAtA: null`, `lastVoteAtB: null`, and `winnerId: null`
- A challenge has `size - 1` matchups: 7 or 15

## pickCategory(db)

Chooses the size, the category, and the items.

- `db` is the database. It is passed in
- The sizes are shuffled: `[8, 16]` in random order
- It reads all categories. It keeps those where `closed` is **not** `true`. A missing field counts as open
- It reads each open category's items one time
- For each size, in order: keep the categories that have at least `size` items
- If some fit, it picks one at random and takes `size` random items
- Items are saved as `{ id, name, imageUrl }`. A missing name or picture becomes `""`, because Firestore does not accept `undefined`
- It returns `{ size, category: { id, name }, items }`
- It returns `null` if nothing fits at either size

## saveChallenge(db, picked, challengeId)

Saves everything in **one batch**. All of it is saved, or none of it.

- `db.batch()` collects the writes. `batch.commit()` sends them together
- The challenge gets `categoryId`, `categoryName`, `bracketSize`, `status: "open"`, `currentRound: 1`, `roundEndsAt`, `createdBy: "system"`, and `createdAt`
- `roundEndsAt` is now plus 24 hours
- Each matchup gets a new random id
- The category gets `closed: true` and `usedInChallengeId`
- `batch.create` fails if the document already exists. The id is the date, so a second run on the same day cannot make a second challenge
- A batch holds up to 500 writes. Ours has 9 or 17

Why the category is closed:
- The Categories page hides closed categories, so nobody adds items while the challenge runs
- The picker skips them, so the same category is never used twice

## module.exports

```javascript
module.exports = { shuffle, chicagoDate, buildMatchups, pickCategory, saveChallenge };
```

- It shares the functions with `index.js`

---

# Part 2: index.js

```javascript
const { onSchedule } = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();

const { pickCategory, saveChallenge, chicagoDate } = require("./startChallenge");
```

- **Line 1:** `onSchedule` makes a function that Cloud Scheduler starts. It is the v2 style
- **Line 2:** `logger` writes lines you can read in the logs
- **Lines 3 and 4:** the Admin SDK start, and the database
- **`initializeApp()`:** called **one time**, here. Calling it again crashes with "The default Firebase app already exists"
- **The last `require`:** it goes **below** `initializeApp()`. The helper file never calls `initializeApp`

```javascript
exports.startChallenge = onSchedule(
  { schedule: "0 9 * * 1", timeZone: "America/Chicago", timeoutSeconds: 120 },
  async () => { ... }
);
```

- `exports.startChallenge` is the function's name in Firebase
- `"0 9 * * 1"` is a cron time: minute 0, hour 9, any day, any month, Monday
- `timeZone` makes 9:00 mean Chicago time
- `timeoutSeconds: 120` gives it 2 minutes. It reads many documents

Inside the function:

- `const db = getFirestore()` gets the database. It is called **inside** the function, not at the top of the file
- `pickCategory(db)` chooses what to use
- `null` means nothing fits. The function logs a warning and stops
- `chicagoDate()` makes the id
- `saveChallenge` runs in a `try`. If it fails, it logs the error, then `throw error` marks the run as failed
- On success, it logs `Challenge started` with the id, the category, and the size

---



# Costs and limits

- Runs once a week. Cost is about $0
- It uses 1 of our 3 free Cloud Scheduler jobs. The rounds function will be the 2nd



## Words to know

| Word | Meaning |
|---|---|
| Cron | A short way to write a schedule: `0 9 * * 1` |
| Batch | Many writes saved together. All succeed, or none does |
| Admin SDK | The server tool. It skips the security rules |
| Idempotent | Safe to run twice. A second run changes nothing |
| Force run | A button in Cloud Scheduler that starts the job now |