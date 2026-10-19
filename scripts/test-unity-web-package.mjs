import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const base=path.resolve('unity-port/Assets/StreamingAssets/LegendHeroesWeb');
const sha=b=>createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(await readFile(path.join(base,'unity-web-manifest.json')));
assert.equal(manifest.mode,'production');
assert.ok(manifest.sources['kanji_input_ui.js']&&manifest.sources['kanji_readings_data.js']);
for(const [file,hash]of Object.entries(manifest.sources))assert.equal(sha(await readFile(file)),hash,file+' must match Web source');
const html=await readFile(path.join(base,'index.html'),'utf8');assert.ok(!html.includes("serviceWorker.register"));assert.ok(html.includes('./vendor/chart.umd.js'));
let scripts=0;for(const name of await readdir(path.join(base,'assets')))if(name.endsWith('.js')){const body=await readFile(path.join(base,'assets',name),'utf8');assert.ok(!body.includes('__lhQA')&&!body.includes('unity-qa-isolated'),'QA code must not ship');scripts++;}
assert.ok(scripts>0);assert.equal(sha(await readFile(path.join(base,'画像/my_room.jpg'))),sha(await readFile('assets/bg/my_room.jpg')));
assert.ok((await stat(path.join(base,'assets_audio/bgm_home.m4a'))).size>0);
assert.ok((await readFile(path.join(base,'vendor/Chart-LICENSE.md'),'utf8')).includes('MIT'));
console.log('PASS:',Object.keys(manifest.sources).length,'unchanged Web source hashes; production package excludes test hooks; offline chart/audio/preload alias');
