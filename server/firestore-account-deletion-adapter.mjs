import {createHash} from 'node:crypto';
import {ACCOUNT_DELETION_SOURCES} from './account-deletion-service.mjs';

const digest=value=>createHash('sha256').update(value).digest('hex');
const uidIdentityKey=(projectId,uid)=>JSON.stringify(['firebase',projectId,uid]);
const userNotFound=error=>error?.code==='auth/user-not-found';
const count=value=>Number.isSafeInteger(value)&&value>=0?value:0;

// Firebase Admin objects and per-source handlers are injected. Importing this module
// never creates an app, reads credentials, contacts Firebase, or mutates a database.
export function createFirestoreAccountDeletionAdapter({db,auth,projectId='ailandgames',sourceAdapters={},backupSuppressor,tombstoneCollection='accountDeletionTombstones',accountLockCollection='accountDeletionAccountLocks',visibilityCollection='accountDeletionVisibility',now=Date.now}={}){
  if(typeof db?.collection!=='function'||typeof db?.runTransaction!=='function'||typeof auth?.getUser!=='function'||typeof auth?.updateUser!=='function'||typeof auth?.revokeRefreshTokens!=='function'||typeof auth?.deleteUser!=='function')throw Error('firebase_account_deletion_not_configured');
  if(projectId!=='ailandgames'||typeof now!=='function')throw Error('firebase_account_deletion_target_not_allowed');
  for(const name of ACCOUNT_DELETION_SOURCES){
    if(name==='firebaseAuthUsers')continue;
    const source=sourceAdapters[name];
    if(source&&(!source.idempotent||typeof source.inspect!=='function'||typeof source.apply!=='function'))throw Error('invalid_account_deletion_source_adapter');
  }
  if(backupSuppressor&&(!backupSuppressor.idempotent||typeof backupSuppressor.suppress!=='function'))throw Error('invalid_backup_suppressor');

  const uidHash=uid=>digest(uid);
  const accountHash=accountId=>digest(accountId);
  const tombstoneFor=uid=>db.collection(tombstoneCollection).doc(uidHash(uid));
  const accountLockFor=accountId=>db.collection(accountLockCollection).doc(accountHash(accountId));
  const visibilityLockFor=uid=>db.collection(visibilityCollection).doc(uid);

  async function readTombstone(uid){const snap=await tombstoneFor(uid).get();return snap.exists?snap.data():null;}
  async function resolveAccount(uid){
    if(typeof uid!=='string'||!uid||uid.length>128)throw Error('account_owner_mapping_unavailable');
    const pending=await readTombstone(uid);
    if(pending?.accountId&&pending.uidHash===uidHash(uid)&&['retention_pending','purging','in_progress'].includes(pending.state))return pending.accountId;
    const identityHash=digest(uidIdentityKey(projectId,uid));
    const identity=await db.collection('identities').doc(identityHash).get();
    const accountId=identity.exists?identity.data()?.accountId:null;
    if(typeof accountId!=='string'||!accountId)return null;
    return accountId;
  }
  async function inspectAccount({uid,accountId,policy}){
    if(typeof uid!=='string'||typeof accountId!=='string')throw Error('invalid_account_deletion_scope');
    const result={};
    for(const name of ACCOUNT_DELETION_SOURCES){
      if(name==='firebaseAuthUsers'){
        try{const user=await auth.getUser(uid);result[name]={complete:user?.uid===uid,ownershipVerified:user?.uid===uid,count:user?.uid===uid?1:0};}
        catch(error){result[name]={complete:false,ownershipVerified:false,count:0,unavailable:userNotFound(error)?'user_not_found':'auth_unavailable'};}
        continue;
      }
      const source=sourceAdapters[name];
      if(!source){result[name]={complete:false,ownershipVerified:false,count:0};continue;}
      let report;
      try{report=await source.inspect({db,uid,accountId,uidHash:uidHash(uid),accountIdHash:accountHash(accountId),policy});}catch{report=null;}
      result[name]={
        complete:report?.complete===true,
        ownershipVerified:report?.ownershipVerified===true,
        count:count(report?.count),
        unattributedCount:count(report?.unattributedCount),
        ...(report?.dispositionSupported===false?{dispositionSupported:false}:{}),
        ...(name==='backups'?{restoreSuppressionVerified:report?.restoreSuppressionVerified===true}:{}),
        ...(name==='browserCopies'?{deviceCleanupConfirmed:report?.deviceCleanupConfirmed===true}:{}),
      };
    }
    return result;
  }
  async function beginDeletion({uid,accountId,requestId,requestedAt,purgeAfter,policy}){
    if(typeof backupSuppressor?.suppress!=='function')throw Error('backup_suppression_not_configured');
    if(!Number.isSafeInteger(requestedAt)||!Number.isSafeInteger(purgeAfter)||purgeAfter<=requestedAt)throw Error('invalid_deletion_retention_window');
    const ref=tombstoneFor(uid),lock=accountLockFor(accountId),uHash=uidHash(uid),aHash=accountHash(accountId);
    await db.runTransaction(async tx=>{
      const snap=await tx.get(ref),previous=snap.exists?snap.data():null;
      if(previous)throw Error('deletion_tombstone_conflict');
      tx.set(ref,{uidHash:uHash,accountIdHash:aHash,accountId,uid,requestId,state:'retention_pending',requestedAt,purgeAfter,updatedAt:requestedAt,completedSources:[],authDisabled:false,authRevoked:false,backupSuppressed:false,
        policyRefs:{accountRetentionPolicyId:policy.accountRetentionPolicyId,backupRetentionPolicyId:policy.backupRetentionPolicyId,transactionDisposition:policy.transactionDisposition,sharedRecordDisposition:policy.sharedRecordDisposition,browserCopyNoticeConfirmed:policy.browserCopyNoticeConfirmed===true,...(policy.financialPolicyId?{financialPolicyId:policy.financialPolicyId}:{}),...(policy.sharedDisplayRedactionAccepted===true?{sharedDisplayRedactionAccepted:true}:{})}});
      tx.set(lock,{uidHash:uHash,accountIdHash:aHash,requestId,state:'retention_pending',requestedAt,purgeAfter});
      tx.set(visibilityLockFor(uid),{state:'retention_pending',requestId,requestedAt,purgeAfter});
    });
    // Backups must preserve the visibility tombstone so a restore cannot make retained
    // records visible again during the one-month retention period.
    await backupSuppressor.suppress({uidHash:uHash,accountIdHash:aHash,requestId,requestedAt,purgeAfter});
    await updateTombstone({uid,accountId,requestId,update:previous=>({...previous,backupSuppressed:true})});
    return {requestId};
  }
  async function updateTombstone({uid,accountId,requestId,update}){
    const ref=tombstoneFor(uid),uHash=uidHash(uid),aHash=accountHash(accountId);
    return db.runTransaction(async tx=>{
      const snap=await tx.get(ref);if(!snap.exists)throw Error('deletion_tombstone_missing');
      const previous=snap.data();
      if(previous.uidHash!==uHash||previous.accountIdHash!==aHash||previous.requestId!==requestId)throw Error('deletion_tombstone_scope_mismatch');
      const next=update(previous);tx.set(ref,{...next,updatedAt:now()});return next;
    });
  }
  async function getProgress({uid,accountId}){
    const value=await readTombstone(uid);if(!value||value.uidHash!==uidHash(uid))return null;
    if(value.state==='complete'&&!accountId)return {requestId:value.requestId,completed:true,state:'complete',requestedAt:value.requestedAt,purgeAfter:value.purgeAfter,completedAt:value.completedAt,completedSources:Array.isArray(value.completedSources)?value.completedSources:[],authDisabled:value.authDisabled===true,authRevoked:value.authRevoked===true,policyRefs:value.policyRefs||{}};
    if(!accountId||value.accountIdHash!==accountHash(accountId))return null;
    return {requestId:value.requestId,completed:value.state==='complete',state:value.state,requestedAt:value.requestedAt,purgeAfter:value.purgeAfter,completedAt:value.completedAt,completedSources:Array.isArray(value.completedSources)?value.completedSources:[],authDisabled:value.authDisabled===true,authRevoked:value.authRevoked===true,
      policyRefs:value.policyRefs||{}};
  }

  async function scanTombstoneState(state,visit){
    let cursor=null,scanned=0;
    for(;;){
      let query=db.collection(tombstoneCollection).where('state','==',state).limit(200);
      if(cursor)query=query.startAfter(cursor);
      const snapshot=await query.get();
      if(!Array.isArray(snapshot.docs))throw Error('deletion_worker_inventory_invalid');
      if(scanned+snapshot.docs.length>10000)throw Error('deletion_worker_inventory_cap_exceeded');
      scanned+=snapshot.docs.length;
      for(const doc of snapshot.docs)visit(doc.data());
      if(snapshot.docs.length<200)break;
      const next=snapshot.docs.at(-1);
      if(!next||cursor?.id===next.id)throw Error('deletion_worker_inventory_cursor_stalled');
      cursor=next;
    }
  }

  return Object.freeze({
    resolveAccount,
    async isUidBlocked(uid){
      if(await readTombstone(uid))return true;
      return (await visibilityLockFor(uid).get()).exists;
    },
    async isAccountIdBlocked(accountId,{transaction}={}){
      if(typeof accountId!=='string'||!accountId)return false;
      const ref=accountLockFor(accountId),snap=transaction?await transaction.get(ref):await ref.get();return snap.exists;
    },
    inspectAccount,
    async beginDeletion(input){return beginDeletion(input);},
    getProgress,
    async ensureBackupSuppression({uid,accountId,requestId}){
      const previous=await readTombstone(uid);
      if(!previous||previous.uidHash!==uidHash(uid)||previous.accountIdHash!==accountHash(accountId)||previous.requestId!==requestId||!['retention_pending','purging'].includes(previous.state))throw Error('deletion_tombstone_scope_mismatch');
      if(typeof backupSuppressor?.suppress!=='function')throw Error('backup_suppression_not_configured');
      await backupSuppressor.suppress({uidHash:previous.uidHash,accountIdHash:previous.accountIdHash,requestId,requestedAt:previous.requestedAt,purgeAfter:previous.purgeAfter,state:previous.state});
      if(previous.backupSuppressed!==true)await updateTombstone({uid,accountId,requestId,update:value=>({...value,backupSuppressed:true})});
    },
    async listProtectionRetries({limit=100}={}){
      if(!Number.isInteger(limit)||limit<1||limit>500)throw Error('invalid_deletion_worker_query');
      const rows=[];
      await scanTombstoneState('retention_pending',row=>{
        if((row.backupSuppressed!==true||row.authDisabled!==true||row.authRevoked!==true)&&typeof row.uid==='string'&&typeof row.accountId==='string'&&typeof row.requestId==='string')rows.push({uid:row.uid,accountId:row.accountId,requestId:row.requestId});
      });
      return rows.slice(0,limit);
    },
    async disableAuthUser(uid){try{await auth.updateUser(uid,{disabled:true});}catch(error){if(!userNotFound(error))throw error;}},
    async markAuthDisabled(input){
      await updateTombstone({...input,update:previous=>({...previous,authDisabled:true})});
      await db.runTransaction(async tx=>{const ref=accountLockFor(input.accountId),snap=await tx.get(ref);if(!snap.exists)throw Error('deletion_account_lock_missing');tx.set(ref,{...snap.data(),authDisabled:true});});
    },
    async markAuthRevoked(input){
      await updateTombstone({...input,update:previous=>({...previous,authRevoked:true})});
      await db.runTransaction(async tx=>{const ref=accountLockFor(input.accountId),snap=await tx.get(ref);if(!snap.exists)throw Error('deletion_account_lock_missing');tx.set(ref,{...snap.data(),authRevoked:true});});
    },
    async markPurging(input){
      await updateTombstone({...input,update:previous=>{
        if(!['retention_pending','purging'].includes(previous.state))throw Error('deletion_not_pending');
        if(previous.purgeAfter>input.purgingAt)throw Error('deletion_not_due');
        return {...previous,state:'purging',purgingAt:previous.purgingAt||input.purgingAt};
      }});
      await db.runTransaction(async tx=>{const ref=accountLockFor(input.accountId),snap=await tx.get(ref);if(!snap.exists)throw Error('deletion_account_lock_missing');tx.set(ref,{...snap.data(),state:'purging'});});
      await db.runTransaction(async tx=>{const ref=visibilityLockFor(input.uid),snap=await tx.get(ref);if(snap.exists)tx.set(ref,{...snap.data(),state:'purging'});});
    },
    async listDueDeletions({now:currentTime,limit=100}={}){
      if(!Number.isSafeInteger(currentTime)||!Number.isInteger(limit)||limit<1||limit>500)throw Error('invalid_deletion_worker_query');
      const rows=[];
      for(const state of ['retention_pending','purging']){
        await scanTombstoneState(state,value=>{if(Number.isSafeInteger(value?.purgeAfter)&&value.purgeAfter<=currentTime&&typeof value?.uid==='string'&&typeof value?.accountId==='string')rows.push({uid:value.uid,accountId:value.accountId,requestId:value.requestId,purgeAfter:value.purgeAfter,policyRefs:value.policyRefs||{},state:value.state});});
      }
      return rows.sort((a,b)=>a.purgeAfter-b.purgeAfter).slice(0,limit);
    },
    async listExpiredVisibilityLocks({now:currentTime,limit=100}={}){
      if(!Number.isSafeInteger(currentTime)||!Number.isInteger(limit)||limit<1||limit>500)throw Error('invalid_deletion_visibility_query');
      const snap=await db.collection(visibilityCollection).where('state','==','complete').limit(limit).get();
      return snap.docs.filter(doc=>Number.isSafeInteger(doc.data()?.deleteAfter)&&doc.data().deleteAfter<=currentTime).map(doc=>({uid:doc.id,deleteAfter:doc.data().deleteAfter}));
    },
    async clearExpiredVisibilityLock({uid,deleteAfter,now:currentTime}={}){
      if(typeof uid!=='string'||!Number.isSafeInteger(deleteAfter)||!Number.isSafeInteger(currentTime)||currentTime<deleteAfter)throw Error('visibility_lock_not_expired');
      const ref=visibilityLockFor(uid);
      await db.runTransaction(async tx=>{const snap=await tx.get(ref);if(snap.exists&&snap.data()?.state==='complete'&&snap.data()?.deleteAfter===deleteAfter)tx.delete(ref);});
    },
    async markSourceCompleted({uid,accountId,requestId,name}){
      if(!ACCOUNT_DELETION_SOURCES.includes(name))throw Error('invalid_deletion_source');
      await updateTombstone({uid,accountId,requestId,update:previous=>({...previous,completedSources:[...new Set([...(previous.completedSources||[]),name])]})});
    },
    async markCompleted({uid,accountId,requestId,completedAt}){
      const pending=await readTombstone(uid);
      if(!pending||pending.requestId!==requestId||pending.accountIdHash!==accountHash(accountId))throw Error('deletion_tombstone_scope_mismatch');
      await backupSuppressor.suppress({uidHash:pending.uidHash,accountIdHash:pending.accountIdHash,requestId,requestedAt:pending.requestedAt,purgeAfter:pending.purgeAfter,state:'complete'});
      await updateTombstone({uid,accountId,requestId,update:previous=>{
        const {accountId:_discard,uid:_discardUid,...minimal}=previous;
        return {...minimal,state:'complete',completedAt};
      }});
      await db.runTransaction(async tx=>{const ref=accountLockFor(accountId),snap=await tx.get(ref);if(!snap.exists)throw Error('deletion_account_lock_missing');tx.set(ref,{...snap.data(),state:'complete',completedAt});});
      await db.runTransaction(async tx=>{const ref=visibilityLockFor(uid),snap=await tx.get(ref);if(snap.exists)tx.set(ref,{...snap.data(),state:'complete',completedAt,deleteAfter:completedAt+60*60*1000});});
    },
    async revokeAuthTokens(uid){try{await auth.revokeRefreshTokens(uid);}catch(error){if(!userNotFound(error))throw error;}},
    async deleteAuthUser(uid){try{await auth.deleteUser(uid);}catch(error){if(!userNotFound(error))throw error;}},
    async applySource({name,uid,accountId,requestId,disposition,policy}){
      if(name==='firebaseAuthUsers')return; // Firebase Auth is deleted last, after Firestore cleanup.
      const source=sourceAdapters[name];if(!source)throw Error('account_deletion_source_unimplemented');
      await source.apply({db,uid,accountId,uidHash:uidHash(uid),accountIdHash:accountHash(accountId),requestId,disposition,policy});
    },
  });
}
