import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const elements = [];
let started = 0, saved = 0, nextHome = 0, now = Date.parse('2026-10-13T12:00:00+09:00');
let review = { areaId:'area2', stageIndex:1 };
const context = vm.createContext({
  G: { raidTickets:0, player:{hp:10,mp:5}, stageClearCounts:{area2:[0,0]} }, explore:null,
  AREA_STAGES: { area1:{ stages:[{},{}] }, area2:{ stages:[{},{}] } },
  Date: class extends Date { static now() { return now; } },
  choosePickupStage: () => review,
  stageDropDifficulty: (id, index) => (id === 'area2' ? 200 : 100) + index,
  getDefaultAreaDifficultyMultiplier: id => id === 'area2' ? 2 : 1,
  startBattle: () => { started++; },
  showKillProgressPopup: (_a,_b,_c,done) => done(),
  totalMaxHp: () => 30, totalMaxMp: () => 10,
  save: () => { saved++; }, showHome: () => { nextHome++; }, hideTooltip() {}, bindDropItemTooltips() {},
  stageClearRewardsHtml: () => '<p>報酬</p>',
  document: { createElement() {
    const button = {};
    const element = { querySelector: () => button, remove() {}, button };
    elements.push(element); return element;
  }, body:{ appendChild() {} } },
});
vm.runInContext(source.slice(source.indexOf('const HALLOWEEN_EVENT ='), source.indexOf('const PICKUP_STAGE_MAP =')), context);
assert.equal(context.isHalloweenActive(Date.parse('2026-10-01T00:00:00+09:00')), true);
assert.equal(context.isHalloweenActive(Date.parse('2026-10-31T23:59:59+09:00')), true);
assert.equal(context.isHalloweenActive(Date.parse('2026-11-01T00:00:00+09:00')), false);
assert.equal(context.halloweenChallengeSource().areaId, 'area2', 'raid review takes priority');
review = null;
context.G.studyStats = { stageHistory:{ area2_1:{total:1}, area1_0:{total:3}, area99_0:{total:4} } };
assert.equal(context.halloweenChallengeSource().areaId, 'area2', 'fallback uses an actually attempted stage');
delete context.G.studyStats;
assert.equal(context.halloweenChallengeSource().areaId, 'area1', 'new players get an introductory challenge');
context.startHalloweenChallenge({areaId:'area2',stageIndex:1});
assert.equal(context.explore.isHalloween, true);
context.explore.sessionDrops = []; context.explore.sessionGold = 20; context.explore.stageExp = 40;
const monsters = [];
for (let i = 0; i < 8; i++) {
  const enemy = context.generateHalloweenEnemy(context.explore);
  monsters.push(enemy.emoji);
  assert.equal(enemy.isBoss, i === 7);
  assert.ok(fs.existsSync(new URL('../' + enemy.emoji, import.meta.url)), 'monster sprite is saved in the project');
  context.proceedHalloweenBattle();
}
assert.equal(new Set(monsters).size, 8);
assert.equal(started, 8, 'exactly eight encounters');
assert.equal(context.G.raidTickets, 2, 'first event clear grants two raid tickets');
assert.equal(context.G.halloweenEvent.halloween_2026.clears, 1);
assert.equal(context.G.stageClearCounts.area2[1], 0, 'event clear does not mark the source stage cleared');
assert.equal(context.explore, null);
assert.equal(saved, 2);
context.showHalloweenMenu = () => {};
elements.at(-1).button.onclick();
assert.equal(nextHome, 1);
assert.equal(context.grantHalloweenClearReward(), null);
assert.equal(context.G.raidTickets, 2, 'seasonal clear reward cannot be claimed twice');
now = Date.parse('2026-11-01T00:00:00+09:00');
context.startHalloweenChallenge({areaId:'area1',stageIndex:0});
assert.equal(context.explore, null, 'event entry closes at the end of October in Japan');
console.log('PASS: Halloween dates, review/fallback source, eight unique sprites, one-time rewards and independent progression');
