import {createHash,randomUUID} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';

const clone=value=>value===undefined?undefined:structuredClone(value);
const segment=value=>encodeURIComponent(String(value));
const identityId=key=>createHash('sha256').update(key).digest('hex');

function decode(collection,data){
  if(!data)return data;
  if(collection==='saves' && typeof data.gameStateGzip==='string'){
    const gameState=JSON.parse(gunzipSync(Buffer.from(data.gameStateGzip,'base64')).toString('utf8'));
    const {gameStateGzip,...row}=data;return {...row,gameState};
  }
  return data;
}

function encode(collection,row){
  if(collection!=='saves')return clone(row);
  const {gameState,...metadata}=row;
  const compressed=gzipSync(Buffer.from(JSON.stringify(gameState)));
  if(compressed.length>650_000)throw Error('save_too_large');
  return {...clone(metadata),gameStateGzip:compressed.toString('base64')};
}

export function createFirestoreAccountStore(db){
  if(typeof db?.runTransaction!=='function' || typeof db?.doc!=='function' || typeof db?.collection!=='function')throw Error('firestore_not_configured');
  function documentPath(collection,id){return `${collection}/${segment(id)}`;}
  function gamePath(key){
    if(typeof key!=='string' || key.length>512)throw Error('invalid_game_document');
    const parts=key.split('/');
    if(parts.length!==2 || parts.some(part=>!part || part==='.' || part==='..'))throw Error('invalid_game_document');
    return `${parts[0]}/${parts[1]}`;
  }
  async function transaction(callback){
    if(typeof callback!=='function')throw Error('invalid_transaction');
    return db.runTransaction(async native=>{
      const cache=new Map(),writes=new Map();
      async function get(collection,id){
        if(typeof id!=='string' || !id || id.length>1500)return undefined;
        const path=documentPath(collection,id);
        if(writes.has(path))return writes.get(path).deleted?undefined:clone(writes.get(path).row);
        if(cache.has(path))return clone(cache.get(path));
        const snap=await native.get(db.doc(path));
        const row=snap.exists?decode(collection,snap.data()):undefined;
        cache.set(path,row);return clone(row);
      }
      function put(collection,id,row){
        const path=collection==='gameDocuments'?gamePath(id):documentPath(collection,id);
        writes.set(path,{collection:collection==='gameDocuments'?path.split('/')[0]:collection,row:clone(row),deleted:false});
      }
      async function entries(collection,field,value){
        let ref=db.collection(collection);
        if(field)ref=ref.where(field,'==',value);
        const snap=await native.get(ref),rows=new Map();
        for(const item of snap.docs){
          const path=item.ref.path,row=decode(collection,item.data());
          cache.set(path,row);rows.set(path,clone(row));
        }
        for(const [path,write] of writes){
          if(path.split('/')[0]!==collection)continue;
          if(write.deleted || field && write.row?.[field]!==value)rows.delete(path);else rows.set(path,clone(write.row));
        }
        return [...rows].map(([path,row])=>[path.slice(collection.length+1),clone(row)]);
      }
      const list=(collection,field,value)=>entries(collection,field,value).then(rows=>rows.map(([,row])=>row));
      const tx={
        getAccount:id=>get('accounts',id),putAccount:row=>put('accounts',row.id,row),
        getSave:key=>get('saves',key),putSave:row=>put('saves',row.key,row),
        listSaves:id=>list('saves','ownerAccountId',id),listAllSaves:()=>list('saves'),
        getGameDocument:async key=>{const path=gamePath(key),collection=path.split('/')[0],id=path.slice(collection.length+1);return getPath(path,collection,id);},
        putGameDocument:(key,row)=>put('gameDocuments',key,row),
        listGameDocuments:collection=>entries(collection),
        getPurchase:id=>get('purchases',id),putPurchase:row=>put('purchases',row.purchaseId,row),
        listPurchases:id=>list('purchases','accountId',id),
        getPurchaseEvent:id=>get('events',id),putPurchaseEvent:row=>put('events',row.eventId,row),
        getLegacyClaim:key=>get('claims',key),putLegacyClaim:row=>put('claims',row.legacyKey,row),
        getSession:id=>get('sessions',id),putSession:(id,row)=>put('sessions',id,{...row,ttlAt:new Date(row.expiresAt)}),removeSession:id=>remove('sessions',id),
        getAttempt:key=>get('attempts',key),putAttempt:(key,row)=>put('attempts',key,{...row,ttlAt:new Date(row.expiresAt)}),removeAttempt:key=>remove('attempts',key),
        getIdentity:key=>get('identities',identityId(key)),putIdentity:(key,id)=>put('identities',identityId(key),{accountId:id}),
      };
      function remove(collection,id){if(typeof id==='string' && id && id.length<=1500)writes.set(documentPath(collection,id),{collection,row:null,deleted:true});}
      async function getPath(path,collection,id){
        if(writes.has(path))return writes.get(path).deleted?undefined:clone(writes.get(path).row);
        if(cache.has(path))return clone(cache.get(path));
        const snap=await native.get(db.doc(path)),row=snap.exists?decode(collection,snap.data()):undefined;
        cache.set(path,row);return clone(row);
      }
      const result=await callback(tx);
      if(writes.size>450)throw Error('transaction_too_large');
      for(const [path,write] of writes){
        const ref=db.doc(path);
        if(write.deleted)native.delete(ref);else native.set(ref,encode(write.collection,write.row));
      }
      return clone(result);
    });
  }
  const sessions={
    get:(id,now)=>transaction(async tx=>{const row=await tx.getSession(id);return row?.expiresAt>now?row:null;}),
    create:(id,row)=>transaction(async tx=>{if(await tx.getSession(id))throw Error('session_exists');tx.putSession(id,row);}),
    rotate:(old,id,row)=>transaction(async tx=>{if(!await tx.getSession(old) || await tx.getSession(id))throw Error('session_rotation_conflict');tx.removeSession(old);tx.putSession(id,row);}),
    remove:id=>transaction(tx=>tx.removeSession(id)),
  };
  const auth={
    putAttempt:(key,row)=>transaction(tx=>tx.putAttempt(key,row)),
    consumeAttempt:(key,browserHash,now)=>transaction(async tx=>{
      const attempt=await tx.getAttempt(key);if(!attempt || attempt.browserHash!==browserHash || attempt.expiresAt<=now)return null;
      tx.removeAttempt(key);return attempt;
    }),
    getAuthenticatedAccount:async id=>(await sessions.get(id,Date.now()))?.accountId||null,
    resolveIdentity:({provider,providerId,subject,linkAccountId})=>transaction(async tx=>{
      const key=JSON.stringify([provider,providerId,subject]),existing=(await tx.getIdentity(key))?.accountId;
      if(existing){if(linkAccountId && linkAccountId!==existing)throw Error('identity_already_linked');return {accountId:existing,created:false};}
      if(linkAccountId && !await tx.getAccount(linkAccountId))throw Error('account_not_found');
      const id=linkAccountId||randomUUID();
      if(!linkAccountId)tx.putAccount({id,createdAt:Date.now()});
      tx.putIdentity(key,id);return {accountId:id,created:!linkAccountId};
    }),
  };
  return {transaction,sessions,auth};
}
