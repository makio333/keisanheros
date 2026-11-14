import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {chromium} from '/Users/motoyamayuuki/.codex/skills/develop-web-game/node_modules/playwright/index.mjs';
import {kanaChoicePrintHtml} from '../kana_choice_print.js';
const output=process.env.PRINT_OUTPUT||'/private/tmp/kana-choice-print';await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome'});
try{const page=await browser.newPage();for(const count of [10,20,30]){
 const problems=Array.from({length:count},()=>({printChoices:['とうきょう','ときょう','とおきょう','とううきょう']}));
 await page.setContent(kanaChoicePrintHtml({problems,title:'ひらがなの問題',playerName:'確認',printId:1}));
 const path=`${output}/${count}.pdf`;await page.pdf({path,preferCSSPageSize:true});
 const info=execFileSync('pdfinfo',[path],{encoding:'utf8'});assert.equal(Number(info.match(/^Pages:\s+(\d+)/m)[1]),count/10,`${count} questions must not create blank overflow pages`);
 }console.log('PASS: 10/20/30 questions produce 1/2/3 PDF pages');}finally{await browser.close();}
