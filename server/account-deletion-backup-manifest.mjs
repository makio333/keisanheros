import {createHash} from 'node:crypto';
import {createAccountDeletionRestorePlan,stageAccountDeletionGuardedRestore} from './account-deletion-restore-guard.mjs';

const recordLike=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
const validText=value=>typeof value==='string'&&value.length>0&&value.length<=1500;
const canonical=value=>{
  if(Array.isArray(value))return `[${value.map(canonical).join(',')}]`;
  if(recordLike(value))return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
};
const digest=value=>createHash('sha256').update(canonical(value)).digest('hex');
const validOwnerPair=record=>{
  const account=record.ownerAccountId??record.accountId??null,uid=record.ownerUid??null;
  return (account===null||validText(account))&&(uid===null||validText(uid))&&(account!==null||uid!==null);
};
const refKey=record=>`${record.collection}\0${record.id}`;

export function createBackupInventoryManifest({sourceProject,snapshotId,capturedAt,records,maxRecords=100000}={}){
  if(!/^[a-z][a-z0-9-]{4,62}$/.test(sourceProject||'')||!validText(snapshotId)||snapshotId.length>256||!Number.isSafeInteger(capturedAt)||capturedAt<0||!Array.isArray(records)||records.length>maxRecords)throw Error('backup_inventory_input_invalid');
  const seen=new Set(),entries=[];
  for(const record of records){
    if(!recordLike(record)||!validText(record.collection)||!validText(record.id)||!recordLike(record.data)||!validOwnerPair(record.data))throw Error('backup_inventory_owner_or_shape_unknown');
    const key=refKey(record);if(seen.has(key))throw Error('backup_inventory_duplicate_record');seen.add(key);
    const entry={collection:record.collection,id:record.id,recordSha256:digest(record.data),...(record.data.ownerAccountId?{ownerAccountId:record.data.ownerAccountId}:{}),...(record.data.accountId?{accountId:record.data.accountId}:{}),...(record.data.ownerUid?{ownerUid:record.data.ownerUid}:{})};
    entries.push(entry);
  }
  const manifest={schemaVersion:1,sourceProject,snapshotId,capturedAt,complete:true,recordCount:entries.length,entries};
  return Object.freeze({...manifest,manifestSha256:digest(manifest)});
}

export function verifyBackupInventoryManifest(manifest,{expectedProject,maxRecords=100000}={}){
  if(!recordLike(manifest)||manifest.schemaVersion!==1||manifest.complete!==true||typeof expectedProject!=='string'||manifest.sourceProject!==expectedProject||!validText(manifest.snapshotId)||!Number.isSafeInteger(manifest.capturedAt)||!Array.isArray(manifest.entries)||manifest.entries.length>maxRecords||manifest.recordCount!==manifest.entries.length||! /^[a-f0-9]{64}$/.test(manifest.manifestSha256||''))return {complete:false,reason:'backup_manifest_incomplete_or_wrong_project',entries:[]};
  const {manifestSha256,...unsigned}=manifest;
  if(digest(unsigned)!==manifestSha256)return {complete:false,reason:'backup_manifest_digest_mismatch',entries:[]};
  const seen=new Set();
  for(const entry of manifest.entries){
    if(!recordLike(entry)||!validText(entry.collection)||!validText(entry.id)||! /^[a-f0-9]{64}$/.test(entry.recordSha256||'')||!validOwnerPair(entry)){return {complete:false,reason:'backup_manifest_entry_invalid',entries:[]};}
    const key=refKey(entry);if(seen.has(key))return {complete:false,reason:'backup_manifest_duplicate_record',entries:[]};seen.add(key);
  }
  return {complete:true,sourceProject:manifest.sourceProject,snapshotId:manifest.snapshotId,recordCount:manifest.recordCount,entries:manifest.entries};
}

function verifySnapshotMatchesManifest(manifestEntries,records){
  if(!Array.isArray(records)||records.length!==manifestEntries.length)throw Error('backup_snapshot_manifest_count_mismatch');
  const expected=new Map(manifestEntries.map(entry=>[refKey(entry),entry]));
  for(const record of records){
    if(!recordLike(record)||!recordLike(record.data))throw Error('backup_snapshot_record_invalid');
    const entry=expected.get(refKey(record));
    if(!entry||entry.recordSha256!==digest(record.data)||!validOwnerPair(record.data))throw Error('backup_snapshot_manifest_record_mismatch');
    for(const field of ['ownerAccountId','accountId','ownerUid'])if(entry[field]!==undefined&&entry[field]!==record.data[field])throw Error('backup_snapshot_manifest_owner_mismatch');
    expected.delete(refKey(record));
  }
  if(expected.size)throw Error('backup_snapshot_manifest_record_missing');
}
function guardRecords(records){
  return records.map(record=>({
    ...record,
    ...(record.data.ownerAccountId?{ownerAccountId:record.data.ownerAccountId}:{}),
    ...(record.data.accountId?{accountId:record.data.accountId}:{}),
    ...(record.data.ownerUid?{ownerUid:record.data.ownerUid}:{}),
  }));
}

export async function planBackupManifestRestore({manifest,expectedProject,records,visibilityAuthority,maxRecords=100000}={}){
  const inventory=verifyBackupInventoryManifest(manifest,{expectedProject,maxRecords});
  if(!inventory.complete)throw Error(inventory.reason);
  verifySnapshotMatchesManifest(inventory.entries,records);
  const plan=await createAccountDeletionRestorePlan({records:guardRecords(records),visibilityAuthority});
  return Object.freeze({sourceProject:inventory.sourceProject,snapshotId:inventory.snapshotId,inventoryRecords:inventory.recordCount,counts:plan.counts,quarantinedRecords:plan.quarantinedRecords,usableRecords:plan.usableRecords});
}

export async function stageBackupManifestRestore({manifest,expectedProject,records,visibilityAuthority,writeToIsolatedStaging,writeToRestrictedQuarantine,maxRecords=100000}={}){
  const inventory=verifyBackupInventoryManifest(manifest,{expectedProject,maxRecords});
  if(!inventory.complete)throw Error(inventory.reason);
  verifySnapshotMatchesManifest(inventory.entries,records);
  const counts=await stageAccountDeletionGuardedRestore({records:guardRecords(records),visibilityAuthority,writeToIsolatedStaging,writeToRestrictedQuarantine});
  return Object.freeze({sourceProject:inventory.sourceProject,snapshotId:inventory.snapshotId,...counts});
}
