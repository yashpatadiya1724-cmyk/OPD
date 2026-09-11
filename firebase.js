import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCFe8xhMFk-UWafaqaNKJIVxADkM8RrL34",
  authDomain: "smart-opd-queue-tracker.firebaseapp.com",
  projectId: "smart-opd-queue-tracker",
  storageBucket: "smart-opd-queue-tracker.firebasestorage.app",
  messagingSenderId: "489741916150",
  appId: "1:489741916150:web:969809047cf4bca9c8d9d7",
  measurementId: "G-9F3QR1DYXJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore & Auth
const db = getFirestore(app);
const auth = getAuth(app);

// Initialize Analytics (supported in browser environments)
let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, db, auth, analytics, firebaseConfig };
export default app;
