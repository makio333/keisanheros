import test from 'node:test';import assert from 'node:assert/strict';
import {equipmentCatalog} from '../scripts/lib/equipment-mana-catalog.mjs';
import {manaEquipmentStats,manaEquipmentAbility,equipmentManaBudget,equipmentResources,ENCHANT_RESOURCE_COST,allocateEquipmentResources} from '../equipment_mana_ratio.js';
const all=equipmentCatalog();
test('cost one SP examples and rarity increments match the specification',()=>{
 for(const key of ['atk','def','spd','mp','hp']){
  const db={cost:1,slot:'weapon',stat:{[key]:1}};
  for(const [rarity,resources] of [[1,2],[2,3],[3,4],[4,5]])assert.equal(manaEquipmentStats(db,rarity)[key],resources*(key==='hp'?4:1));
  assert.equal(equipmentResources(manaEquipmentStats(db,5))+2,5);
 }
});
test('every template and enchant combination spends exactly its permitted budget',()=>{
 for(const db of all.filter(d=>!d.id.startsWith('anc_')&&!d.assist))for(let rarity=1;rarity<=5;rarity++)for(const requested of [null,...Object.keys(ENCHANT_RESOURCE_COST)]){
  const ability=manaEquipmentAbility(db,rarity,requested),stats=manaEquipmentStats(db,rarity,requested);
  assert.equal(equipmentResources(stats)+(ENCHANT_RESOURCE_COST[ability]||0),equipmentManaBudget(db,rarity),`${db.id} ★${rarity} ${requested}`);
  for(const [key,value] of Object.entries(stats)){assert.ok(Number.isInteger(value)&&value>=0);if(key==='hp')assert.equal(value%4,0);}
 }
});
test('over-budget absorption is removed, affordable absorption survives, and no source is mutated',()=>{
 const db={id:'w1',cost:1,slot:'weapon',stat:{atk:2}};const before=JSON.stringify(db);
 assert.equal(manaEquipmentAbility(db,5,'lifesteal'),null);assert.equal(manaEquipmentStats(db,5,'lifesteal').atk,5);
 assert.equal(manaEquipmentAbility({...db,cost:5},5,'lifesteal'),'lifesteal');assert.equal(JSON.stringify(db),before);
 assert.deepEqual(allocateEquipmentResources({atk:7,spd:1},8),{atk:7,spd:1});
});
test('ancient equipment cannot enter the new formula and helper equipment keeps no stats',()=>{
 for(const db of all){assert.equal(equipmentManaBudget(db,6),null);assert.throws(()=>manaEquipmentStats(db,6),/Ancient/);assert.equal(manaEquipmentAbility(db,6,'lifesteal'),'lifesteal');}
 const helper=all.find(d=>d.assist);assert.deepEqual(manaEquipmentStats(helper,5),{});assert.equal(manaEquipmentAbility(helper,5),null);
});
