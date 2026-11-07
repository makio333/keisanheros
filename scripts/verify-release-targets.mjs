import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const targets=['legacy','internal','product'];
const overrides={};
for(const arg of process.argv.slice(2)){
  const match=/^--(legacy|internal|product)-dir=(.+)$/.exec(arg);
  if(!match||overrides[match[1]])throw Error('Use at most one --legacy-dir=PATH, --internal-dir=PATH, or --product-dir=PATH.');
  const directory=path.resolve(root,match[2]);
  const relative=path.relative(root,directory);
  if((relative==='..'||relative.startsWith('..'+path.sep)||path.isAbsolute(relative))&&!directory.startsWith('/private/tmp/'))throw Error('Candidate directories must be inside the repository or /private/tmp.');
  overrides[match[1]]=directory;
}
for(const target of targets){
  const legacy=target==='legacy',directory=overrides[target]||path.join(root,'dist-'+target);
  const manifest=JSON.parse(await readFile(directory+'/release-target.json','utf8'));
  const configName=target==='internal'?'firebase.internal-hosting.json':target==='product'?'firebase.product-hosting.json':'firebase.legacy.json';
  const config=JSON.parse(await readFile(root+configName,'utf8'));
  assert.equal(manifest.project,legacy?'treegames-ac5db':'ailandgames');
  assert.equal(manifest.target,target);assert.equal(manifest.site,config.hosting.site);
  assert.equal(config.hosting.public,'dist-'+target);
  assert.equal(manifest.saveMode,legacy?'shared-firestore':target==='internal'?'firebase-owner-saves':'authenticated-api');
  assert.equal(manifest.jsonTransfer,legacy?'export':target==='internal'?'disabled':'import');
  assert.equal(manifest.apiMode,legacy?'none':target==='internal'?'internal-raid':'product');
  for(const name of ['sw.js','manifest.json','icon-192.png','icon-512.png','apple-touch-icon.png']){
    assert.deepEqual(await readFile(directory+'/'+name),await readFile(root+name));
  }
  const files=await readdir(directory+'/assets'),js=files.filter(name=>name.endsWith('.js'));
  const combined=(await Promise.all(js.map(name=>readFile(directory+'/assets/'+name,'utf8')))).join('\n');
  if(legacy){
    assert.ok(files.some(name=>name.startsWith('firebase_init-')));
    assert.ok(combined.includes('treegames-ac5db'));
    assert.ok(!combined.includes('ailandgames'),'legacy must not point at the new project');
    assert.ok(!files.some(name=>name.startsWith('account_client-')));
    assert.equal(config.firestore,undefined,'legacy release must not deploy new rules');
    assert.equal(config.hosting.rewrites,undefined,'legacy must not route to the new server');
  }else if(target==='product'){
    assert.ok(files.some(name=>name.startsWith('account_client-')));
    assert.ok(!files.some(name=>name.startsWith('firebase_init-')));
    assert.ok(!combined.includes('treegames-ac5db'),'product must not access company Firestore');
    assert.equal(config.hosting.rewrites[0].run.serviceId,'legend-heroes-api');
  }else{
    assert.ok(files.some(name=>name.startsWith('firebase_game_client-')));
    assert.ok(!files.some(name=>name.startsWith('account_client-')),'internal must not bundle sales account client');
    assert.ok(!combined.includes('treegames-ac5db'),'internal must not access company Firestore');
    assert.deepEqual(config.hosting.rewrites,[{source:'/api/raid-game',run:{serviceId:'legend-heroes-internal-raid',region:'asia-northeast1'}}],'internal must route only the shared raid API');
    assert.ok(combined.includes('/api/raid-game'),'internal client must use the shared raid API');
    assert.ok(!/https:\/\/checkout\.stripe\.com|\/api\/payments\/(?:checkout|products)|\/api\/auth\/firebase\/session/.test(combined),'internal must not contain sales endpoints');
  }
  console.log('PASS: '+target+' bundle, connection, Hosting, JSON role and offline files: '+directory);
}
const fallback=JSON.parse(await readFile(root+'firebase.json','utf8'));
assert.equal(fallback.hosting.public,'dist-product');
console.log('PASS: default Firebase config cannot publish the ordinary legacy dist folder to product Hosting. No network calls or deployments.');
