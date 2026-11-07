import assert from 'node:assert/strict';
import {test} from 'node:test';
import {runAccountDeletionWorker,SYNTHETIC_WORKER_CONFIRMATION} from '../server/account-deletion-worker.mjs';
import {createSyntheticAccountDeletionWorkerService} from '../server/synthetic-account-deletion-worker.mjs';

test('worker requires exact synthetic target and explicit dry-run or execute mode',async()=>{
  const fixture=createSyntheticAccountDeletionWorkerService(),calls=[];
  assert.equal((await runAccountDeletionWorker({service:fixture.service,target:'production',mode:'dry-run'})).error,'worker_target_not_allowed');
  assert.equal((await runAccountDeletionWorker({service:fixture.service,target:'synthetic-fixture'})).error,'worker_mode_required');
  const dry=await runAccountDeletionWorker({service:fixture.service,target:'synthetic-fixture',mode:'dry-run',logger:event=>calls.push(event)});
  assert.deepEqual(dry,{ok:true,target:'synthetic-fixture',mode:'dry-run',dueCount:1});
  assert.equal(calls[0].dueCount,1);
});

test('execute requires fixture confirmation and only emits aggregate non-identifying logs',async()=>{
  const fixture=createSyntheticAccountDeletionWorkerService(),logs=[];
  const denied=await runAccountDeletionWorker({service:fixture.service,target:'synthetic-fixture',mode:'execute'});
  assert.equal(denied.error,'explicit_fixture_confirmation_required');
  assert.equal(fixture.progress.state,'retention_pending');
  const result=await runAccountDeletionWorker({service:fixture.service,target:'synthetic-fixture',mode:'execute',confirmation:SYNTHETIC_WORKER_CONFIRMATION,logger:event=>logs.push(event)});
  assert.deepEqual(result,{ok:true,target:'synthetic-fixture',mode:'execute',processed:1,completed:1,retryRequired:0});
  assert.equal(fixture.progress.state,'complete');
  assert.doesNotMatch(JSON.stringify(logs),/fixture-delete-uid|fixture-delete-account|requestId|token|email/i);
});

test('worker retry resumes an interrupted purge through the same service tombstone',async()=>{
  const fixture=createSyntheticAccountDeletionWorkerService({failOnceAt:'privateGameSaves'}),run=()=>runAccountDeletionWorker({service:fixture.service,target:'synthetic-fixture',mode:'execute',confirmation:SYNTHETIC_WORKER_CONFIRMATION});
  const first=await run();assert.deepEqual(first,{ok:true,target:'synthetic-fixture',mode:'execute',processed:1,completed:0,retryRequired:1});
  assert.equal(fixture.progress.state,'purging');
  const second=await run();assert.deepEqual(second,{ok:true,target:'synthetic-fixture',mode:'execute',processed:1,completed:1,retryRequired:0});
  assert.equal(fixture.progress.state,'complete');
  assert.equal(fixture.applied.filter(name=>name==='privateGameSaves').length,2);
});
