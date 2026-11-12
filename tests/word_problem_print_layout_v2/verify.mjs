import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from '/Users/motoyamayuuki/.codex/skills/develop-web-game/node_modules/playwright/index.mjs';
import {renderWordProblemPrintV2} from '../../word_problem_print_layout_v2.js';
const base=resolve('.'),out=resolve('docs/word_problem_print_layout_v2/samples');await mkdir(out,{recursive:true});
const server=createServer(async(req,res)=>{try{const path=resolve(base,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!path.startsWith(base+'/'))throw Error();res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html'})[extname(path)]||'text/plain');res.end(await readFile(path));}catch{res.statusCode=404;res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,executablePath:process.env.WPP2_CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});const page=await browser.newPage();const evidence=[];
try{
 for(const [name,query] of [['math','subject=math'],['math-large-color','subject=math&grade=6&scale=1.5&color=1&long=1'],['japanese-vertical','subject=japanese&vertical=1&long=1'],['teacher','subject=math&teacher=1']]){
  await page.goto(`http://127.0.0.1:${server.address().port}/word_problem_print_layout_v2_preview.html?${query}`);await page.waitForFunction(()=>window.wpp2Ready||window.wpp2Error);assert.equal(await page.evaluate(()=>window.wpp2Error),undefined);
  const check=await page.evaluate(async()=>{const {fixture}=await import('/tests/word_problem_print_layout_v2/fixtures.js');const f=fixture(new URLSearchParams(location.search)),r=document.querySelector('.wpp2-root');return {pages:r.querySelectorAll('.wpp2-page').length,story:[...r.querySelectorAll('.wpp2-story .wpp2-text')].map(n=>n.textContent).join('')===f.story,questions:[...r.querySelectorAll('.wpp2-source-question')].every((n,i)=>n.textContent===f.questions[i].question),count:r.querySelectorAll('.wpp2-question').length,expected:f.questions.length,answers:r.querySelectorAll('.wpp2-source-answer').length,answersExact:[...r.querySelectorAll('.wpp2-source-answer')].every((n,i)=>n.textContent===f.questions[i].answer),overflow:[...r.querySelectorAll('.wpp2-page-body')].some(n=>n.scrollHeight>n.clientHeight+1||n.scrollWidth>n.clientWidth+1||[...n.querySelectorAll('.wpp2-text')].some(t=>t.scrollWidth>t.clientWidth+1))};});
  assert.ok(check.story);assert.ok(check.answersExact);assert.ok(check.questions);assert.equal(check.count,check.expected);assert.equal(check.overflow,false);assert.equal(check.answers,name==='teacher'?4:0);
  await page.pdf({path:resolve(out,name+'.pdf'),preferCSSPageSize:true,printBackground:true});
  for(let i=0;i<check.pages;i++)await page.locator('.wpp2-page').nth(i).screenshot({path:resolve(out,`${name}-${i+1}.png`)});
  evidence.push({name,...check});
 }
 for(const subject of ['math','japanese'])for(let grade=1;grade<=6;grade++)for(const scale of [1,1.5]){
  await page.goto(`http://127.0.0.1:${server.address().port}/word_problem_print_layout_v2_preview.html?subject=${subject}&grade=${grade}&scale=${scale}${subject==='japanese'?'&vertical=1':''}`);await page.waitForFunction(()=>window.wpp2Ready||window.wpp2Error);assert.equal(await page.evaluate(()=>window.wpp2Error),undefined);
 }
 const hostile=renderWordProblemPrintV2({story:'<script>bad()</script>',questions:[{question:'a + b − c',answer:'<secret>'}]});assert.ok(hostile.includes('&lt;script&gt;'));assert.ok(!hostile.includes('&lt;secret&gt;'));assert.ok(hostile.includes('a + b − c'));
 assert.throws(()=>renderWordProblemPrintV2({scale:0.5}),RangeError);
 await page.evaluate(async()=>{const {renderWordProblemPrintV2,paginateWordProblemPrintV2}=await import('/word_problem_print_layout_v2.js');document.querySelector('#preview').innerHTML=renderWordProblemPrintV2({questions:[{question:'非常に長い設問。'.repeat(1500),answer:'変更しない'}]});try{await paginateWordProblemPrintV2(document.querySelector('.wpp2-root'));window.oversize=false;}catch{window.oversize=document.querySelector('.wpp2-root').dataset.error==='oversize';}});assert.equal(await page.evaluate(()=>window.oversize),true);
 await writeFile(resolve(out,'verification.json'),JSON.stringify({cases:evidence,gradeScaleCases:24,security:true,oversizeBlocked:true},null,2));console.log(JSON.stringify(evidence));
}finally{await browser.close();server.close();}
