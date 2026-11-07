import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../hp_recovery_feedback.js',import.meta.url),'utf8').replace(/^import .*;$/m,'').replaceAll('export ','');
const c=vm.createContext({});vm.runInContext(source+';globalThis.make=createHpRecoveryTracker;',c);
const amounts=[],track=c.make(amount=>amounts.push(amount)),p={hp:30};
track(p);track(p);p.hp=10;track(p);p.hp=25;track(p);track(p);p.hp=26;track(p);
assert.deepEqual(amounts,[15,1]);track({hp:999});assert.deepEqual(amounts,[15,1]);p.hp=NaN;track(p);p.hp=Infinity;track(p);track(null);assert.deepEqual(amounts,[15,1]);
console.log('PASS: first render/load silent, damage silent, exact actual HP increase, same update not repeated, separate save silent, invalid values ignored');
