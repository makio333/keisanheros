// Server-only protocol core. Not imported by the Web app or wired to production routes.
import {createHash,randomBytes} from 'node:crypto';

const hash=value=>createHash('sha256').update(value).digest('hex');
const token=()=>randomBytes(32).toString('hex');
const fail=code=>{throw new Error(code);};

export function createLineLogin({channelId,channelSecret,providerId,redirectUri,store,fetchImpl=fetch,now=Date.now}) {
  if(!channelId || !channelSecret || !providerId || !redirectUri)fail('line_not_configured');
  const callback=new URL(redirectUri);
  if(callback.protocol!=='https:' && !(callback.protocol==='http:' && ['localhost','127.0.0.1'].includes(callback.hostname)))fail('unsafe_callback');
  if(callback.hash || callback.username || callback.password)fail('unsafe_callback');
  for(const method of ['putAttempt','consumeAttempt','getAuthenticatedAccount','resolveIdentity'])if(typeof store?.[method]!=='function')fail('auth_store_not_configured');
  const sessionHash=id=>{
    if(typeof id!=='string' || id.length<32 || id.length>256)fail('invalid_browser_session');
    return hash(id);
  };
  async function post(url,body) {
    try {
      const response=await fetchImpl(url,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(body),redirect:'error',signal:AbortSignal.timeout(10000)});
      if(!response.ok)fail('line_verification_failed');
      return await response.json();
    }catch{fail('line_verification_failed');}
  }
  return {
    async begin({browserSessionId,intent='login',preferQr=false}) {
      const browserHash=sessionHash(browserSessionId);
      if(!['login','link'].includes(intent))fail('invalid_login_intent');
      const accountId=intent==='link'?await store.getAuthenticatedAccount(browserSessionId):null;
      if(intent==='link' && !accountId)fail('link_requires_authenticated_account');
      const state=token(),nonce=token(),verifier=randomBytes(48).toString('base64url');
      const challenge=createHash('sha256').update(verifier).digest('base64url');
      await store.putAttempt(hash(state),{browserHash,nonce,verifier,accountId,intent,expiresAt:now()+5*60*1000});
      const url=new URL('https://access.line.me/oauth2/v2.1/authorize');
      url.search=new URLSearchParams({response_type:'code',client_id:String(channelId),redirect_uri:redirectUri,state,scope:'openid',nonce,code_challenge:challenge,code_challenge_method:'S256'});
      if(preferQr)url.searchParams.set('initial_amr_display','lineqr');
      if(intent==='link'){url.searchParams.set('prompt','login');url.searchParams.set('max_age','0');}
      return {authorizationUrl:url.href};
    },
    async complete({browserSessionId,state,code,error}) {
      const browserHash=sessionHash(browserSessionId);
      if(typeof state!=='string' || !/^[a-f0-9]{64}$/.test(state))fail('invalid_login_state');
      // The store must atomically check browser binding and expiry, then consume once.
      const attempt=await store.consumeAttempt(hash(state),browserHash,now());
      if(!attempt || attempt.browserHash!==browserHash || attempt.expiresAt<=now())fail('invalid_login_state');
      if(error)fail('line_login_cancelled');
      if(typeof code!=='string' || !code || code.length>2048)fail('invalid_login_code');
      if(attempt.intent==='link' && await store.getAuthenticatedAccount(browserSessionId)!==attempt.accountId)fail('link_session_changed');
      const result=await post('https://api.line.me/oauth2/v2.1/token',{
        grant_type:'authorization_code',code,redirect_uri:redirectUri,client_id:String(channelId),client_secret:channelSecret,code_verifier:attempt.verifier,
      });
      if(typeof result.id_token!=='string' || !result.id_token)fail('line_verification_failed');
      // Use LINE's server verification endpoint; never trust a client-decoded JWT/profile.
      const claims=await post('https://api.line.me/oauth2/v2.1/verify',{id_token:result.id_token,client_id:String(channelId),nonce:attempt.nonce});
      if(claims.iss!=='https://access.line.me' || claims.aud!==String(channelId) || claims.nonce!==attempt.nonce ||
        !Number.isFinite(claims.exp) || claims.exp*1000<=now() || !Number.isFinite(claims.iat) || claims.iat*1000>now()+60000 ||
        typeof claims.sub!=='string' || !claims.sub || claims.sub.length>256)fail('invalid_line_identity');
      if(attempt.intent==='link' && (!Number.isFinite(claims.auth_time) || claims.auth_time*1000<now()-5*60*1000 || claims.auth_time*1000>now()+60000))fail('link_requires_recent_line_login');
      // Transactional mapping owns internal IDs. Names/emails and save-slot IDs are not identity proofs.
      const identity=await store.resolveIdentity({provider:'line',providerId,subject:claims.sub,linkAccountId:attempt.accountId});
      return {accountId:identity.accountId,created:identity.created};
    },
  };
}
