import {Readable} from 'node:stream';
import {createSalesPreparationRuntime} from './sales-preparation-runtime.mjs';
import {createSalesRequestBudget} from './sales-request-budget.mjs';
import {createEmailVerificationService} from './email-verification.mjs';
import {createFirebaseAccountLogin,createFirebaseAccountLoginHandler} from './firebase-account-login.mjs';
import {createDurableRateLimiter} from './durable-rate-limiter.mjs';
import {createSalesDisabledIntegration} from './sales-disabled-integration.mjs';
import {createAccountSaveHandler} from './account-saves-http.mjs';
import {createAccountGameHandler} from './account-game-http.mjs';
import {createAccountGameService} from './account-game-service.mjs';

const TARGET={projectId:'ailandgames',origin:'https://legend-heroes2.web.app'};
const canonical=value=>typeof value==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString()===value;
const reply=(res,status,body,headers={})=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers});res.end(JSON.stringify(body));};
const sessionId=req=>{const rows=String(req.headers?.cookie||'').split(';').map(v=>v.trim()).filter(v=>v.startsWith('__Host-legend-session='));return rows.length===1?rows[0].slice('__Host-legend-session='.length):'';};

// Importing this entry does not initialize SDKs, read environment/credentials,
// create a socket or execute a provider. A boot host injects prechecked objects.
export function createSalesReleaseEntry({configuration={},dependencies={},now=Date.now}={}){
  const cfg=configuration,problems=[];
  if(cfg.enabled!==true)problems.push('sales_release_disabled');
  if(cfg.projectId!==TARGET.projectId||cfg.origin!==TARGET.origin)problems.push('sales_release_target_required');
  if(!canonical(cfg.emailPolicyStartAt)||!canonical(cfg.complimentaryAccountCutoff))problems.push('sales_release_cutovers_required');
  if(!['rehearsal','production'].includes(cfg.stage)||!['disabled','live'].includes(cfg.salesMode))problems.push('sales_release_mode_required');
  if(cfg.stage==='rehearsal'&&(dependencies.profile!=='synthetic'||cfg.salesMode!=='disabled'))problems.push('synthetic_rehearsal_required');
  if(cfg.requestLimits!==undefined&&(!cfg.requestLimits||Array.isArray(cfg.requestLimits)||typeof cfg.requestLimits!=='object'||Object.keys(cfg.requestLimits).some(key=>!['maxPerMinute','maxInFlight'].includes(key))))problems.push('sales_release_request_limits_invalid');
  if(cfg.stage==='production'){
    for(const key of ['exactTargetApproved','costsApproved','identityAndSaveInventoryVerified','legalPagesReviewed','senderVerified','retentionPolicyApproved'])if(cfg.approvals?.[key]!==true)problems.push('sales_release_pending:'+key);
    if(dependencies.profile!=='approved-production-adapters'||!dependencies.deletionRuntime||dependencies.mail?.ready!==true)problems.push('production_adapters_not_ready');
  }
  if(typeof dependencies.store?.transaction!=='function'||typeof dependencies.auth?.verifyIdToken!=='function'||typeof dependencies.auth?.getUser!=='function'||typeof dependencies.readPrivateSaves!=='function'||typeof dependencies.isUidBlocked!=='function'||typeof dependencies.isAccountIdBlocked!=='function')problems.push('sales_release_dependencies_required');
  if(cfg.salesMode==='live'&&typeof dependencies.createPayments!=='function')problems.push('live_payment_adapter_required');
  if(problems.length)return Object.freeze({ready:false,blockers:[...new Set(problems)],published:false,handler:async(_req,res)=>reply(res,503,{error:'sales_release_unavailable'})});

  const {store,auth}=dependencies,origin=cfg.origin;
  const verifyIdToken=(token,revoked)=>auth.verifyIdToken(token,revoked);
  const emailVerification=createEmailVerificationService({store,verifyIdToken,getUser:uid=>auth.getUser(uid),projectId:cfg.projectId,policyStartAt:cfg.emailPolicyStartAt,now});
  const rateLimiter=createDurableRateLimiter({store,now});
  const preparation=createSalesPreparationRuntime({emailCutover:{enabled:true,projectId:cfg.projectId,origin,policyStartAt:cfg.emailPolicyStartAt,previousPolicyStartAt:cfg.previousEmailPolicyStartAt},emailVerification,
    mail:{...dependencies.mail,enabled:cfg.mailEnabled===true},deletionRuntime:dependencies.deletionRuntime,authenticateDeletion:dependencies.authenticateDeletion});
  const login=createFirebaseAccountLoginHandler({origin,login:createFirebaseAccountLogin({store,sessions:store.sessions,verifyIdToken,getUser:uid=>auth.getUser(uid),emailVerification,rateLimiter,projectId:cfg.projectId,
    isAccountDeletionBlocked:dependencies.isUidBlocked,migrationEnabled:true,readPrivateSaves:dependencies.readPrivateSaves,now})});
  const payments=cfg.salesMode==='live'?dependencies.createPayments({store,sessions:store.sessions,origin,emailVerification,rateLimiter,now}):createSalesDisabledIntegration({store,sessions:store.sessions,origin,complimentarySaveLimit:3,complimentaryAccountCutoff:Date.parse(cfg.complimentaryAccountCutoff),now});
  if(typeof payments?.accounts?.summary!=='function'||typeof payments.handler!=='function')throw Error('sales_release_payment_adapter_invalid');
  const saves=createAccountSaveHandler({service:payments.accounts,origin});
  const originalGame=dependencies.gameService||createAccountGameService({store,now});
  const game=createAccountGameHandler({origin,service:{call:async(id,body)=>{
    if(body?.api==='AdminGiftAPI')throw Error('invalid_game_request'); // Includes administrators and permissions/listTargets.
    return originalGame.call(id,body);
  }}});
  const budget=createSalesRequestBudget({...cfg.requestLimits,now});
  async function buffer(req,limit){
    const declared=req.headers?.['content-length'];
    if(declared!==undefined&&(!/^\d+$/.test(String(declared))||Number(declared)>limit))throw Error('body_too_large');
    const chunks=[];let bytes=0;
    for await(const chunk of req){const part=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);bytes+=part.length;if(bytes>limit)throw Error('body_too_large');chunks.push(part);}
    const copy=Readable.from(chunks);Object.assign(copy,{url:req.url,method:req.method,headers:req.headers});return copy;
  }
  return Object.freeze({ready:true,published:false,productionVerified:false,stage:cfg.stage,preparation,requestLimits:budget.limits,
    async handler(request,res){
      const permit=budget.enter();if(!permit.allowed){reply(res,429,{error:'request_rate_limited'},{'Retry-After':String(permit.retryAfterSeconds)});return;}
      try{
        const route=new URL(request.url,origin).pathname;
        if(route.startsWith('/api/legacy/')||route.startsWith('/api/internal/')||route.startsWith('/api/admin/')||route.startsWith('/api/auth/line/')||route.startsWith('/api/auth/google/')){reply(res,404,{error:'not_found'});return;}
        const known=new Set(['/api/auth/providers','/api/auth/session','/api/auth/logout','/api/auth/firebase/session','/api/auth/email-registration','/api/auth/email-verification-config','/api/auth/email-verification/send','/api/account','/api/account/adult-manager-acknowledgement','/api/account/deletion/plan','/api/account/deletion/confirm','/api/saves','/api/trial/start','/api/payments/products','/api/payments/checkout','/api/payments/checkout/cancel','/api/payments/stripe/webhook','/api/game']);
        if(!known.has(route)&&!/^\/api\/saves\/[^/]+$/.test(route)){reply(res,404,{error:'not_found'});return;}
        if(request.method!=='GET'&&route!=='/api/payments/stripe/webhook'&&request.headers?.origin!==origin){reply(res,403,{error:'invalid_origin'});return;}
        const maxBody=route==='/api/game'||route.startsWith('/api/saves')?2200000:route==='/api/payments/stripe/webhook'?1000000:16000;
        const req=await buffer(request,maxBody);
        if(route==='/api/auth/providers'){reply(res,req.method==='GET'?200:405,req.method==='GET'?{firebase:true,providers:['google.com','oidc.line','password']}:{error:'method_not_allowed'});return;}
        if(route==='/api/auth/logout'){
          if(req.method!=='POST'||req.headers.origin!==origin){reply(res,req.method==='POST'?403:405,{error:'invalid_logout_request'});return;}
          const id=sessionId(req);if(id)await store.sessions.remove(id);
          reply(res,200,{authenticated:false},{'Set-Cookie':'__Host-legend-session=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0'});return;
        }
        const unauthenticated=route.startsWith('/api/auth/')||route==='/api/payments/stripe/webhook'||route.startsWith('/api/account/deletion/');
        if(!unauthenticated){
          const current=await store.sessions.get(sessionId(req),now());
          if(!current?.accountId){reply(res,401,{error:'authentication_required'});return;}
          if(await dependencies.isAccountIdBlocked(current.accountId)){reply(res,403,{error:'account_deletion_in_progress'});return;}
        }
        if(route==='/api/auth/session'){
          const current=await store.sessions.get(sessionId(req),now());
          const authenticated=!!current?.accountId&&!await dependencies.isAccountIdBlocked(current.accountId);
          reply(res,req.method==='GET'?200:405,req.method==='GET'?{authenticated}:{error:'method_not_allowed'});return;
        }
        if(await preparation.handler(req,res)||await login(req,res)||await saves(req,res)||await game(req,res)||await payments.handler(req,res))return;
        reply(res,404,{error:'not_found'});
      }catch(error){
        if(!res.headersSent)reply(res,error.message==='body_too_large'?413:503,{error:error.message==='body_too_large'?'body_too_large':'sales_service_unavailable'});
      }finally{permit.release();}
    },
  });
}

export function startSalesReleaseEntry({createHttpServer,entry,host='127.0.0.1',port=8080,listen=false}={}){
  if(listen!==true)return {started:false,error:'sales_listener_disabled'};
  if(entry?.ready!==true||typeof createHttpServer!=='function'||host!=='127.0.0.1'&&host!=='0.0.0.0'||!Number.isInteger(port)||port<1||port>65535)throw Error('sales_listener_configuration_required');
  const server=createHttpServer(entry.handler);server.listen(port,host);return {started:true,server};
}
