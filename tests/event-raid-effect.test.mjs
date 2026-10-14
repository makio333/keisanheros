import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const effects=[],cleanup=[];
const owner={over:false,enemies:[],eventRaidUltimate:null};
const context=vm.createContext({battle:owner,explore:{isEventRaid:true},av:value=>value,SM:{play(){}},
 document:{createElement(){return {setAttribute(){},removed:false,remove(){this.removed=true;}};}},
 $:()=>({appendChild(effect){effects.push(effect);}}),setTimeout(fn,ms){cleanup.push({fn,ms});}
});
vm.runInContext(source.slice(source.indexOf('function playEventRaidUltimate('),source.indexOf('function startEventRaidBattle(')),context);
context.playEventRaidUltimate({over:false});assert.equal(effects.length,0,'stale battle cannot start an effect');
context.playEventRaidUltimate(owner);assert.equal(effects.length,1);assert.match(effects[0].innerHTML,/全体攻撃！/);assert.match(effects[0].innerHTML,/lantern_ghost\.png/);
assert.equal(cleanup[0].ms,1500);
context.playEventRaidUltimate(owner);assert.equal(effects[0].removed,true);assert.equal(owner.eventRaidUltimate,effects[1]);
cleanup[0].fn();assert.equal(owner.eventRaidUltimate,effects[1],'old cleanup cannot cancel a newer effect');
cleanup[1].fn();assert.equal(owner.eventRaidUltimate,null);
context.explore.isEventRaid=false;context.playEventRaidUltimate(owner);assert.equal(effects.length,2,'ordinary stages do not show event-only effects');
console.log('PASS: event-only full-screen ultimate, stale owner protection, recast cleanup and timed cleanup');
