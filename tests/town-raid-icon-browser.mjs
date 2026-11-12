import assert from 'node:assert/strict';
import {homedir} from 'node:os';
const {chromium}=await import(`${homedir()}/.codex/skills/develop-web-game/node_modules/playwright/index.mjs`);
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1366,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5186/');await page.waitForFunction(()=>!!window.raidLocalPreview);
 await page.locator('#screen-raid-boss .window-close-btn').click();
 await page.locator('#hotspot-raid-boss img').evaluate(img=>img.decode());
 assert.ok(await page.locator('#hotspot-raid-boss img').isVisible());
 await page.evaluate(()=>{Date.now=()=>Date.parse('2026-10-31T23:59:59+09:00');document.getElementById('btn-status-back').click();});
 assert.ok(await page.locator('#hotspot-halloween').isVisible());
 await page.evaluate(()=>{Date.now=()=>Date.parse('2026-11-01T00:00:00+09:00');document.getElementById('btn-status-back').click();});
 assert.ok(await page.locator('#hotspot-halloween').isHidden());assert.ok(await page.locator('#btn-gacha-tab-halloween').isHidden());
 await page.screenshot({path:'/tmp/ghost-raid-content/november-town-desktop.png'});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/ghost-raid-content/november-town-mobile.png'});
 assert.ok(await page.locator('#hotspot-raid-boss img').isVisible());assert.deepEqual(errors,[]);
 console.log('PASS: ghost icon on desktop/mobile, Halloween visible before and hidden at November1 JST, no browser exceptions');
}finally{await browser.close();}
