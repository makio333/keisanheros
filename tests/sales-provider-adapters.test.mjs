import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createSalesDocumentStore,createSalesFinancialArchive,createSalesMailTransport,createSalesCasWriter,createSalesOwnedFinancialReader,salesSnapshotRevision} from '../server/sales-provider-adapters.mjs';
import {createSalesEmailLedger} from '../server/sales-email-ledger.mjs';

const hash=value=>createHash('sha256').update(value).digest('hex');
function fakeDb(databaseId='synthetic-independent'){
  const rows=new Map(),reads=[],queries=[];let sequence=0,chain=Promise.resolve();
  const db={projectId:'ailandgames',databaseId,rows,reads,queries};
  const snap=(path,data)=>({id:path.split('/').at(-1),exists:data!==undefined,data:()=>structuredClone(data?.record),updateTime:data?.stamp});
  function query(name,filters=[],orders=[],count=Infinity,cursor=null){return {
    doc:id=>({path:name+'/'+id,id}),where:(...filter)=>query(name,[...filters,filter],orders,count,cursor),orderBy:field=>query(name,filters,[...orders,field],count,cursor),limit:n=>query(name,filters,orders,n,cursor),startAfter:snapshot=>query(name,filters,orders,count,snapshot.id),async get(){
      queries.push({name,filters,orders,count});assert.ok(count<=100,'query must be bounded before provider invocation');
      const field=(data,name)=>name==='__name__'?data.id:name.split('.').reduce((value,key)=>value?.[key],data);
      const values=[...rows].filter(([path,data])=>path.startsWith(name+'/')&&(!cursor||path.split('/').at(-1)>cursor)&&filters.every(([key,op,value])=>{const actual=field(data.record,key);return op==='in'?value.includes(actual):op==='=='?actual===value:op==='<='?actual<=value:false;}));
      values.sort(([a,x],[b,y])=>{for(const order of orders){const lhs=order==='__name__'?a:field(x.record,order),rhs=order==='__name__'?b:field(y.record,order);if(lhs<rhs)return -1;if(lhs>rhs)return 1;}return a.localeCompare(b);});
      return {docs:values.slice(0,count).map(([path,data])=>snap(path,data))};
    },
  };}
  db.collection=name=>query(name);
  db.seed=(name,id,record)=>{rows.set(name+'/'+id,{record:structuredClone(record),stamp:{seconds:1,nanoseconds:++sequence}});};
  db.runTransaction=callback=>{const run=chain.then(async()=>{let hasWrite=false;const pending=new Map(rows);const tx={get:async ref=>{assert.equal(hasWrite,false,'Firestore requires all reads before writes');reads.push(ref.path);return snap(ref.path,pending.get(ref.path));},set:(ref,record)=>{hasWrite=true;pending.set(ref.path,{record:structuredClone(record),stamp:{seconds:1,nanoseconds:++sequence}});},delete:ref=>{hasWrite=true;pending.delete(ref.path);}};const result=await callback(tx);rows.clear();for(const row of pending)rows.set(...row);return result;});chain=run.catch(()=>{});return run;};
  return db;
}
const storeFor=(db,kind)=>createSalesDocumentStore({db,kind,expectedDatabaseId:db.databaseId});
test('explicit project/database/kind checks fail before accessing a provider',()=>{
  const db=fakeDb();assert.throws(()=>createSalesDocumentStore({db,kind:'ledger'}),/scope_required/);
  assert.throws(()=>createSalesDocumentStore({db,kind:'ledger',expectedDatabaseId:'wrong'}),/scope_required/);
  assert.throws(()=>createSalesDocumentStore({db,kind:'unknown',expectedDatabaseId:db.databaseId}),/scope_required/);
  assert.deepEqual(db.reads,[]);assert.deepEqual(db.queries,[]);
});
test('document keys cannot escape the fixed collection and mixed logical reads/writes buffer native writes',async()=>{
  const db=fakeDb(),store=storeFor(db,'ledger');
  await store.transaction(async tx=>{tx.put('../other/path',{state:'held'});await tx.get('another');assert.equal((await tx.get('../other/path')).state,'held');});
  assert.equal([...db.rows.keys()][0],'salesDeletionLedger/'+hash('../other/path'));
  assert.equal((await store.transaction(tx=>tx.get('../other/path'))).state,'held');
  await assert.rejects(store.transaction(tx=>tx.put('bad',{undefined:undefined})),/json_required/);
});
test('corrupt envelope and too many writes fail closed without partial commits',async()=>{
  const db=fakeDb(),store=createSalesDocumentStore({db,kind:'ledger',expectedDatabaseId:db.databaseId,maxWrites:1});
  await assert.rejects(store.transaction(tx=>{tx.put('one',{x:1});tx.put('two',{x:2});}),/write_limit/);assert.equal(db.rows.size,0);
  db.seed('salesDeletionLedger',hash('one'),{schemaVersion:1,key:'another',record:{x:1}});
  await assert.rejects(store.transaction(tx=>tx.get('one')),/corrupt/);
});
test('mail ledger is durable through Firestore wrapper reconstruction',async()=>{
  const db=fakeDb(),store=storeFor(db,'mail'),key=hash('synthetic'),ownerUidHash=hash('synthetic-uid');
  const ledger=createSalesEmailLedger({store});const first=await ledger.reserve({key,ownerUidHash,now:100000,cooldownMs:60000});assert.equal(first.status,'reserved');
  assert.equal((await createSalesEmailLedger({store:storeFor(db,'mail')}).reserve({key,ownerUidHash,now:500000,cooldownMs:60000})).status,'uncertain');
  await ledger.complete({key,deliveryId:first.deliveryId,now:100001,status:'sent'});
  assert.equal((await ledger.reserve({key,ownerUidHash,now:100002,cooldownMs:60000})).status,'cooldown');
});
test('lifecycle and outbox use bounded state/date queries and reject wrong query scope',async()=>{
  const db=fakeDb(),lifecycle=storeFor(db,'lifecycle'),outbox=storeFor(db,'outbox');
  await lifecycle.transaction(tx=>{tx.put('open',{state:'pending',requestId:'open'});tx.put('complete',{state:'complete'});});
  assert.deepEqual((await lifecycle.listOpen({limit:1})).map(x=>x.requestId),['open']);
  await outbox.transaction(tx=>{tx.put('due',{id:'due',state:'pending',nextAttemptAt:5});tx.put('future',{id:'future',state:'pending',nextAttemptAt:100});tx.put('done',{id:'done',state:'sent',nextAttemptAt:1});});
  assert.deepEqual((await outbox.listDue({now:20,limit:10})).map(x=>x.id),['due']);
  await assert.rejects(outbox.listDue({now:20,limit:101}),/limit_invalid/);await assert.rejects(lifecycle.listDue({now:20,limit:1}),/scope_invalid/);
});
test('financial archive preserves original retainedAt on replay and only CAS-deletes exact expiry',async()=>{
  const db=fakeDb(),archive=createSalesFinancialArchive({store:storeFor(db,'archive')}),id=hash('row');
  const record={recordFingerprint:hash('immutable-proof'),policyId:'synthetic-policy',sourceRevision:'1:1',accountIdHash:hash('owner'),requestId:'synthetic-request',retainedAt:1,retainUntil:50};
  await archive.putIfAbsent({id,record});assert.equal((await archive.putIfAbsent({id,record:{...record,retainedAt:30}})).retainedAt,1);
  await assert.rejects(archive.putIfAbsent({id,record:{...record,requestId:'other'}}),/scope_conflict/);
  const result=await archive.listDue({policyId:'synthetic-policy',now:50,limit:1});assert.equal(result.complete,true);assert.equal(result.records.length,1);
  await assert.rejects(archive.deleteIfUnchanged({id,expectedRevision:'wrong',retainUntil:50}),/revision_conflict/);
  await archive.deleteIfUnchanged({id,expectedRevision:result.records[0].revision,retainUntil:50});assert.equal((await archive.listDue({policyId:'synthetic-policy',now:50,limit:1})).records.length,0);
});
function transportFixture({accepted=true,bound=60000,maxAttempts=8}={}){
  const db=fakeDb(),store=storeFor(db,'mail'),calls=[];let clock=100000;
  const options={enabled:true,driverId:'synthetic-reviewed',approvedDriverIds:['synthetic-reviewed'],from:'sender@example.test',store,now:()=>clock,maxAttempts,request:async payload=>{calls.push(payload);if(accepted)return {accepted:true};throw Error('synthetic-timeout');},driverRegistry:{'synthetic-reviewed':{idempotent:true,idempotenceBoundMs:bound,send:({request,...payload})=>request(payload)}}};
  const mail={idempotencyKey:'synthetic-message',to:'owner@example.test',subject:'Synthetic notice',text:'Fixture only'};
  return {options,mail,calls,transport:createSalesMailTransport(options),advance:ms=>{clock+=ms;}};
}
test('transport is disabled by default and missing sender/unknown driver/capabilities never call request',async()=>{
  await assert.rejects(createSalesMailTransport().send({}),/disabled/);
  const f=transportFixture();for(const override of [{from:undefined},{driverId:'unapproved'},{approvedDriverIds:[]},{maxAttempts:21},{driverRegistry:{'synthetic-reviewed':{idempotent:false}}}])assert.throws(()=>createSalesMailTransport({...f.options,...override}),/configuration_required/);
  assert.deepEqual(f.calls,[]);
});
test('transport caches accepted receipt durably, binds sender/content and supports verification sendMessage',async()=>{
  const f=transportFixture();await f.transport.send(f.mail);await createSalesMailTransport(f.options).send(f.mail);assert.equal(f.calls.length,1);
  assert.equal(f.calls[0].from,'sender@example.test');assert.equal(f.calls[0].idempotencyKey,'synthetic-message');
  await assert.rejects(f.transport.send({...f.mail,to:'other@example.test'}),/idempotency_conflict/);
  await f.transport.sendMessage({deliveryId:'synthetic-verification',to:f.mail.to,subject:f.mail.subject,text:f.mail.text});assert.equal(f.calls.length,2);
});
test('uncertain sends use same provider key only within idempotence window and bounded attempt count',async()=>{
  const f=transportFixture({accepted:false,maxAttempts:2});await assert.rejects(f.transport.send(f.mail),/uncertain/);await assert.rejects(f.transport.send(f.mail),/uncertain/);assert.equal(f.calls.length,2);
  await assert.rejects(f.transport.send(f.mail),/attempts_exhausted/);assert.equal(f.calls.length,2);
  const expired=transportFixture({accepted:false});await assert.rejects(expired.transport.send(expired.mail),/uncertain/);expired.advance(60000);
  await assert.rejects(createSalesMailTransport(expired.options).send(expired.mail),/window_elapsed/);assert.equal(expired.calls.length,1);
});
test('message injection and oversized payload fail before provider invocation',async()=>{
  const f=transportFixture();for(const override of [{subject:'bad\r\nHeader'},{to:'bad\n@example.test'},{text:'x'.repeat(100001)},{idempotencyKey:'../bad'}])await assert.rejects(f.transport.send({...f.mail,...override}),/message_invalid/);assert.deepEqual(f.calls,[]);
});
test('CAS writer requires explicit namespace and exact nanosecond revision and owner',async()=>{
  const db=fakeDb('(default)');db.seed('purchases','synthetic',{accountId:'owner',amount:100});
  const writer=createSalesCasWriter({db,expectedProject:'ailandgames',expectedDatabaseId:'(default)',allowedCollections:['purchases']});
  const snap=await db.runTransaction(tx=>tx.get({path:'purchases/synthetic'})),rev=salesSnapshotRevision(snap);
  await assert.rejects(writer.deleteOwnedIfUnchanged({collection:'other',id:'synthetic',accountId:'owner',expectedRevision:rev}),/scope_invalid/);
  await assert.rejects(writer.deleteOwnedIfUnchanged({collection:'purchases',id:'synthetic',accountId:'other',expectedRevision:rev}),/owner_conflict/);
  await assert.rejects(writer.deleteOwnedIfUnchanged({collection:'purchases',id:'synthetic',accountId:'owner',expectedRevision:'1:0'}),/revision_conflict/);
  assert.equal((await writer.deleteOwnedIfUnchanged({collection:'purchases',id:'synthetic',accountId:'owner',expectedRevision:rev})).removed,true);
});
test('shared CAS mutation compares whole before hash and does not overwrite a changed document',async()=>{
  const db=fakeDb();db.seed('raidHistory','synthetic',{name:'Fixture',score:5});
  const writer=createSalesCasWriter({db,expectedProject:'ailandgames',expectedDatabaseId:db.databaseId,allowedCollections:['raidHistory'],fingerprintMode:'json'});
  const snap=await db.runTransaction(tx=>tx.get({path:'raidHistory/synthetic'}));
  const request={sourceProject:'ailandgames',collection:'raidHistory',documentId:'synthetic',expectedRevision:salesSnapshotRevision(snap),expectedSha256:hash(JSON.stringify(snap.data())),after:{name:'削除済み',score:5}};
  await assert.rejects(writer.applyOperation({...request,expectedSha256:hash('bad')}),/revision_conflict/);
  assert.equal((await writer.applyOperation(request)).updated,true);
  await assert.rejects(writer.applyOperation(request),/revision_conflict/);
});
test('financial reader scans all owners in bounded pages and pairs owner-checked revision deletion',async()=>{
  const db=fakeDb();for(const [id,accountId] of [['a','synthetic-owner'],['b','other-owner'],['c','synthetic-owner']])db.seed('purchases',id,{accountId,createdAt:1});
  const reader=createSalesOwnedFinancialReader({db,expectedDatabaseId:db.databaseId,pageSize:2,maxRecords:4});
  const result=await reader.listOwned({collection:'purchases',accountId:'synthetic-owner'});assert.equal(result.complete,true);assert.deepEqual(result.records.map(row=>row.id),['a','c']);
  await reader.deleteOwnedIfUnchanged({collection:'purchases',id:'a',accountId:'synthetic-owner',expectedRevision:result.records[0].revision});assert.equal(db.rows.has('purchases/a'),false);assert.equal(db.rows.has('purchases/b'),true);
});
test('financial reader refuses incomplete capped inventory or any unowned record; archive refuses future expiry',async()=>{
  const db=fakeDb();for(const id of ['a','b','c'])db.seed('purchases',id,{accountId:'synthetic-owner'});
  const bounded=createSalesOwnedFinancialReader({db,expectedDatabaseId:db.databaseId,pageSize:2,maxRecords:2});assert.equal((await bounded.listOwned({collection:'purchases',accountId:'synthetic-owner'})).complete,false);
  db.seed('purchases','d',{createdAt:1});const all=createSalesOwnedFinancialReader({db,expectedDatabaseId:db.databaseId});assert.equal((await all.listOwned({collection:'purchases',accountId:'synthetic-owner'})).complete,false);
  const archive=createSalesFinancialArchive({store:storeFor(db,'archive'),now:()=>100});await assert.rejects(archive.deleteIfUnchanged({id:hash('never'),expectedRevision:'none',retainUntil:101}),/record_invalid/);
});
test('lifecycle cursor uses hashed storageKey ordering, reaches every page and survives a closed cursor row',async()=>{
  const db=fakeDb(),store=storeFor(db,'lifecycle');
  const keys=['request-synthetic-a','request-synthetic-b','contact:synthetic-c','request-synthetic-d','request-synthetic-e'];
  await store.transaction(tx=>{for(const key of keys)tx.put(key,{state:'pending',requestId:key,storageKey:'caller-must-not-control-cursor'});});
  const first=await store.listOpen({limit:2});assert.equal(first.length,2);assert.ok(first.every(row=>keys.includes(row.storageKey)));
  await store.transaction(async tx=>{const key=first[1].storageKey,row=await tx.get(key);tx.put(key,{...row,state:'complete'});});
  const second=await store.listOpen({limit:2,afterKey:first[1].storageKey}),third=await store.listOpen({limit:2,afterKey:second.at(-1).storageKey});
  assert.deepEqual(new Set([...first,...second,...third].map(row=>row.storageKey)),new Set(keys));
  assert.equal((await store.listOpen({limit:2,afterKey:third.at(-1).storageKey})).length,0);
  await assert.rejects(store.listOpen({afterKey:23}),/cursor_invalid/);
});
