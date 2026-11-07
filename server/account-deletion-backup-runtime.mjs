import {createHash} from 'node:crypto';
import {verifyBackupInventoryManifest,stageBackupManifestRestore} from './account-deletion-backup-manifest.mjs';

const hash=value=>createHash('sha256').update(value).digest('hex');
const validHash=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const validId=value=>typeof value==='string'&&/^[A-Za-z0-9._:-]{1,200}$/.test(value);
const stateRank={retention_pending:1,purging:2,complete:3};

// The store is a separately protected, durable database, never a table that is
// restored together with game saves. No SDK, credentials or network is created here.
export function createIndependentDeletionLedger({store,authorityId,gameDataAuthorityId,now=Date.now}={}){
  if(typeof store?.transaction!=='function'||!validId(authorityId)||!validId(gameDataAuthorityId)||authorityId===gameDataAuthorityId||typeof now!=='function')throw Error('independent_deletion_ledger_required');
  const key=(kind,value)=>`deletion-ledger/${kind}/${value}`;
  async function lookupHashed(kind,value){
    if(!['uid','accountId'].includes(kind)||!validHash(value))throw Error('deletion_ledger_owner_invalid');
    return store.transaction(async tx=>{
      const row=await tx.get(key(kind,value));
      if(row===null||row===undefined)return null;
      if(!stateRank[row.state]||row.authorityId!==authorityId||row.ownerHash!==value||row.ownerKind!==kind||!validHash(row.uidHash)||!validHash(row.accountIdHash))throw Error('deletion_ledger_corrupt');
      return {state:row.state,uidHash:row.uidHash,accountIdHash:row.accountIdHash,requestId:row.requestId};
    });
  }
  async function record({uidHash,accountIdHash,requestId,requestedAt,purgeAfter,state='retention_pending'}={}){
    if(!validHash(uidHash)||!validHash(accountIdHash)||!validId(requestId)||!Number.isSafeInteger(requestedAt)||!Number.isSafeInteger(purgeAfter)||purgeAfter<=requestedAt||!stateRank[state])throw Error('deletion_ledger_scope_invalid');
    await store.transaction(async tx=>{
      const refs=[['uid',uidHash],['accountId',accountIdHash]];
      const existing=await Promise.all(refs.map(([kind,value])=>tx.get(key(kind,value))));
      for(const previous of existing){
        if(previous&&(previous.authorityId!==authorityId||previous.uidHash!==uidHash||previous.accountIdHash!==accountIdHash||previous.requestId!==requestId||previous.requestedAt!==requestedAt||previous.purgeAfter!==purgeAfter||!stateRank[previous.state]))throw Error('deletion_ledger_scope_conflict');
      }
      const rank=Math.max(stateRank[state],...existing.map(row=>stateRank[row?.state]||0));
      const nextState=Object.keys(stateRank).find(s=>stateRank[s]===rank);
      for(const [kind,value] of refs)tx.put(key(kind,value),{authorityId,ownerKind:kind,ownerHash:value,uidHash,accountIdHash,requestId,requestedAt,purgeAfter,state:nextState,updatedAt:now()});
    });
    return {suppressed:true};
  }
  return Object.freeze({idempotent:true,authorityId,record,
    suppress:record,
    async lookup(owner){
      const keys=Object.keys(owner||{});
      if(keys.length!==1||!['uid','accountId'].includes(keys[0])||typeof owner[keys[0]]!=='string'||!owner[keys[0]])throw Error('deletion_ledger_owner_invalid');
      return lookupHashed(keys[0],hash(owner[keys[0]]));
    },
    lookupHashed,
    async verifyOwnerPair({uid,accountId}={}){
      if(typeof uid!=='string'||typeof accountId!=='string')return false;
      const [u,a]=await Promise.all([lookupHashed('uid',hash(uid)),lookupHashed('accountId',hash(accountId))]);
      return !!u&&!!a&&u.uidHash===hash(uid)&&a.accountIdHash===hash(accountId)&&u.accountIdHash===a.accountIdHash&&u.uidHash===a.uidHash&&u.requestId===a.requestId;
    },
  });
}

// provider supplies decoded records/manifests from an isolated backup reader.
// It must attest that its snapshot enumeration is complete. No assumed 7-day
// retention or live provider SDK is hidden in this composition.
export function createAccountDeletionBackupRuntime({provider,ledger,expectedProject='ailandgames',retentionPolicyId,retentionDays,restoreOwnerPairVerifier}={}){
  if(expectedProject!=='ailandgames'||typeof provider?.listSnapshots!=='function'||typeof provider?.readSnapshot!=='function'||ledger?.idempotent!==true||typeof ledger.suppress!=='function'||typeof ledger.lookupHashed!=='function'||!validId(retentionPolicyId)||!Number.isInteger(retentionDays)||retentionDays<1||retentionDays>366)throw Error('deletion_backup_runtime_not_configured');
  async function inventory(){
    const result=await provider.listSnapshots({projectId:expectedProject,retentionPolicyId,retentionDays});
    if(result?.complete!==true||result.projectId!==expectedProject||result.retentionPolicyId!==retentionPolicyId||result.retentionDays!==retentionDays||!Array.isArray(result.snapshots)||result.snapshots.length>1000)throw Error('backup_provider_inventory_incomplete');
    const seen=new Set(),snapshots=[];
    for(const snapshot of result.snapshots){
      if(!validId(snapshot?.id)||seen.has(snapshot.id))throw Error('backup_provider_snapshot_invalid');seen.add(snapshot.id);
      const parsed=verifyBackupInventoryManifest(snapshot.manifest,{expectedProject});
      if(!parsed.complete||parsed.snapshotId!==snapshot.id)throw Error('backup_provider_manifest_invalid');
      snapshots.push({...snapshot,inventory:parsed});
    }
    return snapshots;
  }
  async function inspect({uidHash,accountIdHash,policy}={}){
    if(!validHash(uidHash)||!validHash(accountIdHash)||policy?.backupRetentionPolicyId!==retentionPolicyId)return {complete:false,ownershipVerified:false,count:0,restoreSuppressionVerified:false};
    try{
      const snapshots=await inventory();let count=0;
      for(const snapshot of snapshots)for(const row of snapshot.inventory.entries){
        const owner=row.ownerAccountId??row.accountId;
        if((typeof owner==='string'&&hash(owner)===accountIdHash)||(typeof row.ownerUid==='string'&&hash(row.ownerUid)===uidHash))count++;
      }
      return {complete:true,ownershipVerified:true,count,unattributedCount:0,restoreSuppressionVerified:true,dispositionSupported:true};
    }catch{return {complete:false,ownershipVerified:false,count:0,restoreSuppressionVerified:false};}
  }
  const source=Object.freeze({idempotent:true,inspect,async apply({uidHash,accountIdHash,requestId,policy}={}){
    const report=await inspect({uidHash,accountIdHash,policy});
    if(!report.complete)throw Error('backup_provider_inventory_incomplete');
    const [u,a]=await Promise.all([ledger.lookupHashed('uid',uidHash),ledger.lookupHashed('accountId',accountIdHash)]);
    if(!u||!a||u.requestId!==requestId||a.requestId!==requestId||u.accountIdHash!==accountIdHash||a.uidHash!==uidHash)throw Error('backup_suppression_proof_missing');
    return {restoreSuppressionVerified:true,retainedCopiesExpireUnderPolicy:retentionPolicyId};
  }});
  return Object.freeze({source,backupSuppressor:ledger,retentionPolicyId,retentionDays,
    async stageRestore({snapshotId,writeToIsolatedStaging,writeToRestrictedQuarantine}={}){
      const snapshots=await inventory(),snapshot=snapshots.find(row=>row.id===snapshotId);
      if(!snapshot)throw Error('backup_snapshot_not_in_inventory');
      const content=await provider.readSnapshot({projectId:expectedProject,snapshotId});
      if(content?.complete!==true||!Array.isArray(content.records))throw Error('backup_snapshot_read_incomplete');
      const authority={lookup:ledger.lookup,async verifyOwnerPair(pair){
        if(await ledger.verifyOwnerPair(pair))return true;
        return typeof restoreOwnerPairVerifier==='function'&&await restoreOwnerPairVerifier(pair)===true;
      }};
      return stageBackupManifestRestore({manifest:snapshot.manifest,expectedProject,records:content.records,visibilityAuthority:authority,writeToIsolatedStaging,writeToRestrictedQuarantine});
    },
  });
}
