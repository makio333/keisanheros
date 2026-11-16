import {mkdtemp,mkdir,cp,writeFile,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';import path from 'node:path';import os from 'node:os';import {spawnSync} from 'node:child_process';
const local=fileURLToPath(new URL('../',import.meta.url)),workspace=fileURLToPath(new URL('../../../',import.meta.url));
const target='ailandgames/legend-heroes-internal-raid/asia-northeast1',args=process.argv.slice(2);
if(args.length&&!(args.length===2&&args[0]==='--deploy'&&args[1]===`--target=${target}`))throw Error('Use no arguments for a prepared source bundle, or --deploy --target='+target);
const stage=await mkdtemp(path.join(os.tmpdir(),'legend-announcements-api-'));
await mkdir(path.join(stage,'server'),{recursive:true});
for(const file of ['package.json','package-lock.json','server/internal-raid-deletion-guard.mjs','game_cloud_apis.js','economy.js','event_raid.js','event_equipment.js','legacy_save_file.js','raid_run_rules.js','raid_monthly_rules.js','ghost_raid_content.js'])await cp(path.join(workspace,file),path.join(stage,file));
for(const file of ['server/internal-raid-api.mjs','server/game-announcements.mjs'])await cp(path.join(local,file),path.join(stage,file));
const dockerfile=await readFile(path.join(workspace,'Dockerfile.internal-raid'),'utf8');
await writeFile(path.join(stage,'Dockerfile'),dockerfile.replace('COPY server/internal-raid-api.mjs ./server/internal-raid-api.mjs','COPY server/internal-raid-api.mjs server/game-announcements.mjs ./server/')); 
await writeFile(path.join(stage,'.gcloudignore'),'.git\nnode_modules\n');
console.log(JSON.stringify({target,dataProject:'legend-heroes-raid-20261027',source:stage,changes:['Cloud Run revision: add announcement methods','No IAM, environment, Firestore rules or save migration changes'],deploying:args.length>0}));
if(args.length){const result=spawnSync('gcloud',['run','deploy','legend-heroes-internal-raid','--project=ailandgames','--region=asia-northeast1','--source='+stage,'--quiet'],{stdio:'inherit'});if(result.error)throw result.error;process.exitCode=result.status??1;}
