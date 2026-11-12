import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createAccountDeletionRestorePlan,stageAccountDeletionGuardedRestore} from '../server/account-deletion-restore-guard.mjs';

const rows=[
  {collection:'saves',id:'target-a',ownerAccountId:'fixture-account-a'},
  {collection:'saves',id:'other-b',ownerAccountId:'fixture-account-b'},
  {collection:'privateGameSaves',id:'target-uid',ownerUid:'fixture-uid-pending'},
  {collection:'purchases',id:'other-purchase',accountId:'fixture-account-c'},
];
const authority={async lookup(owner){
  if(owner.accountId==='fixture-account-a')return {state:'retention_pending'};
  if(owner.uid==='fixture-uid-pending')return {state:'complete'};
  return null;
}};

test('restore plan quarantines retention-pending and completed owners but stages unrelated accounts',async()=>{
  const staged=[],quarantined=[];
  const counts=await stageAccountDeletionGuardedRestore({records:rows,visibilityAuthority:authority,writeToIsolatedStaging:async row=>staged.push(row.id),writeToRestrictedQuarantine:async row=>quarantined.push(row.id)});
  assert.deepEqual(counts,{scanned:4,usable:2,quarantined:2});
  assert.deepEqual(staged,['other-b','other-purchase']);
  assert.deepEqual(quarantined,['target-a','target-uid']);
});

test('owner ambiguity and visibility lookup failures abort before either writer runs',async()=>{
  for(const badRecords of [[{collection:'saves',id:'unowned'}],[{collection:'saves',id:'bad-owner',ownerAccountId:'fixture-account-z'}],[{collection:'accounts',id:'fixture-account-a',accountId:'fixture-account-b'}]]){
    const staged=[],quarantined=[];
    const badAuthority=badRecords[0].id==='bad-owner'?{async lookup(){throw Error('synthetic lookup outage');}}:authority;
    await assert.rejects(stageAccountDeletionGuardedRestore({records:badRecords,visibilityAuthority:badAuthority,writeToIsolatedStaging:async row=>staged.push(row),writeToRestrictedQuarantine:async row=>quarantined.push(row)}),/restore_owner_scope_unknown|restore_visibility_status_unavailable|restore_owner_scope_conflict/);
    assert.deepEqual(staged,[]);assert.deepEqual(quarantined,[]);
  }
});

test('records with UID and account identifiers require an independently verified owner mapping',async()=>{
  const record={collection:'saves',id:'paired-owner',ownerUid:'fixture-uid-a',ownerAccountId:'fixture-account-a'};
  await assert.rejects(createAccountDeletionRestorePlan({records:[record],visibilityAuthority:authority}),/restore_owner_pair_unverified/);
  const trusted={async lookup(){return null;},async verifyOwnerPair({uid,accountId}){return uid==='fixture-uid-a'&&accountId==='fixture-account-a';}};
  const plan=await createAccountDeletionRestorePlan({records:[record],visibilityAuthority:trusted});
  assert.equal(plan.counts.usable,1);
});

test('unknown marker state fails closed and all marker checks precede writes',async()=>{
  const staged=[],quarantined=[];
  const badAuthority={async lookup(owner){if(owner.accountId==='fixture-account-b')return {state:'restoring'};return null;}};
  await assert.rejects(createAccountDeletionRestorePlan({records:rows,visibilityAuthority:badAuthority}),/restore_visibility_status_unavailable/);
  await assert.rejects(stageAccountDeletionGuardedRestore({records:rows,visibilityAuthority:badAuthority,writeToIsolatedStaging:async row=>staged.push(row),writeToRestrictedQuarantine:async row=>quarantined.push(row)}),/restore_visibility_status_unavailable/);
  assert.deepEqual(staged,[]);assert.deepEqual(quarantined,[]);
});

test('quarantine writer must finish before any unrelated record is staged',async()=>{
  const sequence=[];
  await assert.rejects(stageAccountDeletionGuardedRestore({records:rows,visibilityAuthority:authority,writeToRestrictedQuarantine:async row=>{sequence.push('quarantine:'+row.id);throw Error('fixture write failure');},writeToIsolatedStaging:async row=>sequence.push('stage:'+row.id)}),/restore_stage_write_failed/);
  assert.deepEqual(sequence,['quarantine:target-a']);
});
