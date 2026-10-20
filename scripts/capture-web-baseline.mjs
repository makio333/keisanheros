import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {mkdir,readFile,stat,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'output/release-candidate/web-baseline.json');
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:20*1024*1024});
const candidates=git('ls-files','--cached','--others','--exclude-standard','-z').split('\0').filter(Boolean);
const inScope=name=>/^[^/]+\.(?:html|js|css|json|ts)$/.test(name) || /^(?:assets|public|画像|BGM SE)\//.test(name) || /^(?:server|tests)\/.*\.mjs$/.test(name) || ['WEB_RELEASE_STATUS.md','progress.md','scripts/capture-web-baseline.mjs','scripts/run-local-account-demo.mjs','scripts/setup-stripe-products.mjs'].includes(name);
const hashes={};
for(const name of [...new Set(candidates.filter(inScope))].sort()){
  const file=path.join(root,name);
  let info;try{info=await stat(file);}catch(error){if(error.code==='ENOENT')continue;throw error;}
  if(!info.isFile())continue;
  const hash=createHash('sha256');
  for await(const chunk of createReadStream(file))hash.update(chunk);
  hashes[name]={sha256:hash.digest('hex'),bytes:info.size};
}
const keyFiles=['game.js','index.html','style.css','kanji_data.js','kanji_print_context.js'];
const evidencePath=process.argv[2];
const previous=evidencePath?JSON.parse(await readFile(evidencePath,'utf8')):null;
const baseline={format:2,capturedUTC:new Date().toISOString(),head:git('rev-parse','HEAD').trim(),
  workingTree:git('status','--short'),scope:'Current tracked and nonignored Web sources/assets, server modules, Web tests and release records, including existing uncommitted work. No runtime account databases, player saves, environment secrets or Unity project files.',
  trackedDiffSha256:createHash('sha256').update(git('diff','HEAD','--binary')).digest('hex'),
  previousQA:previous?{capturedUTC:previous.capturedUTC,files:previous.files}:null,
  comparisonToQA:previous?Object.fromEntries(keyFiles.map(name=>[name,hashes[name]?.sha256===previous.files[name]?.sha256?'unchanged':'changed'])):null,
  files:hashes};
await mkdir(path.dirname(output),{recursive:true});
await writeFile(output,JSON.stringify(baseline,null,2)+'\n');
console.log(JSON.stringify({output,head:baseline.head,files:Object.keys(hashes).length,comparisonToQA:baseline.comparisonToQA}));
