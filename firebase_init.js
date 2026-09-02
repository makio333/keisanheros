import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  projectId: "game-86071",
  appId: "1:1442050997:web:f98b8a32805d17bce51ffc",
  databaseURL: "https://game-86071-default-rtdb.asia-southeast1.firebasedatabase.app",
  storageBucket: "game-86071.firebasestorage.app",
  apiKey: "AIzaSyCRJ9rTd3Ss3QxczGc1R0rwUJXccGSLMco",
  authDomain: "game-86071.firebaseapp.com",
  messagingSenderId: "1442050997",
  measurementId: "G-K87FND49Q0"
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
