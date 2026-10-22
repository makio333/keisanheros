export function createStripePaymentHandler({payments,origin}){
  const cookieName=new URL(origin).protocol==='https:'?'__Host-legend-session':'legend-local-session';
  const reply=(res,status,body)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body));};
  return async(req,res)=>{
    const route=new URL(req.url,origin).pathname;
    const listing=route==='/api/payments/products';
    const cancelling=route==='/api/payments/checkout/cancel';
    if(!listing && !cancelling && !['/api/payments/checkout','/api/payments/stripe/webhook'].includes(route))return false;
    if(req.method!==(listing?'GET':'POST')){reply(res,405,{error:'method_not_allowed'});return true;}
    if(!listing && !route.endsWith('/webhook') && req.headers.origin!==origin){reply(res,403,{error:'invalid_origin'});return true;}
    try{
      let result;
      if(route.endsWith('/webhook')){
        const chunks=[];let size=0;
        for await(const chunk of req){size+=chunk.length;if(size>1024*1024)throw Error('body_too_large');chunks.push(chunk);}
        result=await payments.webhook(Buffer.concat(chunks),req.headers['stripe-signature']);
      }else{
        const cookies=String(req.headers.cookie||'').split(';').map(v=>v.trim()).filter(v=>v.startsWith(cookieName+'='));
        const session=cookies.length===1?cookies[0].slice(cookieName.length+1):'';
        if(listing)result=await payments.listProducts(session);
        else if(cancelling)result=await payments.cancelCheckout(session);
        else{
          const chunks=[];let size=0;
          for await(const chunk of req){size+=chunk.length;if(size>2048)throw Error('body_too_large');chunks.push(chunk);}
          let body={};try{if(size)body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw Error('invalid_json');}
          if(!body || typeof body!=='object' || Array.isArray(body) || body.productId!==undefined && typeof body.productId!=='string')throw Error('invalid_json');
          result=await payments.checkout(session,body.productId);
        }
      }
      reply(res,200,result);
    }catch(error){
      const codes={authentication_required:401,account_not_found:401,already_purchased:409,purchase_changed:409,checkout_in_progress:409,payment_processing:409,unsupported_upgrade:409,invalid_product:400,invalid_json:400,invalid_stripe_signature:400,stripe_mode_mismatch:400,invalid_stripe_checkout:400,body_too_large:413};
      codes.facility_account_managed=403;
      const status=codes[error.message]||503;reply(res,status,{error:status===503?'payment_service_unavailable':error.message});
    }
    return true;
  };
}
