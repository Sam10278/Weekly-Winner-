# auth.js — How It Works

## What is auth.js?

`auth.js` handles login and logout. It also decides what the navbar shows:

- Logged out: a **Login** link.
- Logged in: the user's **photo**, **name**, and a **Logout** button.

It uses Firebase Authentication with Google sign-in.

## The files that work together

| File | Job |
|---|---|
| `frontend/js/app.js` | Starts Firebase one time and exports `app`, `auth`, `db`, `storage` |
| `frontend/js/auth.js` | Login, logout, and the navbar profile |
| `frontend/pages/login.html` | Has the "Sign in with Google" button |
| `frontend/index.html` | Has the navbar with the Login link, Logout button, and profile |

The chain:

```
page loads /js/auth.js -> auth.js imports ./app.js -> app.js starts Firebase
```

---

## Section 1 — Imports

```javascript
import { auth } from "./app.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
```

- `import` — brings in tools so we can use them.
- `auth` from `./app.js` — the Firebase login service, already started in `app.js`. `./` means "the same folder as this file".
- `GoogleAuthProvider` — tells Firebase we want Google login.
- `signInWithPopup` — opens the Google login popup window.
- `signOut` — logs the user out.
- `onAuthStateChanged` — watches if someone logs in or out.
- Every Firebase import uses version `10.0.0`. Mixed versions cause strange errors.

`auth.js` does not start Firebase itself any more. If every file started Firebase, it would start more than once.

---

## Section 2 — Firebase config (now in app.js)

The config is in `frontend/js/app.js`, not in `auth.js`:

```javascript
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

- The config tells Firebase which project to connect to.
- These values are **not passwords**. Anyone can see them in the browser. Our data is protected by Firebase Authentication and Firestore security rules.
- `export` lets other files use `auth`, `db`, and `storage`.

---

## Section 3 — The Google provider

```javascript
const provider = new GoogleAuthProvider();
```

- Creates a provider object that says "log in with Google".
- Firebase has other providers too, like GitHub. To change the login company, you change this one line.
- Optional: `provider.setCustomParameters({ prompt: "select_account" })` always shows the account list. This helps when people share a computer.

---

## Section 4 — Login function

```javascript
export function login() {
  signInWithPopup(auth, provider)
    .then(() => {
      window.location.href = "/index.html";
    })
    .catch(() => {
      const err = document.getElementById("login-error");
      if (err) err.textContent = "Login failed. Try again.";
    });
}
```

- `export function login()` — makes a function that other files can use.
- `signInWithPopup(auth, provider)` — opens the Google popup. `auth` is the Firebase connection, and `provider` is "use Google".
- `.then()` — runs when the login works. It sends the user to the home page.
- `/index.html` starts with `/`, so it always means the home page at the root of the site.
- `.catch()` — runs when the login fails, or when the user closes the popup.
- `if (err)` — the error message paragraph only exists on the login page. This check stops an error on other pages.
- `textContent` — sets plain text. It is safe because the browser does not run it as HTML.

### How the login button calls it

In `login.html`:

```html
<script type="module">
  import { login } from "/js/auth.js";
  document.getElementById("google-login-btn").addEventListener("click", login);
</script>
```

- When the button with `id="google-login-btn"` is clicked, `login` runs.
- Importing `auth.js` also runs the rest of its code on the login page. That is fine, because the login page has no navbar, so the navbar code finds nothing and does nothing.

---

## Section 5 — Logout function

```javascript
export function logout() {
  signOut(auth).then(() => {
    window.location.href = "/index.html";
  });
}
```

- `signOut(auth)` — logs the user out of Firebase.
- `.then()` — after logout, the user goes to the home page. The home page is public, so they do not get sent to the login page.

---

## Section 6 — Finding the navbar elements

```javascript
const loginLink = document.getElementById("login-link");
const logoutBtn = document.getElementById("logout-btn");
const userProfile = document.getElementById("user-profile");
const userAvatar = document.getElementById("user-avatar");
const userName = document.getElementById("user-name");

if (logoutBtn) logoutBtn.addEventListener("click", logout);
```

| id | Where it lives | What it is |
|---|---|---|
| `login-link` | navbar in `index.html` | The Login link |
| `logout-btn` | navbar in `index.html` | The Logout button |
| `user-profile` | navbar in `index.html` | The box around the photo and the name |
| `user-avatar` | inside `user-profile` | Where the photo (or a letter) goes |
| `user-name` | inside `user-profile` | Where the name goes |

- `document.getElementById(...)` searches the page for an element with that `id`. It gives the element, or `null` if the page does not have it.
- `auth.js` runs on many pages, and not every page has a navbar. That is why every line below checks `if (...)` first.
- The Logout click handler is added **one time**, outside the listener. If it was inside, every login change would add another handler, and Logout would run more than once.
- If a page copies the navbar but loses these ids, nothing switches.

---

## Section 7 — Auth state listener

```javascript
onAuthStateChanged(auth, (user) => {
  if (loginLink) loginLink.hidden = !!user;
  if (logoutBtn) logoutBtn.hidden = !user;
  if (userProfile) userProfile.hidden = !user;

  if (user && userName && userAvatar) {
    userName.textContent = user.displayName || user.email || "";

    userAvatar.replaceChildren();
    if (user.photoURL) {
      const img = document.createElement("img");
      img.src = user.photoURL;
      img.alt = "";
      img.referrerPolicy = "no-referrer";
      userAvatar.append(img);
    } else {
      userAvatar.textContent = (user.displayName || "?").charAt(0).toUpperCase();
    }
  }
});
```

Line by line:

- `onAuthStateChanged(auth, (user) => { ... })` — runs when the page loads and Firebase finishes checking, and again every time someone logs in or out. `user` holds the logged-in person's info. If nobody is logged in, `user` is `null`.
- `loginLink.hidden = !!user` — hides the Login link when someone is logged in.
  - `!user` is `true` when `user` is `null`.
  - `!!user` flips it again, so it is `true` when someone is logged in.
- `logoutBtn.hidden = !user` — hides the Logout button when nobody is logged in.
- `userProfile.hidden = !user` — hides the photo and name box when nobody is logged in.
- `if (user && userName && userAvatar)` — only fill in the profile when someone is logged in **and** the page has those elements. This stops an error on pages with no navbar, like the login page.
- `user.displayName || user.email || ""` — `||` means "or". It uses the name if there is one, then the email, then empty text.
- `userAvatar.replaceChildren()` — clears the old photo first, so the photo does not appear twice when the listener runs again.
- `if (user.photoURL)` — if the user has a photo, make an `img` with that address.
  - `img.referrerPolicy = "no-referrer"` — Google profile photos can fail to load without this.
  - `img.alt = ""` — the name is already next to it, so the photo needs no extra text.
- `else` — if there is no photo, show a circle with the first letter of the name.
  - `charAt(0)` takes the first letter, and `toUpperCase()` makes it a capital.
  - If there is no name either, it shows `?`.
- `textContent` is used for the name, so a name can never run as HTML.

What the user sees:

| State | Login link | Photo and name | Logout button |
|---|---|---|---|
| Logged out | shown | hidden | hidden |
| Logged in | hidden | shown | shown |

---

## Section 8 — What the CSS does (navbar.css)

| Rule | Job |
|---|---|
| `.navbar-user` as `flex` | Puts the photo, name, and Logout in one row |
| `#user-avatar` (32px, `border-radius: 50%`, `overflow: hidden`) | Makes the photo small and round |
| `#user-avatar img` (`object-fit: cover`) | Stops the photo from stretching |
| `.navbar-profile[hidden] { display: none; }` | Needed. A `display: flex` rule would override `hidden` and show the profile when logged out |

---

## What user info Firebase gives you after login

| Field | What it contains |
|---|---|
| `user.displayName` | Their full name (can be `null`) |
| `user.email` | Their email address |
| `user.photoURL` | Their profile picture address (can be `null`) |
| `user.uid` | Their unique ID in Firebase |

Use `user.uid` when saving data, for example `createdBy` on a category.


---

---

## Security note

Hiding a button only changes what people see. A person can still open the browser tools and call things directly. The real protection is the **Firestore security rules**, which check `request.auth` on the server.