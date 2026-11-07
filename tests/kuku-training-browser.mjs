import assert from 'node:assert/strict';
import {homedir} from 'node:os';
const {chromium}=await import(`${homedir()}/.codex/skills/develop-web-game/node_modules/playwright/index.mjs`);
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1366,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/game.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+`\nwindow.kukuQA={show(){document.getElementById('screen-raid-boss').classList.add('hidden');showSkills();},state:()=>JSON.parse(JSON.stringify(G)),learned:()=>kukuMastered(G),home:showHome};`});});
 await page.goto('http://127.0.0.1:5186/');await page.waitForFunction(()=>!!window.kukuQA&&!!window.raidLocalPreview);
 await page.evaluate(()=>{window.raidLocalPreview.exchangeFixture(true);});
 await page.locator('.raid-exchange-panel [data-close]').click();await page.evaluate(()=>window.kukuQA.show());
 await page.getByRole('button',{name:/師匠の九九道場/}).click();
 console.log('opened dojo');const dialog=page.locator('.kuku-training');await dialog.waitFor({state:'visible'});
 await dialog.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
 assert.equal(await dialog.locator('.kuku-lessons button:disabled').count(),8);
 await dialog.locator('.kuku-replay').click();await dialog.locator('#kuku-input').waitFor({state:'visible'});
 await dialog.locator('#kuku-input').fill('2');await dialog.locator('#kuku-input').press('Enter');assert.deepEqual(await page.evaluate(()=>window.kukuQA.learned()),[]);
 await dialog.locator('#kuku-input').fill('3');await dialog.locator('#kuku-input').press('Enter');assert.deepEqual(await page.evaluate(()=>window.kukuQA.learned()),[1]);
 await dialog.locator('.kuku-next').click();await dialog.locator('.kuku-replay').click();await dialog.locator('#kuku-input').waitFor({state:'visible'});assert.equal(await dialog.locator('.kuku-hit-chip').count(),2);
 await page.screenshot({path:'/tmp/kuku-training-desktop.png'});
 await dialog.locator('#kuku-input').fill('6');await dialog.locator('#kuku-input').press('Enter');await dialog.locator('.kuku-close').click();
 await page.reload();await page.waitForFunction(()=>!!window.kukuQA&&!!window.raidLocalPreview);await page.evaluate(()=>{window.raidLocalPreview.restoreFixture();window.kukuQA.show();});
 assert.deepEqual(await page.evaluate(()=>window.kukuQA.learned()),[1,2]);
 await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:/師匠の九九道場/}).click();assert.equal(await dialog.locator('.kuku-name').innerText(),'サザンガ！');
 await dialog.locator('.kuku-replay').click();await dialog.locator('#kuku-input').waitFor({state:'visible'});assert.equal(await dialog.locator('.kuku-hit-chip').count(),3);await page.screenshot({path:'/tmp/kuku-training-mobile.png'});
 assert.ok(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth));
 await dialog.locator('#kuku-input').fill('９');await dialog.locator('#kuku-input').press('Enter');assert.ok((await dialog.locator('#kuku-feedback').innerText()).includes('3 × 3 = 9'));
 await page.emulateMedia({reducedMotion:'reduce'});
 for(let n=4;n<=9;n++){await dialog.locator('.kuku-next').click();await dialog.locator('.kuku-replay').click();await dialog.locator('#kuku-input').waitFor({state:'visible'});assert.equal(await dialog.locator('.kuku-hit-chip').count(),n);await dialog.locator('#kuku-input').fill(String(n*3));await dialog.locator('#kuku-input').press('Enter');}
 assert.equal((await page.evaluate(()=>window.kukuQA.learned())).length,9);assert.ok((await dialog.locator('.kuku-progress').innerText()).includes('皆伝'));await page.screenshot({path:'/tmp/kuku-training-mastered.png'});
 await dialog.locator('.kuku-lessons button').first().click();await dialog.locator('.kuku-replay').click();await dialog.locator('.kuku-close').click();await page.waitForTimeout(500);assert.equal(await page.locator('.kuku-training').count(),0);
 await page.evaluate(()=>{window.raidLocalPreview.open();window.kukuQA.show();});assert.deepEqual(await page.evaluate(()=>window.kukuQA.learned()),[]);
 await page.getByRole('button',{name:/師匠の九九道場/}).click();await dialog.locator('.kuku-replay').click();await page.evaluate(()=>window.kukuQA.home());await page.waitForTimeout(400);assert.equal(await page.locator('.kuku-training').count(),0);
 assert.deepEqual(errors,[]);console.log('PASS: skill-screen entry, ordered progression, wrong/retry, 3x2/3x3 hits, keyboard/fullwidth input, save/reload, all9/reduced motion, separate save, close/navigation cleanup, desktop/mobile fit, no exceptions');
}finally{await browser.close();}
