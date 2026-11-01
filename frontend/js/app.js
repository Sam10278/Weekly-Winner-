
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import {
  getAuth,
  connectAuthEmulator
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import {
  getFirestore,
  connectFirestoreEmulator
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-storage.js";
import {
  getFunctions,
  connectFunctionsEmulator
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-functions.js";

const firebaseConfig = {
  apiKey: "AIzaSyCezCaH1q6L_SYuTpG9wHZSy_aKLSVuFpE",
  authDomain: "project-cf1e9443-caf0-460e-9ef.firebaseapp.com",
  projectId: "project-cf1e9443-caf0-460e-9ef",
  storageBucket: "project-cf1e9443-caf0-460e-9ef.firebasestorage.app",
  messagingSenderId: "330853835451",
  appId: "1:330853835451:web:425e4b3fa63da4aa3b3f9e"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, "us-central1");

// Connect to local emulators only when running locally.
if (
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname === "localhost"
) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099");
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);

  console.log("Connected to local Firebase emulators");
}


