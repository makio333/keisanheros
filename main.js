import './firebase_init.js';
import './storage_polyfill.js';
import './style.css';
import './kanji_input_style.css';
import './assets_bundle.js';
import './kanji_data.js';
import './kanji_input_ui.js';
import { initEventSystem, playEventScene } from './event_system.js';

initEventSystem();
window.playEventScene = playEventScene;

import './game.js';
