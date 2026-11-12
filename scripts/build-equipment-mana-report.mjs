import {readFileSync,writeFileSync} from 'node:fs';
import {equipmentCatalog} from './lib/equipment-mana-catalog.mjs';
import {manaEquipmentStats,manaEquipmentAbility,manaEquipmentCost,equipmentManaBudget,equipmentResources,MANA_COST_MULTIPLIER,MANA_RARITY_BONUS,ENCHANT_RESOURCE_COST} from '../equipment_mana_ratio.js';
const all=equipmentCatalog(),oldMultipliers={1:1,2:1.5,3:2,4:3,5:4.2,6:5.5};
const names={atk:'攻撃',def:'守備',spd:'素早さ',mp:'MP',hp:'HP'},abilityNames={crit_up:'会心率+10%',guard:'被ダメージ-5%',mp_save:'消費MP-1',power:'攻撃力+15%',lifesteal:'HP吸収15%'};
const oldCost=(d,r)=>d.fixedCost||d.id.startsWith('anc_')?Math.max(1,d.cost||1):Math.max(1,Math.ceil((d.cost||1)*oldMultipliers[r]));
const oldStat=(d,r,scale=1)=>Object.fromEntries(Object.entries(d.stat).map(([k,v])=>[k,Math.max(1,Math.floor(v*oldMultipliers[r]*scale))]));
const statDelta=(a,b)=>Object.fromEntries([...new Set([...Object.keys(a),...Object.keys(b)])].map(k=>[k,(b[k]||0)-(a[k]||0)]));
const signed=n=>n>0?'+'+n:n<0?'−'+Math.abs(n):'±0';
const statText=s=>Object.entries(s).map(([k,v])=>`${names[k]||k}+${v}`).join(' / ')||'能力値なし';
const deltaText=s=>Object.entries(s).map(([k,v])=>`${names[k]||k} ${signed(v)}`).join(' / ')||'変化なし';
function effectChange(oldId,newId,known=true){
 if(!known)return '旧ランダム効果：未指定';
 if(oldId===newId)return oldId?'維持：'+abilityNames[oldId]:'変更なし（なし）';
 if(oldId&&!newId)return '削除：'+abilityNames[oldId];
 if(!oldId&&newId)return '追加：'+abilityNames[newId];
 return '変更：'+abilityNames[oldId]+' → '+abilityNames[newId];
}
function makeRow(db,rarity,requested=null,known=false){
 const oldStats=oldStat(db,rarity),newStats=manaEquipmentStats(db,rarity,requested),ability=manaEquipmentAbility(db,rarity,requested),oldAbility=requested||db.ability||null;
 return {id:db.id,name:db.name,icon:db.emoji,slot:db.slot,rarity,oldCost:oldCost(db,rarity),newCost:manaEquipmentCost(db,rarity),oldStats,newStats,statDelta:statDelta(oldStats,newStats),costDelta:manaEquipmentCost(db,rarity)-oldCost(db,rarity),ability:abilityNames[ability]||'なし',fixedAbility:db.ability||null,oldAbilityId:oldAbility,oldAbilityKnown:known,newAbilityId:ability,note:db.assist?'計算補助装備：能力値なしを維持':db.ability?'固定効果を予算から控除':rarity===5?'特殊効果の表示例':'特殊効果なし',statResources:equipmentResources(newStats),enchantResources:ENCHANT_RESOURCE_COST[ability]||0,budget:equipmentManaBudget(db,rarity),enchantChange:effectChange(oldAbility,ability,known)};
}
const latestRows=[],latestVariants=[];
for(const db of all){
 if(db.id.startsWith('anc_')){
  for(const [level,scale] of [[1,.2],[50,1]]){const stat=oldStat(db,6,scale);latestRows.push({id:db.id,name:db.name,icon:db.emoji,slot:db.slot,rarity:6,level,oldCost:oldCost(db,6),newCost:oldCost(db,6),oldStats:stat,newStats:stat,statDelta:statDelta(stat,stat),costDelta:0,ability:'固有効果・覚醒とも変更なし',oldAbilityKnown:true,oldAbilityId:null,newAbilityId:null,note:'★6保護',enchantChange:'変更なし（★6保護）'});}continue;
 }
 for(let rarity=1;rarity<=5;rarity++){
  latestRows.push(makeRow(db,rarity,db.ability,!!db.ability||rarity<3||!!db.assist));
  if(!db.assist)for(const requested of [null,...Object.keys(ENCHANT_RESOURCE_COST)])latestVariants.push({...makeRow(db,rarity,requested,true),requested:requested||'none'});
 }
}
const q=x=>'"'+String(x??'').replaceAll('"','""')+'"';
const csv=(headers,data)=>'\ufeff'+headers.map(q).join(',')+'\r\n'+data.map(r=>r.map(q).join(',')).join('\r\n');
const headers=['ID','装備名','種類','レア度','覚醒Lv','旧コスト','最新コスト','旧ステータス','最新ステータス','能力変化量','コスト差','エンチャント変化','最新の効果'];
writeFileSync('equipment_mana_ratio_changes.csv',csv(headers,latestRows.map(r=>[r.id,r.name,r.slot,r.rarity,r.level,r.oldCost,r.newCost,statText(r.oldStats),statText(r.newStats),deltaText(r.statDelta),r.costDelta,r.enchantChange,r.ability])));
writeFileSync('equipment_mana_ratio_enchant_variants.csv',csv(['ID','レア度','比較する旧効果','旧コスト','最新コスト','旧ステータス','最新ステータス','能力変化量','コスト差','エンチャント変化','最新の効果'],latestVariants.map(r=>[r.id,r.rarity,r.requested,r.oldCost,r.newCost,statText(r.oldStats),statText(r.newStats),deltaText(r.statDelta),r.costDelta,r.enchantChange,r.ability])));
writeFileSync('equipment_mana_ratio_changes.json',JSON.stringify({rules:{trialOnly:false,resourcePerCost:2,hpPerResource:4,rarityCostMultipliers:MANA_COST_MULTIPLIER,rarityResourceBonus:MANA_RARITY_BONUS,enchantCost:ENCHANT_RESOURCE_COST,ancientProtected:true},rows:latestRows},null,2));
const serialize=x=>JSON.stringify(x).replaceAll('<','\\u003c');
let html=readFileSync(new URL('./templates/equipment-mana-report.html',import.meta.url),'utf8');
for(const [token,value] of Object.entries({__ROWS__:latestRows,__VARIANTS__:latestVariants,__LABELS__:names,__ABILITY_NAMES__:abilityNames}))html=html.replace(token,()=>serialize(value));
writeFileSync('equipment_mana_ratio_report.html',html);
console.log(JSON.stringify({templates:all.length,rows:latestRows.length,comparison:'original vs live rarity-scaled mana ratio'}));
