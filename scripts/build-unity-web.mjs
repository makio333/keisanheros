// A reproducible app package from the unchanged Web source. No second UI/rule implementation.
import {build} from 'vite';
import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const qa=process.argv.includes('--qa');
const output=path.join(root,qa?'output/unity-web-qa':'unity-port/Assets/StreamingAssets/LegendHeroesWeb');
const qaCode=qa?await readFile(path.join(root,'unity-port/Tests/web-parity-fixture.js'),'utf8'):'';
await build({root,configFile:path.join(root,'vite.config.ts'),build:{outDir:output,emptyOutDir:true},plugins:[{
 name:'legend-unity-package',enforce:'pre',
 transform(code,id){
  if(!qa)return;
  if(id.split('?')[0]===path.join(root,'firebase_init.js'))return {code:`window.CloudSave={saveSlot:async()=>{},listSlots:async()=>[],flush(){}};window.EventRaidAPI={getRankings:async()=>[]};window.RaidBossAPI={getRankings:async()=>[],getBoss:async()=>null,getHistory:async()=>[]};window.AdminGiftAPI={fetchPending:async()=>[]};`,map:null};
  if(id.split('?')[0]===path.join(root,'game.js'))return {code:code+'\n'+qaCode,map:null};
 }
}]});
// Native installation supplies offline contents and updates. Do not register the
// browser PWA cache under the native app's persistent localhost origin.
const index=path.join(output,'index.html');
let html=await readFile(index,'utf8');
html=html.replace(/<script>\s*\/\/ Service Worker登録[\s\S]*?<\/script>/,'');
html=html.replace('https://cdn.jsdelivr.net/npm/chart.js','./vendor/chart.umd.js');
html=html.replace('</head>','<link rel="stylesheet" href="./vendor/webkit-chromium-compat.css">\n<script src="./vendor/native-browser-bridge.js"></script>\n</head>');
await writeFile(index,html);
await mkdir(path.join(output,'vendor'),{recursive:true});
await copyFile(path.join(root,'unity-port/Native/chart.umd.js'),path.join(output,'vendor/chart.umd.js'));
await copyFile(path.join(root,'unity-port/Native/Chart-LICENSE.md'),path.join(output,'vendor/Chart-LICENSE.md'));
await copyFile(path.join(root,'unity-port/Native/webkit-chromium-compat.css'),path.join(output,'vendor/webkit-chromium-compat.css'));
await copyFile(path.join(root,'unity-port/Native/native-browser-bridge.js'),path.join(output,'vendor/native-browser-bridge.js'));
// The source still preloads this old name; the actual room uses assets/bg/my_room.jpg.
await mkdir(path.join(output,'画像'),{recursive:true});
await copyFile(path.join(root,'assets/bg/my_room.jpg'),path.join(output,'画像/my_room.jpg'));
for(const name of ['manifest.json','icon-192.png','icon-512.png','apple-touch-icon.png'])await copyFile(path.join(root,name),path.join(output,name));
const files=['index.html','main.js'];const hashes={};
for(let i=0;i<files.length;i++){
 const name=files[i],bytes=await readFile(path.join(root,name));hashes[name]=createHash('sha256').update(bytes).digest('hex');
 if(name.endsWith('.js'))for(const match of bytes.toString().matchAll(/(?:\b(?:import|export)[^;]*?\bfrom\s*|\bimport\s*)['"](\.[^'"]+)['"]/g)){
  const dependency=path.normalize(path.join(path.dirname(name),match[1]));if(!files.includes(dependency))files.push(dependency);
 }
}
await writeFile(path.join(output,'unity-web-manifest.json'),JSON.stringify({format:1,mode:qa?'isolated-qa':'production',sources:hashes,hostChanges:['PWA service-worker registration omitted; native package owns offline content','Chart.js 4.5.1 bundled locally from the same Web dependency','Obsolete my_room preload URL aliases the current room art','WebKit form/CJK text metrics normalized to the existing macOS Chrome layout','Blank popup URL normalized to about:blank for in-app print documents']},null,2));
console.log('Unity Web package:',output);
