// SP-equivalent equipment budgets. ★6 is deliberately handled by the legacy
// caller, including its awakening growth and cost rules.
export const MANA_RARITY_BONUS=Object.freeze({1:0,2:1,3:2,4:3,5:3});
export const ENCHANT_RESOURCE_COST=Object.freeze({crit_up:2,guard:2,mp_save:2,power:6,lifesteal:12});
export const ENCHANT_TIER=Object.freeze({crit_up:1,guard:1,mp_save:1,power:2,lifesteal:3});
const UNITS=Object.freeze({atk:1,def:1,spd:1,mp:1,hp:4});
export function equipmentResources(stat){return Object.entries(stat||{}).reduce((sum,[key,value])=>sum+(UNITS[key]?Number(value)/UNITS[key]:0),0);}
export function equipmentManaBudget(db,rarity){
 if(Number(rarity)===6)return null;
 return 2*Math.max(1,Math.ceil(Number(db?.cost)||1))+(MANA_RARITY_BONUS[rarity]??0);
}
// Integer SP units, largest remainder, stable stat-key order for ties. This
// preserves each template's identity while spending exactly the stat budget.
export function allocateEquipmentResources(baseStat,resources){
 const entries=Object.entries(baseStat||{}).filter(([key,value])=>UNITS[key]&&Number(value)>0);
 if(!entries.length)return {};
 const total=entries.reduce((n,[key,value])=>n+Number(value)/UNITS[key],0);
 const units=Math.max(0,Math.floor(resources));
 const parts=entries.map(([key,value],index)=>{const quota=units*(Number(value)/UNITS[key])/total;return {key,index,value:Math.floor(quota),fraction:quota-Math.floor(quota)};});
 let left=units-parts.reduce((n,p)=>n+p.value,0);
 for(const part of [...parts].sort((a,b)=>b.fraction-a.fraction||a.index-b.index))if(left-->0)part.value++;
 return Object.fromEntries(parts.map(p=>[p.key,p.value*UNITS[p.key]]));
}
export function manaEquipmentAbility(db,rarity,requested=null){
 if(Number(rarity)===6)return requested || db?.ability || null;
 if(db?.assist)return null;
 const budget=equipmentManaBudget(db,rarity);
 const candidate=requested || db?.ability || null;
 if(candidate){
   return ENCHANT_RESOURCE_COST[candidate]!=null&&ENCHANT_RESOURCE_COST[candidate]<=budget ? candidate : null;
 }
 if(!candidate&&Number(rarity)<5)return null;
 // New ★5 equipment has a budget-compatible enchant. An oversized legacy
 // enchant is removed above and its full budget becomes normal stats.
 return ({weapon:'crit_up',armor:'guard',accessory:'mp_save'})[db?.slot] || 'crit_up';
}
export function manaEquipmentStats(db,rarity,requested=null){
 if(Number(rarity)===6)throw new Error('Ancient equipment must use its protected legacy calculation');
 if(db?.assist)return {...db.stat};
 const ability=manaEquipmentAbility(db,rarity,requested);
 const budget=equipmentManaBudget(db,rarity)-(ENCHANT_RESOURCE_COST[ability]||0);
 return allocateEquipmentResources(db?.stat,budget);
}
