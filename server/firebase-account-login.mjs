import {createHash,randomBytes} from 'node:crypto';
import {logSafeApiFailure} from './safe-api-logging.mjs';

// Server-side bridge for the Firebase identity already used by the published game.
// All collaborators are injected: no credentials, network calls, or migration run on import.
export function createFirebaseAccountLogin({verifyIdToken,getUser,store,sessions,rateLimiter,emailVerification,isAccountDeletionBlocked,projectId='ailandgames',emulatorOnly=false,readPrivateSaves,facilityUids=[],migrationEnabled=false,now=Date.now}) {
  const allowedProject=projectId==='ailandgames'||emulatorOnly===true&&projectId==='demo-email-verification';
  if(!allowedProject||typeof verifyIdToken!=='function')throw Error('firebase_login_not_configured');
  const facilities=new Set(facilityUids);
  return async function login(idToken,currentSessionId){
    if(typeof idToken!=='string'||!idToken||idToken.length>12000)throw Error('authentication_required');
    let claims;try{claims=await verifyIdToken(idToken,true);}catch{throw Error('authentication_required');}
    const uid=claims?.uid,provider=claims?.firebase?.sign_in_provider;
    if(typeof uid!=='string'||!uid||uid.length>128||claims.aud!==projectId||claims.iss!==`https://securetoken.google.com/${projectId}`||!Number.isFinite(claims.exp)||claims.exp*1000<=now()||!['oidc.line','google.com','password'].includes(provider)||!emailVerification&&provider==='password'&&claims.email_verified!==true)throw Error('authentication_required');
    if(typeof isAccountDeletionBlocked==='function'){
      let blocked;try{blocked=await isAccountDeletionBlocked(uid);}catch{throw Error('account_deletion_status_unavailable');}
      if(blocked===true)throw Error('account_deletion_in_progress');
    }
    if(rateLimiter){
      const attempt=await rateLimiter.consume('auth.firebase.session',uid);
      if(!attempt.allowed){const error=Error('login_rate_limited');error.retryAfterSeconds=attempt.retryAfterSeconds;throw error;}
    }
    const registration=emailVerification?await emailVerification.statusForClaims(claims):null;
    if(registration?.state==='pending')throw Error('email_verification_required');
    const identityKey=JSON.stringify(['firebase',projectId,uid]);
    const existingId=await store.transaction(async tx=>{const identity=await tx.getIdentity(identityKey);return typeof identity==='string'?identity:identity?.accountId;});
    let accountCreatedAt;
    if(!existingId&&typeof getUser==='function'){
      let user;try{user=await getUser(uid);}catch{throw Error('account_registration_metadata_unavailable');}
      const createdAt=Date.parse(user?.metadata?.creationTime||'');
      if(!Number.isSafeInteger(createdAt)||createdAt<0||createdAt>now())throw Error('account_registration_metadata_unavailable');
      accountCreatedAt=createdAt;
    }
    const current=currentSessionId?await sessions.get(currentSessionId,now()):null;
    if(current?.accountId&&current.accountId!==existingId)throw Error('account_switch_requires_logout');
    const {accountId}=await store.auth.resolveIdentity({provider:'firebase',providerId:projectId,subject:uid,accountCreatedAt});
    let imported=0;
    if(readPrivateSaves&&!migrationEnabled&&(await readPrivateSaves(uid)).length)throw Error('migration_not_ready');
    if(migrationEnabled&&readPrivateSaves){
      const rows=await readPrivateSaves(uid);
      if(!Array.isArray(rows)||rows.length>200)throw Error('migration_file_too_large');
      const source=rows.map(row=>{
        if(row.ownerUid!==uid||typeof row.id!=='string'||!row.id||row.id.length>128||!Number.isSafeInteger(row.revision)||row.revision<1||typeof row.gameData!=='string'||Buffer.byteLength(row.gameData)>850000)throw Error('invalid_save');
        let gameState;try{gameState=JSON.parse(row.gameData);}catch{throw Error('invalid_save');}
        if(!gameState?.player||typeof gameState!=='object'||Array.isArray(gameState))throw Error('invalid_save');
        const digest=createHash('sha256').update(JSON.stringify([projectId,uid,row.id])).digest('hex');
        return {row,gameState,key:`typing_rpg_save_v3::${digest}`,ledger:`firebaseTransfers/${digest}`,hash:createHash('sha256').update(row.gameData).digest('hex')};
      });
      if(new Set(source.map(row=>row.key)).size!==source.length)throw Error('invalid_save');
      imported=await store.transaction(async tx=>{
        const prepared=await Promise.all(source.map(async item=>({...item,prior:await tx.getSave(item.key),transfer:await tx.getGameDocument(item.ledger)})));
        const owner=await tx.getAccount(accountId);let count=0;
        for(const item of prepared){
          if(item.transfer){
            if(item.transfer.accountId!==accountId||item.transfer.sourceRevision!==item.row.revision||item.transfer.hash!==item.hash||!item.prior||item.prior.ownerAccountId!==accountId)throw Error('firebase_source_changed');
            continue; // Never replace progressed server saves with the old Firebase snapshot.
          }
          if(item.prior)throw Error('save_revision_conflict');
          tx.putSave({key:item.key,ownerAccountId:accountId,name:String(item.gameState.playerName||'プレイヤー').slice(0,40),gameState:item.gameState,revision:1,createdAt:now(),updatedAt:now()});
          tx.putGameDocument(item.ledger,{accountId,sourceRevision:item.row.revision,hash:item.hash,importedAt:now()});count++;
        }
        if(facilities.has(uid)&&!owner.facilityAccess)tx.putAccount({...owner,facilityAccess:{kind:'legacy-migration',active:true,saveLimit:Math.max(3,source.length),grantedAt:now()}});
        return count;
      });
    }
    const sessionId=randomBytes(32).toString('hex'),session={accountId,expiresAt:now()+8*60*60*1000};
    if(current)await sessions.rotate(currentSessionId,sessionId,session);else await sessions.create(sessionId,session);
    return {sessionId,accountId,imported,registrationState:registration?.state||null};
  };
}

export function createFirebaseAccountLoginHandler({login,origin,logFailure=logSafeApiFailure}){
  const site=new URL(origin),secure=site.protocol==='https:';
  if(site.origin!==origin||!secure&&!(['localhost','127.0.0.1'].includes(site.hostname)&&site.protocol==='http:'))throw Error('unsafe_auth_origin');
  const cookieName=secure?'__Host-legend-session':'legend-local-session';
  return async(req,res)=>{
    if(new URL(req.url,origin).pathname!=='/api/auth/firebase/session')return false;
    const reply=(status,body,headers={})=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers});res.end(JSON.stringify(body));};
    if(req.method!=='POST'){reply(405,{error:'method_not_allowed'});return true;}
    if(req.headers.origin!==origin){reply(403,{error:'invalid_origin'});return true;}
    try{
      if(req.headers['content-type']?.split(';')[0]!=='application/json')throw Error('invalid_json');
      const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>16000)throw Error('body_too_large');chunks.push(chunk);}
      let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw Error('invalid_json');}
      const cookies=String(req.headers.cookie||'').split(';').map(value=>value.trim()).filter(value=>value.startsWith(cookieName+'='));
      const current=cookies.length===1?cookies[0].slice(cookieName.length+1):null;
      const result=await login(body?.idToken,current);
      reply(200,{authenticated:true,imported:result.imported},{'Set-Cookie':`${cookieName}=${result.sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=28800${secure?'; Secure':''}`});
    }catch(error){
      const codes={authentication_required:401,account_disabled:401,account_deletion_in_progress:403,email_verification_required:403,login_rate_limited:429,account_switch_requires_logout:409,migration_not_ready:409,firebase_source_changed:409,save_revision_conflict:409,invalid_json:400,invalid_save:400,body_too_large:413,migration_file_too_large:413};
      const status=codes[error.message]||503,headers={};
      if(status===429&&Number.isSafeInteger(error.retryAfterSeconds)){headers['Retry-After']=String(error.retryAfterSeconds);}
      if(status===503)headers['X-Request-Id']=logFailure({request:req});
      reply(status,{error:status===429?'rate_limited':status===503?'login_unavailable':error.message,...(status===429&&Number.isSafeInteger(error.retryAfterSeconds)?{retryAfterSeconds:error.retryAfterSeconds}:{})},headers);
    }
    return true;
  };
}
