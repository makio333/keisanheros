import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const code = source.slice(source.indexOf('const PICKUP_STAGE_MAP ='), source.indexOf('function recordStudyAnswer('));
let bossId = 'boss-1';
let entered = null;
let saves = 0;
const elements = {
  'raid-learning-recommendation': { innerHTML: '', textContent: '', classList: { add() {}, remove() {} } },
  'btn-raid-review': {},
  'screen-raid-boss': { classList: { add(value) { this.hidden = value === 'hidden'; } } },
};
const context = vm.createContext({
  G: null,
  AREA_STAGES: {
    area1: { name: '始まりの平原', stages: [{ name: '10をつくる' }, { name: '足し算' }] },
    area2: { name: '九九', stages: [{ name: '2の段' }, { name: '3の段' }] },
  },
  getStageClearCounts: areaId => context.G.stageClearCounts?.[areaId] || [0, 0],
  getRaidData: () => ({ bossId }), RAID_BOSS_ID: 'boss-1',
  rewardSettings: { pickupBonusTickets: 3 },
  document: { getElementById: id => elements[id] },
  $: id => elements[id], escapeHtml: value => String(value),
  save: () => { saves++; },
  enterAreaStage: (areaId, stageIndex) => { entered = { areaId, stageIndex }; },
});
vm.runInContext(code, context);
const fresh = () => { context.G = { raidLearning: {}, equipGachaTenPullTickets: 0 }; };
const learning = (key, attempts = 4, wrong = 2) => {
  context.G.raidLearning[key] = { label: key, attempts, wrong, correct: attempts - wrong };
};

fresh();
assert.equal(context.choosePickupStage(), null, 'new players have no bonus pickup');
assert.equal(context.getActivePickup(), null);
context.G.pickup = { bossId, areaId: 'area1', stageIndex: 0, status: 'open' };
assert.equal(context.grantPickupBonusIfAny('area1', 0), null, 'old fallback pickups cannot grant tickets');
assert.equal(context.getActivePickup(), null, 'old fallback pickups are removed');
learning('area1_0', 2, 2);
assert.equal(context.getActivePickup(), null, 'three raid answers are required');
learning('area1_0', 4, 1);
assert.equal(context.getActivePickup(), null, 'two wrong answers are required');
learning('area99_0'); learning('area1_99');
assert.equal(context.getActivePickup(), null, 'unknown stages are ignored');

fresh(); learning('area2_1');
const pickup = context.getActivePickup();
assert.equal(pickup.areaId, 'area2');
assert.equal(pickup.stageIndex, 1, 'the actual mistaken stage is selected');
assert.equal(context.grantPickupBonusIfAny('area1', 0), null, 'unrelated easy stages have no bonus');
context.renderRaidLearningRecommendation();
assert.match(elements['raid-learning-recommendation'].innerHTML, /九九・3の段/);
assert.match(elements['raid-learning-recommendation'].innerHTML, /10連チケット ×3/);
elements['btn-raid-review'].onclick();
assert.deepEqual(entered, { areaId: 'area2', stageIndex: 1 });
assert.equal(elements['screen-raid-boss'].classList.hidden, true, 'raid modal closes on direct challenge');
assert.equal(saves, 1);
assert.ok(context.grantPickupBonusIfAny('area2', 1));
assert.equal(context.G.equipGachaTenPullTickets, 3);
assert.equal(context.grantPickupBonusIfAny('area2', 1), null, 'bonus is granted only once');
assert.equal(context.getActivePickup(), null, 'claimed bonus cannot reopen for the same boss');
context.renderRaidLearningRecommendation();
assert.doesNotMatch(elements['raid-learning-recommendation'].innerHTML, /10連チケット ×3/);

fresh(); learning('area2_1'); context.getActivePickup();
bossId = 'boss-2';
assert.equal(context.grantPickupBonusIfAny('area2', 1), null, 'expired boss pickup cannot pay');
assert.equal(context.getActivePickup().bossId, 'boss-2');
context.G.pickup.status = 'declined';
assert.equal(context.getActivePickup(), null, 'declined bonus stays declined');

fresh(); learning('math_add');
assert.equal(context.getActivePickup().areaId, 'area1', 'legacy learning records remain supported');
context.G.stageClearCounts = { area1: [1, 0] };
assert.ok(context.grantPickupBonusIfAny('area1', 0), 'legacy bonus survives clear count increment');
console.log('PASS: raid review eligibility, exact stage, direct challenge, legacy migration and one-time rewards');
