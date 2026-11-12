import {createHash} from 'node:crypto';

const fail=code=>{throw Error(code);};
const uidHash=uid=>createHash('sha256').update(uid).digest('hex');
const rejectedTokenCodes=new Set(['auth/argument-error','auth/invalid-id-token','auth/id-token-expired','auth/id-token-revoked','auth/user-disabled','auth/user-not-found']);
const providerAllowed=claims=>['google.com','oidc.line','password'].includes(claims.firebase?.sign_in_provider)&&!(claims.firebase?.sign_in_provider==='password'&&claims.email_verified!==true);

export function createInternalRaidDeletionGuard({db,projectId='ailandgames'}={}){
  if(projectId!=='ailandgames'||typeof db?.collection!=='function')throw Error('internal_raid_deletion_guard_not_configured');
  return async uid=>{
    if(typeof uid!=='string'||!uid||uid.length>128||uid.includes('/'))throw Error('deletion_status_unavailable');
    try{
      const [tombstone,visibility]=await Promise.all([
        db.collection('accountDeletionTombstones').doc(uidHash(uid)).get(),
        db.collection('accountDeletionVisibility').doc(uid).get(),
      ]);
      if(typeof tombstone?.exists!=='boolean'||typeof visibility?.exists!=='boolean')throw Error('invalid_deletion_marker_result');
      // A tombstone remains after purge; the visibility marker blocks access during retention.
      return tombstone.exists||visibility.exists;
    }catch{
      // The raid API must not proceed when it cannot establish deletion status.
      throw Error('deletion_status_unavailable');
    }
  };
}

export function createInternalRaidTokenAuthenticator({auth,projectId='ailandgames'}={}){
  if(projectId!=='ailandgames'||typeof auth?.verifyIdToken!=='function')throw Error('internal_raid_auth_not_configured');
  return async token=>{
    let claims;
    try{claims=await auth.verifyIdToken(token,true);}catch(error){throw Error(rejectedTokenCodes.has(error?.code)?'authentication_required':'token_verification_unavailable');}
    if(claims?.aud!==projectId||claims?.iss!==`https://securetoken.google.com/${projectId}`||typeof claims.uid!=='string'||!claims.uid||!providerAllowed(claims))fail('authentication_required');
    return claims;
  };
}

export function createInternalRaidAccountGuard({isUidBlocked}={}){
  if(typeof isUidBlocked!=='function')throw Error('internal_raid_deletion_guard_not_configured');
  return async uid=>{
    let blocked;
    try{blocked=await isUidBlocked(uid);}catch{throw Error('deletion_status_unavailable');}
    if(typeof blocked!=='boolean')throw Error('deletion_status_unavailable');
    if(blocked)fail('account_deletion_in_progress');
  };
}

export function resolveOwnedSaveIdentity(uid,key){
  if(typeof uid!=='string'||!uid||typeof key!=='string'||key.length>300)fail('invalid_game_request');
  const prefix=`typing_rpg_save_v3::firebase::${encodeURIComponent(uid)}::`;
  if(!key.startsWith(prefix))fail('save_not_found');
  const id=key.slice(prefix.length);
  if(!/^[a-f0-9]{64}$/.test(id))fail('save_not_found');
  return {id,publicKey:'r_'+createHash('sha256').update(`${uid}\0${id}`).digest('hex'),key};
}

export function mapInternalRaidError(error){
  const code=['authentication_required','account_deletion_in_progress','deletion_status_unavailable','token_verification_unavailable','save_not_found','invalid_game_request','body_too_large'].includes(error?.message)?error.message:'raid_service_unavailable';
  const status=code==='authentication_required'?401:code==='account_deletion_in_progress'?403:code==='save_not_found'?404:code==='invalid_game_request'?400:code==='body_too_large'?413:503;
  return {code,status};
}
