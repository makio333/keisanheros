import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const context=vm.createContext({G:{player:{gold:0}},$:()=>({classList:{add(){}}}),removeResolvedPrint(){},ITEM_DB:['potion','hipotion','ether','cost_seed'].map(id=>({id,name:id,emoji:'icon'})),pick:items=>items[0],addItem(id,count){context.items[id]=(context.items[id]||0)+count;},items:{},grantExp(exp){context.exp=exp;return {leveledUp:false};},save(){},playItemRevealSequence(rewards){context.rewards=rewards;}});
vm.runInContext(source.slice(source.indexOf('function grantPrintRewards('),source.indexOf('// Make print functions available')),context);
function grade(challenge,rate,id){context.G={player:{gold:0}};context.items={};context.grantPrintRewards({printId:id,meta:{type:'practice',challengePrint:challenge}},10*rate,10,rate);return {gold:context.G.player.gold,exp:context.exp,items:structuredClone(context.items),ticket:context.G.equipGachaTenPullTickets || 0};}
const normal=grade(false,1,'normal'),special=grade(true,1,'special');assert.equal(special.gold,normal.gold*3);assert.equal(special.exp,normal.exp*3);for(const id of Object.keys(normal.items))assert.equal(special.items[id],normal.items[id]*3);assert.equal(special.ticket,1);
const before=context.G.player.gold;context.grantPrintRewards({printId:'special',meta:{challengePrint:true}},10,10,1);assert.equal(context.G.player.gold,before,'challenge print pays once');assert.equal(grade(true,.8,'pass').ticket,1);assert.equal(grade(true,.7,'fail').ticket,0);
const print=vm.createContext({G:{},AREA_STAGES:{area5:{name:'kanji',stages:[{name:'reading',generateProblem:()=>({text:'一',answer:'いち',tier:'kanji_g1'})}]}},isKanjiProblem:()=>true,showPrintChoiceModal(variants){print.variants=variants;},addPrintCode(target,code,meta){print.meta={...meta,target};return '1234';},save(){},openPrintWindow(){print.opened=true;}});
vm.runInContext(source.slice(source.indexOf('function printAreaStage('),source.indexOf('function printAreaBoss(')),print);
print.printAreaStage('area5',0,false,{bp:{id:'bp_ancient'},uid:42},()=>{print.done=true;});print.variants[0].onSelect();assert.equal(print.meta.type,'blueprint');assert.equal(print.meta.uid,42);assert.equal(print.meta.problems[0].answer,'いち');assert.ok(print.opened&&print.done);
console.log('PASS: challenge print triple experience/gold/consumables, ticket threshold, repeat protection and hardest-stage kanji blueprint print metadata');
