import {mkdir,open,readFile,rename,unlink} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';

const originalTables=['accounts','identities','attempts','sessions','saves','purchases','events','claims'];
const tables=[...originalTables,'gameDocuments'];
// Local-only durable adapter. One process owns the directory; production needs a transactional database.
export async function openLocalAccountStore(directory){
  await mkdir(directory,{recursive:true,mode:0o700});
  const lockPath=path.join(directory,'account-store.lock'),file=path.join(directory,'accounts.json');
  let lock;
  try{lock=await open(lockPath,'wx',0o600);}catch(error){if(error.code==='EEXIST')throw Error('local_store_already_open');throw error;}
  let state,closed=false,queue=Promise.resolve();
  try{
    let stored;
    try{stored=JSON.parse(await readFile(file,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
    if(stored && (stored.version!==1 || originalTables.some(name=>!Array.isArray(stored[name])) || stored.gameDocuments!==undefined && !Array.isArray(stored.gameDocuments)))throw Error('invalid_local_store');
    state=Object.fromEntries(tables.map(name=>[name,new Map(stored?.[name]||[])]));
  }catch(error){await lock.close();await unlink(lockPath);throw error;}
  function transaction(callback){
    if(closed)return Promise.reject(Error('local_store_closed'));
    const result=queue.then(async()=>{
      const draft=structuredClone(state);
      const tx={
        getAccount:id=>draft.accounts.get(id),putAccount:row=>draft.accounts.set(row.id,structuredClone(row)),
        getSave:key=>draft.saves.get(key),putSave:row=>draft.saves.set(row.key,structuredClone(row)),
        listSaves:id=>[...draft.saves.values()].filter(row=>row.ownerAccountId===id),
        listAllSaves:()=>[...draft.saves.values()],
        getGameDocument:key=>draft.gameDocuments.get(key),putGameDocument:(key,row)=>draft.gameDocuments.set(key,structuredClone(row)),
        listGameDocuments:collection=>[...draft.gameDocuments.entries()].filter(([key])=>key.startsWith(collection+'/')),
        getPurchase:id=>draft.purchases.get(id),putPurchase:row=>draft.purchases.set(row.purchaseId,structuredClone(row)),
        listPurchases:id=>[...draft.purchases.values()].filter(row=>row.accountId===id),
        getPurchaseEvent:id=>draft.events.get(id),putPurchaseEvent:row=>draft.events.set(row.eventId,structuredClone(row)),
        getLegacyClaim:key=>draft.claims.get(key),putLegacyClaim:row=>draft.claims.set(row.legacyKey,structuredClone(row)),
        getSession:id=>draft.sessions.get(id),putSession:(id,row)=>draft.sessions.set(id,structuredClone(row)),removeSession:id=>draft.sessions.delete(id),
        getAttempt:key=>draft.attempts.get(key),putAttempt:(key,row)=>draft.attempts.set(key,structuredClone(row)),removeAttempt:key=>draft.attempts.delete(key),
        getIdentity:key=>draft.identities.get(key),putIdentity:(key,id)=>draft.identities.set(key,id),
      };
      const value=await callback(tx);
      const encoded=JSON.stringify({version:1,...Object.fromEntries(tables.map(name=>[name,[...draft[name]]]))});
      const tmp=path.join(directory,`.accounts-${randomUUID()}.tmp`);
      try{
        const handle=await open(tmp,'wx',0o600);
        try{await handle.writeFile(encoded);await handle.sync();}finally{await handle.close();}
        await rename(tmp,file);
      }finally{await unlink(tmp).catch(error=>{if(error.code!=='ENOENT')throw error;});}
      state=draft;return structuredClone(value);
    });
    queue=result.catch(()=>{});return result;
  }
  const sessions={
    get:(id,now)=>transaction(tx=>{const row=tx.getSession(id);return row?.expiresAt>now?row:null;}),
    create:(id,row)=>transaction(tx=>{if(tx.getSession(id))throw Error('session_exists');tx.putSession(id,row);}),
    rotate:(old,id,row)=>transaction(tx=>{if(!tx.getSession(old) || tx.getSession(id))throw Error('session_rotation_conflict');tx.removeSession(old);tx.putSession(id,row);}),
    remove:id=>transaction(tx=>tx.removeSession(id)),
  };
  const auth={
    putAttempt:(key,row)=>transaction(tx=>tx.putAttempt(key,row)),
    consumeAttempt:(key,browserHash,now)=>transaction(tx=>{
      const attempt=tx.getAttempt(key);if(!attempt || attempt.browserHash!==browserHash || attempt.expiresAt<=now)return null;
      tx.removeAttempt(key);return attempt;
    }),
    getAuthenticatedAccount:async id=>(await sessions.get(id,Date.now()))?.accountId||null,
    resolveIdentity:({provider,providerId,subject,linkAccountId})=>transaction(tx=>{
      const key=JSON.stringify([provider,providerId,subject]),existing=tx.getIdentity(key);
      if(existing){if(linkAccountId && linkAccountId!==existing)throw Error('identity_already_linked');return {accountId:existing,created:false};}
      if(linkAccountId && !tx.getAccount(linkAccountId))throw Error('account_not_found');
      const id=linkAccountId||randomUUID();
      if(!linkAccountId)tx.putAccount({id,createdAt:Date.now()});
      tx.putIdentity(key,id);return {accountId:id,created:!linkAccountId};
    }),
  };
  return {transaction,sessions,auth,async close(){if(closed)return;closed=true;await queue;await lock.close();await unlink(lockPath);}};
}
