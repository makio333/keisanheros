import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {applyGiftPayload,recallGiftPayload,raidParticipationCoins,raidRankCoins,raidResumeStage} from '../economy.js';
import {eventRaidFinalGift} from '../event_raid.js';
for(const [damage,coins]of [[0,0],[1,1],[4,1],[5,2],[406,102],[-10,0]])assert.equal(raidParticipationCoins(damage),coins);
assert.deepEqual([1,2,3,4,100,0].map(raidRankCoins),[50,30,15,5,5,0]);
assert.deepEqual([0,1,2,3,10].map(raidResumeStage),[0,0,0,1,8]);
const game={player:{gold:10}};
const gift={id:'test',gold:50,items:[{kind:'ticket',id:'raid-ticket',count:2},{kind:'equip',id:'w1',rarity:4,count:2},{kind:'item',id:'potion',count:3},{kind:'decoration',id:'rank_gold',count:1}]};
assert.equal(applyGiftPayload(game,gift),true);assert.equal(applyGiftPayload(game,gift),false);
assert.equal(game.player.gold,60);assert.equal(game.raidTickets,2);assert.equal(game.ownedEquips.length,2);assert.equal(game.items[0].count,3);assert.deepEqual(game.unlockedDecorations,['rank_gold']);
const rankings=[{slotKey:'a',totalKills:100},{slotKey:'b',totalKills:80},{slotKey:'c',totalKills:70},{slotKey:'d',totalKills:1}];
for(const [key,ornament]of [['a','rank_gold'],['b','rank_silver'],['c','rank_bronze'],['d',null]]){const award=eventRaidFinalGift(rankings,key);assert.ok(award.items.some(item=>item.id==='halloween_rank_blade'));assert.equal(award.items.find(item=>item.kind==='decoration')?.id || null,ornament);}
assert.equal(eventRaidFinalGift(rankings,'absent'),null);
const source=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const context=vm.createContext({G:{playerName:'確認用',stageClearCounts:{area1:{0:1},area5:{0:1}},activePrints:{},player:{}},AREA_STAGES:{area1:{name:'math',displayNum:'1年',stages:[{name:'easy',generateProblem:(()=>{let n=0;return()=>({answer:++n,text:`1 + ${n}`})})()},{name:'uncleared',generateProblem:()=>({answer:99,text:'99'})}]},area5:{name:'kanji',displayNum:'1年',stages:[{name:'hard',generateProblem:(()=>{let n=0;return()=>({text:`漢字${++n}`,answer:`よみ${n}`,tier:'kanji_g1'})})()}]}},stageDropDifficulty:(id,index)=>id==='area5'?10:1+index,kanjiPrintContext:p=>({before:'勇者は',after:'をよむ。'}),escapeHtml:s=>String(s),printRewardStripHtml:()=>'<section>報酬 16問以上正解</section>',fractionTextHtml:s=>s,addPrintCode(_id,code,meta){context.printMeta={code,meta};return'1234';},save(){},openPrintWindow(html){context.html=html;},showConfirmModal(title,message){context.warning={title,message};}});
vm.runInContext(source.slice(source.indexOf('function blueprintChallengeSource('),source.indexOf('function startBlueprintCodeEntry(')),context);
context.printBlueprintSheet({id:'bp_test'},123);assert.equal(context.printMeta.meta.uid,123);assert.equal(context.printMeta.meta.problems.length,20);assert.equal(context.printMeta.meta.duplex,true);assert.equal((context.html.match(/class="bt-page"/g)||[]).length,2);assert.equal((context.html.match(/class="bt-kanji"/g)||[]).length,10);assert.equal((context.html.match(/class="bt-math"/g)||[]).length,10);assert.ok(context.html.includes('16問以上正解'));assert.ok(context.html.includes('前のステージ'));
assert.ok(context.html.includes('<b>国語 1.</b>'));
assert.ok(context.html.includes('<b>国語 15.</b>'));
assert.ok(!context.html.includes('<b>国語 16.</b>'));
assert.ok(context.html.includes('class="bt-cell"'),'writing questions must have actual kanji cells');
assert.ok(context.html.includes('（2 / 2）'));
context.G.stageClearCounts={area1:{0:1}};assert.equal(context.blueprintChallengeSource().stageIndex,0,'uncleared higher difficulty is never selected');
context.G.stageClearCounts={};assert.equal(context.blueprintChallengeSource(),null);
const owned={player:{},ownedEquips:[],nextUid:1,raidCoins:1000};
const shop=vm.createContext({G:owned,save(){},updateHud(){}});
vm.runInContext(source.slice(source.indexOf('const RAID_EXCHANGE_PRIZES ='),source.indexOf('function showRaidExchange(')),shop);
for(const id of ['raid_star_blade','raid_ward_armor','raid_focus_charm','raid_star_guardian','raid_observatory','raid_starlight'])assert.equal(shop.exchangeRaidPrize(id),true,id);
assert.equal(owned.raidCoins,250);assert.deepEqual(owned.ownedEquips.map(item=>item.ability),['power','guard','mp_save']);assert.equal(shop.exchangeRaidPrize('raid_star_blade'),false);assert.equal(owned.raidCoins,250);
owned.raidExchangeClaims=[];owned.raidCoins=0;assert.equal(shop.exchangeRaidPrize('raid_star_blade'),false);
console.log('PASS: raid coin rounding, ranks, exchange abilities, insufficient balance, duplicate prevention, gift ledger, final Halloween rewards and hardest cleared blueprint source');

const replacement={id:'replacement',gold:1000000,replacesGiftId:'original',recallOriginal:true};
const recalled={player:{gold:998553},claimedAdminGiftIds:['original']};assert.equal(recallGiftPayload(recalled,replacement),true);assert.equal(recalled.player.gold,0);assert.equal(recalled.giftRecallDebts.original,1447);assert.equal(recallGiftPayload(recalled,replacement),false);applyGiftPayload(recalled,replacement);assert.equal(recalled.player.gold,998553,'replacement restores balance without duplicating spent gold');assert.equal(applyGiftPayload(recalled,replacement),false);

const isolated=vm.createContext({G:{isTestMode:true},TEST_SLOT_KEY:'test',localStorage:{setItem(){throw new Error('test play must not touch shared raid cache');}}});vm.runInContext(source.slice(source.indexOf('function recordRaidDamage('),source.indexOf('// ランキング配列を取得')),isolated);isolated.recordRaidDamage('test','Test',1023);
