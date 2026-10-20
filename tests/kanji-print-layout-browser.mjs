import assert from 'node:assert/strict';
import {homedir,tmpdir} from 'node:os';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
const {chromium}=await import(`${homedir()}/.codex/skills/develop-web-game/node_modules/playwright/index.mjs`);
const out=path.join(tmpdir(),'keisanheros-kanji-print');mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const context=await browser.newContext({viewport:{width:794,height:1123}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/firebase_init.js*',r=>r.fulfill({contentType:'text/javascript',body:'window.CloudSave={saveSlot:async()=>{},listSlots:async()=>[],flush(){}};'}));
  await context.route('**/game.js*',async r=>{const response=await r.fetch();await r.fulfill({response,body:await response.text()+`
    const originalPrintChoice=showPrintChoiceModal,originalOpenPrintWindow=openPrintWindow;
    window.kanjiPrintQA={start(boss=false){G=newGameState('やまだ たろう','ai_hero_spellblade');currentSlotKey='qa-print';document.getElementById('boot-loader-screen')?.remove();openPrintWindow=html=>window.printedHtml=html;showPrintChoiceModal=variants=>{window.printVariants=variants;originalPrintChoice(variants);};boss?printAreaBoss('area6'):printAreaStage('area6',0,true);},select:i=>window.printVariants[i].onSelect(),html:()=>window.printedHtml,fixture:mode=>kanjiPrintSheetHtml([
      {text:'学校',answer:'がっこう'},{text:'元気',answer:'げんき'},{text:'心',answer:'こころ'},{text:'毎日',answer:'まいにち'},{text:'取り出す',answer:'とりだす'},
      {text:'図工室',answer:'ずこうしつ'},{text:'鳥',answer:'とり'},{text:'一万円',answer:'いちまんえん'},{text:'名前',answer:'なまえ'},{text:'弱い',answer:'よわい'}
    ],mode,'2年生の漢字 その1','やまだ たろう','123456'),math(boss=false,challenge=false,blueprint=false){
      this.start(false);
      openPrintWindow=(html,bg,landscape)=>{
        const previous=window.open;
        window.open=()=>({document:{open(){},write:full=>window.printedHtml=full,close(){}},focus(){},print(){}});
        try{originalOpenPrintWindow(html,bg,landscape);}finally{window.open=previous;}
      };
      boss?printAreaBoss('area2'):printAreaStage('area2',0,challenge,blueprint?{bp:{id:'bp_ancient'},uid:42}:null);
    }};`});});
  await page.goto(process.env.BASE_URL || 'http://127.0.0.1:5178/');await page.waitForFunction(()=>!!window.kanjiPrintQA);
  const sheet=await context.newPage();await sheet.emulateMedia({media:'print'});
  async function checkRewardStrip(){
    const conditions=await sheet.locator('.print-reward-text small').allTextContents();
    assert.ok(conditions.includes('5問以上正解') && conditions.includes('10問正解'));
    assert.equal(conditions.some(text=>text.includes('%')),false);
    assert.equal(await sheet.locator('.print-reward-icon').evaluateAll(icons=>icons.every(icon=>{
      const r=icon.getBoundingClientRect(),style=getComputedStyle(icon);
      return Math.abs(r.width-r.height)<1 && parseFloat(style.borderTopWidth)>0 && style.overflow==='hidden';
    })),true,'icons stay inside bordered squares');
    await sheet.locator('.print-rewards img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
    assert.ok(await sheet.locator('.print-reward').count()>=6);
    assert.equal(await sheet.locator('.print-reward img').evaluateAll(images=>images.every(image=>image.complete && image.naturalWidth>0)),true);
    assert.ok((await sheet.locator('.print-rewards').innerText()).includes('1問 20 EXP') || (await sheet.locator('.print-rewards').innerText()).includes('1問 60 EXP'));
    const bounds=await sheet.locator('.print-rewards').boundingBox();
    const title=await sheet.locator('.kp-title,.p-title').boundingBox();
    const name=await sheet.locator('.kp-meta,.p-name-box').boundingBox();
    assert.ok(bounds.y>=title.y+title.height-1 && bounds.y+bounds.height<=name.y+1,'reward icons are directly below title and before name');
    assert.equal(await sheet.locator('.print-reward').evaluateAll(els=>els.some(el=>el.getBoundingClientRect().right>el.closest('.print-rewards').getBoundingClientRect().right+1)),false);
  }
  for(const mode of ['yomi','kaki','mix']) {
    const html=await page.evaluate(mode=>window.kanjiPrintQA.fixture(mode),mode);
    await sheet.setContent(html);await sheet.evaluate(()=>document.fonts.ready);
    assert.equal(await sheet.locator('.kp-question').count(),10);
    assert.equal(await sheet.locator('.kp-band').count(),2);
    if(mode==='mix'){
      assert.equal(await sheet.locator('.kp-band').first().locator('.kp-question-yomi').count(),5);
      assert.equal(await sheet.locator('.kp-band').last().locator('.kp-question-kaki').count(),5);
    }
    assert.equal(await sheet.locator('.kp-mode').count(),0,'no repeated per-question instructions');
    assert.equal(await sheet.locator('.kp-sidebar,.kp-instruction').count(),0,'no right-side instruction column');
    assert.ok((await sheet.locator('.kp-header').textContent()).includes('やまだ たろう'));
    assert.ok((await sheet.locator('.kp-header').textContent()).includes('123456'));
    assert.ok((await sheet.locator('.kp-rewards').textContent()).includes('報酬'));
    await checkRewardStrip();
    assert.equal(await sheet.locator('.kp-target').first().textContent(),mode==='kaki'?'がっこう':'学校');
    assert.equal(await sheet.locator('.kp-context-before').first().textContent(),'むらの');
    assert.equal(await sheet.locator('.kp-context-after').first().textContent(),'で まほうを ならう。');
    assert.equal(await sheet.locator('.kp-answer').first().locator('.kp-cell').count(),mode==='kaki'?2:0);
    if(mode==='yomi'){
      assert.equal(await sheet.locator('.kp-cell').count(),0,'reading sheets have parentheses instead of cells');
      const prompt=await sheet.locator('.kp-prompt').first().boundingBox();
      const answer=await sheet.locator('.kp-reading-answer').first().boundingBox();
      assert.ok(answer.x>prompt.x,'reading parentheses sit to the right of the kanji');
      const space=await sheet.locator('.kp-reading-space').first().boundingBox();
      assert.ok(space.height>=40*96/25.4-1,'reading space is at least 40mm long');
    }
    if(mode==='kaki'){
      const cell=await sheet.locator('.kp-cell').first().boundingBox();
      assert.ok(cell.width>=18*96/25.4-1 && cell.height>=18*96/25.4-1,'short words use 18mm square cells');
      assert.equal(await sheet.locator('.kp-question').last().locator('.kp-cell').count(),1,'弱い has one kanji cell');
      assert.equal(await sheet.locator('.kp-question').last().locator('.kp-okurigana').count(),1,'okurigana goes in a separate parenthesis');
      assert.equal((await sheet.locator('.kp-okurigana').last().textContent()).replace(/\s/g,''),'（）','the suffix answer is not printed');
    }
    const boxes=await sheet.locator('.kp-question').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y};}));
    assert.ok(boxes[0].x>boxes[1].x && boxes[5].y>boxes[0].y,'questions run right to left in two bands');
    const overflow=await sheet.evaluate(()=>{
      const sheet=document.querySelector('.kp-sheet').getBoundingClientRect();
      return [...document.querySelectorAll('.kp-prompt,.kp-answer,.kp-footer,.kp-sidebar')].some(el=>{
        const r=el.getBoundingClientRect();return r.right>sheet.right+1 || r.bottom>sheet.bottom+1 || r.left<sheet.left-1;
      });
    });
    assert.equal(overflow,false);
    assert.equal(await sheet.locator('.kp-answer').evaluateAll(els=>els.some(el=>el.getBoundingClientRect().bottom>el.closest('.kp-band').getBoundingClientRect().bottom+1)),false,'large answer areas stay inside their own band');
    const misaligned=await sheet.locator('.kp-question').evaluateAll(els=>els.map(el=>{
      const target=el.querySelector('.kp-target').getBoundingClientRect();
      const answer=el.querySelector('.kp-answer').getBoundingClientRect();
      return Math.abs(target.top-answer.top);
    }));
    assert.ok(misaligned.every(distance=>distance<2),'answer fields begin at the target word, not an estimated prefix height');
    await sheet.screenshot({path:path.join(out,mode+'.png')});
  }
  for(const boss of [false,true]){
    await page.evaluate(boss=>window.kanjiPrintQA.start(boss),boss);
    const cards=page.locator('#print-choice-cards > div');
    const cardBoxes=await cards.evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y};}));
    assert.ok(cardBoxes.every(box=>Math.abs(box.y-cardBoxes[0].y)<1),'all three print choices share one row');
    assert.ok(cardBoxes[0].x<cardBoxes[1].x && cardBoxes[1].x<cardBoxes[2].x);
    for(const [index,label] of ['A 漢字の読み','B 書き取り','C ミックス'].entries()){
      assert.ok((await cards.nth(index).innerText()).includes(label));
      const problems=await page.evaluate(index=>window.printVariants[index].problems,index);
      assert.equal(new Set(problems.map(p=>p.text)).size,10,'no repeated kanji words');
      assert.equal(new Set(problems.map(p=>p.answer)).size,10,'no repeated readings');
      const expected=problems.map((p,i)=>index===1 || (index===2 && i>=5)?p.answer:p.text);
      const displayed=await cards.nth(index).locator('.kanji-print-preview-row u').allTextContents();
      assert.deepEqual(displayed,expected,'preview uses the prompt that will be printed');
    }
    await page.waitForTimeout(350);await page.screenshot({path:path.join(out,boss?'boss-choices.png':'stage-choices.png')});
    for(let i=0;i<3;i++){
      await page.evaluate(i=>window.kanjiPrintQA.select(i),i);
      await sheet.setContent(await page.evaluate(()=>window.kanjiPrintQA.html()));
      assert.equal(await sheet.locator('.kp-question').count(),10);
      if(i===2){
        assert.equal(await sheet.locator('.kp-band').first().locator('.kp-question-yomi').count(),5);
        assert.equal(await sheet.locator('.kp-band').last().locator('.kp-question-kaki').count(),5);
        await sheet.screenshot({path:path.join(out,boss?'boss-mix.png':'stage-mix.png')});
      }
      const header=await sheet.locator('.kp-header').textContent();
      assert.ok(header.includes('10問') && header.includes('やまだ たろう') && header.includes('エリア2年'));
      assert.ok((await sheet.locator('.kp-rewards').textContent()).includes(boss?'報酬':'8問以上正解'));
      await checkRewardStrip();
      if(i===1)await sheet.screenshot({path:path.join(out,boss?'boss-kaki.png':'stage-kaki.png')});
    }
  }
  for(const mode of ['normal','challenge','blueprint','boss']){
    await page.evaluate(mode=>window.kanjiPrintQA.math(mode==='boss',mode==='challenge',mode==='blueprint'),mode);
    await page.evaluate(()=>window.kanjiPrintQA.select(0));
    await sheet.setContent(await page.evaluate(()=>window.kanjiPrintQA.html()));
    await checkRewardStrip();
    assert.equal(await sheet.locator('.p-row').count(),10);
    assert.equal(await sheet.locator('.p-bonus-banner').count(),0);
    const rewards=await sheet.locator('.print-rewards').innerText();
    assert.equal(rewards.includes('装備ガチャ10連チケット'),mode==='challenge');
    assert.equal(rewards.includes('エンシェント装備'),mode==='blueprint');
    await sheet.screenshot({path:path.join(out,'math-'+mode+'.png')});
  }
  assert.deepEqual(errors,[]);console.log('PASS: stage/boss three print modes, A4 portrait bounds, two right-to-left bands, prompt/answer cells and no page errors. '+out);
}finally{await browser.close();}
