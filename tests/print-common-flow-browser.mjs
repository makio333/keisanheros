import {execFileSync} from 'node:child_process';
import {build} from 'vite';
import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {printFlowFixture} from './print-flow-fixture.mjs';
import assert from 'node:assert/strict';import {writeFile,mkdir} from 'node:fs/promises';
import {chromium,webkit} from '/Users/motoyamayuuki/.codex/skills/develop-web-game/node_modules/playwright/index.mjs';
import {createMediaTestServer} from './runtime-media-server.mjs';
const testRoot=fileURLToPath(new URL('../',import.meta.url)),fixtureDist=await mkdtemp(tmpdir()+'/legend-print-flow-');
if(!process.env.PRINT_QA_URL)await build({root:testRoot,configFile:false,base:'./',logLevel:'error',plugins:[{name:'print-flow-fixture',transform(code,id){if(id===testRoot+'game.js')return code+'\n'+printFlowFixture;}}],build:{target:"esnext",outDir:fixtureDist,emptyOutDir:true}});
const server=process.env.PRINT_QA_URL?{url:process.env.PRINT_QA_URL,stop:async()=>{}}:await createMediaTestServer({root:fixtureDist}),browser=await (process.env.ENGINE==='webkit'?webkit.launch():chromium.launch({channel:'chrome'}));const out=process.env.PRINT_OUTPUT||'/private/tmp/print-common-qa';await mkdir(out,{recursive:true});
try{const context=await browser.newContext();await context.addInitScript(()=>{window.print=()=>{window.printCalls=(window.printCalls||0)+1;};});const page=await context.newPage();await page.goto(server.url,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.layoutQA);await page.evaluate(()=>layoutQA.init());
for(const mode of ['stage','material','japanese','kanji','ancient','legacyPrint']){
 const direct=['material','japanese','legacyPrint'].includes(mode);const pending=page.waitForEvent('popup');await page.evaluate(mode=>mode==='material'?layoutQA.print():layoutQA[mode](),mode);if(!direct){await page.locator('#modal-print-choice').waitFor({state:'visible'});await page.locator('#print-choice-cards button').first().click();}const popup=await pending;if(direct)assert(!(await page.locator('#modal-print-choice').isVisible()),'Subquest opens directly without set selection');await popup.waitForFunction(()=>document.querySelector('#game-print-now')?.disabled===false);
 assert.equal(await popup.evaluate(()=>window.printCalls||0),0,'Preview must not print automatically');
 let html=await popup.content();html=html.replaceAll(server.url,'http://127.0.0.1:5198/');await writeFile(`${out}/${mode}.html`,html);
 await popup.screenshot({path:`${out}/${mode}.png`});await popup.emulateMedia({media:'print'});
 const geometry=await popup.locator(mode==='stage'?'.game-print-page':mode==='kanji'||mode==='ancient'?'.sp-page':'.wpp2-page').evaluateAll(es=>es.map(e=>({h:e.getBoundingClientRect().height,w:e.getBoundingClientRect().width,overflow:e.scrollHeight-e.clientHeight})));console.log(mode,geometry);assert(geometry.length>0);assert(geometry.every(e=>e.h<1062&&e.overflow<=2));if(mode==='ancient'){assert.equal(await page.evaluate(()=>window.qaConsumed||0),0);}
 if(process.env.ENGINE!=='webkit'){const path=`${out}/${mode}.pdf`;await popup.pdf({path,preferCSSPageSize:true});const info=execFileSync('pdfinfo',[path],{encoding:'utf8'});assert.equal(Number(info.match(/^Pages:\s+(\d+)/m)[1]),{stage:1,material:2,japanese:2,kanji:1,ancient:3,legacyPrint:2}[mode],mode+' has no blank printed pages');}
 await popup.locator('#game-print-now').evaluate(e=>e.click());assert.equal(await popup.evaluate(()=>window.printCalls),1);if(mode==='ancient'){assert.equal(await page.evaluate(()=>window.qaConsumed),1);await popup.locator('#game-print-now').evaluate(e=>e.click());assert.equal(await page.evaluate(()=>window.qaConsumed),1);}if(direct){await popup.emulateMedia({media:'screen'});await popup.locator('select[aria-label="プリントの種類"]').selectOption('teacher');await popup.waitForFunction(()=>document.querySelector('select')?.disabled===false&&document.querySelector('[data-mode=teacher]'));assert(await popup.locator('.wpp2-source-answer').count()>0,'Teacher answers remain available in the same preview');}await popup.close();
}console.log('PASS shared choice, preview, manual print and sheet bounds');}finally{await browser.close();await server.stop();}
