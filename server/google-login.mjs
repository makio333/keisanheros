import {createHash,randomBytes} from 'node:crypto';
import {OAuth2Client} from 'google-auth-library';
const hash=value=>createHash('sha256').update(value).digest('hex');
const fail=code=>{throw Error(code);};
export function createGoogleLogin({clientId,clientSecret,redirectUri,store,fetchImpl=fetch,now=Date.now,verifyIdToken}){
  if(!clientId||!clientSecret||!redirectUri)fail('google_not_configured');
  const uri=new URL(redirectUri);
  if(uri.username||uri.password||uri.hash||uri.protocol!=='https:'&&!(uri.protocol==='http:'&&['localhost','127.0.0.1'].includes(uri.hostname)))fail('unsafe_callback');
  for(const name of ['putAttempt','consumeAttempt','getAuthenticatedAccount','resolveIdentity'])if(typeof store?.[name]!=='function')fail('auth_store_not_configured');
  const client=new OAuth2Client(clientId);
  const verify=verifyIdToken|| (async token=>(await client.verifyIdToken({idToken:token,audience:clientId})).getPayload());
  const browserHash=id=>{if(typeof id!=='string'||id.length<32||id.length>256)fail('invalid_browser_session');return hash(id);};
  return {
    async begin({browserSessionId,intent='login'}){
      const binding=browserHash(browserSessionId);
      if(!['login','link'].includes(intent))fail('invalid_login_intent');
      const accountId=intent==='link'?await store.getAuthenticatedAccount(browserSessionId):null;
      if(intent==='link'&&!accountId)fail('link_requires_authenticated_account');
      const state=randomBytes(32).toString('hex'),nonce=randomBytes(32).toString('hex'),verifier=randomBytes(48).toString('base64url');
      await store.putAttempt('google:'+hash(state),{browserHash:binding,nonce,verifier,accountId,intent,expiresAt:now()+300000});
      const url=new URL('https://accounts.google.com/o/oauth2/v2/auth');
      url.search=new URLSearchParams({client_id:clientId,redirect_uri:redirectUri,response_type:'code',scope:'openid email',state,nonce,code_challenge:createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256',prompt:'select_account'});
      return {authorizationUrl:url.href};
    },
    async complete({browserSessionId,state,code,error}){
      const binding=browserHash(browserSessionId);
      if(typeof state!=='string'||!/^[a-f0-9]{64}$/.test(state))fail('invalid_login_state');
      const attempt=await store.consumeAttempt('google:'+hash(state),binding,now());
      if(!attempt||attempt.expiresAt<=now()||attempt.browserHash!==binding)fail('invalid_login_state');
      if(error)fail('google_login_cancelled');
      if(typeof code!=='string'||!code||code.length>2048)fail('invalid_login_code');
      if(attempt.intent==='link'&&await store.getAuthenticatedAccount(browserSessionId)!==attempt.accountId)fail('link_session_changed');
      let claims;
      try{
        const response=await fetchImpl('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'authorization_code',client_id:clientId,client_secret:clientSecret,redirect_uri:redirectUri,code,code_verifier:attempt.verifier}),redirect:'error',signal:AbortSignal.timeout(10000)});
        if(!response.ok)fail('google_verification_failed');
        const result=await response.json();if(typeof result.id_token!=='string')fail('google_verification_failed');
        claims=await verify(result.id_token);
      }catch{fail('google_verification_failed');}
      if(!claims||!['https://accounts.google.com','accounts.google.com'].includes(claims.iss)||claims.aud!==clientId||claims.azp&&claims.azp!==clientId||claims.nonce!==attempt.nonce||typeof claims.sub!=='string'||!claims.sub||claims.sub.length>256||!Number.isFinite(claims.exp)||claims.exp*1000<=now()||!Number.isFinite(claims.iat)||claims.iat*1000>now()+60000)fail('invalid_google_identity');
      // Provider subject identifies a person; matching email addresses never merge accounts.
      return store.resolveIdentity({provider:'google',providerId:'accounts.google.com',subject:claims.sub,linkAccountId:attempt.accountId});
    },
  };
}
