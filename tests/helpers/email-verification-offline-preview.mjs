import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {startSalesPreview} from './sales-preview.mjs';
import {assertEmailVerificationOfflineProfile} from '../../scripts/lib/email-verification-offline.mjs';

const profilePath=fileURLToPath(new URL('../../config/email-verification-offline.json',import.meta.url));
export const offlineEmailProfile=Object.freeze(JSON.parse(await readFile(profilePath,'utf8')));

export async function startOfflineEmailVerificationPreview({directory,emailState='pending'}={}){
  const guard=assertEmailVerificationOfflineProfile(offlineEmailProfile,{environmentKeys:Object.keys(process.env)});
  const preview=await startSalesPreview({directory,mock:true,port:0,emailState,salesEnabled:guard.salesEnabled});
  return Object.freeze({...preview,profile:offlineEmailProfile});
}
