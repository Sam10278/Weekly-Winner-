# auth.js — How It Works

## What is auth.js?
This file handles everything related to login and logout in our app.
It uses Firebase Authentication with Google sign-in.

---

## Section 1 — Imports

```javascript
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
```

- `import` — brings in tools from Firebase so we can use them
- `initializeApp` — starts up Firebase in our app
- `getAuth` — gets the authentication service
- `GoogleAuthProvider` — tells Firebase we want to use Google login
- `signInWithPopup` — opens a Google login popup window
- `signOut` — logs the user out
- `onAuthStateChanged` — watches if someone logs in or out

---

## Section 2 — Firebase Config

```javascript
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

- This is like a key that connects your code to your Firebase project
- Without this Firebase does not know which project to talk to
- Never share this publicly

---

## Section 3 — Initialize Firebase

```javascript
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
```

- `initializeApp(firebaseConfig)` — starts Firebase using your config
- `getAuth(app)` — gets the login and logout service from Firebase
- `new GoogleAuthProvider()` — creates a Google login provider object

---

## Section 4 — Login function

```javascript
export function login() {
  signInWithPopup(auth, provider)
    .then((result) => {
      window.location.href = "index.html";
    })
    .catch((error) => {
      document.getElementById("login-error").textContent = "Login failed. Please try again.";
    });
}
```

- `export function login()` — creates a function called login that other files can use
- `signInWithPopup(auth, provider)` — opens the Google login popup
- `.then()` — runs when login is successful, redirects to home page
- `.catch()` — runs when login fails, shows error message
- `window.location.href` — redirects the browser to another page

---

## Section 5 — Logout function

```javascript
export function logout() {
  signOut(auth).then(() => {
    window.location.href = "../pages/login.html";
  });
}
```

- `signOut(auth)` — logs the user out of Firebase
- `.then()` — after logout redirects to login page

---

## Section 6 — Auth state listener

```javascript
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Logged in as:", user.displayName);
  } else {
    const currentPage = window.location.pathname;
    if (!currentPage.includes("login.html")) {
      window.location.href = "login.html";
    }
  }
});
```

- `onAuthStateChanged` — runs every time the login state changes
- `user` — the logged in user info. If nobody is logged in it is null
- `if (user)` — if someone is logged in, print their name
- `else` — if nobody is logged in, redirect to login page
- `currentPage.includes("login.html")` — checks if we are already on the login page to avoid an infinite redirect loop

---

## What user info Firebase gives you after login

| Field | What it contains |
|---|---|
| `user.displayName` | Their full name |
| `user.email` | Their email address |
| `user.photoURL` | Their profile picture URL |
| `user.uid` | Their unique ID in Firebase ||