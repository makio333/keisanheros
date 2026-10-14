import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const elements = new Map();
const el = id => { if(!elements.has(id)) elements.set(id,{innerHTML:'',textContent:'',focus(){}}); return elements.get(id); };
let callback, saves=0, screen;
const context = vm.createContext({
 G:null,RARITY_MAX:5,EQUIP_SLOTS:['weapon','armor'],
 getEquipTemplate:id=>({id,name:id,emoji:'icon.png',opTier:'add1'}),getAbility:()=>null,
 rollAbility:()=> 'bonus',save(){saves++;},showScreen:id=>screen=id,
 synthesisEquipmentHtml:()=>'',hideTooltip(){},$:el,SM:{play(){}},
 generateProblem:()=>({answer:2}),problemTimeLimit:()=>8000,
 startChallenge(_container,_opts,cb){callback=cb;},destroyChallenge(){},
});
vm.runInContext(source.slice(source.indexOf('function synthesisMatches('),source.indexOf('function synthesisEquipmentHtml(')),context);
vm.runInContext(source.slice(source.indexOf('let synthesisRun ='),source.indexOf('function bindEvents(){')),context);
const fresh=()=>{context.G={nextUid:10,ownedEquips:[{uid:1,id:'w1',rarity:3},{uid:2,id:'w1',rarity:3},{uid:3,id:'w1',rarity:3},{uid:4,id:'w1',rarity:4},{uid:5,id:'w2',rarity:3},{uid:6,id:'w1',rarity:5}],equipment:{weapon:{uid:2},armor:{uid:5}}};};
fresh();
assert.equal(context.synthesisMatches(context.G.ownedEquips[0]).length,2);
for(const uid of [1,4,5,6])assert.equal(context.synthesisPairValid(1,uid),false);
assert.equal(context.commitSynthesis(1,1),null);
context.startSynthesisFlow({baseUid:2,materialUid:3});
assert.equal(screen,'screen-synthesis-calc');
callback({success:true});assert.equal(context.G.ownedEquips.length,6,'first correct answer consumes nothing');
callback({success:true});
assert.deepEqual(Array.from(context.G.ownedEquips,eq=>eq.uid),[1,4,5,6,10],'exact selected copies consumed');
assert.equal(context.G.ownedEquips.at(-1).rarity,4);
assert.equal(context.G.equipment.weapon,null);
assert.equal(context.G.equipment.armor.uid,5);
assert.equal(saves,1);
callback({success:true});assert.equal(saves,1,'late callback cannot grant twice');
fresh();context.startSynthesisFlow({baseUid:1,materialUid:2});callback({success:false});assert.equal(context.G.ownedEquips.length,6);
fresh();context.showSynthesis=()=>{};context.startSynthesisFlow({baseUid:1,materialUid:2});const stale=callback;context.quitSynthesisFlow();stale({success:true});assert.equal(context.G.ownedEquips.length,6);
fresh();context.startSynthesisFlow({baseUid:1,materialUid:2});callback({success:true});context.G.ownedEquips=context.G.ownedEquips.filter(eq=>eq.uid!==2);callback({success:true});assert.equal(context.G.ownedEquips.length,5,'invalidated pair cannot consume base or create item');
console.log('PASS: matching, selected-copy consumption, rarity, equipment cleanup, success/failure/cancel, stale callback protection');
