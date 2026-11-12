export function createSalesEmailHandler({config={enabled:false,ready:false},delivery,origin='https://legend-heroes2.web.app'}={}){
  if(origin!=='https://legend-heroes2.web.app'||config.ready===true&&(config.origin!==origin||config.projectId!=='ailandgames'))throw Error('sales_email_target_mismatch');
  return async(req,res)=>{
    const route=new URL(req.url,origin).pathname;
    if(!['/api/auth/email-verification-config','/api/auth/email-verification/send'].includes(route))return false;
    const reply=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body));return true;};
    if(route.endsWith('-config')){
      if(req.method!=='GET')return reply(405,{error:'method_not_allowed'});
      return reply(200,config.ready&&delivery?.ready?{enabled:true,projectId:config.projectId,origin:config.origin,policyStartAt:config.policyStartAt}:{enabled:false});
    }
    if(req.method!=='POST')return reply(405,{error:'method_not_allowed'});
    if(req.headers.origin!==origin)return reply(403,{error:'invalid_origin'});
    if(!delivery?.ready)return reply(503,{error:'email_delivery_unavailable'});
    try{
      if(req.headers['content-type']?.split(';')[0]!=='application/json')throw Error('invalid_json');
      const chunks=[];let length=0;for await(const chunk of req){length+=chunk.length;if(length>16000)throw Error('body_too_large');chunks.push(chunk);}
      let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw Error('invalid_json');}
      if(!body||Array.isArray(body)||typeof body!=='object'||Object.keys(body).some(k=>!['idToken','returnTo'].includes(k)))throw Error('invalid_json');
      return reply(200,await delivery.send(body));
    }catch(error){
      const statuses={authentication_required:401,invalid_json:400,body_too_large:413,unsafe_email_return:400,email_delivery_rate_limited:429,email_delivery_uncertain:409};
      const status=statuses[error.message]||503;return reply(status,{error:status===503?'email_delivery_unavailable':error.message});
    }
  };
}
