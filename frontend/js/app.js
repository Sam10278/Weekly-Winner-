
/**
 * Every Week a Winner
 * Firebase Configuration
 *
 * Initializes Firebase Authentication and Firestore.
 * Shared configuration for frontend pages.
 */

// Replace these placeholders with the actual values
// from Firebase Console > Project Settings > Config.

const firebaseConfig = {
  apiKey: "AIzaSyCezCaH1q6L_SYuTpG9wHZSy_aKLSVuFpE",
  authDomain: "project-cf1e9443-caf0-460e-9ef.firebaseapp.com",
  projectId: "project-cf1e9443-caf0-460e-9ef",
  storageBucket: "project-cf1e9443-caf0-460e-9ef.firebasestorage.app",
  messagingSenderId: "330853835451",
  appId: "1:330853835451:web:425e4b3fa63da4aa3b3f9e"
};

// Initialize Firebase only once
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Shared Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

console.log("Firebase initialized successfully!");
