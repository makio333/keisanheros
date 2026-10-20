import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createServer} from 'node:http';
import {openLocalAccountStore} from '../server/local-account-store.mjs';
import {createAccountSaveService} from '../server/account-saves.mjs';
import {createAccountSaveHandler} from '../server/account-saves-http.mjs';
import {createAccountGameService} from '../server/account-game-service.mjs';
import {createAccountGameHandler} from '../server/account-game-http.mjs';
import {createAccountTransport} from '../account_client.js';
import {installAccountGameAPIs} from '../account_game_client.js';
import {EVENT_RAID_FINAL_AT} from '../event_raid.js';
import {applyGiftPayload} from '../economy.js';

const directory=await mkdtemp(path.join(tmpdir(),'legend-game-api-'));
let db=await openLocalAccountStore(directory),time=Date.parse('2026-10-20T01:00:00Z'),dispatch,origin,accounts;
const server=createServer((req,res)=>dispatch(req,res).then(handled=>{if(!handled){res.writeHead(404);res.end();}}));
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin=`http://127.0.0.1:${server.address().port}`;
const ids={},sessions={a:'a'.repeat(64),b:'b'.repeat(64),admin:'c'.repeat(64)};
try{
  async function wire(){
    accounts=createAccountSaveService({store:db,sessions:db.sessions,now:()=>time,verifyReceipt:async who=>({accountId:ids[who],productId:'personal',eventId:'purchase-'+who,purchaseId:'purchase-'+who})});
    const saves=createAccountSaveHandler({service:accounts,origin}),game=createAccountGameHandler({service:createAccountGameService({store:db,now:()=>time}),origin});
    dispatch=async(req,res)=>await saves(req,res)||await game(req,res);
  }
  for(const who of ['a','b','admin']){
    const identity=await db.auth.resolveIdentity({provider:'line',providerId:'fixture',subject:'mock-'+who});ids[who]=identity.accountId;
    await db.sessions.create(sessions[who],{accountId:ids[who],expiresAt:time+365*86400000});
  }
  await db.transaction(tx=>tx.putAccount({...tx.getAccount(ids.admin),roles:['admin']}));await wire();
  for(const who of ['a','b','admin'])await accounts.applyPurchaseEvidence(who);
  const state=name=>({playerName:name,avatar:'hero',player:{lvl:5,gold:10},ownedEquips:[],equipment:{},items:[],nextUid:1,updatedAt:time});
  const saveA=await accounts.createSave(sessions.a,{name:'fixture-a',gameState:state('fixture-a')}),saveB=await accounts.createSave(sessions.b,{name:'fixture-b',gameState:state('fixture-b')});
  const fetchFor=who=>(url,options={})=>fetch(origin+url,{...options,headers:{...options.headers,Origin:origin,Cookie:'legend-local-session='+sessions[who]}});
  async function raw(who,body,extra={}){return fetch(origin+'/api/game',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,...(who?{Cookie:'legend-local-session='+sessions[who]}:{}),...extra},body:JSON.stringify(body)});}
  const rpc=(api,method,args=[],revisions={})=>({api,method,args,revisions});
  const a=await createAccountTransport({fetchImpl:fetchFor('a')}),b=await createAccountTransport({fetchImpl:fetchFor('b')}),admin=await createAccountTransport({fetchImpl:fetchFor('admin')});
  const A=installAccountGameAPIs(a,{target:{},pollMs:20}),B=installAccountGameAPIs(b,{target:{},pollMs:20}),Admin=installAccountGameAPIs(admin,{target:{}});
  let response=await raw(null,rpc('RaidBossAPI','getGlobalBoss'));assert.equal(response.status,401);
  response=await raw('a',rpc('RaidBossAPI','getGlobalBoss'),{Origin:'https://attacker.invalid'});assert.equal(response.status,403);
  response=await raw('a',rpc('RaidBossAPI','constructor'));assert.equal(response.status,400);
  assert.deepEqual(await A.AdminGiftAPI.permissions(),{admin:false});assert.deepEqual(await Admin.AdminGiftAPI.permissions(),{admin:true});
  await assert.rejects(A.AdminGiftAPI.listTargets(),/admin_required/);await assert.rejects(A.AdminGiftAPI.listRecent(30),/admin_required/);
  response=await raw('a',{...rpc('AdminGiftAPI','send',[[{slotKey:saveB.key}],{gold:100}]),roles:['admin'],accountId:ids.admin});assert.equal(response.status,403);
  const targets=await Admin.AdminGiftAPI.listTargets();assert.equal(targets.length,2);assert.equal(targets.some(row=>'gameState' in row || 'ownerAccountId' in row),false);
  assert.deepEqual(await admin.fetchAllSlots(),[],'gift administration does not grant ordinary save access');
  response=await fetchFor('admin')('/api/saves?ownerAccountId='+ids.b);assert.deepEqual(await response.json(),[]);
  for(const key of [saveA.key,saveB.key]){
    response=await fetchFor('admin')('/api/saves/'+encodeURIComponent(key));assert.equal(response.status,404);
    assert.equal(admin.owns(key),false);
  }
  await assert.rejects(A.RaidBossAPI.syncPlayer(saveB.key,{},{}),/save_not_found/);
  await assert.rejects(A.AdminGiftAPI.fetchPending(saveB.key),/save_not_found/);
  await assert.rejects(A.EventRaidAPI.recordBest('halloween_2026_raid_v1',saveB.key,{bestKills:99}),/save_not_found/);

  let watched=0;const stop=B.RaidBossAPI.watchBoss(()=>watched++);
  await A.RaidBossAPI.syncPlayer(saveA.key,{playerName:'forged'},{bossId:'boss_50',participated:true,state:saveA.gameState});
  const first=await a.callGameAPI('RaidBossAPI','syncPlayer',[saveA.key,{playerName:'forged'},{bossId:'boss_50',events:[1,2,3].map((n)=>({id:'a'+n,bossId:'boss_50',damage:n===3?200:250,createdAt:time,fightStartedAt:time-1})),state:{player:{gold:999999}},claimed:{applied:true}}]);
  assert.equal(first.challengeCount,3);assert.equal(first.challenge2EquipTenCount,1);assert.equal(first.challenge3SkinTicketCount,1);
  const duplicate=await a.callGameAPI('RaidBossAPI','syncPlayer',[saveA.key,null,{bossId:'boss_50',events:[{id:'a1',damage:250}]}]);assert.equal(duplicate.challengeCount,3);
  assert.equal((await accounts.readSave(sessions.a,saveA.key)).gameState.player.gold,10,'caller fallback state is not authoritative');
  await B.RaidBossAPI.syncPlayer(saveB.key,{}, {bossId:'boss_50',participated:true,events:[{id:'b1',damage:400,fightStartedAt:time-1}],state:saveB.gameState});
  const global=await A.RaidBossAPI.getGlobalBoss();assert.equal(global.totalDamageDealt,1100);assert.equal(global.settlesAt-global.defeatedAt,60000,'same existing one-minute rule');
  await a.callGameAPI('RaidBossAPI','syncPlayer',[saveA.key,null,{bossId:'boss_50',events:[{id:'simultaneous',damage:10,fightStartedAt:time-1}]}]);
  const ranks=await B.RaidBossAPI.getRankings('boss_50');assert.equal(ranks[0].playerName,'fixture-a');assert.equal(ranks[0].totalDamage,710);assert.equal(ranks.some(row=>'appliedEvents' in row || 'gameState' in row),false);
  const until=Date.now()+1000;while(watched<2 && Date.now()<until)await new Promise(resolve=>setTimeout(resolve,25));assert.ok(watched>=2,'polling reflects shared HP on another client');stop();
  const stopped=watched;await new Promise(resolve=>setTimeout(resolve,60));assert.equal(watched,stopped);
  time=global.settlesAt+1;const final=await a.callGameAPI('RaidBossAPI','syncPlayer',[saveA.key,null,{bossId:'boss_50'}]);assert.ok(final.finalizedAt);assert.equal((await A.RaidBossAPI.getGlobalBoss()).finalHitters.length,2);
  const beforePayout=(await accounts.readSave(sessions.a,saveA.key)).gameState;
  const payouts=await Promise.all([A.RaidBossAPI.settleReward(saveA.key,'boss_50',beforePayout),A.RaidBossAPI.settleReward(saveA.key,'boss_50',beforePayout)]);
  assert.equal(payouts.filter(row=>row.eligible && !row.alreadyClaimed).length,1);assert.equal((await accounts.readSave(sessions.a,saveA.key)).gameState.raidCoins,50);
  const next=await B.RaidBossAPI.syncPlayer(saveB.key,{}, {bossId:'boss_50'});assert.equal(next.bossId,'boss_60');assert.equal((await B.RaidBossAPI.getGlobalBoss()).totalDamageDealt,0);assert.equal((await A.RaidBossAPI.getHistory())[0].bossId,'boss_50');
  response=await raw('a',rpc('RaidBossAPI','settleReward',[saveB.key,'boss_50'],{[saveB.key]:1}));assert.equal(response.status,404);
  response=await raw('a',rpc('RaidBossAPI','settleReward',[saveA.key,'boss_50'],{[saveA.key]:1}));assert.equal(response.status,409);

  const giftIds=await Admin.AdminGiftAPI.send([{slotKey:saveB.key,playerName:'forged'}],{gold:50,items:[{kind:'ticket',id:'raid-ticket',count:2}],message:'fixture gift'});
  assert.equal((await Admin.AdminGiftAPI.listRecent(30))[0].playerName,'fixture-b');assert.equal((await A.AdminGiftAPI.fetchPending(saveA.key)).length,0);
  await assert.rejects(A.AdminGiftAPI.claim(giftIds[0]),/save_not_found/);
  await assert.rejects(A.AdminGiftAPI.claimToSave(giftIds[0],saveB.key),/save_not_found/);
  const bState=(await accounts.readSave(sessions.b,saveB.key)).gameState;
  const deliveries=await Promise.all([B.AdminGiftAPI.claimToSave(giftIds[0],saveB.key,bState),B.AdminGiftAPI.claimToSave(giftIds[0],saveB.key,bState)]);
  assert.equal(deliveries.filter(Boolean).length,1);
  const delivered=(await accounts.readSave(sessions.b,saveB.key)).gameState;assert.equal(delivered.player.gold,60);assert.equal(delivered.raidTickets,2);
  const local=structuredClone(bState);applyGiftPayload(local,deliveries.find(Boolean));await b.saveSlot(saveB.key,local);
  assert.equal((await accounts.readSave(sessions.b,saveB.key)).gameState.player.gold,60,'RPC adopts the server save revision before the next ordinary save');

  const event='halloween_2026_raid_v1_kanji';
  await A.EventRaidAPI.recordBest(event,saveA.key,{bestKills:8,playerName:'forged',runs:[{id:'run-a',kills:8,finishedAt:time}],participationDay:'2026-10-20'});
  await B.EventRaidAPI.recordBest(event,saveB.key,{bestKills:14,runs:[{id:'run-b',kills:14,finishedAt:time}]});
  await B.EventRaidAPI.recordBest(event,saveB.key,{bestKills:14,runs:[{id:'run-b',kills:14,finishedAt:time}]});
  assert.equal((await A.EventRaidAPI.getRankings(event)).find(row=>row.slotKey===saveB.key).totalKills,14);
  await assert.rejects(A.EventRaidAPI.recordBest('other-event',saveA.key,{bestKills:1}),/invalid_game_request/);
  await assert.rejects(A.EventRaidAPI.recordBest(event,saveA.key,{bestKills:-1}),/invalid_game_request/);
  time=EVENT_RAID_FINAL_AT+1;assert.equal((await A.EventRaidAPI.finalizeRankings(event)).length,2);
  const finalGift=await B.EventRaidAPI.claimFinalReward(event,saveB.key);assert.equal(finalGift.rank,1);assert.equal(await B.EventRaidAPI.claimFinalReward(event,saveB.key),null);
  const eventSave=(await accounts.readSave(sessions.b,saveB.key)).gameState;assert.ok(eventSave.ownedEquips.some(item=>item.id==='halloween_rank_blade'));

  await db.close();db=await openLocalAccountStore(directory);await wire();
  assert.equal((await A.RaidBossAPI.getHistory())[0].bossId,'boss_50');assert.equal((await B.AdminGiftAPI.fetchPending(saveB.key)).length,0);
  assert.equal((await accounts.readSave(sessions.b,saveB.key)).gameState.ownedEquips.filter(item=>item.id==='halloween_rank_blade').length,1);
  await db.transaction(tx=>tx.putAccount({...tx.getAccount(ids.admin),roles:[]}));await assert.rejects(Admin.AdminGiftAPI.listTargets(),/admin_required/);
  await db.sessions.remove(sessions.a);await assert.rejects(A.RaidBossAPI.getGlobalBoss(),/authentication_required/);
  const legacyDirectory=await mkdtemp(path.join(tmpdir(),'legend-game-schema-'));
  try{
    const raw=JSON.parse(await readFile(path.join(directory,'accounts.json'),'utf8'));delete raw.gameDocuments;
    await writeFile(path.join(legacyDirectory,'accounts.json'),JSON.stringify(raw));
    const legacy=await openLocalAccountStore(legacyDirectory);
    try{const row=await legacy.transaction(tx=>tx.getSave(saveB.key));assert.equal(row.ownerAccountId,ids.b);assert.equal(row.gameState.player.gold,eventSave.player.gold);assert.equal((await legacy.transaction(tx=>tx.listGameDocuments('raidHistory'))).length,0);}finally{await legacy.close();}
  }finally{await rm(legacyDirectory,{recursive:true,force:true});}
  console.log('PASS: real local HTTP + account transport + shared existing raid/event/gift rules; ownership/admin denials, forged fallback rejection, concurrent/repeated payouts, polling unsubscribe, current save revisions and restart persistence. Fixtures only.');
}finally{await new Promise(resolve=>server.close(resolve));await db.close();await rm(directory,{recursive:true,force:true});}
