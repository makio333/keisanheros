import {createHash,randomBytes} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';

const hash=value=>createHash('sha256').update(value).digest('hex');
const fail=()=>{throw Error('legacy_ownership_unverified');};
export const transferPath=code=>'legacyTransfers/'+hash(code);
export async function grantLegacyFacilityAccess({store,accountId,sourceProject,snapshots,now=Date.now()}){
  return store.transaction(tx=>grantLegacyFacilityAccessInTransaction({tx,accountId,sourceProject,snapshots,now}));
}
export async function grantLegacyFacilityAccessInTransaction({tx,accountId,sourceProject,snapshots,now=Date.now()}){
  if(!Array.isArray(snapshots)||!snapshots.length||!sourceProject||snapshots.some(row=>row.sourceProject!==sourceProject||typeof row.legacyKey!=='string'))throw Error('invalid_facility_migration');
    const account=await tx.getAccount(accountId);
    if(!account)throw Error('account_not_found');
    const bindingKey='legacyFacilityBindings/'+hash(sourceProject),binding=await tx.getGameDocument(bindingKey);
    if(binding&&binding.accountId!==accountId)throw Error('facility_already_assigned');
    const previous=account.facilityAccess;
    if(previous&&previous.sourceProject!==sourceProject)throw Error('facility_source_conflict');
    const legacyKeys=[...new Set([...(previous?.legacyKeys||[]),...snapshots.map(row=>row.legacyKey)])];
    if(legacyKeys.length>1000)throw Error('facility_save_limit_exceeded');
    const grant={kind:'legacy-migration',active:true,sourceProject,legacyKeys,saveLimit:legacyKeys.length,grantedAt:previous?.grantedAt??now,updatedAt:now};
    tx.putAccount({...account,facilityAccess:grant});
    tx.putGameDocument(bindingKey,{accountId,sourceProject,updatedAt:now});
    return {accountId,saveLimit:grant.saveLimit};
}
export function legacySnapshot(sourceProject,documentId,data){
  if(!/^[a-z][a-z0-9-]{4,62}$/.test(sourceProject)||typeof documentId!=='string'||!documentId||documentId.includes('/'))throw Error('invalid_legacy_source');
  if(data?.deleted)throw Error('legacy_save_deleted');
  let state;
  try{state=typeof data?.gameData==='string'?JSON.parse(data.gameData):data?.gameData??data;}catch{throw Error('invalid_legacy_save');}
  if(!state||typeof state!=='object'||Array.isArray(state)||!state.player||typeof state.player!=='object'||Array.isArray(state.player))throw Error('invalid_legacy_save');
  const encoded=JSON.stringify(state);
  if(Buffer.byteLength(encoded)>2*1024*1024)throw Error('save_too_large');
  const compressed=gzipSync(Buffer.from(encoded));
  if(compressed.length>650000)throw Error('save_too_large');
  return {legacyKey:'typing_rpg_save_v3::migrated-'+hash(JSON.stringify([sourceProject,documentId])),
    sourceProject,sourceDocumentId:documentId,name:String(state.playerName||data.playerName||'プレイヤー').slice(0,40),
    gameStateGzip:compressed.toString('base64'),snapshotHash:hash(encoded)};
}
export async function issueLegacyTransfer({store,accountId,snapshot,now=Date.now(),expiresAt=now+7*86400000}){
  if(typeof accountId!=='string'||!accountId||!snapshot?.legacyKey||!Number.isFinite(expiresAt)||expiresAt<=now)throw Error('invalid_legacy_transfer');
  const code=randomBytes(32).toString('base64url');
  await store.transaction(async tx=>{
    if(!await tx.getAccount(accountId))throw Error('account_not_found');
    const facility=await tx.getGameDocument('legacyFacilityBindings/'+hash(snapshot.sourceProject));
    if(facility&&facility.accountId!==accountId)throw Error('facility_already_assigned');
    if(await tx.getLegacyClaim(snapshot.legacyKey))throw Error('legacy_already_claimed');
    // A source has one current recipient; issuing a new code atomically invalidates older codes.
    tx.putGameDocument('legacyAssignments/'+hash(snapshot.legacyKey),{accountId,transferId:hash(code)});
    tx.putGameDocument(transferPath(code),{...snapshot,accountId,createdAt:now,expiresAt,status:'active'});
  });
  return {code,name:snapshot.name,legacyKey:snapshot.legacyKey,expiresAt};
}
export function createLegacyClaimVerifier({now=Date.now}={}){
  return async({accountId,legacyKey,proof,tx})=>{
    if(typeof proof!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(proof)||!tx)fail();
    const row=await tx.getGameDocument(transferPath(proof));
    if(!row||row.status!=='active'||row.accountId!==accountId||!Number.isFinite(row.expiresAt)||row.expiresAt<=now()||legacyKey!==undefined&&row.legacyKey!==legacyKey)fail();
    const assignment=await tx.getGameDocument('legacyAssignments/'+hash(row.legacyKey));
    if(assignment?.accountId!==accountId||assignment?.transferId!==hash(proof))fail();
    const bytes=gunzipSync(Buffer.from(row.gameStateGzip,'base64'),{maxOutputLength:2*1024*1024});
    if(hash(bytes)!==row.snapshotHash)fail();
    return {accountId,legacyKey:row.legacyKey,name:row.name,gameState:JSON.parse(bytes.toString('utf8'))};
  };
}

export async function revokeLegacyTransfer({store,code,now=Date.now()}){
  if(typeof code!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(code))throw Error('invalid_legacy_transfer');
  await store.transaction(async tx=>{
    const key=transferPath(code),row=await tx.getGameDocument(key);
    if(!row)throw Error('legacy_transfer_not_found');
    tx.putGameDocument(key,{...row,status:'revoked',revokedAt:now});
  });
}
