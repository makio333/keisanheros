import {createServer} from 'node:http';
import {applicationDefault,initializeApp} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';
import {createFirestoreAccountStore} from './firestore-account-store.mjs';
import {createLineLogin} from './line-login.mjs';
import {createLineLoginHandler} from './line-login-http.mjs';
import {createAccountSaveHandler} from './account-saves-http.mjs';
import {createAccountGameService} from './account-game-service.mjs';
import {createAccountGameHandler} from './account-game-http.mjs';
import {createStripePaymentIntegration} from './stripe-payment-integration.mjs';
import {createGoogleLoginIntegration} from './google-login-integration.mjs';

const projectId=process.env.GCLOUD_PROJECT||process.env.GOOGLE_CLOUD_PROJECT;
const origin=process.env.PRODUCT_PUBLIC_ORIGIN;
const required=['LINE_CHANNEL_ID','LINE_CHANNEL_SECRET','LINE_PROVIDER_ID','LINE_REDIRECT_URI','STRIPE_MODE','STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET',
  'STRIPE_PERSONAL_PRICE_ID','STRIPE_ORGANIZATION10_PRICE_ID','STRIPE_ORGANIZATION20_PRICE_ID','STRIPE_ORGANIZATION30_PRICE_ID'];
if(projectId!=='ailandgames')throw Error('Set the Cloud Run project to ailandgames.');
if(!origin || new URL(origin).origin!==origin || !origin.startsWith('https://'))throw Error('PRODUCT_PUBLIC_ORIGIN must be the production HTTPS origin.');
for(const key of required)if(!process.env[key])throw Error(`Missing required server setting: ${key}`);
if(process.env.LINE_REDIRECT_URI!==origin+'/api/auth/line/callback')throw Error('LINE_REDIRECT_URI does not match PRODUCT_PUBLIC_ORIGIN.');

initializeApp({credential:applicationDefault(),projectId});
const store=createFirestoreAccountStore(getFirestore());
const login=createLineLogin({channelId:process.env.LINE_CHANNEL_ID,channelSecret:process.env.LINE_CHANNEL_SECRET,
  providerId:process.env.LINE_PROVIDER_ID,redirectUri:process.env.LINE_REDIRECT_URI,store:store.auth});
const auth=createLineLoginHandler({login,sessions:store.sessions,origin});
const googleAuth=createGoogleLoginIntegration({store:store.auth,sessions:store.sessions,origin});
const stripe=createStripePaymentIntegration({store,sessions:store.sessions,origin});
const accounts=createAccountSaveHandler({service:stripe.accounts,origin});
const game=createAccountGameHandler({service:createAccountGameService({store}),origin});
const port=Number(process.env.PORT||8080);
if(!Number.isInteger(port)||port<1||port>65535)throw Error('Invalid server port.');
const server=createServer(async(req,res)=>{
  try{
    if(await auth(req,res)||await googleAuth(req,res)||await accounts(req,res)||await game(req,res)||await stripe.handler(req,res))return;
    res.writeHead(404,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end('{"error":"not_found"}');
  }catch(error){
    console.error('Product API request failed:',error.code||error.name||'unknown');
    if(!res.headersSent)res.writeHead(503,{'Content-Type':'application/json','Cache-Control':'no-store'});
    res.end('{"error":"service_unavailable"}');
  }
});
server.listen(port,'0.0.0.0',()=>console.log(`AIlandGames product API listening on ${port}`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
