import {build,createServer} from 'vite';
import {readFile,writeFile,readdir,copyFile,mkdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {getTitleReleaseManifest,validateTitleReleaseInfo} from '../title_release_info.js';
const root=fileURLToPath(new URL('../',import.meta.url));
validateTitleReleaseInfo();
const titleRelease=getTitleReleaseManifest();
const [target,action='--build',...extra]=process.argv.slice(2);
if(!['legacy','product','product-free','internal'].includes(target)||!['--build','--deploy','--dev'].includes(action))throw Error('Choose legacy, product, product-free, or internal; use --build, --deploy, or --dev.');
let previousComplimentaryManifest=null;
if(['product','product-free'].includes(target)&&!process.env.PRODUCT_COMPLIMENTARY_ACCOUNT_CUTOFF){try{previousComplimentaryManifest=JSON.parse(await readFile(path.join(root,`dist-${target}`,'release-target.json'),'utf8'));}catch{}}
let outputOverride='';
for(const arg of extra){const match=/^--out-dir=(.+)$/.exec(arg);if(!match||outputOverride)throw Error('Only one --out-dir=PATH option is supported.');outputOverride=match[1];}
const legacy=target==='legacy',internal=target==='internal',product=target==='product'||target==='product-free',salesDisabled=target==='product-free',project=legacy?'treegames-ac5db':'ailandgames',site=legacy?'keisan-heros':'legend-heroes2';
const complimentaryAccountCutoff=product?process.env.PRODUCT_COMPLIMENTARY_ACCOUNT_CUTOFF||previousComplimentaryManifest?.complimentaryAccountsCreatedBefore||new Date().toISOString():null;
const complimentarySaveLimit=product?3:null;
const output='dist-'+target,configFile=legacy?'firebase.legacy.json':internal?'firebase.internal-hosting.json':salesDisabled?'firebase.product-free-hosting.json':'firebase.product-hosting.json';
const outputPath=path.resolve(root,outputOverride||output);
const relativeOutput=path.relative(root,outputPath);
if((relativeOutput.startsWith('..')||path.isAbsolute(relativeOutput)||!relativeOutput)&&!outputPath.startsWith('/private/tmp/'))throw Error('--out-dir must be inside the repository or /private/tmp.');
if(action==='--deploy'&&outputPath!==path.resolve(root,output))throw Error('A custom build directory cannot be deployed.');
const config=JSON.parse(await readFile(path.join(root,configFile),'utf8'));
if(config.hosting.site!==site||config.hosting.public!==output)throw Error('Release target mismatch.');
if(internal){
  const rewrites=config.hosting.rewrites||[];
  if(rewrites.length!==1||rewrites[0].source!=='/api/raid-game'||rewrites[0].run?.serviceId!=='legend-heroes-internal-raid'||rewrites[0].run?.region!=='asia-northeast1')throw Error('Internal raid API rewrite does not match the approved release configuration.');
}
if(salesDisabled){const rewrites=config.hosting.rewrites||[];if(rewrites.length!==1||rewrites[0].source!=='/api/**'||rewrites[0].run?.serviceId!=='legend-heroes-api'||rewrites[0].run?.region!=='asia-northeast1')throw Error('Sales-disabled product API rewrite does not match the product service.');}
const options={root,define:{
  'import.meta.env.VITE_ACCOUNT_BACKEND':'"0"',
  'import.meta.env.VITE_STRIPE_CHECKOUT':JSON.stringify(target==='product'?'1':'0'),
  'import.meta.env.VITE_PRODUCT_NO_SALES':JSON.stringify(salesDisabled?'1':'0'),
  'import.meta.env.VITE_ACCOUNT_MOCK':'"0"',
  'import.meta.env.VITE_FIREBASE_GAME':JSON.stringify(legacy?'0':'1'),
  'import.meta.env.VITE_FIREBASE_SALES':JSON.stringify(product?'1':'0'),
  'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN':JSON.stringify(legacy?'ailandgames.firebaseapp.com':'legend-heroes2.web.app'),
  'import.meta.env.VITE_RAID_CLOSED_UNTIL':JSON.stringify(product?'2026-11-01T00:00:00+09:00':''),
  'import.meta.env.VITE_LINE_OIDC_ENABLED':JSON.stringify(legacy?'0':'1'),
  'import.meta.env.VITE_MIGRATION_IMPORT_ENABLED':'"0"',
},build:{outDir:outputPath,...(target==='product'?{rollupOptions:{input:{main:path.join(root,'index.html'),accountDeletion:path.join(root,'account-deletion.html')}}}:{})},server:{host:'127.0.0.1',port:legacy?5180:5181,strictPort:true}};
  console.log(`${legacy?'Company / shared saves / JSON export':internal?'Internal / Firebase identity / owner saves / shared raid API / no sales':salesDisabled?'Product / existing account API / complimentary access / sales disabled / raid closed until Nov 1':'Product / Stripe sales / existing-account complimentary slots / raid closed until Nov 1'}: ${project} / ${site}`);
if(action==='--dev'){
  const server=await createServer(options);await server.listen();server.printUrls();
}else{
  await build(options);
  let salesPagesIncluded=false;
  if(target==='product'&&process.env.PRODUCT_SALES_PAGES_READY==='1'){
    const salesPageNames=['commerce.html','privacy.html','terms.html'];
    const salesPageSources=await Promise.all(salesPageNames.map(name=>readFile(path.join(root,'sales-pages',name),'utf8')));
    const incomplete=/class=["']placeholder["']|【|下書き|未確定|未確認|未設定|未完了|未実装|決定待ち|確認が必要|公開前|記入待ち/;
    const incompletePages=salesPageNames.filter((_,index)=>incomplete.test(salesPageSources[index]));
    if(incompletePages.length)throw Error(`Sales disclosure pages still contain draft fields: ${incompletePages.join(', ')}. Pages were not included.`);
    await mkdir(outputPath,{recursive:true});
    await Promise.all(salesPageNames.map(name=>copyFile(path.join(root,'sales-pages',name),path.join(outputPath,name))));
    for(const name of ['account-device-cleanup.html','account-device-cleanup.css','account-device-cleanup.js','account-device-cleanup.mjs'])await copyFile(path.join(root,'sales-pages',name),path.join(outputPath,name));
    salesPagesIncluded=true;
  }
  if(internal||salesDisabled){
    const assets=await readdir(path.join(outputPath,'assets'));
    const js=assets.filter(name=>name.endsWith('.js'));
    const bundles=await Promise.all(js.map(name=>readFile(path.join(outputPath,'assets',name),'utf8')));
    if(bundles.some(source=>/https:\/\/checkout\.stripe\.com|\/api\/payments\/(?:checkout|products)/.test(source)))throw Error('No-sales build contains active sales API code; nothing deployed.');
    if(internal&&bundles.some(source=>source.includes('/api/auth/firebase/session')))throw Error('Internal build contains product account login code; nothing deployed.');
    if(salesDisabled&&bundles.some(source=>source.includes("VITE_STRIPE_CHECKOUT")||source.includes('checkout.stripe.com')))throw Error('Sales-disabled product build contains checkout code; nothing deployed.');
  }
  const accountDeletionPageIncluded=target==='product';
  if(accountDeletionPageIncluded){try{await readFile(path.join(outputPath,'account-deletion.html'));}catch{throw Error('Account deletion page is missing from the product artifact.');}}
  const manifest={target,project,site,titleRelease,saveMode:legacy?'shared-firestore':internal?'firebase-owner-saves':'authenticated-api',jsonTransfer:legacy?'export':internal?'disabled':'import',apiMode:legacy?'none':internal?'internal-raid':salesDisabled?'product-no-sales':'product',salesEnabled:target==='product',salesPagesIncluded,accountDeletionPageIncluded,complimentaryAccountsCreatedBefore:complimentaryAccountCutoff,complimentarySaveLimit,raidClosedUntil:product?'2026-11-01T00:00:00+09:00':null,builtAt:new Date().toISOString()};
  await writeFile(path.join(outputPath,'release-target.json'),JSON.stringify(manifest,null,2));
  if(action==='--deploy'){
    if(!legacy&&!internal){
      if(salesDisabled){
        const missing=['PRODUCT_NO_SALES_API_READY','FIREBASE_ACCOUNT_LOGIN_ENABLED','FIREBASE_SAVE_MIGRATION_READY'].filter(key=>process.env[key]!=='1');
        if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(process.env.EMAIL_VERIFICATION_POLICY_START_AT||'')||!Number.isFinite(Date.parse(process.env.EMAIL_VERIFICATION_POLICY_START_AT)))missing.push('EMAIL_VERIFICATION_POLICY_START_AT');
        if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(complimentaryAccountCutoff||'')||!Number.isFinite(Date.parse(complimentaryAccountCutoff)))missing.push('PRODUCT_COMPLIMENTARY_ACCOUNT_CUTOFF');
        if(missing.length)throw Error(`Sales-disabled Hosting release blocked; confirm ${[...new Set(missing)].join(', ')}. Nothing deployed.`);
      }
      const required={
        PRODUCT_API_READY:'1',PRODUCT_COSTS_APPROVED:'1',
        STRIPE_MODE:'live',PRODUCT_SALES_ENABLED:'1',PRODUCT_SELLER_INFO_COMPLETE:'1',
        FIREBASE_ACCOUNT_LOGIN_ENABLED:'1',FIREBASE_SAVE_MIGRATION_READY:'1',
        PRODUCT_COMPLIMENTARY_SAVE_LIMIT:'3',
      };
      const missing=Object.entries(required).filter(([key,value])=>process.env[key]!==value).map(([key])=>key);
      if(process.env.PRODUCT_COMPLIMENTARY_ACCOUNT_CUTOFF!==complimentaryAccountCutoff)missing.push('PRODUCT_COMPLIMENTARY_ACCOUNT_CUTOFF must match the product artifact');
      if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(process.env.EMAIL_VERIFICATION_POLICY_START_AT||'')||!Number.isFinite(Date.parse(process.env.EMAIL_VERIFICATION_POLICY_START_AT)))missing.push('EMAIL_VERIFICATION_POLICY_START_AT');
      for(const key of ['PRODUCT_TERMS_URL','PRODUCT_PRIVACY_URL','PRODUCT_COMMERCE_URL']){
        const expected={PRODUCT_TERMS_URL:'terms.html',PRODUCT_PRIVACY_URL:'privacy.html',PRODUCT_COMMERCE_URL:'commerce.html'}[key];
        try{if(new URL(process.env[key]).href!==`https://legend-heroes2.web.app/${expected}`)throw Error();}catch{missing.push(key+' must match the packaged sales page');}
      }
      if(!manifest.salesPagesIncluded)missing.push('Build with PRODUCT_SALES_PAGES_READY=1 after all three legal pages are finalized');
      if(!salesDisabled&&missing.length)throw Error(`Product Hosting release blocked; confirm ${[...new Set(missing)].join(', ')}. Nothing deployed.`);
    }
    const result=spawnSync('firebase',['deploy','--project',project,'--config',configFile,'--only','hosting'],{cwd:root,stdio:'inherit',shell:process.platform==='win32'});
    if(result.error)throw result.error;process.exitCode=result.status??1;
  }else console.log('Build complete. Nothing deployed.');
}
