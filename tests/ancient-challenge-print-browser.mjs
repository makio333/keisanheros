import assert from 'node:assert/strict';
import {homedir} from 'node:os';

const {chromium}=await import(`${homedir()}/.codex/skills/develop-web-game/node_modules/playwright/index.mjs`);
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1366,height:900}}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 const bridge=`
let ancientFixtureBlocked=false;window.ancientFixturePopups=[];window.ancientFixtureOpenAttempts=0;
const ancientFixtureOpen=window.open.bind(window);
window.open=(...args)=>{window.ancientFixtureOpenAttempts++;if(ancientFixtureBlocked)return null;const child=ancientFixtureOpen(...args);if(child){child.fixturePrintRequests=0;child.print=()=>{child.fixturePrintRequests++;};window.ancientFixturePopups.push(child);}return child;};
window.ancientPrintQA={
 prepare(){document.getElementById('screen-raid-boss').classList.add('hidden');G.isTestMode=false;currentSlotKey=SAVE_PREFIX+'ancient_print_v2_fixture';G.items=[{id:'bp_ancient',uid:9001,count:2}];G.stageClearCounts={area1:{0:1},area5:{0:1}};G.activePrints={};save(true);showItems();},
 snapshot:()=>JSON.parse(JSON.stringify(G)),
 blocked(value){ancientFixtureBlocked=!!value;},
 restore(){document.getElementById('screen-raid-boss').classList.add('hidden');loadSlot(SAVE_PREFIX+'ancient_print_v2_fixture');showHome();},
 coverage(){const bad=[];for(const [areaId,area]of Object.entries(AREA_STAGES)){if(BLUEPRINT_JAPANESE_AREAS.has(areaId))continue;area.stages.forEach((stage,index)=>{const seen=new Set();for(let i=0;i<200;i++){const q=ancientStoryProblem(stage.generateProblem());if(q)seen.add(q.text);}if(seen.size<1)bad.push({areaId,index,name:stage.name});});}for(const [areaId,area]of Object.entries(AREA_STAGES)){if(!BLUEPRINT_KANJI_AREAS.has(areaId))continue;area.stages.forEach((stage,index)=>{const current={stage,label:stage.name};const previous={stage:area.stages[Math.max(0,index-1)],label:'previous'};try{if(blueprintKanjiModeProblems({challenge:current,previous}).length!==10)bad.push({areaId,index});}catch{bad.push({areaId,index,name:stage.name});}});}return bad;},
 print(){return printBlueprintSheet(BLUEPRINT_DB.find(item=>item.id==='bp_ancient'),9001);}
};`;
 await page.route('**/game.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+bridge});});
 await page.goto('http://127.0.0.1:5186/');await page.waitForFunction(()=>!!window.ancientPrintQA&&!!window.raidLocalPreview);
 await page.evaluate(()=>window.ancientPrintQA.prepare());assert.deepEqual(await page.evaluate(()=>window.ancientPrintQA.coverage()),[]);
 const count=()=>page.evaluate(()=>window.ancientPrintQA.snapshot().items.find(item=>item.id==='bp_ancient')?.count||0);
 const printIds=()=>page.evaluate(()=>Object.keys(window.ancientPrintQA.snapshot().activePrints||{}));
 const review=page.locator('.ancient-print-review');

 // Preview, then close: no item consumption and no print record.
 await page.evaluate(()=>window.ancientPrintQA.print());await review.waitFor();
 const preview=page.frameLocator('.ancient-print-review-frame');
 await preview.locator('.wpp2-page').first().waitFor();
 assert.equal(await preview.locator('.wpp2-question').count(),33,'preview contains all 33 questions');
 assert.equal(await preview.locator('.wpp2-solution').count(),0,'student preview hides answers');
 assert.equal(await count(),2);assert.deepEqual(await printIds(),[]);
 await page.locator('[data-review-mode="teacher"]').click();
 const teacherPreview=page.frameLocator('.ancient-print-review-frame');
 assert.equal(await teacherPreview.locator('.wpp2-question').count(),33);
 assert.equal(await teacherPreview.locator('.wpp2-solution').count(),33,'teacher preview includes answer keys');
 await page.locator('[data-review-close]').first().click();assert.equal(await count(),2);assert.deepEqual(await printIds(),[]);

 // A blocked popup does not consume; a real same-origin popup consumes after its document opens.
 await page.evaluate(()=>window.ancientPrintQA.print());await review.waitFor();await page.evaluate(()=>window.ancientPrintQA.blocked(true));
 await page.locator('[data-review-print]').click();
 await page.waitForFunction(()=>document.querySelector('.ancient-print-review-status')?.textContent.includes('開けません'));
 assert.equal(await count(),2,'blocked popup leaves item count unchanged');assert.deepEqual(await printIds(),[]);
 await page.evaluate(()=>window.ancientPrintQA.blocked(false));
 await page.locator('[data-review-mode="teacher"]').click();
 const [teacherPrint]=await Promise.all([page.waitForEvent('popup'),page.locator('[data-review-print]').click()]);
 await teacherPrint.locator('.wpp2-page').first().waitFor();
 assert.equal(await teacherPrint.locator('.wpp2-question').count(),33);
 assert.equal(await teacherPrint.locator('.wpp2-solution').count(),33);
 assert.equal(await teacherPrint.locator('#wpp2-print-now').count(),1,'the opened document exposes its print control');
 assert.equal(await count(),1,'opening a print popup consumes one design');assert.equal((await printIds()).length,1);
 let state=await page.evaluate(()=>window.ancientPrintQA.snapshot());
 const [printId,firstMeta]=Object.entries(state.activePrints)[0];
 assert.equal(firstMeta.problems.length,33);assert.equal(firstMeta.questionCount,33);assert.equal(firstMeta.itemConsumedAtPrint,true);
 assert.equal(new Set(firstMeta.problems.filter(problem=>problem.subject==='国語').map(problem=>problem.kanjiSourceText||problem.text)).size,20);
 assert.equal(firstMeta.problems.filter(problem=>problem.printMode==='kaki').length,10);
 await teacherPrint.emulateMedia({media:'print'});
 const pdf=await teacherPrint.pdf({path:'/tmp/ancient-challenge-v2.pdf',preferCSSPageSize:true,printBackground:true});
 assert.ok((pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length>=1);
 const originalPrintText=await teacherPrint.locator('body').innerText();
 await teacherPrint.close();assert.equal(await count(),1,'closing the already opened print popup does not refund');

 // Persisted print IDs reconstruct the same questions for reprinting without another spend.
 await page.reload();await page.waitForFunction(()=>!!window.ancientPrintQA&&!!window.raidLocalPreview);
 await page.evaluate(()=>window.ancientPrintQA.restore());state=await page.evaluate(()=>window.ancientPrintQA.snapshot());
 assert.equal(state.items.find(item=>item.id==='bp_ancient').count,1);
 assert.equal(state.activePrints[printId].itemConsumedAtPrint,true);
 await page.evaluate(()=>window.openUnifiedCodeEntry());
 const reprintButton=page.locator('.unified-print-reprint');await reprintButton.waitFor();
 assert.ok((await page.locator('#unified-prints-list').innerText()).includes(printId));
 await reprintButton.click();await review.waitFor();
 assert.ok(await page.locator('#modal-unified-code').evaluate(element=>element.classList.contains('hidden')),'print-number list closes behind the reprint preview');
 const reprintPreview=page.frameLocator('.ancient-print-review-frame');await reprintPreview.locator('.wpp2-page').first().waitFor();
 assert.equal(await reprintPreview.locator('.wpp2-question').count(),33);
 assert.equal(await count(),1);assert.deepEqual(await printIds(),[printId]);
 const popupPromise=page.waitForEvent('popup',{timeout:6000}).catch(()=>null);
 await page.locator('[data-review-print]').click();
 const studentReprint=await popupPromise;
 assert.ok(studentReprint,`reprint popup should open; ${JSON.stringify(await page.evaluate(()=>({attempts:window.ancientFixtureOpenAttempts,status:document.querySelector('.ancient-print-review-status')?.textContent,buttonDisabled:document.querySelector('[data-review-print]')?.disabled})) )}`);
 await studentReprint.locator('.wpp2-page').first().waitFor();
 assert.equal(await studentReprint.locator('.wpp2-question').count(),33);
 assert.equal(await studentReprint.locator('.wpp2-solution').count(),0,'reprint defaults to the student version');
 assert.equal(await studentReprint.locator('#wpp2-print-now').count(),1);
 assert.equal(await count(),1,'reprint never consumes a second design');assert.deepEqual(await printIds(),[printId]);
 assert.deepEqual(errors,[]);
 console.log('PASS: integrated preview has 33 questions and split student/teacher answers; preview close and blocked popup do not consume; popup open consumes once; save/reload and same-ID reprint do not double consume; print controls present; no physical printing or page errors.');
}finally{await browser.close();}
