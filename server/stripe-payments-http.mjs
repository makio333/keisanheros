import {logSafeApiFailure} from './safe-api-logging.mjs';

export function createStripePaymentHandler({payments,origin,rateLimiter}){
  const cookieName=new URL(origin).protocol==='https:'?'__Host-legend-session':'legend-local-session';
  const reply=(res,status,body,headers={})=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers});res.end(JSON.stringify(body));};
  return async(req,res)=>{
    const route=new URL(req.url,origin).pathname;
    const listing=route==='/api/payments/products';
    const statusRoute=route==='/api/payments/status';
    if(route==='/api/payments/legal'){if(req.method!=='GET')reply(res,405,{error:'method_not_allowed'});else reply(res,200,payments.legalReferences());return true;}
    const cancelling=route==='/api/payments/checkout/cancel';
    if(!listing && !statusRoute && !cancelling && !['/api/payments/checkout','/api/payments/stripe/webhook'].includes(route))return false;
    if(req.method!==(listing||statusRoute?'GET':'POST')){reply(res,405,{error:'method_not_allowed'});return true;}
    if(!listing && !statusRoute && !route.endsWith('/webhook') && req.headers.origin!==origin){reply(res,403,{error:'invalid_origin'});return true;}
    try{
      let result;
      if(route.endsWith('/webhook')){
        const chunks=[];let size=0;
        for await(const chunk of req){size+=chunk.length;if(size>1024*1024)throw Error('body_too_large');chunks.push(chunk);}
        result=await payments.webhook(Buffer.concat(chunks),req.headers['stripe-signature']);
      }else{
        const cookies=String(req.headers.cookie||'').split(';').map(v=>v.trim()).filter(v=>v.startsWith(cookieName+'='));
        const session=cookies.length===1?cookies[0].slice(cookieName.length+1):'';
        if(statusRoute)result=await payments.checkoutStatus(session);
        else if(listing)result=await payments.listProducts(session);
        else{
          let productId;
          if(!cancelling){
            const chunks=[];let size=0;
            for await(const chunk of req){size+=chunk.length;if(size>2048)throw Error('body_too_large');chunks.push(chunk);}
            let body={};try{if(size)body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw Error('invalid_json');}
            if(!body || typeof body!=='object' || Array.isArray(body) || body.productId!==undefined && typeof body.productId!=='string')throw Error('invalid_json');
            productId=body.productId;
          }
          if(rateLimiter){
            // Resolve the verified account from the server-side session so multiple
            // devices share a limit; never key this by a shared household/school IP.
            const account=await payments.accounts.summary(session);
            const attempt=await rateLimiter.consume(cancelling?'payment.cancel':'payment.checkout',account.accountId);
            if(!attempt.allowed){
              reply(res,429,{error:'rate_limited',retryAfterSeconds:attempt.retryAfterSeconds},{'Retry-After':String(attempt.retryAfterSeconds)});
              return true;
            }
          }
          const bearer=typeof req.headers.authorization==='string'?/^Bearer ([A-Za-z0-9._-]{1,12000})$/.exec(req.headers.authorization)?.[1]:undefined;
          result=cancelling?await payments.cancelCheckout(session):await payments.checkout(session,productId,bearer);
        }
      }
      reply(res,200,result);
    }catch(error){
      const codes={authentication_required:401,account_disabled:401,account_not_found:401,already_purchased:409,purchase_changed:409,checkout_in_progress:409,payment_processing:409,unsupported_upgrade:409,email_verification_required:403,email_verification_refresh_required:409,email_identity_mismatch:403,email_verification_not_configured:503,adult_manager_acknowledgement_required:403,invalid_product:400,invalid_json:400,invalid_stripe_signature:400,stripe_mode_mismatch:400,invalid_stripe_checkout:400,body_too_large:413};
      codes.facility_account_managed=403;
      const status=codes[error.message]||503;
      const headers=status===503?{'X-Request-Id':logSafeApiFailure({request:req})}:{};
      reply(res,status,{error:status===503?'payment_service_unavailable':error.message},headers);
    }
    return true;
  };
}
