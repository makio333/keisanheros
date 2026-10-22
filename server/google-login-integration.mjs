import {createGoogleLogin} from './google-login.mjs';
import {createLineLoginHandler} from './line-login-http.mjs';
export function createGoogleLoginIntegration({store,sessions,origin,env=process.env}){
  const enabled=!!env.GOOGLE_CLIENT_ID&&!!env.GOOGLE_CLIENT_SECRET;
  if(!!env.GOOGLE_CLIENT_ID!==!!env.GOOGLE_CLIENT_SECRET)throw Error('google_not_configured');
  const google=enabled?createLineLoginHandler({login:createGoogleLogin({clientId:env.GOOGLE_CLIENT_ID,clientSecret:env.GOOGLE_CLIENT_SECRET,redirectUri:origin+'/api/auth/google/callback',store}),sessions,origin,startPath:'/api/auth/google/start',callbackPath:'/api/auth/google/callback',sharedRoutes:false}):null;
  return async(req,res)=>{
    if(new URL(req.url,origin).pathname==='/api/auth/providers'){
      res.writeHead(req.method==='GET'?200:405,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(req.method==='GET'?{line:true,google:enabled}:{error:'method_not_allowed'}));return true;
    }
    return google?google(req,res):false;
  };
}
