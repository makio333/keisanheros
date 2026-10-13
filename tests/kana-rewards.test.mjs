import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const context = vm.createContext({
  rewardSettings: { thirdGoldBase: 100, thirdGoldStep: 50, thirdItemId: 'hipotion', thirdItemCount: 3 },
  getItemTemplate: id => ({ id }),
  AREA_STAGES: Object.fromEntries(['area1','area13','area2','area3','area4','area11','area12','area14','area15','area5','area6','area7','area8','area9','area10'].map(id => [id, { stages: Array.from({ length: id === 'area1' ? 7 : 5 }) }])),
});
vm.runInContext(source.slice(source.indexOf('const STAGE_REWARD_MATH_ORDER ='), source.indexOf('/* ごほうびアイコンの')), context);
for (const areaId of ['area14', 'area15']) {
  for (let index = 0; index < 5; index++) {
    const reward = context.stageFirstSuppliesReward(areaId, index);
    assert.equal(reward.gold, 50 + index * 25, 'kana stages have modest beginner rewards');
    assert.equal(reward.itemId, 'potion');
    assert.equal(reward.count, 1);
    assert.ok(reward.gold < context.stageFirstSuppliesReward('area1', index).gold);
  }
}
assert.equal(context.stageFirstSuppliesReward('area1', 0).gold, 100, 'math reward remains unchanged');
assert.equal(context.stageFirstSuppliesReward('area15', 0).gold, 50, 'katakana does not inherit accumulated hiragana reward growth');
context.rewardSettings.thirdItemCount = 0;
assert.equal(context.stageFirstSuppliesReward('area14', 0).count, 0, 'disabled item rewards remain disabled');
console.log('PASS: kana beginner gold/items, katakana growth reset and unchanged math rewards');
