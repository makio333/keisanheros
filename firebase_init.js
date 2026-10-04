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
  increment,
  runTransaction
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
  async syncPlayer(slotKey, profile, progress = {}) {
    const rankRef = doc(db, 'raidRankings', slotKeyToDocId(slotKey));
    const globalRef = doc(db, 'raidGlobal', 'currentBoss');
    const claimRef = doc(db, 'raidClaims', slotKeyToDocId(slotKey) + '_boss1');
    return runTransaction(db, async transaction => {
      const rankSnap = await transaction.get(rankRef);
      const globalSnap = await transaction.get(globalRef);
      const claimSnap = await transaction.get(claimRef);
      const previous = rankSnap.exists() ? rankSnap.data() : {};
      const global = globalSnap.exists() ? globalSnap.data() : {};
      const appliedEvents = { ...(previous.appliedEvents || {}) };
      // Legacy totals may exist on multiple browsers. Import only the highest baseline.
      const oldBaseline = previous.legacyDamage ?? previous.totalDamage ?? 0;
      const legacyDamage = Math.max(oldBaseline, Number(progress.legacyDamage) || 0);
      let addedDamage = legacyDamage - oldBaseline;
      for (const event of progress.events || []) {
        if (!event.id || appliedEvents[event.id]) continue;
        addedDamage += Math.max(0, Math.round(Number(event.damage) || 0));
        appliedEvents[event.id] = true;
      }
      if (global.defeatedAt) addedDamage = 0;
      const participated = previous.participated || (!global.defeatedAt && progress.participated) || legacyDamage > 0 || Object.keys(appliedEvents).length > 0;
      const nextTotal = (previous.totalDamage || 0) + addedDamage;
      let finalRankings = null;
      let rankingQuerySnap = null;
      const nextGlobalTotal = (global.totalDamageDealt || 0) + addedDamage;
      if (!global.defeatedAt && addedDamage > 0 && nextGlobalTotal >= 1000) {
        rankingQuerySnap = await transaction.get(query(collection(db, 'raidRankings'), orderBy('totalDamage', 'desc')));
        const rows = new Map();
        rankingQuerySnap.forEach(snap => rows.set(snap.id, { ...snap.data(), slotKey: snap.data().slotKey || snap.id }));
        rows.set(slotKeyToDocId(slotKey), { ...previous, slotKey, participated: true, totalDamage: nextTotal });
        finalRankings = [...rows.values()]
          .filter(row => row.participated || (row.totalDamage || 0) > 0)
          .sort((a, b) => (b.totalDamage || 0) - (a.totalDamage || 0) || String(a.slotKey || '').localeCompare(String(b.slotKey || '')))
          .map(row => [row.slotKey, row.totalDamage || 0]);
      }
      if (rankSnap.exists() || participated) {
        if (!global.defeatedAt || rankSnap.exists()) {
          const appearance = { playerName: profile.playerName || '勇者', avatar: profile.avatar || '', avatarBackground: profile.avatarBackground || 'default', avatarHolographic: !!profile.avatarHolographic, avatarBackgroundHolographic: !!profile.avatarBackgroundHolographic, level: profile.level || 1, equipment: profile.equipment || {} };
          transaction.set(rankRef, { ...appearance, slotKey, participated: !!participated, totalDamage: nextTotal, legacyDamage, appliedEvents, lastUpdated: Date.now() }, { merge: true });
        }
      }
      if (addedDamage > 0) {
        transaction.set(globalRef, { totalDamageDealt: nextGlobalTotal, ...(finalRankings ? { defeatedAt: Date.now(), finalRankings } : {}) }, { merge: true });
      }
      if (progress.claimed && !claimSnap.exists()) {
        transaction.set(claimRef, { ...progress.claimed, migrated: true });
      }
      return { acknowledged: (progress.events || []).map(event => event.id), claimed: claimSnap.exists() || !!progress.claimed, finalRankings };
    });
  },

  watchBoss(onChange, onError) {
    return onSnapshot(doc(db, 'raidGlobal', 'currentBoss'), { includeMetadataChanges: true }, snapshot => {
      if (!snapshot.metadata.fromCache) onChange();
    }, onError);
  },

  async settleReward(slotKey, bossId, fallbackState, applyReward) {
    const claimRef = doc(db, 'raidClaims', slotKeyToDocId(slotKey) + '_' + bossId);
    const saveRef = doc(db, 'saves', slotKeyToDocId(slotKey));
    const globalRef = doc(db, 'raidGlobal', 'currentBoss');
    const rankRef = doc(db, 'raidRankings', slotKeyToDocId(slotKey));
    return runTransaction(db, async transaction => {
      const claim = await transaction.get(claimRef);
      const saved = await transaction.get(saveRef);
      const global = await transaction.get(globalRef);
      const rank = await transaction.get(rankRef);
      if (!global.exists() || !global.data().defeatedAt || !rank.exists()) return { eligible: false, state: fallbackState };
      const finalRankings = global.data().finalRankings || [];
      const rankIndex = finalRankings.findIndex(entry => (Array.isArray(entry) ? entry[0] : entry.slotKey) === slotKey);
      if (rankIndex < 0) return { eligible: false, state: fallbackState };
      const finalRank = rankIndex + 1;
      const state = saved.exists() && saved.data().gameData ? JSON.parse(saved.data().gameData) : JSON.parse(JSON.stringify(fallbackState));
      const reward = finalRank === 1 ? { gold: 5000, seeds: 3, tickets: 1 } : finalRank === 2 ? { gold: 3000, seeds: 3, tickets: 1 } : finalRank === 3 ? { gold: 2000, seeds: 3, tickets: 1 } : finalRank <= 10 ? { gold: 1000, seeds: 1, tickets: 0 } : { gold: 500, seeds: 1, tickets: 0 };
      if (claim.exists()) return { eligible: true, alreadyClaimed: true, rank: finalRank, reward, state };
      if (applyReward) applyReward(state);
      else {
        state.player.gold = (state.player.gold || 0) + reward.gold;
        state.skinGachaTickets = (state.skinGachaTickets || 0) + reward.tickets;
        state.items ||= [];
        const seed = state.items.find(item => item.id === 'cost_seed');
        if (seed) seed.count = (seed.count || 0) + reward.seeds;
        else {
          state.nextUid = Number.isFinite(state.nextUid) ? state.nextUid : 1;
          state.items.push({ uid: state.nextUid++, id: 'cost_seed', count: reward.seeds });
        }
      }
      state.updatedAt = Date.now();
      transaction.set(saveRef, { slotKey, playerName: state.playerName, lvl: state.player.lvl, gold: state.player.gold, updatedAt: state.updatedAt, gameData: JSON.stringify(state), deleted: false }, { merge: true });
      transaction.set(claimRef, { claimedAt: Date.now(), version: 2, applied: true });
      return { eligible: true, alreadyClaimed: false, rank: finalRank, reward, state };
    });
  },

  async sendCheer(senderKey, targetKey, date) {
    const senderRef = doc(db, 'raidRankings', slotKeyToDocId(senderKey));
    const targetRef = doc(db, 'raidRankings', slotKeyToDocId(targetKey));
    return runTransaction(db, async transaction => {
      const sender = await transaction.get(senderRef);
      const target = await transaction.get(targetRef);
      if (!target.exists() || senderKey === targetKey) return false;
      const history = sender.exists() ? sender.data().cheersSent || {} : {};
      if (history[date]?.includes(targetKey)) return false;
      transaction.set(senderRef, { cheersSent: { ...history, [date]: [...(history[date] || []), targetKey] } }, { merge: true });
      transaction.set(targetRef, { cheerCount: (target.data().cheerCount || 0) + 1, unclaimedGold: (target.data().unclaimedGold || 0) + 50 }, { merge: true });
      return true;
    });
  },

  async receiveCheers(slotKey, fallbackState) {
    const rankRef = doc(db, 'raidRankings', slotKeyToDocId(slotKey));
    const saveRef = doc(db, 'saves', slotKeyToDocId(slotKey));
    return runTransaction(db, async transaction => {
      const rank = await transaction.get(rankRef);
      const saved = await transaction.get(saveRef);
      const gold = rank.exists() ? rank.data().unclaimedGold || 0 : 0;
      if (!gold) return 0;
      const state = saved.exists() && saved.data().gameData ? JSON.parse(saved.data().gameData) : JSON.parse(JSON.stringify(fallbackState));
      state.player.gold = (state.player.gold || 0) + gold;
      state.updatedAt = Date.now();
      transaction.set(saveRef, { gameData: JSON.stringify(state), gold: state.player.gold, updatedAt: state.updatedAt }, { merge: true });
      transaction.set(rankRef, { unclaimedGold: 0 }, { merge: true });
      return gold;
    });
  },
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
      const q = query(colRef, orderBy("totalDamage", "desc"));
      const snap = await getDocs(q);
      const results = [];
      snap.forEach(docSnap => {
        results.push(docSnap.data());
      });
      return results;
    } catch(err) {
      console.error("[RaidBoss] Failed to fetch rankings:", err);
      throw err;
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
      throw err;
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
