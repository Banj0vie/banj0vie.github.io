import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // For your database
import { getAuth, GoogleAuthProvider } from "firebase/auth"; // For player logins

const firebaseConfig = {
  apiKey: "AIzaSyD-xc6A1fjzTcOJ2z2vdxH7nsxG7QFtw3c",
  authDomain: "hvalleys-937e2.firebaseapp.com",
  projectId: "hvalleys-937e2",
  storageBucket: "hvalleys-937e2.firebasestorage.app",
  messagingSenderId: "536630167928",
  appId: "1:536630167928:web:a3c2831e778b40b781208d",
  measurementId: "G-5HCYB32DHC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the tools so you can use them in your game files
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();