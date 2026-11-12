import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {test} from 'node:test';
import {ACCOUNT_DELETION_SOURCES,createAccountDeletionService} from '../server/account-deletion-service.mjs';
import {addOneCalendarMonthTokyo} from '../server/account-deletion-service.mjs';
import {createAccountDeletionHandler} from '../server/account-deletion-http.mjs';

const owner={verified:true,uid:'fixture-uid',accountId:'fixture-account',reauthenticated:true};
const completePolicy={accountRetentionPolicyId:'fixture-retention-v1',backupRetentionPolicyId:'fixture-backup-v1',transactionDisposition:'retain_minimized',sharedRecordDisposition:'anonymize',browserCopyNoticeConfirmed:true};

function makeHarness({failAt=null,incomplete=null,ownerAccountId=owner.accountId,policy=completePolicy}={}){
  const state={progress:null,begins:[],applied:[],revoked:0,disabled:0,deleted:0,marked:new Set(),failed:false};let clock=1770000000000;
  const adapter={
    async resolveAccount(){return ownerAccountId;},
    async isUidBlocked(){return state.progress!==null;},
    async inspectAccount(){return Object.fromEntries(ACCOUNT_DELETION_SOURCES.map(name=>[name,{complete:name!==incomplete,ownershipVerified:name!==incomplete,count:0,unattributedCount:0,restoreSuppressionVerified:name==='backups'&&name!==incomplete,deviceCleanupConfirmed:true}]));},
    async beginDeletion(input){state.begins.push(input.requestId);if(!state.progress)state.progress={uid:owner.uid,accountId:ownerAccountId,requestId:input.requestId,state:'retention_pending',purgeAfter:input.purgeAfter,completed:false,completedSources:[],authDisabled:false,authRevoked:false,policyRefs:{accountRetentionPolicyId:input.policy.accountRetentionPolicyId,backupRetentionPolicyId:input.policy.backupRetentionPolicyId,transactionDisposition:input.policy.transactionDisposition,sharedRecordDisposition:input.policy.sharedRecordDisposition}};else assert.equal(input.requestId,state.progress.requestId);},
    async getProgress(){return state.progress;},
    async markAuthDisabled(){state.progress.authDisabled=true;},
    async markAuthRevoked(){state.progress.authRevoked=true;},
    async markPurging(){state.progress.state='purging';},
    async markSourceCompleted({name}){state.marked.add(name);state.progress.completedSources=[...state.marked];},
    async markCompleted(){state.progress.completed=true;state.progress.state='complete';},
    async disableAuthUser(){state.disabled++;},
    async revokeAuthTokens(){state.revoked++;},
    async deleteAuthUser(){state.deleted++;},
    async applySource({name}){state.applied.push(name);if(name===failAt&&!state.failed){state.failed=true;throw Error('synthetic interrupt');}},
    async listDueDeletions({now}){return state.progress&&state.progress.purgeAfter<=now&&['retention_pending','purging'].includes(state.progress.state)?[state.progress]:[];},
    async listExpiredVisibilityLocks(){return [];},
    async clearExpiredVisibilityLock(){},
  };
  const service=createAccountDeletionService({adapter,now:()=>clock,createRequestId:()=> 'fixture-request',verifyRequester:async request=>request});
  let principal={...owner};
  const authenticate=async()=>({...principal});
  const handler=createAccountDeletionHandler({service,origin:'https://shop.example',authenticate,resolvePolicy:async()=>policy});
  return {handler,service,state,setPrincipal(value){principal=value;},setNow(value){clock=value;}};
}

async function invoke(handler,{path='/api/account/deletion/plan',method='POST',origin='https://shop.example',body={},contentType='application/json'}={}){
  const req=Readable.from([Buffer.from(JSON.stringify(body))]);
  req.url=path;req.method=method;req.headers={origin,'content-type':contentType,'content-length':String(Buffer.byteLength(JSON.stringify(body)))};
  const res={headersSent:false,destroyed:false,writeHead(status,headers){this.status=status;this.headers=headers;this.headersSent=true;},end(value){this.body=JSON.parse(value);}};
  const handled=await handler(req,res);return {handled,status:res.status,headers:res.headers,body:res.body};
}

test('HTTP handler rejects wrong origin and caller-supplied identity/resume fields before auth',async()=>{
  let authCalls=0,serviceCalls=0;
  const guarded=createAccountDeletionHandler({service:{async plan(){serviceCalls++;return {ready:true,blockers:[],sources:[]};},async deleteAccount(){serviceCalls++;return {completed:true};}},origin:'https://shop.example',authenticate:async()=>{authCalls++;return owner;}});
  const wrongOrigin=await invoke(guarded,{origin:'https://attacker.example'});
  assert.equal(wrongOrigin.status,403);assert.equal(authCalls,0);
  const injected=await invoke(guarded,{body:{accountId:'other-account'}});
  assert.equal(injected.status,400);assert.equal(authCalls,0);
  const injectedResume=await invoke(guarded,{path:'/api/account/deletion/confirm',body:{confirmation:'DELETE_MY_ACCOUNT',resumeVerified:true}});
  assert.equal(injectedResume.status,400);assert.equal(authCalls,0);
  assert.equal(serviceCalls,0);
});

test('unresolved policy or incomplete inventory returns blockers and causes no deletion side effects',async()=>{
  const missingPolicy=makeHarness({policy:{}});
  const planned=await invoke(missingPolicy.handler);
  assert.equal(planned.status,409);assert.ok(planned.body.blockers.includes('account_retention_policy_unresolved'));
  const denied=await invoke(missingPolicy.handler,{path:'/api/account/deletion/confirm',body:{confirmation:'DELETE_MY_ACCOUNT'}});
  assert.equal(denied.status,409);assert.equal(missingPolicy.state.begins.length,0);assert.equal(missingPolicy.state.applied.length,0);

  const incomplete=makeHarness({incomplete:'legacySaves'});
  const blocked=await invoke(incomplete.handler,{path:'/api/account/deletion/confirm',body:{confirmation:'DELETE_MY_ACCOUNT'}});
  assert.equal(blocked.status,409);assert.ok(blocked.body.blockers.includes('inventory_incomplete:legacySaves'));
  assert.equal(incomplete.state.begins.length,0);assert.equal(incomplete.state.revoked,0);
});

test('recent reauthentication and literal confirmation are required before any state change',async()=>{
  const h=makeHarness();
  const noPhrase=await invoke(h.handler,{path:'/api/account/deletion/confirm',body:{}});
  assert.equal(noPhrase.status,400);assert.equal(h.state.begins.length,0);
  h.setPrincipal({...owner,reauthenticated:false});
  const plan=await invoke(h.handler);
  assert.equal(plan.status,409);assert.ok(plan.body.blockers.includes('recent_account_reauthentication_required'));
  assert.equal(h.state.begins.length,0);
  const stale=await invoke(h.handler,{path:'/api/account/deletion/confirm',body:{confirmation:'DELETE_MY_ACCOUNT'}});
  assert.equal(stale.status,403);assert.equal(h.state.begins.length,0);assert.equal(h.state.revoked,0);
});

test('account mismatch blocks plan; confirmed deletion hides immediately and worker later completes the purge',async()=>{
  const mismatch=makeHarness({ownerAccountId:'different-account'});
  const rejected=await invoke(mismatch.handler);
  assert.equal(rejected.status,409);assert.ok(rejected.body.blockers.includes('requester_not_verified_as_account_owner'));
  assert.equal(mismatch.state.begins.length,0);

  const h=makeHarness({failAt:'privateGameSaves'});
  const first=await invoke(h.handler,{path:'/api/account/deletion/confirm',body:{confirmation:'DELETE_MY_ACCOUNT'}});
  assert.equal(first.status,202);assert.equal(first.body.state,'retention_pending');
  assert.deepEqual(h.state.begins,['fixture-request']);
  assert.equal(first.body.purgeAfter,addOneCalendarMonthTokyo(1770000000000));
  assert.equal(h.state.applied.length,0);assert.equal(h.state.disabled,1);assert.equal(h.state.revoked,1);assert.equal(h.state.deleted,0);
  h.setNow(first.body.purgeAfter);
  const worker=await h.service.purgeDue();
  assert.deepEqual(worker,{processed:1,completed:0,retryRequired:1});
  assert.equal(h.state.progress.state,'purging');
  const retried=await h.service.purgeDue();assert.deepEqual(retried,{processed:1,completed:1,retryRequired:0});
  assert.deepEqual(h.state.begins,['fixture-request']);
  assert.equal(h.state.revoked,1);assert.equal(h.state.deleted,1);
  assert.equal(h.state.progress.completed,true);
});
