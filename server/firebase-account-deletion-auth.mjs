const validUid=value=>typeof value==='string'&&value.length>0&&value.length<=128;
const validAccountId=value=>typeof value==='string'&&value.length>0&&value.length<=128;

// Verifies a Firebase ID token and resolves its account entirely on the server.
// The browser never supplies the UID or account ID used by the deletion service.
export function createFirebaseAccountDeletionAuthenticator({verifyIdToken,resolveAccount,projectId='ailandgames',now=Date.now,maxRecentAuthSeconds=300}={}){
  if(typeof verifyIdToken!=='function'||typeof resolveAccount!=='function'||projectId!=='ailandgames'||typeof now!=='function'||!Number.isInteger(maxRecentAuthSeconds)||maxRecentAuthSeconds<60||maxRecentAuthSeconds>900)throw Error('firebase_account_deletion_auth_not_configured');
  return async function authenticateAccountDeletion(request){
    const headers=request?.headers||{},authorization=headers.authorization||headers.Authorization||'';
    const match=typeof authorization==='string'?/^Bearer ([A-Za-z0-9._~-]{1,12000})$/.exec(authorization):null;
    if(!match)return null;
    let claims;
    try{claims=await verifyIdToken(match[1],true);}catch{return null;}
    const uid=claims?.uid,provider=claims?.firebase?.sign_in_provider;
    if(!validUid(uid)||claims.aud!==projectId||claims.iss!==`https://securetoken.google.com/${projectId}`||!Number.isFinite(claims.exp)||claims.exp*1000<=now()||!['oidc.line','google.com','password'].includes(provider))return null;
    if(provider==='password'&&claims.email_verified!==true)return null;
    let accountId;
    try{accountId=await resolveAccount(uid);}catch{return null;}
    if(!validAccountId(accountId))return null;
    const authAgeSeconds=Math.floor(now()/1000)-claims.auth_time;
    return Object.freeze({verified:true,uid,accountId,reauthenticated:Number.isInteger(claims.auth_time)&&authAgeSeconds>=0&&authAgeSeconds<=maxRecentAuthSeconds});
  };
}
