import assert from 'node:assert/strict';
import {homedir} from 'node:os';
import {mkdirSync} from 'node:fs';
const {chromium}=await import(`${homedir()}/.codex/skills/develop-web-game/node_modules/playwright/index.mjs`);
const browser=await chromium.launch({channel:'chrome',headless:true});
const out='/tmp/ancient-exp-toast-v2';mkdirSync(out,{recursive:true});
try {
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.BASE_URL || 'http://127.0.0.1:5277/ancient-exp-toast-v2-preview.html');
 await page.waitForFunction(()=>!!window.toastQA);
 assert.equal(await page.locator('#toast').getAttribute('hidden'),'');
 await page.evaluate(async()=>{
  const {createAncientExpToast}=await import('./ancient_exp_toast_v2.js');
  window.callbacks=[];window.testToast=createAncientExpToast({root:document.querySelector('#toast'),nameOf:()=>'<unsafe>装備',schedule:fn=>(callbacks.push(fn),callbacks.length),unschedule:()=>{}});
  window.fixture=(uid='a',amount=8,level=1,exp=8,next=30)=>({uid,id:'sword',amount,before:{level:1,exp:0,next:30},after:{level,exp,next}});
 });
 const result=await page.evaluate(()=>{
  const checks=[];const check=(v,s)=>{if(!v)throw Error(s);checks.push(s);};
  testToast.notify([fixture('a',0),fixture('a',-1),fixture('a',NaN)]);check(!testToast.snapshot().active,'zero ignored');
  const c=fixture();testToast.notify([c,fixture('b')]);check(testToast.snapshot().queue.length===1,'multi queue');
  c.after.exp=999;check(testToast.snapshot().active.after.exp===8,'caller immutable');
  const stale=callbacks[0];testToast.notify([fixture('a',12,1,20)]);check(testToast.snapshot().active.amount===20,'burst sum');
  stale();check(testToast.snapshot().active.uid==='a','stale timer safe');
  callbacks.at(-1)();check(testToast.snapshot().active.uid==='b','next equipment');
  testToast.cancel();check(document.querySelector('#toast').hidden&&!testToast.snapshot().queue.length,'cancel clears');
  callbacks.at(-1)();check(!testToast.snapshot().active,'cancel stale safe');
  testToast.notify([fixture('a',35,2,5,76)]);check(document.querySelector('#toast').textContent.includes('Lv1 → 2'),'level up');
  testToast.sceneChanged();check(!testToast.snapshot().active,'scene clears');
  testToast.notify([fixture('a',100,50,0,0)]);check(document.querySelector('#toast').textContent.includes('MAX'),'max');
  testToast.destroy();testToast.notify([fixture()]);check(!testToast.snapshot().active,'destroy stops');
  return checks;
 });
 console.log(result);
 await page.reload();await page.waitForFunction(()=>!!window.toastQA);
 for(const [width,height] of [[1280,900],[390,844],[320,568],[820,720]]) {
  await page.setViewportSize({width,height});await page.click('#multi');
  const layout=await page.evaluate(()=>{const t=document.querySelector('#toast'),r=t.getBoundingClientRect(),q=document.querySelector('.question').getBoundingClientRect();return {left:r.left,right:r.right,bottom:r.bottom,questionTop:q.top,scroll:document.documentElement.scrollWidth,client:innerWidth,pointer:getComputedStyle(t).pointerEvents};});
  assert.ok(layout.left>=0&&layout.right<=width);assert.ok(layout.bottom<=layout.questionTop);assert.ok(layout.scroll<=layout.client);assert.equal(layout.pointer,'none');
  await page.screenshot({path:`${out}/${width}.png`});
  await page.click('.answers button');await page.click('#cancel');assert.equal(await page.locator('#toast').getAttribute('hidden'),'');
 }
 await page.emulateMedia({reducedMotion:'reduce'});await page.click('#gain');assert.equal(await page.locator('#toast').evaluate(n=>getComputedStyle(n).animationName),'none');
 await page.waitForTimeout(3800);assert.equal(await page.locator('#toast').getAttribute('hidden'),'');
 assert.deepEqual(errors,[]);console.log('PASS browser, timers, queue, cancel, level/max, 4 sizes, reduced motion, auto hide; '+out);
} finally {await browser.close();}
