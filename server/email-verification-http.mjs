import {logSafeApiFailure} from './safe-api-logging.mjs';

export function createEmailVerificationHandler({service,origin,logFailure=logSafeApiFailure}){
  const site=new URL(origin);
  if(site.origin!==origin||site.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(site.hostname))throw Error('unsafe_email_verification_origin');
  return async(req,res)=>{
    if(new URL(req.url,origin).pathname!=='/api/auth/email-registration')return false;
    const reply=(status,body,headers={})=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers});res.end(JSON.stringify(body));};
    if(req.method!=='POST'){reply(405,{error:'method_not_allowed'});return true;}
    if(req.headers.origin!==origin){reply(403,{error:'invalid_origin'});return true;}
    try{
      if(req.headers['content-type']?.split(';')[0]!=='application/json')throw Error('invalid_json');
      const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>16000)throw Error('body_too_large');chunks.push(chunk);}
      let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw Error('invalid_json');}
      if(!body||typeof body!=='object'||Array.isArray(body))throw Error('invalid_json');
      const state=body.purpose==='gameplay'?await service.statusForGameplay(body.idToken):await service.status(body.idToken);
      reply(200,{registrationState:state.state,emailVerified:state.emailVerified,hasEmail:state.hasEmail});
    }catch(error){
      const codes={authentication_required:401,account_disabled:403,email_verification_required:403,email_verification_refresh_required:409,invalid_json:400,body_too_large:413};
      const status=codes[error.message]||503,headers=status===503?{'X-Request-Id':logFailure({request:req})}:{};
      reply(status,{error:status===503?'email_verification_unavailable':error.message},headers);
    }
    return true;
  };
}
