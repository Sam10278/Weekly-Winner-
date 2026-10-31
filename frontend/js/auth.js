import { auth } from "./app.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";

const provider = new GoogleAuthProvider();

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

export function logout() {
  signOut(auth).then(() => {
    window.location.href = "/index.html";
  });
}

const loginLink = document.getElementById("login-link");
const logoutBtn = document.getElementById("logout-btn");

if (logoutBtn) logoutBtn.addEventListener("click", logout);

const userProfile = document.getElementById("user-profile");
const userAvatar = document.getElementById("user-avatar");
const userName = document.getElementById("user-name");

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
      img.referrerPolicy = "no-referrer";   // Google photos can fail without this
      userAvatar.append(img);
    } else {
      userAvatar.textContent = (user.displayName || "?").charAt(0).toUpperCase();
    }
  }
});