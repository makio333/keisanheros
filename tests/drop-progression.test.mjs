import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const context = vm.createContext({
  G: {}, explore: null, ENEMIES_PER_STAGE: 5, HALLOWEEN_EVENT: { id:'halloween_2026' },
  AREA_STAGES: { area1:{ stages:Array(5).fill({}) }, area2:{ stages:Array(5).fill({}) }, area14:{ stages:Array(5).fill({}) } },
  getDefaultAreaDifficultyMultiplier: id => id === 'area2' ? 2 : 1,
  rewardSettings: { dropMultTicket:0, dropMultRaidTicket:1, dropMultItem:0, dropMultEquip:0, dropMultBlueprint:0, bossEquipDrop:0, bossBlueprintRate:0, frontierDropMult:2, pastStageDropMult:0.1, repeatThreshold:3, repeatMult:0.1 },
  Math: Object.create(Math), SKIN_GACHA_TICKET_ICON:'ticket.png',
  rollHalloweenCandyDrop: () => null, rollHalloweenTicketDrop: () => null,
});
vm.runInContext(source.slice(source.indexOf('function rollBattleDrops('), source.indexOf('function winBattle(')), context);
context.explore = { stageMode:true, areaId:'area1', stageIndex:0, isBoss:false };
assert.equal(context.stageRepeatDropMult(), 2);
context.Math.random = () => 0.01;
const rewards = [];
const drops = context.rollBattleDrops({ isBoss:false }, rewards);
assert.equal(context.G.raidTickets, 1);
assert.equal(drops[0].kind, 'raid-ticket');
assert.equal(drops[0].count, 1);
assert.ok(rewards[0].includes('レイドチケット'));
assert.equal(context.G.stageDropOpportunities['area1:0'], 1);
for (let i = 1; i < 5; i++) context.recordBattleDropOpportunity();
assert.equal(context.stageRepeatDropMult(), 0.1, 'unfinished retries cannot keep boosted drop rates forever');
assert.equal(context.rollBattleDrops({ isBoss:false }, []).length, 0, 'same random threshold no longer drops on old/used attempts');
context.G.stageClearCounts = { area1:[1] };
context.explore.stageIndex = 1;
assert.equal(context.stageRepeatDropMult(), 2, 'next harder stage is boosted');
context.explore.areaId = 'area14';
context.explore.stageIndex = 0;
assert.equal(context.stageRepeatDropMult(), 0.1, 'kana shares the same beginner difficulty scale');
context.explore.areaId = 'area1';
context.explore.stageIndex = 0;
context.G.stageTotalClears = { area1:[3] };
assert.ok(Math.abs(context.stageRepeatDropMult() - 0.01) < 1e-10, 'repeated old stages are further reduced');
context.G.stageDropOpportunities = {};
context.explore.isBoss = true;
assert.equal(context.stageRepeatDropMult(), 2, 'new harder boss is boosted');
context.recordBattleDropOpportunity();
assert.equal(context.stageRepeatDropMult(), 0.1, 'boss boost cannot be farmed repeatedly');
context.explore.isHalloween = true;
assert.equal(context.stageRepeatDropMult(), 0.1, 'review event is not treated as new difficulty');
context.G.halloweenEvent = { halloween_2026:{ clears:3 } };
assert.ok(Math.abs(context.stageRepeatDropMult() - 0.01) < 1e-10);
context.explore = { stageMode:false };
assert.equal(context.stageRepeatDropMult(), 0.1, 'legacy floors cannot bypass progression rules');
function checkTicketThreshold(isBoss, field, chance, kind) {
  context.rewardSettings.dropMultTicket = field === 'dropMultTicket' ? 0.5 : 0;
  context.rewardSettings.dropMultRaidTicket = field === 'dropMultRaidTicket' ? 1 : 0;
  for (const [random, expected] of [[chance-0.000001,true],[chance,false]]) {
    context.G = {};
    context.explore = {stageMode:true,areaId:'area1',stageIndex:0,isBoss};
    context.Math.random = () => random;
    assert.equal(context.rollBattleDrops({isBoss},[]).some(d=>d.kind===kind),expected,'halved rate at the exact threshold');
  }
}
checkTicketThreshold(false,'dropMultTicket',0.025,'skin-ticket');
checkTicketThreshold(true,'dropMultTicket',0.075,'skin-ticket');
checkTicketThreshold(false,'dropMultRaidTicket',0.02,'raid-ticket');
checkTicketThreshold(true,'dropMultRaidTicket',0.06,'raid-ticket');
console.log('PASS: shared progression rates, raid ticket drops, old save migration and repeat/abandon farming limits');
