import {ACCOUNT_DELETION_SOURCES} from './account-deletion-service.mjs';

const TARGET=Object.freeze({project:'ailandgames',service:'legend-heroes-api',region:'asia-northeast1'});
const JOB_TARGET=Object.freeze({project:'ailandgames',job:'legend-heroes-deletion-worker',region:'asia-northeast1'});
const safeLog=(logger,event)=>{try{logger(Object.freeze(event));}catch{}};
const validCount=value=>Number.isSafeInteger(value)&&value>=0;

export function parseAccountDeletionWorkerConfig(env={}){
  if(env.ACCOUNT_DELETION_WORKER_ENABLED!=='1')return {ok:false,error:'worker_disabled'};
  const isJob=env.CLOUD_RUN_JOB===JOB_TARGET.job&&!env.K_SERVICE;
  if(env.GOOGLE_CLOUD_PROJECT!==TARGET.project||env.K_REGION!==TARGET.region||!(isJob||env.K_SERVICE===TARGET.service&&!env.CLOUD_RUN_JOB))return {ok:false,error:'worker_target_mismatch'};
  const mode=env.ACCOUNT_DELETION_WORKER_MODE;
  if(!['dry-run','execute'].includes(mode))return {ok:false,error:'worker_mode_required'};
  const limit=Number(env.ACCOUNT_DELETION_WORKER_LIMIT||100);
  if(!Number.isInteger(limit)||limit<1||limit>100)return {ok:false,error:'worker_limit_invalid'};
  if(mode==='execute'&&env.ACCOUNT_DELETION_WORKER_PURGE_APPROVED!=='1')return {ok:false,error:'worker_purge_not_approved'};
  return Object.freeze({ok:true,...(isJob?JOB_TARGET:TARGET),mode,limit});
}

export function verifyAccountDeletionWorkerReadiness(value){
  if(!value||value.scope!=='production'||!Array.isArray(value.sources))return {ok:false,error:'worker_readiness_unavailable'};
  const byName=new Map(value.sources.map(row=>[row?.name,row]));
  if(value.sources.length!==ACCOUNT_DELETION_SOURCES.length||byName.size!==ACCOUNT_DELETION_SOURCES.length||ACCOUNT_DELETION_SOURCES.some(name=>{
    const row=byName.get(name);return row?.complete!==true||row?.ownershipVerified!==true||row?.dispositionSupported!==true;
  }))return {ok:false,error:'worker_source_readiness_incomplete'};
  if(byName.get('backups')?.restoreSuppressionVerified!==true)return {ok:false,error:'worker_backup_guard_unverified'};
  if(value.transactionPolicyVerified!==true||value.browserCopyNoticeConfirmed!==true)return {ok:false,error:'worker_policy_unverified'};
  return {ok:true};
}

export function createAccountDeletionWorkerEntry({service,env=process.env,loadReadiness,logger=()=>{}}={}){
  const config=parseAccountDeletionWorkerConfig(env);
  if(!config.ok)return Object.freeze({config,run:async()=>({ok:false,error:config.error})});
  if(service?.executionProfile!=='production-guarded'||typeof service.previewDue!=='function'||typeof service.purgeDue!=='function'||typeof service.cleanupExpiredVisibilityLocks!=='function'){
    return Object.freeze({config:{ok:false,error:'production_guarded_service_required'},run:async()=>({ok:false,error:'production_guarded_service_required'})});
  }
  if(config.mode==='execute'&&typeof loadReadiness!=='function')return Object.freeze({config:{ok:false,error:'worker_readiness_provider_required'},run:async()=>({ok:false,error:'worker_readiness_provider_required'})});
  return Object.freeze({config,async run(){
    try{
      if(config.mode==='dry-run'){
        const preview=await service.previewDue({limit:config.limit});
        if(!validCount(preview?.dueCount))return {ok:false,error:'worker_preview_invalid'};
        const result={ok:true,mode:config.mode,dueCount:preview.dueCount};safeLog(logger,{event:'account_deletion_worker_finished',...result});return result;
      }
      const readiness=verifyAccountDeletionWorkerReadiness(await loadReadiness());
      if(!readiness.ok)return readiness;
      if(typeof service.repairPendingProtections==='function'){
        const protection=await service.repairPendingProtections({limit:config.limit});
        if(!validCount(protection?.processed)||!validCount(protection?.retryRequired)||protection.retryRequired>0)return {ok:false,error:'worker_auth_protection_retry_required'};
      }
      const purge=await service.purgeDue({limit:config.limit});
      if(!validCount(purge?.processed)||!validCount(purge?.completed)||!validCount(purge?.retryRequired)||purge.completed>purge.processed||purge.retryRequired>purge.processed)return {ok:false,error:'worker_result_invalid'};
      const locks=await service.cleanupExpiredVisibilityLocks({limit:config.limit});
      if(!validCount(locks?.removed))return {ok:false,error:'worker_lock_cleanup_invalid'};
      const result={ok:true,mode:config.mode,processed:purge.processed,completed:purge.completed,retryRequired:purge.retryRequired,visibilityLocksRemoved:locks.removed};
      safeLog(logger,{event:'account_deletion_worker_finished',...result});return result;
    }catch{
      const result={ok:false,error:'worker_failed'};safeLog(logger,{event:'account_deletion_worker_failed',mode:config.mode,error:result.error});return result;
    }
  }});
}

export const ACCOUNT_DELETION_WORKER_TARGET=TARGET;
export const ACCOUNT_DELETION_JOB_TARGET=JOB_TARGET;
