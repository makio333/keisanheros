import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../kuku_training.js',import.meta.url),'utf8').replace(/^import .*;$/m,'').replaceAll('export ','');
const c=vm.createContext({});vm.runInContext(source+';globalThis.api={KUKU_THREE,kukuMastered,learnKuku};',c);
const {KUKU_THREE,kukuMastered,learnKuku}=c.api;
assert.equal(KUKU_THREE.length,9);assert.equal(KUKU_THREE[2].name,'サザンガ');
const old={skills:{renzoku:{level:1}}};assert.equal(kukuMastered(old).length,0);assert.equal(learnKuku(old,2,6),false);assert.equal(learnKuku(old,1,''),false);assert.equal(learnKuku(old,1,2),false);
for(let n=1;n<=9;n++){assert.equal(learnKuku(old,n,String(n*3)),true);assert.equal(learnKuku(old,n,String(n*3)),true);assert.equal(kukuMastered(old).length,n);}
assert.equal(kukuMastered(JSON.parse(JSON.stringify(old))).length,9);assert.deepEqual(old.skills,{renzoku:{level:1}});
assert.equal(learnKuku({},1,'３'),true);assert.equal(learnKuku({},1,'3e0'),false);assert.equal(learnKuku({},1,'3.0'),false);
assert.equal(kukuMastered({kukuTraining:{three:[2,3,9]}}).length,0);assert.equal(kukuMastered({kukuTraining:{three:'bad'}}).length,0);
console.log('PASS: ordered nine lessons, exact damage totals, input validation, duplicate-safe mastery, old save and JSON roundtrip, existing skills preserved');
