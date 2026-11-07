import assert from 'node:assert/strict';
import {homedir} from 'node:os';
import {mkdirSync} from 'node:fs';
const {chromium}=await import(`${homedir()}/.codex/skills/develop-web-game/node_modules/playwright/index.mjs`);
const out='/tmp/ghost-raid-content';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1366,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 await page.goto('http://127.0.0.1:5186/');await page.waitForFunction(()=>!!window.raidLocalPreview);
 await page.evaluate(()=>window.raidLocalPreview.start());await page.locator('#ch-word.raid-ice-word').waitFor();
 const problem=await page.evaluate(()=>window.raidLocalPreview.state().battle.problem.problem);
 await page.waitForTimeout(450);await page.screenshot({path:`${out}/ice-question-desktop.png`});
 await page.locator('#ch-input').fill(String(problem.answer));assert.equal(await page.locator('#ch-word').innerText(),'？','typing must not melt or erase the unknown');
 await page.evaluate(()=>window.raidLocalPreview.iceAgain());
 for(let n=0;n<3;n++){
  const old=await page.locator('#ch-word').elementHandle();
  await page.evaluate(()=>window.raidLocalPreview.iceAgain());
  assert.equal(await page.evaluate(old=>old.isConnected,old),false,'each identical question gets a fresh animation element');
  const css=await page.locator('#ch-word').evaluate(el=>({name:getComputedStyle(el,'::before').animationName,time:el.getAnimations().map(a=>a.currentTime)}));
  assert.equal(css.name,'raid-frost-spread');assert.ok(css.time.some(t=>t<350));
 }
 await page.evaluate(()=>document.querySelector('#ch-word').getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=85;}));
 await page.screenshot({path:`${out}/ice-arrival-desktop.png`});
 await page.evaluate(()=>document.querySelector('#ch-word').getAnimations({subtree:true}).forEach(a=>a.currentTime=185));
 await page.screenshot({path:`${out}/ice-impact-desktop.png`});
 await page.evaluate(()=>document.querySelector('#ch-word').getAnimations({subtree:true}).forEach(a=>a.play()));
 await page.locator('#ch-input').fill(String(problem.answer));await page.locator('#ch-input').press('Enter');
 await page.locator('#ch-word.is-shattered').waitFor();
 assert.equal(await page.locator('#ch-word').innerText(),String(problem.answer));
 await page.screenshot({path:`${out}/ice-answer-desktop.png`});
 await page.evaluate(()=>window.raidLocalPreview.iceAgain());await page.setViewportSize({width:390,height:844});
 await page.waitForTimeout(450);await page.screenshot({path:`${out}/ice-question-mobile.png`});
 assert.ok(await page.locator('#ch-input').isVisible());assert.ok(await page.locator('#ch-submit').isEnabled());
 await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>window.raidLocalPreview.iceAgain());
 assert.equal(await page.locator('#ch-word').evaluate(el=>getComputedStyle(el,'::before').animationName),'none');
 await page.locator('#ch-input').fill(String(problem.answer));await page.locator('#ch-submit').click();
 assert.equal(await page.locator('#ch-word').evaluate(el=>getComputedStyle(el,'::before').opacity),'0');
 await page.evaluate(()=>window.raidLocalPreview.open());await page.waitForTimeout(650);
 assert.equal(await page.locator('#ch-word').count(),0,'leaving destroys the old question');
 assert.equal((await page.evaluate(()=>window.raidLocalPreview.state())).battle,null);
 assert.deepEqual(errors,[]);console.log('PASS: every-question frost including same problem, input/Enter/touch, correct-answer shatter, fresh DOM, mobile/reduced-motion and navigation cleanup');
}finally{await browser.close();}
