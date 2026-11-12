import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from '/Users/motoyamayuuki/.codex/skills/develop-web-game/node_modules/playwright/index.mjs';
const out='/private/tmp/christmas-check';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const context=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block',reducedMotion:'reduce'});
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());if(url.hostname!=='127.0.0.1')return route.fulfill({status:200,body:''});
  if(url.pathname==='/game.js'){
   const res=await route.fetch();return route.fulfill({response:res,body:await res.text()+`\nwindow.christmasQA={setup(){G=newGameState('クリスマス確認用','ai_hero_spellblade');currentSlotKey='fixture-christmas';G.player.lvl=50;G.player.gold=50000;G.skinGachaTickets=30;G.equipGachaTenPullTickets=2;save=()=>{};SM.play=()=>{};document.getElementById('boot-loader-screen')?.remove();showHome();},state:()=>JSON.parse(JSON.stringify(G)),normal:getSkinGachaPrizes,prizes:getChristmasSkinGachaPrizes,ownNormal(){for(const p of getSkinGachaPrizes()){if(p.kind==='character')G.unlockedSkins.push(p.id);if(p.kind==='holo-character')(G.holographicSkins??=[]).push(p.id);if(p.kind==='background')G.unlockedAvatarBackgrounds.push(p.id);if(p.kind==='holo-background')(G.holographicAvatarBackgrounds??=[]).push(p.id);}showGacha('christmas-skins');},empty(){G.player.gold=0;G.skinGachaTickets=0;G.equipGachaTenPullTickets=0;showGacha('christmas-items');},equip(){let i=0;const old=Math.random;Math.random=()=>[.5,0,.99][i++]??.5;try{doChristmasEquipGacha(1,150);}finally{Math.random=old;}},normalEquipment(){return Array.from({length:1000},()=>gachaEquipPick(3).id);},backgrounds:()=>getSelectableAvatarBackgrounds(),selector:showAvatarChangeModal,abilities(){return CHRISTMAS_EQUIP_DB.map(e=>[e.id,eventEquipmentAbility(e.id)]);},preview:openSkinGachaPreview};`});
  }return route.continue();
 });
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5174/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.christmasQA);await page.evaluate(()=>christmasQA.setup());
 assert.equal(await page.locator('#screen-home').evaluate(e=>e.classList.contains('active')),true);
 await page.waitForFunction(()=>{const image=document.querySelector('#town-map > .town-map-img');return image.complete && image.naturalWidth>0;});
 assert.ok((await page.locator('#town-map > .town-map-img').getAttribute('src')).includes('v=20261109-christmas'));
 await page.screenshot({path:out+'/home-desktop.png'});
 await page.setViewportSize({width:390,height:844});assert.ok((await page.locator('#town-map').evaluate(e=>getComputedStyle(e).backgroundImage)).includes('christmas/town'));await page.screenshot({path:out+'/home-mobile.png'});
 await page.locator('#hotspot-gacha').click();await page.locator('#btn-gacha-tab-christmas-skins').click();
 assert.equal(await page.locator('#christmas-skin-gacha-section').isVisible(),true);
 assert.equal((await page.evaluate(()=>christmasQA.prizes().filter(p=>p.rewardSource==='christmas'||p.source==='christmas'))).length,23);
 assert.equal((await page.evaluate(()=>christmasQA.normal().some(p=>p.id.startsWith('christmas_')))),false);
 await page.screenshot({path:out+'/skins-mobile.png'});
 await page.evaluate(()=>christmasQA.preview('decoration','christmas_holly_star'));assert.ok((await page.locator('#skin-gacha-preview-image').getAttribute('src')).includes('christmas_holly_star'));assert.equal(await page.locator('#skin-gacha-preview-modal .avatar-decoration').count(),0);await page.locator('#btn-skin-gacha-preview-close').click();
 await page.evaluate(()=>christmasQA.preview('character','christmas_santa_helper'));assert.ok((await page.locator('#skin-gacha-preview-image').getAttribute('src')).includes('skin_santa_helper'));await page.locator('#btn-skin-gacha-preview-close').click();
 await page.evaluate(()=>christmasQA.preview('background','christmas_santa_workshop'));assert.ok((await page.locator('#skin-gacha-preview-image').getAttribute('src')).includes('background_santa_workshop'));await page.locator('#btn-skin-gacha-preview-close').click();
 await page.evaluate(()=>christmasQA.ownNormal());
 for(let i=0;i<23;i++){
  await page.locator('#btn-christmas-skin-gacha-ticket').click();
  await page.locator('.skin-gacha-reveal [data-action="equip"]').waitFor();
  const picture=page.locator('.skin-gacha-result-art > img');assert.ok((await picture.getAttribute('src')).includes('christmas/'));
  await page.locator('.skin-gacha-reveal [data-action="equip"]').click();
  await page.locator('#hotspot-gacha').click();
 }
 assert.equal(await page.locator('#btn-christmas-skin-gacha-ticket').isEnabled(),false);
 const state=await page.evaluate(()=>christmasQA.state());assert.equal(state.skinGachaTickets,7);assert.equal(state.player.gold,50000);assert.ok(state.unlockedDecorations.includes('christmas_holly_star'));assert.equal(new Set(state.unlockedSkins.filter(id=>id.startsWith('christmas_'))).size,7);assert.equal(new Set(state.unlockedAvatarBackgrounds.filter(id=>id.startsWith('christmas_'))).size,4);
 assert.equal((await page.evaluate(()=>christmasQA.backgrounds())).filter(p=>p.rewardSource==='christmas').length,4);
 await page.locator('#btn-gacha-tab-christmas-items').click();assert.equal(await page.locator('#christmas-equipment-gacha-featured button').count(),6);await page.screenshot({path:out+'/equipment-mobile.png'});
 await page.evaluate(()=>christmasQA.equip());await page.locator('#btn-gacha-reveal-close').waitFor({timeout:15000});await page.locator('#btn-gacha-reveal-close').click();
 const after=await page.evaluate(()=>christmasQA.state());assert.equal(after.player.gold,49850);assert.equal(after.ownedEquips.at(-1).id,'christmas_winter_star_charm');assert.equal(after.ownedEquips.at(-1).ability,'mp_save');
 assert.ok((await page.evaluate(()=>christmasQA.normalEquipment())).every(id=>!id.startsWith('christmas_')));
 assert.ok((await page.evaluate(()=>christmasQA.abilities())).every(([id,ability])=>ability));
 await page.setViewportSize({width:1280,height:900});await page.screenshot({path:out+'/equipment-desktop.png'});await page.locator('#btn-gacha-tab-christmas-skins').click();await page.screenshot({path:out+'/skins-desktop.png'});
 await page.evaluate(()=>christmasQA.empty());assert.equal(await page.locator('#btn-christmas-gacha-1').isEnabled(),false);assert.equal(await page.locator('#btn-christmas-gacha-ticket').isEnabled(),false);
 assert.deepEqual(errors,[]);console.log('PASS: desktop/mobile Christmas home, both gacha pages, 23 unique cosmetic unlocks including holograms and frame, equipment cost/ability, exhausted pools, normal pool isolation; '+out);
}finally{await browser.close();}
