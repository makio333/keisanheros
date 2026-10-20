import {randomUUID} from 'node:crypto';

// Minimal storage contract used by the existing shared raid/gift rules, inside one account transaction.
export function createGameDocumentAdapter(tx,{accountId,now=Date.now}){
  const changed=new Set(),copy=value=>structuredClone(value);
  const fail=()=>{throw Error('save_not_found');};
  const pathOf=ref=>typeof ref==='string'?ref:ref.path;
  const reference=path=>({path,id:path.split('/').at(-1)});
  const saveKey=ref=>decodeURIComponent(ref.slice('saves/'.length));
  function read(ref){
    ref=pathOf(ref);
    if(!ref.startsWith('saves/'))return tx.getGameDocument(ref);
    const row=tx.getSave(saveKey(ref));if(!row || row.ownerAccountId!==accountId)fail();
    return {slotKey:row.key,playerName:row.gameState.playerName,lvl:row.gameState.player?.lvl,gold:row.gameState.player?.gold,gameData:JSON.stringify(row.gameState),updatedAt:row.gameState.updatedAt||row.updatedAt,deleted:false};
  }
  function write(ref,value,options){
    ref=pathOf(ref);
    const next=options?.merge?{...read(ref),...copy(value)}:copy(value);
    if(!ref.startsWith('saves/')){tx.putGameDocument(ref,next);return;}
    const key=saveKey(ref),row=tx.getSave(key);if(!row || row.ownerAccountId!==accountId)fail();
    const gameState=JSON.parse(next.gameData);gameState.updatedAt=now();
    tx.putSave({...row,gameState,revision:row.revision+1,updatedAt:now()});changed.add(key);
  }
  const snapshot=(id,value)=>({id,exists:()=>value!==undefined,data:()=>copy(value),metadata:{fromCache:false}});
  const adapter={
    db:{},changed,
    collection:(_db,name)=>({collection:name}),
    doc:(db,name,id)=>reference(db?.collection?`${db.collection}/${randomUUID()}`:`${name}/${id}`),
    query:(reference,...conditions)=>({...reference,conditions}),
    where:(field,operator,value)=>({kind:'where',field,operator,value}),
    orderBy:(field,direction='asc')=>({kind:'order',field,direction}),
    limit:count=>({kind:'limit',count}),
    getDoc:async ref=>snapshot(pathOf(ref).split('/').at(-1),read(ref)),
    getDocs:async reference=>{
      if(reference.collection==='saves')throw Error('unscoped_save_query');
      let rows=tx.listGameDocuments(reference.collection).map(([key,value])=>({key,value}));
      for(const condition of reference.conditions||[]){
        if(condition.kind==='where'){
          if(condition.operator!=='==')throw Error('unsupported_query');
          rows=rows.filter(row=>row.value[condition.field]===condition.value);
        }
        if(condition.kind==='order')rows.sort((a,b)=>(a.value[condition.field]>b.value[condition.field]?1:a.value[condition.field]<b.value[condition.field]?-1:0)*(condition.direction==='desc'?-1:1));
        if(condition.kind==='limit')rows=rows.slice(0,condition.count);
      }
      const docs=rows.map(({key,value})=>snapshot(key.slice(reference.collection.length+1),value));
      return {docs,forEach:callback=>docs.forEach(callback)};
    },
    setDoc:async(ref,value,options)=>write(ref,value,options),
    runTransaction:async(_db,callback)=>{
      const writes=[];
      const result=await callback({get:adapter.getDoc,set:(...args)=>writes.push(args),update:(ref,value)=>writes.push([ref,value,{merge:true}])});
      for(const args of writes)write(...args);
      return result;
    },
  };
  return adapter;
}
