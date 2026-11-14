import {build} from 'vite';
import {createHash} from 'node:crypto';
import {readFile,writeFile,readdir,copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {getTitleReleaseManifest,validateTitleReleaseInfo} from '../title_release_info.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const args=process.argv.slice(2);
// Exact live target approved by the operator: ailandgames / legend-heroes2.
const deployAccount=process.env.FIREBASE_LIVE_DEPLOY_ACCOUNT || 'ailandgames.jp@gmail.com';
if(args.some(arg=>arg!=='--deploy'))throw Error('Only --deploy is supported.');
validateTitleReleaseInfo();
const config=JSON.parse(await readFile(path.join(root,'firebase.internal-hosting.json'),'utf8'));
if(config.hosting.site!=='legend-heroes2'||config.hosting.public!=='dist-internal'||config.firestore||JSON.stringify(config.hosting.rewrites)!==JSON.stringify([{source:'/api/raid-game',run:{serviceId:'legend-heroes-internal-raid',region:'asia-northeast1'}}]))throw Error('Unexpected live deployment target.');
const deliveryManifest=JSON.parse(await readFile(path.join(root,'assets/runtime/manifest.json'),'utf8'));
for(const image of deliveryManifest.images){const digest=createHash('sha256').update(await readFile(path.join(root,image.source))).update(deliveryManifest.version).digest('hex').slice(0,16);if(image.lossless!==true || image.pixelVerified!==true || (image.file!==image.source && !image.file.includes(digest)))throw Error('Runtime artwork is stale: run python3 scripts/build-runtime-art.py');}
const audioVersions={};
for(const name of await readdir(path.join(root,'public/assets_audio')))audioVersions[name]=createHash('sha256').update(await readFile(path.join(root,'public/assets_audio',name))).digest('hex').slice(0,12);
await build({root,define:{
  'import.meta.env.VITE_BOOT_AUDIO_VERSIONS':JSON.stringify(audioVersions),
  'import.meta.env.VITE_TEST_CHRISTMAS_PREVIEW':'"0"',
  'import.meta.env.VITE_ACCOUNT_BACKEND':'"0"',
  'import.meta.env.VITE_ACCOUNT_MOCK':'"0"',
  'import.meta.env.VITE_FIREBASE_GAME':'"1"',
  'import.meta.env.VITE_FIREBASE_SALES':'"0"',
  'import.meta.env.VITE_STRIPE_CHECKOUT':'"0"',
  'import.meta.env.VITE_PRODUCT_NO_SALES':'"1"',
  'import.meta.env.VITE_LINE_OIDC_ENABLED':'"1"',
  'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN':'"legend-heroes2.web.app"',
  'import.meta.env.VITE_MIGRATION_IMPORT_ENABLED':'"0"',
},build:{outDir:'dist-internal'}});
for(const name of ['manifest.json','sw.js','media_store.js'])await copyFile(path.join(root,name),path.join(root,'dist-internal',name));
await writeFile(path.join(root,'dist-internal/sw.js'),(await readFile(path.join(root,'sw.js'),'utf8')).replace("importScripts('./media_store.js');",await readFile(path.join(root,'media_store.js'),'utf8')));
const assets=path.join(root,'dist-internal/assets');
const sources=await Promise.all((await readdir(assets)).filter(name=>name.endsWith('.js')).map(name=>readFile(path.join(assets,name),'utf8')));
const source=sources.join('\n');
if(!source.includes('255137807181:web:e6c521f0fc5ac2b9001504') || ['841092455118:web:2fb4919a180f82855d4e9f','treegames-ac5db','https://checkout.stripe.com','/api/auth/firebase/session'].some(value=>source.includes(value)))throw Error('Live identity / no-sales isolation check failed.');
await writeFile(path.join(root,'dist-internal/release-target.json'),JSON.stringify({sourceVersion:'latest-game',baseSourceVersion:'d505f61',buildFingerprint:createHash('sha256').update((await readdir(assets)).filter(name=>/\.(js|css)$/.test(name)).sort().join('\n')).update(await readFile(path.join(root,'game.js'))).update(await readFile(path.join(root,'asset_boot.js'))).update(await readFile(path.join(root,'asset_boot.css'))).update(await readFile(path.join(root,'sw.js'))).update(await readFile(path.join(root,'runtime_media.js'))).update(await readFile(path.join(root,'media_store.js'))).update(await readFile(path.join(root,'assets/runtime/manifest.json'))).digest('hex').slice(0,16),equipmentBalance:'approved-20261113',assetBoot:'prestart-delta-v2',mediaStorage:'indexeddb-bytes-v1',target:'internal',project:'ailandgames',site:'legend-heroes2',titleRelease:getTitleReleaseManifest(),loginRequired:true,saveMode:'firebase-owner-saves',cloudSavesEnabled:true,salesEnabled:false,migrationImportEnabled:false,sharedRaidApiEnabled:true,builtAt:new Date().toISOString()},null,2));
if(args.includes('--deploy')){
  const result=spawnSync('firebase',['deploy','--project','ailandgames','--config','firebase.internal-hosting.json','--only','hosting','--account',deployAccount],{cwd:root,stdio:'inherit'});
  if(result.error)throw result.error;
  process.exitCode=result.status??1;
}
