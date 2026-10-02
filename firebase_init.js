import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { 
  initializeFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  increment 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDu5F9Dlw4x7E1cDg2K41_mEzaEa0QGW6Q",
  authDomain: "treegames-ac5db.firebaseapp.com",
  projectId: "treegames-ac5db",
  storageBucket: "treegames-ac5db.firebasestorage.app",
  messagingSenderId: "538793714749",
  appId: "1:538793714749:web:8cea9794c8b65f8a9d7654",
  measurementId: "G-T5X3X57WJJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Safari等のCORS・アクセス制御チェックエラーを防止するためLong-Pollingを使用
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

// Initialize Analytics (ブラウザ環境でサポートされている場合のみ)
isSupported().then((supported) => {
  if (supported) {
    try {
      getAnalytics(app);
      console.log("[Firebase] Analytics initialized");
    } catch(e) {}
  }
}).catch(() => {});

window._firestoreDb = db;

// Helper to convert slotKey to a clean doc ID
function slotKeyToDocId(slotKey) {
  return encodeURIComponent(slotKey);
}

function docIdToSlotKey(docId, data) {
  if (data && data.slotKey) return data.slotKey;
  try {
    const decoded = decodeURIComponent(docId);
    if (decoded.startsWith('typing_rpg_save_v3::')) return decoded;
  } catch(e) {}
  if (docId.startsWith('typing_rpg_save_v3__')) {
    return docId.replace('typing_rpg_save_v3__', 'typing_rpg_save_v3::');
  }
  return docId;
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

// Listeners for realtime updates
const cloudChangeListeners = new Set();

// Start realtime listening to Firestore saves
try {
  const colRef = collection(db, "saves");
  onSnapshot(colRef, (snapshot) => {
    const cloudSlots = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const key = docIdToSlotKey(docSnap.id, data);
      if (data.deleted) {
        cloudSlots.push({
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
        cloudSlots.push({
          slotKey: key,
          deleted: false,
          updatedAt: data.updatedAt || (gameState.updatedAt || 0),
          gameState: gameState
        });
      }
    });

    console.log(`[CloudSave] Realtime update: ${cloudSlots.length} slots loaded from Firestore`);
    for (const listener of cloudChangeListeners) {
      try {
        listener(cloudSlots);
      } catch(e) {
        console.error("[CloudSave] Listener error:", e);
      }
    }
  }, (err) => {
    console.error("[CloudSave] Realtime subscription error:", err);
  });
} catch(err) {
  console.error("[CloudSave] Failed to initialize onSnapshot:", err);
}

// Global CloudSave API
window.CloudSave = {
  onCloudUpdate(fn) {
    cloudChangeListeners.add(fn);
    return () => cloudChangeListeners.delete(fn);
  },

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

// Global Raid Boss API
window.RaidBossAPI = {
  async submitDamage(slotKey, playerName, damage) {
    if (!slotKey || !damage) return;
    try {
      const docId = slotKeyToDocId(slotKey);
      const docRef = doc(db, "raidRankings", docId);
      
      // We also update the global boss HP (optional, but good for community feel)
      const globalRef = doc(db, "raidGlobal", "currentBoss");
      
      await setDoc(docRef, {
        slotKey,
        playerName: playerName || '名無し',
        totalDamage: increment(damage),
        lastUpdated: Date.now()
      }, { merge: true });
      
      await setDoc(globalRef, {
        totalDamageDealt: increment(damage)
      }, { merge: true });
      
      return true;
    } catch(err) {
      console.error("[RaidBoss] Failed to submit damage:", err);
      return false;
    }
  },
  
  async getRankings() {
    try {
      const colRef = collection(db, "raidRankings");
      const q = query(colRef, orderBy("totalDamage", "desc"), limit(20));
      const snap = await getDocs(q);
      const results = [];
      snap.forEach(docSnap => {
        results.push(docSnap.data());
      });
      return results;
    } catch(err) {
      console.error("[RaidBoss] Failed to fetch rankings:", err);
      return [];
    }
  },
  
  async getGlobalBoss() {
    try {
      const docRef = doc(db, "raidGlobal", "currentBoss");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data();
      }
      return { totalDamageDealt: 0 };
    } catch(err) {
      return { totalDamageDealt: 0 };
    }
  },
  
  async checkRewardClaimed(slotKey, bossId) {
    if (!slotKey) return true;
    try {
      const docId = slotKeyToDocId(slotKey) + "_" + bossId;
      const docRef = doc(db, "raidClaims", docId);
      const snap = await getDoc(docRef);
      return snap.exists();
    } catch(err) {
      console.error(err);
      return true; // fail safe
    }
  },
  
  async claimReward(slotKey, bossId) {
    if (!slotKey) return false;
    try {
      const docId = slotKeyToDocId(slotKey) + "_" + bossId;
      const docRef = doc(db, "raidClaims", docId);
      await setDoc(docRef, { claimedAt: Date.now() });
      return true;
    } catch(err) {
      console.error(err);
      return false;
    }
  }
};
