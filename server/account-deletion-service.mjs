import {randomUUID} from 'node:crypto';

export const ACCOUNT_DELETION_SOURCES=Object.freeze([
  'accounts','identityMappings','sessions','loginAttempts','productSaves',
  'firebaseAuthUsers','privateGameSaves','privateMigrationSaves','legacySaves',
  'productGameDocuments','rankingsAndGroups','purchaseRecords','stripeOrders',
  'backups','browserCopies',
]);

const SOURCE_ORDER=Object.freeze([
  'backups','sessions','loginAttempts','privateGameSaves','privateMigrationSaves',
  'productSaves','legacySaves','productGameDocuments','rankingsAndGroups',
  'purchaseRecords','stripeOrders','identityMappings','accounts','browserCopies',
  'firebaseAuthUsers',
]);
const isRecord=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
const unique=values=>[...new Set(values)];
const safeCount=value=>Number.isSafeInteger(value)&&value>=0?value:0;

// Add one calendar month in Japan time, clamping dates such as Jan 31 to the
// last day in the next month. A fixed 30-day interval is not the chosen policy.
export function addOneCalendarMonthTokyo(timestamp){
  if(!Number.isSafeInteger(timestamp)||timestamp<0)throw Error('invalid_deletion_timestamp');
  const local=new Date(timestamp+9*60*60*1000);
  const year=local.getUTCFullYear(),month=local.getUTCMonth(),day=local.getUTCDate();
  const targetMonth=month+1,targetYear=year+Math.floor(targetMonth/12),normalizedMonth=targetMonth%12;
  const lastDay=new Date(Date.UTC(targetYear,normalizedMonth+1,0)).getUTCDate();
  const localTarget=Date.UTC(targetYear,normalizedMonth,Math.min(day,lastDay),local.getUTCHours(),local.getUTCMinutes(),local.getUTCSeconds(),local.getUTCMilliseconds());
  return localTarget-9*60*60*1000;
}

function policyBlockers(policy={}){
  const blockers=[];
  if(typeof policy.accountRetentionPolicyId!=='string'||!policy.accountRetentionPolicyId.trim())blockers.push('account_retention_policy_unresolved');
  if(!['retain_minimized','delete'].includes(policy.transactionDisposition))blockers.push('transaction_record_policy_unresolved');
  if(!['anonymize','delete'].includes(policy.sharedRecordDisposition))blockers.push('shared_record_policy_unresolved');
  if(typeof policy.backupRetentionPolicyId!=='string'||!policy.backupRetentionPolicyId.trim())blockers.push('backup_retention_policy_unresolved');
  if(policy.browserCopyNoticeConfirmed!==true)blockers.push('browser_copy_notice_not_confirmed');
  return blockers;
}

function publicAssessment(blockers,sources){
  return {ready:blockers.length===0,blockers:unique(blockers),sources:sources.map(({name,complete,ownershipVerified,count,restoreSuppressionVerified,deviceCleanupConfirmed,dispositionSupported})=>({
    name,complete,ownershipVerified,count,
    ...(name==='backups'?{restoreSuppressionVerified:restoreSuppressionVerified===true}:{}),
    ...(name==='browserCopies'?{deviceCleanupConfirmed:deviceCleanupConfirmed===true}:{}),
    ...(dispositionSupported===false?{dispositionSupported:false}:{}),
  }))};
}

// The route/authentication decision is deliberately external. A production caller must
// verify a current identity and recent reauthentication; this service never trusts a UID
// or account ID supplied directly by the browser.
export function createAccountDeletionService({verifyRequester,adapter,now=Date.now,createRequestId=randomUUID,executionProfile='unconfigured',requireFirestoreRootInventory=false}={}){
  if(typeof verifyRequester!=='function'||typeof now!=='function'||typeof createRequestId!=='function')throw Error('account_deletion_not_configured');
  for(const method of ['resolveAccount','isUidBlocked','inspectAccount','beginDeletion','getProgress','markAuthDisabled','markAuthRevoked','markPurging','markSourceCompleted','markCompleted','disableAuthUser','revokeAuthTokens','deleteAuthUser','applySource','listDueDeletions','listExpiredVisibilityLocks','clearExpiredVisibilityLock'])if(typeof adapter?.[method]!=='function')throw Error('account_deletion_adapter_not_configured');

  async function assess({request,policy}={}){
    let principal;
    try{principal=await verifyRequester(request);}catch{return {principal:null,assessment:publicAssessment(['requester_not_verified_as_account_owner'],[])};}
    if(!isRecord(principal)||principal.verified!==true||typeof principal.uid!=='string'||!principal.uid)return {principal:null,assessment:publicAssessment(['requester_not_verified_as_account_owner'],[])};
    let blocked,progress;
    try{
      blocked=await adapter.isUidBlocked(principal.uid);
      progress=await adapter.getProgress({uid:principal.uid,accountId:principal.accountId||null});
    }catch{return {principal:null,assessment:publicAssessment(['deletion_status_unavailable'],[])};}
    if(progress?.completed===true)return {principal:{uid:principal.uid},assessment:publicAssessment(['account_already_deleted'],[]),blocked:true,progress};
    if(progress?.state==='retention_pending'||progress?.state==='purging')return {principal:{uid:principal.uid},assessment:publicAssessment(['account_deletion_already_in_progress'],[]),blocked:true,progress};
    let accountId;
    try{accountId=await adapter.resolveAccount(principal.uid);}catch{return {principal:null,assessment:publicAssessment(['account_owner_mapping_unavailable'],[])};}
    if(typeof accountId!=='string'||!accountId||principal.accountId&&principal.accountId!==accountId)return {principal:null,assessment:publicAssessment(['requester_not_verified_as_account_owner'],[])};
    if(blocked&&!progress)return {principal:null,assessment:publicAssessment(['deletion_status_unavailable'],[])};
    let inventory;
    try{inventory=await adapter.inspectAccount({uid:principal.uid,accountId,policy});}catch{return {principal:null,assessment:publicAssessment(['source_inventory_unavailable'],[])};}
    const blockers=policyBlockers(policy),sources=[];
    if(requireFirestoreRootInventory&&(inventory?.rootCollectionInventory?.complete!==true||inventory?.rootCollectionInventory?.scopeClassified!==true))blockers.push('firestore_root_collection_inventory_incomplete');
    for(const name of ACCOUNT_DELETION_SOURCES){
      const rowSource=inventory?.[name];
      const row={name,complete:rowSource?.complete===true,ownershipVerified:rowSource?.ownershipVerified===true,count:safeCount(rowSource?.count),restoreSuppressionVerified:rowSource?.restoreSuppressionVerified===true,deviceCleanupConfirmed:rowSource?.deviceCleanupConfirmed===true,dispositionSupported:rowSource?.dispositionSupported};
      sources.push(row);
      if(!row.complete)blockers.push(`inventory_incomplete:${name}`);
      if(!row.ownershipVerified)blockers.push(`ownership_unverified:${name}`);
      if(safeCount(rowSource?.unattributedCount)>0)blockers.push(`unattributed_records:${name}`);
      if(rowSource?.dispositionSupported===false)blockers.push(`source_disposition_unimplemented:${name}`);
      if(name==='backups'&&!row.restoreSuppressionVerified)blockers.push('backup_restore_suppression_not_verified');
      if(name==='browserCopies'&&row.count>0&&!row.deviceCleanupConfirmed)blockers.push('browser_copies_require_user_device_cleanup');
    }
    if(principal.reauthenticated!==true)blockers.push('recent_account_reauthentication_required');
    return {principal:{uid:principal.uid,accountId},assessment:publicAssessment(blockers,sources),blocked:blocked===true,progress};
  }

  async function purgeOne(deletion){
    const {uid,accountId,requestId,purgeAfter,policyRefs={}}=deletion||{};
    if(typeof uid!=='string'||typeof accountId!=='string'||typeof requestId!=='string'||!Number.isSafeInteger(purgeAfter)||purgeAfter>now())return {completed:false,state:'not_due'};
    try{
      const progress=await adapter.getProgress({uid,accountId});
      if(progress?.completed===true)return {completed:true,requestId};
      if(progress?.state!=='retention_pending'&&progress?.state!=='purging')throw Error('deletion_not_pending');
      if(purgeAfter>now())return {completed:false,state:'not_due',requestId};
      // A failed initial provider call must not be forgotten after a month.
      // Restore suppression and Auth protection finish before any physical purge.
      await protect({uid,accountId,requestId},progress);
      await adapter.markPurging({uid,accountId,requestId,purgingAt:now()});
      const policy={...policyRefs,browserCopyNoticeConfirmed:policyRefs.browserCopyNoticeConfirmed===true};
      let current=await adapter.getProgress({uid,accountId});
      for(const name of SOURCE_ORDER){
        if(current?.completedSources?.includes(name))continue;
        await adapter.applySource({name,uid,accountId,requestId,disposition:name==='rankingsAndGroups'?policy.sharedRecordDisposition:name==='purchaseRecords'||name==='stripeOrders'?policy.transactionDisposition:'delete',policy});
        await adapter.markSourceCompleted({uid,accountId,requestId,name,completedAt:now()});
        current=await adapter.getProgress({uid,accountId});
      }
      await adapter.deleteAuthUser(uid);
      await adapter.markCompleted({uid,accountId,requestId,completedAt:now()});
      return {completed:true,requestId};
    }catch{
      return {completed:false,state:'purge_retry_required',requestId};
    }
  }

  async function protect(input,progress){
    if(typeof adapter.ensureBackupSuppression==='function')await adapter.ensureBackupSuppression(input);
    if(progress?.authDisabled!==true){await adapter.disableAuthUser(input.uid);await adapter.markAuthDisabled({...input,disabledAt:now()});}
    if(progress?.authRevoked!==true){await adapter.revokeAuthTokens(input.uid);await adapter.markAuthRevoked({...input,revokedAt:now()});}
  }

  return Object.freeze({
    executionProfile,
    async plan(input={}){const result=await assess(input);return result.assessment;},
    async deleteAccount({request,policy,confirmation}={}){
      if(confirmation!=='DELETE_MY_ACCOUNT')return {completed:false,blockers:['explicit_account_confirmation_required'],sources:[]};
      const checked=await assess({request,policy});
      if(checked.progress?.completed===true)return {completed:true,requestId:checked.progress.requestId,sources:[]};
      if(checked.progress?.state==='retention_pending'||checked.progress?.state==='purging')return {completed:false,state:checked.progress.state,requestId:checked.progress.requestId,purgeAfter:checked.progress.purgeAfter,sources:[]};
      if(!checked.assessment.ready)return {completed:false,...checked.assessment};
      const {uid,accountId}=checked.principal,requestId=createRequestId(),requestedAt=now(),purgeAfter=addOneCalendarMonthTokyo(requestedAt);
      try{
        await adapter.beginDeletion({uid,accountId,requestId,requestedAt,purgeAfter,policy});
        // The tombstone/session lock is written first. Authentication is disabled and
        // refresh tokens revoked immediately; no game or purchase records are purged yet.
        await adapter.disableAuthUser(uid);
        await adapter.markAuthDisabled({uid,accountId,requestId,disabledAt:now()});
        await adapter.revokeAuthTokens(uid);
        await adapter.markAuthRevoked({uid,accountId,requestId,revokedAt:now()});
        return {completed:false,state:'retention_pending',requestId,purgeAfter,sources:checked.assessment.sources};
      }catch{
        // Keep the visibility tombstone even when provider protection needs a retry.
        return {completed:false,state:'protection_retry_required',requestId,purgeAfter,blockers:['account_hidden_but_auth_protection_needs_retry'],sources:checked.assessment.sources};
      }
    },
    async purgeDue({limit=100}={}){
      if(!Number.isInteger(limit)||limit<1||limit>500)throw Error('invalid_deletion_worker_limit');
      const due=await adapter.listDueDeletions({now:now(),limit});
      const results=[];
      for(const deletion of due)results.push(await purgeOne(deletion));
      return {processed:results.length,completed:results.filter(result=>result.completed).length,retryRequired:results.filter(result=>result.state==='purge_retry_required').length};
    },
    async previewDue({limit=100}={}){
      if(!Number.isInteger(limit)||limit<1||limit>500)throw Error('invalid_deletion_worker_limit');
      const due=await adapter.listDueDeletions({now:now(),limit});
      return {dueCount:due.length};
    },
    async repairPendingProtections({limit=100}={}){
      if(!Number.isInteger(limit)||limit<1||limit>500)throw Error('invalid_deletion_worker_limit');
      if(typeof adapter.listProtectionRetries!=='function')return {processed:0,retryRequired:0};
      const pending=await adapter.listProtectionRetries({limit});let retryRequired=0;
      for(const row of pending){
        try{
          const progress=await adapter.getProgress(row);
          if(!progress||!['retention_pending','purging'].includes(progress.state)||progress.requestId!==row.requestId)throw Error('deletion_protection_scope_mismatch');
          await protect(row,progress);
        }catch{retryRequired++;}
      }
      return {processed:pending.length,retryRequired};
    },
    async cleanupExpiredVisibilityLocks({limit=100}={}){
      if(!Number.isInteger(limit)||limit<1||limit>500)throw Error('invalid_deletion_worker_limit');
      const expired=await adapter.listExpiredVisibilityLocks({now:now(),limit});
      for(const lock of expired)await adapter.clearExpiredVisibilityLock({...lock,now:now()});
      return {removed:expired.length};
    },
  });
}
