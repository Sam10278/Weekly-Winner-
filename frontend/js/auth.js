
import { auth } from "./app.js";

import {
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";

const provider = new GoogleAuthProvider();

// Google login
export async function login() {
    try {
        await signInWithPopup(auth, provider);
        window.location.href = "/index.html";
    } catch (error) {
        console.error("Login failed:", error);

        const message = document.getElementById("login-error");
        if (message) {
            message.textContent = "Login failed. Try again.";
        }
    }
}

// Logout
export async function logout() {
    try {
        await signOut(auth);
        window.location.href = "/index.html";
    } catch (error) {
        console.error("Logout failed:", error);
    }
}

// Navbar elements
const loginLink = document.getElementById("login-link");
const userProfile = document.getElementById("user-profile");
const userAvatar = document.getElementById("user-avatar");
const userName = document.getElementById("user-name");
const logoutBtn = document.getElementById("logout-btn");
const profileButton = document.getElementById("profile-button");
const profileDropdown = document.getElementById("profile-dropdown");

// Show or hide the profile menu
function closeProfileMenu() {
    if (profileDropdown) {
        profileDropdown.hidden = true;
    }

    if (profileButton) {
        profileButton.setAttribute("aria-expanded", "false");
    }
}

if (profileButton && profileDropdown) {
    profileButton.addEventListener("click", () => {
        const isOpen = !profileDropdown.hidden;

        profileDropdown.hidden = isOpen;
        profileButton.setAttribute(
            "aria-expanded",
            String(!isOpen)
        );
    });

    document.addEventListener("click", (event) => {
        if (userProfile && !userProfile.contains(event.target)) {
            closeProfileMenu();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeProfileMenu();
        }
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
}

// Update navbar when login changes
onAuthStateChanged(auth, (user) => {
    if (loginLink) loginLink.hidden = !!user;
    if (userProfile) userProfile.hidden = !user;

    closeProfileMenu();

    if (!user) return;

    if (userName) {
        userName.textContent =
            user.displayName || user.email || "User";
    }

    if (userAvatar) {
        userAvatar.replaceChildren();

        if (user.photoURL) {
            const image = document.createElement("img");
            image.src = user.photoURL;
            image.alt = "";
            image.referrerPolicy = "no-referrer";

            userAvatar.appendChild(image);
        } else {
            userAvatar.textContent =
                (user.displayName || user.email || "?")
                .charAt(0)
                .toUpperCase();
        }
    }
});
