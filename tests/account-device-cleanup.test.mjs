import assert from 'node:assert/strict';
import {test} from 'node:test';
import {deleteSelectedLocalAccountCopies,listLocalAccountCopies} from '../sales-pages/account-device-cleanup.mjs';

function fakeStorage(seed={}){
  const data=new Map(Object.entries(seed));
  return {get length(){return data.size;},key(index){return [...data.keys()][index]??null;},getItem(key){return data.get(key)??null;},setItem(key,value){data.set(key,String(value));},removeItem(key){data.delete(key);},data};
}

test('local cleanup lists only known account-copy keys without exposing saved values',()=>{
  const storage=fakeStorage({'typing_rpg_save_v3::slot-a':'PRIVATE SAVE','legend-account-conflict::account-a::slot-a':'PRIVATE CONFLICT','unrelated-preference':'secret'});
  const rows=listLocalAccountCopies(storage);
  assert.deepEqual(rows.map(row=>row.kind),['save','conflict']);
  assert.ok(rows.every(row=>!('value' in row)&&!('data' in row)));
  assert.equal(rows.some(row=>row.key==='unrelated-preference'),false);
});

test('only explicitly selected local keys are removed and per-slot timers are pruned',()=>{
  const a='typing_rpg_save_v3::slot-a',b='typing_rpg_save_v3::slot-b';
  const storage=fakeStorage({[a]:'fixture-save-a',[b]:'fixture-save-b','legend-account-conflict::account-a::slot-a':'fixture-copy','typing_rpg_timelimit_v2':JSON.stringify({[a]:{enabled:true},[b]:{enabled:true}}),'typing_rpg_timelimit_session_v1':JSON.stringify({[a]:123,[b]:456}),'unrelated-preference':'keep'});
  const result=deleteSelectedLocalAccountCopies(storage,[a,'not-allowlisted']);
  assert.equal(result.removed,1);assert.equal(storage.getItem(a),null);assert.equal(storage.getItem(b),'fixture-save-b');
  assert.deepEqual(JSON.parse(storage.getItem('typing_rpg_timelimit_v2')),{[b]:{enabled:true}});
  assert.deepEqual(JSON.parse(storage.getItem('typing_rpg_timelimit_session_v1')),{[b]:456});
  assert.equal(storage.getItem('legend-account-conflict::account-a::slot-a'),'fixture-copy');assert.equal(storage.getItem('unrelated-preference'),'keep');
});

test('legacy root saves are individually selectable and no origin-wide clear exists',()=>{
  const storage=fakeStorage({'typing_rpg_save_v3':'legacy-v3','typing_rpg_save_v2':'legacy-v2','typing_rpg_custom_items':'shared-custom'});
  assert.equal(listLocalAccountCopies(storage).length,2);
  deleteSelectedLocalAccountCopies(storage,['typing_rpg_save_v3']);
  assert.equal(storage.getItem('typing_rpg_save_v3'),null);assert.equal(storage.getItem('typing_rpg_save_v2'),'legacy-v2');assert.equal(storage.getItem('typing_rpg_custom_items'),'shared-custom');
});
