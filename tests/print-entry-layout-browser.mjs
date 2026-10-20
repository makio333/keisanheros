import assert from 'node:assert/strict';
import {homedir,tmpdir} from 'node:os';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
const {chromium}=await import(`${homedir()}/.codex/skills/develop-web-game/node_modules/playwright/index.mjs`);
const out=path.join(tmpdir(),'keisanheros-print-entry');mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const context=await browser.newContext(),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await context.route('**/firebase_init.js*',r=>r.fulfill({contentType:'text/javascript',body:'window.CloudSave={saveSlot:async()=>{},listSlots:async()=>[],flush(){}};'}));
  await context.route('**/game.js*',async r=>{
    const response=await r.fetch();await r.fulfill({response,body:await response.text()+`
      window.printEntryQA={start(kanji=false,count=10){
        G=newGameState('確認用','ai_hero_spellblade');currentSlotKey='qa-entry';
        document.getElementById('boot-loader-screen')?.remove();
        const problems=Array.from({length:count},(_,i)=>kanji?{text:['取り出す','学校','仲間','魔法使い','宝箱'][i%5],answer:'たからばこ'}:{text:i%2?'12 × 8':'6 + 10',answer:i%2?96:16});
        G.activePrints={'1234':{areaId:kanji?'area5':'area1',stageIndex:0,type:'stage',name:'チャレンジプリント（経験値・G・消耗品3倍／80%以上で装備10連券）',problems}};
        requestAdminAccess=callback=>callback();
        window.qaPayouts=[];grantPrintRewards=(cur,correct,total)=>window.qaPayouts.push({correct,total});
        openUnifiedCodeEntry();selectUnifiedPrint('1234');
      },cases(problems){this.start(false,problems.length);G.activePrints['1234'].problems=problems;fetchUnifiedPrint();},ownedShop(){
        document.getElementById('modal-unified-code').classList.add('hidden');
        G.ownedEquips.push({uid:G.nextUid++,id:EQUIP_DB[0].id,rarity:1,ability:null});showWeaponShop();
      }};`});
  });
  await page.goto(process.env.BASE_URL || 'http://127.0.0.1:5178/');
  await page.waitForFunction(()=>!!window.printEntryQA);
  async function assertFits(){
    const overflow=await page.evaluate(()=>{
      const panel=document.querySelector('.unified-code-panel'),list=document.getElementById('unified-problems-list');
      const rect=panel.getBoundingClientRect();
      const bad=[panel,list,document.getElementById('modal-unified-code')].filter(el=>el.scrollHeight>el.clientHeight+2 || el.scrollWidth>el.clientWidth+2).map(el=>`${el.id||el.className}: ${el.clientWidth}x${el.clientHeight} / ${el.scrollWidth}x${el.scrollHeight} at ${innerWidth}x${innerHeight}`);
      for(const el of panel.querySelectorAll('input,.unified-prob-expression,#unified-grade-btn-area button,#admin-grade-btn-area button')){
        if(!el.getClientRects().length)continue;
        const r=el.getBoundingClientRect();
        if(r.left<rect.left || r.right>rect.right || r.top<rect.top || r.bottom>rect.bottom)bad.push(el.id||el.className);
      }
      return bad;
    });
    if(overflow.length)await page.screenshot({path:path.join(out,'overflow.png')});
    assert.deepEqual(overflow,[],'no scrolling or controls outside the dialog');
  }
  for(const [width,height] of [[1280,900],[846,827],[390,844],[375,667],[844,390]]){
    await page.setViewportSize({width,height});
    for(const kanji of [false,true]){
      await page.evaluate(kanji=>window.printEntryQA.start(kanji),kanji);
      await assertFits();
      assert.equal(await page.locator('#unified-problems-list input.challenge-input').count(),10);
      await page.screenshot({path:path.join(out,`${width}x${height}-${kanji?'kanji':'math'}.png`)});
      await page.evaluate(()=>openAdminGrade());
      await assertFits();
      assert.equal(await page.locator('.admin-grade-chk').count(),10);
    }
  }
  for(const [width,height] of [[1280,900],[390,844],[375,667]]){
    await page.setViewportSize({width,height});
    await page.evaluate(()=>window.printEntryQA.start(false,20));
    await assertFits();
    assert.equal(await page.locator('#unified-problems-list input.challenge-input').count(),20);
  }
  await page.setViewportSize({width:1280,height:900});
  await page.evaluate(()=>window.printEntryQA.start());
  await page.locator('#unified-ans-0').fill('16');
  await page.locator('#unified-ans-0').press('Enter');
  assert.equal(await page.locator('#unified-ans-1').evaluate(el=>document.activeElement===el),true);
  await page.evaluate(()=>window.unifiedCurrentPrint.meta.problems.forEach((p,i)=>document.getElementById('unified-ans-'+i).value=p.answer));
  await page.locator('#unified-grade-btn-area button').first().click();
  await page.waitForTimeout(120);
  const countingScore=Number(await page.locator('.print-score-value strong').textContent());
  assert.ok(countingScore>0 && countingScore<100,'score visibly counts up before reaching its final value');
  await page.waitForSelector('.print-score-overlay.is-revealed');
  assert.equal(await page.locator('.print-score-value strong').textContent(),'100');
  assert.equal(await page.locator('.print-score-stamp').textContent(),'満点');
  assert.equal(await page.evaluate(()=>window.qaPayouts.length),0,'score is shown before reward delivery');
  await page.evaluate(()=>gradeUnifiedPrint());
  assert.equal(await page.locator('.print-score-overlay').count(),1,'repeated grading cannot duplicate the score dialog');
  await page.screenshot({path:path.join(out,'score-perfect.png')});
  await page.locator('.print-score-continue').click();
  await page.waitForFunction(()=>window.qaPayouts.length===1);
  assert.deepEqual(await page.evaluate(()=>window.qaPayouts[0]),{correct:10,total:10});
  await page.evaluate(()=>window.printEntryQA.start(true));
  await page.evaluate(()=>openAdminGrade());
  await page.locator('#admin-grade-btn-area button').first().click();
  assert.equal(await page.locator('.admin-grade-chk:checked').count(),10);
  await page.locator('#admin-grade-btn-area button').last().click();
  await page.waitForSelector('.print-score-overlay.is-revealed');
  assert.equal(await page.locator('.print-score-value strong').textContent(),'100');
  await page.locator('.print-score-continue').click();
  assert.deepEqual(await page.evaluate(()=>window.qaPayouts[0]),{correct:10,total:10});
  for(const [width,height,count,correct] of [[375,667,10,8],[844,390,20,20],[390,844,10,0]]){
    await page.setViewportSize({width,height});
    await page.emulateMedia({reducedMotion:correct===0?'reduce':'no-preference'});
    await page.evaluate(({count,correct})=>{
      window.printEntryQA.start(false,count);
      window.unifiedCurrentPrint.meta.problems.forEach((p,i)=>document.getElementById('unified-ans-'+i).value=i<correct?p.answer:'');
      gradeUnifiedPrint();
    },{count,correct});
    await page.waitForSelector('.print-score-overlay.is-revealed');
    assert.equal(await page.locator('.print-score-value strong').textContent(),String(Math.round(correct/count*100)));
    assert.equal(await page.locator('.print-score-stamp').count(),correct===count?1:0);
    assert.equal(await page.locator('.print-score-confetti').count(),correct/count>=.8?1:0);
    const bounds=await page.locator('.print-score-panel').boundingBox();
    assert.ok(bounds.x>=0 && bounds.y>=0 && bounds.x+bounds.width<=width+1 && bounds.y+bounds.height<=height+1,'score dialog fits small and landscape screens');
    await page.screenshot({path:path.join(out,`score-${correct}-${count}.png`)});
    await page.locator('.print-score-continue').click();
    assert.deepEqual(await page.evaluate(()=>window.qaPayouts[0]),{correct,total:count});
  }
  assert.deepEqual(errors,[]);
  await page.setViewportSize({width:1280,height:900});
  await page.evaluate(()=>window.printEntryQA.cases([
    {text:'7 ÷ 2',answer:3,remainder:1},{text:'4 : 4 をかんたんに',op:'かんたん',answer:'2:2'},
    {text:'12',answer:12},{text:'12',answer:12},{text:'日',answer:'ひ'},{text:'6 と 10 の平均',answer:8}
  ]));
  assert.equal(await page.locator('#unified-ans-0').getAttribute('inputmode'),'numeric');
  assert.equal(await page.locator('#unified-rem-0').getAttribute('inputmode'),'numeric');
  for(const [i,value] of ['3','1:1','1+2','1x2','にち','8'].entries())await page.locator('#unified-ans-'+i).fill(value);
  await page.locator('#unified-rem-0').fill('1');
  await page.locator('#unified-grade-btn-area button').first().click();
  await page.waitForSelector('.print-score-overlay.is-revealed');
  assert.equal(await page.locator('.print-score-value strong').textContent(),'67');
  await page.locator('.print-score-continue').click();
  assert.deepEqual(await page.evaluate(()=>window.qaPayouts[0]),{correct:4,total:6});
  await page.evaluate(()=>window.printEntryQA.ownedShop());
  await page.locator('#weapon-shop-list .shop-icon').first().click();
  assert.ok((await page.locator('.confirm-overlay').innerText()).includes('所持済みの装備'));
  assert.deepEqual(errors,[]);
  console.log('PASS: ten-question math/kanji answer and parent grading layouts fit desktop, tablet, mobile and landscape without scrolling; keyboard and grading work. '+out);
}finally{await browser.close();}
