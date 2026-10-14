import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const c=vm.createContext({Math});vm.runInContext(source.slice(source.indexOf('const HALLOWEEN_MATH_OPERATIONS ='),source.indexOf('function halloweenSeason2Stage(')),c);
let seed=7;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
for(const op of ['add','sub','mul','div'])for(const count of [1,2,3,5,10])for(const mode of ['answer','combine'])for(let n=0;n<50;n++){
 const enemies=Array.from({length:count},(_,partyId)=>({partyId}));const q=c.createHalloweenMathQuestion(enemies,op,mode,random);assert.ok(Number.isInteger(q.target)&&q.target>0);assert.equal(Object.keys(q.values).length,count);
 if(q.mode==='answer') {const correct=enemies.filter(e=>c.halloweenMathSelectionCorrect(q,[e.partyId]));assert.equal(correct.length,1,'answer mode has exactly one correct enemy');assert.equal(c.halloweenMathSelectionCorrect(q,[]),false);}
 else {let solutions=0;for(const a of enemies)for(const b of enemies){if(a.partyId===b.partyId)assert.equal(c.halloweenMathSelectionCorrect(q,[a.partyId,b.partyId]),false);else if(c.halloweenMathSelectionCorrect(q,[a.partyId,b.partyId]))solutions++;}assert.ok(solutions>0,'combination always has a valid ordered pair');assert.equal(c.halloweenMathSelectionCorrect(q,[0]),false);}
}
assert.equal(c.halloweenMathSelectionCorrect({mode:'combine',operation:'sub',values:{0:9,1:4},target:5},[1,0]),false,'subtraction uses selected order');
assert.equal(c.halloweenMathSelectionCorrect({mode:'combine',operation:'div',values:{0:8,1:4},target:2},[0,1]),true);
assert.equal(c.halloweenMathSelectionCorrect({mode:'combine',operation:'div',values:{0:8,1:4},target:2},[1,0]),false);
console.log('PASS: four operations, 1/2/3/5/10 targets, unique answer, solvable pairs, selection order, integral division and single-survivor fallback');
const elements=new Map();const fill={style:{}};const attrs={};const stub={insertAdjacentHTML(){},setAttribute(k,v){attrs[k]=v;},classList:{toggle(){}},querySelector:()=>fill};const node=id=>{if(!elements.has(id))elements.set(id,{classList:{remove(){},add(){}},querySelector:()=>stub,textContent:'',innerHTML:''});return elements.get(id);};
let strikes=[],done=0;
const flow=vm.createContext({Math,Date,HALLOWEEN_MATH_OPERATIONS:{},battle:{enemies:[{partyId:0,hp:10},{partyId:1,hp:10},{partyId:2,hp:10}]},explore:{halloweenOperation:'add'},currentChallenge:null,$:node,halloweenSeason2Stage:()=>({mathMode:'combine'}),createHalloweenMathQuestion:()=>({operation:'add',mode:'combine',target:7,values:{0:9,1:3,2:4},selected:[],symbol:'＋'}),halloweenMathSelectionCorrect:c.halloweenMathSelectionCorrect,renderHalloweenParty(){},setInterval:()=>1,clearInterval(){},openSkillMenu(){},openItemMenu(){},blog(){},effectiveAtk:()=>5,basicAttackDamage:()=>5,afterPlayerAction(){done++;},turnBasedEnemyAct(){},dealToEnemy(_damage,_label,_crit,callback){strikes.push(flow.battle.enemy.partyId);callback();}});
flow.destroyChallenge=()=>{flow.currentChallenge?.destroy();flow.currentChallenge=null;};
vm.runInContext(source.slice(source.indexOf('function startHalloweenMathChallenge()'),source.indexOf('/* --- スキル --- */')),flow);
let clock=1000,tick;flow.Date={now:()=>clock};flow.setInterval=callback=>{tick=callback;return 1;};
flow.startHalloweenMathChallenge();assert.equal(attrs['aria-valuenow'],'30');clock+=5000;tick();assert.equal(attrs['aria-valuenow'],'25');assert.ok(Math.abs(parseFloat(fill.style.width)-100*25/30)<0.01);
flow.answerHalloweenEnemy(2);assert.equal(strikes.length,0);flow.answerHalloweenEnemy(1);assert.deepEqual(strikes,[2,1],'both chosen enemies attacked in selected order, regardless of their array positions');assert.equal(done,1);assert.equal(flow.battle.halloweenAnswerOutcome.submitted,true);
flow.G={player:{mp:10}};flow.skillMpCost=()=>5;flow.updateBattleBars=()=>{};flow.explore.halloweenSeason=2;
const skillStart=source.indexOf('const HALLOWEEN_PARTY_SKILLS =');vm.runInContext(source.slice(skillStart,source.indexOf(';',skillStart)+1),flow);
vm.runInContext(source.slice(source.indexOf('function useSkill(s){'),source.indexOf('/* --- アイテム --- */')),flow);
const previousOutcome=flow.battle.halloweenAnswerOutcome;flow.useSkill({id:'renzoku',name:'れんぞく斬り'});assert.equal(flow.G.player.mp,10,'existing skill cannot spend MP in S2');assert.equal(flow.battle.halloweenAnswerOutcome,previousOutcome);
strikes=[];flow.battle.halloweenTurnQuestion=null;flow.useSkill({id:'pumpkin_wave'});assert.equal(flow.battle.halloweenPendingSkill.id,'pumpkin_wave');flow.answerHalloweenEnemy(1);flow.answerHalloweenEnemy(2);assert.deepEqual(strikes,[0,1,2],'event skill hits every living enemy once');assert.equal(flow.G.player.mp,5,'event skill charges once');
flow.$=node;flow.explore.halloweenBossSpawned=true;flow.battle={enemies:[{partyId:0,hp:40,isBoss:true},{partyId:1,hp:10},{partyId:2,hp:10}]};strikes=[];
flow.dealToEnemy=(damage,_label,_crit,callback)=>{strikes.push(flow.battle.enemy.partyId);flow.battle.enemy.hp-=damage;callback();};
flow.startHalloweenMathChallenge();flow.answerHalloweenEnemy(1);flow.answerHalloweenEnemy(2);
assert.deepEqual(strikes,[0],'correct fifth calculation targets the boss even when the answer numbers are on other enemies');assert.equal(flow.battle.enemies[0].hp,0,'fifth correct answer finishes the boss in one strike');
