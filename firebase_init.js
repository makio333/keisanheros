import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  projectId: "treegames-ac5db",
  appId: "1:538793714749:web:8cea9794c8b65f8a9d7654",
  storageBucket: "treegames-ac5db.firebasestorage.app",
  apiKey: "AIzaSyDu5F9Dlw4x7E1cDg2K41_mEzaEa0QGW6Q",
  authDomain: "treegames-ac5db.firebaseapp.com",
  messagingSenderId: "538793714749",
  measurementId: "G-T5X3X57WJJ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

window._firestoreDb = db;

signInAnonymously(auth).then((userCredential) => {
    window._firebaseUid = userCredential.user.uid;
    console.log("Firebase Auth Signed In", window._firebaseUid);
}).catch((error) => {
    console.error("Anonymous auth failed:", error);
});
