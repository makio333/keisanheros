import path from 'node:path';
import { createRequire } from 'node:module';

const projectRoot = path.resolve(process.argv[2] || process.cwd());
const require = createRequire(path.join(projectRoot, 'package.json'));
const { createServer } = require('vite');

const qaPlugin = {
  name: 'christmas-stage-local-preview',
  enforce: 'pre',
  resolveId(id, importer) {
    if (id === './account_client.js' && importer?.endsWith('/main.js')) return '\0christmas-stage-preview-account';
  },
  load(id) {
    if (id !== '\0christmas-stage-preview-account') return;
    return `export async function initializeAccountClient(){
      const session={summary:{saveLimit:3,used:0},async saveSlot(){},async flush(){},async logout(){}};
      window.AccountSession=session;window.CloudSave=session;return session;
    }`;
  },
  transform(code, id) {
    if (!id.endsWith('/game.js')) return;
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
      }};
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
  server: { host: '127.0.0.1', port: 5195, strictPort: true, open: false }
});
await server.listen();
console.log('クリスマスイベントのローカル確認: http://127.0.0.1:5195/');
console.log('Firebase・実セーブへの接続はありません。テストモードのメモリ上のデータだけを使います。');
const close = async () => { await server.close(); process.exit(0); };
process.on('SIGINT', close);
process.on('SIGTERM', close);
