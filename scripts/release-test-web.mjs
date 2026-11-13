import {build} from 'vite';
import {createHash} from 'node:crypto';
import {readFile,writeFile,readdir,copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {getTitleReleaseManifest,validateTitleReleaseInfo} from '../title_release_info.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const args=process.argv.slice(2);
// Test Hosting belongs to this operator account; do not inherit another project's active login.
const deployAccount=process.env.FIREBASE_TEST_DEPLOY_ACCOUNT || 'ailandgames.jp@gmail.com';
if(args.some(arg=>arg!=='--deploy'))throw Error('Only --deploy is supported.');
validateTitleReleaseInfo();
const config=JSON.parse(await readFile(path.join(root,'firebase.test-hosting.json'),'utf8'));
if(config.hosting.site!=='legend-heroes-test'||config.hosting.public!=='dist-test'||config.firestore||config.hosting.rewrites)throw Error('Unexpected test deployment target.');
const audioVersions={};
for(const name of await readdir(path.join(root,'public/assets_audio')))audioVersions[name]=createHash('sha256').update(await readFile(path.join(root,'public/assets_audio',name))).digest('hex').slice(0,12);
await build({root,resolve:{alias:[{find:/^(?:.*\/)?firebase_product_config\.js$/,replacement:path.join(root,'config/firebase-test.js')}]},define:{
  'import.meta.env.VITE_BOOT_AUDIO_VERSIONS':JSON.stringify(audioVersions),
  'import.meta.env.VITE_ACCOUNT_BACKEND':'"0"',
  'import.meta.env.VITE_ACCOUNT_MOCK':'"0"',
  'import.meta.env.VITE_FIREBASE_GAME':'"0"',
  'import.meta.env.VITE_FIREBASE_SALES':'"0"',
  'import.meta.env.VITE_STRIPE_CHECKOUT':'"0"',
  'import.meta.env.VITE_PRODUCT_NO_SALES':'"1"',
  'import.meta.env.VITE_LINE_OIDC_ENABLED':'"0"',
  'import.meta.env.VITE_MIGRATION_IMPORT_ENABLED':'"0"',
},build:{outDir:'dist-test'}});
for(const name of ['manifest.json','sw.js'])await copyFile(path.join(root,name),path.join(root,'dist-test',name));
const assets=path.join(root,'dist-test/assets');
const sources=await Promise.all((await readdir(assets)).filter(name=>name.endsWith('.js')).map(name=>readFile(path.join(assets,name),'utf8')));
const source=sources.join('\n');
if(!source.includes('fetchAllSlots')||['841092455118:web:2fb4919a180f82855d4e9f','255137807181:web:e6c521f0fc5ac2b9001504','treegames-ac5db','https://checkout.stripe.com','identitytoolkit.googleapis.com','firestore.googleapis.com'].some(value=>source.includes(value)))throw Error('Login-free test bundle isolation check failed.');
await writeFile(path.join(root,'dist-test/release-target.json'),JSON.stringify({sourceVersion:'latest-game',baseSourceVersion:'d505f61',buildFingerprint:createHash('sha256').update(await readFile(path.join(root,'game.js'))).update(await readFile(path.join(root,'asset_boot.js'))).update(await readFile(path.join(root,'asset_boot.css'))).update(await readFile(path.join(root,'sw.js'))).digest('hex').slice(0,16),equipmentBalance:'approved-20261113',assetBoot:'two-phase-v1',target:'test',project:'ailandgames-test',site:'legend-heroes-test',titleRelease:getTitleReleaseManifest(),loginRequired:false,saveMode:'browser-local',cloudSavesEnabled:false,salesEnabled:false,migrationImportEnabled:false,sharedRaidApiEnabled:false,builtAt:new Date().toISOString()},null,2));
if(args.includes('--deploy')){
  const result=spawnSync('firebase',['deploy','--project','ailandgames-test','--config','firebase.test-hosting.json','--only','hosting','--account',deployAccount],{cwd:root,stdio:'inherit'});
  if(result.error)throw result.error;
  process.exitCode=result.status??1;
}
