import {applyGiftPayload,raidRankCoins} from './economy.js';
import {eventRaidRewardEntitlements,eventRaidBonusEntitlements,EVENT_RAID_FINAL_AT,eventRaidFinalGift} from './event_raid.js';

// Shared gameplay rules; callers supply storage, never authentication decisions.
export function createGameCloudAPIs({db,doc,setDoc,getDoc,getDocs,collection,onSnapshot,query,orderBy,limit,runTransaction,where,now:clock=Date.now,settlementMs=60000}) {
  const RAID_SETTLEMENT_MS=settlementMs;
  const slotKeyToDocId=encodeURIComponent;
const EventRaidAPI = {
  async recordBest(eventId, slotKey, record) {
    if(clock()>=EVENT_RAID_FINAL_AT)throw new Error('ハロウィンランキングは11月1日に締め切りました');
    if (!slotKey || !Number.isSafeInteger(record.bestKills) || record.bestKills < 0) throw new Error('Invalid event raid record');
    const ref=doc(db,'eventRaidRankings_'+eventId,slotKeyToDocId(slotKey));
    const claimsRef=doc(db,'eventRaidClaims_'+eventId,slotKeyToDocId(slotKey));
    return runTransaction(db,async transaction=>{
      const snap=await transaction.get(ref);
      const claimsSnap=await transaction.get(claimsRef);
      const previous=snap.exists()?snap.data():null;
      const {participationDay,participationDays,runs=[],...profile}=record;
      const processed={...(claimsSnap.exists()?claimsSnap.data().processedRuns || {}:{})};
      let totalKills=previous?.totalKills ?? previous?.bestKills ?? 0;
      for(const run of runs)if(typeof run.id==='string' && Number.isSafeInteger(run.kills) && run.kills>=0 && run.finishedAt<EVENT_RAID_FINAL_AT && !processed[run.id]){processed[run.id]=true;totalKills+=run.kills;}
      const next={...(previous && previous.bestKills>=record.bestKills?previous:profile),slotKey,bestKills:Math.max(previous?.bestKills || 0,record.bestKills),totalKills,updatedAt:clock()};
      const rewards={...(claimsSnap.exists()?claimsSnap.data().rewards || {}:{})};
      const bonuses={...(claimsSnap.exists()?claimsSnap.data().bonuses || {}:{}),...eventRaidBonusEntitlements(next.bestKills)};
      for(const day of Array.isArray(participationDays)?participationDays:[participationDay]) Object.assign(rewards,eventRaidRewardEntitlements(next.bestKills,day));
      if(next!==previous) transaction.set(ref,next);
      transaction.set(claimsRef,{rewards,bonuses,processedRuns:processed});
      return {...next,rewards,bonuses};
    });
  },
  async getRankings(eventId) {
    const snap=await getDocs(collection(db,'eventRaidRankings_'+eventId));
    return snap.docs.map(entry=>entry.data());
  },
  async finalizeRankings(eventId) {
    if(clock()<EVENT_RAID_FINAL_AT)return null;
    const ref=doc(db,'eventRaidFinalResults',eventId);
    const existing=await getDoc(ref);if(existing.exists())return existing.data().rows;
    const rows=(await this.getRankings(eventId)).map(row=>({slotKey:row.slotKey,bestKills:row.bestKills || 0,totalKills:row.totalKills ?? row.bestKills ?? 0}));
    return runTransaction(db,async transaction=>{const snap=await transaction.get(ref);if(snap.exists())return snap.data().rows;transaction.set(ref,{rows,cutoff:EVENT_RAID_FINAL_AT,createdAt:clock()});return rows;});
  },
  async claimFinalReward(eventId,slotKey,snapshot) {
    const rows=await this.finalizeRankings(eventId);if(!rows)return null;
    const gift=eventRaidFinalGift(rows,slotKey);if(!gift)return null;
    const claimRef=doc(db,'eventRaidFinalClaims_'+eventId,slotKeyToDocId(slotKey)), saveRef=doc(db,'saves',slotKeyToDocId(slotKey));
    return runTransaction(db,async transaction=>{
      const claim=await transaction.get(claimRef), saved=await transaction.get(saveRef);
      if(claim.exists())return null;
      let cloud;try{cloud=JSON.parse(saved.data()?.gameData || 'null');}catch(_){}
      const game=JSON.parse(JSON.stringify((cloud?.updatedAt || 0)>(snapshot?.updatedAt || 0)?cloud:snapshot));
      applyGiftPayload(game,gift);game.updatedAt=clock();
      transaction.set(saveRef,{slotKey,playerName:game.playerName || 'ぼうけんしゃ',lvl:game.player.lvl || 1,gold:game.player.gold,updatedAt:game.updatedAt,gameData:JSON.stringify(game),deleted:false},{merge:true});
      transaction.set(claimRef,{rank:gift.rank,claimedAt:clock()});return gift;
    });
  }

};

const RaidBossAPI = {
  async syncPlayer(slotKey, profile, progress = {}) {
    const globalRef = doc(db, 'raidGlobal', 'currentBoss');
    return runTransaction(db, async transaction => {
      const globalSnap = await transaction.get(globalRef);
      let global = globalSnap.exists() ? globalSnap.data() : {};
      const now = clock();
      let archivedBoss = null;
      let settledBossId = null;

      if (global.finalizedAt && (!global.startsAt || now >= global.startsAt)) { // startsAt 欠落データ（旧コードで集計）でも次のレベルへ進める
         archivedBoss = { ...global, bossLevel: global.bossLevel || 50, bossId: global.bossId || 'boss_50', maxHp: global.maxHp || 1000 };
         settledBossId = global.bossId || 'boss_50';
         const nextLevel = (global.bossLevel || 50) + 10;
         global = {
             ...global,
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
         };
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
      const challengeCounterRef = doc(db, 'raidClaims', slotKeyToDocId(slotKey) + '_challenge_count');
      const challenge2ClaimRef = doc(db, 'raidClaims', slotKeyToDocId(slotKey) + '_challenge2');
      const challenge3ClaimRef = doc(db, 'raidClaims', slotKeyToDocId(slotKey) + '_challenge3');
      const saveRef = doc(db, 'saves', slotKeyToDocId(slotKey));

      const rankSnap = await transaction.get(rankRef);
      const claimSnap = await transaction.get(claimRef);
      const challengeCounterSnap = await transaction.get(challengeCounterRef);
      const challenge2ClaimSnap = await transaction.get(challenge2ClaimRef);
      const challenge3ClaimSnap = await transaction.get(challenge3ClaimRef);
      const saveSnap = await transaction.get(saveRef);
      const previous = rankSnap.exists() ? rankSnap.data() : {};

      const isActive = !global.startsAt || now >= global.startsAt;
      const appliedEvents = { ...(previous.appliedEvents || {}) };
      const oldBaseline = previous.legacyDamage ?? previous.totalDamage ?? 0;
      const progressMatchesBoss = (progress.bossId && progress.bossId!=='boss1' ? progress.bossId : 'boss_50') === bossId;
      const legacyDamage = progressMatchesBoss ? Math.max(oldBaseline, Number(progress.legacyDamage) || 0) : oldBaseline;

      const defeatedAt = Number(global.defeatedAt) || null;
      const settlesAt = Number(global.settlesAt) || (defeatedAt || null);
      const acceptingDamage = isActive && !global.finalizedAt && (!defeatedAt || now <= settlesAt);

      let addedDamage = acceptingDamage && !defeatedAt ? legacyDamage - oldBaseline : 0;
      let acceptedEvents = 0;
      let acceptedChallenges = 0;
      for (const event of progress.events || []) {
        if (!event.id || appliedEvents[event.id]) continue;
        const fightStartedAt = Number(event.fightStartedAt) || Number(event.createdAt) || now;
        const eventMatchesBoss = !archivedBoss && progressMatchesBoss && (!event.bossId || event.bossId === bossId);
        if (eventMatchesBoss && acceptingDamage && (!defeatedAt || fightStartedAt <= defeatedAt)) {
          addedDamage += Math.max(0, Math.round(Number(event.damage) || 0));
          acceptedEvents++;
          acceptedChallenges++;
        }
        appliedEvents[event.id] = true;
      }

      const participationAt = Number(progress.participationAt) || now;
      const participatedBeforeDefeat = progressMatchesBoss && !!progress.participated && (!defeatedAt || participationAt <= defeatedAt);
      const participated = previous.participated || participatedBeforeDefeat || legacyDamage > 0 || acceptedEvents > 0;
      const nextTotal = (previous.totalDamage || 0) + addedDamage;
      const excludedFromRanking = !!previous.excludedFromRanking && acceptedEvents===0;
      const challengeCount = (Number(challengeCounterSnap.data()?.challengeCount) || 0) + acceptedChallenges;
      let challenge2EquipTenCount = null;
      let challenge3SkinTicketCount = null;
      const shouldGrantChallenge2 = challengeCount >= 2 && acceptedChallenges > 0 && !challenge2ClaimSnap.exists();
      const shouldGrantChallenge3 = challengeCount >= 3 && acceptedChallenges > 0 && !challenge3ClaimSnap.exists();
      let challengeSave = null;
      if (shouldGrantChallenge2 || shouldGrantChallenge3) {
        const cloudState=saveSnap.exists() && saveSnap.data()?.gameData ? JSON.parse(saveSnap.data().gameData) : null;
        challengeSave=JSON.parse(JSON.stringify((progress.state?.updatedAt || 0)>(cloudState?.updatedAt || 0)?progress.state:cloudState || progress.state || {}));
        if (challengeSave?.player) {
          // 2回目：装備ガチャ10連チケット／3回目：背景スキンガチャチケット1枚（1回目の参加特典はマグマの背景）
          if (shouldGrantChallenge2) {
            challengeSave.equipGachaTenPullTickets = (Number(challengeSave.equipGachaTenPullTickets) || 0) + 1;
            challenge2EquipTenCount = challengeSave.equipGachaTenPullTickets;
          }
          if (shouldGrantChallenge3) {
            challengeSave.skinGachaTickets = (Number(challengeSave.skinGachaTickets) || 0) + 1;
            challenge3SkinTicketCount = challengeSave.skinGachaTickets;
          }
          challengeSave.updatedAt = now;
        }
      }
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
          .filter(row => !row.excludedFromRanking && (row.participated || (row.totalDamage || 0) > 0))
          .sort((a, b) => (b.totalDamage || 0) - (a.totalDamage || 0) || String(a.slotKey || '').localeCompare(String(b.slotKey || '')));
        finalRankings = orderedRows.map(row => ({
          slotKey: row.slotKey, totalDamage: row.totalDamage || 0,
          playerName: row.playerName || '勇者', avatar: row.avatar || '',
          avatarBackground: row.avatarBackground || 'default',
          avatarHolographic: !!row.avatarHolographic,
          avatarBackgroundHolographic: !!row.avatarBackgroundHolographic,
          avatarDecoration: row.avatarDecoration || '',
          level: row.level || 1, equipment: row.equipment || {}, cheerCount: row.cheerCount || 0
        }));
        finalHitters = finisherSlotKeys.map(key => {
          const row = orderedRows.find(entry => entry.slotKey === key);
          return { slotKey: key, playerName: row?.playerName || (key === slotKey ? profile.playerName : '勇者') };
        });
      }

      if (rankSnap.exists() || participated) {
        if (!global.finalizedAt && (!defeatedAt || now <= finalSettlesAt) && participated) {
          const appearance = { playerName: profile.playerName || '勇者', avatar: profile.avatar || '', avatarBackground: profile.avatarBackground || 'default', avatarHolographic: !!profile.avatarHolographic, avatarBackgroundHolographic: !!profile.avatarBackgroundHolographic, avatarDecoration:profile.avatarDecoration || '', level: profile.level || 1, equipment: profile.equipment || {} };
          transaction.set(rankRef, { ...appearance, slotKey, excludedFromRanking, participated: !!participated, totalDamage: nextTotal, challengeCount, legacyDamage, appliedEvents, lastUpdated: clock() }, { merge: true });
        }
      }

      const nextStartsAt = finalize ? now : global.startsAt;

      if (archivedBoss) transaction.set(doc(db, 'raidHistory', settledBossId), archivedBoss);

      if (archivedBoss || addedDamage > 0 || startsSettlement || finalize || !globalSnap.exists()) {
        const payload = { bossLevel, bossId, maxHp, totalDamageDealt: nextGlobalTotal, ...(startsSettlement ? { defeatedAt: now, settlesAt: now + RAID_SETTLEMENT_MS } : {}), ...(finisherSlotKeys.length ? { finisherSlotKeys } : {}), ...(finalize ? { finalizedAt: now, finalRankings, finalHitters, startsAt: nextStartsAt } : {}) }; if (archivedBoss) { payload.defeatedAt = null; payload.settlesAt = null; payload.finalizedAt = null; payload.finalRankings = null; payload.finalHitters = null; payload.startsAt = null; payload.finisherSlotKeys = []; } transaction.set(globalRef, payload, { merge: true });
      }

      if ((shouldGrantChallenge2 || shouldGrantChallenge3) && challengeSave?.player) {
        transaction.set(saveRef, { slotKey, playerName: challengeSave.playerName || profile.playerName || '勇者', lvl: challengeSave.player.lvl || 1, gold: challengeSave.player.gold || 0, updatedAt: now, gameData: JSON.stringify(challengeSave), deleted: false }, { merge: true });
        if (shouldGrantChallenge2) transaction.set(challenge2ClaimRef, { claimedAt: now, version: 1, reward: 'equip_gacha_ten_pull_ticket' });
        if (shouldGrantChallenge3) transaction.set(challenge3ClaimRef, { claimedAt: now, version: 1, reward: 'skin_gacha_ticket' });
      }
      if (acceptedChallenges > 0) transaction.set(challengeCounterRef, { challengeCount }, { merge: true });

      if (progressMatchesBoss && progress.claimed && !claimSnap.exists()) {
        transaction.set(claimRef, { ...progress.claimed, migrated: true });
      }

      return {
         excludedFromRanking,
         acknowledged: (progress.events || []).map(event => event.id),
         claimed: claimSnap.exists() || !!progress.claimed,
         defeatedAt: finalDefeatedAt,
         settlesAt: finalSettlesAt,
         finalizedAt: finalize ? now : global.finalizedAt || null,
         finalRankings,
         bossLevel,
         bossId,
         challengeCount,
         challenge2EquipTenCount,
         challenge3SkinTicketCount,
         maxHp,
         settledBossId,
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
    const coinClaimRef=doc(db,'raidCoinRankClaims',slotKeyToDocId(slotKey)+'_'+bossId);
    const claimRef = doc(db, 'raidClaims', slotKeyToDocId(slotKey) + '_' + bossId);
    const saveRef = doc(db, 'saves', slotKeyToDocId(slotKey));
    const globalRef = doc(db, 'raidGlobal', 'currentBoss');
    const historyRef = doc(db, 'raidHistory', bossId);
    const rankRef = doc(db, 'raidRankings_' + bossId, slotKeyToDocId(slotKey));
    return runTransaction(db, async transaction => {
      const claim = await transaction.get(claimRef);
      const coinClaim=await transaction.get(coinClaimRef);
      const saved = await transaction.get(saveRef);
      const global = await transaction.get(globalRef);
      const rank = await transaction.get(rankRef);
      const history = await transaction.get(historyRef);
      const currentBoss = global.exists() ? global.data() : null;
      const gData = currentBoss?.bossId === bossId && currentBoss.finalizedAt ? currentBoss : history.exists() ? history.data() : null;
      if (!gData?.finalizedAt) return { eligible: false };
      if (claim.exists()) {
        const cloudState=saved.data()?.gameData ? JSON.parse(saved.data().gameData) : null;
        const savedState=JSON.parse(JSON.stringify((fallbackState?.updatedAt || 0)>(cloudState?.updatedAt || 0)?fallbackState:cloudState || fallbackState));
        const coins=coinClaim.exists()?0:raidRankCoins(claim.data().rank);
        if(coins && savedState?.player){savedState.raidCoins=(Number(savedState.raidCoins)||0)+coins;savedState.updatedAt=clock();transaction.set(saveRef,{slotKey,playerName:savedState.playerName || '勇者',lvl:savedState.player.lvl || 1,gold:savedState.player.gold || 0,updatedAt:savedState.updatedAt,gameData:JSON.stringify(savedState),deleted:false},{merge:true});transaction.set(coinClaimRef,{coins,rank:claim.data().rank,claimedAt:clock()});}
        return { eligible: true, alreadyClaimed: true, coinAwarded:coins, rank: claim.data().rank, reward: {...claim.data().payout,coins}, state: savedState };
      }
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
      const rankIndex = rankList.findIndex(entry => (Array.isArray(entry) ? entry[0] : entry.slotKey) === slotKey);
      const playerRank = rankIndex >= 0 ? rankIndex + 1 : -1;
      if (playerRank < 1) return { eligible: false };
      const isFinisher = (gData.finisherSlotKeys || []).includes(slotKey);
      const reward = playerRank === 1 ? { gold: 5000, seeds: 3, tickets: 1 } : playerRank === 2 ? { gold: 3000, seeds: 3, tickets: 1 } : playerRank === 3 ? { gold: 2000, seeds: 3, tickets: 1 } : playerRank <= 10 ? { gold: 1000, seeds: 1, tickets: 0 } : { gold: 500, seeds: 1, tickets: 0 };
      reward.coins=coinClaim.exists()?0:raidRankCoins(playerRank);
      if (isFinisher) reward.tickets++;
      reward.finisherBonus = isFinisher;
      const cloudState=saved.exists() && saved.data().gameData ? JSON.parse(saved.data().gameData) : null;
      const currentState=JSON.parse(JSON.stringify((fallbackState?.updatedAt || 0)>(cloudState?.updatedAt || 0)?fallbackState:cloudState || fallbackState));
      if (!currentState?.player) return { eligible: false };
      currentState.raidCoins=(Number(currentState.raidCoins)||0)+reward.coins;
      if(!coinClaim.exists())transaction.set(coinClaimRef,{coins:reward.coins,rank:playerRank,claimedAt:clock()});
      if (applyReward) applyReward(currentState, reward);
      else {
        currentState.player.gold = (currentState.player.gold || 0) + reward.gold;
        currentState.skinGachaTickets = (currentState.skinGachaTickets || 0) + reward.tickets;
        currentState.items ||= [];
        const seed = currentState.items.find(item => item.id === 'cost_seed');
        if (seed) seed.count = (seed.count || 0) + reward.seeds;
        else {
          currentState.nextUid = Number.isFinite(currentState.nextUid) ? currentState.nextUid : 1;
          currentState.items.push({ uid: currentState.nextUid++, id: 'cost_seed', count: reward.seeds });
        }
      }
      currentState.updatedAt = clock();
      transaction.set(saveRef, { slotKey, playerName: currentState.playerName, lvl: currentState.player.lvl, gold: currentState.player.gold, updatedAt: currentState.updatedAt, gameData: JSON.stringify(currentState), deleted: false }, { merge: true });
      transaction.set(claimRef, { claimedAt: clock(), version: 2, applied: true, rank: playerRank, payout: reward });
      return { eligible: true, alreadyClaimed: false, rank: playerRank, reward, state: currentState };
    });
  },

  async getRankings(bossId) {
    if (!bossId) bossId = 'boss_50';
    const snap = await getDocs(query(collection(db, 'raidRankings_' + bossId), orderBy('totalDamage', 'desc'), limit(100)));
    return snap.docs.map(doc => ({ ...doc.data(), slotKey: doc.data().slotKey || doc.id })).filter(row=>!row.excludedFromRanking);
  },

  async getHistory() {
    // bossLevel が無い古い記録（Lv.50）も含めるため、orderBy は使わず 取得後に並べ替える
    const snap = await getDocs(query(collection(db, 'raidHistory'), limit(100)));
    return snap.docs
      .map(doc => ({ bossId: doc.id, bossLevel: Number(String(doc.id).replace('boss_', '')) || 50, ...doc.data() }))
      .sort((a, b) => (b.bossLevel || 0) - (a.bossLevel || 0))
      .slice(0, 50);
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

const AdminGiftAPI = {
  async send(targets, gift) {
    const createdAt = clock();
    const ids = [];
    for (const target of targets) {
      const ref = doc(collection(db, 'admin_gifts'));
      await setDoc(ref, {
        targetSlotKey: target.slotKey,
        playerName: target.playerName || '',
        gold: Math.max(0, Math.floor(Number(gift.gold) || 0)),
        items: (gift.items || []).map(item => {
          const out = { id: String(item.id), count: Math.max(1, Math.floor(Number(item.count) || 1)) };
          if (item.kind) out.kind = String(item.kind);
          if (item.rarity) out.rarity = Math.max(1, Math.floor(Number(item.rarity) || 1));
          return out;
        }),
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
      transaction.update(ref, { claimed: true, claimedAt: clock() });
      return true;
    });
  },

  async claimToSave(giftId, slotKey, snapshot) {
    const giftRef=doc(db,'admin_gifts',giftId), saveRef=doc(db,'saves',slotKeyToDocId(slotKey));
    return runTransaction(db,async transaction=>{
      const giftSnap=await transaction.get(giftRef), saveSnap=await transaction.get(saveRef);
      if(!giftSnap.exists() || giftSnap.data().targetSlotKey!==slotKey)return null;
      const gift={...giftSnap.data(),id:giftId};
      gift.items=(gift.items || []).map(item=>item.kind==='equip'?{...item,ability:item.ability || ((item.rarity>=4 || item.rarity===3 && Math.random()<0.5)?['crit_up','lifesteal','guard','power','mp_save'][Math.floor(Math.random()*5)]:null)}:item);
      let cloud;try{cloud=JSON.parse(saveSnap.data()?.gameData || 'null');}catch(_){}
      if(gift.claimed || cloud?.claimedAdminGiftIds?.includes(giftId))return null;
      const game=JSON.parse(JSON.stringify((cloud?.updatedAt || 0)>(snapshot?.updatedAt || 0)?cloud:snapshot));
      if(!game?.player || !applyGiftPayload(game,gift))return null;
      game.updatedAt=clock();
      transaction.set(saveRef,{slotKey,playerName:game.playerName || 'ぼうけんしゃ',lvl:game.player.lvl || 1,gold:game.player.gold,updatedAt:game.updatedAt,gameData:JSON.stringify(game),deleted:false},{merge:true});
      transaction.update(giftRef,{claimed:true,claimedAt:clock(),appliedToSave:true,items:gift.items});
      return gift;
    });
  },

  async listRecent(limitCount = 30) {
    const snap = await getDocs(query(collection(db, 'admin_gifts'), orderBy('createdAt', 'desc')));
    const rows = [];
    snap.forEach(docSnap => { if (rows.length < limitCount) rows.push({ id: docSnap.id, ...docSnap.data() }); });
    return rows;
  }
};

  return {EventRaidAPI,RaidBossAPI,AdminGiftAPI};
}
