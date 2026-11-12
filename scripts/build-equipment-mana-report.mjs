import {equipmentBalanceProposal,PROPOSAL_RARITY_MULTIPLIER,PROPOSAL_COST_EFFICIENCY} from '../equipment_balance_proposal.js';
import {readFileSync,writeFileSync} from 'node:fs';
import {equipmentCatalog} from './lib/equipment-mana-catalog.mjs';
import {manaEquipmentStats,manaEquipmentAbility,equipmentManaBudget,equipmentResources,ENCHANT_RESOURCE_COST} from '../equipment_mana_ratio.js';
const all=equipmentCatalog(),multipliers={1:1,2:1.5,3:2,4:3,5:4.2,6:5.5};
const names={atk:'攻撃',def:'守備',spd:'素早さ',mp:'MP',hp:'HP'},abilityNames={crit_up:'会心率+10%',guard:'被ダメージ-5%',mp_save:'消費MP-1',power:'攻撃力+15%',lifesteal:'HP吸収15%'};
const statText=s=>Object.entries(s).map(([k,v])=>`${names[k]||k}+${v}`).join(' / ')||'能力値なし';
const oldCost=(d,r)=>d.fixedCost||d.id.startsWith('anc_')?Math.max(1,d.cost||1):Math.max(1,Math.ceil((d.cost||1)*multipliers[r]));
const oldStat=(d,r,scale=1)=>Object.fromEntries(Object.entries(d.stat).map(([k,v])=>[k,Math.max(1,Math.floor(v*multipliers[r]*scale))]));
const rows=[];const variants=[];
for(const d of all){
 if(d.id.startsWith('anc_')){
  for(const [level,scale] of [[1,.2],[50,1]]){
   const stat=oldStat(d,6,scale);rows.push({id:d.id,name:d.name,icon:d.emoji,slot:d.slot,rarity:6,level,oldCost:oldCost(d,6),newCost:oldCost(d,6),oldStats:stat,newStats:stat,ability:'固有効果・覚醒とも変更なし',budget:null,statResources:null,enchantResources:null,note:'★6保護対象：マナレシオ適用外'});
  }continue;
 }
 for(let r=1;r<=5;r++){
  const requested=d.ability || null,ability=manaEquipmentAbility(d,r,requested),stats=manaEquipmentStats(d,r,requested);
  rows.push({id:d.id,name:d.name,icon:d.emoji,slot:d.slot,rarity:r,oldCost:oldCost(d,r),newCost:Math.max(1,Math.ceil(d.cost||1)),oldStats:oldStat(d,r),newStats:stats,ability:abilityNames[ability]||'なし',budget:equipmentManaBudget(d,r),statResources:equipmentResources(stats),enchantResources:ENCHANT_RESOURCE_COST[ability]||0,note:d.assist?'計算補助機能の装備：能力値なしを維持':requested?'イベント固定効果込み':r===5?'★5効果未指定時の表示例（枠に合うTier1効果）':'特殊効果なし'});
  if(!d.assist)for(const requested of [null,...Object.keys(ENCHANT_RESOURCE_COST)]){
   const applied=manaEquipmentAbility(d,r,requested),stat=manaEquipmentStats(d,r,requested);
   variants.push({id:d.id,name:d.name,rarity:r,cost:d.cost,requested:requested||'none',applied:applied||'none',budget:equipmentManaBudget(d,r),enchantResources:ENCHANT_RESOURCE_COST[applied]||0,statResources:equipmentResources(stat),statValues:stat,stats:statText(stat)});
  }
 }
}
const statDelta=(oldStats,newStats)=>Object.fromEntries([...new Set([...Object.keys(oldStats),...Object.keys(newStats)])].map(key=>[key,(newStats[key]||0)-(oldStats[key]||0)]));
const signed=n=>n>0?'+'+n:n<0?'−'+Math.abs(n):'±0';
const deltaText=delta=>Object.entries(delta).map(([key,value])=>`${names[key]||key} ${signed(value)}`).join(' / ')||'変化なし';
function effectChange(oldId,newId,known=true){
 if(!known)return '旧ランダム効果：未指定';
 if(oldId===newId)return oldId?'維持：'+abilityNames[oldId]:'変更なし（なし）';
 if(oldId&&!newId)return '削除：'+abilityNames[oldId];
 if(!oldId&&newId)return '追加：'+abilityNames[newId];
 return '変更：'+abilityNames[oldId]+' → '+abilityNames[newId];
}
for(const row of rows){
 const db=all.find(d=>d.id===row.id);
 row.statDelta=statDelta(row.oldStats,row.newStats);row.costDelta=row.newCost-row.oldCost;
 row.fixedAbility=db.ability||null;row.oldAbilityId=db.ability||null;
 row.oldAbilityKnown=row.rarity===6||!!db.ability||row.rarity<3||!!db.assist;
 row.newAbilityId=row.rarity===6?row.oldAbilityId:manaEquipmentAbility(db,row.rarity,db.ability);
 row.enchantChange=row.rarity===6?'変更なし（★6保護）':effectChange(row.oldAbilityId,row.newAbilityId,row.oldAbilityKnown);
 row.proposal=row.rarity===6?{protected:true,stats:row.newStats,cost:row.newCost,ability:row.newAbilityId}:equipmentBalanceProposal(db,row.rarity,db.ability);
 row.proposalStatDelta=statDelta(row.newStats,row.proposal.stats);
 row.proposalCostDelta=row.proposal.cost-row.newCost;
 row.proposalEffectChange=row.rarity===6?'変更なし（★6保護）':effectChange(row.newAbilityId,row.proposal.ability);
}
for(const variant of variants){
 const db=all.find(d=>d.id===variant.id),requested=variant.requested==='none'?null:variant.requested;
 variant.statDelta=statDelta(oldStat(db,variant.rarity),variant.statValues);
 variant.enchantChange=effectChange(requested||db.ability,variant.applied==='none'?null:variant.applied);
 variant.proposal=equipmentBalanceProposal(db,variant.rarity,requested);
 variant.proposalStatDelta=statDelta(variant.statValues,variant.proposal.stats);
 variant.proposalCostDelta=variant.proposal.cost-db.cost;
 variant.proposalEffectChange=effectChange(variant.applied==='none'?null:variant.applied,variant.proposal.ability);
}
const q=x=>'"'+String(typeof x==='object'&&x!==null?JSON.stringify(x):x??'').replaceAll('"','""')+'"';
const csv=(headers,data)=>'\ufeff'+headers.map(q).join(',')+'\r\n'+data.map(r=>r.map(q).join(',')).join('\r\n');
const latestRows=rows.map(r=>{
 const p=r.proposal;
 return {id:r.id,name:r.name,icon:r.icon,slot:r.slot,rarity:r.rarity,level:r.level,oldCost:r.oldCost,newCost:p.cost,oldStats:r.oldStats,newStats:p.stats,statDelta:statDelta(r.oldStats,p.stats),costDelta:p.cost-r.oldCost,ability:r.rarity===6?'固有効果・覚醒とも変更なし':abilityNames[p.ability]||'なし',fixedAbility:r.fixedAbility,oldAbilityId:r.oldAbilityId,oldAbilityKnown:r.oldAbilityKnown,newAbilityId:p.ability,note:r.note,statResources:p.statResources,enchantResources:p.enchantResources,enchantChange:r.rarity===6?'変更なし（★6保護）':effectChange(r.oldAbilityId,p.ability,r.oldAbilityKnown)};
});
const latestVariants=variants.map(v=>{
 const db=all.find(d=>d.id===v.id),p=v.proposal,oldId=v.requested==='none'?db.ability:v.requested;
 const before=oldStat(db,v.rarity);
 return {id:v.id,rarity:v.rarity,requested:v.requested,oldCost:oldCost(db,v.rarity),newCost:p.cost,oldStats:before,newStats:p.stats,statDelta:statDelta(before,p.stats),costDelta:p.cost-oldCost(db,v.rarity),oldAbilityId:oldId,newAbilityId:p.ability,ability:abilityNames[p.ability]||'なし',statResources:p.statResources,enchantResources:p.enchantResources,enchantChange:effectChange(oldId,p.ability)};
});
const headers=['ID','装備名','種類','レア度','覚醒Lv','旧コスト','最新コスト','旧ステータス','最新ステータス','能力変化量','コスト差','エンチャント変化','最新の効果'];
writeFileSync('equipment_mana_ratio_changes.csv',csv(headers,latestRows.map(r=>[r.id,r.name,r.slot,r.rarity,r.level,r.oldCost,r.newCost,statText(r.oldStats),statText(r.newStats),deltaText(r.statDelta),r.costDelta,r.enchantChange,r.ability])));
writeFileSync('equipment_mana_ratio_enchant_variants.csv',csv(['ID','レア度','比較する旧効果','旧コスト','最新コスト','旧ステータス','最新ステータス','能力変化量','コスト差','エンチャント変化','最新の効果'],latestVariants.map(r=>[r.id,r.rarity,r.requested,r.oldCost,r.newCost,statText(r.oldStats),statText(r.newStats),deltaText(r.statDelta),r.costDelta,r.enchantChange,r.ability])));
writeFileSync('equipment_mana_ratio_changes.json',JSON.stringify({rules:{trialOnly:true,hpPerResource:4,ancientProtected:true,originalStatMultipliers:PROPOSAL_RARITY_MULTIPLIER,costEfficiency:PROPOSAL_COST_EFFICIENCY,enchantCost:ENCHANT_RESOURCE_COST,preservesFullStats:true},rows:latestRows},null,2));
const serialize=x=>JSON.stringify(x).replaceAll('<','\\u003c');
let html=readFileSync(new URL('./templates/equipment-mana-report.html',import.meta.url),'utf8');
for(const [token,value] of Object.entries({__ROWS__:latestRows,__VARIANTS__:latestVariants,__LABELS__:names,__ABILITY_NAMES__:abilityNames}))html=html.replace(token,()=>serialize(value));
writeFileSync('equipment_mana_ratio_report.html',html);
console.log(JSON.stringify({templates:all.length,rows:latestRows.length,comparison:'original vs latest trial',gameStatsChanged:false}));
