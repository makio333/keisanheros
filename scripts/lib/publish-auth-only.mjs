import {gzipSync} from 'node:zlib';
import {BASELINE_VERSION,hostingHash} from './auth-only-artifact.mjs';
const SITE='sites/legend-heroes2',API='https://firebasehosting.googleapis.com/v1beta1/';
export async function verifyLiveBaseline(request,plan){
 const latest=await request('GET',API+SITE+'/releases?pageSize=1');
 if(latest.releases?.[0]?.version?.name!==BASELINE_VERSION||latest.releases[0].name!==plan.baselineRelease)throw Error('live_release_changed');
 const site=await request('GET',API+'projects/ailandgames/'+SITE);
 if(site.name!=='projects/ailandgames/sites/legend-heroes2'&&site.name!=='projects/255137807181/sites/legend-heroes2')throw Error('wrong_hosting_project');
 return true;
}
export async function publishAuthOnly({plan,request,bodies}){
 if(plan.project!=='ailandgames'||plan.site!=='legend-heroes2'||plan.baselineVersion!==BASELINE_VERSION)throw Error('wrong_target');
 await verifyLiveBaseline(request,plan);
 const version=await request('POST',API+SITE+'/versions',{config:plan.config});
 if(!/^sites\/legend-heroes2\/versions\/[a-zA-Z0-9-]+$/.test(version.name))throw Error('invalid_created_version');
 const populated=await request('POST',API+version.name+':populateFiles',{files:plan.files});
 if(populated.uploadUrl!==`https://upload-firebasehosting.googleapis.com/upload/${version.name}/files`)throw Error('unsafe_upload_url');
 for(const hash of populated.uploadRequiredHashes||[]){
  const body=bodies.get(hash);if(!body||hostingHash(body)!==hash)throw Error('required_file_body_unavailable');
  await request('POST',populated.uploadUrl+'/'+hash,gzipSync(body,{level:9}),true);
 }
 await request('PATCH',API+version.name+'?updateMask=status,config',{status:'FINALIZED',config:plan.config});
 // Detect an intervening operator release before changing live.
 await verifyLiveBaseline(request,plan);
 const release=await request('POST',API+SITE+'/releases?versionName='+encodeURIComponent(version.name),{message:'Auth-only: same-origin Firebase auth, mobile LINE browser login, auth helper worker bypass'});
 if(release.version?.name!==version.name)throw Error('release_response_unconfirmed');
 const latest=await request('GET',API+SITE+'/releases?pageSize=1');
 if(latest.releases?.[0]?.version?.name!==version.name)throw Error('release_not_current');
 return {version:version.name,release:release.name};
}
