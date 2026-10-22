import {createServer} from 'node:http';
import {createServer as createViteServer} from 'vite';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {openLocalAccountStore} from './local-account-store.mjs';
import {createLineLogin} from './line-login.mjs';
import {createLineLoginHandler} from './line-login-http.mjs';
import {createAccountSaveHandler} from './account-saves-http.mjs';
import {createAccountGameService} from './account-game-service.mjs';
import {createAccountGameHandler} from './account-game-http.mjs';
import {createStripePaymentIntegration} from './stripe-payment-integration.mjs';
import {createGoogleLoginIntegration} from './google-login-integration.mjs';

const signals=['SIGINT','SIGTERM'];
const previousListeners=new Map(signals.map(signal=>[signal,new Set(process.listeners(signal))]));
const required=['PRODUCT_PUBLIC_ORIGIN','LINE_CHANNEL_ID','LINE_CHANNEL_SECRET','LINE_PROVIDER_ID','LINE_REDIRECT_URI',
  'STRIPE_MODE','STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET','STRIPE_PERSONAL_PRICE_ID',
  'STRIPE_ORGANIZATION10_PRICE_ID','STRIPE_ORGANIZATION20_PRICE_ID','STRIPE_ORGANIZATION30_PRICE_ID'];
for(const key of required)if(!process.env[key])throw Error(`Missing ${key}; copy .env.example to .env and fill the test credentials.`);
if(process.env.STRIPE_MODE!=='test' || !process.env.STRIPE_SECRET_KEY.startsWith('sk_test_'))throw Error('Local product check accepts Stripe test keys only.');

const origin=new URL(process.env.PRODUCT_PUBLIC_ORIGIN);
if(origin.protocol!=='https:' || origin.pathname!=='/' || origin.search || origin.hash)throw Error('PRODUCT_PUBLIC_ORIGIN must be the HTTPS origin of your temporary/stable tunnel.');
const redirectUri=origin.origin+'/api/auth/line/callback';
if(process.env.LINE_REDIRECT_URI!==redirectUri)throw Error(`Set LINE_REDIRECT_URI to ${redirectUri}`);
const port=Number(process.env.LOCAL_PRODUCT_PORT||5178);
if(!Number.isInteger(port) || port<1024 || port>65535)throw Error('Invalid LOCAL_PRODUCT_PORT');

const directory=path.resolve(process.env.LOCAL_PRODUCT_DATA_DIR||'.local-product-data');
const root=fileURLToPath(new URL('../',import.meta.url)),publicDirectory=path.join(root,'public');
if(directory===root || directory===publicDirectory || directory.startsWith(publicDirectory+path.sep))throw Error('Local account data must be outside the public directory and separate from the project root.');
const store=await openLocalAccountStore(directory);
let authHandler,googleAuthHandler,accountHandler,gameHandler,stripe;
const apiServer=createServer(async(req,res)=>{
  try{
    if(authHandler && (await authHandler(req,res)||await googleAuthHandler(req,res)||await accountHandler(req,res)||await gameHandler(req,res)||await stripe.handler(req,res)))return;
    res.writeHead(404,{'Content-Type':'application/json'});res.end('{"error":"not_found"}');
  }catch(error){
    console.error('Local product API error:',error.message);
    if(!res.headersSent)res.writeHead(503,{'Content-Type':'application/json','Cache-Control':'no-store'});
    res.end('{"error":"service_unavailable"}');
  }
});
let vite;
let closing;
async function close(){
  if(closing)return closing;
  closing=(async()=>{
    if(vite)await vite.close();
    if(apiServer.listening)await new Promise(resolve=>apiServer.close(resolve));
    await store.close();
  })();
  return closing;
}
try{
  await new Promise((resolve,reject)=>{apiServer.once('error',reject);apiServer.listen(0,'127.0.0.1',resolve);});
  const target=`http://127.0.0.1:${apiServer.address().port}`;
  vite=await createViteServer({
    root,
    define:{'import.meta.env.VITE_ACCOUNT_BACKEND':'"1"','import.meta.env.VITE_STRIPE_CHECKOUT':'"1"'},
    server:{host:'127.0.0.1',port,strictPort:true,allowedHosts:[origin.hostname],
      fs:{deny:['.env','.env.*','*.{crt,pem}','**/.git/**',directory.replaceAll(path.sep,'/')+'/**']},
      proxy:{'/api':{target,changeOrigin:false}}},
  });
  const login=createLineLogin({channelId:process.env.LINE_CHANNEL_ID,channelSecret:process.env.LINE_CHANNEL_SECRET,
    providerId:process.env.LINE_PROVIDER_ID,redirectUri,store:store.auth});
  stripe=createStripePaymentIntegration({store,sessions:store.sessions,origin:origin.origin});
  authHandler=createLineLoginHandler({login,sessions:store.sessions,origin:origin.origin});
  googleAuthHandler=createGoogleLoginIntegration({store:store.auth,sessions:store.sessions,origin:origin.origin});
  accountHandler=createAccountSaveHandler({service:stripe.accounts,origin:origin.origin});
  gameHandler=createAccountGameHandler({service:createAccountGameService({store}),origin:origin.origin});
  await vite.listen();
  console.log(`Local product check: ${origin.origin}`);
  console.log(`Forward your HTTPS tunnel to http://127.0.0.1:${port}.`);
  console.log(`Save data is local only: ${directory}`);
  console.log('LINE is real; Stripe is test mode only. Do not use real child or payment data.');
}catch(error){
  await close();
  throw error;
}
// Own shutdown so Vite cannot exit before private storage releases its lock.
for(const signal of signals){
  for(const listener of process.listeners(signal))if(!previousListeners.get(signal).has(listener))process.removeListener(signal,listener);
  process.on(signal,()=>void close().then(()=>process.exit(0),()=>process.exit(1)));
}
