const fail=code=>{throw Error(code);};
const snapshot=value=>{
  if(!value||typeof value!=='object'||Array.isArray(value)||!value.player)fail('invalid_save');
  const text=JSON.stringify(value);
  if(new TextEncoder().encode(text).length>850000)fail('save_too_large');
  return text;
};

export async function createFirebaseGameTransport({uid,isCurrentUser,readSaves,reference,transaction,onFailure=()=>{},now=Date.now}){
  const rows=new Map(),blocked=new Set(),failures=new Map();let queue=Promise.resolve(),pending=0,importedCount=0,saveLimit=3;
  const prefix='typing_rpg_save_v3::firebase::'+encodeURIComponent(uid)+'::';
  const check=()=>{if(!uid||!isCurrentUser(uid))fail('authentication_required');};
  const serialize=callback=>{pending++;const result=queue.then(()=>{check();return callback();});queue=result.catch(()=>{}).finally(()=>pending--);return result;};
  function refreshSummary(){saveLimit=Math.max(saveLimit,3,importedCount,rows.size);transport.summary={accountId:uid,used:rows.size,saveLimit,canCreate:rows.size<saveLimit};}
  const slots=()=>[...rows].map(([key,row])=>({slotKey:key,gameState:JSON.parse(row.gameData),updatedAt:row.updatedAt,revision:row.revision}));
  const transport={accountId:uid,summary:{},initialSlots:[],owns:key=>rows.has(key),get pending(){return pending;},
    async seedMigration(records){
      check();importedCount=records.length;
      if(records.length>200)fail('migration_file_too_large');
      await serialize(()=>transaction(async tx=>{
        const refs=records.map(row=>{if(!/^[a-f0-9]{64}$/.test(row.id))fail('invalid_migration_file');snapshot(JSON.parse(row.gameData));return reference(uid,row.id);});
        const prior=await Promise.all(refs.map(ref=>tx.get(ref)));
        check();for(let i=0;i<records.length;i++)if(!prior[i].exists())tx.set(refs[i],{ownerUid:uid,gameData:records[i].gameData,revision:1,createdAt:now(),updatedAt:now(),sourceMigrationId:records[i].id});
      }));
      return transport.fetchAllSlots();
    },
    async fetchAllSlots(){
      await queue;check();if(blocked.size||failures.size)fail('save_revision_conflict');
      const loaded=await readSaves(uid);check();rows.clear();
      for(const row of loaded){if(row.ownerUid!==uid)fail('save_not_found');rows.set(prefix+row.id,row);}
      refreshSummary();transport.initialSlots=slots();return slots();
    },
    async listSaves(){await queue;check();return [...rows].map(([key,row])=>({key,name:JSON.parse(row.gameData).playerName||'プレイヤー',updatedAt:row.updatedAt,revision:row.revision}));},
    createSave(name,gameState){return serialize(async()=>{
      if(rows.size>=saveLimit)fail('save_limit_reached');
      const id=crypto.randomUUID(),key=prefix+id,gameData=snapshot(gameState),row={ownerUid:uid,gameData,revision:1,createdAt:now(),updatedAt:now(),sourceMigrationId:null};
      await transaction(async tx=>{const prior=await tx.get(reference(uid,id));if(prior.exists())fail('save_revision_conflict');check();tx.set(reference(uid,id),row);});
      rows.set(key,{id,...row});refreshSummary();return {key,gameState:JSON.parse(gameData),revision:1};
    });},
    saveSlot(key,gameState){const gameData=snapshot(gameState);return serialize(async()=>{
      const row=rows.get(key);if(!row)fail('save_not_found');if(blocked.has(key))fail('save_revision_conflict');
      try{
        const next=await transaction(async tx=>{
          const ref=reference(uid,row.id),prior=await tx.get(ref);check();
          if(!prior.exists()||prior.data().ownerUid!==uid)fail('save_not_found');
          if(prior.data().revision!==row.revision)fail('save_revision_conflict');
          const value={...prior.data(),gameData,revision:row.revision+1,updatedAt:now()};tx.set(ref,value);return value;
        });
        rows.set(key,{id:row.id,...next});failures.delete(key);return true;
      }catch(error){failures.set(key,gameData);if(error.message==='save_revision_conflict')blocked.add(key);onFailure(error,{key,gameState:JSON.parse(gameData)});throw error;}
    });},
    async flush(){await queue;check();if(failures.size||blocked.size)fail('save_revision_conflict');},
    deleteSlot(key){return serialize(async()=>{
      const row=rows.get(key);if(!row)fail('save_not_found');
      const ref=reference(uid,row.id);
      await transaction(async tx=>{
        const prior=await tx.get(ref);check();
        if(!prior.exists()||prior.data().ownerUid!==uid)fail('save_not_found');
        tx.delete(ref);
      });
      rows.delete(key);blocked.delete(key);failures.delete(key);refreshSummary();transport.initialSlots=slots();
      return {deleted:true,used:rows.size,saveLimit:transport.summary.saveLimit};
    });},
  };
  return transport;
}
