import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {test} from 'node:test';
import {createAccountDeletionService,ACCOUNT_DELETION_SOURCES,addOneCalendarMonthTokyo} from '../server/account-deletion-service.mjs';
import {createFirestoreAccountDeletionAdapter} from '../server/firestore-account-deletion-adapter.mjs';
import {createFirebaseAccountLogin} from '../server/firebase-account-login.mjs';

const uid='fixture-firebase-uid',accountId='fixture-account-id';
const policy={accountRetentionPolicyId:'fixture-retention-v1',backupRetentionPolicyId:'fixture-backup-v1',transactionDisposition:'retain_minimized',sharedRecordDisposition:'anonymize',browserCopyNoticeConfirmed:true};
const hash=value=>createHash('sha256').update(value).digest('hex');

function makeHarness({failFirstAt=null,dispositionUnsupportedAt=null}={}){
  const rows=new Map(),attempts=[],completed=new Set(),suppressed=new Set(),revoked=[],disabled=[],deleted=[];let clock=1770000000000,browserNoticeOnPurge=false;
  const backupRows=[{id:'fixture-owner-retained',accountIdHash:hash(accountId)},{id:'fixture-other-retained',accountIdHash:hash('other-fixture-account')}];
  const ref=path=>({path,id:path.slice(path.lastIndexOf('/')+1),async get(){const value=rows.get(path);return {exists:value!==undefined,data:()=>structuredClone(value)};},async delete(){rows.delete(path);}});
  function collection(name){
    return {
      doc:id=>ref(`${name}/${id}`),
      where(field,operator,value){
        if(operator!=='==')throw Error('fixture supports equality only');
        return {
          limit(max){
            return {
              async get(){
                const docs=[...rows].filter(([path,row])=>path.startsWith(`${name}/`)&&row?.[field]===value).slice(0,max)
                  .map(([path,row])=>({id:path.slice(name.length+1),ref:ref(path),data:()=>structuredClone(row)}));
                return {docs};
              },
            };
          },
        };
      },
    };
  }
  const db={collection,async runTransaction(callback){
    const staged=new Map(),tx={async get(document){const value=staged.has(document.path)?staged.get(document.path):rows.get(document.path);return {exists:value!==undefined,data:()=>structuredClone(value)};},set(document,value){staged.set(document.path,structuredClone(value));},delete(document){staged.set(document.path,undefined);}};
    const result=await callback(tx);for(const [path,value] of staged)value===undefined?rows.delete(path):rows.set(path,value);return result;
  }};
  const identityKey=JSON.stringify(['firebase','ailandgames',uid]);
  rows.set(`identities/${hash(identityKey)}`,{accountId});
  const auth={async getUser(value){if(deleted.includes(value)){const error=Error('missing');error.code='auth/user-not-found';throw error;}return {uid:value};},async updateUser(value,patch){disabled.push({uid:value,...patch});},async revokeRefreshTokens(value){revoked.push(value);},async deleteUser(value){deleted.push(value);}};
  const sourceAdapters=Object.fromEntries(ACCOUNT_DELETION_SOURCES.filter(name=>name!=='firebaseAuthUsers').map(name=>[name,{
    idempotent:true,
    async inspect(){return {complete:true,ownershipVerified:true,count:name==='browserCopies'?0:1,unattributedCount:0,restoreSuppressionVerified:name==='backups',deviceCleanupConfirmed:name==='browserCopies',...(name===dispositionUnsupportedAt?{dispositionSupported:false}:{})};},
    async apply({policy}){attempts.push(name);if(name==='browserCopies')browserNoticeOnPurge=policy?.browserCopyNoticeConfirmed===true;if(name===failFirstAt&&!completed.has(name)){failFirstAt=null;throw Error('synthetic interruption');}completed.add(name);if(name==='identityMappings')rows.delete(`identities/${hash(identityKey)}`);},
  }]));
  const adapter=createFirestoreAccountDeletionAdapter({db:{...db,collection},auth,projectId:'ailandgames',sourceAdapters,backupSuppressor:{idempotent:true,async suppress(input){suppressed.add(input.accountIdHash);}}});
  const service=createAccountDeletionService({adapter,now:()=>clock,createRequestId:()=> 'fixture-request',verifyRequester:async request=>({verified:true,uid,accountId,reauthenticated:request?.reauthenticated===true,resumeVerified:request?.resume===true})});
  return {service,adapter,attempts,suppressed,revoked,disabled,deleted,rows,get browserNoticeOnPurge(){return browserNoticeOnPurge;},restoreFixtureBackup(){return backupRows.filter(row=>!suppressed.has(row.accountIdHash));},setNow(value){clock=value;}};
}

test('calendar-month retention keeps data server-side while hiding the account, then purges due data',async()=>{
  assert.equal(addOneCalendarMonthTokyo(Date.parse('2024-01-30T15:00:00.000Z')),Date.parse('2024-02-28T15:00:00.000Z'));
  assert.equal(addOneCalendarMonthTokyo(Date.parse('2024-08-30T15:00:00.000Z')),Date.parse('2024-09-29T15:00:00.000Z'));
  const h=makeHarness();
  const plan=await h.service.plan({request:{reauthenticated:true},policy});
  assert.equal(plan.ready,true);assert.equal(plan.sources.length,15);assert.equal(JSON.stringify(plan).includes(accountId),false);
  const result=await h.service.deleteAccount({request:{reauthenticated:true},policy,confirmation:'DELETE_MY_ACCOUNT'});
  assert.equal(result.completed,false);assert.equal(result.state,'retention_pending');assert.equal(result.requestId,'fixture-request');
  const tombstonePath=`accountDeletionTombstones/${hash(uid)}`,tombstone=h.rows.get(tombstonePath);
  assert.equal(tombstone.state,'retention_pending');assert.equal(tombstone.purgeAfter,result.purgeAfter);assert.equal(tombstone.accountId,accountId);
  assert.deepEqual(h.disabled,[{uid,disabled:true}]);assert.deepEqual(h.revoked,[uid]);assert.deepEqual(h.deleted,[]);assert.equal(h.suppressed.size,1);
  assert.equal(h.attempts.length,0,'no source data is physically deleted during the retention month');
  assert.equal(await h.adapter.isUidBlocked(uid),true);assert.equal(await h.adapter.isAccountIdBlocked(accountId),true);
  assert.equal(h.rows.get(`accountDeletionVisibility/${uid}`).state,'retention_pending');
  assert.deepEqual(h.restoreFixtureBackup().map(row=>row.id),['fixture-other-retained'],'the fake restore applies the separate suppression record before data becomes visible');
  const early=await h.service.purgeDue();assert.equal(early.processed,0);assert.deepEqual(h.deleted,[]);
  h.setNow(result.purgeAfter);
  const purged=await h.service.purgeDue();assert.deepEqual(purged,{processed:1,completed:1,retryRequired:0});
  assert.deepEqual(h.deleted,[uid]);assert.equal(h.rows.get(tombstonePath).state,'complete');
  assert.equal(h.browserNoticeOnPurge,true,'the device cleanup notice stays attached to the one-month purge policy');
  assert.equal('accountId' in h.rows.get(tombstonePath),false);assert.equal('uid' in h.rows.get(tombstonePath),false);
  assert.equal(h.rows.get(`accountDeletionVisibility/${uid}`).state,'complete');
  assert.equal(await h.adapter.isAccountIdBlocked(accountId),true);
  assert.ok((await h.service.plan({request:{reauthenticated:true},policy})).blockers.includes('account_already_deleted'));
  const login=createFirebaseAccountLogin({projectId:'ailandgames',isAccountDeletionBlocked:h.adapter.isUidBlocked,verifyIdToken:async()=>({uid,aud:'ailandgames',iss:'https://securetoken.google.com/ailandgames',exp:2000000000,firebase:{sign_in_provider:'google.com'}})});
  await assert.rejects(login('fixture-id-token'),/account_deletion_in_progress/);
  h.setNow(h.rows.get(`accountDeletionVisibility/${uid}`).deleteAfter);
  assert.deepEqual(await h.service.cleanupExpiredVisibilityLocks(),{removed:1});
  assert.equal(h.rows.has(`accountDeletionVisibility/${uid}`),false);
  assert.equal(await h.adapter.isUidBlocked(uid),true,'the minimal hashed auth tombstone remains after the temporary direct-rule marker is removed');
});

test('an interrupted due purge resumes under the same tombstone and request ID',async()=>{
  const h=makeHarness({failFirstAt:'privateGameSaves'});
  const first=await h.service.deleteAccount({request:{reauthenticated:true},policy,confirmation:'DELETE_MY_ACCOUNT'});
  assert.equal(first.completed,false);assert.equal(first.state,'retention_pending');
  const tombstonePath=`accountDeletionTombstones/${hash(uid)}`;
  assert.equal(h.rows.get(tombstonePath).state,'retention_pending');h.setNow(first.purgeAfter);
  const interrupted=await h.service.purgeDue();assert.deepEqual(interrupted,{processed:1,completed:0,retryRequired:1});
  assert.equal(h.rows.get(tombstonePath).state,'purging');
  const second=await h.service.purgeDue();assert.deepEqual(second,{processed:1,completed:1,retryRequired:0});
  assert.equal(h.revoked.length,1);assert.equal(h.deleted.length,1);assert.equal(h.rows.get(tombstonePath).state,'complete');
  assert.equal(h.attempts.filter(name=>name==='privateGameSaves').length,2);
});

test('missing confirmation and a requester without recent reauthentication do not trigger deletion',async()=>{
  const h=makeHarness();
  const missing=await h.service.deleteAccount({request:{reauthenticated:true},policy});
  assert.ok(missing.blockers.includes('explicit_account_confirmation_required'));
  const rejected=await h.service.deleteAccount({request:{},policy,confirmation:'DELETE_MY_ACCOUNT'});
  assert.ok(rejected.blockers.includes('recent_account_reauthentication_required'));
  assert.deepEqual(h.disabled,[]);assert.deepEqual(h.revoked,[]);assert.deepEqual(h.deleted,[]);assert.equal(h.rows.has(`accountDeletionTombstones/${hash(uid)}`),false);
});

test('an unsupported record disposition blocks the deletion plan before tombstone writes',async()=>{
  const h=makeHarness({dispositionUnsupportedAt:'purchaseRecords'});
  const plan=await h.service.plan({request:{reauthenticated:true},policy});
  assert.equal(plan.ready,false);
  assert.ok(plan.blockers.includes('source_disposition_unimplemented:purchaseRecords'));
  const result=await h.service.deleteAccount({request:{reauthenticated:true},policy,confirmation:'DELETE_MY_ACCOUNT'});
  assert.ok(result.blockers.includes('source_disposition_unimplemented:purchaseRecords'));
  assert.equal(h.rows.has(`accountDeletionTombstones/${hash(uid)}`),false);
});
