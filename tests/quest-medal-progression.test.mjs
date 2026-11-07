import assert from 'node:assert/strict';
import {homedir} from 'node:os';

const {chromium}=await import(`${homedir()}/.codex/skills/develop-web-game/node_modules/playwright/index.mjs`);
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/game.js*',async route=>{
  const response=await route.fetch();
  const code=await response.text()+`\nwindow.questMedalQA={
   milestones:()=>QUEST_MEDAL_MILESTONES.map(m=>({...m})),
   setup(medals){
    G.isTestMode=false;currentSlotKey=SAVE_PREFIX+'quest_medal_progress_fixture';
    G.questMedals=medals;G.questMedalExchanged={cost_seed:true,legacy_fixture_marker:true};
    G.items=[{uid:700,id:'potion',count:2}];G.ownedEquips=[{uid:701,id:'w1',rarity:1,ability:null}];G.nextUid=702;
    G.unlockedAvatarBackgrounds=['default'];G.equipGachaTenPullTickets=0;G.skinGachaTickets=0;
    save(true);
   },
   exchange:key=>exchangeQuestMedals(key),
   state:()=>({medals:G.questMedals,claims:Array.isArray(G.questMedalExchanged)?G.questMedalExchanged.slice():{...G.questMedalExchanged},items:G.items.map(i=>({...i})),equips:G.ownedEquips.map(i=>({...i})),backgrounds:[...(G.unlockedAvatarBackgrounds||[])],equipTickets:G.equipGachaTenPullTickets,skinTickets:G.skinGachaTickets,potionCountText:String(G.items.find(i=>i.id==='potion')?.count)}),
   save:()=>save(true),reload:()=>loadSlot(currentSlotKey),
   corruptClaims(){G.questMedalExchanged=[];},
   restoreClaims(){G.questMedalExchanged={cost_seed:true,legacy_fixture_marker:true};},
   corruptPotionCount(){G.items[0].count=NaN;},
   corruptNextUid(){G.nextUid=Number.MAX_SAFE_INTEGER;}
  };`;
  await route.fulfill({response,body:code});
 });
 await page.goto('http://127.0.0.1:5186/');
 await page.waitForFunction(()=>window.questMedalQA&&window.raidLocalPreview);
 const milestones=await page.evaluate(()=>window.questMedalQA.milestones());
 const legacy=[['cost_seed',3],['legend_w4',6],['bg_village',10],['equip_ten',15],['skin_ticket',20]];
 assert.deepEqual(milestones.slice(0,5).map(m=>[m.key,m.medals]),legacy,'keep existing milestone IDs and thresholds');
 const extras=milestones.slice(5);
 assert.equal(extras.length,15,'add fifteen later milestones');
 assert.deepEqual(extras.map(m=>m.medals),[30,45,65,90,120,160,210,275,350,440,550,700,900,1100,1400]);
 assert.equal(new Set(milestones.map(m=>m.key)).size,milestones.length,'all claim keys stay unique');
 assert.ok(milestones.every((m,i)=>i===0||m.medals>milestones[i-1].medals),'thresholds increase strictly');
 assert.equal(Math.ceil(milestones.at(-1).medals/2),700,'final reward needs 700 correct answers at two medals each');
 assert.ok(extras.filter(m=>m.kind==='background').length>=5,'later milestones award existing avatar background skins');
 assert.ok(extras.filter(m=>m.kind==='skin-ticket').length>=3,'later milestones include background skin tickets');
 assert.ok(extras.filter(m=>m.kind==='equip-ticket').length>=2,'later milestones include spaced equipment tickets');
 assert.ok(extras.filter(m=>m.kind==='item').length>=5,'later milestones include useful consumables');
 await page.evaluate(()=>window.questMedalQA.setup(29));
 assert.equal(await page.evaluate(()=>window.questMedalQA.exchange('quest_potion_cache')),null,'one medal short cannot claim');
 assert.equal((await page.evaluate(()=>window.questMedalQA.state())).items[0].count,2);
 await page.evaluate(()=>window.questMedalQA.setup(1400));
 assert.ok(await page.evaluate(()=>window.questMedalQA.exchange('quest_potion_cache')));
 assert.equal(await page.evaluate(()=>window.questMedalQA.exchange('quest_potion_cache')),null,'same milestone cannot be claimed twice');
 let state=await page.evaluate(()=>window.questMedalQA.state());
 assert.equal(state.items.find(i=>i.id==='potion').count,5);
 assert.equal(state.medals,1400,'medals are cumulative and not spent');
 assert.equal(state.claims.cost_seed,true);assert.equal(state.claims.legacy_fixture_marker,true);
 assert.ok(await page.evaluate(()=>window.questMedalQA.exchange('legend_w4')),'existing equipment milestone remains payable');
 state=await page.evaluate(()=>window.questMedalQA.state());assert.equal(state.equips.length,2);assert.equal(state.equips[1].id,'w4');assert.equal(state.equips[1].rarity,5);
 assert.ok(await page.evaluate(()=>window.questMedalQA.exchange('quest_bg_starlight')));
 assert.ok((await page.evaluate(()=>window.questMedalQA.state())).backgrounds.includes('starlight'));
 assert.ok(await page.evaluate(()=>window.questMedalQA.exchange('quest_equip_ten_2')));
 assert.equal((await page.evaluate(()=>window.questMedalQA.state())).equipTickets,1);
 assert.ok(await page.evaluate(()=>window.questMedalQA.exchange('quest_skin_ticket_4')));
 assert.equal(await page.evaluate(()=>window.questMedalQA.exchange('quest_skin_ticket_4')),null);
 state=await page.evaluate(()=>window.questMedalQA.state());assert.equal(state.skinTickets,3);
 await page.evaluate(()=>window.questMedalQA.save());await page.evaluate(()=>window.questMedalQA.reload());
 state=await page.evaluate(()=>window.questMedalQA.state());assert.equal(state.items.find(i=>i.id==='potion').count,5);assert.equal(state.skinTickets,3);assert.equal(state.claims.quest_skin_ticket_4,true);
 await page.evaluate(()=>window.questMedalQA.restoreClaims());
 await page.evaluate(()=>window.questMedalQA.corruptPotionCount());
 assert.equal(await page.evaluate(()=>window.questMedalQA.exchange('quest_potion_cache')),null,'malformed inventory rejects claim without setting its key');
 state=await page.evaluate(()=>window.questMedalQA.state());assert.equal(state.claims.quest_potion_cache,undefined);assert.equal(state.potionCountText,'NaN');
 await page.evaluate(()=>window.questMedalQA.setup(1400));await page.evaluate(()=>window.questMedalQA.corruptClaims());
 assert.equal(await page.evaluate(()=>window.questMedalQA.exchange('quest_skin_ticket_4')),null,'malformed claim map is rejected safely');
 state=await page.evaluate(()=>window.questMedalQA.state());assert.equal(state.skinTickets,0);assert.ok(Array.isArray(state.claims));
 await page.evaluate(()=>window.questMedalQA.setup(1400));await page.evaluate(()=>window.questMedalQA.corruptNextUid());
 assert.equal(await page.evaluate(()=>window.questMedalQA.exchange('legend_w4')),null,'equipment grant rejects a UID counter that cannot safely advance');
 state=await page.evaluate(()=>window.questMedalQA.state());assert.equal(state.equips.length,1);assert.equal(state.claims.legend_w4,undefined);
 assert.deepEqual(errors,[]);
 console.log('PASS: 5 legacy stages preserved; 15 additive milestones/15–700 question pacing; mixed safe rewards; short balance, idempotent claims, cumulative medals, legacy keys and save/reload preserved; malformed state rejected without payout or lost claim');
}finally{await browser.close();}
