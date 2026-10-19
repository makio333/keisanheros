// Verification package only: production has neither these hooks nor cloud stubs.
window.__lhErrors=[];addEventListener('error',e=>window.__lhErrors.push(e.message));addEventListener('unhandledrejection',e=>window.__lhErrors.push(String(e.reason)));
window.__lhQA={
 setup(){
  endBattleLoop();destroyChallenge();
  document.querySelectorAll('.halloween-menu,.halloween-season2-overlay,.raid-exchange-overlay,.confirm-overlay,.reward-artwork-preview,.avatar-selector-overlay,.quest-board-overlay,.pickup-overlay,.admin-gift-notice-overlay,.seed-use-effect,.gacha-reveal-overlay,.halloween-summon').forEach(e=>e.remove());
  document.querySelectorAll('.modal-overlay').forEach(e=>e.classList.add('hidden'));
  document.querySelectorAll('#screen-quest-board,#screen-event-raid,#screen-raid-boss,#screen-raid-history,#avatar-change-modal').forEach(e=>e.classList.add('hidden'));
  G=newGameState('再現確認','halloween_ghost_ranger');currentSlotKey=SAVE_PREFIX+'unity-qa-isolated';G.player.gold=100000;G.avatarBackground='halloween_moon_garden';G.avatarDecoration='moon_ribbon';G.unlockedDecorations=AVATAR_DECORATIONS.map(f=>f.id);G.ownedEquips.push({uid:2,id:'w1',rarity:1,ability:null},{uid:3,id:'w1',rarity:1,ability:null});G.nextUid=4;addItem('cost_seed',2);addItem('respec_seed',1);G.raidCoins=1000;G.halloweenCandy=1000;G.halloweenTickets=1;G.raidTickets=1;G.equipGachaTenPullTickets=1;showHome();document.getElementById('boot-loader-screen')?.remove();
 },
 home:showHome,adventure:showStageSelect,stages:()=>showStageSelectNew('area1'),room:showStatus,weapon:showWeaponShop,item:showItemShop,items:showItems,skills:showSkills,gacha:showGacha,synthesis:showSynthesis,frames:()=>window.showAvatarChangeModal(),quests:showQuestBoard,halloween:showHalloweenMenu,eventRaid:showEventRaidMenu,raid:showRaidBossMenu,raidExchange:showRaidExchange,saveSlots:showLoadSaveScreen,admin:showAdmin,
 battle:()=>enterAreaStage('area1',0),kanji:()=>enterAreaStage('area5',0),synthesisCalc:()=>startSynthesisFlow({baseUid:2,materialUid:3}),savePrint:()=>suggestChallengePrintBeforeSave(()=>{}),print:()=>printAreaStage('area1',0),halloweenExchange:()=>showHalloweenMenu('exchange'),season2:showHalloweenSeason2Stages,
 seed(){const it=G.items.find(i=>i.id==='cost_seed');useItem(it.uid,getItemTemplate(it.id));},
 state(){return {screen:document.querySelector('.screen.active')?.id,gold:G?.player.gold,errors:window.__lhErrors,images:[...document.images].filter(i=>i.offsetWidth&&(!i.complete||!i.naturalWidth)).map(i=>i.src)};},
 metrics(){const active=document.querySelector('.screen.active');return {screen:active?.id,viewport:[innerWidth,innerHeight],background:active?getComputedStyle(active).backgroundImage:'',buttons:[...document.querySelectorAll('button')].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').map(e=>({id:e.id,text:e.textContent.trim(),x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height})),errors:window.__lhErrors};}
};
window.render_game_to_text=()=>JSON.stringify(window.__lhQA.state());
