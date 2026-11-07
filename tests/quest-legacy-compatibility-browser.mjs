import assert from 'node:assert/strict';
import {homedir} from 'node:os';
import {MATH_WORD_QUESTS_V2} from '../math_word_quests_v2.js';
import {JAPANESE_READING_QUESTS_V2} from '../japanese_reading_quests_v2.js';
import {READING_STORY_QUESTS} from '../reading_story_quests.js';

const {chromium}=await import(`${homedir()}/.codex/skills/develop-web-game/node_modules/playwright/index.mjs`);
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1024,height:768}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
 const bridge=`
window.questLegacyQA={
 setup(){window.raidLocalPreview.open();document.getElementById('screen-raid-boss').classList.add('hidden');G.isTestMode=false;currentSlotKey=SAVE_PREFIX+'quest_legacy_compat_fixture';ensureQuestBoard();G.questBoard[0].partIndex=1;G.mathWordQuestsV2={completed:{${JSON.stringify(MATH_WORD_QUESTS_V2[0].id)}:true}};G.japaneseReadingV2={progress:{${JSON.stringify(JAPANESE_READING_QUESTS_V2.find(q=>q.grade===1).id)}:2},claimed:{}};G.readingSubquests={solved:{},parts:{${JSON.stringify(READING_STORY_QUESTS.find(q=>q.grade===1).id)}:1},letters:{},defeated:{}};save(true);questSubject='math';showQuestBoard();},
 restore(){document.querySelectorAll('.quest-detail-overlay,.reading-subquest-overlay').forEach(element=>element.remove());document.getElementById('screen-raid-boss').classList.add('hidden');loadSlot(SAVE_PREFIX+'quest_legacy_compat_fixture');questSubject='math';showQuestBoard();},
 state:()=>JSON.parse(JSON.stringify(G))
};`;
 await page.route('**/game.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+bridge});});
 await page.goto('http://127.0.0.1:5186/');await page.waitForFunction(()=>!!window.questLegacyQA&&!!window.raidLocalPreview);await page.evaluate(()=>window.questLegacyQA.setup());
 const state=()=>page.evaluate(()=>window.questLegacyQA.state());
 const oldMathState=await state(),mathId=MATH_WORD_QUESTS_V2[0].id,japanese=JAPANESE_READING_QUESTS_V2.find(q=>q.grade===1),oldReading=READING_STORY_QUESTS.find(q=>q.grade===1);
 await page.locator('.quest-legacy-quests summary').click();
 const oldMathCard=page.locator('.quest-legacy-quests .quest-card').first();await oldMathCard.waitFor({state:'visible'});
 assert.match(await oldMathCard.getAttribute('aria-label'),/1／3問 クリア/);
 assert.equal(oldMathState.mathWordQuestsV2.completed[mathId],true);
 await page.getByRole('tab',{name:'国語'}).click();
 const v2Card=page.locator('.reading-v2-quest-card').filter({has:page.getByRole('heading',{name:japanese.title,exact:true})});
 assert.equal(await v2Card.locator('.quest-card-stars').getAttribute('aria-label'),'2問 / 5問');
 await page.locator('.reading-legacy-quests summary').click();
 const oldReadingCard=page.locator('.reading-legacy-quests .reading-quest-card').filter({has:page.getByRole('heading',{name:oldReading.title,exact:true})});
 assert.equal(await oldReadingCard.locator('.quest-card-stars .on').count(),1,'the old three-question quest retains its first answer');
 let saved=await state();assert.equal(saved.readingSubquests.parts[oldReading.id],1);assert.equal(saved.japaneseReadingV2.progress[japanese.id],2);assert.equal(saved.mathWordQuestsV2.completed[mathId],true);
 await page.reload();await page.waitForFunction(()=>!!window.questLegacyQA&&!!window.raidLocalPreview);await page.evaluate(()=>window.questLegacyQA.restore());
 await page.locator('.quest-legacy-quests summary').click();
 assert.match(await page.locator('.quest-legacy-quests .quest-card').first().getAttribute('aria-label'),/1／3問 クリア/);
 saved=await state();assert.equal(saved.readingSubquests.parts[oldReading.id],1,'legacy Japanese progress survives reload');assert.equal(saved.japaneseReadingV2.progress[japanese.id],2,'V2 progress survives reload');assert.equal(saved.mathWordQuestsV2.completed[mathId],true,'math V2 completion survives reload');
 await page.getByRole('tab',{name:'国語'}).click();
 assert.equal(await page.locator('.reading-v2-quest-card').filter({has:page.getByRole('heading',{name:japanese.title,exact:true})}).locator('.quest-card-stars').getAttribute('aria-label'),'2問 / 5問');
 await page.locator('.reading-legacy-quests summary').click();
 assert.equal(await page.locator('.reading-legacy-quests .reading-quest-card').filter({has:page.getByRole('heading',{name:oldReading.title,exact:true})}).locator('.quest-card-stars .on').count(),1);
 assert.deepEqual(errors,[]);console.log('PASS: legacy math three-part progress and legacy Japanese three-question progress remain available alongside V2; math completion/Japanese 2-of-5/legacy 1-of-3 state all survive save reload.');
}finally{await browser.close();}
