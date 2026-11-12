// Synthetic-only deletion planning and restore exercise. This module is not wired to
// the product API and must never be used to mutate production accounts.
const REQUIRED_SOURCES=[
  'accounts','identityMappings','sessions','loginAttempts','productSaves',
  'firebaseAuthUsers','privateGameSaves','privateMigrationSaves','legacySaves',
  'productGameDocuments','rankingsAndGroups','purchaseRecords','stripeOrders',
  'backups','browserCopies',
];
const clone=value=>structuredClone(value);
const scopedTo=(row,accountId,collection)=>row?.accountId===accountId||row?.ownerAccountId===accountId||collection==='accounts'&&row?.id===accountId;

export function planSyntheticAccountDeletion({accountId,requesterAccountId,inventory={},transactionDisposition}={}){
  const blockers=[];
  if(typeof accountId!=='string'||!accountId||requesterAccountId!==accountId)blockers.push('requester_not_verified_as_account_owner');
  const sources=[];
  for(const name of REQUIRED_SOURCES){
    const source=inventory[name];
    if(!source||source.complete!==true||source.referencesVerified!==true){blockers.push(`inventory_incomplete:${name}`);sources.push({name,complete:false,targetRecords:0});continue;}
    if(!Array.isArray(source.records)){blockers.push(`inventory_records_missing:${name}`);sources.push({name,complete:false,targetRecords:0});continue;}
    const records=source.records;
    if(records.some(row=>!row||typeof row!=='object'||typeof row.accountId!=='string'&&typeof row.ownerAccountId!=='string'&&!(name==='accounts'&&typeof row.id==='string')))blockers.push(`unscoped_records:${name}`);
    if(name==='backups'&&source.restoreSuppressionVerified!==true)blockers.push('backup_restore_suppression_not_verified');
    if(name==='browserCopies'&&records.some(row=>scopedTo(row,accountId)))blockers.push('browser_copies_require_user_device_cleanup');
    const targetRecords=records.filter(row=>scopedTo(row,accountId,name)).length;
    const financial=name==='purchaseRecords'||name==='stripeOrders';
    if(financial&&targetRecords&&transactionDisposition!=='retain'&&transactionDisposition!=='delete')blockers.push('transaction_record_policy_unresolved');
    sources.push({name,complete:true,targetRecords,handling:financial&&targetRecords?transactionDisposition:'delete_or_restore_suppress'});
  }
  return {scope:'synthetic-fixture-only',accountId,ready:blockers.length===0,blockers:[...new Set(blockers)],sources};
}

export function applySyntheticAccountDeletion({plan,snapshot,suppressionLedger,requesterAccountId,confirmation,failAfter=Infinity}={}){
  if(plan?.scope!=='synthetic-fixture-only'||plan.ready!==true)throw Error('deletion_plan_not_ready');
  if(requesterAccountId!==plan.accountId||confirmation!==plan.accountId)throw Error('account_confirmation_mismatch');
  if(!snapshot||typeof snapshot!=='object'||!(suppressionLedger instanceof Set))throw Error('invalid_synthetic_deletion_fixture');
  const accountId=plan.accountId;
  // The ledger is deliberately outside the backup snapshot and is written before purge.
  suppressionLedger.add(accountId);
  let removed=0;
  for(const [collection,records] of Object.entries(snapshot)){
    if(!Array.isArray(records))continue;
    snapshot[collection]=records.filter(row=>{
      if((collection==='purchaseRecords'||collection==='stripeOrders')&&plan.sources.find(source=>source.name===collection)?.handling==='retain')return true;
      const target=scopedTo(row,accountId,collection);
      if(target){removed++;if(removed>=failAfter)throw Error('synthetic_interrupted_after_tombstone');}
      return !target;
    });
  }
  return {deleted:true,removed,suppressed:true};
}

export function restoreSyntheticBackup(backupSnapshot,suppressionLedger){
  if(!(suppressionLedger instanceof Set))throw Error('invalid_suppression_ledger');
  const restored=clone(backupSnapshot);
  for(const [collection,records] of Object.entries(restored)){
    if(!Array.isArray(records))continue;
    restored[collection]=records.filter(row=>!([...suppressionLedger].some(accountId=>scopedTo(row,accountId,collection))));
  }
  return restored;
}

export const syntheticDeletionSourceNames=Object.freeze([...REQUIRED_SOURCES]);
