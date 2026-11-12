import {runAccountDeletionWorker,SYNTHETIC_WORKER_CONFIRMATION} from '../server/account-deletion-worker.mjs';
import {createSyntheticAccountDeletionWorkerService} from '../server/synthetic-account-deletion-worker.mjs';

async function main(){
  const args=new Map(process.argv.slice(2).map(value=>{
    const match=/^--([a-z-]+)=(.+)$/.exec(value);
    if(!match)throw Error('invalid_worker_argument');
    return [match[1],match[2]];
  }));
  const allowed=new Set(['target','mode','confirm']);
  if([...args.keys()].some(key=>!allowed.has(key)))throw Error('invalid_worker_argument');
  const target=args.get('target'),mode=args.get('mode');
  if(target!=='synthetic-fixture')throw Error('target_must_be_synthetic_fixture');
  if(!['dry-run','execute'].includes(mode))throw Error('mode_must_be_explicit');
  const fixture=createSyntheticAccountDeletionWorkerService(),events=[];
  const result=await runAccountDeletionWorker({service:fixture.service,target,mode,confirmation:args.get('confirm'),logger:event=>events.push(event)});
  for(const event of events)process.stdout.write(`${JSON.stringify(event)}\n`);
  if(!result.ok)throw Error(result.error);
}

main().catch(error=>{
  const known=new Set(['invalid_worker_argument','target_must_be_synthetic_fixture','mode_must_be_explicit','explicit_fixture_confirmation_required','worker_target_not_allowed','worker_mode_required','invalid_worker_limit','synthetic_service_required']);
  process.stderr.write(`${known.has(error?.message)?error.message:'worker_failed'}\n`);
  process.exitCode=1;
});
