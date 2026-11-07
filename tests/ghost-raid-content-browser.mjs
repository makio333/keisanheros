import assert from 'node:assert/strict';
import {homedir} from 'node:os';
import {mkdirSync} from 'node:fs';
import {GHOST_RAID_PRIZES,GHOST_RAID_FRAME,GHOST_RAID_DEFEAT_DECORATION,GHOST_RAID_EQUIPMENT} from '../ghost_raid_content.js';
const {chromium}=await import(`${homedir()}/.codex/skills/develop-web-game/node_modules/playwright/index.mjs`);
const out='/tmp/ghost-raid-content';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1366,height:900}}),errors=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.route('**/*',route=>{const u=new URL(route.request().url());if(!['127.0.0.1','localhost'].includes(u.hostname)){external.push(u.href);return route.abort();}return route.continue();});
 await page.goto('http://127.0.0.1:5186/');await page.waitForFunction(()=>!!window.raidLocalPreview);
 await page.evaluate(()=>window.raidLocalPreview.exchangeFixture(true));
 await page.locator('.raid-exchange-panel').waitFor({state:'visible'});
 assert.equal(await page.locator('#raid-challenge-rewards').innerText(),'');
 for(const item of GHOST_RAID_PRIZES)await page.locator(`[data-raid-prize="${item.id}"]`).waitFor();
 assert.equal(await page.locator('[data-raid-prize]').count(),12);
 for(const id of ['raid_magma','raid_star_blade','raid_ward_armor','raid_focus_charm','raid_star_guardian','raid_observatory','raid_starlight'])assert.equal(await page.locator(`[data-raid-prize="${id}"]`).count(),0);
 for(const name of ['レア','激レア','超激レア'])assert.ok((await page.locator('.raid-exchange-panel').innerText()).includes(name));
 await page.screenshot({path:`${out}/exchange-three-rarities.png`});
 await page.waitForTimeout(400);await page.screenshot({path:`${out}/exchange-desktop.png`});
 for(const prize of GHOST_RAID_PRIZES){
  await page.locator(`[data-raid-prize="${prize.id}"]`).click();await page.locator('#btn-confirm-yes').click();
  await page.locator(`[data-raid-prize="${prize.id}"]`).waitFor();assert.ok(await page.locator(`[data-raid-prize="${prize.id}"]`).isDisabled());
 }
 const bought=await page.evaluate(()=>window.raidLocalPreview.snapshot());assert.equal(bought.raidCoins,740);assert.equal(bought.ownedEquips.filter(e=>e.id.startsWith('raid_moon_')).length,9);
 await page.locator('.raid-exchange-panel [data-close]').click();
 await page.locator('#screen-raid-boss .window-close-btn').click();
 for(const item of GHOST_RAID_EQUIPMENT){
  await page.evaluate(id=>window.raidLocalPreview.equip(id),item.id);
  const text=await page.locator('#training-challenge .challenge-problem').innerText();
  const m=text.match(/(\d+)\s*\+\s*(\d+)/);assert.ok(m,text);
  await page.locator('#ch-input').fill(String(Number(m[1])+Number(m[2])));await page.locator('#ch-submit').click();
  await page.waitForFunction(slot=>!!window.raidLocalPreview.snapshot().equipment[slot],item.slot);
  await page.waitForTimeout(600);
 }
 await page.evaluate(()=>window.raidLocalPreview.outfit());
 await page.locator('#avatar-change-list button').filter({hasText:'月守りの祓魔師'}).first().click();
 await page.locator('#btn-avatar-tab-backgrounds').click();
 await page.locator('#avatar-background-list button').filter({hasText:'月影の幽宮'}).first().click();
 await page.locator('#btn-avatar-tab-frames').click();
 await page.locator('#avatar-frame-list button').filter({hasText:'月影と鬼火のフレーム'}).first().click();
 await page.screenshot({path:`${out}/outfit-desktop.png`});
 await page.locator('#btn-avatar-preview-apply').click();await page.locator('#btn-avatar-confirm-apply').click();
 // Old saves omitted the inventory version. Preserve previously earned raid cosmetics.
 await page.evaluate((markId)=>{const fixture=window.raidLocalPreview.snapshot();delete fixture.skinInventoryVersion;fixture.unlockedSkins.push('raid_star_guardian');fixture.unlockedAvatarBackgrounds.push('raid_magma','raid_observatory');fixture.unlockedDecorations=[...new Set([...(fixture.unlockedDecorations||[]),markId])];localStorage.setItem('typing_rpg_save_v3::ghost_exchange_fixture',JSON.stringify(fixture));},GHOST_RAID_DEFEAT_DECORATION.id);
 await page.reload();await page.waitForFunction(()=>!!window.raidLocalPreview);await page.evaluate(()=>window.raidLocalPreview.restoreFixture());
 const loaded=await page.evaluate(()=>window.raidLocalPreview.snapshot());assert.equal(loaded.raidCoins,740);assert.equal(loaded.avatar,'raid_moon_exorcist');assert.equal(loaded.avatarBackground,'raid_moon_court');assert.equal(loaded.avatarDecoration,'raid_moon_frame');
 assert.ok(loaded.unlockedSkins.includes('raid_star_guardian'));assert.ok(loaded.unlockedAvatarBackgrounds.includes('raid_magma'));assert.ok(loaded.unlockedAvatarBackgrounds.includes('raid_observatory'));assert.equal(loaded.skinInventoryVersion,1);
 assert.ok(loaded.unlockedDecorations.includes(GHOST_RAID_FRAME.id),'old exchange frame remains owned');assert.ok(loaded.unlockedDecorations.includes(GHOST_RAID_DEFEAT_DECORATION.id),'separate participation mark survives save reload');
 for(const item of GHOST_RAID_EQUIPMENT)assert.equal(loaded.ownedEquips.find(e=>e.uid===loaded.equipment[item.slot].uid).id,item.id);
 await page.screenshot({path:`${out}/restored-home.png`});
 await page.evaluate(()=>window.raidLocalPreview.outfit());await page.setViewportSize({width:390,height:844});
 await page.locator('#btn-avatar-tab-frames').click();
 const defeatMark=page.locator('#avatar-frame-list button').filter({hasText:GHOST_RAID_DEFEAT_DECORATION.name}).first();await defeatMark.click();
 const markPreview=page.locator('.avatar-selector-preview .avatar-decoration');await markPreview.waitFor();await markPreview.evaluate(img=>img.decode());assert.ok(new URL(await markPreview.getAttribute('src'),page.url()).pathname.endsWith('/'+GHOST_RAID_DEFEAT_DECORATION.image));
 await page.locator('#btn-avatar-preview-apply').click();await page.locator('#btn-avatar-confirm-apply').click();await page.screenshot({path:`${out}/outfit-participation-mark-mobile.png`});
 await page.setViewportSize({width:1366,height:1000});
 await page.evaluate(async()=>{
  const source=document.querySelector('.avatar-selector-preview');
  const sheet=document.createElement('section');sheet.style.cssText='position:fixed;inset:0;z-index:9999999;background:#151421;color:white;padding:24px;overflow:auto';
  const title=document.createElement('h2');title.textContent='フレーム合成 48px / 88px / 220px';sheet.append(title);
  for(const path of ['assets/raid/spirit_guardian.png','assets/characters/hero_female_1_hd.png','assets/characters/ai_hero_spellblade_transparent.png']){
   const row=document.createElement('div');row.style.cssText='display:flex;gap:24px;align-items:end;margin:14px';
   for(const size of [48,88,220]){const stage=source.cloneNode(true);stage.className='avatar-composite-stage';stage.removeAttribute('id');stage.style.cssText='position:relative;overflow:hidden;width:'+size+'px!important;height:'+size+'px!important;min-width:0!important;min-height:0!important;max-width:none;flex:none;aspect-ratio:1';stage.querySelector('.avatar-composite-character').src=path;stage.querySelectorAll('.avatar-selector-preview-label').forEach(e=>e.remove());row.append(stage);}sheet.append(row);
  }
  const row=document.createElement('div');row.style.cssText='position:absolute;left:520px;top:100px;display:flex;gap:18px;flex-wrap:wrap;width:700px';
  for(const name of ['moon_blade','moon_mantle','moon_charm'])for(const size of [48,88]){const img=document.createElement('img');img.src='assets/raid/'+name+'.png';img.style.cssText='width:'+size+'px;height:'+size+'px;object-fit:contain;image-rendering:pixelated';row.append(img);}sheet.append(row);document.body.append(sheet);
  await Promise.all([...sheet.querySelectorAll('img')].map(img=>img.decode().catch(()=>{})));
 });
 await page.screenshot({path:`${out}/artwork-size-qa.png`});
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 console.log('PASS: twelve exchanges/nine rarity equipment, old prizes hidden, debits/owned protection, actual equipment training, outfit selection and reload persistence, PC/mobile, no browser errors/external requests');
}finally{await browser.close();}
