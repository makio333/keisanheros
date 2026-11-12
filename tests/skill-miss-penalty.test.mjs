import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
let answer,damage=0,enemyDamage=0,ended=0;
const context=vm.createContext({
  G:{player:{hp:50,mp:10}},battle:{enemy:{hp:100,def:0},over:false},explore:null,
  BALANCE:{atkMinRatio:.3,timeBonus:.2,missDamageRatio:.2},
  $:()=>({classList:{add(){}}}),skillMpCost:()=>3,effectiveAtk:()=>20,basicAttackDamage:()=>20,
  getOrGenerateTurnProblem:()=>({problem:{answer:2},timeLimit:5000}),
  startChallenge:(_container,_options,callback)=>{answer=callback;},destroyChallenge(){},blog(){},
  applyMissPenalty(){},SM:{playBeep(){}},spawnFloatingDamage(_el,amount){damage=amount;},
  updateBattleBars(){},afterPlayerAction(){},endBattleLoop(){ended++;},showPlayerDownOverlay(){},loseBattle(){},
  setTimeout(callback){callback();},
});
vm.runInContext(source.slice(source.indexOf('function useSkill(s){'),source.indexOf('/* --- アイテム --- */')),context);

context.useSkill({id:'fixture',name:'検証スキル',mp:3,dmgMult:2});
answer({success:false,timeFrac:0});
assert.equal(context.G.player.hp,46,'wrong skill answer deals 20% of attack as self-damage');
assert.equal(damage,4);
assert.equal(context.battle.enemy.hp,100,'failed skill does not damage the enemy');
assert.equal(ended,0);

context.G.player.hp=4;
context.useSkill({id:'fixture',name:'検証スキル',mp:3,dmgMult:2});
answer({success:false,timeFrac:0});
assert.equal(context.G.player.hp,0,'self-damage cannot make HP negative');
assert.equal(ended,1,'lethal mistake ends the battle');
console.log('PASS: wrong skill calculations damage the player, not the enemy; lethal mistakes end safely.');
