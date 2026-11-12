import assert from 'node:assert/strict';
import {test} from 'node:test';
import {applySyntheticAccountDeletion,planSyntheticAccountDeletion,restoreSyntheticBackup,syntheticDeletionSourceNames} from '../server/synthetic-account-deletion.mjs';

const target='fixture-account-a',other='fixture-account-b';
function fixtureInventory({targetPurchase=false,complete=true}={}){
  return Object.fromEntries(syntheticDeletionSourceNames.map(name=>[name,{
    complete,referencesVerified:true,restoreSuppressionVerified:name==='backups'?true:undefined,
    records:[{id:name+'-other',accountId:other},...(targetPurchase&&['purchaseRecords','stripeOrders'].includes(name)?[{id:name+'-target',accountId:target,description:'架空の購入情報'}]:[])],
  }]));
}
const backup=()=>({
  accounts:[{id:target,email:'not-a-real-address@example.test'},{id:other}],
  identityMappings:[{id:'hash-a',accountId:target},{id:'hash-b',accountId:other}],
  sessions:[{id:'session-a',accountId:target}],
  productSaves:[{id:'save-a',ownerAccountId:target,name:'架空の勇者名',gameState:{secret:'fixture'}},{id:target,ownerAccountId:other,name:'別アカウントの架空セーブ'}],
  purchaseRecords:[{id:'purchase-b',accountId:other}],
});

test('incomplete inventory and undecided financial handling block a deletion plan without exposing record contents',()=>{
  const missing=fixtureInventory();delete missing.legacySaves;
  const first=planSyntheticAccountDeletion({accountId:target,requesterAccountId:target,inventory:missing});
  assert.equal(first.ready,false);assert.ok(first.blockers.includes('inventory_incomplete:legacySaves'));
  const second=planSyntheticAccountDeletion({accountId:target,requesterAccountId:target,inventory:fixtureInventory({targetPurchase:true})});
  assert.equal(second.ready,false);assert.ok(second.blockers.includes('transaction_record_policy_unresolved'));
  assert.doesNotMatch(JSON.stringify(second),/架空の購入情報|not-a-real-address|fixture-save-name/);
});

test('wrong requester or confirmation cannot mutate a synthetic snapshot',()=>{
  const original=backup(),snapshot=structuredClone(original),ledger=new Set();
  const plan=planSyntheticAccountDeletion({accountId:target,requesterAccountId:target,inventory:fixtureInventory()});
  assert.equal(plan.ready,true);
  assert.throws(()=>applySyntheticAccountDeletion({plan,snapshot,suppressionLedger:ledger,requesterAccountId:other,confirmation:target}),/account_confirmation_mismatch/);
  assert.throws(()=>applySyntheticAccountDeletion({plan,snapshot,suppressionLedger:ledger,requesterAccountId:target,confirmation:'wrong'}),/account_confirmation_mismatch/);
  assert.deepEqual(snapshot,original);assert.equal(ledger.size,0);
});

test('unscoped legacy rows, browser copies and unverified backup restore block deletion',()=>{
  const inventory=fixtureInventory();
  inventory.legacySaves.records.push({id:'ambiguous-old-save',ownerUid:'unknown-fixture-uid'});
  inventory.browserCopies.records.push({id:'local-copy',accountId:target});
  inventory.backups.restoreSuppressionVerified=false;
  const plan=planSyntheticAccountDeletion({accountId:target,requesterAccountId:target,inventory});
  assert.equal(plan.ready,false);
  assert.ok(plan.blockers.includes('unscoped_records:legacySaves'));
  assert.ok(plan.blockers.includes('browser_copies_require_user_device_cleanup'));
  assert.ok(plan.blockers.includes('backup_restore_suppression_not_verified'));
});

test('tombstone-first removal survives interruption, retry and backup restore without touching another account',()=>{
  const original=backup(),snapshot=structuredClone(original),backupCopy=structuredClone(original),ledger=new Set();
  const plan=planSyntheticAccountDeletion({accountId:target,requesterAccountId:target,inventory:fixtureInventory()});
  assert.equal(plan.ready,true);
  assert.throws(()=>applySyntheticAccountDeletion({plan,snapshot,suppressionLedger:ledger,requesterAccountId:target,confirmation:target,failAfter:1}),/synthetic_interrupted_after_tombstone/);
  assert.ok(ledger.has(target),'suppression is written before data removal');
  const result=applySyntheticAccountDeletion({plan,snapshot,suppressionLedger:ledger,requesterAccountId:target,confirmation:target});
  assert.equal(result.deleted,true);assert.ok(result.removed>=3);
  for(const [collection,rows] of Object.entries(snapshot))if(Array.isArray(rows))assert.equal(rows.some(row=>row.accountId===target||row.ownerAccountId===target||collection==='accounts'&&row.id===target),false);
  const restored=restoreSyntheticBackup(backupCopy,ledger);
  for(const [collection,rows] of Object.entries(restored))if(Array.isArray(rows))assert.equal(rows.some(row=>row.accountId===target||row.ownerAccountId===target||collection==='accounts'&&row.id===target),false);
  assert.ok(restored.accounts.some(row=>row.id===other),'unrelated account survives deletion and restore');
  assert.ok(restored.productSaves.every(row=>row.ownerAccountId!==target),'no fixture save is restored');
  assert.ok(restored.productSaves.some(row=>row.id===target&&row.ownerAccountId===other),'an unrelated row whose document ID happens to match is preserved');
});

test('retained transaction fixtures are explicitly kept while personal account data is removed',()=>{
  const inventory=fixtureInventory({targetPurchase:true});
  const plan=planSyntheticAccountDeletion({accountId:target,requesterAccountId:target,inventory,transactionDisposition:'retain'});
  assert.equal(plan.ready,true);
  const snapshot={accounts:[{id:target}],productSaves:[{id:'save',ownerAccountId:target}],purchaseRecords:[{id:'purchase',accountId:target}]};
  const ledger=new Set();
  applySyntheticAccountDeletion({plan,snapshot,suppressionLedger:ledger,requesterAccountId:target,confirmation:target});
  assert.deepEqual(snapshot.accounts,[]);assert.deepEqual(snapshot.productSaves,[]);
  assert.equal(snapshot.purchaseRecords.length,1);
});
