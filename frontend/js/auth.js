import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCezCaH1q6L_SYuTpG9wHZSy_aKLSVuFpE",
  authDomain: "project-cf1e9443-caf0-460e-9ef.firebaseapp.com",
  projectId: "project-cf1e9443-caf0-460e-9ef",
  storageBucket: "project-cf1e9443-caf0-460e-9ef.firebasestorage.app",
  messagingSenderId: "330853835451",
  appId: "1:330853835451:web:425e4b3fa63da4aa3b3f9e"
};

// initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// sign in with Google
export function login() {
  signInWithPopup(auth, provider)
    .then((result) => {
      window.location.href = "/index.html";
    })
    .catch((error) => {
      document.getElementById("login-error").textContent = "Login failed. Please try again.";
    });
}

// sign out
export function logout() {
  signOut(auth).then(() => {
    window.location.href = "/pages/login.html";
  });
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Logged in as:", user.displayName);
    const loginLink = document.getElementById("login-link");
    const logoutBtn = document.getElementById("logout-btn");
    if (loginLink) loginLink.style.display = "none";
    if (logoutBtn) {
      logoutBtn.style.display = "block";
      logoutBtn.addEventListener("click", logout);
    }
  } else {
    const currentPage = window.location.pathname;
    if (!currentPage.includes("login.html")) {
      window.location.href = "/pages/login.html";
    }
  }
});