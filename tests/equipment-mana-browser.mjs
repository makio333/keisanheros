import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';
import {chromium} from '/Users/motoyamayuuki/.codex/skills/develop-web-game/node_modules/playwright/index.mjs';
const b=await chromium.launch({channel:'chrome',headless:true});const out='/private/tmp/equipment-mana-check';await mkdir(out,{recursive:true});
try{
 const p=await b.newPage({viewport:{width:1280,height:900},serviceWorkers:'block'});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/*',async r=>{const url=new URL(r.request().url());if(url.hostname!=='127.0.0.1')return r.fulfill({status:200,body:''});
  if(url.pathname.endsWith('/game.js')){
   const response=await r.fetch();const extra=`\nwindow.manaQA={all:()=>[...EQUIP_DB,...ANCIENT_EQUIP_DB,...LIMITED_EQUIP_DB,...HALLOWEEN_EQUIP_DB,...CHRISTMAS_EQUIP_DB,...QUEST_MEDAL_EQUIPMENT].map(base=>{const db=getEquipTemplate(base.id);return {...db,rows:[1,2,3,4,5,6].map(rarity=>({rarity,cost:equipCost(db,rarity),stat:calcEquipStat(db.stat,rarity,{id:db.id,rarity},db)}))};}),setup(){G=newGameState('マナ検証');G.isTestMode=true;currentSlotKey='TEST_MODE_TEMP';G.ownedEquips=[{uid:701,id:'w1',rarity:4,ability:'lifesteal'},{uid:702,id:'anc_w1',rarity:6,awakeningLevel:50},{uid:703,id:'a1',rarity:2},{uid:704,id:'c3',rarity:3}];G.equipment={weapon:{uid:701},armor:{uid:703},accessory:{uid:704}};showStatus();},state:()=>({bonus:equipBonus(),abilities:[...equippedAbilities()],cost:usedCost(),owned:G.ownedEquips}),tooltip(){const o=G.ownedEquips[0],db=getEquipTemplate(o.id);return generateEquipDetailHtml(db,{rarity:o.rarity,ability:o.ability,owned:o});},ancient(){G.equipment.weapon={uid:702};return {bonus:equipBonus(),cost:usedCost()};}};`;
   return r.fulfill({response,body:(await response.text())+extra});
  }return r.continue();});
 await p.goto('http://127.0.0.1:5195/?v=mana-ratio1',{waitUntil:'domcontentloaded'});await p.locator('.christmas-hub').waitFor();await p.waitForFunction(()=>window.manaQA);await p.evaluate(()=>{document.querySelector('.christmas-menu')?.remove();manaQA.setup();});
 const all=await p.evaluate(()=>manaQA.all());
 for(const db of all)for(const row of db.rows){if(row.rarity!==6)assert.equal(row.cost,Math.ceil(db.cost*({1:1,2:1.5,3:2,4:3,5:4.2}[row.rarity])),`${db.id} ★${row.rarity}`);else{const old=db.fixedCost||db.id.startsWith('anc_')?db.cost:Math.ceil(db.cost*5.5);assert.equal(row.cost,old);}}
 const s=await p.evaluate(()=>manaQA.state());assert.equal(s.bonus.atk,9);assert.equal(s.bonus.def,5);assert.equal(s.bonus.mp,14);assert.equal(s.cost,11);assert.ok(!s.abilities.includes('lifesteal'));assert.equal(s.owned[0].ability,'lifesteal','fixture record remains recoverable while combat ignores the removed effect');
 const tooltip=await p.evaluate(()=>manaQA.tooltip());assert.ok(!tooltip.includes('きゅうけつ'));assert.ok(tooltip.includes('+9'));
 const ancient=await p.evaluate(()=>manaQA.ancient());assert.equal(ancient.bonus.atk,55);assert.equal(ancient.cost,16);
 await p.screenshot({path:out+'/equipment-room.png'});
 await p.goto('http://127.0.0.1:5195/equipment_mana_ratio_report.html');assert.equal(await p.locator('#rows tr').count(),260);
 await p.locator('#slot').selectOption('weapon');await p.locator('#rarity').selectOption('3');assert.equal(await p.locator('#rows tr').count(),21);await p.screenshot({path:out+'/weapon-report.png'});
 await p.locator('#search').fill('はがね');assert.equal(await p.locator('#rows tr').count(),1);assert.match(await p.locator('#rows').innerText(),/6 → 6/);
 assert.deepEqual(errors,[]);console.log('PASS: 58 templates, rarity-scaled costs across ★1–5, removed over-budget enchant absent in battle/tooltip, ★6 stats/cost preserved, searchable report with ★6 excluded by default');
}finally{await b.close();}
