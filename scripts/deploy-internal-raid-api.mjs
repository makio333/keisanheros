import {spawnSync} from 'node:child_process';
import {cp,mkdtemp,mkdir,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const [mode='--check',...arguments_]=process.argv.slice(2);
const args=new Map();
for(const value of arguments_){
  const match=/^--([a-z-]+)=(.+)$/.exec(value);
  if(!match||args.has(match[1]))throw Error('Use --check [--data-project=ID], or --deploy --target=ailandgames/legend-heroes-internal-raid/asia-northeast1 --data-project=ID --deletion-guard-iam-ready=true.');
  args.set(match[1],match[2]);
}
if(!['--check','--deploy'].includes(mode)||[...args.keys()].some(key=>!['target','data-project','deletion-guard-iam-ready'].includes(key))||
  (args.has('deletion-guard-iam-ready')&&!['true','false'].includes(args.get('deletion-guard-iam-ready'))))throw Error('Invalid internal raid deployment command.');

const target='ailandgames/legend-heroes-internal-raid/asia-northeast1';
const dataProject=args.get('data-project')||process.env.INTERNAL_RAID_FIRESTORE_PROJECT_ID||'';
const serviceAccount='legend-heroes-raid-api@ailandgames.iam.gserviceaccount.com';
const blockers=[];
if(!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(dataProject)||dataProject==='ailandgames')blockers.push('Provide a separate Firestore project ID with its database and service-account access prepared.');
if(mode==='--deploy'&&args.get('target')!==target)blockers.push(`Deployment requires explicit --target=${target}.`);
if(mode==='--deploy'&&args.get('deletion-guard-iam-ready')!=='true')blockers.push('Verify and approve the Cloud Run service account read permissions for revoked-token checks and both account-deletion marker documents in ailandgames, then pass --deletion-guard-iam-ready=true.');

const report={configurationValid:blockers.length===0,remoteReadiness:'not checked',target,hosting:'ailandgames / legend-heroes2.web.app',firestoreProject:dataProject||null,serviceAccount,changes:['Cloud Run service revision only','Preserve existing IAM policy, environment, service account, traffic settings, Firebase Hosting, Firestore rules, Stripe, and legacy site'],prerequisites:['Existing Cloud Run service is Ready and uses the intended runtime identity and configuration.','Existing AUTH_FIREBASE_PROJECT_ID, RAID_FIRESTORE_PROJECT_ID, and INTERNAL_RAID_ALLOWED_ORIGINS match this API.','The service account has only the required Firestore role in the separate raid data project.','The service account has approved read access for revoked-token checks and both account-deletion marker documents in ailandgames.','Cloud Run API and source build services are enabled in ailandgames.'],blockers};
if(mode==='--check'||blockers.length){
  console.log(JSON.stringify({...report,remoteActions:[]},null,2));
  if(mode==='--deploy'&&blockers.length)process.exitCode=1;
}else{
  console.log(JSON.stringify({...report,deploying:true},null,2));
  const stage=await mkdtemp(path.join(os.tmpdir(),'legend-internal-raid-'));
  try{
    const files=['package.json','package-lock.json','server/internal-raid-api.mjs','server/internal-raid-deletion-guard.mjs','game_cloud_apis.js','economy.js','event_raid.js','event_equipment.js','legacy_save_file.js','raid_run_rules.js','raid_monthly_rules.js','ghost_raid_content.js'];
    await mkdir(path.join(stage,'server'),{recursive:true});
    for(const file of files)await cp(path.join(root,file),path.join(stage,file));
    await cp(path.join(root,'Dockerfile.internal-raid'),path.join(stage,'Dockerfile'));
    const command=['run','deploy','legend-heroes-internal-raid','--project=ailandgames','--region=asia-northeast1','--source='+stage];
    const result=spawnSync('gcloud',command,{cwd:root,stdio:'inherit'});
    if(result.error)throw Error('Google Cloud CLI is unavailable.');
    process.exitCode=result.status??1;
  }finally{
    await rm(stage,{recursive:true,force:true});
  }
}
