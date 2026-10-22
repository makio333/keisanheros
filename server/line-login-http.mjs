import {randomBytes} from 'node:crypto';

// Node HTTP adapter. The caller supplies a durable, expiring session store and the protocol core.
export function createLineLoginHandler({login, sessions, origin, callbackPath='/api/auth/line/callback', startPath='/api/auth/line/start', sharedRoutes=true, now=Date.now}) {
  const site=new URL(origin);
  const secure=site.protocol==='https:';
  if(site.origin!==origin || (!secure && !(site.protocol==='http:' && ['localhost','127.0.0.1'].includes(site.hostname))))throw Error('unsafe_auth_origin');
  if(!/^\/[a-zA-Z0-9/_-]+$/.test(callbackPath))throw Error('invalid_callback_path');
  for(const method of ['get','create','rotate','remove'])if(typeof sessions?.[method]!=='function')throw Error('session_store_not_configured');
  const cookieName=secure?'__Host-legend-session':'legend-local-session';
  const ttl=8*60*60*1000;
  const cookie=(id,maxAge=ttl/1000)=>`${cookieName}=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure?'; Secure':''}`;
  const newId=()=>randomBytes(32).toString('hex');
  function reply(res,status,body,headers={}) {
    res.writeHead(status,{'Cache-Control':'no-store','Pragma':'no-cache','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Content-Type':'application/json; charset=utf-8',...headers});
    res.end(JSON.stringify(body));
  }
  return async function handle(req,res) {
    const url=new URL(req.url,origin);
    const start=url.pathname===startPath, callback=url.pathname===callbackPath;
    const session=sharedRoutes&&url.pathname==='/api/auth/session', logout=sharedRoutes&&url.pathname==='/api/auth/logout';
    if(!start && !callback && !session && !logout)return false;
    if(req.method!==(start||logout?'POST':'GET')){reply(res,405,{error:'method_not_allowed'},{Allow:start||logout?'POST':'GET'});return true;}
    if((start||logout) && req.headers.origin!==origin){reply(res,403,{error:'invalid_origin'});return true;}
    const matches=String(req.headers.cookie||'').split(';').map(v=>v.trim()).filter(v=>v.startsWith(cookieName+'='));
    const candidate=matches.length===1?matches[0].slice(cookieName.length+1):'';
    const browserId=/^[a-f0-9]{64}$/.test(candidate)?candidate:null;
    try {
      const current=browserId?await sessions.get(browserId,now()):null;
      if(session){reply(res,200,{authenticated:!!current?.accountId});return true;}
      if(logout){if(browserId)await sessions.remove(browserId);reply(res,200,{authenticated:false},{'Set-Cookie':cookie('',0)});return true;}
      if(start){
        const intent=url.searchParams.get('intent')||'login';
        if(!['login','link'].includes(intent)){reply(res,400,{error:'invalid_login_intent'});return true;}
        if(intent==='link' && !current?.accountId){reply(res,401,{error:'login_required'});return true;}
        // Do not replace an authenticated account silently; explicit linking must prove both identities.
        if(intent==='login' && current?.accountId){reply(res,409,{error:'already_authenticated'});return true;}
        const id=current?browserId:newId();
        if(!current)await sessions.create(id,{accountId:null,expiresAt:now()+ttl});
        const result=await login.begin({browserSessionId:id,intent,preferQr:url.searchParams.get('qr')==='1'});
        reply(res,200,result,{'Set-Cookie':cookie(id)});return true;
      }
      if(!current){reply(res,400,{error:'login_session_expired'});return true;}
      for(const key of ['state','code','error'])if(url.searchParams.getAll(key).length>1){reply(res,400,{error:'invalid_callback'});return true;}
      const result=await login.complete({browserSessionId:browserId,state:url.searchParams.get('state'),code:url.searchParams.get('code'),error:url.searchParams.get('error')});
      const next=newId();
      // Rotation must atomically invalidate the old ID and persist the verified account ID.
      await sessions.rotate(browserId,next,{accountId:result.accountId,expiresAt:now()+ttl});
      reply(res,303,{ok:true},{Location:'/?login=success','Set-Cookie':cookie(next)});
    }catch(error){
      if(callback)reply(res,303,{ok:false},{Location:['line_login_cancelled','google_login_cancelled'].includes(error.message)?'/?login=cancelled':'/?login=failed'});
      else reply(res,503,{error:'login_unavailable'});
    }
    return true;
  };
}
