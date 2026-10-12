# Firebase SDK — How It Works

## What is the Firebase SDK?

The Firebase SDK (Software Development Kit) is a set of tools that lets
our frontend talk to Firebase services. For Every Week a Winner,
`frontend/js/app.js` starts Firebase one time and shares the services
with every other file.

## Section 1 — Firebase Configuration

**File:** `frontend/js/app.js`

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

- `apiKey` — identifies the Firebase project for API requests
- `authDomain` — the domain used for sign-in
- `projectId` — the Firebase project ID
- `storageBucket` — the Cloud Storage bucket
- `messagingSenderId` — used by Firebase messaging
- `appId` — the registered web app

The values come from Firebase Console → Project Settings → Your apps.

**Note:** these values are not secrets. Data is protected by
Firebase Authentication and Firestore security rules.

## Section 2 — Initialize Firebase and export services

```javascript
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-storage.js";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

- `initializeApp` connects our code to our Firebase project.
- `getAuth` gives access to login and logout.
- `getFirestore` gives access to the database.
- `getStorage` gives access to image uploads.
- `export` lets other files use these objects.
- A module runs only one time, so Firebase starts only one time.
- All imports use version 10.0.0. Mixed versions cause errors.

## Section 3 — What each service is for

| Service | Used for |
|---|---|
| `auth` | Google sign-in, sign-out, who is logged in |
| `db` | Categories, items, challenges, matchups, votes |
| `storage` | Item images |

Creating `db` does not create any collections. Firestore creates a
collection the first time we save a document in it.

## Section 4 — How other files use it

```javascript
import { auth, db, storage } from "./app.js";
```

Nobody should paste the Firebase config into another file.

**Current chain:**

`index.html` loads `/js/auth.js` → `auth.js` imports `app.js` → `app.js` starts Firebase

The script tag uses `type="module"`. Without it, the browser
rejects `import` with "Cannot use import statement outside a module".

## Section 5 — Testing

Write only what you ran.

1. Run `firebase deploy`, or use `firebase emulators:start --only hosting`.
2. Open the home page and press Ctrl + Shift + R.
3. Open the Console tab. There should be no red errors.
4. Log in with Google. Login should still work.
5. Log out. You should return to the home page.

## Section 6 — GitHub workflow

**Branch:** `week1/firebase-config`

**Pull Request:** #6 — Week 1: Configure Firebase SDK and initialize services


## Contribution

Developer: Sujit Lopchan (10/8/2026)