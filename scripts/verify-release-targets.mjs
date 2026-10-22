import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
for(const target of ['legacy','product']){
  const legacy=target==='legacy',directory=root+'dist-'+target;
  const manifest=JSON.parse(await readFile(directory+'/release-target.json','utf8'));
  const config=JSON.parse(await readFile(root+'firebase.'+target+'.json','utf8'));
  assert.equal(manifest.project,legacy?'treegames-ac5db':'ailandgames');
  assert.equal(manifest.target,target);assert.equal(manifest.site,config.hosting.site);
  assert.equal(config.hosting.public,'dist-'+target);
  assert.equal(manifest.saveMode,legacy?'shared-firestore':'authenticated-api');
  assert.equal(manifest.jsonTransfer,legacy?'export':'import');
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
  }else{
    assert.ok(files.some(name=>name.startsWith('account_client-')));
    assert.ok(!files.some(name=>name.startsWith('firebase_init-')));
    assert.ok(!combined.includes('treegames-ac5db'),'product must not access company Firestore');
    assert.equal(config.hosting.rewrites[0].run.serviceId,'legend-heroes-api');
  }
  console.log('PASS: '+target+' bundle, connection, Hosting, JSON role and offline files.');
}
const fallback=JSON.parse(await readFile(root+'firebase.json','utf8'));
assert.equal(fallback.hosting.public,'dist-product');
console.log('PASS: default Firebase config cannot publish the ordinary legacy dist folder to product Hosting. No network calls or deployments.');
