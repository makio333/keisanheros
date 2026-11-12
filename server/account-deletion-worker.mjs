const CONFIRM='RUN_SYNTHETIC_FIXTURE_WORKER';

function safeLogger(logger,event){
  try{logger(Object.freeze(event));}catch{/* logging failure must not disclose worker internals */}
}

export async function runAccountDeletionWorker({service,target,mode,confirmation,limit=100,logger=()=>{}}={}){
  if(target!=='synthetic-fixture')return {ok:false,error:'worker_target_not_allowed'};
  if(!['dry-run','execute'].includes(mode))return {ok:false,error:'worker_mode_required'};
  if(!Number.isInteger(limit)||limit<1||limit>500)return {ok:false,error:'invalid_worker_limit'};
  if(service?.executionProfile!=='synthetic-fixture'||typeof service?.previewDue!=='function'||typeof service?.purgeDue!=='function')return {ok:false,error:'synthetic_service_required'};
  if(mode==='execute'&&confirmation!==CONFIRM)return {ok:false,error:'explicit_fixture_confirmation_required'};
  try{
    if(mode==='dry-run'){
      const preview=await service.previewDue({limit});
      if(!Number.isSafeInteger(preview?.dueCount)||preview.dueCount<0)return {ok:false,error:'worker_preview_invalid'};
      const result={ok:true,target,mode,dueCount:preview.dueCount};
      safeLogger(logger,{event:'account_deletion_worker_finished',...result});
      return result;
    }
    const result=await service.purgeDue({limit});
    if(!Number.isSafeInteger(result?.processed)||!Number.isSafeInteger(result?.completed)||!Number.isSafeInteger(result?.retryRequired))return {ok:false,error:'worker_result_invalid'};
    const summary={ok:true,target,mode,processed:result.processed,completed:result.completed,retryRequired:result.retryRequired};
    safeLogger(logger,{event:'account_deletion_worker_finished',...summary});
    return summary;
  }catch{
    const result={ok:false,target,mode,error:'worker_failed'};
    safeLogger(logger,{event:'account_deletion_worker_failed',target,mode,error:'worker_failed'});
    return result;
  }
}

export const SYNTHETIC_WORKER_CONFIRMATION=CONFIRM;
