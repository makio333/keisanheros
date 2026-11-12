import {manaEquipmentStats} from '../equipment_mana_ratio.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {awakeningState,awakeningScale,awakeningExpNext,grantAwakeningExp,masterExistingAncients} from '../ancient_awakening.js';
const fixture=()=>({equipment:{weapon:{uid:1},armor:{uid:2},accessory:{uid:3}},ownedEquips:[{uid:1,id:'anc_w1',rarity:6},{uid:2,id:'anc_a1',rarity:6},{uid:3,id:'ordinary',rarity:5},{uid:4,id:'stored',rarity:6}]});
test('new and legacy copies start at 1; growth is monotone and caps at original strength',()=>{
 assert.equal(awakeningState({rarity:6}).level,1);assert.equal(awakeningScale({rarity:6}),.2);
 let previous=0;for(let level=1;level<=50;level++){const scale=awakeningScale({rarity:6,awakeningLevel:level});assert.ok(scale>=previous&&scale<=1);previous=scale;}
 assert.equal(awakeningScale({rarity:6,awakeningLevel:50}),1);assert.equal(awakeningScale({rarity:5}),1);
});
test('enemy experience is not split; unequipped/ordinary equipment stays unchanged; repeated slot references do not double award',()=>{
 const game=fixture();game.equipment.other={uid:1};const changes=grantAwakeningExp(game,29);
 assert.equal(changes.length,2);assert.equal(game.ownedEquips[0].awakeningExp,29);assert.equal(game.ownedEquips[1].awakeningExp,29);
 assert.equal(game.ownedEquips[2].awakeningExp,undefined);assert.equal(game.ownedEquips[3].awakeningExp,undefined);
 grantAwakeningExp(game,1);assert.equal(game.ownedEquips[0].awakeningLevel,2);assert.equal(game.ownedEquips[0].awakeningExp,0);
 const restored=JSON.parse(JSON.stringify(game));grantAwakeningExp(restored,awakeningExpNext(2));assert.equal(restored.ownedEquips[0].awakeningLevel,3);
});
test('multi-level grants, maximum level and invalid experience are bounded',()=>{
 const game=fixture();const before=JSON.stringify(game);for(const amount of [NaN,Infinity,-10,0])assert.deepEqual(grantAwakeningExp(game,amount),[]);assert.equal(JSON.stringify(game),before);
 grantAwakeningExp(game,1e9);assert.equal(game.ownedEquips[0].awakeningLevel,50);assert.equal(game.ownedEquips[0].awakeningExp,0);assert.deepEqual(grantAwakeningExp(game,100),[]);
 assert.equal(awakeningState({awakeningLevel:-10,awakeningExp:-3}).level,1);
});
test('explicit compensation only upgrades currently owned copies; later acquisitions start at one',()=>{
 const game=fixture();assert.equal(masterExistingAncients(game),3);assert.equal(game.ownedEquips[3].awakeningLevel,50);assert.equal(game.ownedEquips[2].awakeningLevel,undefined);
 game.ownedEquips.push({uid:5,id:'new',rarity:6});assert.equal(awakeningState(game.ownedEquips.at(-1)).level,1);
});

test('actual equipment calculations restore original stats at 50 and scale numeric ancient effects',async()=>{
 const {readFileSync}=await import('node:fs');const vm=await import('node:vm');
 const source=readFileSync(new URL('../game.js',import.meta.url),'utf8');
 const ctx={manaEquipmentStats,eventEquipmentAbility:()=>null,awakeningScale,awakeningState,grantAwakeningExp,masterExistingAncients,equippedAncients:(game)=>Object.values(game.equipment).flatMap(ref=>game.ownedEquips.filter(e=>e.uid===ref?.uid&&e.rarity===6))};vm.createContext(ctx);
 vm.runInContext(source.slice(source.indexOf('const RARITY_MULTI ='),source.indexOf('function rarityLabelHtml(')),ctx);
 for(const stat of [{atk:10},{def:35,hp:20},{mp:6,spd:12}]){
  for(const [key,value]of Object.entries(stat)){
   assert.equal(ctx.calcEquipStat(stat,6,{rarity:6,awakeningLevel:50})[key],Math.max(1,Math.floor(value*5.5)));
   assert.ok(ctx.calcEquipStat(stat,6,{rarity:6})[key]<ctx.calcEquipStat(stat,6,{rarity:6,awakeningLevel:50})[key]);
  }
 }
 assert.equal(ctx.calcEquipStat({atk:10},5,null,{cost:5,slot:'weapon',stat:{atk:10}}).atk,11);
 ctx.G={equipment:{weapon:{uid:1},armor:{uid:2}},ownedEquips:[{id:'anc_w3',uid:1,rarity:6},{id:'anc_a2',uid:2,rarity:6}]};
 vm.runInContext(source.slice(source.indexOf('function equippedAncientScale('),source.indexOf('function rollAncientBlueprintReward(')),ctx);
 assert.equal(ctx.ancientCritBonus(),.06);assert.equal(ctx.ancientDamageReduction(100),94);
 masterExistingAncients(ctx.G);assert.equal(ctx.ancientCritBonus(),.3);assert.equal(ctx.ancientDamageReduction(100),70);
 ctx.G.equipment={};assert.equal(ctx.ancientDamageReduction(0),0);

});

test('operator compensation requires the loaded child, confirmation, and cannot repeat on new acquisitions',async()=>{
 const {readFileSync}=await import('node:fs');const vm=await import('node:vm');const source=readFileSync(new URL('../game.js',import.meta.url),'utf8');
 const button={},select={value:'other',appendChild(){}};let confirm=null,saves=0;
 const ctx={G:fixture(),currentSlotKey:'target',$:id=>id==='btn-admin-ancient-compensation'?button:select,isAncientEquipment:e=>e.rarity===6,masterExistingAncients,escapeHtml:String,listSaveSlots:()=>[],updateAdminStudyDisplay(){},showConfirmModal(title,message,yes){confirm=yes;},save(){saves++;},updateHud(){}};vm.createContext(ctx);
 vm.runInContext(source.slice(source.indexOf('function renderAdminStudyStats()'),source.indexOf('function updateAdminStudyDisplay(')),ctx);ctx.renderAdminStudyStats();button.onclick();assert.equal(confirm,null);assert.equal(saves,0);
 select.value='target';button.onclick();assert.equal(typeof confirm,'function');assert.equal(ctx.G.ownedEquips[0].awakeningLevel,undefined);
 const accept=confirm;select.value='other';accept();assert.equal(saves,0);select.value='target';button.onclick();confirm();assert.equal(saves,1);assert.equal(ctx.G.ownedEquips[0].awakeningLevel,50);
 ctx.G.ownedEquips.push({id:'new',uid:9,rarity:6});button.onclick();assert.equal(confirm,null);assert.equal(ctx.G.ownedEquips.at(-1).awakeningLevel,undefined);assert.equal(saves,1);
});
