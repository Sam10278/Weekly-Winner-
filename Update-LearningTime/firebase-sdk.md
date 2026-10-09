# Firebase SDK — How It Works

## What is Firebase SDK?

Firebase SDK (Software Development Kit) provides tools that allow our frontend application to communicate with Firebase services.

For the **Every Week a Winner** project, I configured Firebase to initialize the application and provide shared access to Firebase Authentication and Cloud Firestore.

## Section 1 — Firebase Configuration

**File:** `frontend/js/app.js`

Firebase requires a configuration object to connect the frontend to the correct Firebase project.

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

### Explanation

- `apiKey` — Identifies the Firebase project for API requests.
- `authDomain` — Specifies the authentication domain.
- `projectId` — Identifies the Firebase project.
- `storageBucket` — Specifies the Cloud Storage bucket.
- `messagingSenderId` — Identifies the project for Firebase messaging.
- `appId` — Identifies the registered Firebase web application.

These values are obtained from Firebase Console → Project Settings → General → Your Apps.

**Note:** Firebase web configuration values are not authentication secrets. Access to protected data must be controlled using Firebase Authentication and appropriate security rules.

## Section 2 — Initialize Firebase

Firebase must be initialized before using its services.

```javascript
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
```

### Explanation

- `firebase.apps.length` checks whether Firebase has already been initialized.
- `firebase.initializeApp()` initializes Firebase using the configuration.
- The condition prevents duplicate initialization of the default Firebase app.

## Section 3 — Firebase Authentication

```javascript
const auth = firebase.auth();
```

### Explanation

Firebase Authentication manages user identity.

It can support features such as:

- Google sign-in
- User login and logout
- Authentication state monitoring
- Protected application features

The shared `auth` object allows other frontend scripts to interact with Firebase Authentication.

## Section 4 — Cloud Firestore

```javascript
const db = firebase.firestore();
```

### Explanation

Cloud Firestore is a NoSQL cloud database.

For our Every Week a Winner project, it can be used to store:

- User profiles
- Tournament categories
- Bracket information
- Voting results
- Leaderboard data

The `db` object provides a shared reference to Firestore.

Creating this reference does not automatically create collections or implement database operations.

## Section 5 — Loading Firebase SDK Scripts

**File:** `frontend/pages/index.html`

The Firebase SDK scripts must load before `app.js`.

Example:

```html
<script defer src="/__/firebase/12.19.0/firebase-app-compat.js"></script>

<script defer src="/__/firebase/12.19.0/firebase-auth-compat.js"></script>

<script defer src="/__/firebase/12.19.0/firebase-firestore-compat.js"></script>

<script defer src="../js/app.js"></script>
```

### Why is the order important?

The Firebase libraries define the global `firebase` object.

If `app.js` executes before these libraries are loaded, the browser may report:

`ReferenceError: firebase is not defined`

The `defer` attribute allows scripts to download without blocking HTML parsing while preserving their execution order.

The `/__/firebase/` URLs are provided by Firebase Hosting environments. Other development servers may require a different SDK-loading approach.

## Section 6 — Testing Firebase Initialization

I tested the configuration using the Firebase CLI and local Hosting Emulator.

### Step 1 — Verify Firebase CLI

```powershell
firebase --version
```

Verified installed CLI version:

`15.33.0`

### Step 2 — Log in to Firebase

```powershell
firebase login
```

The browser confirmed successful Firebase CLI authentication.

### Step 3 — Start the Hosting Emulator

```powershell
firebase emulators:start --only hosting
```

The local Hosting Emulator started at:

`http://127.0.0.1:5000`

### Step 4 — Open the Application

I opened:

`http://127.0.0.1:5000/pages/index.html`

### Step 5 — Inspect Browser Console

The browser console displayed:

`Firebase initialized successfully!`

This confirmed that the Firebase initialization script executed successfully.

The browser also reported a missing favicon, which was unrelated to Firebase initialization.

## Section 7 — GitHub Workflow

I completed this task using a dedicated Git branch.

**Branch:** `week1/firebase-config`

**Commit:** `7f8561a`

**Pull Request:** #6 — Week 1: Configure Firebase SDK and initialize services

The pull request was submitted for team review before merging into the main branch.

## What I Learned

Through this task, I learned:

1. How Firebase web applications are configured.
2. How Firebase Authentication and Firestore are initialized.
3. Why JavaScript SDK loading order matters.
4. How to use Firebase CLI for local development.
5. How to verify initialization using browser developer tools.
6. How to submit Firebase changes through a GitHub pull request.

## Contribution

Developer: Sujit Lopchan(10/8/2026)