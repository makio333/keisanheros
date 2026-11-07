import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {raidJstMonthKey} from '../raid_monthly_rules.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const entry='server/internal-raid-api.mjs';
const dockerfile=await readFile(path.join(root,'Dockerfile.internal-raid'),'utf8');
const dockerSources=new Set([...dockerfile.matchAll(/^COPY\s+(.+)$/gm)].flatMap(match=>match[1].trim().split(/\s+/).slice(0,-1)));
const closure=new Set();
async function collect(relative){
  if(closure.has(relative))return;
  closure.add(relative);
  const source=await readFile(path.join(root,relative),'utf8');
  const imports=[...source.matchAll(/(?:\bfrom\s*|\bimport\s*)['"](\.[^'"]+)['"]/g)].map(match=>match[1]);
  for(const specifier of imports){
    const dependency=path.posix.normalize(path.posix.join(path.posix.dirname(relative),specifier));
    await collect(dependency);
  }
}
await collect(entry);
for(const file of closure)assert.ok(dockerSources.has(file),`internal API staged image omits relative runtime dependency: ${file}`);
assert.ok(dockerSources.has('package.json')&&dockerSources.has('package-lock.json'));
const packageJson=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
assert.ok(packageJson.dependencies?.['firebase-admin'],'Firebase Admin must be a production dependency in the staged image');

const portServer=createServer();
await new Promise((resolve,reject)=>{portServer.once('error',reject);portServer.listen(0,'127.0.0.1',resolve);});
const port=portServer.address().port;
await new Promise(resolve=>portServer.close(resolve));
const loader=path.join(root,'tests/fixtures/internal-raid-firebase-loader.mjs');
const api=path.join(root,entry);
const env={...process.env,PORT:String(port),AUTH_FIREBASE_PROJECT_ID:'ailandgames',RAID_FIRESTORE_PROJECT_ID:'legend-heroes-raid-fixture',INTERNAL_RAID_ALLOWED_ORIGINS:'https://legend-heroes2.web.app'};
for(const key of ['GOOGLE_APPLICATION_CREDENTIALS','CLOUDSDK_AUTH_CREDENTIAL_FILE_OVERRIDE','FIREBASE_CONFIG','GOOGLE_CLOUD_PROJECT','GCLOUD_PROJECT'])delete env[key];
const child=spawn(process.execPath,['--no-warnings','--experimental-loader',loader,api],{cwd:root,env,stdio:['ignore','pipe','pipe']});
let output='',errors='';child.stdout.setEncoding('utf8').on('data',chunk=>{output+=chunk;});
child.stderr.setEncoding('utf8').on('data',chunk=>{errors+=chunk;});
const base=`http://127.0.0.1:${port}`;
async function getReady(){
  let lastError;
  for(let attempt=0;attempt<80;attempt++){
    if(child.exitCode!==null)throw Error(`Synthetic API exited before startup. stdout=${output} stderr=${errors}`);
    try{return await fetch(base+'/api/raid-game');}catch(error){lastError=error;await new Promise(resolve=>setTimeout(resolve,50));}
  }
  throw Error(`Synthetic API startup timeout: ${lastError}; stdout=${output}; stderr=${errors}`);
}
try{
  const ready=await getReady();
  assert.equal(ready.status,405,'the production entry must bind the HTTP route locally');
  const origin='https://legend-heroes2.web.app';
  const unauthenticated=await fetch(base+'/api/raid-game',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({method:'getMonthlyRankings',args:[raidJstMonthKey(Date.now())]})});
  assert.equal(unauthenticated.status,401,'local synthetic API requires a bearer token');
  const response=await fetch(base+'/api/raid-game',{method:'POST',headers:{origin,authorization:'Bearer synthetic-only-token','content-type':'application/json'},body:JSON.stringify({method:'getMonthlyRankings',args:[raidJstMonthKey(Date.now())]})});
  assert.equal(response.status,200,`synthetic auth/deletion-marker/read-only request succeeds: ${await response.clone().text()}`);
  assert.deepEqual(await response.json(),{result:[]});
  assert.match(output,/Internal raid API listening\./);
  console.log(`PASS: staged dependency closure (${closure.size} local modules); production API entry binds and serves health/auth/read-only routes through synthetic Firebase stubs only; no credentials, Firestore writes, or external requests.`);
}finally{
  child.kill('SIGTERM');
  await new Promise(resolve=>{if(child.exitCode!==null||child.signalCode!==null)return resolve();child.once('exit',resolve);setTimeout(resolve,1500).unref();});
  if(child.exitCode!==0&&child.signalCode!=='SIGTERM')throw Error(`Synthetic API shutdown failed: stdout=${output}; stderr=${errors}`);
}
