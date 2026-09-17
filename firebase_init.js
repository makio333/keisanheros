import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDocs, collection } from "firebase/firestore";
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

// Helper to convert slotKey to a clean doc ID
function slotKeyToDocId(slotKey) {
  return encodeURIComponent(slotKey);
}

function docIdToSlotKey(docId, data) {
  if (data && data.slotKey) return data.slotKey;
  try {
    return decodeURIComponent(docId);
  } catch(e) {
    return docId;
  }
}

// Debounce map for writes
const pendingSaveTimers = new Map();
const pendingSaveData = new Map();

async function executeSave(slotKey, gameState) {
  try {
    const docId = slotKeyToDocId(slotKey);
    const docRef = doc(db, "saves", docId);
    const payload = {
      slotKey: slotKey,
      playerName: gameState.playerName || 'ぼうけんしゃ',
      lvl: (gameState.player && gameState.player.lvl) || 1,
      gold: (gameState.player && gameState.player.gold) || 0,
      updatedAt: gameState.updatedAt || Date.now(),
      gameData: JSON.stringify(gameState),
      deleted: false
    };
    await setDoc(docRef, payload, { merge: true });
    console.log("[CloudSave] Saved slot to Firestore:", slotKey);
    return true;
  } catch (err) {
    console.error("[CloudSave] Failed to save slot to Firestore:", err);
    return false;
  }
}

// Global CloudSave API
window.CloudSave = {
  saveSlot(slotKey, gameState, immediate = false) {
    if (!slotKey || !gameState) return Promise.resolve(false);

    // If immediate is requested, execute right away
    if (immediate) {
      if (pendingSaveTimers.has(slotKey)) {
        clearTimeout(pendingSaveTimers.get(slotKey));
        pendingSaveTimers.delete(slotKey);
      }
      pendingSaveData.delete(slotKey);
      return executeSave(slotKey, gameState);
    }

    // Debounce by 400ms to avoid burst writes during rapid actions
    pendingSaveData.set(slotKey, gameState);
    if (pendingSaveTimers.has(slotKey)) {
      clearTimeout(pendingSaveTimers.get(slotKey));
    }

    return new Promise((resolve) => {
      const timer = setTimeout(async () => {
        pendingSaveTimers.delete(slotKey);
        const dataToSave = pendingSaveData.get(slotKey);
        pendingSaveData.delete(slotKey);
        if (dataToSave) {
          const res = await executeSave(slotKey, dataToSave);
          resolve(res);
        } else {
          resolve(true);
        }
      }, 400);
      pendingSaveTimers.set(slotKey, timer);
    });
  },

  async fetchAllSlots() {
    try {
      const colRef = collection(db, "saves");
      const snap = await getDocs(colRef);
      const results = [];
      snap.forEach(docSnap => {
        const data = docSnap.data();
        const key = docIdToSlotKey(docSnap.id, data);
        if (data.deleted) {
          results.push({
            slotKey: key,
            deleted: true,
            updatedAt: data.updatedAt || 0
          });
          return;
        }

        let gameState = null;
        if (data.gameData) {
          try {
            gameState = JSON.parse(data.gameData);
          } catch(e) {
            console.warn("[CloudSave] Failed to parse gameData for:", key, e);
          }
        } else if (data.playerName) {
          // Legacy direct object format
          gameState = data;
        }

        if (gameState) {
          results.push({
            slotKey: key,
            deleted: false,
            updatedAt: data.updatedAt || (gameState.updatedAt || 0),
            gameState: gameState
          });
        }
      });
      return results;
    } catch (err) {
      console.error("[CloudSave] Failed to fetch all slots from cloud:", err);
      return [];
    }
  },

  async deleteSlot(slotKey) {
    if (!slotKey) return;
    if (pendingSaveTimers.has(slotKey)) {
      clearTimeout(pendingSaveTimers.get(slotKey));
      pendingSaveTimers.delete(slotKey);
    }
    pendingSaveData.delete(slotKey);

    try {
      const docId = slotKeyToDocId(slotKey);
      const docRef = doc(db, "saves", docId);
      // Mark as deleted (tombstone) so other devices delete their local copy on next sync
      await setDoc(docRef, {
        slotKey: slotKey,
        deleted: true,
        updatedAt: Date.now()
      });
      console.log("[CloudSave] Marked slot as deleted in Firestore:", slotKey);
    } catch (err) {
      console.error("[CloudSave] Failed to delete slot in Firestore:", err);
    }
  },

  // Flush any pending debounce writes immediately (e.g. before navigating or closing)
  flush() {
    for (const [slotKey, timer] of pendingSaveTimers.entries()) {
      clearTimeout(timer);
      const data = pendingSaveData.get(slotKey);
      if (data) {
        executeSave(slotKey, data);
      }
    }
    pendingSaveTimers.clear();
    pendingSaveData.clear();
  }
};

// Auto-flush on page unload / hide
window.addEventListener('pagehide', () => {
  if (window.CloudSave) window.CloudSave.flush();
});
window.addEventListener('beforeunload', () => {
  if (window.CloudSave) window.CloudSave.flush();
});

signInAnonymously(auth).then((userCredential) => {
    window._firebaseUid = userCredential.user.uid;
    console.log("Firebase Auth Signed In", window._firebaseUid);
}).catch((error) => {
    console.error("Anonymous auth failed:", error);
});
