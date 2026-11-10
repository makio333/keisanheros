import './storage_polyfill.js';
import './style.css';
import './kanji_input_style.css';
import './assets_bundle.js';
import './kanji_data.js';
import './kanji_input_ui.js';
import './title_release_notes.css';
import './title_release_notes.js';
import { initEventSystem, playEventScene } from './event_system.js';

initEventSystem();
window.playEventScene = playEventScene;

if (import.meta.env.DEV && new URLSearchParams(location.search).get('art-preview') === '1') {
  await import('./local_game_client.js');
} else if (import.meta.env.VITE_FIREBASE_GAME === '1') {
  const {initializeFirebaseGameClient}=await import('./firebase_game_client.js');
  await initializeFirebaseGameClient();
} else if (import.meta.env.VITE_ACCOUNT_BACKEND === '1') {
  const {initializeAccountClient}=await import('./account_client.js');
  await initializeAccountClient();
} else {
  await import('./local_game_client.js');
}
await import('./game.js');
