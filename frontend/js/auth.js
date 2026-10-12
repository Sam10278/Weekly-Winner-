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

onAuthStateChanged(auth, (user) => {
  if (loginLink) loginLink.style.display = user ? "none" : "inline";
  if (logoutBtn) logoutBtn.style.display = user ? "inline" : "none";
});