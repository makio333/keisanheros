import {build} from 'vite';
import {mkdtemp,mkdir,readFile,writeFile,readdir,copyFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {assertSalesCandidateOutput,createSalesCandidateManifest,createReadOnlySalesPage,SALES_CANDIDATE_PAGES} from './lib/sales-candidate-package.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const args=process.argv.slice(2);
if(args.length>1||args.some(arg=>!arg.startsWith('--out-dir=')))throw Error('Only optional --out-dir=PATH is accepted; this command never deploys.');
const output=args.length?assertSalesCandidateOutput(path.resolve(args[0].slice(10)),root):await mkdtemp(path.join(tmpdir(),'legend-sales-candidate-'));
if(args.length)await mkdir(output,{recursive:false}); // Never empty an existing working directory.
const builtPages=['commerce.html','terms.html','privacy.html','purchase-email-verification.html'];
const inputs=Object.fromEntries(builtPages.map(name=>[name.replace('.html',''),path.join(root,'sales-pages',name)]));
await build({root,configFile:false,envDir:false,envPrefix:'SALES_CANDIDATE_UNEXPOSED_',publicDir:false,
  define:{'import.meta.env.VITE_SALES_PREPARATION_ONLY':JSON.stringify('1')},
  build:{outDir:output,emptyOutDir:false,rollupOptions:{input:inputs},sourcemap:false}});
for(const name of builtPages)await copyFile(path.join(output,'sales-pages',name),path.join(output,name));
for(const [name,source] of [['account-deletion.html',path.join(root,'account-deletion.html')],['account-device-cleanup.html',path.join(root,'sales-pages/account-device-cleanup.html')]]){
  await writeFile(path.join(output,name),createReadOnlySalesPage(await readFile(source,'utf8')));
}
await copyFile(path.join(root,'sales-pages/account-device-cleanup.css'),path.join(output,'account-device-cleanup.css'));
await copyFile(path.join(root,'sales-pages/review-status.json'),path.join(output,'review-status.json'));
await writeFile(path.join(output,'index.html'),`<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>販売準備の確認</title><style>body{font:16px/1.8 system-ui,sans-serif;max-width:820px;margin:40px auto;padding:20px}li{margin:14px 0}</style></head><body><h1>販売準備の確認</h1><p><strong>未公開の確認用です。販売・実認証・メール送信・退会・端末削除は実行しません。</strong></p><ul>${SALES_CANDIDATE_PAGES.filter(name=>name!=='index.html').map(name=>'<li><a href="/'+name+'">'+({'commerce.html':'特定商取引法に基づく表記','terms.html':'利用規約','privacy.html':'プライバシーポリシー','purchase-email-verification.html':'購入前メール確認（停止状態）','account-deletion.html':'退会申請（表示のみ）','account-device-cleanup.html':'端末内コピーの確認（表示のみ）'}[name])+'</a></li>').join('')}</ul><p>本番接続・申告提出・公開には別の確認が残っています。バックアップ7日保持は確定していません。</p></body></html>`);
for(const name of ['account-deletion.html','account-device-cleanup.html','account-device-cleanup.css','review-status.json'])await copyFile(path.join(output,name),path.join(output,'sales-pages',name));
const files={};
async function collect(dir,prefix=''){
  for(const entry of await readdir(dir,{withFileTypes:true})){
    const name=prefix+entry.name;
    if(entry.isDirectory())await collect(path.join(dir,entry.name),name+'/');
    else if(entry.isFile())files[name]=await readFile(path.join(dir,entry.name));
    else throw Error('sales_candidate_nonregular_file');
  }
}
await collect(output);
const manifest=createSalesCandidateManifest({files});
await writeFile(path.join(output,'sales-candidate-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
await writeFile(path.join(output,'PREVIEW-ONLY.txt'),'UNPUBLISHED SALES REVIEW CANDIDATE\nNo real authentication, mail, payments, data processing or deployment is authorized.\nDo not use browser file:// or bypass browser restrictions.\n');
console.log(JSON.stringify({output,published:false,deployable:false,pages:SALES_CANDIDATE_PAGES,files:Object.keys(files).length}));
