# Cloud Functions Are Ready

This file explains the rules for writing our backend functions. 

---

## The short version

- **Functions are ready.** We can write backend code now.
- Write every function in the **v2 style**.
- Call `initializeApp()` **one time only**, in `index.js`.


---

## 1. Two helpers: the client SDK and the Admin SDK

Think of a restaurant.

- The **client SDK** is the **customer**.
- The **Admin SDK** is the **chef** in the back kitchen.

| | Client SDK (the customer) | Admin SDK (the chef) |
|---|---|---|
| Where it lives | In `frontend/` | In `backend/` |
| Where it runs | In the user's browser | On Google's computers |
| How we load it | From a web link (`https://www.gstatic.com/firebasejs/10.0.0/...`) | With `npm install firebase-admin` |
| Who it acts as | The logged-in user | The project itself |
| Security rules | **Apply.** The guard checks every request | **Do not apply.** The chef walks into the kitchen |
| Used by | `app.js`, `auth.js`, `categories.js`, `bracket.js` | Our Cloud Functions |

What this means:

- The browser is **not trusted**. Anyone can open the browser tools and change our JavaScript.
- Our rules stop the browser from writing challenges, matchups, and votes.
- A function **can** write them, because the Admin SDK skips the rules.(THIS IS why we need it as our backend, previously we were only using client sdk for the live website which is not the proper way to write a live website)
- Our function code must check everything itself.

**One big rule:** never put the Admin SDK in `frontend/`. It has too much power.

Both SDKs have a function named `initializeApp`. They are **two different things**. One starts the browser helper (in `app.js`). One starts the server helper (in `index.js`). They do not touch each other.

---

## 2. Write functions in the v2 style

Firebase has two generations of functions. We only use the new one, **v2**.

**Old (v1). Do not use:**

```javascript
const functions = require("firebase-functions");
exports.helloWorld = functions.https.onRequest(...);
```

**New (v2). Use this:**

```javascript
const { onSchedule } = require("firebase-functions/v2/scheduler");
exports.myJob = onSchedule({ schedule: "0 9 * * 1" }, async () => { ... });
```

How to tell v2 apart: the import has `/v2/` in it.

| Job | v2 import |
|---|---|
| A function that runs on a timer | `require("firebase-functions/v2/scheduler")` → `onSchedule` |
| A function the website calls (voting) | `require("firebase-functions/v2/https")` → `onCall` |
| Writing a log line | `require("firebase-functions/logger")` |

- Do not mix v1 and v2. It is confusing.
- A v2 function runs in the `us-central1` region by default.

---

## 3. Call `initializeApp()` one time only (This is completed by Maygoal IN PR #15)

- `initializeApp()` starts the Admin SDK.
- It is already in `backend/functions/index.js`. It must stay there.
- If another file calls it again, the function crashes with `The default Firebase app already exists`.

**In other files, do this:**

```javascript
const { getFirestore } = require("firebase-admin/firestore");

exports.something = onSchedule(..., async () => {
  const db = getFirestore();   // get the database INSIDE the function
});
```

- Call `getFirestore()` **inside** your function, not at the top of the file.
- Never write `initializeApp()` in `startChallenge.js`, `rounds.js`, or `vote.js`.
- In `index.js`, the `require("./yourFile")` lines go **below** `initializeApp()`.

---

## 4. Deploy one function at a time

```
firebase deploy --only functions:castVote
```

- `--only functions:NAME` sends just that one function.
- Plain `firebase deploy` now sends **everything** (the website, the rules, and the functions), because `firebase.json` lists all of them. Don't use it by accident.
- **If the deploy asks to delete a function, answer NO.** Your branch may not have a function that a teammate already deployed. Saying yes deletes their work.
- Only deploy the **final** versions, from `main`, after the code is merged.
- Please do not deploy ANYTHING EVEN FOR TESTING



---

## 5. The permission fix is done

- A Cloud Function needs a worker account to build it. Ours is the **default compute service account**.
- That account was missing a role (**Logs Writer**, and the Cloud Build role), so the first deploy failed.
- We fixed it **once** for the whole project. Nobody has to do it again.
- If a teammate sees "missing permission on the build service account", tell the group

---

## 6. Cloud Scheduler jobs

- A scheduled function makes a **Cloud Scheduler job** by itself when you deploy it.
- The free limit is **3 jobs at once** (per billing account).
- Our plan uses 2: `startChallenge` and `rounds`. One slot is free.
- Deleting a function deletes its job, and the slot comes back.
- Do not leave test functions deployed.

---

## 7. Costs

- Our functions are small. We expect **$0**.
- Every deploy saves a copy of the function (a container image). An **image cleanup rule** is set to delete copies older than 1 day.
- Check **Billing → Reports** every few days. It should say $0.
- Cloud Functions need the Blaze plan. We have it, with the free trial credit.

---

## 8. A checklist before you deploy

- [ ] I am in the project folder (the one with `firebase.json`)
- [ ] My function uses the v2 style
- [ ] My file does not call `initializeApp()`
- [ ] `node --check backend/functions/index.js` prints nothing
- [ ] I told the team in chat

---

## Words to know

| Word | Meaning |
|---|---|
| SDK | A kit of tools for talking to a service |
| Client SDK | The kit the browser uses. Follows the rules |
| Admin SDK | The kit the server uses. Skips the rules |
| Cloud Function | Our own code that runs on Google's computers |
| v2 | The new style of Cloud Functions. We use only this |
| Cloud Scheduler | The alarm clock that starts a function at set times |
| Deploy | Sending code to Google |