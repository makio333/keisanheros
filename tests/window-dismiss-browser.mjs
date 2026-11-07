import assert from 'node:assert/strict';import {homedir} from 'node:os';
const {chromium}=await import(`${homedir()}/.codex/skills/develop-web-game/node_modules/playwright/index.mjs`);
const b=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/game.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+`\nwindow.dismissQA={open(kind){explore=null;for(const s of SKILL_DB)G.skills[s.id]={level:1,progress:0};const db=ITEM_DB.find(d=>d.effect==='heal');G.items=Array.from({length:35},(_,i)=>({id:db.id,uid:'dismiss-fixture-'+i,count:3}));if(kind==='skill')openSkillMenu();else openItemMenu();},outfit:()=>window.showAvatarChangeModal()};`});});
 await p.goto('http://127.0.0.1:5186/');await p.waitForFunction(()=>!!window.dismissQA&&!!window.raidLocalPreview);await p.evaluate(()=>window.raidLocalPreview.start());await p.locator('#ch-input').waitFor();
 for(const [w,h] of [[1366,900],[390,844],[375,667],[320,568],[844,390]]){
  await p.setViewportSize({width:w,height:h});
  for(const kind of ['skill','item']){
   await p.evaluate(kind=>window.dismissQA.open(kind),kind);const menu=p.locator('#battle-sub-menu');await menu.waitFor({state:'visible'});await p.waitForTimeout(80);assert.equal(await menu.locator('.window-dismiss-bar .battle-menu-back').count(),1);
   const box=await menu.boundingBox();assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=w+1&&box.y+box.height<=h+1,`${w}x${h} ${kind} stays in viewport`);
   assert.ok(await menu.evaluate(el=>el.scrollWidth<=el.clientWidth),`${kind} no horizontal overflow`);
   await menu.evaluate(el=>el.scrollTop=el.scrollHeight);const back=menu.locator('.battle-menu-back');const r=await back.boundingBox();assert.ok(r.y>=box.y&&r.y<box.y+80,'back stays in top left while scrolled');assert.ok(r.x<box.x+box.width/2);
   if(w===390||w===844)await p.screenshot({path:`/tmp/dismiss-${kind}-${w}.png`});
   await back.click();assert.ok(await menu.isHidden());await p.locator('#ch-input').waitFor({state:'visible'});
  }
 }
 await p.setViewportSize({width:390,height:844});await p.evaluate(()=>window.raidLocalPreview.exchangeFixture());const exchange=p.locator('.raid-exchange-panel');await exchange.waitFor();await p.waitForTimeout(80);assert.equal(await exchange.locator(':scope > .window-dismiss-bar [data-close]').count(),1);await exchange.evaluate(el=>el.scrollTop=el.scrollHeight);await exchange.locator('[data-close]').click();assert.equal(await p.locator('.raid-exchange-overlay').count(),0);
 await p.evaluate(()=>window.dismissQA.outfit());await p.locator('#avatar-change-modal').waitFor({state:'visible'});await p.waitForTimeout(80);const header=p.locator('.avatar-selector-header');assert.equal(await header.locator(':scope > :first-child').getAttribute('id'),'btn-avatar-change-close');await p.locator('#btn-avatar-change-close').click();assert.ok(await p.locator('#avatar-change-modal').isHidden());
 assert.deepEqual(errors,[]);console.log('PASS: 10 skills/35 items scroll, fixed top-left back accessible and returns to question, five viewports incl landscape/320px, exchange sticky close works, avatar close left, no exceptions');
}finally{await b.close();}
