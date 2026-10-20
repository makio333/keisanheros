import './storage_polyfill.js';
import './style.css';
import './kanji_input_style.css';
import './assets_bundle.js';
import './kanji_data.js';
import './kanji_input_ui.js';
import { initEventSystem, playEventScene } from './event_system.js';

initEventSystem();
window.playEventScene = playEventScene;

if (import.meta.env.VITE_ACCOUNT_BACKEND === '1') {
  const {initializeAccountClient}=await import('./account_client.js');
  await initializeAccountClient();
} else {
  await import('./firebase_init.js');
}
await import('./game.js');
