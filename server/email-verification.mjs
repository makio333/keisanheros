import {createHash} from 'node:crypto';

const digest=value=>createHash('sha256').update(value).digest('hex');
const providers=new Set(['password','google.com','oidc.line']);

export function createEmailVerificationService({verifyIdToken,getUser,store,projectId='ailandgames',policyStartAt,now=Date.now}){
  const cutoff=typeof policyStartAt==='number'?policyStartAt:/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(policyStartAt||'')?Date.parse(policyStartAt):NaN;
  if(typeof verifyIdToken!=='function'||typeof getUser!=='function'||typeof store?.transaction!=='function'||!Number.isFinite(cutoff)||cutoff<=0||typeof now!=='function')throw Error('email_verification_not_configured');

  async function verifyToken(idToken){
    if(typeof idToken!=='string'||!idToken||idToken.length>12000)throw Error('authentication_required');
    let claims;try{claims=await verifyIdToken(idToken,true);}catch{throw Error('authentication_required');}
    if(typeof claims?.uid!=='string'||!claims.uid||claims.uid.length>128||claims.aud!==projectId||claims.iss!==`https://securetoken.google.com/${projectId}`||!Number.isFinite(claims.exp)||claims.exp*1000<=now()||!providers.has(claims.firebase?.sign_in_provider))throw Error('authentication_required');
    return claims;
  }

  async function inspectClaims(claims){
    let user;try{user=await getUser(claims.uid);}catch(error){if(error?.code==='auth/user-not-found')throw Error('authentication_required');throw Error('email_verification_unavailable');}
    if(user?.uid!==claims.uid)throw Error('authentication_required');
    if(user.disabled)throw Error('account_disabled');
    const createdAt=Date.parse(user.metadata?.creationTime||'');
    if(!Number.isFinite(createdAt))throw Error('email_verification_unavailable');
    const email=typeof user.email==='string'&&user.email.trim()?user.email.trim():null;
    const emailVerified=!!email&&user.emailVerified===true;
    const state=createdAt<cutoff?'legacy':emailVerified?'complete':'pending';
    const uidHash=digest(claims.uid),emailHash=email?digest(email.toLowerCase()):null,key=`emailRegistrations/${uidHash}`;
    const registration=await store.transaction(async tx=>{
      const previous=await tx.getGameDocument(key);
      if(previous?.uidHash&&previous.uidHash!==uidHash)throw Error('email_registration_identity_conflict');
      const next={kind:'email-registration',uidHash,state,emailVerified,hasEmail:!!email,emailHash,accountCreatedAt:createdAt,
        policyStartAt:cutoff,firstSeenAt:previous?.firstSeenAt||now(),completedAt:state==='complete'?(previous?.completedAt||now()):null};
      const same=previous&&['kind','uidHash','state','emailVerified','hasEmail','emailHash','accountCreatedAt','policyStartAt','firstSeenAt','completedAt'].every(field=>previous[field]===next[field]);
      if(!same)tx.putGameDocument(key,next);
      return {state,emailVerified,hasEmail:!!email};
    });
    return {claims,user,...registration};
  }

  async function previouslyRecordedGameplayState(claims){
    const uidHash=digest(claims.uid),key=`emailRegistrations/${uidHash}`;
    const previous=await store.transaction(tx=>tx.getGameDocument(key));
    if(previous?.kind!=='email-registration'||previous.uidHash!==uidHash||!['legacy','complete'].includes(previous.state))throw Error('email_verification_unavailable');
    return {claims,state:previous.state,emailVerified:previous.emailVerified===true,hasEmail:previous.hasEmail===true,stale:true};
  }

  return Object.freeze({
    async status(idToken){return inspectClaims(await verifyToken(idToken));},
    async statusForGameplay(idToken){
      const claims=await verifyToken(idToken);
      try{return await inspectClaims(claims);}catch(error){if(error.message!=='email_verification_unavailable')throw error;return previouslyRecordedGameplayState(claims);}
    },
    async statusForClaims(claims){
      try{return await inspectClaims(claims);}catch(error){if(error.message!=='email_verification_unavailable')throw error;return previouslyRecordedGameplayState(claims);}
    },
    async assertCheckoutEligible({accountId,idToken}){
      const current=await inspectClaims(await verifyToken(idToken));
      if(!current.emailVerified||current.state==='pending')throw Error('email_verification_required');
      if(typeof current.claims.email!=='string'||current.claims.email.toLowerCase()!==current.user.email.toLowerCase()||current.claims.email_verified!==true)throw Error('email_verification_refresh_required');
      const identity=JSON.stringify(['firebase',projectId,current.claims.uid]);
      const owner=await store.transaction(tx=>tx.getIdentity(identity));
      const mapped=typeof owner==='string'?owner:owner?.accountId;
      if(mapped!==accountId)throw Error('email_identity_mismatch');
      return {eligible:true};
    },
  });
}
