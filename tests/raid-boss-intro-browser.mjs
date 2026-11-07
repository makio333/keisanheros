import assert from 'node:assert/strict';
import { homedir } from 'node:os';
import { mkdir } from 'node:fs/promises';
const {chromium}=await import(`${homedir()}/.codex/skills/develop-web-game/node_modules/playwright/index.mjs`);
const previewBase=process.env.RAID_INTRO_BASE_URL||'http://127.0.0.1:5193';
const browser=await chromium.launch({channel:'chrome',headless:true});
await mkdir('output/raid-boss-intro',{recursive:true});
try {
const page=await browser.newPage(); const errors=[]; const requests=[];
page.on('pageerror',e=>errors.push(e.message)); page.on('request',r=>requests.push(r.url()));
for(const [name,width,height] of [['desktop',1280,800],['portrait',390,844],['landscape',844,390]]) {
 await page.setViewportSize({width,height}); await page.goto(`${previewBase}/raid_boss_intro_preview.html`);
 await page.click('#start-btn'); await page.waitForTimeout(1400);
 assert.equal(await page.locator('.wisp').count(),6);
 assert.equal(await page.locator('h1').last().textContent(),'月影の幽霊王');
 for(const sel of ['.copy','button']) {const box=await page.locator('[data-raid-boss-intro]').locator(sel).boundingBox();assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1,`${name} ${sel} within viewport`);}
 await page.screenshot({path:`output/raid-boss-intro/${name}.png`});
 await page.locator('[data-raid-boss-intro] button').click();assert.equal(await page.locator('[data-raid-boss-intro]').count(),0);
}
await page.emulateMedia({reducedMotion:'reduce'});
await page.evaluate(()=>{window.calls=0;window.a=introPreview.intro.play(introPreview.fixture,{onComplete:()=>window.calls++});window.b=introPreview.intro.play(introPreview.fixture);});
assert.ok(await page.evaluate(()=>a===b));assert.equal(await page.locator('.art').evaluate(e=>getComputedStyle(e).animationName),'none');assert.equal(await page.locator('.wisp').first().evaluate(e=>getComputedStyle(e).animationName),'none');
await page.locator('[data-raid-boss-intro] button').click();assert.equal(await page.evaluate(()=>calls),1);
await page.evaluate(()=>{window.abort=new AbortController();window.result=introPreview.intro.play(introPreview.fixture,{signal:abort.signal,onComplete:()=>calls++});abort.abort();});
assert.equal(await page.evaluate(async()=>(await result).status),'cancelled');assert.equal(await page.evaluate(()=>calls),1);
await page.evaluate(()=>{window.result=introPreview.intro.play(introPreview.fixture);document.querySelector('[data-raid-boss-intro]').remove();});
assert.equal(await page.evaluate(async()=>(await result).status),'cancelled');
await page.route('**/missing-intro-fixture.png',r=>r.fulfill({status:404,body:''}));
await page.evaluate(()=>{window.result=introPreview.start({...introPreview.fixture,image:'missing-intro-fixture.png'});});
await page.waitForTimeout(200);assert.ok(await page.locator('.fallback').isVisible());
assert.equal(await page.evaluate(async()=>(await result).status),'completed');
assert.equal(await page.locator('[data-raid-boss-intro]').count(),0);
assert.ok(!requests.some(url=>/firebase|googleapis|api\/|firestore/.test(url)));
assert.deepEqual(errors,[]);console.log('PASS: 3 viewports, duplicate promise, skip once, abort, detached host, reduced motion, failed image auto-completion, no game/cloud requests, no page errors');
}finally{await browser.close();}
