import assert from 'node:assert/strict';
import {homedir,tmpdir} from 'node:os';
import {mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
const {chromium}=await import(`${homedir()}/.codex/skills/develop-web-game/node_modules/playwright/index.mjs`);
const out=path.join(tmpdir(),'keisanheros-release-player');mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const report={screens:[],grading:[],errors:[],externalRequests:[],limits:['Cloud APIs mocked; no production saves or purchases.','Desktop/mobile Chromium only, not physical Safari.','Shop browsing/back paths only; no real payment or full raid completion.']};
try{
  const context=await browser.newContext(),page=await context.newPage();
  page.on('pageerror',error=>report.errors.push(error.message));
  await context.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(!['127.0.0.1','localhost'].includes(url.hostname)){
      report.externalRequests.push(url.origin+url.pathname);
      return route.fulfill({status:200,contentType:'text/javascript',body:''});
    }
    if(url.pathname==='/firebase_init.js')return route.fulfill({contentType:'text/javascript',body:'window.CloudSave={saveSlot:async()=>{},listSlots:async()=>[],flush(){}};'});
    if(url.pathname==='/game.js'){
      const response=await route.fetch();return route.fulfill({response,body:await response.text()+`
        window.releaseQA={home(){G=newGameState('隔離テスト','ai_hero_spellblade');currentSlotKey='qa-release';showHome();},
          open(name){({items:showItems,skills:showSkills,synthesis:showSynthesis,weapon:showWeaponShop,item:showItemShop,gacha:showGacha,load:showLoadSaveScreen,stages:showStageSelect})[name]();},
          math(problem){G=newGameState('採点テスト','ai_hero_spellblade');showScreen('screen-training');window.qaMathResult=null;
            startChallenge($('training-challenge'),{problem,timeLimit:30000},res=>window.qaMathResult=res);},
          stop(){destroyChallenge();showScreen('screen-title');}
        };`});
    }
    return route.continue();
  });
  await page.goto(process.env.BASE_URL||'http://127.0.0.1:5178/');
  await page.waitForFunction(()=>!!window.releaseQA);
  await page.locator('#btn-boot-start').waitFor({state:'visible',timeout:25000});
  for(const [width,height] of [[1280,900],[390,844]]){
    await page.setViewportSize({width,height});await page.screenshot({path:path.join(out,`boot-${width}.png`)});
    const rect=await page.locator('#btn-boot-start').boundingBox();assert.ok(rect.x>=0 && rect.y>=0 && rect.x+rect.width<=width && rect.y+rect.height<=height);
    assert.ok(await page.locator('#btn-boot-start').evaluate(el=>{
      const text=document.createRange();text.selectNodeContents(el);return text.getClientRects().length===1;
    }),'start button label stays on one line');
  }
  const startButton=await page.locator('#btn-boot-start').boundingBox();
  await page.mouse.click(startButton.x+startButton.width/2,startButton.y+startButton.height/2);
  await page.locator('#boot-loader-screen').waitFor({state:'hidden'});
  await page.locator('#btn-newgame').click();await page.locator('#btn-new-save-back').click();
  assert.equal(await page.locator('.screen.active').getAttribute('id'),'screen-title');
  for(const [width,height] of [[1280,900],[390,844]]){
    await page.setViewportSize({width,height});
    for(const [name,screen,back] of [['load','screen-load-save','btn-load-save-back'],['items','screen-items','btn-items-back'],['skills','screen-skills','btn-skills-back'],['synthesis','screen-synthesis','btn-synthesis-back'],['weapon','screen-weapon-shop','btn-weapon-shop-back'],['item','screen-item-shop','btn-item-shop-back'],['gacha','screen-gacha','btn-gacha-back'],['stages','screen-stage-select','btn-stage-select-back']]){
      await page.evaluate(name=>{window.releaseQA.home();window.releaseQA.open(name);},name);
      assert.equal(await page.locator('.screen.active').getAttribute('id'),screen);
      await page.locator('.screen.active').evaluate(el=>Promise.all(el.getAnimations({subtree:true})
        .filter(animation=>Number.isFinite(animation.effect.getComputedTiming().iterations))
        .map(animation=>animation.finished.catch(()=>{}))));
      assert.ok(await page.locator('.screen.active').evaluate(el=>Number(getComputedStyle(el).opacity)>.99));
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
      assert.equal(overflow,false,`${name} at ${width} has no page-wide horizontal overflow`);
      await page.screenshot({path:path.join(out,`${name}-${width}.png`)});
      await page.locator('#'+back).click();
      assert.equal(await page.locator('.screen.active').getAttribute('id'),name==='load'?'screen-title':'screen-home');
      report.screens.push({name,width,height,back:true});
    }
  }
  await page.setViewportSize({width:1280,height:900});
  const cases=[
    [{text:'6 と 10 の平均',op:'平均',answer:8},['8.0'],true],
    [{text:'7 と 8 の平均',op:'平均',answer:7.5},['７．５'],true],
    [{text:'6 + 6',answer:12},['1+2'],false],
    [{text:'6 + 6',answer:12},['1x2'],false],
    [{text:'1/4 + 1/4',answer:'2/4'},['1','2'],true],
    [{text:'1/4 + 1/4',answer:'2/4'},['1','0'],false],
    [{text:'4 : 4 をかんたんに',op:'かんたん',answer:'1:1'},['1','1'],true],
    [{text:'4 : 4 をかんたんに',op:'かんたん',answer:'1:1'},['2','2'],false],
    [{text:'7 ÷ 2',answer:3,remainder:1},['3','1'],true],
    [{text:'7 ÷ 2',answer:3,remainder:1},['3','0'],false],
    [{text:'時速60km で 3時間の道のり（km）',op:'道のり',answer:180},['180km'],true],
    [{text:'半径2cmの円の面積（cm²、円周率3.14）',op:'面積',answer:12.56},['12.56cm²'],true],
  ];
  for(const [problem,inputs,success] of cases){
    await page.evaluate(p=>window.releaseQA.math(p),problem);
    for(const value of inputs){await page.locator('#ch-input').fill(value);await page.locator('#ch-submit').click();}
    await page.waitForFunction(()=>window.qaMathResult!==null);
    assert.equal(await page.evaluate(()=>window.qaMathResult.success),success,`${problem.text}: ${inputs}`);
    report.grading.push({text:problem.text,inputs,success});
    if(problem.op==='面積')await page.screenshot({path:path.join(out,'circle-answer.png')});
  }
  await page.evaluate(()=>window.releaseQA.stop());
  assert.deepEqual(report.errors,[]);
  writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
  console.log(`PASS: ${report.screens.length} screen/back paths, boot desktop/mobile and ${report.grading.length} actual battle-input grading cases. Screenshots/report: ${out}`);
}finally{await browser.close();}
