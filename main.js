import './storage_polyfill.js';
import './equipment_chest_intro.css';
import './style.css?v=mana-ratio2';
import './asset_boot.css';
import './kanji_input_style.css';
import './christmas_battle_layout.css?v=presents5';
import './christmas_event_hub.css?v=mana-ratio2';
import './adventure_viewport_fit.css?v=fit3';
import './adventure_viewport_fit.js?v=fit3';
import './assets_bundle.js';
import './kanji_data.js';
import './kanji_input_ui.js?v=fit3';
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
