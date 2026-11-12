import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {startOfflineEmailVerificationPreview} from '../tests/helpers/email-verification-offline-preview.mjs';

if(process.argv.length!==3||process.argv[2]!=='--mock')throw Error('Run only with --mock; this is an offline fixture, not an Auth or sales deployment.');
const directory=await mkdtemp(path.join(tmpdir(),'legend-email-verification-offline-'));
let preview;
try{
  preview=await startOfflineEmailVerificationPreview({directory,emailState:'pending'});
  console.log(`Offline email verification preview: ${preview.url}`);
  console.log('Auth fixture only; email sending, real Firebase, Stripe, Checkout and webhooks are disabled. Local data directory: '+directory);
  console.log('Press Ctrl+C to stop and remove the isolated local data.');
  await new Promise(resolve=>{
    const stop=()=>resolve();
    process.once('SIGINT',stop);process.once('SIGTERM',stop);
  });
}finally{
  if(preview)await preview.close();
  await rm(directory,{recursive:true,force:true});
}
