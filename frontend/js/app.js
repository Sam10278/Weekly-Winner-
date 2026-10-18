
import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";

import {
    getFirestore,
    connectFirestoreEmulator
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

import {
    getStorage
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-storage.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCezCaH1q6L_SYuTpG9wHZSy_aKLSVuFpE",
    authDomain: "project-cf1e9443-caf0-460e-9ef.firebaseapp.com",
    projectId: "project-cf1e9443-caf0-460e-9ef",
    storageBucket: "project-cf1e9443-caf0-460e-9ef.firebasestorage.app",
    messagingSenderId: "330853835451",
    appId: "1:330853835451:web:425e4b3fa63da4aa3b3f9e"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Connect to local Firestore Emulator
// Only when testing on your computer
if (
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost"
) {
    connectFirestoreEmulator(db, "127.0.0.1", 8080);

    console.log("Connected to local Firestore Emulator");
}
