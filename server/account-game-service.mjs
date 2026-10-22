import {createGameCloudAPIs} from '../game_cloud_apis.js';
import {createGameDocumentAdapter} from './game-document-adapter.mjs';
import {accountSaveLimit} from './account-access.mjs';

const allowed={RaidBossAPI:['syncPlayer','settleReward','getRankings','getHistory','getGlobalBoss','receiveCheers','sendCheer'],EventRaidAPI:['recordBest','getRankings','finalizeRankings','claimFinalReward'],AdminGiftAPI:['send','fetchPending','claim','claimToSave','listRecent','listTargets','permissions']};
const fail=code=>{throw Error(code);};
const integer=(value,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(value) && value>=0 && value<=max;
const string=value=>typeof value==='string' && value.length>0 && value.length<=256;
const eventId=value=>{if(!['halloween_2026_raid_v1','halloween_2026_raid_v1_kanji'].includes(value))fail('invalid_game_request');return value;};
const bossId=value=>{if(value!=null && !/^boss(?:1|_\d{1,8})$/.test(value))fail('invalid_game_request');return value;};
function profile(game){
  const equipment={};
  for(const type of ['weapon','armor','accessory']){
    const owned=game.ownedEquips?.find(item=>item.uid===game.equipment?.[type]?.uid);
    equipment[type+'Id']=owned?.id||null;equipment[type+'Rarity']=owned?.rarity||1;
  }
  return {playerName:game.playerName||'勇者',avatar:game.avatar||'',avatarBackground:game.avatarBackground||'default',avatarHolographic:!!game.avatarHolographic,avatarBackgroundHolographic:!!game.avatarBackgroundHolographic,avatarDecoration:game.avatarDecoration||'',level:game.player?.lvl||1,equipment};
}
const publicRank=row=>Object.fromEntries(['slotKey','playerName','avatar','avatarBackground','avatarHolographic','avatarBackgroundHolographic','avatarDecoration','level','equipment','participated','totalDamage','bestKills','totalKills','cheerCount','excludedFromRanking','challengeCount'].filter(key=>row[key]!==undefined).map(key=>[key,row[key]]));

export function createAccountGameService({store,now=Date.now}){
  return {async call(sessionId,{api,method,args=[],revisions={}}){
    if(!Object.hasOwn(allowed,api) || !allowed[api].includes(method) || !Array.isArray(args) || args.length>4 || !revisions || typeof revisions!=='object' || Array.isArray(revisions))fail('invalid_game_request');
    return store.transaction(async tx=>{
      const session=await tx.getSession(sessionId),account=session?.expiresAt>now()?await tx.getAccount(session.accountId):null;
      if(!account)fail('authentication_required');
      const admin=Array.isArray(account.roles) && account.roles.includes('admin');
      if(api==='AdminGiftAPI' && method==='permissions')return {result:{admin},saves:[]};
      const adminOnly=api==='AdminGiftAPI' && ['send','listRecent','listTargets'].includes(method);
      if(adminOnly && !admin)fail('admin_required');
      if(!adminOnly && !await accountSaveLimit(tx,account,undefined,now()))fail('purchase_required');
      async function own(key,write=false){
        if(!string(key))fail('invalid_game_request');
        const row=await tx.getSave(key);if(!row || row.ownerAccountId!==account.id)fail('save_not_found');
        if(write && (!integer(revisions[key]) || revisions[key]!==row.revision))fail('save_revision_conflict');
        return row;
      }
      const storage=createGameDocumentAdapter(tx,{accountId:account.id,now});
      const apis=createGameCloudAPIs({...storage,now});let callArgs=args,result;
      if(api==='RaidBossAPI' && method==='getGlobalBoss' && !await tx.getGameDocument('raidGlobal/currentBoss')){
        const first=(await tx.listSaves(account.id))[0];
        if(first)await apis.RaidBossAPI.syncPlayer(first.key,profile(first.gameState),{});
      }
      if(api==='RaidBossAPI'){
        if(method==='syncPlayer'){
          const save=await own(args[0],true),progress=args[2]||{};
          if(!progress || typeof progress!=='object' || !Array.isArray(progress.events||[]) || (progress.events||[]).length>100)fail('invalid_game_request');
          const events=(progress.events||[]).map(event=>{
            if(!event || !string(event.id) || !integer(event.damage))fail('invalid_game_request');
            for(const field of ['createdAt','fightStartedAt'])if(event[field]!=null && !integer(event[field]))fail('invalid_game_request');
            return {id:event.id,bossId:bossId(event.bossId),damage:event.damage,createdAt:event.createdAt,fightStartedAt:event.fightStartedAt};
          });
          if(progress.participationAt!=null && !integer(progress.participationAt))fail('invalid_game_request');
          callArgs=[save.key,profile(save.gameState),{bossId:bossId(progress.bossId),participated:progress.participated===true,participationAt:progress.participationAt,legacyDamage:save.gameState.raidProgress?.legacyDamage||0,events,state:save.gameState}];
        }else if(method==='settleReward'){const save=await own(args[0],true);callArgs=[save.key,bossId(args[1]),save.gameState];}
        else if(method==='receiveCheers'){await own(args[0]);callArgs=[args[0]];}
        else if(method==='sendCheer'){await own(args[0]);if(!string(args[1]) || !await tx.getSave(args[1]))fail('save_not_found');}
        else if(method==='getRankings')callArgs=[bossId(args[0])];
      }else if(api==='EventRaidAPI'){
        eventId(args[0]);
        if(method==='recordBest'){
          const save=await own(args[1]),record=args[2]||{};
          if(!integer(record.bestKills) || !Array.isArray(record.runs||[]) || (record.runs||[]).length>100)fail('invalid_game_request');
          const runs=(record.runs||[]).map(run=>{if(!run || !string(run.id) || !integer(run.kills) || !integer(run.finishedAt))fail('invalid_game_request');return {id:run.id,kills:run.kills,finishedAt:run.finishedAt};});
          const days=record.participationDays||[record.participationDay].filter(Boolean);
          if(!Array.isArray(days) || days.length>31 || days.some(day=>typeof day!=='string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)))fail('invalid_game_request');
          callArgs=[args[0],save.key,{...profile(save.gameState),bestKills:record.bestKills,runs,participationDays:days}];
        }else if(method==='claimFinalReward'){const save=await own(args[1],true);callArgs=[args[0],save.key,save.gameState];}
      }else if(api==='AdminGiftAPI'){
        if(method==='listTargets')result=(await tx.listAllSaves()).filter(row=>!row.gameState.archived).map(row=>({key:row.key,name:row.gameState.playerName||row.name,lvl:row.gameState.player?.lvl||1}));
        else if(method==='send'){
          const targets=args[0],gift=args[1];
          if(!Array.isArray(targets) || targets.length<1 || targets.length>100 || !gift || !integer(gift.gold||0,1e9) || !Array.isArray(gift.items||[]) || (gift.items||[]).length>100)fail('invalid_game_request');
          const verifiedTargets=[];
          for(const target of targets){if(!target || !string(target.slotKey))fail('invalid_game_request');const save=await tx.getSave(target.slotKey);if(!save)fail('save_not_found');verifiedTargets.push({slotKey:save.key,playerName:save.gameState.playerName||save.name});}
          if(new Set(verifiedTargets.map(t=>t.slotKey)).size!==verifiedTargets.length)fail('invalid_game_request');
          const items=(gift.items||[]).map(item=>{
            if(!item || !string(item.id) || !integer(item.count,999) || item.count<1 || item.kind && !['item','equip','ticket','medal','decoration'].includes(item.kind) || item.rarity!=null && (!integer(item.rarity,6)||item.rarity<1))fail('invalid_game_request');
            return {id:item.id,count:item.count,...(item.kind?{kind:item.kind}:{}),...(item.rarity?{rarity:item.rarity}:{})};
          });
          callArgs=[verifiedTargets,{gold:gift.gold||0,items,message:String(gift.message||'').slice(0,200)}];
        }else if(method==='fetchPending'){await own(args[0]);}
        else if(method==='claimToSave'){
          if(!string(args[0]))fail('invalid_game_request');const save=await own(args[1],true);
          callArgs=[args[0],save.key,save.gameState];
        }else if(method==='claim'){
          if(!string(args[0]))fail('invalid_game_request');const gift=await tx.getGameDocument('admin_gifts/'+args[0]);
          if(!gift)result=false;else await own(gift.targetSlotKey);
        }else if(method==='listRecent'){
          if(args[0]!=null && (!integer(args[0],100)||args[0]<1))fail('invalid_game_request');
        }
      }
      if(result===undefined)result=await apis[api][method](...callArgs);
      if(method==='getRankings')result=result.map(publicRank);
      const saves=[];for(const key of storage.changed)saves.push(structuredClone(await tx.getSave(key)));
      return {result,saves};
    });
  }};
}
