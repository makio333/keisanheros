import assert from 'node:assert/strict';
import {homedir} from 'node:os';
const {chromium}=await import(`${homedir()}/.codex/skills/develop-web-game/node_modules/playwright/index.mjs`);
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5186/');await page.waitForFunction(()=>!!window.raidLocalPreview);
 await page.locator('#btn-raid-challenge').click();
 assert.equal(await page.evaluate(()=>window.SM.beepCtx?.state),'running','the actual initial click unlocks the audio context before asynchronous combat');
 await page.evaluate(()=>{const sm=window.SM;window.iceMeter=sm.beepCtx.createAnalyser();window.iceMeter.fftSize=512;sm.getEffectGain().connect(window.iceMeter);window.icePeak=0;window.iceRaf=requestAnimationFrame(function sample(){const b=new Float32Array(512);window.iceMeter.getFloatTimeDomainData(b);window.icePeak=Math.max(window.icePeak,...b.map(Math.abs));window.iceRaf=requestAnimationFrame(sample);});});
 await page.locator('#btn-raid-use-yes').click();await page.locator('#ch-word.raid-ice-word').waitFor();await page.waitForTimeout(400);
 const peak=await page.evaluate(()=>window.icePeak);assert.ok(peak>.01,`ice effect must produce nonzero audio: ${peak}`);
 await page.evaluate(()=>{window.SM.setMuted(true);window.icePeak=0;window.raidLocalPreview.iceAgain();});await page.waitForTimeout(400);
 assert.equal(await page.evaluate(()=>window.icePeak),0,'mute remains silent');
 await page.evaluate(()=>cancelAnimationFrame(window.iceRaf));assert.deepEqual(errors,[]);
 console.log(`PASS: real click unlocks Web Audio, audible ice output peak=${peak.toFixed(4)}, mute silence, no browser exceptions`);
}finally{await browser.close();}
