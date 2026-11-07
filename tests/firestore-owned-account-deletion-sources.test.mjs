import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createFirestoreOwnedAccountDeletionSources} from '../server/firestore-owned-account-deletion-sources.mjs';

function fakeFirestore(initial={}, {failCommitNumber=null}={}){
  const rows=new Map(Object.entries(initial).map(([path,data])=>[path,structuredClone(data)]));let commits=0;
  const docRef=path=>({path,id:path.slice(path.lastIndexOf('/')+1),async get(){const data=rows.get(path);return {exists:data!==undefined,id:this.id,ref:this,data:()=>structuredClone(data)};},async delete(){rows.delete(path);},collection(name){return collection(`${path}/${name}`);}});
  function collection(path){
    const ref={path,doc(id){return docRef(`${path}/${id}`);},where(field,operator,value){if(operator!=='==')throw Error('fixture supports equality only');return query(path,{field,value});},limit(n){return query(path,{limit:n});},async get(){return query(path,{}).get();}};
    return ref;
  }
  function query(path,options){
    const next=patch=>query(path,{...options,...patch});
    return {
      where(field,operator,value){if(operator!=='==')throw Error('fixture supports equality only');return next({field,value});},
      limit(limit){return next({limit});},
      startAfter(snapshot){return next({after:snapshot.ref.path});},
      async get(){
        let docs=[...rows].filter(([key,data])=>key.startsWith(`${path}/`)&&key.slice(path.length+1).length>0&&!key.slice(path.length+1).includes('/')&&(!options.field||data[options.field]===options.value)&&(!options.after||key>options.after))
          .sort(([a],[b])=>a.localeCompare(b)).map(([key,data])=>({path:key,id:key.slice(key.lastIndexOf('/')+1),ref:docRef(key),data:()=>structuredClone(data)}));
        if(options.limit)docs=docs.slice(0,options.limit);
        return {docs};
      },
    };
  }
  const db={collection,batch(){const pending=[];return {delete(ref){pending.push(ref.path);},async commit(){commits++;if(failCommitNumber===commits){failCommitNumber=null;throw Error('synthetic interruption');}for(const path of pending)rows.delete(path);return pending.length;}};}};
  return {db,rows,commitCount:()=>commits};
}

test('known account ID ownership pages through and deletes only matching accounts, identities, sessions and saves',async()=>{
  const seed={
    'accounts/account-a':{id:'account-a',private:'fixture'},'accounts/account-b':{id:'account-b'},
    'identities/identity-a1':{accountId:'account-a'},'identities/identity-a2':{accountId:'account-a'},'identities/identity-b':{accountId:'account-b'},
    'sessions/session-a1':{accountId:'account-a'},'sessions/session-a2':{accountId:'account-a'},'sessions/session-b':{accountId:'account-b'},
    'saves/save-a1':{ownerAccountId:'account-a'},'saves/save-a2':{ownerAccountId:'account-a'},'saves/save-a3':{ownerAccountId:'account-a'},'saves/save-b':{ownerAccountId:'account-b'},
  };
  const fake=fakeFirestore(seed),sources=createFirestoreOwnedAccountDeletionSources({db:fake.db,pageSize:1,ownershipAudits:{productSaves:async()=>({complete:true,unattributedCount:0})}});
  for(const name of ['accounts','identityMappings','sessions','productSaves']){
    const result=await sources[name].inspect({accountId:'account-a'});assert.equal(result.complete,true,name);assert.equal(result.ownershipVerified,true,name);
    await sources[name].apply({accountId:'account-a',disposition:'delete'});
  }
  for(const path of Object.keys(seed).filter(path=>path.endsWith('account-a')||path.endsWith('identity-a1')||path.endsWith('identity-a2')||path.endsWith('session-a1')||path.endsWith('session-a2')||path.endsWith('save-a1')||path.endsWith('save-a2')||path.endsWith('save-a3')))assert.equal(fake.rows.has(path),false,path);
  for(const path of ['accounts/account-b','identities/identity-b','sessions/session-b','saves/save-b'])assert.equal(fake.rows.has(path),true,path);
  assert.ok(fake.commitCount()>=7,'small page size exercised multiple bounded batches');
});

test('private save scopes inspect every document and refuse missing or mismatched ownerUid rows',async()=>{
  const seed={
    'privateGame/uid-a/saves/save-a':{ownerUid:'uid-a'},'privateGame/uid-b/saves/save-b':{ownerUid:'uid-b'},
    'privateMigration/uid-a/saves/import-a':{ownerUid:'uid-a'},'privateMigration/uid-b/saves/import-b':{ownerUid:'uid-b'},
  };
  const fake=fakeFirestore(seed),sources=createFirestoreOwnedAccountDeletionSources({db:fake.db,pageSize:1});
  assert.equal((await sources.privateGameSaves.inspect({uid:'uid-a'})).count,1);
  assert.equal((await sources.privateMigrationSaves.inspect({uid:'uid-a'})).ownershipVerified,true);
  await sources.privateGameSaves.apply({uid:'uid-a',disposition:'delete'});
  await sources.privateMigrationSaves.apply({uid:'uid-a',disposition:'delete'});
  assert.equal(fake.rows.has('privateGame/uid-b/saves/save-b'),true);
  assert.equal(fake.rows.has('privateMigration/uid-b/saves/import-b'),true);

  fake.rows.set('privateGame/uid-a/saves/unowned-legacy',{name:'fixture'});
  const audit=await sources.privateGameSaves.inspect({uid:'uid-a'});
  assert.equal(audit.complete,false);assert.equal(audit.unattributedCount,1);
  await assert.rejects(sources.privateGameSaves.apply({uid:'uid-a',disposition:'delete'}),/account_deletion_owner_mismatch/);
  assert.equal(fake.rows.has('privateGame/uid-a/saves/unowned-legacy'),true);
});

test('unknown legacy product saves block removal and a partial page deletion safely resumes',async()=>{
  const seed=Object.fromEntries(Array.from({length:5},(_,index)=>[`saves/save-a${index+1}`,{ownerAccountId:'account-a'}]));
  seed['saves/save-b']={ownerAccountId:'account-b'};
  let audit={complete:false,unattributedCount:1};
  const guarded=fakeFirestore(seed),guardedSources=createFirestoreOwnedAccountDeletionSources({db:guarded.db,pageSize:2,ownershipAudits:{productSaves:async()=>audit}});
  const blocked=await guardedSources.productSaves.inspect({accountId:'account-a'});
  assert.equal(blocked.complete,false);assert.equal(blocked.unattributedCount,1);
  await assert.rejects(guardedSources.productSaves.apply({accountId:'account-a',disposition:'delete'}),/product_saves_ownership_unverified/);
  assert.equal(guarded.rows.has('saves/save-a1'),true);

  audit={complete:true,unattributedCount:0};
  const retryable=fakeFirestore(seed,{failCommitNumber:2}),sources=createFirestoreOwnedAccountDeletionSources({db:retryable.db,pageSize:2,ownershipAudits:{productSaves:async()=>audit}});
  await assert.rejects(sources.productSaves.apply({accountId:'account-a',disposition:'delete'}),/synthetic interruption/);
  await sources.productSaves.apply({accountId:'account-a',disposition:'delete'});
  assert.equal([...retryable.rows.keys()].filter(path=>path.startsWith('saves/save-a')).length,0);
  assert.equal(retryable.rows.has('saves/save-b'),true);
});

test('financial/shared adapters exist only for exact ownership and explicit disposition evidence',async()=>{
  const fake=fakeFirestore({'purchases/purchase-a':{accountId:'account-a'}}),sources=createFirestoreOwnedAccountDeletionSources({db:fake.db});
  assert.equal(typeof sources.purchaseRecords.inspect,'function');
  assert.equal(typeof sources.stripeOrders.inspect,'function');
  const unresolved=await sources.purchaseRecords.inspect({accountId:'account-a',policy:{transactionDisposition:'retain_minimized'}});
  assert.equal(unresolved.complete,false);assert.equal(unresolved.dispositionSupported,false);
  await assert.rejects(sources.purchaseRecords.apply({accountId:'account-a',disposition:'retain_minimized'}),/transaction_retention_policy_unresolved/);
  assert.equal(sources.rankingsAndGroups,undefined);
});

test('login attempt deletion removes only explicit account links and leaves validated TTL-only rows',async()=>{
  const expiry=Date.now()+300000,login=(accountId,intent='link')=>({accountId,intent,browserHash:'a'.repeat(64),nonce:'b'.repeat(64),verifier:'c'.repeat(64),expiresAt:expiry,ttlAt:new Date(expiry)});
  const seed={'attempts/link-a':login('account-a'),'attempts/link-b':login('account-b'),'attempts/login-flow':login(null,'login'),
    'attempts/rate-limit':{kind:'rate-limit',scope:'auth.google.start',timestamps:[Date.now()],expiresAt:expiry,ttlAt:new Date(expiry)}};
  const fake=fakeFirestore(seed),sources=createFirestoreOwnedAccountDeletionSources({db:fake.db,pageSize:2});
  const audit=await sources.loginAttempts.inspect({uid:'uid-a',accountId:'account-a'});
  assert.equal(audit.complete,true);assert.equal(audit.count,1);assert.equal(audit.ttlManagedCount,3);
  await sources.loginAttempts.apply({uid:'uid-a',accountId:'account-a'});
  assert.equal(fake.rows.has('attempts/link-a'),false);assert.equal(fake.rows.has('attempts/link-b'),true);
  assert.equal(fake.rows.has('attempts/login-flow'),true);assert.equal(fake.rows.has('attempts/rate-limit'),true);
});

test('unknown non-TTL login attempts block deletion before any attempt is removed',async()=>{
  const seed={'attempts/link-a':{accountId:'account-a',intent:'link'},'attempts/unknown':{secret:'fixture'}};
  const fake=fakeFirestore(seed),sources=createFirestoreOwnedAccountDeletionSources({db:fake.db});
  const audit=await sources.loginAttempts.inspect({uid:'uid-a',accountId:'account-a'});
  assert.equal(audit.complete,false);assert.equal(audit.unattributedCount,2);
  await assert.rejects(sources.loginAttempts.apply({uid:'uid-a',accountId:'account-a'}),/login_attempt_inventory_incomplete/);
  assert.equal(fake.rows.has('attempts/link-a'),true);assert.equal(fake.rows.has('attempts/unknown'),true);
});

test('browser copies are a user-device notice, not a remote deletion blocker',async()=>{
  const fake=fakeFirestore({}),sources=createFirestoreOwnedAccountDeletionSources({db:fake.db});
  assert.equal((await sources.browserCopies.inspect({policy:{browserCopyNoticeConfirmed:false}})).complete,false);
  const informed=await sources.browserCopies.inspect({policy:{browserCopyNoticeConfirmed:true}});
  assert.equal(informed.complete,true);assert.equal(informed.count,0);assert.equal(informed.remoteErasureAvailable,false);
  await assert.rejects(sources.browserCopies.apply({policy:{browserCopyNoticeConfirmed:false}}),/browser_copy_cleanup_notice_required/);
  const result=await sources.browserCopies.apply({policy:{browserCopyNoticeConfirmed:true}});
  assert.equal(result.localCleanupInstructionsRequired,true);
});

test('purchase and Stripe order sources delete only exact account-owned documents after a complete audit',async()=>{
  const seed={
    'purchases/purchase-a':{accountId:'account-a',purchaseId:'purchase-a'},'purchases/purchase-b':{accountId:'account-b'},
    'events/event-a':{accountId:'account-a',eventId:'event-a'},'events/event-b':{accountId:'account-b'},
    'stripeOrders/order-a':{accountId:'account-a',id:'order-a'},'stripeOrders/order-b':{accountId:'account-b',id:'order-b'},
    'stripeCheckout/account-a':{accountId:'account-a',id:'order-a'},'stripeCheckout/account-b':{accountId:'account-b',id:'order-b'},
  };
  const fake=fakeFirestore(seed),audit=async()=>({complete:true,unattributedCount:0});
  const unreviewed=fakeFirestore(seed),unreviewedSources=createFirestoreOwnedAccountDeletionSources({db:unreviewed.db,ownershipAudits:{purchaseRecords:async()=>({complete:false,unattributedCount:1})}});
  assert.equal((await unreviewedSources.purchaseRecords.inspect({accountId:'account-a',policy:{transactionDisposition:'delete'}})).complete,false);
  await assert.rejects(unreviewedSources.purchaseRecords.apply({accountId:'account-a',disposition:'delete'}),/financial_record_inventory_incomplete/);
  assert.equal(unreviewed.rows.has('purchases/purchase-a'),true,'a failing whole-collection audit causes no deletion');
  const sources=createFirestoreOwnedAccountDeletionSources({db:fake.db,ownershipAudits:{purchaseRecords:audit,stripeOrders:audit}});
  assert.equal((await sources.purchaseRecords.inspect({accountId:'account-a',policy:{transactionDisposition:'delete'}})).complete,true);
  assert.equal((await sources.stripeOrders.inspect({accountId:'account-a',policy:{transactionDisposition:'delete'}})).complete,true);
  await sources.purchaseRecords.apply({accountId:'account-a',disposition:'delete'});
  await sources.stripeOrders.apply({accountId:'account-a',disposition:'delete'});
  for(const path of ['purchases/purchase-a','events/event-a','stripeOrders/order-a','stripeCheckout/account-a'])assert.equal(fake.rows.has(path),false,path);
  for(const path of ['purchases/purchase-b','events/event-b','stripeOrders/order-b','stripeCheckout/account-b'])assert.equal(fake.rows.has(path),true,path);
});

test('known product-game documents require the whole collection audit and preserve unrelated accounts',async()=>{
  const seed={
    'legacyAssignments/assignment-a':{accountId:'account-a'},'legacyAssignments/assignment-b':{accountId:'account-b'},
    'legacyTransfers/transfer-a':{accountId:'account-a'},'firebaseTransfers/transfer-b':{accountId:'account-b'},
    'legacyFacilityBindings/facility-a':{accountId:'account-a',sourceProject:'facility-demo'},
    'emailRegistrations/uid-hash-a':{kind:'email-registration',uidHash:'uid-hash-a',emailHash:'synthetic-hash'},
  };
  const fake=fakeFirestore(seed);let audit={complete:false,unattributedCount:1};
  const sources=createFirestoreOwnedAccountDeletionSources({db:fake.db,ownershipAudits:{productGameDocuments:async()=>audit}});
  const blocked=await sources.productGameDocuments.inspect({uid:'uid-a',uidHash:'uid-hash-a',accountId:'account-a'});
  assert.equal(blocked.complete,false);assert.equal(blocked.unattributedCount,1);
  await assert.rejects(sources.productGameDocuments.apply({uid:'uid-a',uidHash:'uid-hash-a',accountId:'account-a',disposition:'delete'}),/product_game_document_inventory_incomplete/);
  audit={complete:true,unattributedCount:0};
  assert.equal((await sources.productGameDocuments.inspect({uid:'uid-a',uidHash:'uid-hash-a',accountId:'account-a'})).complete,true);
  await sources.productGameDocuments.apply({uid:'uid-a',uidHash:'uid-hash-a',accountId:'account-a',disposition:'delete'});
  for(const path of ['legacyAssignments/assignment-a','legacyTransfers/transfer-a','legacyFacilityBindings/facility-a','emailRegistrations/uid-hash-a'])assert.equal(fake.rows.has(path),false,path);
  for(const path of ['legacyAssignments/assignment-b','firebaseTransfers/transfer-b'])assert.equal(fake.rows.has(path),true,path);
});

test('email delivery cooldown records are removed only for the verified UID hash',async()=>{
  const uidHash='a'.repeat(64),fake=fakeFirestore({'emailDeliveries/target':{kind:'email-delivery',ownerUidHash:uidHash},'emailDeliveries/other':{kind:'email-delivery',ownerUidHash:'b'.repeat(64)}});
  const sources=createFirestoreOwnedAccountDeletionSources({db:fake.db,pageSize:1,ownershipAudits:{productGameDocuments:async()=>({complete:true,unattributedCount:0})}});
  assert.equal((await sources.productGameDocuments.inspect({uid:'fixture',accountId:'fixture-account',uidHash})).count,1);
  await sources.productGameDocuments.apply({uid:'fixture',accountId:'fixture-account',uidHash,disposition:'delete'});
  assert.equal(fake.rows.has('emailDeliveries/target'),false);assert.equal(fake.rows.has('emailDeliveries/other'),true);
});
