import {parseLegacySaveFile} from './legacy_save_file.js';

export async function preparePrivateMigration(value){
  const file=parseLegacySaveFile(value);
  const records=await Promise.all(file.saves.map(async row=>{
    const identity=new TextEncoder().encode(JSON.stringify([file.sourceProject,row.documentId]));
    const key=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',identity)),byte=>byte.toString(16).padStart(2,'0')).join('');
    const gameData=JSON.stringify(row.gameState);
    if(new TextEncoder().encode(gameData).length>850000)throw Error('migration_save_too_large');
    return {key,sourceProject:file.sourceProject,sourceDocumentId:row.documentId,gameData};
  }));
  if(new TextEncoder().encode(JSON.stringify(records)).length>7*1024*1024)throw Error('migration_file_too_large');
  return {file,records};
}

// The adapter binds the collection to the verified Firebase UID, never file input.
export async function applyPrivateMigration(plan,{transaction,reference,uid,now=Date.now}){
  if(!uid)throw Error('authentication_required');
  return transaction(async tx=>{
    const refs=plan.records.map(row=>reference(uid,row.key));
    const existing=await Promise.all(refs.map(ref=>tx.get(ref)));
    let imported=0;
    for(let i=0;i<refs.length;i++)if(!existing[i].exists()){
      const {key,...record}=plan.records[i];
      tx.set(refs[i],{...record,ownerUid:uid,importedAt:now()});imported++;
    }
    return {imported,skipped:refs.length-imported};
  });
}
