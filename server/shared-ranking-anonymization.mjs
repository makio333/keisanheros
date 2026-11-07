const recordLike=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
const validId=value=>typeof value==='string'&&value.length>0&&value.length<=1500;
const supportedCollection=name=>/^raidRankings_[A-Za-z0-9_-]{1,100}$/.test(name)||name==='raidHistory'||name==='raidGlobal';
const genericProfile=row=>({...row,playerName:'勇者',avatar:'',avatarBackground:'default',avatarHolographic:false,avatarBackgroundHolographic:false,avatarDecoration:'',level:1,equipment:{}});

async function resolveSlotOwner(resolveOwner,{collection,documentId,slotKey,entry}){
  try{
    const result=await resolveOwner({collection,documentId,slotKey,entry});
    return result?.verified===true&&typeof result.accountId==='string'&&result.accountId.length>0?result:null;
  }catch{return null;}
}

// Produces a reviewable transform for current raid ranking/history shapes. It keeps
// score/rank data and all unrelated participants byte-for-byte, and only redacts the
// target participant's public profile fields. Internal slot keys remain for rewards,
// so this is display redaction/pseudonymization, not proof of irreversible anonymity.
export async function planSharedRankingAnonymization({accountId,records,resolveOwner}={}){
  const blockers=[];
  if(typeof accountId!=='string'||!accountId||!Array.isArray(records)||typeof resolveOwner!=='function')return {complete:false,ready:false,blockers:['shared_record_scope_unavailable'],operations:[],preservedRecords:0};
  const operations=[];let preservedRecords=0;
  for(const record of records){
    if(!recordLike(record)||!validId(record.documentId)||typeof record.collection!=='string'||!supportedCollection(record.collection)||!recordLike(record.data)){
      blockers.push('shared_record_shape_or_collection_unknown');continue;
    }
    const data=structuredClone(record.data);let changed=false;
    const ownerFor=async(slotKey,entry)=>{
      if(!validId(slotKey)){blockers.push('shared_record_slot_key_missing');return false;}
      const owner=await resolveSlotOwner(resolveOwner,{collection:record.collection,documentId:record.documentId,slotKey,entry});
      if(!owner){blockers.push('shared_record_owner_mapping_unverified');return false;}
      return owner.accountId===accountId;
    };
    if(record.collection.startsWith('raidRankings_')){
      let slotKey=data.slotKey;
      if(typeof slotKey!=='string')try{slotKey=decodeURIComponent(record.documentId);}catch{blockers.push('shared_record_slot_key_invalid');slotKey=null;}
      const target=await ownerFor(slotKey,data);
      if(target){Object.assign(data,genericProfile(data));changed=true;}
    }else if(record.collection==='raidHistory'||record.collection==='raidGlobal'){
      if(record.collection==='raidGlobal'&&!data.finalizedAt&&Array.isArray(data.finisherSlotKeys)){
        for(const slotKey of data.finisherSlotKeys)if(await ownerFor(slotKey,{kind:'finisher'}))blockers.push('active_shared_raid_must_settle_first');
      }
      if(Array.isArray(data.finalRankings)){
        const next=[];
        for(const entry of data.finalRankings){
          if(Array.isArray(entry)){
            const slotKey=entry[0];await ownerFor(slotKey,entry);next.push([...entry]);
          }else if(recordLike(entry)){
            const target=await ownerFor(entry.slotKey,entry);
            next.push(target?genericProfile(entry):entry);if(target)changed=true;
          }else{blockers.push('shared_record_ranking_entry_unknown');next.push(entry);}
        }
        data.finalRankings=next;
      }
      if(Array.isArray(data.finalHitters)){
        const next=[];
        for(const entry of data.finalHitters){
          if(recordLike(entry)&&typeof entry.slotKey==='string'){
            const target=await ownerFor(entry.slotKey,entry);next.push(target?{...entry,playerName:'勇者'}:entry);if(target)changed=true;
          }else{blockers.push('shared_record_hitter_entry_unknown');next.push(entry);}
        }
        data.finalHitters=next;
      }
    }
    if(changed)operations.push({collection:record.collection,documentId:record.documentId,expectedRevision:record.revision??null,after:data});
    else preservedRecords++;
  }
  const unique=[...new Set(blockers)];
  return {complete:unique.length===0,ready:unique.length===0,blockers:unique,operations,preservedRecords,scope:'shared-ranking-display-redaction'};
}
