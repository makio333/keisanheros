const encode=key=>encodeURIComponent(key);
const decode=id=>{try{return decodeURIComponent(id);}catch{return id;}};
const remapValue=(value,slotMap)=>typeof value==='string'?slotMap.get(value)||value:value;
function remapHistory(data,slotMap){
  const copy=structuredClone(data);
  if(Array.isArray(copy.finisherSlotKeys))copy.finisherSlotKeys=copy.finisherSlotKeys.map(value=>remapValue(value,slotMap));
  for(const key of ['finalRankings','finalHitters'])if(Array.isArray(copy[key]))copy[key]=copy[key].map(row=>Array.isArray(row)?[remapValue(row[0],slotMap),...row.slice(1)]:({...row,...(row.slotKey?{slotKey:remapValue(row.slotKey,slotMap)}:{})}));
  return copy;
}
function moveClaimId(id,slotMap,withSuffix){
  for(const [oldKey,newKey] of slotMap){const prefix=encode(oldKey);if(withSuffix&&id.startsWith(prefix+'_'))return encode(newKey)+id.slice(prefix.length);if(!withSuffix&&id===prefix)return encode(newKey);}
  return id;
}
export function buildLegacyRaidImportPlan(raid,slotMap){
  const plan=[],add=(collection,id,data,kind='copy')=>plan.push({collection,id,data,kind});
  for(const row of raid.history)add('raidHistory',row.id,remapHistory(row.data,slotMap));
  for(const group of raid.bossRankings)for(const row of group.rows){const oldKey=row.data.slotKey||decode(row.id),slotKey=remapValue(oldKey,slotMap);add('raidRankings_'+group.bossId,encode(slotKey),{...row.data,slotKey},'rank');}
  for(const group of raid.eventRankings)for(const row of group.rows){const oldKey=row.data.slotKey||decode(row.id),slotKey=remapValue(oldKey,slotMap);add('eventRaidRankings_'+group.eventId,encode(slotKey),{...row.data,slotKey},'rank');}
  for(const row of raid.eventFinalResults){const data=structuredClone(row.data);if(Array.isArray(data.rows))data.rows=data.rows.map(item=>({...item,slotKey:remapValue(item.slotKey,slotMap)}));add('eventRaidFinalResults',row.id,data);}
  const unique=new Map();for(const row of plan)unique.set(`${row.collection}/${row.id}`,row);return [...unique.values()];
}
export function mergeLegacyRank(existing,incoming){
  const result={...incoming,...existing};
  for(const key of ['totalDamage','bestKills','totalKills','challengeCount','cheerCount'])if(Number.isFinite(Number(existing[key]))||Number.isFinite(Number(incoming[key])))result[key]=Math.max(Number(existing[key])||0,Number(incoming[key])||0);
  if('participated'in existing||'participated'in incoming)result.participated=!!existing.participated||!!incoming.participated;
  for(const key of ['playerName','avatar','avatarBackground','avatarDecoration','level','equipment'])if(existing[key]===undefined&&incoming[key]!==undefined)result[key]=incoming[key];
  result.slotKey=incoming.slotKey||existing.slotKey;
  return result;
}
