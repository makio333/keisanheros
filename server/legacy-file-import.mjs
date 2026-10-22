import {gunzipSync} from 'node:zlib';
import {parseLegacySaveFile} from '../legacy_save_file.js';
import {legacySnapshot,grantLegacyFacilityAccessInTransaction} from './legacy-migration.mjs';
export function createLegacyFileImporter({store,sessions,accountId:recipientId,sourceProject,now=Date.now}){
  return {async process(sessionId,{file,apply=false}){
    const session=await sessions.get(sessionId,now());
    if(!session||session.expiresAt<=now())throw Error('authentication_required');
    if(!recipientId||session.accountId!==recipientId||!sourceProject)throw Error('migration_not_authorized');
    const parsed=parseLegacySaveFile(file);
    if(parsed.sourceProject!==sourceProject)throw Error('migration_source_mismatch');
    const snapshots=parsed.saves.map(row=>legacySnapshot(sourceProject,row.documentId,{gameData:JSON.stringify(row.gameState)}));
    if(snapshots.reduce((size,row)=>size+Buffer.byteLength(row.gameStateGzip),0)>7*1024*1024)throw Error('migration_file_too_large');
    return store.transaction(async tx=>{
      if(!await tx.getAccount(recipientId))throw Error('account_not_found');
      const plans=[];
      for(const snapshot of snapshots){
        const claim=await tx.getLegacyClaim(snapshot.legacyKey),save=await tx.getSave(snapshot.legacyKey);
        if(claim&&claim.accountId!==recipientId||save&&save.ownerAccountId!==recipientId)throw Error('legacy_already_claimed');
        if(claim&&!save)throw Error('migration_inconsistent');
        plans.push({snapshot,exists:!!save});
      }
      const result={total:plans.length,imported:plans.filter(row=>!row.exists).length,skipped:plans.filter(row=>row.exists).length,names:snapshots.map(row=>row.name)};
      if(!apply)return {...result,applied:false};
      await grantLegacyFacilityAccessInTransaction({tx,accountId:recipientId,sourceProject,snapshots,now:now()});
      // The grant must also cover any unrelated saves already created in this account.
      const existing=await tx.listSaves(recipientId),owner=await tx.getAccount(recipientId);
      if(existing.length+result.imported>owner.facilityAccess.saveLimit)throw Error('save_limit_reached');
      for(const {snapshot,exists} of plans){
        if(!exists){
          const gameState=JSON.parse(gunzipSync(Buffer.from(snapshot.gameStateGzip,'base64')).toString());
          tx.putSave({key:snapshot.legacyKey,ownerAccountId:recipientId,name:snapshot.name,gameState,revision:1,createdAt:now(),updatedAt:now()});
        }
        tx.putLegacyClaim({legacyKey:snapshot.legacyKey,saveKey:snapshot.legacyKey,accountId:recipientId,claimedAt:now()});
      }
      return {...result,applied:true};
    });
  }};
}
