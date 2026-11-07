import assert from 'node:assert/strict';
import {homedir} from 'node:os';
const {chromium}=await import(`${homedir()}/.codex/skills/develop-web-game/node_modules/playwright/index.mjs`);
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1366,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/game.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+`\nwindow.skillIconQA={open(mp=99){explore=null;battle={enemy:{hp:100,maxHp:100,def:0},pGauge:0,eGauge:0,over:false,currentTurnProblem:{problem:{text:'1 + 1',answer:2,a:1,b:1,op:'+'},timeLimit:60000}};G.player.mp=mp;for(const s of SKILL_DB)G.skills[s.id]={level:1,progress:0};showScreen('screen-battle');openSkillMenu();},empty(){G.skills={};openSkillMenu();}};`});});
 await page.goto('http://127.0.0.1:5186/');await page.waitForFunction(()=>!!window.skillIconQA&&!!window.raidLocalPreview);
 for(const [width,height] of [[1366,900],[390,844]]){
  await page.setViewportSize({width,height});await page.evaluate(()=>window.skillIconQA.open());
  const rows=page.locator('.battle-skill-option');assert.equal(await rows.count(),10);
  await rows.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
  const icons=rows.locator('.ipv2-cell[data-icon-kind="skill"] img');assert.equal(await icons.count(),10);
  assert.ok(await icons.evaluateAll(imgs=>imgs.every(img=>/assets\/skills\/skill_.*\.png$/.test(new URL(img.src).pathname))));
  assert.equal(await page.locator('.ipv2-tier').count(),5);
  assert.ok(await rows.first().isEnabled());
  assert.ok(await rows.evaluateAll(rs=>rs.every(r=>r.scrollWidth<=r.clientWidth)));
  await page.screenshot({path:`/tmp/skill-menu-${width}.png`,fullPage:true});
 }
 await page.locator('.battle-skill-option').first().click();await page.locator('#ch-input').waitFor({state:'visible'});assert.ok(await page.locator('#battle-sub-menu').isHidden());
 await page.evaluate(()=>window.skillIconQA.open(0));assert.equal(await page.locator('.battle-skill-option:disabled').count(),10);
 await page.evaluate(()=>window.skillIconQA.empty());assert.equal(await page.locator('.battle-skill-option').count(),0);assert.ok((await page.locator('#battle-sub-menu').innerText()).includes('つかえる とくぎが ない'));
 assert.deepEqual(errors,[]);console.log('PASS: ten skill icons loaded, five II badges, desktop/mobile fit, MP disabled, no learned skills, no exceptions');
}finally{await browser.close();}
