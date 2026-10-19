// Run the installed development skill's unchanged client using installed Chrome.
import {homedir} from 'node:os';
import {pathToFileURL} from 'node:url';
const base=homedir()+'/.codex/skills/develop-web-game/';
const {chromium}=await import(pathToFileURL(base+'node_modules/playwright/index.mjs'));
const launch=chromium.launch.bind(chromium);
chromium.launch=options=>launch({...options,channel:'chrome'});
await import(pathToFileURL(base+'scripts/web_game_playwright_client.js'));
