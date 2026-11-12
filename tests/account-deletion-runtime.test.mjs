import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createHash} from 'node:crypto';
import {ACCOUNT_DELETION_SOURCES,addOneCalendarMonthTokyo} from '../server/account-deletion-service.mjs';
import {createAccountDeletionRuntime} from '../server/account-deletion-runtime.mjs';
import {createIndependentDeletionLedger,createAccountDeletionBackupRuntime} from '../server/account-deletion-backup-runtime.mjs';
import {createBackupInventoryManifest} from '../server/account-deletion-backup-manifest.mjs';
import {createAccountDeletionNotificationDelivery} from '../server/account-deletion-notification-delivery.mjs';
import {parseAccountDeletionWorkerConfig} from '../server/account-deletion-worker-entry.mjs';

const hash=value=>createHash('sha256').update(value).digest('hex');
function memoryStore(){
  const rows=new Map();let chain=Promise.resolve();
  return {rows,transaction(fn){const task=chain.then(async()=>{const staged=new Map(rows),result=await fn({async get(k){return structuredClone(staged.get(k));},put(k,v){staged.set(k,structuredClone(v));}});rows.clear();for(const row of staged)rows.set(...row);return result;});chain=task.catch(()=>{});return task;},
    async listDue({now,limit}){return [...rows.values()].filter(r=>['pending','sending'].includes(r.state)&&r.nextAttemptAt<=now).slice(0,limit).map(r=>({id:r.id}));},
    async listOpen({limit,afterKey=null}){return [...rows].filter(([key,row])=>['pending','prepared','accepting'].includes(row.state)&&(!afterKey||key>afterKey)).sort(([a],[b])=>a.localeCompare(b)).slice(0,limit).map(([key,row])=>({...structuredClone(row),storageKey:key}));},
  };
}
function firestore(){
  const rows=new Map();
  const ref=path=>({path,id:path.split('/').at(-1),async get(){const value=rows.get(path);return {exists:value!==undefined,data:()=>structuredClone(value)};}});
  function collection(name){return {doc:id=>ref(name+'/'+id),where(field,op,value){assert.equal(op,'==');const query=(max,after=null)=>({limit:n=>query(n,after),startAfter:doc=>query(max,doc.id),async get(){return {docs:[...rows].filter(([p,d])=>p.startsWith(name+'/')&&d[field]===value&&(!after||p.split('/').at(-1)>after)).sort(([a],[b])=>a.localeCompare(b)).slice(0,max).map(([p,d])=>({id:p.split('/').at(-1),data:()=>structuredClone(d),ref:ref(p)}))};}});return query(Infinity);}};}
  return {rows,collection,async runTransaction(fn){const staged=new Map(rows),result=await fn({async get(r){const value=staged.get(r.path);return {exists:value!==undefined,data:()=>structuredClone(value)};},set(r,v){staged.set(r.path,structuredClone(v));},delete(r){staged.delete(r.path);}});rows.clear();for(const r of staged)rows.set(...r);return result;}};
}
function harness({failAuthOnce=false,mailFailsOnce=false,missingSource}={}){
  const uid='fixture-uid',accountId='fixture-account',requestId='fixture-deletion-request';
  let clock=Date.parse('2028-01-30T15:00:00.000Z'),authFailure=failAuthOnce,mailFailure=mailFailsOnce;
  const db=firestore(),ledgerStore=memoryStore(),outbox=memoryStore(),lifecycle=memoryStore(),sent=[],applied=[],authEvents=[];
  db.rows.set('identities/'+hash(JSON.stringify(['firebase','ailandgames',uid])),{accountId});
  const auth={async getUser(id){return {uid:id};},async updateUser(){authEvents.push('disable');if(authFailure){authFailure=false;throw Error('fixture provider outage');}},async revokeRefreshTokens(){authEvents.push('revoke');},async deleteUser(){authEvents.push('delete');}};
  const ledger=createIndependentDeletionLedger({store:ledgerStore,authorityId:'fixture-independent-ledger',gameDataAuthorityId:'fixture-game-db',now:()=>clock});
  const records=[{collection:'saves',id:'target',data:{ownerAccountId:accountId,playerName:'fixture-target'}},{collection:'saves',id:'other',data:{ownerAccountId:'fixture-other',playerName:'fixture-other'}}];
  const manifest=createBackupInventoryManifest({sourceProject:'ailandgames',snapshotId:'fixture-snapshot',capturedAt:clock,records});
  const provider={async listSnapshots(){return {projectId:'ailandgames',complete:true,retentionPolicyId:'fixture-explicit-retention',retentionDays:19,snapshots:[{id:'fixture-snapshot',manifest}]};},async readSnapshot(){return {complete:true,records};}};
  const backup=createAccountDeletionBackupRuntime({provider,ledger,retentionPolicyId:'fixture-explicit-retention',retentionDays:19});
  const transport={idempotent:true,async send(message){if(mailFailure){mailFailure=false;throw Error('fixture mail outage');}if(!sent.some(row=>row.idempotencyKey===message.idempotencyKey))sent.push(message);return {accepted:true};}};
  const notifications=createAccountDeletionNotificationDelivery({store:outbox,transport,deliveryEnabled:true,now:()=>clock});
  const sourceAdapters=Object.fromEntries(ACCOUNT_DELETION_SOURCES.filter(name=>!['firebaseAuthUsers','backups'].includes(name)).map(name=>[name,{idempotent:true,async inspect(){return {complete:name!==missingSource,ownershipVerified:true,count:name==='browserCopies'?0:1,unattributedCount:0,deviceCleanupConfirmed:true,dispositionSupported:true};},async apply(input){assert.equal(input.accountId,accountId);assert.equal(input.uid,uid);assert.ok(clock>=addOneCalendarMonthTokyo(Date.parse('2028-01-30T15:00:00.000Z')));applied.push(name);}}]));
  const policy={accountRetentionPolicyId:'tokyo-calendar-month-v1',backupRetentionPolicyId:'fixture-explicit-retention',transactionDisposition:'delete',sharedRecordDisposition:'anonymize',browserCopyNoticeConfirmed:true};
  const runtime=createAccountDeletionRuntime({db,auth,sourceAdapters,backup,notifications,lifecycleStore:lifecycle,resolveVerifiedContact:async()=>({verified:true,uidHash:hash(uid),accountIdHash:hash(accountId),email:'fixture@example.invalid'}),verifyRequester:async()=>({verified:true,reauthenticated:true,uid,accountId}),policy,now:()=>clock,createRequestId:()=>requestId,workerEnv:{ACCOUNT_DELETION_WORKER_ENABLED:'1',GOOGLE_CLOUD_PROJECT:'ailandgames',K_REGION:'asia-northeast1',CLOUD_RUN_JOB:'legend-heroes-deletion-worker',ACCOUNT_DELETION_WORKER_MODE:'execute',ACCOUNT_DELETION_WORKER_PURGE_APPROVED:'1'},loadReadiness:async()=>({scope:'production',sources:ACCOUNT_DELETION_SOURCES.map(name=>({name,complete:true,ownershipVerified:true,dispositionSupported:true,restoreSuppressionVerified:name==='backups'})),transactionPolicyVerified:true,browserCopyNoticeConfirmed:true})});
  return {runtime,uid,accountId,requestId,ledger,ledgerStore,db,outbox,lifecycle,sent,applied,authEvents,backup,setNow:v=>{clock=v;},advance:v=>{clock+=v;}};
}

test('all synthetic sources: request, calendar month, isolated worker, guarded backup restore, queued notices',async()=>{
  const h=harness();
  assert.equal((await h.runtime.service.plan({request:{}})).sources.length,ACCOUNT_DELETION_SOURCES.length);
  const result=await h.runtime.service.deleteAccount({request:{},confirmation:'DELETE_MY_ACCOUNT'});
  assert.equal(result.state,'retention_pending');assert.equal(result.notificationQueued,true);assert.deepEqual(h.authEvents,['disable','revoke']);assert.equal(h.applied.length,0);
  assert.equal(result.purgeAfter,Date.parse('2028-02-28T15:00:00.000Z'));
  const staged=[],quarantined=[];
  assert.deepEqual(await h.backup.stageRestore({snapshotId:'fixture-snapshot',writeToIsolatedStaging:async r=>staged.push(r.id),writeToRestrictedQuarantine:async r=>quarantined.push(r.id)}),{sourceProject:'ailandgames',snapshotId:'fixture-snapshot',scanned:2,usable:1,quarantined:1});
  assert.deepEqual(staged,['other']);assert.deepEqual(quarantined,['target']);
  await h.runtime.run();assert.equal(h.applied.length,0);assert.equal(h.sent.length,1);assert.doesNotMatch(h.sent[0].text,/下書き/);
  h.setNow(result.purgeAfter);const completed=await h.runtime.run();
  assert.equal(completed.completed,1);assert.equal(h.applied.length,ACCOUNT_DELETION_SOURCES.length-2);assert.deepEqual(h.authEvents,['disable','revoke','delete']);assert.equal(h.sent.length,3);
  assert.match(h.sent[2].text,/削除を確認/);assert.equal([...h.outbox.rows.values()].every(row=>!('to' in row)),true);
  assert.equal([...h.lifecycle.rows.values()].some(row=>row.state==='complete'&&!('contact' in row)),true);
  await h.runtime.run();assert.equal(h.sent.length,3);assert.equal(h.applied.length,ACCOUNT_DELETION_SOURCES.length-2);
  assert.equal((await h.ledger.lookup({accountId:h.accountId})).state,'complete','independent suppression remains after game/Auth removal');
});

test('initial Auth failure is repaired before expiry without physical deletion and notification failures retry',async()=>{
  const h=harness({failAuthOnce:true,mailFailsOnce:true});
  const first=await h.runtime.service.deleteAccount({request:{},confirmation:'DELETE_MY_ACCOUNT'});assert.equal(first.state,'protection_retry_required');
  const early=await h.runtime.run();assert.equal(early.ok,true);assert.deepEqual(h.authEvents,['disable','disable','revoke']);assert.equal(h.applied.length,0);assert.equal(h.sent.length,0);
  h.advance(60000);await h.runtime.run();assert.equal(h.sent.length,1);
  h.setNow(first.purgeAfter);assert.equal((await h.runtime.run()).completed,1);assert.equal(h.sent.length,3);
});

test('missing ownership evidence blocks before Auth/ledger/mail effects',async()=>{
  const h=harness({missingSource:'legacySaves'}),plan=await h.runtime.service.plan({request:{}});
  assert.equal(plan.ready,false);assert.ok(plan.blockers.includes('inventory_incomplete:legacySaves'));
  const result=await h.runtime.service.deleteAccount({request:{},confirmation:'DELETE_MY_ACCOUNT'});assert.equal(result.ready,false);
  assert.equal(h.authEvents.length,0);assert.equal(h.ledgerStore.rows.size,0);assert.equal(h.outbox.rows.size,0);
});

test('job configuration stays disabled by default and rejects mixed/public service identity',()=>{
  assert.equal(parseAccountDeletionWorkerConfig({}).error,'worker_disabled');
  const env={ACCOUNT_DELETION_WORKER_ENABLED:'1',GOOGLE_CLOUD_PROJECT:'ailandgames',K_REGION:'asia-northeast1',CLOUD_RUN_JOB:'legend-heroes-deletion-worker',ACCOUNT_DELETION_WORKER_MODE:'dry-run'};
  assert.equal(parseAccountDeletionWorkerConfig(env).job,'legend-heroes-deletion-worker');
  assert.equal(parseAccountDeletionWorkerConfig({...env,K_SERVICE:'legend-heroes-api'}).error,'worker_target_mismatch');
});

test('ledger requires a separate authority and will not change owners or undo suppression',async()=>{
  const store=memoryStore();assert.throws(()=>createIndependentDeletionLedger({store,authorityId:'same',gameDataAuthorityId:'same'}),/independent_deletion_ledger_required/);
  const ledger=createIndependentDeletionLedger({store,authorityId:'ledger',gameDataAuthorityId:'game'}),base={uidHash:hash('fixture-u'),accountIdHash:hash('fixture-a'),requestId:'request',requestedAt:1,purgeAfter:99};
  await ledger.record({...base,state:'complete'});await ledger.record(base);assert.equal((await ledger.lookup({uid:'fixture-u'})).state,'complete');
  await assert.rejects(ledger.record({...base,accountIdHash:hash('fixture-other')}),/scope_conflict/);
  assert.equal(await ledger.verifyOwnerPair({uid:'fixture-u',accountId:'fixture-a'}),true);
  assert.equal(await ledger.verifyOwnerPair({uid:'fixture-u',accountId:'fixture-other'}),false);
});

test('no backup retention period is assumed and incomplete provider enumeration blocks restore',async()=>{
  const h=harness();assert.throws(()=>createAccountDeletionBackupRuntime({provider:{listSnapshots(){},readSnapshot(){}},ledger:h.ledger,retentionPolicyId:'fixture-policy'}),/not_configured/);
  const backup=createAccountDeletionBackupRuntime({provider:{async listSnapshots(){return {complete:false};},readSnapshot(){}},ledger:h.ledger,retentionPolicyId:'fixture-policy',retentionDays:23});
  assert.equal((await backup.source.inspect({uidHash:hash(h.uid),accountIdHash:hash(h.accountId),policy:{backupRetentionPolicyId:'fixture-policy'}})).complete,false);
  await assert.rejects(backup.stageRestore({snapshotId:'anything'}),/inventory_incomplete/);
});

test('notification delivery is off by default and concurrent drains send one idempotent receipt',async()=>{
  const store=memoryStore();const disabled=createAccountDeletionNotificationDelivery({store});assert.equal((await disabled.drain()).error,'notification_delivery_disabled');
  let calls=0;const delivery=createAccountDeletionNotificationDelivery({store,deliveryEnabled:true,transport:{idempotent:true,async send(){calls++;return {accepted:true};}}});
  const input={requestId:'fixture',uidHash:hash('uid'),accountIdHash:hash('account'),verifiedContact:{verified:true,uidHash:hash('uid'),accountIdHash:hash('account'),email:'fixture@example.invalid'},notice:{stage:'received',state:'retention_pending',purgeAfter:Date.now()+100000}};
  await delivery.enqueue(input);await delivery.enqueue(input);await Promise.all([delivery.drain(),delivery.drain()]);assert.equal(calls,1);
  await assert.rejects(delivery.enqueue({...input,verifiedContact:{...input.verifiedContact,uidHash:hash('other')}}),/verified_deletion_contact_required/);
});

test('a crash after durable contact association and tombstone creation recovers without new request or lost contact',async()=>{
  const h=harness(),requestedAt=Date.parse('2028-01-30T15:00:00.000Z'),purgeAfter=addOneCalendarMonthTokyo(requestedAt);
  const contactKey='contact:'+hash(JSON.stringify([h.uid,h.accountId]));
  h.lifecycle.rows.set(contactKey,{contactKey,preparedAt:requestedAt,expiresAt:requestedAt+60000,uid:h.uid,accountId:h.accountId,contact:{verified:true,uidHash:hash(h.uid),accountIdHash:hash(h.accountId),email:'fixture@example.invalid'},state:'prepared'});
  const original=h.lifecycle.transaction;let fault=true;
  h.lifecycle.transaction=fn=>original(async tx=>fn({...tx,put(key,value){if(fault&&key===h.requestId&&value.state==='pending'){fault=false;throw Error('fixture crash after tombstone');}tx.put(key,value);}}));
  await assert.rejects(h.runtime.adapter.beginDeletion({uid:h.uid,accountId:h.accountId,requestId:h.requestId,requestedAt,purgeAfter,policy:{accountRetentionPolicyId:'tokyo-calendar-month-v1',backupRetentionPolicyId:'fixture-explicit-retention',transactionDisposition:'delete',sharedRecordDisposition:'anonymize',browserCopyNoticeConfirmed:true}}),/fixture crash/);
  assert.equal(h.lifecycle.rows.get(h.requestId).state,'accepting');assert.equal((await h.runtime.adapter.getProgress({uid:h.uid,accountId:h.accountId})).state,'retention_pending');
  h.advance(60001);
  assert.deepEqual(await h.runtime.reconcileNotices(),{queued:1,retryRequired:0});assert.equal(h.lifecycle.rows.get(h.requestId).state,'pending');
  await h.runtime.run();assert.deepEqual(h.authEvents,['disable','revoke']);assert.equal(h.sent.length,1);
  h.setNow(purgeAfter);assert.equal((await h.runtime.run()).completed,1);assert.equal(h.sent.length,3);
});

test('unaccepted prepared or accepting contacts expire without notice or Auth mutation',async()=>{
  for(const state of ['prepared','accepting']){
    const h=harness(),preparedAt=Date.parse('2028-01-30T15:00:00.000Z'),contactKey='contact:'+hash(JSON.stringify([h.uid,h.accountId]));
    const key=state==='prepared'?contactKey:h.requestId;
    h.lifecycle.rows.set(key,{contactKey,preparedAt,expiresAt:preparedAt+60000,uid:h.uid,accountId:h.accountId,contact:{email:'fixture@example.invalid'},state,...(state==='accepting'?{requestId:h.requestId}:{})});
    await h.runtime.reconcileNotices();assert.ok(h.lifecycle.rows.get(key).contact);
    h.advance(60000);assert.deepEqual(await h.runtime.reconcileNotices(),{queued:0,retryRequired:0});
    assert.deepEqual(h.lifecycle.rows.get(key),{state:'expired',updatedAt:preparedAt+60000});assert.equal(h.outbox.rows.size,0);assert.equal(h.authEvents.length,0);
  }
});

test('contact reservation followed by tombstone write failure expires without a false acceptance notice',async()=>{
  const h=harness();h.db.runTransaction=async()=>{throw Error('fixture tombstone unavailable');};
  const result=await h.runtime.service.deleteAccount({request:{},confirmation:'DELETE_MY_ACCOUNT'});
  assert.equal(result.state,'acceptance_failed');assert.equal(h.lifecycle.rows.get(h.requestId).state,'accepting');assert.equal(h.outbox.rows.size,0);assert.equal(h.authEvents.length,0);
  h.advance(15*60*1000);await h.runtime.reconcileNotices();assert.equal(h.lifecycle.rows.get(h.requestId).state,'expired');assert.equal('contact' in h.lifecycle.rows.get(h.requestId),false);
});

test('stale accepting record never borrows a different request and drops its contact after TTL',async()=>{
  const h=harness(),accepted=await h.runtime.service.deleteAccount({request:{},confirmation:'DELETE_MY_ACCOUNT'}),row=h.lifecycle.rows.get(h.requestId);
  h.lifecycle.rows.set('old-request',{...row,state:'accepting',requestId:'old-request',queuedStages:[]});
  assert.equal((await h.runtime.reconcileNotices()).retryRequired,1);assert.equal(h.lifecycle.rows.get('old-request').state,'accepting');
  h.advance(15*60*1000);assert.equal((await h.runtime.reconcileNotices()).retryRequired,1);assert.equal(h.lifecycle.rows.get('old-request').state,'expired');assert.equal(h.outbox.rows.size,1);
  h.setNow(accepted.purgeAfter);assert.equal((await h.runtime.run()).completed,1);assert.equal(h.sent.length,3);
});

test('worker scans later pages instead of starving due or unprotected rows behind future/protected records',async()=>{
  const h=harness(),clock=Date.parse('2028-01-30T15:00:00.000Z');
  for(let i=0;i<250;i++)h.db.rows.set('accountDeletionTombstones/a'+String(i).padStart(3,'0'),{state:'retention_pending',uid:'fixture-other-'+i,accountId:'fixture-other-'+i,requestId:'other-'+i,purgeAfter:clock+100000,backupSuppressed:true,authDisabled:true,authRevoked:true});
  h.db.rows.set('accountDeletionTombstones/z-due',{state:'retention_pending',uid:h.uid,accountId:h.accountId,requestId:h.requestId,purgeAfter:clock,authDisabled:false,authRevoked:false,backupSuppressed:false});
  const due=await h.runtime.adapter.listDueDeletions({now:clock,limit:1});assert.equal(due.length,1);assert.equal(due[0].requestId,h.requestId);
  const retries=await h.runtime.adapter.listProtectionRetries({limit:1});assert.equal(retries.length,1);assert.equal(retries[0].requestId,h.requestId);
});

test('worker enumeration fails closed on read errors and the 10000-document safety cap',async()=>{
  const broken=harness();broken.db.collection=()=>{throw Error('fixture read unavailable');};
  await assert.rejects(broken.runtime.adapter.listDueDeletions({now:0,limit:1}),/fixture read unavailable/);
  const capped=harness();let index=0;
  capped.db.collection=()=>({where(){const query={limit(){return query;},startAfter(){return query;},async get(){return {docs:Array.from({length:200},()=>({id:String(index++).padStart(6,'0'),data:()=>({state:'retention_pending',uid:'fixture',accountId:'fixture',requestId:'fixture',purgeAfter:0})}))};}};return query;}});
  await assert.rejects(capped.runtime.adapter.listDueDeletions({now:1,limit:1}),/deletion_worker_inventory_cap_exceeded/);
  assert.equal(capped.applied.length,0);assert.equal(capped.authEvents.length,0);
});

test('notice reconciliation reaches a waiting request behind 250 already-notified pending accounts',async()=>{
  const h=harness(),accepted=await h.runtime.service.deleteAccount({request:{},confirmation:'DELETE_MY_ACCOUNT'});
  const target=h.lifecycle.rows.get(h.requestId);h.lifecycle.rows.set(h.requestId,{...target,queuedStages:[]});h.outbox.rows.clear();
  for(let i=0;i<250;i++){
    const requestId='a-notice-'+String(i).padStart(3,'0'),uid='fixture-other-uid-'+i,accountId='fixture-other-account-'+i;
    h.lifecycle.rows.set(requestId,{state:'pending',requestId,uid,accountId,purgeAfter:accepted.purgeAfter,queuedStages:['received']});
    h.db.rows.set('accountDeletionTombstones/'+hash(uid),{state:'retention_pending',uidHash:hash(uid),accountIdHash:hash(accountId),requestId,purgeAfter:accepted.purgeAfter,requestedAt:target.preparedAt,completedSources:[]});
  }
  assert.deepEqual(await h.runtime.reconcileNotices(),{queued:1,retryRequired:0});
  assert.deepEqual(await h.runtime.notifications.drain(),{ok:true,sent:1,retryRequired:0});assert.equal(h.sent.length,1);assert.match(h.sent[0].subject,/受け付け/);
  assert.deepEqual(await h.runtime.reconcileNotices(),{queued:0,retryRequired:0});
});

test('notice scan cap, missing/stalled cursors and a later-page read failure stop before queue writes',async()=>{
  const cap=harness();let calls=0;
  cap.lifecycle.listOpen=async({limit,afterKey})=>{const start=afterKey?Number(afterKey.slice(1))+1:0;calls++;return Array.from({length:Math.min(limit,251-start)},(_,i)=>({storageKey:'k'+String(start+i).padStart(4,'0'),state:'pending'}));};
  await assert.rejects(cap.runtime.reconcileNotices({maxScanned:250}),/deletion_lifecycle_inventory_cap_exceeded/);assert.equal(calls,3);assert.equal(cap.outbox.rows.size,0);
  for(const kind of ['missing','stalled','read-failure']){
    const h=harness();let pages=0;
    h.lifecycle.listOpen=async({limit})=>{
      pages++;if(kind==='read-failure'&&pages===2)throw Error('fixture page read unavailable');
      return Array.from({length:limit},(_,i)=>({state:'pending',...(kind==='missing'?{}:{storageKey:'fixture-key-'+i})}));
    };
    await assert.rejects(h.runtime.reconcileNotices(),/cursor_required|cursor_stalled|fixture page read unavailable/);assert.equal(h.outbox.rows.size,0);assert.equal(h.authEvents.length,0);
  }
});

test('legacy short-array lifecycle stores stay compatible without pretending a full page is complete',async()=>{
  const h=harness();await h.runtime.service.deleteAccount({request:{},confirmation:'DELETE_MY_ACCOUNT'});
  const target=h.lifecycle.rows.get(h.requestId);h.lifecycle.rows.set(h.requestId,{...target,queuedStages:[]});h.outbox.rows.clear();
  h.lifecycle.listOpen=async()=>[structuredClone(h.lifecycle.rows.get(h.requestId))];
  assert.deepEqual(await h.runtime.reconcileNotices(),{queued:1,retryRequired:0});assert.equal(h.outbox.rows.size,1);
  await assert.rejects(h.runtime.reconcileNotices({limit:0}),/scan_limit_invalid/);
  await assert.rejects(h.runtime.reconcileNotices({maxScanned:10001}),/scan_limit_invalid/);
});
