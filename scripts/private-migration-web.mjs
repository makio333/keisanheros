import {build,createServer} from 'vite';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
const lineEnabled=process.env.MIGRATION_LINE_OIDC_ENABLED!=='0';
const closeImport=process.argv.includes('--close-import');
const salesPreview=process.argv.includes('--sales-preview');
const sameOriginAuth=process.argv.includes('--same-origin-auth');
if(sameOriginAuth&&process.argv.includes('--deploy'))throw Error('Auth callback configuration and exact deployment require operator approval. Nothing deployed.');
if(sameOriginAuth&&salesPreview)throw Error('Keep auth diagnosis separate from the sales preview.');
if(salesPreview&&process.argv.includes('--deploy'))throw Error('Sales preview is build/dev only. Nothing deployed.');
const options={define:{'import.meta.env.VITE_LINE_OIDC_ENABLED':JSON.stringify(lineEnabled?'1':'0'),'import.meta.env.VITE_MIGRATION_IMPORT_ENABLED':JSON.stringify(closeImport?'0':'1'),'import.meta.env.VITE_FIREBASE_GAME':'"1"','import.meta.env.VITE_ACCOUNT_BACKEND':'"0"','import.meta.env.VITE_STRIPE_CHECKOUT':'"0"'},build:{outDir:'dist-migration',rollupOptions:{input:['index.html','save-migration.html']}},server:{host:'127.0.0.1',port:5183,strictPort:true}};
if(salesPreview){
  options.define['import.meta.env.VITE_FIREBASE_SALES']='"1"';
  options.define['import.meta.env.VITE_STRIPE_CHECKOUT']='"1"';
  options.define['import.meta.env.VITE_MIGRATION_IMPORT_ENABLED']='"0"';
  options.build.outDir='dist-sales-preview';options.server.port=5184;
}
if(sameOriginAuth){
  options.define['import.meta.env.VITE_FIREBASE_AUTH_DOMAIN']='"legend-heroes2.web.app"';
  options.build.outDir='dist-auth-preview';options.server.port=5186;
}
if(process.argv.includes('--dev')){const server=await createServer(options);await server.listen();server.printUrls();}
else {
  await build(options);
  if(process.argv.includes('--deploy')){
    // Only add the isolated owner-only namespace when existing data is denied.
    const token=execFileSync('gcloud',['auth','print-access-token'],{encoding:'utf8'}).trim();
    const headers={Authorization:`Bearer ${token}`,'x-goog-user-project':'ailandgames'};
    if(lineEnabled){
      const response=await fetch('https://identitytoolkit.googleapis.com/admin/v2/projects/ailandgames/oauthIdpConfigs/oidc.line',{headers});
      if(!response.ok)throw Error('Cannot verify LINE provider; nothing deployed.');
      const provider=await response.json();
      if(!provider.enabled||provider.issuer!=='https://access.line.me'||provider.responseType?.code!==true)throw Error('LINE provider is not ready; nothing deployed.');
    }
    const release=await fetch('https://firebaserules.googleapis.com/v1/projects/ailandgames/releases/cloud.firestore',{headers});
    if(!release.ok)throw Error('Cannot verify existing Firestore rules. Nothing deployed.');
    const current=await fetch('https://firebaserules.googleapis.com/v1/'+(await release.json()).rulesetName,{headers});
    if(!current.ok)throw Error('Cannot read existing Firestore rules. Nothing deployed.');
    const files=(await current.json()).source.files;
    const normalize=text=>text.replace(/\/\/[^\n]*/g,'').replace(/\s+/g,'');
    const prior="rules_version = '2';service cloud.firestore {match /databases/{database}/documents {match /{document=**} {allow read, write: if false;}}}";
    const desired=await readFile('firestore.private-migration.rules','utf8');
    const closed=desired.replace('function migrationOpen() { return true; }','function migrationOpen() { return false; }');
    const previousHash='e53b6a7151de30830fe4e0c2c2167161e97f07e6c6803d0ea032c6eedd92cd5c';
    if(files.length!==1||![normalize(prior),normalize(desired),normalize(closed)].includes(normalize(files[0].content))&&createHash('sha256').update(normalize(files[0].content)).digest('hex')!==previousHash)throw Error('Existing rules changed. Review required; nothing deployed.');
    if(normalize(files[0].content)===normalize(closed)&&!closeImport&&!process.argv.includes('--open-import'))throw Error('Import is closed. Keep --close-import or explicitly approve --open-import. Nothing deployed.');
    const config=JSON.parse(await readFile('firebase.migration.json','utf8'));
    config.firestore.rules='firestore.private-migration.active.rules';
    await writeFile('firestore.private-migration.active.rules',closeImport?closed:desired);
    await writeFile('firebase.migration.active.json',JSON.stringify(config,null,2));
    const result=spawnSync('firebase',['deploy','--project','ailandgames','--config','firebase.migration.active.json','--only','firestore:rules,hosting'],{stdio:'inherit'});
    if(result.status!==0)process.exitCode=result.status||1;
  }
}
