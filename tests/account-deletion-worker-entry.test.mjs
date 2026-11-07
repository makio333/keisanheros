import assert from 'node:assert/strict';
import {test} from 'node:test';
import {ACCOUNT_DELETION_SOURCES} from '../server/account-deletion-service.mjs';
import {createAccountDeletionWorkerEntry,parseAccountDeletionWorkerConfig,verifyAccountDeletionWorkerReadiness} from '../server/account-deletion-worker-entry.mjs';

const env=(mode='dry-run',extra={})=>({ACCOUNT_DELETION_WORKER_ENABLED:'1',GOOGLE_CLOUD_PROJECT:'ailandgames',K_SERVICE:'legend-heroes-api',K_REGION:'asia-northeast1',ACCOUNT_DELETION_WORKER_MODE:mode,ACCOUNT_DELETION_WORKER_LIMIT:'25',...(mode==='execute'?{ACCOUNT_DELETION_WORKER_PURGE_APPROVED:'1'}:{}),...extra});
const readiness=()=>({scope:'production',sources:ACCOUNT_DELETION_SOURCES.map(name=>({name,complete:true,ownershipVerified:true,dispositionSupported:true,restoreSuppressionVerified:name==='backups'})),transactionPolicyVerified:true,browserCopyNoticeConfirmed:true});

test('worker config is off by default and locks the project, Cloud Run service, region, mode, and cap',()=>{
  assert.equal(parseAccountDeletionWorkerConfig({}).error,'worker_disabled');
  assert.equal(parseAccountDeletionWorkerConfig(env('dry-run',{K_SERVICE:'legend-heroes-internal-raid'})).error,'worker_target_mismatch');
  assert.equal(parseAccountDeletionWorkerConfig(env('dry-run',{K_REGION:'us-central1'})).error,'worker_target_mismatch');
  assert.equal(parseAccountDeletionWorkerConfig(env('dry-run',{ACCOUNT_DELETION_WORKER_MODE:'execute'})).error,'worker_purge_not_approved');
  assert.equal(parseAccountDeletionWorkerConfig(env('dry-run',{ACCOUNT_DELETION_WORKER_LIMIT:'101'})).error,'worker_limit_invalid');
  assert.equal(parseAccountDeletionWorkerConfig(env('dry-run')).ok,true);
});

test('worker refuses non-production service adapters and readiness fails closed',async()=>{
  const fixture=createAccountDeletionWorkerEntry({service:{executionProfile:'synthetic-fixture'},env:env()});
  assert.equal((await fixture.run()).error,'production_guarded_service_required');
  assert.equal(verifyAccountDeletionWorkerReadiness({scope:'production',sources:[]}).error,'worker_source_readiness_incomplete');
  const rows=readiness().sources.map(row=>row.name==='backups'?{...row,restoreSuppressionVerified:false}:row);
  assert.equal(verifyAccountDeletionWorkerReadiness({...readiness(),sources:rows}).error,'worker_backup_guard_unverified');
});

test('dry-run invokes only the read-only preview and reports aggregate counts',async()=>{
  const calls=[],logs=[],service={executionProfile:'production-guarded',async previewDue(){calls.push('preview');return {dueCount:2};},async purgeDue(){calls.push('purge');return {processed:0,completed:0,retryRequired:0};},async cleanupExpiredVisibilityLocks(){calls.push('cleanup');return {removed:0};}};
  const worker=createAccountDeletionWorkerEntry({service,env:env(),logger:event=>logs.push(event)});
  assert.deepEqual(await worker.run(),{ok:true,mode:'dry-run',dueCount:2});assert.deepEqual(calls,['preview']);
  assert.doesNotMatch(JSON.stringify(logs),/uid|accountId|requestId|token|email/i);
});

test('production execution requires source and backup proof, retries a partial purge, and cleans only expired visibility locks',async()=>{
  let attempts=0;const calls=[],service={executionProfile:'production-guarded',async previewDue(){return {dueCount:0};},async purgeDue(){calls.push('purge');attempts++;return attempts===1?{processed:1,completed:0,retryRequired:1}:{processed:1,completed:1,retryRequired:0};},async cleanupExpiredVisibilityLocks(){calls.push('cleanup');return {removed:0};}};
  const missing=createAccountDeletionWorkerEntry({service,env:env('execute'),loadReadiness:async()=>({scope:'production',sources:[]})});
  assert.equal((await missing.run()).error,'worker_source_readiness_incomplete');assert.equal(calls.length,0);
  const worker=createAccountDeletionWorkerEntry({service,env:env('execute'),loadReadiness:readiness});
  assert.deepEqual(await worker.run(),{ok:true,mode:'execute',processed:1,completed:0,retryRequired:1,visibilityLocksRemoved:0});
  assert.deepEqual(await worker.run(),{ok:true,mode:'execute',processed:1,completed:1,retryRequired:0,visibilityLocksRemoved:0});
  assert.deepEqual(calls,['purge','cleanup','purge','cleanup']);
});
