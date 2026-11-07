const MAX_BODY_BYTES=4096;
const ROUTES=Object.freeze({plan:'/api/account/deletion/plan',confirm:'/api/account/deletion/confirm'});

function json(res,status,value){
  if(res.headersSent||res.destroyed)return;
  res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  res.end(JSON.stringify(value));
}

async function readJson(req){
  if(req.headers?.['content-type']?.split(';')[0]?.trim()!=='application/json')throw Error('invalid_json');
  const declared=Number(req.headers?.['content-length']);
  if(Number.isFinite(declared)&&declared>MAX_BODY_BYTES)throw Error('body_too_large');
  const chunks=[];let size=0;
  for await(const chunk of req){size+=chunk.length;if(size>MAX_BODY_BYTES)throw Error('body_too_large');chunks.push(chunk);}
  let value;try{value=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw Error('invalid_json');}
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('invalid_json');
  return value;
}

function safePrincipal(value){
  return !!value&&value.verified===true&&typeof value.uid==='string'&&value.uid.length>0&&value.uid.length<=128&&
    typeof value.accountId==='string'&&value.accountId.length>0&&value.accountId.length<=128;
}

// Standalone by design: product-api does not mount this handler. A future caller must
// inject a server-side authenticator that derives the existing account session and
// provider-specific recent reauthentication proof. It must never trust request JSON for
// uid/accountId/resumeVerified. Policy is server-side and defaults to unresolved.
export function createAccountDeletionHandler({service,origin,authenticate,resolvePolicy=async()=>({})}={}){
  if(typeof service?.plan!=='function'||typeof service?.deleteAccount!=='function'||typeof authenticate!=='function'||typeof resolvePolicy!=='function')throw Error('account_deletion_http_not_configured');
  const site=new URL(origin);
  if(site.origin!==origin||(site.protocol!=='https:'&&!(site.protocol==='http:'&&['localhost','127.0.0.1'].includes(site.hostname))))throw Error('unsafe_account_deletion_origin');
  return async function handleAccountDeletion(req,res){
    const url=new URL(req.url,origin),action=url.pathname===ROUTES.plan?'plan':url.pathname===ROUTES.confirm?'confirm':null;
    if(!action)return false;
    if(req.method!=='POST'){json(res,405,{error:'method_not_allowed'});return true;}
    if(req.headers?.origin!==origin){json(res,403,{error:'invalid_origin'});return true;}

    let input;
    try{input=await readJson(req);}catch(error){const status=error.message==='body_too_large'?413:400;json(res,status,{error:error.message==='body_too_large'?'body_too_large':'invalid_json'});return true;}
    const allowedKeys=action==='plan'?[]:['confirmation'];
    if(Object.keys(input).some(key=>!allowedKeys.includes(key))){json(res,400,{error:'unexpected_request_fields'});return true;}
    if(action==='confirm'&&input.confirmation!=='DELETE_MY_ACCOUNT'){json(res,400,{error:'explicit_account_confirmation_required'});return true;}

    let principal,policy;
    try{principal=await authenticate(req,{action});}catch{json(res,401,{error:'authentication_required'});return true;}
    if(!safePrincipal(principal)){json(res,401,{error:'authentication_required'});return true;}
    if(action==='confirm'&&principal.reauthenticated!==true){json(res,403,{error:'recent_account_reauthentication_required'});return true;}
    try{policy=await resolvePolicy(principal);}catch{json(res,503,{error:'deletion_policy_unavailable'});return true;}

    // The authenticated principal is server-produced. The service still checks it against
    // the account resolved from the UID; a mismatch is a blocker and performs no writes.
    const request=Object.freeze({...principal});
    try{
      if(action==='plan'){
        const assessment=await service.plan({request,policy:policy||{}});
        json(res,assessment.ready?200:409,{ready:assessment.ready===true,blockers:assessment.blockers||[],sources:assessment.sources||[]});
        return true;
      }
      const result=await service.deleteAccount({request,policy:policy||{},confirmation:input.confirmation});
      if(result.completed){json(res,200,{completed:true,requestId:result.requestId||null});return true;}
      if(['retention_pending','purging','protection_retry_required','purge_retry_required'].includes(result.state)){
        json(res,202,{completed:false,state:result.state,requestId:result.requestId||null,purgeAfter:result.purgeAfter||null,blockers:result.blockers||[]});return true;
      }
      if(result.state==='retry_required'){json(res,202,{completed:false,state:'retry_required',requestId:result.requestId||null,blockers:result.blockers||[]});return true;}
      json(res,409,{completed:false,blockers:result.blockers||[],sources:result.sources||[]});
    }catch{
      // The caller may have lost the response after the durable tombstone was written.
      // Never clear it here. The server-side retention worker retries due purge work.
      if(!res.headersSent&&!res.destroyed)json(res,503,{error:'account_deletion_unavailable'});
    }
    return true;
  };
}

export const ACCOUNT_DELETION_HTTP_ROUTES=ROUTES;
