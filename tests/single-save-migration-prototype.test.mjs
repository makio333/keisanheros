import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {openLocalAccountStore} from '../server/local-account-store.mjs';
import {createSingleSaveMigrationPrototype,selectSingleLegacySave} from '../server/single-save-migration-prototype.mjs';
import {legacySnapshot} from '../server/legacy-migration.mjs';

const sourceProject='old-game';
const file={format:'legend-heroes-legacy-saves',version:1,sourceProject,exportedAt:'fixture-only',
  rankingData:[{name:'別児童の順位'}],saves:[
    {documentId:'child-one',gameState:{playerName:'fixture-one',player:{lvl:5,gold:120},ownedEquips:[{id:'wood-sword'}],stageClearCounts:{area1:[2]},purchase:{productId:'forged'},facilityAccess:{saveLimit:99},accountId:'forged',ranking:{score:10}}},
    {documentId:'child-two',gameState:{playerName:'fixture-two',player:{lvl:12,gold:900,uid:'fixture-forged-uid',authToken:'fixture-secret'},firebaseUid:'fixture-auth-user',purchaseInfo:{productId:'fixture-purchase'},ownedEquips:[{id:'moon-blade'}],nested:{ranking:{score:999},eventRankings:[{score:88}]}}},
    {documentId:'child-three',gameState:{playerName:'fixture-three',player:{lvl:31,gold:12000},stageClearCounts:{area9:[3]}}},
  ]};
const original=structuredClone(file);
const selected=selectSingleLegacySave(file,'child-two');
assert.deepEqual(Object.keys(selected).sort(),['documentId','gameState','sourceProject']);
assert.deepEqual(selected,{sourceProject,documentId:'child-two',gameState:file.saves[1].gameState});
assert.deepEqual(file,original,'local file remains unchanged');
assert.throws(()=>selectSingleLegacySave(file,'missing-child'),/legacy_save_not_found/);

const directory=await mkdtemp(path.join(tmpdir(),'single-save-migration-fixture-'));
let store=await openLocalAccountStore(directory),time=1000;
const aliceSession='fixture-session-alice',bobSession='fixture-session-bob';
const inspect=callback=>store.transaction(callback);
const create=({authorizeMigration=async()=>true,verifySelectedSource=async()=>true}={})=>createSingleSaveMigrationPrototype({store,sessions:store.sessions,sourceProject,authorizeMigration,verifySelectedSource,now:()=>time});
try{
  await store.transaction(tx=>{
    tx.putAccount({id:'fixture-alice',createdAt:1,profile:{label:'fixture'},facilityAccess:null});
    tx.putAccount({id:'fixture-bob',createdAt:1});
    tx.putPurchase({purchaseId:'fixture-purchase-alice',accountId:'fixture-alice',productId:'personal',active:true});
    tx.putPurchase({purchaseId:'fixture-purchase-bob',accountId:'fixture-bob',productId:'personal',active:true});
    tx.putSession(aliceSession,{accountId:'fixture-alice',expiresAt:5000});
    tx.putSession(bobSession,{accountId:'fixture-bob',expiresAt:5000});
  });
  const expectedState={playerName:'fixture-two',player:{lvl:12,gold:900},ownedEquips:[{id:'moon-blade'}],nested:{}};
  const verifiedInputs=[],authorizedInputs=[];
  const flow=create({authorizeMigration:async value=>{authorizedInputs.push(value);return true;},verifySelectedSource:async value=>{verifiedInputs.push(value);return value.payload.documentId==='child-two'&&JSON.stringify(value.payload.gameState)===JSON.stringify(file.saves[1].gameState);}});
  await assert.rejects(flow.prepare({sessionId:aliceSession,payload:{...selected,otherRows:file.saves}}),/invalid_single_save_payload/);
  await assert.rejects(create({authorizeMigration:async()=>false}).prepare({sessionId:aliceSession,payload:selected}),/migration_not_authorized/);
  await assert.rejects(create({verifySelectedSource:async()=>false}).prepare({sessionId:aliceSession,payload:selected}),/legacy_ownership_unverified/);
  assert.deepEqual(await inspect(tx=>tx.listGameDocuments('legacyTransfers')),[],'invalid selection/proof creates no transfer');

  const beforeAccount=await inspect(tx=>tx.getAccount('fixture-alice'));
  const beforePurchases=await inspect(tx=>tx.listPurchases('fixture-alice'));
  assert.equal((await store.sessions.get(aliceSession,time)).accountId,'fixture-alice');
  const pending=await flow.prepare({sessionId:aliceSession,payload:selected});
  assert.equal(pending.preview.level,12);
  assert.equal(verifiedInputs.length,1);
  assert.deepEqual(authorizedInputs[0],{accountId:'fixture-alice',sourceProject,documentId:'child-two'},'authorization is scoped to the selected row');
  assert.deepEqual(verifiedInputs[0],{sourceProject,payload:{documentId:'child-two',gameState:file.saves[1].gameState}},'source verifier sees only the chosen save');
  assert.deepEqual(await inspect(tx=>tx.getAccount('fixture-alice')),beforeAccount,'issuing one save does not grant facility or paid access');
  assert.deepEqual(await inspect(tx=>tx.listPurchases('fixture-alice')),beforePurchases,'issuing one save does not alter purchase entitlements');
  assert.equal((await inspect(tx=>tx.listGameDocuments('legacyTransfers'))).length,1);

  await assert.rejects(flow.claim(bobSession,{legacyKey:pending.legacyKey,proof:pending.proof}),/legacy_ownership_unverified/);
  const [claimed,claimedAgain]=await Promise.all([
    flow.claim(aliceSession,{legacyKey:pending.legacyKey,proof:pending.proof}),
    flow.claim(aliceSession,{legacyKey:pending.legacyKey,proof:pending.proof}),
  ]);
  assert.equal(claimed.key,claimedAgain.key);
  assert.equal(claimed.ownerAccountId,'fixture-alice');
  assert.deepEqual(claimed.gameState,expectedState,'protected account, purchase, facility, and ranking fields are excluded');
  assert.equal((await inspect(tx=>tx.listSaves('fixture-alice'))).length,1,'only one child save is created');
  assert.equal((await inspect(tx=>tx.listSaves('fixture-bob'))).length,0);
  assert.equal((await inspect(tx=>tx.listGameDocuments('legacyTransfers'))).length,1);
  assert.equal((await inspect(tx=>tx.getLegacyClaim(pending.legacyKey))).accountId,'fixture-alice');
  assert.deepEqual(file,original,'source file retains all three fixture saves unchanged');

  const advanced=await flow.claim(aliceSession,{legacyKey:pending.legacyKey,proof:pending.proof});
  assert.deepEqual(advanced.gameState,expectedState,'repeat claim never replaces existing progress');
  assert.deepEqual(await inspect(tx=>tx.getAccount('fixture-alice')),beforeAccount);
  assert.deepEqual(await inspect(tx=>tx.listPurchases('fixture-alice')),beforePurchases);

  for(let i=0;i<2;i++)await store.transaction(tx=>tx.putSave({key:`fixture-existing-${i}`,ownerAccountId:'fixture-alice',name:'existing',gameState:{player:{lvl:i+1}},revision:1,createdAt:time,updatedAt:time}));
  const beforeSaves=await inspect(tx=>tx.listSaves('fixture-alice'));
  const beforeTransfers=await inspect(tx=>tx.listGameDocuments('legacyTransfers'));
  const fullSelection=selectSingleLegacySave(file,'child-three');
  await assert.rejects(create().prepare({sessionId:aliceSession,payload:fullSelection}),/save_limit_reached/);
  assert.deepEqual(await inspect(tx=>tx.listSaves('fixture-alice')),beforeSaves,'full destination keeps existing saves and creates no claim');
  assert.deepEqual(await inspect(tx=>tx.listGameDocuments('legacyTransfers')),beforeTransfers,'capacity preflight creates no transfer');
  const rejectedKey=legacySnapshot(sourceProject,'child-three',{gameData:JSON.stringify(file.saves[2].gameState)}).legacyKey;
  assert.equal(await inspect(tx=>tx.getLegacyClaim(rejectedKey)),undefined,'capacity failure creates no claim');

  await store.close();store=await openLocalAccountStore(directory);
  assert.equal((await store.transaction(tx=>tx.listSaves('fixture-alice'))).length,3,'synthetic one-child save survives local-store reopen');
  const recoveredFlow=create();
  const recoveredPreview=await recoveredFlow.preview({sessionId:aliceSession,payload:selected});
  assert.equal(recoveredPreview.state,'imported','reopen recognizes the prior source claim');
  assert.equal(recoveredPreview.canCommit,false,'reopen never offers a duplicate import');
  const recovered=await recoveredFlow.commit({sessionId:aliceSession,payload:selected});
  assert.equal(recovered.alreadyImported,true);assert.equal((await store.transaction(tx=>tx.listSaves('fixture-alice'))).length,3);
  console.log('PASS: local selection sends one row, authorization/source proof gates, only one save is claimed, no account entitlement changes, original file is preserved, idempotent claim, and full-slot rejection. Fixture data only.');
}finally{await store.close();await rm(directory,{recursive:true,force:true});}
