import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createAccountDeletionNotice} from '../server/account-deletion-notifications.mjs';

const purgeAfter=1900000000000;

test('receipt notice clearly says accepted but not deleted and is draft-only',()=>{
  const message=createAccountDeletionNotice({stage:'received',state:'retention_pending',purgeAfter});
  assert.equal(message.delivery,'draft-only');assert.equal(message.to,null);
  assert.match(message.text,/受け付けました/);assert.match(message.text,/削除完了ではありません/);assert.match(message.text,/account-device-cleanup\.html/);
});

test('retention-expired notice requires a due purge in progress and does not claim completion',()=>{
  assert.throws(()=>createAccountDeletionNotice({stage:'retention-ended',state:'purging',purgeAfter,now:purgeAfter-1}),/state_mismatch/);
  const message=createAccountDeletionNotice({stage:'retention-ended',state:'purging',purgeAfter,now:purgeAfter});
  assert.match(message.text,/保持期間が終了/);assert.match(message.text,/削除完了のお知らせではありません/);
});

test('completion notice refuses missing source, backup, auth, or elapsed-period proof',()=>{
  const completionProof={allSourcesComplete:true,backupSuppressionVerified:true,authUserDeleted:true};
  assert.throws(()=>createAccountDeletionNotice({stage:'completed',state:'purging',purgeAfter,completedAt:purgeAfter+1,completionProof}),/completion_not_verified/);
  assert.throws(()=>createAccountDeletionNotice({stage:'completed',state:'complete',purgeAfter,completedAt:purgeAfter-1,completionProof}),/completion_not_verified/);
  assert.throws(()=>createAccountDeletionNotice({stage:'completed',state:'complete',purgeAfter,completedAt:purgeAfter+1,completionProof:{...completionProof,backupSuppressionVerified:false}}),/completion_not_verified/);
});

test('completion notice is generated only with full proof and never sends email',()=>{
  const message=createAccountDeletionNotice({stage:'completed',state:'complete',purgeAfter,completedAt:purgeAfter+1000,completionProof:{allSourcesComplete:true,backupSuppressionVerified:true,authUserDeleted:true}});
  assert.equal(message.delivery,'draft-only');assert.equal(message.to,null);assert.match(message.text,/削除を確認しました/);assert.match(message.text,/遠隔削除できない/);
});
