import {build,createServer} from 'vite';
import {readFile,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const [target,action='--build']=process.argv.slice(2);
if(!['legacy','product'].includes(target)||!['--build','--deploy','--dev'].includes(action))throw Error('Choose legacy or product; use --build, --deploy, or --dev.');
const legacy=target==='legacy',project=legacy?'treegames-ac5db':'ailandgames',site=legacy?'keisan-heros':'ailandgames';
const output='dist-'+target,configFile='firebase.'+target+'.json';
const config=JSON.parse(await readFile(path.join(root,configFile),'utf8'));
if(config.hosting.site!==site||config.hosting.public!==output)throw Error('Release target mismatch.');
const options={root,define:{'import.meta.env.VITE_ACCOUNT_BACKEND':JSON.stringify(legacy?'0':'1'),'import.meta.env.VITE_STRIPE_CHECKOUT':JSON.stringify(legacy?'0':'1'),'import.meta.env.VITE_ACCOUNT_MOCK':'"0"'},build:{outDir:output},server:{host:'127.0.0.1',port:legacy?5180:5181,strictPort:true}};
console.log(`${legacy?'Company / shared saves / JSON export':'Product / LINE accounts / JSON import'}: ${project} / ${site}`);
if(action==='--dev'){
  const server=await createServer(options);await server.listen();server.printUrls();
}else{
  await build(options);
  const manifest={target,project,site,saveMode:legacy?'shared-firestore':'authenticated-api',jsonTransfer:legacy?'export':'import',builtAt:new Date().toISOString()};
  await writeFile(path.join(root,output,'release-target.json'),JSON.stringify(manifest,null,2));
  if(action==='--deploy'){
    const result=spawnSync('firebase',['deploy','--project',project,'--config',configFile,'--only','hosting'],{cwd:root,stdio:'inherit',shell:process.platform==='win32'});
    if(result.error)throw result.error;process.exitCode=result.status??1;
  }else console.log('Build complete. Nothing deployed.');
}
