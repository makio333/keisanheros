import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const context=vm.createContext({});
vm.runInContext(source.slice(source.indexOf('function applyMoonWraithMissingOperand('),source.indexOf('/* 新ステージモードなら')),context);
const transform=p=>context.applyMoonWraithMissingOperand(p,'moonWraith');
for(const p of [
 {a:6,b:4,op:'+',answer:10},{a:10,b:4,op:'-',answer:6},
 {a:6,b:4,op:'×',answer:24},{a:24,b:4,op:'÷',answer:6},
 {a:6,b:4,c:2,op:'+',answer:12},{a:10,b:4,c:2,op:'-',answer:4},
 {a:6,b:4,c:2,op:'+-',answer:8},
]){
 const result=transform(p);
 assert.equal(result.answer,p.b);assert.equal(result.raidMissingOperand.knownAnswer,p.answer);assert.match(result.text,/□/);
 assert.equal(context.applyMoonWraithMissingOperand(p,'darkBahamut'),p);
}
for(const p of [{a:6,b:4,op:'÷',answer:1,remainder:2},{a:6,b:4,op:'+',answer:99},{text:'漢字',answer:'かんじ'}]) assert.equal(transform(p),p);
vm.runInContext(source.slice(source.indexOf('const RAID_BOSS_PRE_GHOST_APPEARANCE_ID'),source.indexOf('const RAID_BOSS_APPEARANCES')),context);
const opening=Date.parse('2026-11-01T00:00:00+09:00');
assert.equal(context.activeRaidBossAppearanceId(opening-1),'darkBahamutFinal');
assert.equal(context.activeRaidBossAppearanceId(opening),'moonWraith');
console.log('PASS: ghost king missing operand, four operations, three operands, safe fallback and exact JST opening boundary');
