import assert from 'node:assert/strict';
import {createSingleSaveMigrationLocalApi} from '../server/single-save-migration-local-api.mjs';
import {createSingleSaveMigrationLocalStore} from '../server/single-save-migration-local-store.mjs';
import {createSingleSaveMigrationPrototype,selectSingleLegacySave} from '../server/single-save-migration-prototype.mjs';
import {legacySnapshot} from '../server/legacy-migration.mjs';

const origin='http://127.0.0.1:5187',sourceProject='old-game',alice='synthetic-alice',bob='synthetic-bob';
const rows=[
  {documentId:'child-one',gameState:{playerName:'fixture-one',player:{lvl:4,gold:60},stageClearCounts:{area1:[1]}}},
  {documentId:'child-two',gameState:{playerName:'fixture-two',player:{lvl:12,gold:900,uid:'not-an-auth-token'},ownedEquips:[{id:'moon-blade'}],stageClearCounts:{area2:[2,3]},accountId:'forged',purchase:{productId:'forged'},ranking:{score:999}}},
  {documentId:'child-three',gameState:{playerName:'fixture-three',player:{lvl:23,gold:2300}}},
];
const file={format:'legend-heroes-legacy-saves',version:1,sourceProject,saves:structuredClone(rows)};
const original=structuredClone(file),selected=selectSingleLegacySave(file,'child-two');
assert.deepEqual(Object.keys(selected).sort(),['documentId','gameState','sourceProject']);
assert.deepEqual(selected,{sourceProject,documentId:'child-two',gameState:rows[1].gameState});
assert.deepEqual(file,original);

function request(path,{method='GET',body,host='127.0.0.1:5187',requestOrigin=origin,remoteAddress='127.0.0.1'}={}){
  const headers={host,...(requestOrigin?{origin:requestOrigin}:{}),...(body?{'content-type':'application/json'}:{})};
  const req={method,url:path,headers,socket:{remoteAddress},async *[Symbol.asyncIterator](){if(body)yield Buffer.from(JSON.stringify(body));}};
  const response={status:0,headers:{},body:'',writeHead(status,values){this.status=status;this.headers=values;},end(text=''){this.body=text;}};
  return {req,res:response};
}
async function call(handler,path,options){const pair=request(path,options);const handled=await handler(pair.req,pair.res);assert.equal(handled,true);return {status:pair.res.status,headers:pair.res.headers,body:pair.res.body?JSON.parse(pair.res.body):null};}
function makeHarness({sourceProofConfigured=true,authorizationConfigured=true,afterTransferIssued,afterClaim,limit=3}={}){
  const store=createSingleSaveMigrationLocalStore(),now=()=>1000,sessionId='local-alice-session',sourceRegistry=new Map(rows.map(row=>[row.documentId,JSON.stringify(row.gameState)]));
  const init=store.transaction(tx=>{
    for(const account of [alice,bob]){
      tx.putAccount({id:account,createdAt:1,facilityAccess:{kind:'legacy-migration',active:true,sourceProject,legacyKeys:[],saveLimit:limit}});
      tx.putSession(account===alice?sessionId:'local-bob-session',{accountId:account,expiresAt:999999});
    }
  });
  const migration=createSingleSaveMigrationPrototype({store,sessions:store.sessions,sourceProject,now,
    authorizeMigration:async({accountId:target,sourceProject:project,documentId})=>authorizationConfigured&&target===alice&&project===sourceProject&&sourceRegistry.has(documentId),
    verifySelectedSource:async({sourceProject:project,payload})=>sourceProofConfigured&&project===sourceProject&&JSON.stringify(payload.gameState)===sourceRegistry.get(payload.documentId),
    afterTransferIssued,afterClaim,
  });
  const handler=createSingleSaveMigrationLocalApi({migration,sessionId,origin,sourceProofConfigured,authorizationConfigured,destinationLabel:'合成テスト移行先',now});
  return {store,init,migration,handler,sourceRegistry,sessionId};
}

try{
  const h=makeHarness();await h.init;
  const baseline=h.store.writeCount;
  const preview=await call(h.handler,'/__single-save-local/api/preview',{method:'POST',body:selected});
  assert.equal(preview.status,200);assert.equal(preview.body.child.playerName,'fixture-two');assert.equal(preview.body.destination.free,3);assert.equal(preview.body.canCommit,true);
  assert.equal(h.store.writeCount,baseline,'preview performs no persistent store writes');
  const cancelled=await call(h.handler,'/__single-save-local/api/cancel',{method:'POST',body:{previewId:preview.body.previewId}});
  assert.equal(cancelled.status,200);assert.equal(h.store.writeCount,baseline,'cancel performs no save, claim, or transfer writes');
  assert.equal((await call(h.handler,'/__single-save-local/api/commit',{method:'POST',body:{previewId:preview.body.previewId,confirm:true}})).status,404);

  const maliciousPayload={...selected,otherRows:rows};
  const invalid=await call(h.handler,'/__single-save-local/api/preview',{method:'POST',body:maliciousPayload});
  assert.equal(invalid.status,400);assert.equal(h.store.writeCount,baseline,'extra-row payload rejected without writes');
  const wrongSource=await call(h.handler,'/__single-save-local/api/preview',{method:'POST',body:{...selected,sourceProject:'wrong-project'}});
  assert.equal(wrongSource.status,400);assert.equal(h.store.writeCount,baseline);
  const corrupt=await call(h.handler,'/__single-save-local/api/preview',{method:'POST',body:{...selected,gameState:{player:null}}});
  assert.equal(corrupt.status,400);assert.equal(h.store.writeCount,baseline);

  const preview2=await call(h.handler,'/__single-save-local/api/preview',{method:'POST',body:selected});
  const completion=await call(h.handler,'/__single-save-local/api/commit',{method:'POST',body:{previewId:preview2.body.previewId,confirm:true}});
  assert.equal(completion.status,200);assert.equal(completion.body.completed,true);assert.equal(completion.body.alreadyImported,false);
  const saves=await h.store.inspect(tx=>tx.listSaves(alice));assert.equal(saves.length,1);assert.equal(saves[0].gameState.playerName,'fixture-two');
  assert.equal(saves[0].gameState.accountId,undefined);assert.equal(saves[0].gameState.player.uid,undefined);assert.equal(saves[0].gameState.purchase,undefined);assert.equal(saves[0].gameState.ranking,undefined);
  assert.equal((await h.store.inspect(tx=>tx.listSaves(bob))).length,0);
  const claim=await h.store.inspect(tx=>tx.getLegacyClaim(saves[0].key));assert.equal(claim.accountId,alice);
  const accountAfter=await h.store.inspect(tx=>tx.getAccount(alice));assert.equal(accountAfter.facilityAccess.saveLimit,3);
  assert.deepEqual(file,original,'source JSON remains unchanged');
  const writesAfterCommit=h.store.writeCount;
  const repeated=await call(h.handler,'/__single-save-local/api/commit',{method:'POST',body:{previewId:preview2.body.previewId,confirm:true}});
  assert.deepEqual(repeated.body,completion.body,'response retry is idempotent');assert.equal(h.store.writeCount,writesAfterCommit);
  const refreshed=await call(h.handler,'/__single-save-local/api/preview',{method:'POST',body:selected});
  assert.equal(refreshed.body.state,'imported');assert.equal(refreshed.body.canCommit,false,'reopening a completed row reports it without resubmitting');
  assert.equal(refreshed.body.reason,'already_imported');
  await h.store.close();

  const disabled=makeHarness({sourceProofConfigured:false,authorizationConfigured:false});await disabled.init;
  const disabledPreview=await call(disabled.handler,'/__single-save-local/api/preview',{method:'POST',body:selected});
  assert.equal(disabledPreview.status,200);assert.equal(disabledPreview.body.canCommit,false);
  const disabledWrites=disabled.store.writeCount;
  const refused=await call(disabled.handler,'/__single-save-local/api/commit',{method:'POST',body:{previewId:disabledPreview.body.previewId,confirm:true}});
  assert.equal(refused.status,503);assert.equal(refused.body.error,'source_proof_not_configured');
  assert.equal(disabled.store.writeCount,disabledWrites);
  await disabled.store.close();

  let injected=true;
  const interrupted=makeHarness({afterTransferIssued:async()=>{if(injected){injected=false;throw Error('synthetic_midway_failure');}}});await interrupted.init;
  const interruptedPreview=await call(interrupted.handler,'/__single-save-local/api/preview',{method:'POST',body:selected});
  const firstAttempt=await call(interrupted.handler,'/__single-save-local/api/commit',{method:'POST',body:{previewId:interruptedPreview.body.previewId,confirm:true}});
  assert.equal(firstAttempt.status,503);assert.equal((await interrupted.store.inspect(tx=>tx.listSaves(alice))).length,0);
  assert.equal(await interrupted.store.inspect(tx=>tx.getLegacyClaim(legacySnapshot(sourceProject,'child-two',{gameData:JSON.stringify(rows[1].gameState)}).legacyKey)),undefined);
  const recovered=await call(interrupted.handler,'/__single-save-local/api/commit',{method:'POST',body:{previewId:interruptedPreview.body.previewId,confirm:true}});
  assert.equal(recovered.status,200);assert.equal((await interrupted.store.inspect(tx=>tx.listSaves(alice))).length,1,'retry after failure completes exactly one save');
  await interrupted.store.close();

  let loseResponse=true;
  const afterCommit=makeHarness({afterClaim:async()=>{if(loseResponse){loseResponse=false;throw Error('synthetic_response_loss');}}});await afterCommit.init;
  const lostPreview=await call(afterCommit.handler,'/__single-save-local/api/preview',{method:'POST',body:selected});
  const lost=await call(afterCommit.handler,'/__single-save-local/api/commit',{method:'POST',body:{previewId:lostPreview.body.previewId,confirm:true}});
  assert.equal(lost.status,503);assert.equal((await afterCommit.store.inspect(tx=>tx.listSaves(alice))).length,1);
  const recoveredResponse=await call(afterCommit.handler,'/__single-save-local/api/commit',{method:'POST',body:{previewId:lostPreview.body.previewId,confirm:true}});
  assert.equal(recoveredResponse.status,200);assert.equal(recoveredResponse.body.alreadyImported,true);
  assert.equal((await afterCommit.store.inspect(tx=>tx.listSaves(alice))).length,1,'retry after lost response does not duplicate or reset progress');
  await afterCommit.store.close();

  const full=makeHarness({limit:3});await full.init;
  for(let i=0;i<3;i++)await full.store.transaction(tx=>tx.putSave({key:`existing-${i}`,ownerAccountId:alice,name:`existing-${i}`,gameState:{player:{lvl:1}},revision:1,createdAt:1,updatedAt:1}));
  const fullWrites=full.store.writeCount,fullPreview=await call(full.handler,'/__single-save-local/api/preview',{method:'POST',body:selected});
  assert.equal(fullPreview.body.reason,'save_limit_reached');assert.equal(fullPreview.body.canCommit,false);assert.equal(full.store.writeCount,fullWrites);
  await full.store.close();

  const foreign=makeHarness();await foreign.init;
  const snapshot=legacySnapshot(sourceProject,'child-two',{gameData:JSON.stringify(rows[1].gameState)});
  await foreign.store.transaction(tx=>{tx.putSave({key:snapshot.legacyKey,ownerAccountId:bob,name:'fixture-foreign',gameState:rows[1].gameState,revision:1,createdAt:1,updatedAt:1});tx.putLegacyClaim({legacyKey:snapshot.legacyKey,saveKey:snapshot.legacyKey,accountId:bob,claimedAt:1});});
  const foreignWrites=foreign.store.writeCount,foreignPreview=await call(foreign.handler,'/__single-save-local/api/preview',{method:'POST',body:selected});
  assert.equal(foreignPreview.body.reason,'legacy_already_claimed');assert.equal(foreignPreview.body.canCommit,false);assert.equal(foreign.store.writeCount,foreignWrites);
  await foreign.store.close();

  const collision=makeHarness();await collision.init;
  const collisionSnapshot=legacySnapshot(sourceProject,'child-two',{gameData:JSON.stringify(rows[1].gameState)});
  await collision.store.transaction(tx=>tx.putSave({key:collisionSnapshot.legacyKey,ownerAccountId:alice,name:'unclaimed-same-id',gameState:{player:{lvl:2}},revision:1,createdAt:1,updatedAt:1}));
  const collisionWrites=collision.store.writeCount,collisionPreview=await call(collision.handler,'/__single-save-local/api/preview',{method:'POST',body:selected});
  assert.equal(collisionPreview.body.reason,'legacy_save_id_collision');assert.equal(collisionPreview.body.canCommit,false);
  assert.equal(collision.store.writeCount,collisionWrites,'same-ID collision is read-only and never overwrites an existing save');
  assert.equal((await collision.store.inspect(tx=>tx.getSave(collisionSnapshot.legacyKey))).name,'unclaimed-same-id');
  await collision.store.close();

  const outside=makeHarness();await outside.init;const outsideWrites=outside.store.writeCount;
  const blocked=await call(outside.handler,'/__single-save-local/api/status',{method:'GET',remoteAddress:'192.0.2.3'});
  assert.equal(blocked.status,403);assert.equal(outside.store.writeCount,outsideWrites);await outside.store.close();
  console.log('PASS: local API is loopback-only; preview sends one row without DB writes; cancel/invalid/missing proof fail closed; confirmed import preserves ownership/entitlements; capacity/collision/retry/response loss/reopen are safe.');
}catch(error){throw error;}
