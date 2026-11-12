import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from '/Users/motoyamayuuki/.codex/skills/develop-web-game/node_modules/playwright/index.mjs';
const browser=await chromium.launch({channel:'chrome',headless:true});const out='/private/tmp/town-season-icons';await mkdir(out,{recursive:true});
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.fulfill({status:200,body:''}));
 await page.goto('http://127.0.0.1:5195/?v=town-icons1',{waitUntil:'domcontentloaded'});await page.locator('.christmas-hub').waitFor();await page.evaluate(()=>christmasStageLocalPreview.stop());
 const keys=['training','synthesis','gacha','status','item-shop','weapon-shop','quest-board'];
 for(const size of [{width:1280,height:900},{width:390,height:844},{width:844,height:390},{width:390,height:667},{width:1280,height:900}]){
  await page.setViewportSize(size);
  const state=await page.locator('#town-map').evaluate(n=>({src:n.querySelector('.town-map-img').src,background:getComputedStyle(n).backgroundImage,mobile:n.style.getPropertyValue('--mobile-home-background')}));
  assert.match(state.src,/christmas_home_town.png/);assert.match(state.mobile,/christmas_home_town.png/);
  if(size.width<=820)assert.match(state.background,/christmas_home_town.png/);
  for(const key of keys){const icon=page.locator(`#hotspot-${key} .town-service-icon`);await icon.waitFor({state:'visible'});assert.match(await icon.evaluate(n=>getComputedStyle(n).backgroundImage),/town-navigation-v1.png/);assert.doesNotMatch(await page.locator(`#hotspot-${key}`).innerText(),/[🏹🌀🎰🏠🧪⚔📋]/u);}
  await page.screenshot({path:`${out}/home-${size.width}x${size.height}.png`});
 }
 // A HUD refresh must not restore the non-seasonal portrait backdrop.
 await page.locator('#hotspot-item-shop').click();await page.locator('#btn-item-shop-back').click();assert.equal(await page.locator('#town-map').getAttribute('data-mobile-background'),'christmas');
 await page.evaluate(()=>{latestQA.state().isTestMode=false;latestQA.state().avatarBackground='default';christmasStageLocalPreview.stop();});
 assert.equal(await page.locator('#town-map').getAttribute('data-mobile-background'),'default');
 assert.match(await page.locator('#town-map .town-map-img').getAttribute('src'),/home_town_v2.png/);
 assert.deepEqual(errors,[]);console.log('PASS: seasonal backdrop survives rotation and HUD refresh; seven generated facility icons present; normal backdrop restores outside event');
}finally{await browser.close();}
