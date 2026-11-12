import assert from 'node:assert/strict';
import {test} from 'node:test';
import {planSharedRankingAnonymization} from '../server/shared-ranking-anonymization.mjs';

const owners=new Map([['slot-a','account-a'],['slot-b','account-b']]);
const resolveOwner=async({slotKey})=>owners.has(slotKey)?{accountId:owners.get(slotKey),verified:true}:null;

test('redacts one ranking identity while preserving its score and unrelated participants',async()=>{
  const ranking={collection:'raidRankings_boss_50',documentId:'slot-a',revision:7,data:{slotKey:'slot-a',playerName:'fixture-name',avatar:'dragon',avatarBackground:'moon',avatarHolographic:true,avatarBackgroundHolographic:true,avatarDecoration:'crown',level:99,equipment:{weapon:'fixture'},totalDamage:8765,participated:true}};
  const history={collection:'raidHistory',documentId:'boss_50',revision:12,data:{finalizedAt:100,finalRankings:[{slotKey:'slot-a',playerName:'fixture-name',avatar:'dragon',level:99,equipment:{weapon:'fixture'},totalDamage:8765},{slotKey:'slot-b',playerName:'other-name',totalDamage:4321}],finalHitters:[{slotKey:'slot-a',playerName:'fixture-name'},{slotKey:'slot-b',playerName:'other-name'}]}};
  const plan=await planSharedRankingAnonymization({accountId:'account-a',records:[ranking,history],resolveOwner});
  assert.equal(plan.ready,true);assert.equal(plan.operations.length,2);
  const ranked=plan.operations[0].after,archived=plan.operations[1].after;
  assert.equal(ranked.playerName,'勇者');assert.equal(ranked.avatar,'');assert.deepEqual(ranked.equipment,{});assert.equal(ranked.totalDamage,8765);assert.equal(ranked.slotKey,'slot-a');
  assert.equal(archived.finalRankings[0].playerName,'勇者');assert.equal(archived.finalRankings[0].totalDamage,8765);assert.equal(archived.finalRankings[1].playerName,'other-name');
  assert.equal(archived.finalHitters[0].playerName,'勇者');assert.equal(archived.finalHitters[1].playerName,'other-name');
  assert.equal(history.data.finalRankings[0].playerName,'fixture-name','planning does not mutate source records');
});

test('missing identity mapping, unknown record shapes and active shared raid block the whole plan',async()=>{
  const unknown=await planSharedRankingAnonymization({accountId:'account-a',records:[{collection:'raidRankings_boss_50',documentId:'slot-unknown',data:{slotKey:'slot-unknown',playerName:'fixture'}}],resolveOwner});
  assert.equal(unknown.ready,false);assert.ok(unknown.blockers.includes('shared_record_owner_mapping_unverified'));assert.deepEqual(unknown.operations,[]);
  const active=await planSharedRankingAnonymization({accountId:'account-a',records:[{collection:'raidGlobal',documentId:'currentBoss',data:{finisherSlotKeys:['slot-a']}}],resolveOwner});
  assert.ok(active.blockers.includes('active_shared_raid_must_settle_first'));
  const group=await planSharedRankingAnonymization({accountId:'account-a',records:[{collection:'raidGroups',documentId:'group-a',data:{members:[]}}],resolveOwner});
  assert.ok(group.blockers.includes('shared_record_shape_or_collection_unknown'));
});
