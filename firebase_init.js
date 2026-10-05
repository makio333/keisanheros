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
  increment, limit,
  runTransaction,
  where
} from "firebase/firestore";

// レイド討伐後の集計待ち時間（ミリ秒）
const RAID_SETTLEMENT_MS = 2 * 60 * 1000;

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
    const globalRef = doc(db, 'raidGlobal', 'currentBoss');
    return runTransaction(db, async transaction => {
      const globalSnap = await transaction.get(globalRef);
      const global = globalSnap.exists() ? globalSnap.data() : {};
      const now = Date.now();
      
      if (global.finalizedAt && global.startsAt && now >= global.startsAt) {
         const historyRef = doc(db, 'raidHistory', global.bossId || 'boss_50');
         transaction.set(historyRef, global);
         const nextLevel = (global.bossLevel || 50) + 10;
         Object.assign(global, {
             bossLevel: nextLevel,
             bossId: 'boss_' + nextLevel,
             maxHp: 1000 + (nextLevel - 50) * 100,
             startsAt: null,
             totalDamageDealt: 0,
             defeatedAt: null,
             settlesAt: null,
             finisherSlotKeys: [],
             finalizedAt: null,
             finalRankings: null,
             finalHitters: null
         });
         transaction.set(globalRef, global);
      }
      
      const bossLevel = global.bossLevel || 50;
      const bossId = global.bossId || 'boss_' + bossLevel;
      const maxHp = global.maxHp || 1000;
      if (!global.bossId) {
          global.bossLevel = bossLevel;
          global.bossId = bossId;
          global.maxHp = maxHp;
      }
      
      const rankRef = doc(db, 'raidRankings_' + bossId, slotKeyToDocId(slotKey));
      const claimRef = doc(db, 'raidClaims', slotKeyToDocId(slotKey) + '_' + bossId);
      
      const rankSnap = await transaction.get(rankRef);
      const claimSnap = await transaction.get(claimRef);
      const previous = rankSnap.exists() ? rankSnap.data() : {};
      
      const isActive = !global.startsAt || now >= global.startsAt;
      const appliedEvents = { ...(previous.appliedEvents || {}) };
      const oldBaseline = previous.legacyDamage ?? previous.totalDamage ?? 0;
      const legacyDamage = Math.max(oldBaseline, Number(progress.legacyDamage) || 0);
      
      const defeatedAt = Number(global.defeatedAt) || null;
      const settlesAt = Number(global.settlesAt) || (defeatedAt || null);
      const acceptingDamage = isActive && !global.finalizedAt && (!defeatedAt || now <= settlesAt);
      
      let addedDamage = acceptingDamage && !defeatedAt ? legacyDamage - oldBaseline : 0;
      let acceptedEvents = 0;
      for (const event of progress.events || []) {
        if (!event.id || appliedEvents[event.id]) continue;
        const fightStartedAt = Number(event.fightStartedAt) || Number(event.createdAt) || now;
        if (acceptingDamage && (!defeatedAt || fightStartedAt <= defeatedAt)) {
          addedDamage += Math.max(0, Math.round(Number(event.damage) || 0));
          acceptedEvents++;
        }
        appliedEvents[event.id] = true;
      }
      
      const participationAt = Number(progress.participationAt) || now;
      const participatedBeforeDefeat = !!progress.participated && (!defeatedAt || participationAt <= defeatedAt);
      const participated = previous.participated || participatedBeforeDefeat || legacyDamage > 0 || acceptedEvents > 0;
      const nextTotal = (previous.totalDamage || 0) + addedDamage;
      const nextGlobalTotal = (global.totalDamageDealt || 0) + addedDamage;
      const startsSettlement = isActive && !defeatedAt && addedDamage > 0 && nextGlobalTotal >= maxHp;
      const finalDefeatedAt = defeatedAt || (startsSettlement ? now : null);
      const finalSettlesAt = settlesAt || (startsSettlement ? now + RAID_SETTLEMENT_MS : null);
      const finisherSlotKeys = [...new Set(global.finisherSlotKeys || [])];
      
      if (addedDamage > 0 && (startsSettlement || (defeatedAt && acceptingDamage && acceptedEvents > 0))) {
        if (!finisherSlotKeys.includes(slotKey)) finisherSlotKeys.push(slotKey);
      }
      
      const finalize = isActive && !!finalDefeatedAt && !global.finalizedAt && now >= finalSettlesAt;
      let finalRankings = null;
      let finalHitters = null;
      
      if (finalize) {
        const rankingSnap = await getDocs(query(collection(db, 'raidRankings_' + bossId), orderBy('totalDamage', 'desc')));
        const rows = new Map();
        rankingSnap.forEach(snap => rows.set(snap.id, { ...snap.data(), slotKey: snap.data().slotKey || snap.id }));
        if (rankSnap.exists() || participated || addedDamage > 0) {
          rows.set(slotKeyToDocId(slotKey), { ...previous, ...profile, slotKey, participated: true, totalDamage: nextTotal });
        }
        const orderedRows = [...rows.values()]
          .filter(row => row.participated || (row.totalDamage || 0) > 0)
          .sort((a, b) => (b.totalDamage || 0) - (a.totalDamage || 0) || String(a.slotKey || '').localeCompare(String(b.slotKey || '')));
        finalRankings = orderedRows.map(row => ({ slotKey: row.slotKey, totalDamage: row.totalDamage || 0 }));
        finalHitters = finisherSlotKeys.map(key => {
          const row = orderedRows.find(entry => entry.slotKey === key);
          return { slotKey: key, playerName: row?.playerName || (key === slotKey ? profile.playerName : '勇者') };
        });
      }
      
      if (rankSnap.exists() || participated) {
        if (!global.finalizedAt && (!defeatedAt || now <= finalSettlesAt) && participated) {
          const appearance = { playerName: profile.playerName || '勇者', avatar: profile.avatar || '', avatarBackground: profile.avatarBackground || 'default', avatarHolographic: !!profile.avatarHolographic, avatarBackgroundHolographic: !!profile.avatarBackgroundHolographic, level: profile.level || 1, equipment: profile.equipment || {} };
          transaction.set(rankRef, { ...appearance, slotKey, participated: !!participated, totalDamage: nextTotal, legacyDamage, appliedEvents, lastUpdated: Date.now() }, { merge: true });
        }
      }
      
      let nextStartsAt = global.startsAt;
      if (finalize) {
         const d = new Date(now);
         d.setUTCHours(d.getUTCHours() + 9);
         d.setUTCDate(d.getUTCDate() + 1);
         d.setUTCHours(0, 0, 0, 0);
         d.setUTCHours(d.getUTCHours() - 9);
         nextStartsAt = d.getTime();
      }
      
      if (addedDamage > 0 || startsSettlement || finalize || !globalSnap.exists()) {
        transaction.set(globalRef, {
          bossLevel,
          bossId,
          maxHp,
          totalDamageDealt: nextGlobalTotal,
          ...(startsSettlement ? { defeatedAt: now, settlesAt: now + RAID_SETTLEMENT_MS } : {}),
          ...(finisherSlotKeys.length ? { finisherSlotKeys } : {}),
          ...(finalize ? { finalizedAt: now, finalRankings, finalHitters, startsAt: nextStartsAt } : {})
        }, { merge: true });
      }
      
      if (progress.claimed && !claimSnap.exists()) {
        transaction.set(claimRef, { ...progress.claimed, migrated: true });
      }
      
      return { 
         acknowledged: (progress.events || []).map(event => event.id), 
         claimed: claimSnap.exists() || !!progress.claimed, 
         defeatedAt: finalDefeatedAt, 
         settlesAt: finalSettlesAt, 
         finalizedAt: finalize ? now : global.finalizedAt || null, 
         finalRankings,
         bossLevel,
         bossId,
         maxHp,
         startsAt: nextStartsAt || null
      };
    });
  },

  watchBoss(onChange, onError) {
    return onSnapshot(doc(db, 'raidGlobal', 'currentBoss'), { includeMetadataChanges: true }, snapshot => {
      if (!snapshot.metadata.fromCache) onChange();
    }, onError);
  },

  async settleReward(slotKey, bossId, fallbackState, applyReward) {
    if (!bossId) bossId = 'boss_50';
    const claimRef = doc(db, 'raidClaims', slotKeyToDocId(slotKey) + '_' + bossId);
    const saveRef = doc(db, 'saves', slotKeyToDocId(slotKey));
    const globalRef = doc(db, 'raidGlobal', 'currentBoss');
    const rankRef = doc(db, 'raidRankings_' + bossId, slotKeyToDocId(slotKey));
    return runTransaction(db, async transaction => {
      const claim = await transaction.get(claimRef);
      if (claim.exists()) return { eligible: false, alreadyClaimed: true };
      const saved = await transaction.get(saveRef);
      const global = await transaction.get(globalRef);
      const rank = await transaction.get(rankRef);
      if (!global.exists() || !global.data().finalizedAt) return { eligible: false };
      const gData = global.data();
      const rData = rank.exists() ? rank.data() : null;
      let totalDamage = rData ? rData.totalDamage || 0 : 0;
      if (!rData) {
        if (fallbackState && fallbackState.progress && (fallbackState.progress.legacyDamage || fallbackState.progress.participated)) {
           totalDamage = fallbackState.progress.legacyDamage || 0;
        } else {
           return { eligible: false };
        }
      }
      if (totalDamage <= 0 && (!rData || !rData.participated)) return { eligible: false };
      const rankList = gData.finalRankings || [];
      const rankIndex = rankList.findIndex(entry => entry.slotKey === slotKey);
      const playerRank = rankIndex >= 0 ? rankIndex + 1 : -1;
      const isFinisher = (gData.finisherSlotKeys || []).includes(slotKey);
      const payout = applyReward(playerRank, totalDamage, isFinisher);
      const currentState = saved.exists() ? saved.data() : fallbackState;
      if (currentState && currentState.player) {
         currentState.player.gold = (currentState.player.gold || 0) + payout.gold;
         currentState.seeds = (currentState.seeds || 0) + payout.seeds;
         currentState.tickets = (currentState.tickets || 0) + payout.tickets;
         if (payout.finisherBonus) {
           currentState.unlockedAvatarBackgrounds = [...new Set([...(currentState.unlockedAvatarBackgrounds || ['default']), payout.finisherBonus])];
         }
         if (saved.exists()) transaction.set(saveRef, currentState, { merge: true });
      }
      transaction.set(claimRef, { claimedAt: Date.now(), rank: playerRank, payout });
      return { eligible: true, payout, state: currentState };
    });
  },

  async getRankings(bossId) {
    if (!bossId) bossId = 'boss_50';
    const snap = await getDocs(query(collection(db, 'raidRankings_' + bossId), orderBy('totalDamage', 'desc'), limit(100)));
    return snap.docs.map(doc => ({ ...doc.data(), slotKey: doc.data().slotKey || doc.id }));
  },
  
  async getHistory() {
    const snap = await getDocs(query(collection(db, 'raidHistory'), orderBy('bossLevel', 'desc'), limit(50)));
    return snap.docs.map(doc => doc.data());
  },

  async getGlobalBoss() {
    try {
      const docRef = doc(db, 'raidGlobal', 'currentBoss');
      const snap = await getDoc(docRef);
      if (snap.exists()) return snap.data();
      return { totalDamageDealt: 0 };
    } catch (e) {
      console.error(e);
      return { totalDamageDealt: 0 };
    }
  },

  async receiveCheers(slotKey, localState) {
    return 0;
  },
  async sendCheer() { return true; }
};

window.AdminGiftAPI = {
  async send(targets, gift) {
    const createdAt = Date.now();
    const ids = [];
    for (const target of targets) {
      const ref = doc(collection(db, 'admin_gifts'));
      await setDoc(ref, {
        targetSlotKey: target.slotKey,
        playerName: target.playerName || '',
        gold: Math.max(0, Math.floor(Number(gift.gold) || 0)),
        items: (gift.items || []).map(item => ({ id: String(item.id), count: Math.max(1, Math.floor(Number(item.count) || 1)) })),
        message: String(gift.message || '').slice(0, 200),
        createdAt,
        claimed: false,
        claimedAt: null
      });
      ids.push(ref.id);
    }
    return ids;
  },

  async fetchPending(slotKey) {
    const snap = await getDocs(query(collection(db, 'admin_gifts'), where('targetSlotKey', '==', slotKey)));
    const gifts = [];
    snap.forEach(docSnap => {
      const data = docSnap.data();
      if (!data.claimed) gifts.push({ id: docSnap.id, ...data });
    });
    return gifts.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  },

  // 受け取り済みにする。すでに他端末で受け取っていたら false
  async claim(giftId) {
    const ref = doc(db, 'admin_gifts', giftId);
    return runTransaction(db, async transaction => {
      const snap = await transaction.get(ref);
      if (!snap.exists() || snap.data().claimed) return false;
      transaction.update(ref, { claimed: true, claimedAt: Date.now() });
      return true;
    });
  },

  async listRecent(limitCount = 30) {
    const snap = await getDocs(query(collection(db, 'admin_gifts'), orderBy('createdAt', 'desc')));
    const rows = [];
    snap.forEach(docSnap => { if (rows.length < limitCount) rows.push({ id: docSnap.id, ...docSnap.data() }); });
    return rows;
  }
};
