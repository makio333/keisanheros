import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createSaveDeletionWorkflow} from '../save_deletion_workflow.js';

test('cancel leaves the selected save and account untouched',async()=>{
  const remote=[],local=[],results=[];
  const remove=createSaveDeletionWorkflow({confirm:async()=>false,deleteRemote:async key=>remote.push(key),deleteLocal:async key=>local.push(key),onResult:result=>results.push(result)});
  const result=await remove(['fixture-save']);
  assert.equal(result.cancelled,true);
  assert.deepEqual(remote,[]);assert.deepEqual(local,[]);assert.equal(results[0].cancelled,true);
});

test('repeat clicks are ignored while one confirmed deletion is pending',async()=>{
  let release,confirmCount=0;const remote=[],local=[],busy=[];
  const remove=createSaveDeletionWorkflow({confirm:async()=>{confirmCount++;return true;},deleteRemote:key=>{remote.push(key);return new Promise(resolve=>{release=resolve;});},deleteLocal:async key=>local.push(key),setBusy:value=>busy.push(value)});
  const first=remove(['fixture-save']);
  const second=await remove(['fixture-save']);
  assert.equal(second.ignored,true);
  assert.deepEqual(remote,['fixture-save']);assert.deepEqual(local,[]);assert.equal(confirmCount,1);
  release();const result=await first;
  assert.deepEqual(result.deleted,['fixture-save']);assert.deepEqual(local,['fixture-save']);
  assert.deepEqual(busy,[true,false]);
});

test('communication failure keeps the local item and returns a visible failure result',async()=>{
  let visible=['fixture-save'],message='';const local=[];
  const remove=createSaveDeletionWorkflow({confirm:async()=>true,deleteRemote:async()=>{throw Error('connection_failed');},deleteLocal:async key=>{local.push(key);visible=visible.filter(value=>value!==key);},onResult:result=>{
    if(result.failed.length)message='通信に失敗したため削除していません。';
  }});
  const result=await remove(['fixture-save']);
  assert.equal(result.failed.length,1);assert.deepEqual(local,[]);assert.deepEqual(visible,['fixture-save']);
  assert.equal(message,'通信に失敗したため削除していません。');
});

test('successful deletion updates the visible list but carries no account deletion action',async()=>{
  let visible=['fixture-remove','fixture-keep'];const remote=[],local=[];
  const remove=createSaveDeletionWorkflow({confirm:async()=>true,deleteRemote:async key=>remote.push(key),deleteLocal:async key=>{local.push(key);visible=visible.filter(value=>value!==key);}});
  const result=await remove(['fixture-remove']);
  assert.deepEqual(result.deleted,['fixture-remove']);
  assert.deepEqual(remote,['fixture-remove']);assert.deepEqual(local,['fixture-remove']);
  assert.deepEqual(visible,['fixture-keep']);
});
