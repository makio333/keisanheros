import {chromium} from '/Users/motoyamayuuki/.codex/skills/develop-web-game/node_modules/playwright/index.mjs';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const out='/private/tmp/legend-duplex-20261106';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});try{
const page=await browser.newPage({serviceWorkers:'block',viewport:{width:1000,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5181/print_review_20261106.html');await page.waitForFunction(()=>window.reviewReady);
const report=await page.evaluate(async()=>{
 const {JAPANESE_READING_QUESTS_V2:reading}=await import('/japanese_reading_quests_v2.js');const {getMathWordQuestsV2}=await import('/math_word_quests_v2.js');
 const {renderJapaneseReadingPrintV2}=await import('/japanese_reading_print_adapter_v2.js');const {renderMathWordSetPrintV2}=await import('/math_word_problem_print_adapter_v2.js');const {paginateWordProblemPrintV2}=await import('/word_problem_print_layout_v2.js');
 const {READING_VILLAGERS}=await import('/reading_villagers.js');
 const results=[],host=document.querySelector('#preview');
 const fixtures=[...reading.map(record=>({kind:'japanese',record})),...Array.from({length:6},(_,i)=>{const qs=getMathWordQuestsV2(i+1);return Array.from({length:qs.length/5},(_,j)=>({kind:'math',records:qs.slice(j*5,j*5+5)}));}).flat()];
 for(const f of fixtures)for(const mode of ['student','teacher']){
  host.innerHTML=f.kind==='japanese'?renderJapaneseReadingPrintV2(f.record,{mode}):renderMathWordSetPrintV2(f.records,{mode});const root=host.firstElementChild;
  try{await paginateWordProblemPrintV2(root);}catch(error){results.push({id:f.record?.id||f.records[0].id,mode,error:error.message});continue;}
  await Promise.all([...root.querySelectorAll('img')].map(img=>img.decode()));
  const pages=[...root.querySelectorAll('.wpp2-page')],counts=pages.map(p=>p.querySelectorAll('.wpp2-question').length);
  const original=f.kind==='japanese'?f.record.questions.map(q=>q.prompt):f.records.map(q=>`${q.story}\n${q.question}`);
  const portrait=pages[0].querySelector('.wpp2-quest-portrait'),expectedIndex=f.kind==='japanese'?reading.filter(q=>q.grade===f.record.grade).findIndex(q=>q.id===f.record.id):Math.floor(getMathWordQuestsV2(f.records[0].grade).findIndex(q=>q.id===f.records[0].id)/5);
  const portraitMatches=portrait?.alt===READING_VILLAGERS[expectedIndex%READING_VILLAGERS.length].name&&portrait.naturalWidth>0&&pages[1].querySelectorAll('.wpp2-quest-portrait').length===0;
  const noManagementCodes=!/\[(?:mwq-v2|jr-v2)-/.test(root.textContent);
  const same=JSON.stringify([...root.querySelectorAll('.wpp2-source-question')].map(p=>p.textContent))===JSON.stringify(original);
  results.push({id:f.record?.id||f.records[0].id,mode,counts,same,noManagementCodes,portraitMatches,orientation:f.kind==='japanese'?pages.every(p=>p.getBoundingClientRect().width>p.getBoundingClientRect().height&&getComputedStyle(p.querySelector('.wpp2-page-body')).writingMode==='vertical-rl'&&getComputedStyle(p.querySelector('header h1')).writingMode==='vertical-rl'&&getComputedStyle(p.querySelector('header h1')).textOrientation==='upright'&&p.querySelector('header').getBoundingClientRect().left>=p.querySelector('.wpp2-page-body').getBoundingClientRect().right):true,spaces:f.kind==='math'&&mode==='student'?pages.map(p=>[...p.querySelectorAll('.wpp2-work')].map(w=>({height:w.getBoundingClientRect().height*25.4/96,border:getComputedStyle(w).borderTopWidth,label:w.textContent.trim()}))):null,compact:root.dataset.compact,story:f.kind!=='japanese'||root.querySelector('.wpp2-story').dataset.raw===f.record.passage,answers:root.querySelectorAll('.wpp2-source-answer').length,headers:pages[0].querySelectorAll('.print-reward-icon-entry').length===3&&pages.every(p=>{const h=p.querySelector('header');return h.scrollHeight<=h.clientHeight+1&&h.scrollWidth<=h.clientWidth+1;})&&pages[0].querySelectorAll('.wpp2-reward').length===1&&pages[1].querySelectorAll('.wpp2-reward').length===0,overflow:pages.some(p=>{let b=p.querySelector('.wpp2-page-body');return b.scrollHeight>b.clientHeight+1||b.scrollWidth>b.clientWidth+1;})});
 }
 return results;
});
const bad=report.filter(r=>r.error||JSON.stringify(r.counts)!=='[2,3]'||!r.same||!r.noManagementCodes||!r.orientation||!r.portraitMatches||!r.story||!r.headers||r.overflow||r.spaces?.some(page=>page.some(w=>w.height<19.8||w.border!=='0px'||w.label)||Math.max(...page.map(w=>w.height))-Math.min(...page.map(w=>w.height))>.1)||r.answers!==(r.mode==='teacher'?5:0));console.log(JSON.stringify({cases:report.length,failures:bad,compactLevels:[...new Set(report.map(r=>r.compact))],calculationSpaceMm:report.flatMap(r=>r.spaces?.flatMap(p=>p.map(w=>w.height))||[]).reduce((r,n)=>({min:Math.min(r.min,n),max:Math.max(r.max,n)}),{min:999,max:0})}));assert.equal(bad.length,0);
for(const [kind,record,grade] of [['math','0',1],['japanese','jr-v2-g6-09',6]]){
 await page.goto(`http://127.0.0.1:5181/print_review_20261106.html?kind=${kind}&grade=${grade}&record=${record}`);await page.waitForFunction(()=>window.reviewReady);await page.pdf({path:`${out}/${kind}-front-back.pdf`,preferCSSPageSize:true,printBackground:true});const pdfInfo=execFileSync('pdfinfo',[`${out}/${kind}-front-back.pdf`],{encoding:'utf8'});assert.match(pdfInfo,/Pages:\s+2/);if(kind==='japanese')assert.match(pdfInfo,/Page size:\s+84[12]\.\d+ x 59[45]\.\d+/);for(let side=0;side<2;side++)await page.locator('.wpp2-page').nth(side).screenshot({path:`${out}/${kind}-${side?'back':'front'}.png`});
}
assert.deepEqual(errors,[]);console.log('PASS: full passages, five exact prompts, 2/3 split, front metadata, answer visibility, no overflow');
}finally{await browser.close();}
