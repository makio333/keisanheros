import path from 'node:path';
import { createRequire } from 'node:module';

const projectRoot = path.resolve(process.argv[2] || process.cwd());
const require = createRequire(path.join(projectRoot, 'package.json'));
const { createServer } = require('vite');

const qaPlugin = {
  name: 'christmas-stage-local-preview',
  enforce: 'pre',
  resolveId(id, importer) {
    if (id === './account_client.js' && importer?.split('?')[0].endsWith('/main.js')) return '\0christmas-stage-preview-account';
  },
  load(id) {
    if (id !== '\0christmas-stage-preview-account') return;
    return `export async function initializeAccountClient(){
      const session={summary:{saveLimit:3,used:0},async saveSlot(){},async flush(){},async logout(){}};
      window.AccountSession=session;window.CloudSave=session;return session;
    }`;
  },
  transform(code, id) {
    if (!id.split('?')[0].endsWith('/game.js')) return;
    return code + `
      window.christmasStageLocalPreview={open(){
        document.getElementById('boot-loader-screen')?.remove();
        G=newGameState('ローカル確認');
        G.isTestMode=true;
        currentSlotKey='TEST_MODE_TEMP';
        ensureTestModeSupplies();
        updateHud();
        showHome();
        showChristmasMenu();
      },
      state(){return {game:G,run:explore,enemy:battle?.enemy,problem:battle?.currentTurnProblem,balance:christmasPresentBalance(G)};},
      start(withSanta=false){document.querySelector('.christmas-menu')?.remove();startChristmasChallenge(christmasChallengeSource(),()=>.99);if(withSanta)explore.christmasMonsters[2]={...CHRISTMAS_MONSTERS.find(m=>m.isBoss)};},
      stop(){endBattleLoop();explore=null;document.querySelectorAll('.gacha-reveal-overlay,.levelup-overlay,.kill-progress-overlay,.christmas-menu,.christmas-exchange-confirm').forEach(e=>e.remove());showHome();},
      fund(n){G.christmasPresents=n;showChristmasMenu('exchange');},
      defeat(){if(battle){battle.enemy.hp=0;winBattle();}},
      hub(tab){endBattleLoop();showHome();showChristmasMenu(tab);},
      gachaPrizes(){return getChristmasSkinGachaPrizes();},source(){return christmasChallengeSource();},questionSource(boss){return christmasQuestionSource(explore,boss);}
      };
      window.render_game_to_text=()=>JSON.stringify({screen:document.querySelector('.screen.active')?.id,presents:christmasPresentBalance(G),recovered:explore?.christmasRecovered || 0,enemy:battle?.enemy?.name,encounter:explore?.christmasIndex,owned:christmasEventState(G).collectedPrizes});
window.latestQA={gacha(view){document.querySelector('.christmas-menu')?.remove();G.player.lvl=50;G.player.gold=50000;G.equipGachaTenPullTickets=3;G.skinGachaTickets=3;showGacha(view);},raid(){document.querySelector('.christmas-menu')?.remove();showRaidBossMenu();},fight:startRaidBattle,raidShop:showRaidExchange,state:()=>G,exchange:showChristmasMenu,draw:doChristmasEquipGacha,pick:()=>Array.from({length:20000},()=>gachaEquipPick(3,true).id),equipment:CHRISTMAS_EQUIP_DB,prizes:CHRISTMAS_EXCHANGE_PRIZES};
      setTimeout(()=>window.christmasStageLocalPreview.open(),1200);
    `;
  }
};

const server = await createServer({
  root: projectRoot,
  configFile: false,
  define: {
    'import.meta.env.VITE_ACCOUNT_BACKEND': JSON.stringify('1'),
    'import.meta.env.VITE_ACCOUNT_MOCK': JSON.stringify('1')
  },
  plugins: [qaPlugin],
  optimizeDeps:{entries:['index.html']},
  server: { host: '127.0.0.1', port: Number(process.env.PREVIEW_PORT)||5195, strictPort: true, open: false }
});
await server.listen();
console.log('最新版ゲームのローカル確認: http://127.0.0.1:'+ (process.env.PREVIEW_PORT||5195) +'/');
console.log('Firebase・実セーブへの接続はありません。テストモードのメモリ上のデータだけを使います。');
const close = async () => { await server.close(); process.exit(0); };
process.on('SIGINT', close);
process.on('SIGTERM', close);
