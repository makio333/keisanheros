import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createFirestoreAccountDeletionAudits} from '../server/firestore-account-deletion-audits.mjs';

function fakeFirestore(seed={}){
  const rows=new Map(Object.entries(seed).map(([path,data])=>[path,structuredClone(data)]));
  const collection=name=>({path:name,limit(limit){return query(name,{limit});},async get(){return query(name,{}).get();}});
  function query(name,options){
    const patch=next=>query(name,{...options,...next});
    return {limit(limit){return patch({limit});},startAfter(snapshot){return patch({after:snapshot.ref.path});},async get(){
      let docs=[...rows].filter(([path])=>path.startsWith(`${name}/`)&&!path.slice(name.length+1).includes('/')&&(!options.after||path>options.after)).sort(([a],[b])=>a.localeCompare(b)).map(([path,data])=>({id:path.slice(name.length+1),ref:{path},data:()=>structuredClone(data)}));
      if(options.limit)docs=docs.slice(0,options.limit);return {docs};
    }};
  }
  return {collection,rows};
}

test('whole collection audit pages through all records and counts only explicit owners',async()=>{
  const fake=fakeFirestore({'saves/a1':{ownerAccountId:'account-a'},'saves/a2':{ownerAccountId:'account-a'},'saves/b':{ownerAccountId:'account-b'}});
  const audits=createFirestoreAccountDeletionAudits({db:fake,pageSize:1,maxDocuments:10});
  assert.deepEqual(await audits.productSaves({accountId:'account-a'}),{complete:true,ownershipVerified:true,count:2,unattributedCount:0,scanned:3});
});

test('unattributed purchase, Stripe and product game rows fail closed, including facility bindings',async()=>{
  const hash='a'.repeat(64),fake=fakeFirestore({
    'purchases/a':{accountId:'account-a'},'purchases/unknown':{purchaseId:'old'},'events/e':{accountId:'account-a'},
    'stripeOrders/o':{accountId:'account-a'},'stripeCheckout/old':{sessionId:'session'},
    'legacyAssignments/la':{accountId:'account-a'},'legacyTransfers/lt':{accountId:'account-a'},'firebaseTransfers/ft':{accountId:'account-a'},
    'legacyFacilityBindings/f':{accountId:'account-a'},[`emailRegistrations/${hash}`]:{kind:'email-registration',uidHash:hash},'emailRegistrations/bad':{kind:'email-registration',uidHash:'not-doc-id'},
  });
  const audits=createFirestoreAccountDeletionAudits({db:fake,pageSize:1,maxDocuments:20});
  const purchases=await audits.purchaseRecords({accountId:'account-a'});assert.equal(purchases.complete,false);assert.equal(purchases.unattributedCount,1);
  const stripe=await audits.stripeOrders({accountId:'account-a'});assert.equal(stripe.complete,false);assert.equal(stripe.unattributedCount,1);
  const game=await audits.productGameDocuments({uid:'uid-a',uidHash:hash,accountId:'account-a'});assert.equal(game.complete,false);assert.equal(game.unattributedCount,1);assert.equal(game.count,5);
});

test('audit document cap and read failures are reported incomplete',async()=>{
  const fake=fakeFirestore({'saves/a':{ownerAccountId:'account-a'},'saves/b':{ownerAccountId:'account-b'}});
  const capped=createFirestoreAccountDeletionAudits({db:fake,pageSize:1,maxDocuments:1});
  assert.equal((await capped.productSaves({accountId:'account-a'})).reason,'audit_document_cap_exceeded');
  const broken=createFirestoreAccountDeletionAudits({db:{collection(){throw Error('synthetic read failure');}}});
  const report=await broken.productSaves({accountId:'account-a'});assert.equal(report.complete,false);assert.equal(report.reason,'audit_read_failed');assert.ok(report.unattributedCount>0);
});

test('email delivery records use exact UID hashes and unattributed entries block the full audit',async()=>{
  const uidHash='a'.repeat(64),fake=fakeFirestore({'emailDeliveries/a':{kind:'email-delivery',ownerUidHash:uidHash},'emailDeliveries/b':{kind:'email-delivery',ownerUidHash:'b'.repeat(64)}});
  const audits=createFirestoreAccountDeletionAudits({db:fake,pageSize:1});
  assert.equal((await audits.productGameDocuments({uid:'fixture-uid',accountId:'fixture-account',uidHash})).count,1);
  fake.rows.set('emailDeliveries/unknown',{kind:'email-delivery'});
  const result=await audits.productGameDocuments({uid:'fixture-uid',accountId:'fixture-account',uidHash});assert.equal(result.complete,false);assert.equal(result.unattributedCount,1);
});
