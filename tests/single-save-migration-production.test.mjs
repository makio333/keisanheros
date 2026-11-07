import assert from 'node:assert/strict';
import {createAccountSaveService} from '../server/account-saves.mjs';
import {createLegacyClaimVerifier,legacySnapshot} from '../server/legacy-migration.mjs';
import {createSingleSaveMigrationProductionHandler,createSingleSaveMigrationProductionService,createFirestoreLegacySourceReader,createPinnedSingleSaveMigrationAuthorization,singleSaveMigrationProductionRoutes} from '../server/single-save-migration-production.mjs';
import {createSingleSaveMigrationLocalStore} from '../server/single-save-migration-local-store.mjs';

const sourceProject='old-game',alice='mock-recipient-alice',bob='mock-recipient-bob',origin='https://migration.example.test',now=()=>1000;
const gameStates=new Map([
  ['child-one',{playerName:'fixture-one',player:{lvl:4,gold:60},stageClearCounts:{area1:[1]}}],
  ['child-two',{playerName:'fixture-two',player:{lvl:12,gold:900,uid:'must-drop',authToken:'must-drop',sessionId:'must-drop'},ownedEquips:[{id:'moon-blade'}],stageClearCounts:{area2:[2,3]},accountId:'must-drop',firebaseUid:'must-drop',apiKey:'must-drop',email:'must-drop',purchaseInfo:{product:'must-drop'},contractInfo:{record:'must-drop'},subscription:{tier:'must-drop'},ranking:{score:999},raidData:{score:900},nested:{eventRankings:[1]}}],
  ['child-three',{playerName:'fixture-three',player:{lvl:23,gold:2300},stageClearCounts:{area3:[1,2,3]}}],
]);
const sourceRecords=new Map([...gameStates].map(([id,state])=>[id,{deleted:false,gameData:JSON.stringify(state),ownerAttestation:`fixture-owner:${alice}:${id}`} ]));
const payloadFor=documentId=>({sourceProject,documentId,gameState:structuredClone(gameStates.get(documentId))});
const ownerProof=(sourceData,accountId,documentId)=>sourceData?.ownerAttestation===`fixture-owner:${accountId}:${documentId}`;

function makeHarness({authorize=async({accountId,sourceProject:project,documentId})=>accountId===alice&&project===sourceProject&&gameStates.has(documentId),verifyOwnership=async({accountId,documentId,sourceData})=>ownerProof(sourceData,accountId,documentId),accountServiceFactory}={}){
  const store=createSingleSaveMigrationLocalStore(),sessionId='fixture-alice-session',otherSession='fixture-bob-session',readCalls=[];
  const setup=store.transaction(tx=>{
    tx.putAccount({id:alice,createdAt:1,profile:{label:'fixture'},facilityAccess:null});
    tx.putAccount({id:bob,createdAt:1});
    tx.putPurchase({purchaseId:'fixture-alice-purchase',accountId:alice,productId:'personal',active:true});
    tx.putSession(sessionId,{accountId:alice,expiresAt:999999});tx.putSession(otherSession,{accountId:bob,expiresAt:999999});
  });
  const base=createAccountSaveService({store,sessions:store.sessions,verifyLegacyClaim:createLegacyClaimVerifier({now}),now});
  const accountSaves=accountServiceFactory?.(base)||base;
  const readSourceSave=async({sourceProject:project,documentId})=>{
    readCalls.push({sourceProject:project,documentId});
    if(project!==sourceProject)throw Error('migration_source_mismatch');
    const data=sourceRecords.get(documentId);return data?{documentId,data:structuredClone(data),sourceUpdateTime:1234}:null;
  };
  const service=createSingleSaveMigrationProductionService({store,accountSaves,sourceProject,readSourceSave,verifySourceOwnership:verifyOwnership,authorizeMigration:authorize,now});
  return {store,setup,base,accountSaves,service,sessionId,otherSession,readCalls};
}

function fakeRequest(path,{method='POST',body,sessionId='fixture-alice-session',requestOrigin=origin,cookieName='__Host-legend-session'}={}){
  const headers={'content-type':'application/json',...(requestOrigin?{origin:requestOrigin}:{}),...(sessionId?{cookie:`${cookieName}=${sessionId}`}:{})};
  const req={method,url:path,headers,async *[Symbol.asyncIterator](){if(body!==undefined)yield Buffer.from(JSON.stringify(body));}};
  const res={status:0,headers:{},body:'',writeHead(status,value){this.status=status;this.headers=value;},end(value=''){this.body=value;}};
  return {req,res};
}
async function call(handler,path,options){const {req,res}=fakeRequest(path,options);assert.equal(await handler(req,res),true);return {status:res.status,headers:res.headers,body:res.body?JSON.parse(res.body):null};}

const readerCalls=[];
const firestoreReader=createFirestoreLegacySourceReader({sourceProject,db:{collection(name){assert.equal(name,'saves');return {doc(id){return {async get(){readerCalls.push(id);const data=sourceRecords.get(id);return data?{exists:true,id,updateTime:{toMillis:()=>1234},data:()=>structuredClone(data)}:{exists:false,id};}};}};}}});
assert.equal((await firestoreReader({sourceProject,documentId:'child-two'})).documentId,'child-two');
assert.deepEqual(readerCalls,['child-two'],'Firestore adapter reads exactly one selected source document');
await assert.rejects(firestoreReader({sourceProject:'wrong-project',documentId:'child-two'}),/migration_source_mismatch/);
await assert.rejects(firestoreReader({sourceProject,documentId:'child-two/other'}),/invalid_legacy_source/);
assert.throws(()=>createSingleSaveMigrationProductionService({store:{transaction(){}},accountSaves:{summary(){},claimLegacySave(){},readSave(){}},sourceProject,readSourceSave:async()=>({}),authorizeMigration:async()=>true}),/source_proof_not_configured/);
const pinnedAuth=createPinnedSingleSaveMigrationAuthorization({sourceProject,now,approvedSelections:[{accountId:alice,documentId:'child-two',sourceDigest:'a'.repeat(64),expiresAt:2000}]});
assert.equal(await pinnedAuth({accountId:alice,sourceProject,documentId:'child-two',sourceDigest:'a'.repeat(64)}),true);
assert.equal(await pinnedAuth({accountId:bob,sourceProject,documentId:'child-two',sourceDigest:'a'.repeat(64)}),false);
assert.equal(await pinnedAuth({accountId:alice,sourceProject,documentId:'child-one',sourceDigest:'a'.repeat(64)}),false);
const expiredAuth=createPinnedSingleSaveMigrationAuthorization({sourceProject,now,approvedSelections:[{accountId:alice,documentId:'child-two',sourceDigest:'a'.repeat(64),expiresAt:900}]});
assert.equal(await expiredAuth({accountId:alice,sourceProject,documentId:'child-two',sourceDigest:'a'.repeat(64)}),false);

try{
  const h=makeHarness();await h.setup;
  const beforeAccount=await h.store.inspect(tx=>tx.getAccount(alice)),beforePurchases=await h.store.inspect(tx=>tx.listPurchases(alice));
  const baseline=h.store.writeCount;
  const preview=await h.service.preview({sessionId:h.sessionId,payload:payloadFor('child-two')});
  assert.equal(preview.canCommit,true);assert.equal(preview.child.playerName,'fixture-two');assert.equal(preview.destination.free,3);
  assert.equal(h.store.writeCount,baseline,'preview creates no transfer/save/claim');
  assert.equal(h.readCalls.length,1,'preview reads one source row');

  await assert.rejects(h.service.preview({sessionId:h.sessionId,payload:{...payloadFor('child-two'),otherChildren:[payloadFor('child-one')]}}),/invalid_single_save_payload/);
  await assert.rejects(h.service.preview({sessionId:h.sessionId,payload:{...payloadFor('child-two'),gameState:{...gameStates.get('child-two'),gold:2}}}),/legacy_source_payload_mismatch/);
  const unauthorized=makeHarness({authorize:async()=>false});await unauthorized.setup;
  await assert.rejects(unauthorized.service.preview({sessionId:unauthorized.sessionId,payload:payloadFor('child-two')}),/migration_not_authorized/);
  assert.equal(unauthorized.readCalls.length,0,'operator denial occurs before reading the source');await unauthorized.store.close();
  const unverified=makeHarness({verifyOwnership:async()=>false});await unverified.setup;
  const writesBeforeProof=unverified.store.writeCount;
  await assert.rejects(unverified.service.commit({sessionId:unverified.sessionId,payload:payloadFor('child-two')}),/legacy_ownership_unverified/);
  assert.equal(unverified.store.writeCount,writesBeforeProof,'missing owner proof cannot issue transfer or claim');await unverified.store.close();
  const readsBeforeWrongAccount=h.readCalls.length;
  await assert.rejects(h.service.preview({sessionId:h.otherSession,payload:payloadFor('child-two')}),/migration_not_authorized/);
  assert.equal(h.readCalls.length,readsBeforeWrongAccount,'another account is rejected before source read');

  const committed=await h.service.commit({sessionId:h.sessionId,payload:payloadFor('child-two')});
  assert.equal(committed.alreadyImported,false);assert.equal(committed.preview.playerName,'fixture-two');
  const saves=await h.store.inspect(tx=>tx.listSaves(alice));assert.equal(saves.length,1);
  assert.equal(saves[0].gameState.accountId,undefined);assert.equal(saves[0].gameState.firebaseUid,undefined);assert.equal(saves[0].gameState.apiKey,undefined);assert.equal(saves[0].gameState.email,undefined);
  assert.equal(saves[0].gameState.player.authToken,undefined);assert.equal(saves[0].gameState.player.sessionId,undefined);
  assert.equal(saves[0].gameState.purchaseInfo,undefined);assert.equal(saves[0].gameState.contractInfo,undefined);assert.equal(saves[0].gameState.subscription,undefined);
  assert.equal(saves[0].gameState.ranking,undefined);assert.equal(saves[0].gameState.raidData,undefined);
  assert.deepEqual(await h.store.inspect(tx=>tx.getAccount(alice)),beforeAccount);
  assert.deepEqual(await h.store.inspect(tx=>tx.listPurchases(alice)),beforePurchases);
  const writesAfterCommit=h.store.writeCount;
  const latest={...saves[0],gameState:{...saves[0].gameState,player:{...saves[0].gameState.player,gold:12345},revisionMarker:'newer'}};
  await h.store.transaction(tx=>tx.putSave(latest));
  const afterManualProgress=h.store.writeCount;
  const retry=await h.service.commit({sessionId:h.sessionId,payload:payloadFor('child-two')});
  assert.equal(retry.alreadyImported,true);assert.equal(h.store.writeCount,afterManualProgress);
  assert.equal((await h.base.readSave(h.sessionId,saves[0].key)).gameState.player.gold,12345,'retry preserves later progress');
  assert.ok(writesAfterCommit<afterManualProgress);

  const otherAccount=makeHarness({authorize:async({accountId,documentId})=>accountId===bob&&documentId==='child-one',verifyOwnership:async({accountId,documentId,sourceData})=>ownerProof(sourceData,accountId,documentId)});await otherAccount.setup;
  await assert.rejects(otherAccount.service.preview({sessionId:otherAccount.otherSession,payload:payloadFor('child-one')}),/legacy_ownership_unverified/);
  await otherAccount.store.close();
  await h.store.close();

  let failClaim=true;
  const midway=makeHarness({accountServiceFactory:base=>({...base,claimLegacySave:async(...args)=>{if(failClaim){failClaim=false;throw Error('synthetic_claim_interrupt');}return base.claimLegacySave(...args);}})});await midway.setup;
  const midwayWrites=midway.store.writeCount;
  await assert.rejects(midway.service.commit({sessionId:midway.sessionId,payload:payloadFor('child-two')}),/synthetic_claim_interrupt/);
  assert.equal((await midway.store.inspect(tx=>tx.listSaves(alice))).length,0);
  assert.ok(midway.store.writeCount>midwayWrites,'only an unclaimed transfer is left after the injected interruption');
  assert.equal((await midway.service.commit({sessionId:midway.sessionId,payload:payloadFor('child-two')})).alreadyImported,false);
  assert.equal((await midway.store.inspect(tx=>tx.listSaves(alice))).length,1);await midway.store.close();

  let loseResponse=true;
  const responseLoss=makeHarness({accountServiceFactory:base=>({...base,claimLegacySave:async(...args)=>{const value=await base.claimLegacySave(...args);if(loseResponse){loseResponse=false;throw Error('synthetic_lost_response');}return value;}})});await responseLoss.setup;
  await assert.rejects(responseLoss.service.commit({sessionId:responseLoss.sessionId,payload:payloadFor('child-two')}),/synthetic_lost_response/);
  const responseRecovery=await responseLoss.service.commit({sessionId:responseLoss.sessionId,payload:payloadFor('child-two')});
  assert.equal(responseRecovery.alreadyImported,true);assert.equal((await responseLoss.store.inspect(tx=>tx.listSaves(alice))).length,1);await responseLoss.store.close();

  const full=makeHarness();await full.setup;
  for(let index=0;index<3;index++)await full.store.transaction(tx=>tx.putSave({key:`occupied-${index}`,ownerAccountId:alice,name:'occupied',gameState:{player:{lvl:1}},revision:1,createdAt:1,updatedAt:1}));
  const fullWrites=full.store.writeCount,fullPreview=await full.service.preview({sessionId:full.sessionId,payload:payloadFor('child-three')});
  assert.equal(fullPreview.reason,'save_limit_reached');assert.equal(fullPreview.canCommit,false);assert.equal(full.store.writeCount,fullWrites);await full.store.close();

  const collision=makeHarness();await collision.setup;
  const snapshot=legacySnapshot(sourceProject,'child-three',{gameData:JSON.stringify(gameStates.get('child-three'))});
  await collision.store.transaction(tx=>tx.putSave({key:snapshot.legacyKey,ownerAccountId:alice,name:'existing-collision',gameState:{player:{lvl:3}},revision:1,createdAt:1,updatedAt:1}));
  const collisionWrites=collision.store.writeCount,collisionPreview=await collision.service.preview({sessionId:collision.sessionId,payload:payloadFor('child-three')});
  assert.equal(collisionPreview.reason,'legacy_save_id_collision');assert.equal(collision.store.writeCount,collisionWrites);await collision.store.close();

  const http=makeHarness();await http.setup;
  const handler=createSingleSaveMigrationProductionHandler({service:http.service,origin});
  assert.deepEqual(singleSaveMigrationProductionRoutes,{preview:'/api/legacy/single-save/preview',commit:'/api/legacy/single-save/commit'});
  const httpPreview=await call(handler,singleSaveMigrationProductionRoutes.preview,{body:payloadFor('child-two')});
  assert.equal(httpPreview.status,200);assert.equal(httpPreview.body.canCommit,true);
  const badConfirm=await call(handler,singleSaveMigrationProductionRoutes.commit,{body:{...payloadFor('child-two'),confirm:false}});
  assert.equal(badConfirm.status,400);assert.equal(badConfirm.body.error,'invalid_confirmation');
  const wrongOrigin=await call(handler,singleSaveMigrationProductionRoutes.preview,{body:payloadFor('child-two'),requestOrigin:'https://attacker.example.test'});
  assert.equal(wrongOrigin.status,403);
  const noSession=await call(handler,singleSaveMigrationProductionRoutes.preview,{body:payloadFor('child-two'),sessionId:''});
  assert.equal(noSession.status,401);
  const httpCommit=await call(handler,singleSaveMigrationProductionRoutes.commit,{body:{...payloadFor('child-two'),confirm:true}});
  assert.equal(httpCommit.status,200);assert.equal((await http.store.inspect(tx=>tx.listSaves(alice))).length,1);
  assert.equal(await handler({...fakeRequest('/api/unrelated').req},{writeHead(){},end(){}}),false);
  await http.store.close();
  console.log('PASS: production adapter uses authenticated account-save claims; exact one-source-row proof + operator gate; read-only Firestore reader; protected-field filtering; capacity/ownership/collision/retry recovery; HTTP origin/session/confirmation checks. Synthetic stores only; no route mount or real Firebase connection.');
}finally{}
