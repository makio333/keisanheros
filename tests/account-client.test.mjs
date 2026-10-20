import assert from 'node:assert/strict';
import {createAccountTransport} from '../account_client.js';
const rows=new Map(),requests=[],failures=[];let forceConflict=false,failSummary=false;
const clone=value=>structuredClone(value);
const fetchImpl=async(url,options)=>{
  requests.push({url,options});let status=200,value;
  const body=options.body?JSON.parse(options.body):{};
  if(url==='/api/account'){if(failSummary){failSummary=false;throw Error('offline');}value={accountId:'fixture-owner',saveLimit:3,used:rows.size,canCreate:rows.size<3};}
  else if(url==='/api/saves' && options.method==='GET')value=[...rows.values()].map(({key,name,revision,updatedAt})=>({key,name,revision,updatedAt}));
  else if(url==='/api/saves'){
    if(rows.size>=3){status=409;value={error:'save_limit_reached'};}
    else{const row={key:`typing_rpg_save_v3::fixture-${rows.size+1}`,name:body.name,revision:1,gameState:body.gameState,updatedAt:1};rows.set(row.key,row);value=clone(row);}
  }else{
    const key=decodeURIComponent(url.split('/').at(-1)),row=rows.get(key);
    if(!row){status=404;value={error:'save_not_found'};}
    else if(options.method==='GET')value=clone(row);
    else if(forceConflict || row.revision!==body.revision){status=409;value={error:'save_revision_conflict'};}
    else{row.gameState=body.gameState;row.revision++;value=clone(row);}
  }
  return {ok:status<400,status,json:async()=>clone(value)};
};
const client=await createAccountTransport({fetchImpl,onFailure:(error,save)=>failures.push({error:error.message,save})});
assert.equal(client.owns('typing_rpg_save_v3::unclaimed'),false);
const count=requests.length;await assert.rejects(client.saveSlot('typing_rpg_save_v3::unclaimed',{player:{gold:1}}),/save_not_found/);assert.equal(requests.length,count,'unowned local snapshots are not uploaded');
failSummary=true;const created=await client.createSave('fixture-child',{player:{gold:0}});assert.equal(client.owns(created.key),true,'successful creation is not repeated if summary refresh fails');
await Promise.all([1,2,3].map(gold=>client.saveSlot(created.key,{player:{gold}})));
assert.equal(rows.get(created.key).revision,4);assert.equal(rows.get(created.key).gameState.player.gold,3);
await client.flush();assert.equal(client.pending,0);
forceConflict=true;await assert.rejects(client.saveSlot(created.key,{player:{gold:999}}),/save_revision_conflict/);
assert.equal(failures.at(-1).save.gameState.player.gold,999);assert.equal(rows.get(created.key).gameState.player.gold,3);
assert.equal(client.hasConflict(created.key),true);await assert.rejects(client.fetchAllSlots(),/save_revision_conflict/);
await assert.rejects(client.saveSlot(created.key,{player:{gold:1000}}),/save_revision_conflict/);
assert.equal(requests.every(({options})=>options.credentials==='same-origin' && options.cache==='no-store'),true);
assert.equal(requests.some(({options})=>options.body?.includes('fixture-owner')),false,'the client never chooses account ownership');
console.log('PASS: owner-only transport, serialized revisions, successful-create/failed-refresh handling, conflict retention and no legacy auto-upload.');
