import assert from 'node:assert/strict';
import {test} from 'node:test';
import {Readable} from 'node:stream';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createAccountTransport} from '../account_client.js';
import {createAccountSaveService} from '../server/account-saves.mjs';
import {createAccountSaveHandler} from '../server/account-saves-http.mjs';
import {openLocalAccountStore} from '../server/local-account-store.mjs';

async function setup(){
  const directory=await mkdtemp(path.join(tmpdir(),'legend-save-delete-'));
  const store=await openLocalAccountStore(directory),now=Date.parse('2026-10-27T03:00:00Z'),origin='https://fixture.invalid';
  const owners=new Map();
  async function addOwner(subject){
    const {accountId}=await store.auth.resolveIdentity({provider:'firebase',providerId:'fixture',subject});
    const session='fixture-session-'+subject;
    await store.sessions.create(session,{accountId,expiresAt:now+3600000});
    await store.transaction(tx=>tx.putPurchase({purchaseId:'purchase-'+subject,accountId,productId:'personal',active:true,verifiedAt:now}));
    owners.set(subject,{accountId,session});return owners.get(subject);
  }
  const service=createAccountSaveService({store,sessions:store.sessions,now:()=>now});
  const handler=createAccountSaveHandler({service,origin});
  async function invoke(url,{subject,method='GET',body,requestOrigin=origin}={}){
    const parsed=new URL(url,origin),chunks=body===undefined?[]:[Buffer.from(JSON.stringify(body))];
    const req=Readable.from(chunks);req.url=parsed.pathname+parsed.search;req.method=method;
    const owner=owners.get(subject);
    req.headers={origin:requestOrigin,...(body===undefined?{}:{'content-type':'application/json'}),...(owner?{cookie:`__Host-legend-session=${owner.session}`}:{})};
    return new Promise((resolve,reject)=>{
      const res={statusCode:200,headers:{},writeHead(status,headers={}){this.statusCode=status;this.headers=headers;},end(payload=''){resolve({status:this.statusCode,headers:this.headers,json:()=>JSON.parse(payload)});}};
      handler(req,res).then(handled=>{if(!handled)resolve({status:404,json:()=>({error:'not_found'})});},reject);
    });
  }
  async function fetchFor(subject){
    return async(url,options={})=>{
      const result=await invoke(url,{subject,method:options.method||'GET',body:options.body===undefined?undefined:JSON.parse(options.body)});
      return {ok:result.status>=200&&result.status<300,status:result.status,json:async()=>result.json()};
    };
  }
  return {directory,store,service,invoke,fetchFor,addOwner,async close(){await store.close();await rm(directory,{recursive:true,force:true});}};
}

test('owner deletion removes only the selected save and preserves paid capacity',async t=>{
  const fixture=await setup();t.after(()=>fixture.close());
  const owner=await fixture.addOwner('alice'),other=await fixture.addOwner('bob');
  const state=name=>({playerName:name,player:{lvl:8,gold:321},equipment:{},items:[]});
  const save=await fixture.service.createSave(owner.session,{name:'fixture-one',gameState:state('fixture-one')});
  const keep=await fixture.service.createSave(owner.session,{name:'fixture-keep',gameState:state('fixture-keep')});
  const transport=await createAccountTransport({fetchImpl:await fixture.fetchFor('alice')});
  assert.equal(transport.summary.used,2);
  const before=await fixture.service.summary(owner.session);

  const result=await transport.deleteSlot(save.key);
  assert.equal(result.deleted,true);
  assert.equal(result.used,1);
  assert.equal(result.saveLimit,before.saveLimit);
  assert.equal(result.paidSaveLimit,before.paidSaveLimit);
  assert.equal(transport.summary.saveLimit,before.saveLimit);
  assert.equal(transport.summary.paidSaveLimit,before.paidSaveLimit);
  assert.equal(transport.owns(save.key),false);
  assert.deepEqual((await transport.fetchAllSlots()).map(row=>row.slotKey),[keep.key]);
  await assert.rejects(fixture.service.readSave(owner.session,save.key),/save_not_found/);
  const purchases=await fixture.store.transaction(tx=>tx.listPurchases(owner.accountId));
  assert.equal(purchases.length,1);
  assert.equal(purchases[0].active,true);
  assert.equal((await fixture.service.summary(owner.session)).saveLimit,before.saveLimit);

  const forbidden=await fixture.invoke('/api/saves/'+encodeURIComponent(keep.key),{subject:'bob',method:'DELETE'});
  assert.equal(forbidden.status,404,'other account cannot confirm or delete this save');
  assert.equal((await fixture.service.listSaves(owner.session)).length,1);
  const duplicate=await fixture.invoke('/api/saves/'+encodeURIComponent(save.key),{subject:'alice',method:'DELETE'});
  assert.equal(duplicate.status,404,'repeat server request does not delete another record');
  const unauthenticated=await fixture.invoke('/api/saves/'+encodeURIComponent(keep.key),{method:'DELETE'});
  assert.equal(unauthenticated.status,401);
  const badOrigin=await fixture.invoke('/api/saves/'+encodeURIComponent(keep.key),{subject:'alice',method:'DELETE',requestOrigin:'https://attacker.invalid'});
  assert.equal(badOrigin.status,403);
});

test('client keeps the save visible when the delete request fails',async t=>{
  const fixture=await setup();t.after(()=>fixture.close());
  const owner=await fixture.addOwner('network-failure');
  const save=await fixture.service.createSave(owner.session,{name:'fixture-network',gameState:{playerName:'fixture-network',player:{lvl:1}}});
  const fetchImpl=async(url,options={})=>{
    if((options.method||'GET')==='DELETE')throw Error('synthetic connection failure');
    const result=await fixture.invoke(url,{subject:'network-failure',method:options.method||'GET',body:options.body===undefined?undefined:JSON.parse(options.body)});
    return {ok:result.status<300,status:result.status,json:async()=>result.json()};
  };
  const transport=await createAccountTransport({fetchImpl});
  await assert.rejects(transport.deleteSlot(save.key),/connection_failed/);
  assert.equal(transport.owns(save.key),true);
  assert.equal(transport.summary.used,1);
  assert.equal((await transport.fetchAllSlots()).length,1);
  assert.equal((await fixture.service.listSaves(owner.session)).length,1);
});

test('adult-manager acknowledgement is explicit, owner-scoped and required only after a valid confirmation',async t=>{
  const fixture=await setup();t.after(()=>fixture.close());
  const owner=await fixture.addOwner('adult-manager'),other=await fixture.addOwner('another-adult');
  assert.equal((await fixture.service.summary(owner.session)).adultManagerAcknowledged,false);
  const invalid=await fixture.invoke('/api/account/adult-manager-acknowledgement',{subject:'adult-manager',method:'POST',body:{acknowledged:false}});
  assert.equal(invalid.status,400);
  const accepted=await fixture.invoke('/api/account/adult-manager-acknowledgement',{subject:'adult-manager',method:'POST',body:{acknowledged:true}});
  assert.equal(accepted.status,200);assert.equal(accepted.json().acknowledged,true);
  assert.equal((await fixture.service.summary(owner.session)).adultManagerAcknowledged,true);
  assert.equal((await fixture.service.summary(other.session)).adultManagerAcknowledged,false);
  const badOrigin=await fixture.invoke('/api/account/adult-manager-acknowledgement',{subject:'another-adult',method:'POST',body:{acknowledged:true},requestOrigin:'https://attacker.invalid'});
  assert.equal(badOrigin.status,403);assert.equal((await fixture.service.summary(other.session)).adultManagerAcknowledged,false);
});
