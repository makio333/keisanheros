// Default is read-only verification. --publish must be explicitly approved for the pinned plan hash.
import {readFile} from 'node:fs/promises';import path from 'node:path';import {execFileSync} from 'node:child_process';
import {createAuthOnlyArtifact,sha256,hostingHash} from './lib/auth-only-artifact.mjs';import {verifyLiveBaseline,publishAuthOnly} from './lib/publish-auth-only.mjs';
const args=process.argv.slice(2),allowed=new Set(['--project','--site','--plan','--expect-plan-sha256','--verify','--publish']);
const opts={};for(let i=0;i<args.length;i++){const arg=args[i];if(!allowed.has(arg)||Object.hasOwn(opts,arg))throw Error('unknown_or_duplicate_argument');opts[arg]=['--verify','--publish'].includes(arg)?true:args[++i];}
if(opts['--project']!=='ailandgames'||opts['--site']!=='legend-heroes2'||!path.isAbsolute(opts['--plan']||''))throw Error('exact_target_and_absolute_plan_required');
if(Boolean(opts['--verify'])===Boolean(opts['--publish']))throw Error('choose_verify_or_publish');
const planBytes=await readFile(opts['--plan']);if(sha256(planBytes)!==opts['--expect-plan-sha256'])throw Error('unapproved_plan_hash');
const plan=JSON.parse(planBytes),work=path.dirname(opts['--plan']),metadata=JSON.parse(await readFile(path.join(work,'release-metadata.json'))),files=JSON.parse(await readFile(path.join(work,'published-files.json'))),originals=new Map();
for(const file of files){try{originals.set(file.path,await readFile(path.join(work,'baseline',file.path.slice(1))));}catch(e){if(e.code!=='ENOENT')throw e;}}
const expected=createAuthOnlyArtifact({metadata,files,bodies:originals});if(JSON.stringify(expected.plan)!==JSON.stringify(plan))throw Error('candidate_plan_not_reproducible');
const bodies=new Map();for(const [name,hash]of Object.entries(plan.files)){if(plan.retainedServerFiles.includes(name))continue;const b=await readFile(path.join(work,'candidate',name.slice(1)));if(hostingHash(b)!==hash)throw Error('candidate_hash_mismatch_'+name);bodies.set(hash,b);}
const token=execFileSync('gcloud',['auth','print-access-token'],{encoding:'utf8'}).trim();
const request=async(method,url,body,binary=false)=>{
 const u=new URL(url);if(!['firebasehosting.googleapis.com','upload-firebasehosting.googleapis.com'].includes(u.hostname)||u.protocol!=='https:')throw Error('non_hosting_endpoint');
 if(opts['--verify']&&method!=='GET')throw Error('read_only_verification');
 const response=await fetch(url,{method,redirect:'error',headers:{Authorization:'Bearer '+token,'x-goog-user-project':'ailandgames',...(body?{'Content-Type':binary?'application/octet-stream':'application/json'}:{})},body:body?binary?body:JSON.stringify(body):undefined,signal:AbortSignal.timeout(60000)});
 if(!response.ok)throw Error('hosting_'+method+'_'+response.status);if(binary)return {};return response.json();
};
if(opts['--verify']){await verifyLiveBaseline(request,plan);console.log(JSON.stringify({verified:true,published:false,project:plan.project,site:plan.site,baseline:plan.baselineVersion,planSha256:sha256(planBytes),fileCount:Object.keys(plan.files).length}));}
else console.log(JSON.stringify(await publishAuthOnly({plan,request,bodies})));
