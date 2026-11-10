import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const context=vm.createContext({escapeHtml:text=>String(text)});
vm.runInContext(source.slice(source.indexOf('function printRewardStripHtml('),source.indexOf('function uniqueKanjiPrintProblems(')),context);
for(const challengePrint of [false,true]){
  const html=context.printRewardStripHtml({challengePrint});
  const multiplier=challengePrint?3:1;
  assert.ok(html.includes(`1問 ${20*multiplier} EXP`));
  assert.ok(html.includes(`1問 ${10*multiplier} G`));
  assert.ok(html.includes(`秘薬 ×${3*multiplier}`));
  assert.ok(html.includes(`またはエーテル×${multiplier}`));
  assert.ok(html.includes(`全問正解ボーナス ${500*multiplier} G`));
  assert.ok(html.includes('5問以上正解') && html.includes('8問以上正解') && html.includes('10問正解'));
  assert.equal(/\d+%以上|\d+%正解/.test(html),false);
  assert.equal(html.includes('装備ガチャ10連チケット'),challengePrint);
  assert.equal(html.includes('エンシェント装備'),false);
  assert.equal((html.match(/class="print-reward"/g)||[]).length,challengePrint?7:6);
}
assert.ok(context.printRewardStripHtml({blueprint:true}).includes('エンシェント装備 ×1'));
assert.ok(context.printRewardStripHtml({questionCount:20}).includes('16問以上正解'));
console.log('PASS: shared print reward icons, quantities, thresholds, triple challenge rewards and blueprint reward.');
