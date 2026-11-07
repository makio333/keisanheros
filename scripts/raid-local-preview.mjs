// Local fixture only: no production dates, Firebase settings or source modules are changed.
import {createServer} from 'vite';
const hook = `
window.raidLocalPreview = {
  open() {
    destroyChallenge();
    if(battle?.tickId) clearInterval(battle.tickId);
    if(battle) { battle.running=false; battle.over=true; }
    battle=null; explore=null;
    currentSlotKey = 'TEST_MODE_TEMP';
    G = newGameState('幽霊王テスト勇者', 'ai_hero_spellblade');
    G.isTestMode = true;
    ensureTestModeSupplies();
    G.ownedEquips=G.ownedEquips.filter(e=>!e.id.startsWith('raid_moon_'));
    G.player.atk=40; // Keep the fixture alive for several answer turns.
    showHome(); showRaidBossMenu();
    document.getElementById('boot-loader-screen')?.remove();
  },
  start: startRaidBattle,
  exchangeFixture(persist=false) {
    window.raidLocalPreview.open();G.raidCoins=3000;G.player.lvl=99;
    if(persist){G.isTestMode=false;currentSlotKey=SAVE_PREFIX+'ghost_exchange_fixture';save(true);}
    showRaidExchange();
  },
  snapshot:()=>JSON.parse(JSON.stringify(G)),
  restoreFixture(){loadSlot(SAVE_PREFIX+'ghost_exchange_fixture');showHome();},
  outfit:()=>window.showAvatarChangeModal(),
  equip(id){const owned=G.ownedEquips.find(e=>e.id===id);startEquipFlow(owned,getEquipTemplate(id));},
  iceAgain(){const p=battle.currentTurnProblem;startChallenge($('battle-challenge'),{problem:p.problem,timeLimit:60000},()=>{});},

  repeatResult() { if(battle) loseBattle(); },
  state: () => ({appearance:getRaidBossAppearance().id, testMode:!!G?.isTestMode, maxHp:getRaidMaxHp(),coins:G?.raidCoins||0,best:G?.raidBestSingleDamage||0, battle: battle ? {boss:battle.raidMonsterId,damage:battle.raidDamageDealt,problem:battle.currentTurnProblem} : null}),
  problem: applyMoonWraithMissingOperand
};
window.render_game_to_text = () => JSON.stringify(window.raidLocalPreview.state());
window.raidLocalPreview.open();
// This bridge exists only in the offline fixture server, never in the release.
let readingBattleRun=null;
const normalReadingWin=winBattle,normalReadingLoss=loseBattle;
function finishReadingBattle(won){if(!readingBattleRun)return;const run=readingBattleRun;readingBattleRun=null;endBattleLoop();parent.postMessage({type:'reading-pursuit-result',runId:run.runId,won},location.origin);}
winBattle=function(){if(readingBattleRun){finishReadingBattle(true);return;}return normalReadingWin();};
loseBattle=function(){if(readingBattleRun){finishReadingBattle(false);return;}return normalReadingLoss();};
window.addEventListener('message',async event=>{
 if(parent===window||event.source!==parent||event.origin!==location.origin||event.data?.type!=='reading-pursuit-start')return;
 const {grade,runId}=event.data;if(!Number.isInteger(grade)||grade<1||grade>6||typeof runId!=='string'||runId.length>80||readingBattleRun)return;
 const {READING_PURSUIT_QUESTS}=await import('./reading_pursuit_quests.js');if(readingBattleRun)return;
 const q=READING_PURSUIT_QUESTS.find(q=>q.grade===grade);if(!q)return;
 window.raidLocalPreview.open();document.querySelector('#screen-raid-boss').classList.add('hidden');
 readingBattleRun={runId};G.playerName='怪盗クエストのテスト勇者';G.player.hp=totalMaxHp();
 explore={zone:'tower',floor:1,sessionDrops:[],sessionGold:0};startBattle(false);
 Object.assign(battle.enemy,{name:q.enemy.name,emoji:q.enemy.image,hp:80,maxHp:80,atk:4,def:1,exp:0,goldMin:0,goldMax:0});
 document.querySelector('#battle-enemy-name').textContent=q.enemy.name;
 document.querySelector('#battle-enemy-emoji').innerHTML='<img src="'+q.enemy.image+'" alt="'+q.enemy.name+'">';
 document.querySelector('#battle-floor-title').textContent='5つの手がかりを解読！ 怪盗ヒルルと対決';
 updateBattleBars();window.readingPursuitLocalState=()=>({runId,enemy: battle?.enemy?.name,hp:battle?.enemy?.hp,problem:battle?.currentTurnProblem,testMode:G.isTestMode});
});
if(parent!==window&&location.hash==='#reading-pursuit')parent.postMessage({type:'reading-pursuit-ready'},location.origin);
const toolbar = document.createElement('div');toolbar.className='raid-local-preview-toolbar';
toolbar.style.cssText='position:fixed;bottom:0;left:0;z-index:999999;display:flex;flex-wrap:nowrap;align-items:center;gap:3px;box-sizing:border-box;max-width:calc(100vw - 8px);max-height:30px;overflow-x:auto;overflow-y:hidden;white-space:nowrap;background:#fff4c4;color:#241600;padding:3px 5px;font:10px sans-serif;overscroll-behavior-x:contain';
toolbar.textContent='ローカル専用・幽霊王テスト（保存・通信なし） ';
const reset=document.createElement('button');reset.textContent='レイドに戻る';reset.onclick=()=>window.raidLocalPreview.open();toolbar.append(reset);const exchange=document.createElement('button');exchange.textContent='交換テスト（3000コイン）';exchange.onclick=()=>window.raidLocalPreview.exchangeFixture();toolbar.append(exchange);const kuku=document.createElement('button');kuku.id='raid-preview-kuku';kuku.textContent='九九道場テスト';kuku.onclick=()=>{document.querySelector('#screen-raid-boss .window-close-btn')?.click();showSkills();document.querySelector('#skill-list>button').click();};toolbar.append(kuku);for(const control of toolbar.querySelectorAll('button'))control.style.cssText='flex:0 0 auto;white-space:nowrap;margin:0;padding:2px 4px;min-height:20px;font:10px sans-serif';document.body.append(toolbar);
const previewLayout=document.createElement('style');previewLayout.textContent='#screen-quest-board{bottom:var(--raid-preview-toolbar-height,0px)!important}#screen-quest-board .quest-board-wood{max-height:calc(100% - 16px)!important}';document.head.append(previewLayout);
const fitPreviewToolbar=()=>document.documentElement.style.setProperty('--raid-preview-toolbar-height',String(toolbar.getBoundingClientRect().height)+'px');fitPreviewToolbar();window.addEventListener('resize',fitPreviewToolbar,{passive:true});if(window.ResizeObserver)new ResizeObserver(fitPreviewToolbar).observe(toolbar);
if(location.hash==='#kuku')kuku.click();
`;
const server=await createServer({
 configFile:false, envFile:false,
 server:{host:'127.0.0.1',port:5186,strictPort:true,headers:{'Content-Security-Policy':"connect-src 'self' ws://127.0.0.1:5186; worker-src 'none'"}},
 define:{'import.meta.env.VITE_FIREBASE_GAME':'"0"','import.meta.env.VITE_ACCOUNT_BACKEND':'"0"','import.meta.env.VITE_RAID_CLOSED_UNTIL':'""'},
 plugins:[{name:'offline-ghost-king-fixture',enforce:'pre',
 resolveId(id){if(id.endsWith('/firebase_init.js')||id==='./firebase_init.js')return '\0raid-fixture';},
 transformIndexHtml(html){return html.replace('<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>','').replace("navigator.serviceWorker.register('./sw.js')","Promise.resolve({})");},
 load(id){if(id==='\0raid-fixture')return `window.CloudSave={saveSlot:async()=>{},listSlots:async()=>[],flush(){}};`;},
 transform(code,id){
 if(id.split('?')[0].endsWith('/game.js'))return code.replace('...Object.keys(customEquips || {}).map(id => ({ id }))];',"...Object.keys(customEquips || {}).map(id => ({ id }))].filter(db=>!db.id.startsWith('raid_moon_'));").replace('function activeRaidBossAppearanceId(now = Date.now())','function activeRaidBossAppearanceId(now = RAID_GHOST_KING_STARTS_AT)')+'\n'+hook;
 if(id.split('?')[0].endsWith('/main.js'))return code.replace("import './storage_polyfill.js';","import './storage_polyfill.js';\nnavigator.serviceWorker && (navigator.serviceWorker.register = async () => ({}));");
 }
 }]
});
await server.listen();
console.log('幽霊王ローカル専用: http://127.0.0.1:5186/ (Ctrl+Cで終了)');
