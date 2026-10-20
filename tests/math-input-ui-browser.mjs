import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {homedir,tmpdir} from 'node:os';
import path from 'node:path';
const {chromium}=await import(`${homedir()}/.codex/skills/develop-web-game/node_modules/playwright/index.mjs`);
const out=path.join(tmpdir(),'legend-math-input-ui');mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const report={battle:[],rejected:[],training:[],print:[],errors:[],limits:['Chromium desktop/mobile emulation; physical iOS keyboard not tested.','Generator arithmetic is audited independently in upper-math-oracle; this suite tests input/layout.','Battle controls may use the existing vertical page scroll; print controls are checked within the viewport.']};
try{
  const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage();
  await page.emulateMedia({reducedMotion:'reduce'});page.on('pageerror',e=>report.errors.push(e.message));
  await context.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(!['127.0.0.1','localhost'].includes(url.hostname))return route.fulfill({status:200,body:''});
    if(url.pathname==='/firebase_init.js')return route.fulfill({contentType:'text/javascript',body:'window.CloudSave={fetchAllSlots:async()=>[],saveSlot:async()=>false,flush(){}};'});
    if(url.pathname==='/game.js'){
      const response=await route.fetch();return route.fulfill({response,body:await response.text()+`
        let mathInputOwner=0;window.mathInputQA={
          cases(){const cases=[];for(const id of ['area1','area13','area2','area3','area4','area11','area12']){
            const area=AREA_STAGES[id];area.stages.forEach((stage,i)=>cases.push({area:id,stage:i,name:stage.name,problem:stage.generateProblem()}));
            for(const phase of [1,2])cases.push({area:id,name:'boss'+phase,problem:area['bossPhase'+phase+'Problem']()});
          }return cases;},
          battle(problem,screen='battle'){const owner=++mathInputOwner;G=newGameState('入力確認','ai_hero_spellblade');document.getElementById('boot-loader-screen')?.remove();document.getElementById('title-white-fade')?.remove();
            document.getElementById('modal-unified-code').classList.add('hidden');document.querySelector('.print-score-overlay')?.remove();showScreen('screen-'+screen);window.mathInputResult=null;
            startChallenge($(screen+'-challenge'),{problem,timeLimit:60000,showBattleCommands:screen==='battle',isActive:()=>mathInputOwner===owner,onAnswered:(_time,success)=>window.mathInputResult=success},()=>{});},
          print(problems){++mathInputOwner;destroyChallenge();G=newGameState('入力確認','ai_hero_spellblade');currentSlotKey='qa-input';
            document.querySelector('.print-score-overlay')?.remove();showScreen('screen-title');G.activePrints={'1111':{type:'stage',name:'入力確認',areaId:'area1',stageIndex:0,problems}};
            grantPrintRewards=()=>{};openUnifiedCodeEntry();selectUnifiedPrint('1111');},
          unprotected(){document.getElementById('modal-unified-code').classList.add('hidden');document.querySelector('.print-score-overlay')?.remove();showScreen('screen-battle');window.staleMathCallbacks=0;
            startChallenge($('battle-challenge'),{problem:{text:'1 + 1',answer:2},onAnswered:(_time,success)=>window.mathInputResult=success},()=>window.staleMathCallbacks++);}
        };`});
    }
    return route.continue();
  });
  await page.goto(process.env.BASE_URL||'http://127.0.0.1:5178/');await page.waitForFunction(()=>!!window.mathInputQA);
  const cases=await page.evaluate(()=>window.mathInputQA.cases());
  cases.push({area:'boundary',name:'remainder-zero',problem:{text:'8 ÷ 2',answer:4,remainder:0}},
    {area:'boundary',name:'reduced-fraction',problem:{text:'1/4 + 1/4',answer:'2/4'},parts:['1','2']},
    {area:'boundary',name:'decimal-half',problem:{text:'7 と 8 の平均',op:'平均',answer:7.5}},
    {area:'boundary',name:'negative',problem:{text:'1 - 3',answer:-2}});
  for(const [stage,unit] of [[2,'km'],[3,'cm²']]){
    const entry=cases.find(entry=>entry.area==='area12' && entry.stage===stage);
    cases.push({...entry,name:entry.name+'（単位付き入力）',printInput:String(entry.problem.answer)+unit});
  }
  async function typeBattle(value,portrait){
    if(portrait){
      assert.equal(await page.locator('#ch-input').evaluate(el=>el.readOnly),true);
      for(const key of String(value))await page.locator(`.portrait-calc-pad [data-key="${key}"]`).click();
    }else await page.locator('#ch-input').fill(String(value));
  }
  async function fits(selectors,label,allowVerticalScroll=false){
    const bad=await page.evaluate(({selectors,allowVerticalScroll})=>selectors.flatMap(selector=>[...document.querySelectorAll(selector)]).filter(el=>el.getClientRects().length).filter(el=>{const r=el.getBoundingClientRect();return r.left<-.5 || r.right>innerWidth+.5 || !allowVerticalScroll && (r.top<-.5 || r.bottom>innerHeight+.5);}).map(el=>({id:el.id,class:el.className,rect:el.getBoundingClientRect().toJSON()})),{selectors,allowVerticalScroll});
    if(bad.length)await page.screenshot({path:path.join(out,'overflow.png')});
    assert.deepEqual(bad,[],label);
  }
  for(const [width,height] of [[1280,900],[390,844]]){
    await page.setViewportSize({width,height});const portrait=width<height;
    for(const entry of cases){
      const p=entry.problem,parts=entry.parts||(p.remainder!=null?[String(p.answer),String(p.remainder)]:typeof p.answer==='string' && /[/:]/.test(p.answer)?p.answer.split(/[/:]/):[String(p.answer)]);
      await page.evaluate(p=>window.mathInputQA.battle(p),p);
      assert.equal(await page.locator('#ch-input').count(),1,'old finished input is removed before a new challenge');
      if(parts.length===2){
        assert.equal(await page.locator('#ch-word [data-slot]').count(),2);
        await typeBattle(parts[0],portrait);await page.locator('#ch-submit').click();
        assert.equal(await page.locator('#ch-input').inputValue(),'');
        await page.locator('#ch-word [data-slot="0"]').click();assert.equal(await page.locator('#ch-input').inputValue(),parts[0]);
        await page.locator('#ch-word [data-slot="1"]').click();await typeBattle(parts[1],portrait);
      }else await typeBattle(parts[0],portrait);
      await fits(['#ch-submit','#ch-input','#ch-word','.portrait-calc-pad button'],`${entry.area}/${entry.name} battle controls fit ${width}`,true);
      if(['remainder-zero','decimal-half'].includes(entry.name) || entry.area==='area12' && ['比の値','円の面積（π=3.14）'].includes(entry.name)){
        await page.locator('#ch-word').scrollIntoViewIfNeeded();
        await page.evaluate(()=>Promise.all(document.getAnimations().filter(a=>Number.isFinite(a.effect.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{}))));
        await page.screenshot({path:path.join(out,`battle-${entry.area}-${entry.stage??entry.name}-${width}.png`)});
      }
      await page.locator('#ch-submit').click();assert.equal(await page.evaluate(()=>window.mathInputResult),true,`${entry.area}/${entry.name}: ${parts}`);
      report.battle.push({area:entry.area,name:entry.name,width,parts,success:true});
    }
    for(const [problem,parts] of [[{text:'7 ÷ 2',answer:3,remainder:1},['3','0']],[{text:'1/4 + 1/4',answer:'2/4'},['1','0']],[{text:'4 : 4 をかんたんに',op:'かんたん',answer:'1:1'},['2','2']]]){
      await page.evaluate(p=>window.mathInputQA.battle(p),problem);await typeBattle(parts[0],portrait);await page.locator('#ch-submit').click();await typeBattle(parts[1],portrait);await page.locator('#ch-submit').click();
      assert.equal(await page.evaluate(()=>window.mathInputResult),false);report.rejected.push({width,text:problem.text,parts});
    }
    await page.evaluate(()=>window.mathInputQA.battle({text:'7 ÷ 2',answer:3,remainder:1}));
    await typeBattle('3',portrait);await page.locator('#ch-submit').click();await page.locator('#ch-submit').click();
    assert.equal(await page.evaluate(()=>window.mathInputResult),null,'empty remainder cannot submit a quotient-only answer');
    assert.equal(await page.locator('#ch-input').isEnabled(),true);await typeBattle('1',portrait);await page.locator('#ch-submit').click();assert.equal(await page.evaluate(()=>window.mathInputResult),true);
    for(const p of [{text:'7 ÷ 2',answer:3,remainder:1},{text:'7 と 8 の平均',answer:7.5}]){
      await page.evaluate(p=>window.mathInputQA.battle(p,'training'),p);
      await typeBattle(String(p.answer),portrait);if(p.remainder!=null){await page.locator('#ch-submit').click();await typeBattle(String(p.remainder),portrait);}
      await fits(['#ch-submit','#ch-input','.portrait-calc-pad button'],'training input remains reachable',true);
      await page.locator('#ch-submit').click();assert.equal(await page.evaluate(()=>window.mathInputResult),true);report.training.push({width,text:p.text});
    }
    for(let start=0;start<cases.length;start+=10){
      const batch=cases.slice(start,start+10);await page.evaluate(problems=>window.mathInputQA.print(problems),batch.map(entry=>entry.problem));
      for(const [i,entry] of batch.entries()){
        const p=entry.problem;await page.locator('#unified-ans-'+i).fill(entry.printInput||String(p.answer));
        if(p.remainder!=null){
          assert.equal(await page.locator('#unified-rem-'+i).count(),1);await page.locator('#unified-ans-'+i).press('Enter');
          assert.equal(await page.locator('#unified-rem-'+i).evaluate(el=>document.activeElement===el),true);
          await page.locator('#unified-rem-'+i).fill(String(p.remainder));
          assert.equal(await page.locator('#unified-ans-'+i).inputValue(),String(p.answer));
        }
      }
      await fits(['#unified-problems-list input','#unified-grade-btn-area button'],`print fields fit ${width}`);
      if(batch.some(entry=>entry.problem.remainder!=null))await page.screenshot({path:path.join(out,`print-remainder-${width}.png`)});
      await page.locator('#unified-grade-btn-area button').first().click();await page.locator('.print-score-overlay.is-revealed').waitFor();
      assert.equal(await page.locator('.print-score-value strong').textContent(),'100');
      report.print.push({width,cases:batch.map(({area,name})=>({area,name})),score:100});
    }
    await page.evaluate(()=>window.mathInputQA.print([{text:'7 ÷ 2',answer:3,remainder:1},{text:'7 ÷ 2',answer:3,remainder:1},{text:'100 の 10%',op:'の',answer:10},{text:'半径2cmの円の面積（cm²、円周率3.14）',op:'面積',answer:12.56}]));
    await page.locator('#unified-ans-0').fill('3');await page.locator('#unified-ans-1').fill('3');await page.locator('#unified-rem-1').fill('0');
    await page.locator('#unified-ans-2').fill('10%');await page.locator('#unified-ans-3').fill('12.56cm');
    await page.locator('#unified-grade-btn-area button').first().click();await page.locator('.print-score-overlay.is-revealed').waitFor();assert.equal(await page.locator('.print-score-value strong').textContent(),'0','missing/wrong remainders and wrong units fail');
  }
  await page.setViewportSize({width:1280,height:900});await page.evaluate(()=>window.mathInputQA.unprotected());
  await page.locator('#ch-input').fill('2');await page.locator('#ch-submit').click();
  await page.evaluate(()=>window.mathInputQA.battle({text:'1 + 2',answer:3},'training'));await page.waitForTimeout(500);
  assert.equal(await page.evaluate(()=>window.staleMathCallbacks),0,'leaving a finished challenge cancels its delayed callback even without an isActive guard');
  assert.deepEqual(report.errors,[]);writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
  console.log(`PASS: ${report.battle.length} actual battle inputs and ${report.print.reduce((n,b)=>n+b.cases.length,0)} print inputs across all math stages/bosses; dedicated quotient/remainder, fractions, ratios, decimals and units. ${out}`);
}finally{await browser.close();}
