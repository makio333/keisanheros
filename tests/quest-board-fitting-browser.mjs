import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from '/Users/motoyamayuuki/.codex/skills/develop-web-game/node_modules/playwright/index.mjs';
const out='/private/tmp/quest-board-fitting';await mkdir(out,{recursive:true});const b=await chromium.launch({channel:'chrome',headless:true});
try{const c=await b.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'});await c.route('**/*',async route=>{const u=new URL(route.request().url());if(u.hostname!=='127.0.0.1')return route.fulfill({status:200,body:''});if(u.pathname==='/game.js'){const r=await route.fetch();return route.fulfill({response:r,body:await r.text()+`\nwindow.fitQA={setup(){G=newGameState('表示確認用','ai_hero_spellblade');currentSlotKey='fixture-fit';save=()=>{};SM.play=()=>{};document.getElementById('boot-loader-screen')?.remove();showQuestBoard();},open:showQuestBoard};`});}return route.continue();});const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:5174/');await p.waitForFunction(()=>window.fitQA);await p.evaluate(()=>fitQA.setup());
const capacities=[],paperByQuest=new Map();
for(const [width,height] of [[1366,900],[1280,720],[1920,1080],[1024,768],[390,844],[375,667],[320,568],[844,390],[667,375],[568,320]]){
 await p.setViewportSize({width,height});
 for(const subject of ['math','reading']){
  await p.locator(`#quest-subject-tabs [data-subject=${subject}]`).click();await p.waitForFunction(()=>{const g=document.querySelector('#screen-quest-board .quest-fitted-grid');return !!g?.dataset.pageCapacity&&g.children.length>0;});
  // Wait until the measured layout remains unchanged across animation frames.
  await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const previous=p.getByRole('button',{name:'前のクエストページ',exact:true});while(!await previous.isDisabled())await previous.click();
  const seen=new Set();let pages=0;
  while(true){
   const state=await p.evaluate(()=>{const board=document.querySelector('#screen-quest-board .quest-board-wood'),g=board.querySelector('.quest-fitted-grid'),pager=board.querySelector('.quest-board-pager'),gr=g.getBoundingClientRect(),pr=pager.getBoundingClientRect();const cards=[...g.children].map(el=>{const r=el.getBoundingClientRect();return{index:el.dataset.questPageIndex,key:el.dataset.questNoticeKey,variant:el.dataset.noticeVariant,paper:getComputedStyle(el,'::before').borderImageSource,x:r.x,y:r.y,right:r.right,bottom:r.bottom,overflow:el.scrollHeight-el.clientHeight,overlap:(()=>{const a=el.querySelector('.reading-quest-card-actions')?.getBoundingClientRect(),gold=el.querySelector('.qc-gold')?.getBoundingClientRect();return a&&gold?gold.bottom-a.top:0;})()};});return{capacity:+g.dataset.pageCapacity,grid:{x:gr.x,y:gr.y,right:gr.right,bottom:gr.bottom},pagerBottom:pr.bottom,overflow:[board,board.querySelector('.quest-board-grid'),g].map(el=>({y:el.scrollHeight-el.clientHeight,x:el.scrollWidth-el.clientWidth})),cards};});
   assert.ok(state.cards.length>0&&state.cards.length<=state.capacity);assert.ok(state.pagerBottom<=height+1,JSON.stringify({width,height,subject,state}));
   for(const x of state.overflow)assert.ok(x.x<=1&&x.y<=1,JSON.stringify({width,height,subject,state}));
   for(const card of state.cards){assert.ok(card.variant);assert.ok(card.paper.includes(card.variant),JSON.stringify(card));if(paperByQuest.has(card.key))assert.equal(card.variant,paperByQuest.get(card.key));else paperByQuest.set(card.key,card.variant);assert.ok(card.x>=state.grid.x-1&&card.y>=state.grid.y-1&&card.right<=state.grid.right+1&&card.bottom<=state.grid.bottom+1,JSON.stringify({width,height,subject,card,state}));assert.ok(card.overlap<=1,JSON.stringify({width,height,subject,card}));assert.ok(card.overflow<=1,JSON.stringify({width,height,subject,card}));assert.ok(!seen.has(card.index));seen.add(card.index);}
   if(pages===0){capacities.push({width,height,subject,count:state.cards.length,capacity:state.capacity});if(subject==='reading')await p.mouse.move(1,1);if(subject==='reading')await p.screenshot({path:`${out}/${width}x${height}.png`});}
   pages++;assert.ok(pages<30);const next=p.getByRole('button',{name:'次のクエストページ',exact:true});if(await next.isDisabled())break;await next.click();
  }
  assert.equal(seen.size,subject==='reading'?10:12,JSON.stringify({width,height,subject,seen:[...seen]}));
 }
}
assert.deepEqual(errors,[]);console.log(JSON.stringify(capacities));console.log('PASS: all cards reachable exactly once, viewport fit, no board/card scrolling, pager always visible, live resize across ten devices');
}finally{await b.close();}
