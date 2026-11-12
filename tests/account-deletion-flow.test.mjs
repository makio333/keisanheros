import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createAccountDeletionFlow} from '../sales-pages/account-deletion-flow.mjs';

const json=(status,value)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
function harness({responses=[],fetchImpl,reauthenticate}={}){
  let identity={uid:'fixture-user-a',label:'fixture-a@example.test'};const calls=[];let next=0;
  const flow=createAccountDeletionFlow({getIdentity:async()=>identity,reauthenticate:reauthenticate||(async user=>({uid:user.uid,idToken:'fixture-token-'+user.uid})),fetchImpl:fetchImpl||(async(path,options)=>{calls.push({path,options});return responses[next++]||json(500,{});})});
  return {flow,calls,setIdentity(value){identity=value;}};
}

test('not-ready API leaves the request unstarted and never calls confirm',async()=>{
  const h=harness({responses:[json(409,{ready:false,blockers:['inventory_incomplete:legacySaves']})]});
  const result=await h.flow.plan();
  assert.equal(result.state.phase,'not_ready');assert.equal(h.calls.length,1);assert.match(h.calls[0].path,/\/plan$/);
});

test('cancel clears the prepared token without submitting a deletion',async()=>{
  const h=harness({responses:[json(200,{ready:true}),json(202,{state:'retention_pending',purgeAfter:1900000000000})]});
  assert.equal((await h.flow.plan()).state.phase,'ready');
  assert.deepEqual(h.flow.cancel(),{ok:true,state:{phase:'cancelled'}});
  assert.equal(h.calls.length,1);assert.equal((await h.flow.confirm({typedConfirmation:'削除する',acceptedImpact:true})).ok,false);
  assert.equal(h.calls.length,1);
});

test('confirmation requires impact acknowledgement and exact phrase, then distinguishes accepted from completed',async()=>{
  const h=harness({responses:[json(200,{ready:true}),json(202,{state:'retention_pending',purgeAfter:1900000000000})]});
  await h.flow.plan();
  assert.equal((await h.flow.confirm({typedConfirmation:'delete',acceptedImpact:true})).state.phase,'confirmation_required');
  assert.equal((await h.flow.confirm({typedConfirmation:'削除する',acceptedImpact:false})).state.phase,'confirmation_required');
  assert.equal(h.calls.length,1);
  const result=await h.flow.confirm({typedConfirmation:'削除する',acceptedImpact:true});
  assert.equal(result.state.phase,'accepted');assert.equal(result.state.purgeAfter,1900000000000);
  assert.notEqual(result.state.phase,'completed');
  assert.deepEqual(JSON.parse(h.calls[1].options.body),{confirmation:'DELETE_MY_ACCOUNT'});
  assert.doesNotMatch(h.calls[1].options.body,/fixture-user-a|fixture-account/);
});

test('rapid duplicate clicks are suppressed while the first confirmation request is in flight',async()=>{
  let finishConfirm;const calls=[];let planCalls=0;
  const h=harness({fetchImpl:async(path,options)=>{
    calls.push({path,options});
    if(path.endsWith('/plan')){planCalls++;return json(200,{ready:true});}
    return await new Promise(resolve=>finishConfirm=()=>resolve(json(202,{state:'retention_pending',purgeAfter:1900000000000})));
  }});
  await h.flow.plan();
  const first=h.flow.confirm({typedConfirmation:'削除する',acceptedImpact:true});
  await Promise.resolve();
  const second=await h.flow.confirm({typedConfirmation:'削除する',acceptedImpact:true});
  assert.equal(second.state.phase,'busy');assert.equal(calls.filter(call=>call.path.endsWith('/confirm')).length,1);assert.equal(planCalls,1);
  finishConfirm();assert.equal((await first).state.phase,'accepted');
});

test('a different account selected after planning is refused locally before the API call',async()=>{
  const h=harness({responses:[json(200,{ready:true})]});await h.flow.plan();
  h.setIdentity({uid:'fixture-user-b',label:'fixture-b@example.test'});
  const result=await h.flow.confirm({typedConfirmation:'削除する',acceptedImpact:true});
  assert.equal(result.state.phase,'account_mismatch');assert.equal(h.calls.length,1);
});

test('API denial for an account that cannot be resolved to this login is not treated as ready',async()=>{
  const h=harness({responses:[json(409,{ready:false,blockers:['requester_not_verified_as_account_owner']})]});
  const result=await h.flow.plan();assert.equal(result.state.phase,'not_ready');assert.equal(h.calls.length,1);
});

test('network errors never claim acceptance or completion',async()=>{
  const planFailure=harness({fetchImpl:async()=>{throw Error('offline');}});
  assert.equal((await planFailure.flow.plan()).state.phase,'unavailable');
  const confirmationFailure=harness({fetchImpl:async path=>path.endsWith('/plan')?json(200,{ready:true}):Promise.reject(Error('offline'))});
  await confirmationFailure.flow.plan();
  const result=await confirmationFailure.flow.confirm({typedConfirmation:'削除する',acceptedImpact:true});
  assert.equal(result.state.phase,'outcome_unknown');assert.notEqual(result.state.phase,'completed');
});

test('recovery-required response is not described as a completed deletion',async()=>{
  const h=harness({responses:[json(200,{ready:true}),json(202,{state:'protection_retry_required'})]});
  await h.flow.plan();const result=await h.flow.confirm({typedConfirmation:'削除する',acceptedImpact:true});
  assert.equal(result.state.phase,'follow_up_needed');assert.notEqual(result.state.phase,'completed');
});
