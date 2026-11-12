const clone=value=>structuredClone(value);
const createTables=()=>Object.fromEntries(['accounts','sessions','saves','purchases','events','claims','gameDocuments'].map(name=>[name,new Map()]));

/** Ephemeral transaction store for local migration previews and synthetic QA only. */
export function createSingleSaveMigrationLocalStore(){
  let state=createTables(),queue=Promise.resolve(),writeCount=0;
  function transaction(callback){
    const result=queue.then(async()=>{
      const draft=Object.fromEntries(Object.entries(state).map(([name,table])=>[name,new Map([...table].map(([key,value])=>[key,clone(value)]))]));
      const tx={
        getAccount:id=>clone(draft.accounts.get(id)),putAccount:row=>{writeCount++;draft.accounts.set(row.id,clone(row));},
        getSession:id=>clone(draft.sessions.get(id)),putSession:(id,row)=>{writeCount++;draft.sessions.set(id,clone(row));},
        getSave:key=>clone(draft.saves.get(key)),putSave:row=>{writeCount++;draft.saves.set(row.key,clone(row));},
        listSaves:id=>[...draft.saves.values()].filter(row=>row.ownerAccountId===id).map(clone),
        getPurchase:id=>clone(draft.purchases.get(id)),putPurchase:row=>{writeCount++;draft.purchases.set(row.purchaseId,clone(row));},
        listPurchases:id=>[...draft.purchases.values()].filter(row=>row.accountId===id).map(clone),
        getPurchaseEvent:id=>clone(draft.events.get(id)),putPurchaseEvent:row=>{writeCount++;draft.events.set(row.eventId,clone(row));},
        getLegacyClaim:key=>clone(draft.claims.get(key)),putLegacyClaim:row=>{writeCount++;draft.claims.set(row.legacyKey,clone(row));},
        getGameDocument:key=>clone(draft.gameDocuments.get(key)),putGameDocument:(key,row)=>{writeCount++;draft.gameDocuments.set(key,clone(row));},
      };
      const value=await callback(tx);
      state=draft;
      return clone(value);
    });
    queue=result.catch(()=>{});
    return result;
  }
  const sessions={get:(id,now)=>transaction(tx=>{const row=tx.getSession(id);return row?.expiresAt>now?row:null;})};
  return {transaction,sessions,get writeCount(){return writeCount;},async close(){await queue;},
    async inspect(callback){return transaction(async tx=>callback(tx));}};
}
