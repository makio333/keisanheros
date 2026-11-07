import assert from 'node:assert/strict';import {homedir} from 'node:os';
const {chromium}=await import(`${homedir()}/.codex/skills/develop-web-game/node_modules/playwright/index.mjs`);
const b=await chromium.launch({channel:'chrome',headless:true});
try{
 const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/game.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+`\nwindow.battleLayoutQA={problem(problem){G.isTestMode=false;if(battle){battle.over=true;battle.running=false;}endBattleLoop();destroyChallenge();startChallenge($('battle-challenge'),{problem,timeLimit:60000,showBattleCommands:true},()=>{});},state:()=>G};`});});
 await p.goto('http://127.0.0.1:5186/');await p.waitForFunction(()=>!!window.raidLocalPreview);await p.evaluate(()=>window.raidLocalPreview.start());await p.locator('#ch-input').waitFor();
 // Measured before the summary moved: 268.9px desktop, 270.4–274.1px portrait.
 const baseline={1366:268.9,390:274.1,375:270.4,844:268.9};
 for(const [w,h] of [[1366,900],[390,844],[375,667],[320,568],[844,390]]){
  await p.setViewportSize({width:w,height:h});await p.waitForTimeout(350);
  const boxes=await p.evaluate(()=>Object.fromEntries(['#battle-question-window','#battle-player-window','#battle-player-window>.status-header-row','.battle-stat-hp','.battle-stat-mp','.battle-stat-exp','.challenge-problem','#ch-form','.battle-inline-commands'].map(s=>{const r=document.querySelector(s).getBoundingClientRect();return[s,{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}]})));

  const panel=boxes['#battle-question-window'],hp=boxes['.battle-stat-hp'],mp=boxes['.battle-stat-mp'],exp=boxes['.battle-stat-exp'];
  assert.ok(panel.height<=(baseline[w]??274)+1,'window must not grow');
  assert.ok(Math.abs(hp.y-mp.y)<2);assert.ok(exp.y>=hp.bottom-1);assert.ok(exp.width>hp.width);assert.ok(boxes['#battle-player-window>.status-header-row'].width>0);assert.ok(boxes['#battle-player-window>.status-header-row'].right<=hp.x+1);assert.ok(boxes['.challenge-problem'].y>=boxes['#battle-player-window'].bottom);
  assert.ok(panel.bottom<=h+1,'panel stays on screen');
  assert.ok(await p.locator('#battle-question-window').evaluate(el=>el.scrollWidth<=el.clientWidth));
  assert.ok(boxes['.battle-inline-commands'].bottom<=panel.bottom,'commands stay inside');
  await p.screenshot({path:`/tmp/battle-after-${w}.png`});
 }
 const answer=await p.evaluate(()=>window.raidLocalPreview.state().battle.problem.problem.answer);await p.locator('#ch-input').fill(String(answer));await p.locator('#ch-submit').click();await p.waitForFunction(()=>window.raidLocalPreview.state().battle.damage>0);
 await p.setViewportSize({width:375,height:667});
 for(const problem of [{text:'13 ÷ 4',answer:3,remainder:1},{text:'1/2 + 1/4',answer:'3/4'},{text:'2 : 3',answer:'2:3'},{text:'りんごを3こずつ入れたふくろが4つあります。お友だちにくばるりんごは、ぜんぶで何こありますか。',answer:12,isWordProblem:true}]){await p.evaluate(problem=>window.battleLayoutQA.problem(problem),problem);await p.locator('#ch-input').scrollIntoViewIfNeeded();await p.locator('#ch-input').fill('3');assert.equal(await p.locator('#ch-input').inputValue(),'3');assert.ok(await p.locator('#battle-question-window').evaluate(el=>{const r=el.getBoundingClientRect();return r.height<=269&&el.scrollWidth<=el.clientWidth&&r.left>=0&&r.right<=innerWidth;}));assert.ok(await p.locator('#battle-challenge').evaluate(el=>el.getBoundingClientRect().bottom<=document.getElementById('battle-question-window').getBoundingClientRect().bottom));}
 await p.waitForTimeout(400);await p.screenshot({path:'/tmp/battle-after-word-problem.png'});
 assert.deepEqual(errors,[]);console.log('PASS: portrait/landscape height preserved, avatar left HP/MP above EXP, problem below, no overflow, keyboard submission damage, no exceptions');
}finally{await b.close();}
