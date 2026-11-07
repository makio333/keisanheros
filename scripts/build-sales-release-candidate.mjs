import {build} from 'vite';
import {mkdtemp,mkdir,readFile,writeFile,readdir,copyFile,lstat,realpath} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {assertSalesReleaseOutput,createSalesReleaseBootstrap,prepareSalesReleaseHtml,inspectSalesGameSources,createSalesReleaseManifest} from './lib/sales-release-artifact.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const args=process.argv.slice(2);
if(args.length>1||args.some(arg=>!/^--out-dir=.+$/.test(arg)))throw Error('Only optional --out-dir=PATH is supported. This command never deploys or enables a runtime.');
let output;
if(args.length){
  output=assertSalesReleaseOutput(path.resolve(args[0].slice(10)),root);
  // A symlink under the dedicated directory must not redirect writes into a live build.
  const parent=path.dirname(output),actualParent=await realpath(parent);
  assertSalesReleaseOutput(path.join(actualParent,path.basename(output)),await realpath(root));
  await mkdir(output,{recursive:false});
}else output=await realpath(await mkdtemp(path.join(tmpdir(),'legend-sales-release-')));
const stage=await realpath(await mkdtemp(path.join(tmpdir(),'legend-sales-release-source-')));
const plans=[
  {name:'commerce.html',source:'sales-pages/commerce.html'},
  {name:'terms.html',source:'sales-pages/terms.html'},
  {name:'privacy.html',source:'sales-pages/privacy.html'},
  {name:'purchase-email-verification.html',source:'sales-pages/purchase-email-verification.html',page:'email',module:'sales-pages/sales-email-panel.mjs',entry:'entry-email.mjs'},
  {name:'account-deletion.html',source:'account-deletion.html',page:'deletion',module:'sales-pages/account-deletion-page.js',entry:'entry-deletion.mjs',css:'account-deletion-page.css'},
  {name:'account-device-cleanup.html',source:'sales-pages/account-device-cleanup.html',page:'cleanup',module:'sales-pages/account-device-cleanup.js',entry:'entry-cleanup.mjs'},
];
const labels=['特定商取引法に基づく表記','利用規約','プライバシーポリシー','購入前メール確認','退会申請','端末内コピー確認'];
const home='<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>販売用リリース候補</title><style>body{font:17px/1.8 system-ui,sans-serif;max-width:850px;margin:32px auto;padding:20px}li{margin:14px 0}</style></head><body><h1>販売用リリース候補</h1><p>ページと実装モジュールをまとめた未公開の候補です。レビュー中は本番の認証・メール・決済・退会申請・端末内削除をすべて停止します。</p><ul>'+plans.map((plan,index)=>'<li><a href="/'+plan.name+'">'+labels[index]+'</a></li>').join('')+'</ul><p>ゲーム本体はこの候補に含めていません。共有ソースの全セーブ一覧・ギフト経路は別途検証し、販売用入口とサーバーで制限を確認するまで販売可能とは扱いません。</p></body></html>';
await writeFile(path.join(stage,'index.html'),prepareSalesReleaseHtml(home));
for(const plan of plans){
  await writeFile(path.join(stage,plan.name),prepareSalesReleaseHtml(await readFile(path.join(root,plan.source),'utf8'),{entryName:plan.entry,cssName:plan.css}));
  if(plan.entry)await writeFile(path.join(stage,plan.entry),createSalesReleaseBootstrap({page:plan.page,modulePath:path.join(root,plan.module)}));
}
await copyFile(path.join(root,'sales-pages/account-device-cleanup.css'),path.join(stage,'account-device-cleanup.css'));
await copyFile(path.join(root,'sales-pages/account-deletion-page.css'),path.join(stage,'account-deletion-page.css'));
const inputs=Object.fromEntries(['index.html',...plans.map(plan=>plan.name)].map(name=>[name.replace('.html',''),path.join(stage,name)]));
await build({root:stage,configFile:false,envDir:false,envPrefix:'SALES_RELEASE_NO_ENV_',publicDir:false,
  // Keep the complete email UI as a dynamic dependency. The outer bootstrap is
  // permanently review-locked before import; CSP also denies every connection.
  define:{'import.meta.env.VITE_SALES_PREPARATION_ONLY':JSON.stringify('0')},
  build:{outDir:output,emptyOutDir:false,target:'es2022',manifest:'bundle-manifest.json',rollupOptions:{input:inputs},sourcemap:false}});
for(const name of ['account-device-cleanup.css','account-deletion-page.css'])await copyFile(path.join(stage,name),path.join(output,name));
const reviewStatus=JSON.parse(await readFile(path.join(root,'sales-pages/review-status.json'),'utf8'));
await writeFile(path.join(output,'review-status.json'),JSON.stringify(reviewStatus,null,2)+'\n');
const sources={};
for(const name of ['firebase_init.js','game_cloud_apis.js','firebase_game_client.js','index.html'])sources[name]=await readFile(path.join(root,name),'utf8');
const inspection=inspectSalesGameSources(sources);
await writeFile(path.join(output,'admin-source-review.json'),JSON.stringify(inspection,null,2)+'\n');
const files={};
async function collect(directory,prefix=''){
  for(const entry of await readdir(directory,{withFileTypes:true})){
    const name=prefix+entry.name,absolute=path.join(directory,entry.name);
    if(entry.isDirectory())await collect(absolute,name+'/');
    else if(entry.isFile()&&!(await lstat(absolute)).isSymbolicLink())files[name]=await readFile(absolute);
    else throw Error('sales_release_nonregular_file');
  }
}
await collect(output);
const bundle=JSON.parse(files['bundle-manifest.json'].toString());
const manifest=createSalesReleaseManifest({files,reviewStatus,gameInspection:inspection,bundle});
await writeFile(path.join(output,'sales-release-candidate.json'),JSON.stringify(manifest,null,2)+'\n');
await writeFile(path.join(output,'PREVIEW-ONLY.txt'),'UNPUBLISHED SALES RELEASE CANDIDATE\nRuntime locked to review; no real authentication, mail, API, deletion or deployment.\nGame excluded pending sales-entry and administrative-route verification.\nDo not use browser file:// or bypass browser restrictions.\n');
console.log(JSON.stringify({output,sourceStage:stage,published:false,deployable:false,dependenciesVerified:manifest.dependenciesVerified,modulesPackaged:manifest.modulesPackaged,blockers:manifest.blockers}));
