import {homedir} from 'node:os';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
const project=process.argv[2];if(!project)throw Error('Unity project required');
const folder=path.join(project,'Temp/LegendHeroesQA');
const {chromium}=await import(homedir()+'/.codex/skills/develop-web-game/node_modules/playwright/index.mjs');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function native(js){const requestId=randomUUID(),file=path.join(folder,'web-'+requestId+'.json');await writeFile(path.join(folder,'editor-command.json'),JSON.stringify({action:'web-eval',value:js,requestId}));for(let i=0;i<200;i++){try{const result=JSON.parse(await readFile(file));if(result.error)throw Error(result.error);return typeof result.result==='string'?JSON.parse(result.result):result.result;}catch(e){if(e.code!=='ENOENT')throw e;}await wait(100);}throw Error('Unity timeout');}
const fixture=await readFile('unity-port/Tests/web-parity-fixture.js','utf8');
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const size=await native('JSON.stringify([innerWidth,innerHeight])');
 const context=await browser.newContext({viewport:{width:size[0],height:size[1]},serviceWorkers:'block'});
 await context.route('**/firebase_init.js*',r=>r.fulfill({contentType:'text/javascript',body:'window.CloudSave={saveSlot:async()=>{},listSlots:async()=>[],flush(){}};window.EventRaidAPI={getRankings:async()=>[]};window.AdminGiftAPI={fetchPending:async()=>[]};'}));
 await context.route('**/game.js*',async r=>{const original=await r.fetch();await r.fulfill({response:original,body:await original.text()+'\n'+fixture});});
 await context.route('https://cdn.jsdelivr.net/npm/chart.js',async r=>r.fulfill({contentType:'text/javascript',body:await readFile('unity-port/Native/chart.umd.js')}));
 await context.route('https://firestore.googleapis.com/**',r=>r.abort());
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5174/');await page.waitForFunction(()=>!!window.__lhQA);
 if(process.argv.includes('--fonts')){
  await page.evaluate(()=>__lhQA.setup());
  const cdp=await context.newCDPSession(page);await cdp.send('DOM.enable');await cdp.send('CSS.enable');const {root}=await cdp.send('DOM.getDocument');
  for(const selector of ['.hotspot-tag','#hotspot-adventure .hotspot-tag','#hotspot-halloween','.btn']){const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:root.nodeId,selector});console.log('FONTS',selector,JSON.stringify(await cdp.send('CSS.getPlatformFontsForNode',{nodeId})));}
 }
 const stationary='(()=>{if(!document.getElementById("qa-static-layout")){let s=document.createElement("style");s.id="qa-static-layout";s.textContent="*,*::before,*::after{animation:none!important;transition:none!important}";document.head.append(s)}})();';
 await native(stationary+'JSON.stringify(true)');await page.evaluate(stationary);
 const report=[];
 for(const view of ['home','adventure','stages','room','weapon','item','frames','gacha','synthesis','skills']){
  const setup='__lhQA.setup();__lhQA['+JSON.stringify(view)+']();';
  await native(setup+'JSON.stringify(true)');await page.evaluate(setup);await wait(250);
  const actual=await native('JSON.stringify(__lhQA.metrics())'),expected=await page.evaluate(()=>__lhQA.metrics());
  const expectedById=new Map(expected.buttons.filter(b=>b.id).map(b=>[b.id,b]));
  const deltas=[];let compared=0;
  for(const button of actual.buttons){if(!button.id||!expectedById.has(button.id))continue;const e=expectedById.get(button.id);compared++;for(const key of ['x','y','width','height'])if(Math.abs(button[key]-e[key])>2)deltas.push({id:button.id,key,unity:button[key],web:e[key]});}
  report.push({view,viewport:size,compared,deltas});
  if(deltas.length)console.log('DIFFERENCE',view,JSON.stringify(deltas));else console.log('PASS layout:',view,compared,'matching named controls');
 }
 await writeFile(path.join(folder,'web-layout-comparison.json'),JSON.stringify({source:'unchanged Vite Web edition',host:'actual Unity/WebKit',toleranceCssPixels:2,report,errors},null,2));
 if(errors.length||report.some(r=>r.deltas.length))process.exitCode=1;
}finally{await browser.close();}
