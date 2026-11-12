import {createHash} from 'node:crypto';
import {ACCOUNT_DELETION_SOURCES,createAccountDeletionService} from './account-deletion-service.mjs';
import {createFirestoreAccountDeletionAdapter} from './firestore-account-deletion-adapter.mjs';
import {createAccountDeletionWorkerEntry} from './account-deletion-worker-entry.mjs';

const hash=value=>createHash('sha256').update(value).digest('hex');
const completeSources=rows=>ACCOUNT_DELETION_SOURCES.every(name=>rows.includes(name));
export const ACCOUNT_DELETION_LIFECYCLE_MAX_SCAN=10000;

// Composition only: callers supply already-authorized Admin objects, explicit
// source adapters and independent stores. Construction never enables production.
export function createAccountDeletionRuntime({db,auth,sourceAdapters,backup,notifications,lifecycleStore,resolveVerifiedContact,verifyRequester,policy,workerEnv={},loadReadiness,now=Date.now,createRequestId,contactPreparationTtlMs=15*60*1000}={}){
  if(backup?.source?.idempotent!==true||typeof backup?.backupSuppressor?.suppress!=='function'||typeof notifications?.enqueue!=='function'||typeof notifications?.drain!=='function'||typeof lifecycleStore?.transaction!=='function'||typeof lifecycleStore?.listOpen!=='function'||typeof resolveVerifiedContact!=='function'||typeof verifyRequester!=='function')throw Error('deletion_runtime_dependencies_required');
  if(policy?.accountRetentionPolicyId!=='tokyo-calendar-month-v1'||policy.backupRetentionPolicyId!==backup.retentionPolicyId||policy.browserCopyNoticeConfirmed!==true)throw Error('deletion_runtime_policy_required');
  if(!Number.isSafeInteger(contactPreparationTtlMs)||contactPreparationTtlMs<60000||contactPreparationTtlMs>86400000)throw Error('deletion_contact_preparation_ttl_invalid');
  const combined={...sourceAdapters,backups:backup.source};
  for(const name of ACCOUNT_DELETION_SOURCES.filter(n=>n!=='firebaseAuthUsers'))if(combined[name]?.idempotent!==true||typeof combined[name]?.inspect!=='function'||typeof combined[name]?.apply!=='function')throw Error('deletion_runtime_source_missing:'+name);
  const baseAdapter=createFirestoreAccountDeletionAdapter({db,auth,sourceAdapters:combined,backupSuppressor:backup.backupSuppressor,now});
  const contactKeyFor=(uid,accountId)=>'contact:'+hash(JSON.stringify([uid,accountId]));
  // Reserve the server-generated request ID durably BEFORE tombstone/Auth work.
  // This closes the crash window between acceptance and contact association.
  const adapter=Object.freeze({...baseAdapter,async beginDeletion(input){
    const contactKey=contactKeyFor(input.uid,input.accountId);
    await lifecycleStore.transaction(async tx=>{
      const prepared=await tx.get(contactKey),existing=await tx.get(input.requestId);
      if(prepared?.state!=='prepared'||prepared.uid!==input.uid||prepared.accountId!==input.accountId||!Number.isSafeInteger(prepared.expiresAt)||prepared.expiresAt<=now()||existing)throw Error('deletion_contact_preparation_missing');
      tx.put(input.requestId,{...prepared,requestId:input.requestId,requestedAt:input.requestedAt,purgeAfter:input.purgeAfter,queuedStages:[],state:'accepting'});
      tx.put(contactKey,{state:'linked',requestId:input.requestId,updatedAt:now()});
    });
    await baseAdapter.beginDeletion(input);
    await lifecycleStore.transaction(async tx=>{const row=await tx.get(input.requestId);if(row?.state==='accepting')tx.put(input.requestId,{...row,state:'pending'});});
  }});
  const core=createAccountDeletionService({adapter,verifyRequester,now,createRequestId,executionProfile:'production-guarded'});
  const policySnapshot=Object.freeze(structuredClone(policy));

  async function expireUnacceptedContact(rowKey,row){
    if(row.expiresAt>now())return;
    await lifecycleStore.transaction(async tx=>{
      const current=await tx.get(rowKey);
      if(current?.state===row.state&&current.preparedAt===row.preparedAt&&current.uid===row.uid&&current.accountId===row.accountId&&current.requestId===row.requestId)tx.put(rowKey,{state:'expired',updatedAt:now()});
    });
  }

  async function reconcileNotices({limit=100,maxScanned=ACCOUNT_DELETION_LIFECYCLE_MAX_SCAN}={}){
    if(!Number.isInteger(limit)||limit<1||limit>100||!Number.isInteger(maxScanned)||maxScanned<1||maxScanned>ACCOUNT_DELETION_LIFECYCLE_MAX_SCAN)throw Error('deletion_lifecycle_scan_limit_invalid');
    // Finish bounded enumeration before any queue or lifecycle mutation. A full
    // page needs a stable logical storageKey cursor; old short-array stores keep
    // working, while an old full-array store cannot falsely claim completeness.
    const rows=[],seenKeys=new Set();let afterKey=null;
    for(;;){
      const pageLimit=Math.min(limit,maxScanned-rows.length+1);
      const page=await lifecycleStore.listOpen({limit:pageLimit,afterKey});
      if(!Array.isArray(page)||page.length>pageLimit)throw Error('deletion_lifecycle_inventory_invalid');
      if(rows.length+page.length>maxScanned)throw Error('deletion_lifecycle_inventory_cap_exceeded');
      const needsCursor=afterKey!==null||page.length===pageLimit;
      for(const row of page){
        if(needsCursor||row?.storageKey!==undefined){
          const key=row?.storageKey;
          if(typeof key!=='string'||!key||key.length>2000||/[\u0000-\u001f]/.test(key))throw Error('deletion_lifecycle_cursor_required');
          if(seenKeys.has(key))throw Error('deletion_lifecycle_cursor_stalled');seenKeys.add(key);
        }
      }
      rows.push(...page);
      if(page.length<pageLimit)break;
      afterKey=page.at(-1).storageKey;
    }
    let queued=0,retryRequired=0;
    for(let row of rows){
      try{
        if(typeof row?.uid!=='string'||typeof row.accountId!=='string')throw Error('deletion_lifecycle_scope_invalid');
        const progress=await adapter.getProgress({uid:row.uid,accountId:row.accountId});
        if(row.state==='prepared'||row.state==='accepting'){
          const rowKey=row.state==='prepared'?row.contactKey:row.requestId;
          if(typeof rowKey!=='string'||!Number.isSafeInteger(row.expiresAt))throw Error('deletion_contact_preparation_invalid');
          if(!progress){
            await expireUnacceptedContact(rowKey,row);
            continue;
          }
          if(typeof progress.requestId!=='string'||!Number.isSafeInteger(progress.requestedAt)||progress.requestedAt<row.preparedAt||row.requestId&&row.requestId!==progress.requestId){
            await expireUnacceptedContact(rowKey,row);
            throw Error('deletion_contact_preparation_scope_mismatch');
          }
          row=await lifecycleStore.transaction(async tx=>{
            const existing=await tx.get(progress.requestId),current=await tx.get(rowKey);
            if(!current||current.uid!==row.uid||current.accountId!==row.accountId)throw Error('deletion_lifecycle_scope_mismatch');
            if(existing&&existing.requestId!==progress.requestId)throw Error('deletion_lifecycle_scope_mismatch');
            const next={...current,requestId:progress.requestId,purgeAfter:progress.purgeAfter,state:'pending',queuedStages:current.queuedStages||[]};
            tx.put(progress.requestId,next);
            if(rowKey!==progress.requestId)tx.put(rowKey,{state:'linked',requestId:progress.requestId,updatedAt:now()});
            return next;
          });
        }
        if(typeof row.requestId!=='string')throw Error('deletion_lifecycle_scope_invalid');
        if(!progress||progress.requestId!==row.requestId)throw Error('deletion_lifecycle_scope_mismatch');
        const stages=['received',...(progress.state==='purging'||progress.completed?['retention-ended']:[]),...(progress.completed?['completed']:[])];
        for(const stage of stages){
          if(row.queuedStages?.includes(stage))continue;
          const notice={stage,state:stage==='received'?'retention_pending':stage==='retention-ended'?'purging':'complete',purgeAfter:row.purgeAfter,...(stage==='completed'?{completedAt:progress.completedAt,completionProof:{allSourcesComplete:completeSources(progress.completedSources||[]),backupSuppressionVerified:progress.completedSources?.includes('backups'),authUserDeleted:progress.completedSources?.includes('firebaseAuthUsers')}}:{})};
          await notifications.enqueue({requestId:row.requestId,uidHash:hash(row.uid),accountIdHash:hash(row.accountId),verifiedContact:row.contact,notice});
          await lifecycleStore.transaction(async tx=>{
            const current=await tx.get(row.requestId);if(!current||current.uid!==row.uid||current.accountId!==row.accountId)throw Error('deletion_lifecycle_scope_mismatch');
            const queuedStages=[...new Set([...(current.queuedStages||[]),stage])];
            if(stage==='completed')tx.put(row.requestId,{requestId:row.requestId,queuedStages,state:'complete',completedAt:now()});
            else tx.put(row.requestId,{...current,queuedStages});
          });queued++;
        }
      }catch{retryRequired++;}
    }
    return {queued,retryRequired};
  }

  const service=Object.freeze({...core,
    plan:({request}={})=>core.plan({request,policy:policySnapshot}),
    async deleteAccount({request,confirmation}={}){
      if(confirmation!=='DELETE_MY_ACCOUNT')return core.deleteAccount({request,policy:policySnapshot,confirmation});
      const assessment=await core.plan({request,policy:policySnapshot});
      if(!assessment.ready)return core.deleteAccount({request,policy:policySnapshot,confirmation});
      const principal=await verifyRequester(request);
      if(principal?.verified!==true||principal.reauthenticated!==true||typeof principal.uid!=='string'||typeof principal.accountId!=='string'||await adapter.resolveAccount(principal.uid)!==principal.accountId)return {completed:false,ready:false,blockers:['requester_not_verified_as_account_owner'],sources:[]};
      const contact=await resolveVerifiedContact({uid:principal.uid,accountId:principal.accountId});
      if(contact?.verified!==true||contact.uidHash!==hash(principal.uid)||contact.accountIdHash!==hash(principal.accountId)||typeof contact.email!=='string'||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email))return {completed:false,ready:false,blockers:['verified_deletion_contact_required'],sources:[]};
      // Persist contact before irreversible Auth disable, and bind later stages to
      // the resulting server-generated request ID. Failed acceptance sends no mail.
      const contactKey=contactKeyFor(principal.uid,principal.accountId);
      const preparedAt=now();
      await lifecycleStore.transaction(async tx=>{
        const previous=await tx.get(contactKey);
        if(previous?.state==='prepared'&&previous.expiresAt>now())throw Error('deletion_contact_preparation_in_progress');
        tx.put(contactKey,{contactKey,preparedAt,expiresAt:preparedAt+contactPreparationTtlMs,uid:principal.uid,accountId:principal.accountId,contact:structuredClone(contact),state:'prepared'});
      });
      const result=await core.deleteAccount({request,policy:policySnapshot,confirmation});
      if(result.requestId&&['retention_pending','protection_retry_required'].includes(result.state)){
        const progress=await adapter.getProgress({uid:principal.uid,accountId:principal.accountId});
        if(!progress)return {completed:false,ready:false,state:'acceptance_failed',blockers:['account_deletion_not_accepted'],sources:[]};
        if(progress.requestId!==result.requestId)throw Error('deletion_lifecycle_scope_mismatch');
        const notices=await reconcileNotices();
        return {...result,notificationQueued:notices.retryRequired===0};
      }
      await lifecycleStore.transaction(async tx=>{const current=await tx.get(contactKey);if(current?.state==='prepared'&&current.preparedAt===preparedAt)tx.put(contactKey,{state:'unused',updatedAt:now()});});
      return result;
    },
  });
  const worker=createAccountDeletionWorkerEntry({service,env:workerEnv,loadReadiness});
  return Object.freeze({service,adapter,worker,backup,notifications,reconcileNotices,
    async run(){
      const result=await worker.run();
      // A disabled/dry worker may not dispatch lifecycle mail or modify an outbox.
      if(!result.ok||result.mode!=='execute')return result;
      const notices=await reconcileNotices(),delivery=await notifications.drain();
      return {...result,notifications:{...notices,delivery}};
    },
  });
}
