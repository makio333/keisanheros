import assert from 'node:assert/strict';
import {homedir} from 'node:os';
import {mkdir} from 'node:fs/promises';
const {chromium}=await import(`${homedir()}/.codex/skills/develop-web-game/node_modules/playwright/index.mjs`);
const previewBase=process.env.DAMAGE_FLOAT_BASE_URL||'http://127.0.0.1:5197';
const browser=await chromium.launch({channel:'chrome',headless:true});
await mkdir('output/damage-float-queue-v2',{recursive:true});
try{
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
for(const [name,width,height] of [['desktop',1280,800],['mobile',390,844],['landscape',844,390]]){
 await page.setViewportSize({width,height});await page.goto(`${previewBase}/damage_float_queue_v2_preview.html`);
 await page.evaluate(()=>{damagePreview.start(5);advanceTime(550);});
 assert.equal((await page.evaluate(()=>damagePreview.q.snapshot())).visible.length,5);
 const boxes=await page.locator('.dfq-v2-number').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,text:el.textContent,scroll:el.scrollWidth};}));
 for(const b of boxes){assert.ok(b.x>=0&&b.y>=0&&b.x+b.w<=width&&b.y+b.h<=height,`${name} bounds ${JSON.stringify(b)}`);assert.ok(b.scroll<=b.w+1,'full value fits');}
 for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++)assert.ok(boxes[i].y>=boxes[j].y+boxes[j].h||boxes[j].y>=boxes[i].y+boxes[i].h,'no vertical overlap');
 assert.ok(boxes[0].y<boxes[4].y,'oldest above newest');await page.screenshot({path:`output/damage-float-queue-v2/${name}.png`});
 await page.evaluate(()=>advanceTime(1600));assert.equal(await page.locator('.dfq-v2-number').count(),0);
}
await page.emulateMedia({reducedMotion:'reduce'});
await page.evaluate(()=>{damagePreview.start(3);advanceTime(280);damagePreview.q.enqueue(damagePreview.player,'-85','heal');});
assert.equal(await page.locator('.dfq-v2-number').count(),4);assert.equal(await page.locator('[data-kind=heal]').textContent(),'-85');
await page.screenshot({path:'output/damage-float-queue-v2/reduced-simultaneous.png'});
await page.evaluate(()=>{damagePreview.q.clear();for(let i=0;i<1000;i++)damagePreview.q.enqueue(damagePreview.enemy,i);});
assert.ok((await page.evaluate(()=>damagePreview.q.snapshot())).pending<=64);
await page.evaluate(()=>{for(let i=0;i<100;i++)advanceTime(120);});
assert.equal((await page.evaluate(()=>damagePreview.q.snapshot())).pending,0);
await page.evaluate(()=>{damagePreview.q.enqueue(damagePreview.enemy,123);damagePreview.enemy.remove();advanceTime(16);});assert.equal((await page.evaluate(()=>damagePreview.q.snapshot())).lanes,0);
await page.evaluate(()=>damagePreview.q.destroy());assert.equal(await page.locator('.dfq-v2').count(),0);
assert.equal(await page.evaluate(()=>damagePreview.q.enqueue(damagePreview.player,1)),false);
await page.evaluate(async()=>{const {createDamageFloatQueueV2}=await import('./damage_float_queue_v2.js');const abort=new AbortController();const q=createDamageFloatQueueV2({manual:true,signal:abort.signal});q.enqueue(damagePreview.player,9);abort.abort();if(!q.snapshot().destroyed)throw Error('abort cleanup');const q2=createDamageFloatQueueV2({manual:true});q2.enqueue(damagePreview.player,'1'.repeat(256));q2.enqueue(damagePreview.player,'+42','heal');q2.clear();q2.advance(2000);if(q2.snapshot().visible.length||q2.snapshot().pending)throw Error('skip clear');q2.destroy();});
assert.deepEqual(errors,[]);console.log('PASS: 5-hit ordering/no overlap/full huge values at 3 sizes; reduced simultaneous healing; bounded 1000 hits; drain, detach, destroy; no JS errors');
}finally{await browser.close();}
