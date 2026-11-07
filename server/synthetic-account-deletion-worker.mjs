import {ACCOUNT_DELETION_SOURCES,createAccountDeletionService} from './account-deletion-service.mjs';

const fixture={uid:'fixture-delete-uid',accountId:'fixture-delete-account',requestId:'fixture-delete-request',purgeAfter:1000,state:'retention_pending',completedSources:[],policyRefs:{transactionDisposition:'retain_minimized',sharedRecordDisposition:'anonymize'}};

export function createSyntheticAccountDeletionWorkerService({now=2000,failOnceAt=null}={}){
  const progress=structuredClone(fixture),applied=[],failed=new Set();
  const adapter={
    resolveAccount:async()=>fixture.accountId,isUidBlocked:async()=>true,
    inspectAccount:async()=>Object.fromEntries(ACCOUNT_DELETION_SOURCES.map(name=>[name,{complete:true,ownershipVerified:true,count:0,restoreSuppressionVerified:name==='backups',deviceCleanupConfirmed:true}])),
    beginDeletion:async()=>{throw Error('fixture_worker_does_not_accept_deletion_requests');},
    getProgress:async()=>structuredClone(progress),markAuthDisabled:async()=>{},markAuthRevoked:async()=>{},
    markPurging:async()=>{progress.state='purging';},markSourceCompleted:async({name})=>{progress.completedSources=[...new Set([...progress.completedSources,name])];},
    markCompleted:async()=>{progress.state='complete';progress.completed=true;},disableAuthUser:async()=>{},revokeAuthTokens:async()=>{},deleteAuthUser:async()=>{},
    applySource:async({name})=>{applied.push(name);if(name===failOnceAt&&!failed.has(name)){failed.add(name);throw Error('synthetic_interruption');}},
    listDueDeletions:async({now:current,limit})=>progress.purgeAfter<=current&&['retention_pending','purging'].includes(progress.state)?[{...structuredClone(progress)}].slice(0,limit):[],
    listExpiredVisibilityLocks:async()=>[],clearExpiredVisibilityLock:async()=>{},
  };
  const service=createAccountDeletionService({verifyRequester:async()=>null,adapter,now:()=>now,createRequestId:()=>fixture.requestId,executionProfile:'synthetic-fixture'});
  return Object.freeze({service,progress,applied});
}
