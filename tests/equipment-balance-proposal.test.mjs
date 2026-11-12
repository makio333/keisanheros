import test from 'node:test';import assert from 'node:assert/strict';
import {equipmentBalanceProposal as propose,PROPOSAL_RARITY_MULTIPLIER as mult} from '../equipment_balance_proposal.js';
import {equipmentCatalog} from '../scripts/lib/equipment-mana-catalog.mjs';
import {ENCHANT_RESOURCE_COST} from '../equipment_mana_ratio.js';
const all=equipmentCatalog();
test('all ordinary proposed stats preserve original identity and fit the computed cost',()=>{
 for(const db of all.filter(d=>!d.id.startsWith('anc_')&&!d.assist))for(let r=1;r<=5;r++)for(const ability of [null,...Object.keys(ENCHANT_RESOURCE_COST)]){
  const p=propose(db,r,ability);assert.deepEqual(p.stats,Object.fromEntries(Object.entries(db.stat).map(([k,v])=>[k,Math.max(1,Math.floor(v*mult[r]))])));
  assert.ok(p.cost>=db.cost);assert.ok(p.cost*2*p.efficiency+1e-9>=p.statResources+p.enchantResources);
  if(ability)assert.equal(p.ability,ability);
 }
});
test('a powerful effect raises cost instead of weakening attack; higher-tier weapons stay stronger',()=>{
 const wood=all.find(d=>d.id==='w1'),steel=all.find(d=>d.id==='w3'),holy=all.find(d=>d.id==='w7');
 assert.equal(propose(wood,5,'lifesteal').stats.atk,8);assert.equal(propose(wood,5,'lifesteal').cost,9);
 assert.equal(propose(steel,3).stats.atk,14);assert.equal(propose(steel,3).cost,7);
 assert.equal(propose(holy,5).stats.atk,92);assert.equal(propose(holy,5).cost,40);
 assert.ok(propose(holy,5).cost>propose(steel,5).cost);
});
test('ancients and statless helper are exempt and inputs are never changed',()=>{
 for(const db of all){const before=JSON.stringify(db);assert.deepEqual(propose(db,6),{protected:true});propose(db,5);assert.equal(JSON.stringify(db),before);}
 const helper=all.find(d=>d.assist);assert.deepEqual(propose(helper,5).stats,{});assert.equal(propose(helper,5).cost,helper.cost);
});
