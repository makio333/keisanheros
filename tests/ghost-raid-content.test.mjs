import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {GHOST_RAID_PRIZES,GHOST_RAID_FRAME,GHOST_RAID_DEFEAT_DECORATION,GHOST_RAID_EQUIPMENT,ownsRaidPrize,purchaseRaidPrize} from '../ghost_raid_content.js';
import {eventEquipmentAbility,ensureEventEquipmentAbilities} from '../event_equipment.js';
const game={player:{},nextUid:1,raidCoins:3000,unlockedSkins:['hero_female_1'],unlockedAvatarBackgrounds:['default','raid_magma'],unlockedDecorations:['raid_starlight'],skinGachaTickets:7,equipGachaTenPullTickets:4};
for(const prize of GHOST_RAID_PRIZES){const before=game.raidCoins;assert.equal(purchaseRaidPrize(game,prize),true);assert.equal(game.raidCoins,before-prize.cost);for(let i=0;i<5;i++)assert.equal(purchaseRaidPrize(game,prize),false);}
assert.equal(game.raidCoins,740);assert.equal(game.ownedEquips.length,9);
for(const item of GHOST_RAID_EQUIPMENT){assert.ok(Object.values(item.stat).some(n=>n>0));assert.equal(eventEquipmentAbility(item.id),item.ability);assert.ok(fs.existsSync(item.emoji));}
const loaded=JSON.parse(JSON.stringify(game));for(const prize of GHOST_RAID_PRIZES){assert.ok(ownsRaidPrize(loaded,prize));assert.equal(purchaseRaidPrize(loaded,prize),false);}
assert.ok(loaded.unlockedAvatarBackgrounds.includes('raid_magma'));assert.ok(loaded.unlockedDecorations.includes('raid_starlight'));assert.equal(loaded.skinGachaTickets,7);assert.equal(loaded.equipGachaTenPullTickets,4);
const old={raidCoins:10000,unlockedDecorations:['raid_moon_frame']};assert.equal(purchaseRaidPrize(old,GHOST_RAID_PRIZES.at(-1)),false);assert.equal(old.raidCoins,10000);
assert.ok(GHOST_RAID_PRIZES.some(prize=>prize.id===GHOST_RAID_FRAME.id&&prize.cost===240),'the old coin-shop frame remains buyable');
assert.ok(!GHOST_RAID_PRIZES.some(prize=>prize.id===GHOST_RAID_DEFEAT_DECORATION.id),'the distinct commemorative mark is participation-only');
assert.equal(GHOST_RAID_DEFEAT_DECORATION.id,'raid_moon_defeat_mark');assert.ok(fs.existsSync(GHOST_RAID_DEFEAT_DECORATION.image));
for(const balance of [0,179,NaN,Infinity,-1,'180'])assert.equal(purchaseRaidPrize({raidCoins:balance},GHOST_RAID_PRIZES[0]),false);
const missingAbility={ownedEquips:[{id:'raid_moon_blade'}]};ensureEventEquipmentAbilities(missingAbility);assert.equal(missingAbility.ownedEquips[0].ability,'crit_up');
const source=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const c=vm.createContext({G:{unlockedAvatarBackgrounds:['default','raid_magma']},currentSlotKey:'fixture',raidPlayerProgress:()=>c.G.raidProgress||={},save(){}});
vm.runInContext(source.slice(source.indexOf('function grantRaidParticipationBackground()'),source.indexOf('const RAID_EXCHANGE_PRIZES')),c);
assert.equal(c.grantRaidParticipationBackground(),false);assert.deepEqual(c.G.unlockedAvatarBackgrounds,['default','raid_magma']);assert.equal(c.G.raidProgress.participated,true);
c.G.unlockedAvatarBackgrounds=['default'];c.grantRaidParticipationBackground();assert.deepEqual(c.G.unlockedAvatarBackgrounds,['default']);
console.log('PASS: real assets/stats/abilities, cost/insufficient/rapid repeat, old ownership, save roundtrip, no participation gift');

for(const item of GHOST_RAID_EQUIPMENT){
 const variants=GHOST_RAID_PRIZES.filter(p=>p.equipId===item.id);
 assert.deepEqual(variants.map(p=>p.rarity).sort(),[2,3,4]);
 const low=variants.find(p=>p.rarity===2),mid=variants.find(p=>p.rarity===3),high=variants.find(p=>p.rarity===4);
 assert.ok(low.cost<mid.cost&&mid.cost<high.cost);
 const legacy={raidCoins:2000,raidExchangeClaims:[item.id],ownedEquips:[{id:item.id,rarity:4}],nextUid:1};
 assert.equal(ownsRaidPrize(legacy,high),true);assert.equal(ownsRaidPrize(legacy,low),false);assert.equal(purchaseRaidPrize(legacy,low),true);assert.equal(purchaseRaidPrize(legacy,mid),true);
 assert.ok(legacy.ownedEquips.some(e=>e.id===item.id&&e.rarity===2&&e.ability===item.ability));assert.equal(purchaseRaidPrize(legacy,low),false);
 assert.equal(ownsRaidPrize(JSON.parse(JSON.stringify(legacy)),mid),true);
 const budget={raidCoins:low.cost-1};assert.equal(purchaseRaidPrize(budget,low),false);assert.equal(budget.raidCoins,low.cost-1);budget.raidCoins++;assert.equal(purchaseRaidPrize(budget,low),true);assert.equal(budget.raidCoins,0);
}
assert.equal(new Set(GHOST_RAID_PRIZES.map(p=>p.id)).size,12);
console.log('PASS: three rarities per equipment, cheaper entry tiers, independent legacy SSR ownership, exact budget, no duplicate, common template IDs and abilities');

for(const p of GHOST_RAID_PRIZES.filter(p=>p.kind==='equip'))assert.equal(p.cost,({2:60,3:100,4:180})[p.rarity]);
