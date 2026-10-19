import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {EVENT_EQUIPMENT_ABILITIES,eventEquipmentAbility,ensureEventEquipmentAbilities} from '../event_equipment.js';
import {applyGiftPayload} from '../economy.js';
const source=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const block=source.slice(source.indexOf('const HALLOWEEN_EQUIP_DB ='),source.indexOf('function getEquipTemplate('));
const catalog=vm.runInNewContext(block+'\nHALLOWEEN_EQUIP_DB');
assert.equal(catalog.length,13);
for(const entry of catalog)assert.ok(eventEquipmentAbility(entry.id),'guaranteed event ability: '+entry.id);
assert.equal(Object.keys(EVENT_EQUIPMENT_ABILITIES).length,catalog.length);
const owned=catalog.map((entry,index)=>({uid:index+1,id:entry.id,rarity:2,ability:null}));
const game={ownedEquips:owned,player:{gold:100},nextUid:30};
const before=catalog.map(entry=>({id:entry.id,stat:entry.stat,cost:entry.cost}));
assert.equal(ensureEventEquipmentAbilities(game),true);assert.ok(owned.every(entry=>entry.ability));assert.equal(ensureEventEquipmentAbilities(game),false);
owned[0].ability='lifesteal';ensureEventEquipmentAbilities(game);assert.equal(owned[0].ability,'lifesteal','existing special ability is preserved');
assert.deepEqual(catalog.map(entry=>({id:entry.id,stat:entry.stat,cost:entry.cost})),before,'ability migration never changes stats or costs');
applyGiftPayload(game,{id:'rank-reward',gold:0,items:[{id:'halloween_rank_blade',kind:'equip',rarity:3,count:1}]});assert.equal(game.ownedEquips.at(-1).ability,'lifesteal');
assert.equal(catalog.find(e=>e.id==='raid_star_blade').stat.atk,5);assert.equal(catalog.find(e=>e.id==='raid_ward_armor').stat.def,5);assert.equal(catalog.find(e=>e.id==='raid_focus_charm').stat.mp,6);
for(const id of ['raid_star_blade','raid_ward_armor','raid_focus_charm'])assert.ok(catalog.find(e=>e.id===id).emoji.includes('magma'));
assert.equal(new Set(catalog.map(entry=>entry.emoji)).size,catalog.length,'each event equipment uses a distinct asset');
console.log('PASS: all event equipment has an ability, legacy copies migrate once, existing abilities/stats/costs survive and all artwork paths are unique');
const shop=vm.runInNewContext(source.slice(source.indexOf('const EQUIP_DB ='),source.indexOf('/* 古代装備：'))+'\nEQUIP_DB');
for(const [id,cost] of Object.entries({shop_light_sword:3,shop_guard_vest:3,shop_mana_charm:4})){assert.equal(shop.find(x=>x.id===id).cost,cost);}
for(const [id,cost] of Object.entries({halloween_bat_buckler:3,halloween_pumpkin_bell:3,halloween_rank_blade:5,halloween_candy_saber:3,halloween_light_cape:4,halloween_moon_pin:3,raid_star_blade:5,raid_ward_armor:5,raid_focus_charm:4})){assert.equal(catalog.find(x=>x.id===id).cost,cost);assert.equal(catalog.find(x=>x.id===id).fixedCost,true);}
assert.equal(shop.find(x=>x.id==='w1').cost,1,'starter weapon remains available');assert.equal(shop.find(x=>x.id==='w3').cost,3);assert.equal(shop.find(x=>x.id==='w5').cost,6);
assert.ok(shop.find(x=>x.id==='shop_light_sword').price<shop.find(x=>x.id==='w3').price,'weaker traveler sword is cheaper than steel at the same cost');
