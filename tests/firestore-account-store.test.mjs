import assert from 'node:assert/strict';
import {createFirestoreAccountStore} from '../server/firestore-account-store.mjs';

const rows=new Map();
const db={
  doc:path=>({path}),
  collection:name=>({collection:name,where(field,operator,value){return {...this,filter:{field,operator,value}};}}),
  async runTransaction(callback){
    const staged=new Map();
    const native={
      async get(ref){
        if(ref.collection){
          const docs=[...rows].filter(([path,data])=>path.startsWith(ref.collection+'/') && (!ref.filter||data[ref.filter.field]===ref.filter.value))
            .map(([path,data])=>({ref:{path},data:()=>structuredClone(data)}));
          return {docs};
        }
        const data=staged.has(ref.path)?staged.get(ref.path):rows.get(ref.path);
        return {exists:data!==undefined,data:()=>structuredClone(data)};
      },
      set(ref,value){staged.set(ref.path,structuredClone(value));},
      delete(ref){staged.set(ref.path,undefined);},
    };
    const result=await callback(native);
    for(const [path,value] of staged)value===undefined?rows.delete(path):rows.set(path,value);
    return result;
  },
};

const store=createFirestoreAccountStore(db);
assert.equal(await store.sessions.get('',Date.now()),null);
const identity=await store.auth.resolveIdentity({provider:'line',providerId:'provider-a',subject:'line-subject-a'});
assert.equal(identity.created,true);
assert.equal((await store.auth.resolveIdentity({provider:'line',providerId:'provider-a',subject:'line-subject-a'})).accountId,identity.accountId);
await store.sessions.create('session-token-012345678901234567890123456789',{accountId:identity.accountId,expiresAt:9999999999999});
assert.ok(rows.get('sessions/session-token-012345678901234567890123456789').ttlAt instanceof Date);
await store.transaction(async tx=>{
  tx.putSave({key:'save/one',ownerAccountId:identity.accountId,name:'勇者',revision:1,gameState:{text:'レイド',nested:{level:3}}});
  tx.putGameDocument('raidGlobal/currentBoss',{hp:123});
});
assert.deepEqual((await store.transaction(tx=>tx.getSave('save/one'))).gameState,{text:'レイド',nested:{level:3}});
assert.equal((await store.transaction(tx=>tx.listSaves(identity.accountId))).length,1);
assert.deepEqual(await store.transaction(tx=>tx.getGameDocument('raidGlobal/currentBoss')),{hp:123});
await store.sessions.rotate('session-token-012345678901234567890123456789','session-token-112345678901234567890123456789',{accountId:identity.accountId,expiresAt:9999999999999});
assert.equal(await store.sessions.get('session-token-012345678901234567890123456789',0),null);
assert.equal((await store.sessions.get('session-token-112345678901234567890123456789',0)).accountId,identity.accountId);
assert.ok(rows.get('saves/save%2Fone').gameStateGzip);
console.log('PASS: Firestore adapter identity/session safety, compressed saves, owner query, game documents and atomic session rotation. In-memory fake only; no cloud writes.');
