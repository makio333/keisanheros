import {buildLegacyRaidImportPlan,mergeLegacyRank} from '../legacy_raid_transfer.js';

export function previewLegacyRaidImport(raidData,slotMap){
  return buildLegacyRaidImportPlan(raidData,slotMap).length;
}

export async function applyLegacyRaidImport({store,raidData,slotMap,now=Date.now()}){
  const plan=buildLegacyRaidImportPlan(raidData,slotMap),result={imported:0,merged:0,skipped:0};
  for(let start=0;start<plan.length;start+=180){
    const chunk=plan.slice(start,start+180);
    const counts=await store.transaction(async tx=>{
      const pending=[];let skipped=0;
      for(const row of chunk){
        const key=`${row.collection}/${row.id}`,existing=await tx.getGameDocument(key);
        if(existing===undefined){pending.push({...row,key,data:row.data});continue;}
        if(row.kind==='rank'){
          const merged=mergeLegacyRank(existing,row.data);
          const comparable=value=>{const copy={...value};delete copy.migrationImportedAt;return JSON.stringify(copy);};
          if(comparable(merged)!==comparable(existing))pending.push({...row,key,data:merged,kind:'merged'});
          else skipped++;
        }else skipped++;
      }
      for(const row of pending)tx.putGameDocument(row.key,{...row.data,migrationImportedAt:now});
      return {imported:pending.filter(row=>row.kind!=='merged').length,merged:pending.filter(row=>row.kind==='merged').length,skipped};
    });
    result.imported+=counts.imported;result.merged+=counts.merged;result.skipped+=counts.skipped;
  }
  return result;
}
