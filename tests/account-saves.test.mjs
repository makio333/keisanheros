import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createServer} from 'node:http';
import {createAccountSaveService,DEFAULT_ACCOUNT_PRODUCTS} from '../server/account-saves.mjs';
import {openLocalAccountStore} from '../server/local-account-store.mjs';
import {createLineLogin} from '../server/line-login.mjs';
import {createLineLoginHandler} from '../server/line-login-http.mjs';
import {createAccountSaveHandler} from '../server/account-saves-http.mjs';

const directory=await mkdtemp(path.join(tmpdir(),'legend-account-fixture-'));
let db=await openLocalAccountStore(directory),handler,nonce,subject='fixture-purchaser-one';
const server=createServer((req,res)=>handler(req,res).then(handled=>{if(!handled){res.writeHead(404);res.end();}}));
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
try{
  await assert.rejects(openLocalAccountStore(directory),/local_store_already_open/);
  const origin=`http://127.0.0.1:${server.address().port}`,receipts=new Map(),proofs=new Map();
  const legacyKey='typing_rpg_save_v3::legacy-fixture',legacyOriginal={playerName:'fixture-child',player:{gold:123},stageClearCounts:{area1:[3]}};
  const createService=()=>createAccountSaveService({store:db,sessions:db.sessions,verifyReceipt:async evidence=>structuredClone(receipts.get(evidence)),verifyLegacyClaim:async({proof})=>structuredClone(proofs.get(proof))});
  let service=createService();
  function wire(){
    const login=createLineLogin({channelId:'fixture',channelSecret:'TEST_ONLY_NOT_A_REAL_SECRET',providerId:'fixture-provider',redirectUri:origin+'/api/auth/line/callback',store:db.auth,fetchImpl:async url=>({ok:true,json:async()=>url.endsWith('/token')?{id_token:'MOCK_ID_TOKEN'}:{iss:'https://access.line.me',aud:'fixture',nonce,sub:subject,exp:Date.now()/1000+60,iat:Date.now()/1000,auth_time:Date.now()/1000}})});
    const auth=createLineLoginHandler({login,sessions:db.sessions,origin}),accounts=createAccountSaveHandler({service,origin});
    handler=async(req,res)=>await auth(req,res)||await accounts(req,res);
  }
  wire();
  async function request(url,{cookie='',method='GET',body,requestOrigin=origin}={}){
    return fetch(origin+url,{method,redirect:'manual',headers:{Origin:requestOrigin,...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
  }
  async function login(){
    let res=await request('/api/auth/line/start',{method:'POST'});const cookie=res.headers.get('set-cookie').split(';')[0];
    const auth=new URL((await res.json()).authorizationUrl);nonce=auth.searchParams.get('nonce');
    res=await request(`/api/auth/line/callback?state=${auth.searchParams.get('state')}&code=fixture`,{cookie});assert.equal(res.status,303);
    return res.headers.get('set-cookie').split(';')[0];
  }
  async function grant(accountId,productId,eventId,purchaseId=eventId){
    receipts.set(eventId,{accountId,productId,eventId,purchaseId});return service.applyPurchaseEvidence(eventId);
  }
  let res=await request('/api/account');assert.equal(res.status,401);
  const alice=await login(),aliceSession=alice.split('=')[1];
  const accountA=await service.summary(aliceSession);assert.equal(accountA.saveLimit,0);
  res=await request('/api/saves',{cookie:alice,method:'POST',body:{name:'fixture',gameState:{},saveLimit:100,ownerAccountId:'forged'}});assert.equal(res.status,403);
  await assert.rejects(service.applyPurchaseEvidence({verified:true,accountId:accountA.accountId,productId:'organization20'}),/unverified_purchase/);
  assert.equal((await grant(accountA.accountId,'personal','purchase-a')).saveLimit,3);
  const requests=await Promise.all(Array.from({length:12},(_,i)=>request('/api/saves',{cookie:alice,method:'POST',body:{name:`fixture-${i}`,gameState:{player:{gold:i}},ownerAccountId:'other-account',saveLimit:100}})));
  assert.equal(requests.filter(res=>res.status===201).length,3,'concurrent creation cannot exceed three saves');
  assert.equal(requests.filter(res=>res.status===409).length,9);
  const saves=await service.listSaves(aliceSession);assert.equal(saves.length,3);
  const chosen=await service.readSave(aliceSession,saves[0].key);assert.equal(chosen.ownerAccountId,accountA.accountId);
  assert.ok(chosen.key.startsWith('typing_rpg_save_v3::'));
  res=await request('/api/saves/'+encodeURIComponent(chosen.key),{cookie:alice,method:'PUT',body:{revision:chosen.revision,gameState:{player:{gold:99}},ownerAccountId:'forged'}});assert.equal(res.status,200);
  res=await request('/api/saves/'+encodeURIComponent(chosen.key),{cookie:alice,method:'PUT',body:{revision:chosen.revision,gameState:{player:{gold:1}}}});assert.equal(res.status,409,'stale device cannot overwrite newer save');
  res=await request('/api/saves',{cookie:alice,method:'POST',requestOrigin:'https://attacker.invalid',body:{name:'forged',gameState:{}}});assert.equal(res.status,403);
  subject='fixture-purchaser-two';const bob=await login(),bobSession=bob.split('=')[1],accountB=await service.summary(bobSession);
  await grant(accountB.accountId,'personal','purchase-b');
  res=await request('/api/saves/'+encodeURIComponent(chosen.key),{cookie:bob});assert.equal(res.status,404);
  res=await request('/api/saves/'+encodeURIComponent(chosen.key),{cookie:bob,method:'PUT',body:{revision:2,gameState:{player:{gold:0}}}});assert.equal(res.status,404);
  assert.equal((await service.listSaves(bobSession)).length,0);
  await assert.rejects(service.claimLegacySave(aliceSession,{legacyKey,proof:'unknown'}),/legacy_ownership_unverified/);
  proofs.set('proof-a',{accountId:accountA.accountId,legacyKey,name:'fixture-legacy',gameState:structuredClone(legacyOriginal)});
  await assert.rejects(service.claimLegacySave(aliceSession,{legacyKey,proof:'proof-a'}),/save_limit_reached/);
  assert.equal((await grant(accountA.accountId,'organization10','org-10')).saveLimit,10);
  const imported=await service.claimLegacySave(aliceSession,{legacyKey,proof:'proof-a'});assert.equal(imported.key,legacyKey);assert.deepEqual(imported.gameState,legacyOriginal);
  assert.deepEqual(legacyOriginal,{playerName:'fixture-child',player:{gold:123},stageClearCounts:{area1:[3]}},'legacy source remains unchanged');
  const edited=await service.updateSave(aliceSession,{key:legacyKey,revision:1,gameState:{...legacyOriginal,player:{gold:456}}});
  assert.deepEqual(await service.claimLegacySave(aliceSession,{legacyKey,proof:'proof-a'}),edited,'repeat claim never resets newer progress');
  proofs.set('proof-b',{accountId:accountB.accountId,legacyKey,gameState:legacyOriginal});
  await assert.rejects(service.claimLegacySave(bobSession,{legacyKey,proof:'proof-b'}),/legacy_already_claimed/);
  receipts.set('forged-reuse',{accountId:accountB.accountId,productId:'personal',eventId:'forged-reuse',purchaseId:'purchase-a'});
  await assert.rejects(service.applyPurchaseEvidence('forged-reuse'),/purchase_identity_conflict/);
  assert.equal((await grant(accountA.accountId,'organization20','org-20')).saveLimit,20);
  assert.equal((await service.applyPurchaseEvidence('org-20')).alreadyApplied,true);
  assert.equal((await grant(accountA.accountId,'personal','personal-again')).saveLimit,20,'products specify total capacity, not subscriptions or additive child accounts');
  const custom=createAccountSaveService({store:db,sessions:db.sessions,products:{...DEFAULT_ACCOUNT_PRODUCTS,organization42:{kind:'organization',saveLimit:42}},verifyReceipt:async()=>({accountId:accountB.accountId,productId:'organization42',eventId:'custom-42',purchaseId:'custom-42'})});
  assert.equal((await custom.applyPurchaseEvidence('verified-fixture')).saveLimit,42,'organization capacity is server-configurable');
  for(const purchaseId of ['org-10','org-20'])await db.transaction(tx=>tx.putPurchase({...tx.getPurchase(purchaseId),active:false}));
  assert.equal((await service.summary(aliceSession)).saveLimit,3);
  assert.equal((await service.summary(aliceSession)).used,4);
  await assert.rejects(service.createSave(aliceSession,{name:'fixture-over-cap',gameState:{}}),/save_limit_reached/);
  assert.equal((await service.readSave(aliceSession,legacyKey)).gameState.player.gold,456,'lower capacity never deletes existing children');
  for(const purchaseId of ['org-10','org-20'])await db.transaction(tx=>tx.putPurchase({...tx.getPurchase(purchaseId),active:true}));
  assert.throws(()=>createAccountSaveService({store:db,sessions:db.sessions,products:{wrong:{kind:'personal',saveLimit:4}}}),/invalid_product_catalog/);
  const content=await readFile(path.join(directory,'accounts.json'),'utf8');
  assert.equal(content.includes('TEST_ONLY_NOT_A_REAL_SECRET'),false);assert.equal(content.includes('MOCK_ID_TOKEN'),false);
  await db.close();db=await openLocalAccountStore(directory);service=createService();wire();
  assert.equal((await service.summary(aliceSession)).saveLimit,20);
  assert.equal((await service.summary(aliceSession)).used,4);
  assert.equal((await service.readSave(aliceSession,chosen.key)).gameState.player.gold,99);
  assert.equal((await service.readSave(aliceSession,legacyKey)).gameState.player.gold,456);
  subject='fixture-purchaser-one';const anotherDevice=await login();
  assert.equal((await service.summary(anotherDevice.split('=')[1])).accountId,accountA.accountId);
  assert.equal((await service.listSaves(anotherDevice.split('=')[1])).length,4);
  const raw=JSON.parse(await readFile(path.join(directory,'accounts.json'),'utf8'));assert.equal(raw.accounts.length,2,'three child saves are not three LINE accounts');
  console.log('PASS: LINE -> persistent local account -> verified entitlement -> 3/10/20 slots, concurrent cap, ownership, revisions, restart/cross-device restoration, safe/idempotent legacy claims. All identities/payment proofs are fixtures.');
}finally{await new Promise(resolve=>server.close(resolve));await db.close();await rm(directory,{recursive:true,force:true});}
