// Report-only trial. The live game's mana-ratio calculation is unchanged.
import {equipmentResources,ENCHANT_RESOURCE_COST} from './equipment_mana_ratio.js';
export const PROPOSAL_RARITY_MULTIPLIER=Object.freeze({1:1,2:1.5,3:2,4:3,5:4.2});
export const PROPOSAL_COST_EFFICIENCY=Object.freeze({1:1,2:1.05,3:1.10,4:1.15,5:1.20});
export function equipmentBalanceProposal(db,rarity,requested=null){
 if(Number(rarity)===6)return {protected:true};
 if(!PROPOSAL_RARITY_MULTIPLIER[rarity])throw new Error('Unsupported equipment rarity');
 const baseCost=Math.max(1,Math.ceil(Number(db.cost)||1));
 if(db.assist)return {stats:{...db.stat},cost:baseCost,ability:null,statResources:0,enchantResources:0,efficiency:1,helper:true};
 const stats=Object.fromEntries(Object.entries(db.stat).map(([key,value])=>[key,Math.max(1,Math.floor(value*PROPOSAL_RARITY_MULTIPLIER[rarity]))]));
 const ability=requested || db.ability || (Number(rarity)===5?({weapon:'crit_up',armor:'guard',accessory:'mp_save'})[db.slot]:null);
 const enchantResources=ENCHANT_RESOURCE_COST[ability]||0;
 const statResources=equipmentResources(stats);
 const efficiency=PROPOSAL_COST_EFFICIENCY[rarity];
 // Preserve the full original stats. Enchants are paid for with cost, never by
 // cutting attack or another base stat. Rarity makes SP per cost 5% better/step.
 const cost=Math.max(baseCost,Math.ceil((statResources+enchantResources)/(2*efficiency)));
 return {stats,cost,ability,statResources,enchantResources,efficiency};
}
