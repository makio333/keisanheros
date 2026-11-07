import {createServer} from 'node:http';
import {applicationDefault,initializeApp} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';
import {getAuth} from 'firebase-admin/auth';
import {createFirebaseAccountLogin,createFirebaseAccountLoginHandler} from './firebase-account-login.mjs';
import {createFirestoreAccountStore} from './firestore-account-store.mjs';
import {createLineLogin} from './line-login.mjs';
import {createLineLoginHandler} from './line-login-http.mjs';
import {createAccountSaveHandler} from './account-saves-http.mjs';
import {createAccountGameService} from './account-game-service.mjs';
import {createAccountGameHandler} from './account-game-http.mjs';
import {createProductPaymentMode} from './product-payment-mode.mjs';
import {createGoogleLoginIntegration} from './google-login-integration.mjs';
import {createDurableRateLimiter} from './durable-rate-limiter.mjs';
import {logSafeApiFailure} from './safe-api-logging.mjs';
import {createEmailVerificationService} from './email-verification.mjs';
import {createEmailVerificationHandler} from './email-verification-http.mjs';
import {resolveEmailVerificationOnlyConfig} from './email-verification-only-config.mjs';
import {createFirestoreAccountDeletionAdapter} from './firestore-account-deletion-adapter.mjs';
import {createFirestoreOwnedAccountDeletionSources} from './firestore-owned-account-deletion-sources.mjs';
import {createFirestoreAccountDeletionAudits} from './firestore-account-deletion-audits.mjs';
import {createAccountDeletionService} from './account-deletion-service.mjs';
import {createAccountDeletionHandler} from './account-deletion-http.mjs';
import {createFirebaseAccountDeletionAuthenticator} from './firebase-account-deletion-auth.mjs';

const emailOnlyConfig=resolveEmailVerificationOnlyConfig(process.env);
const emailVerificationOnly=!!emailOnlyConfig;
const projectId=emailOnlyConfig?.projectId||process.env.GCLOUD_PROJECT||process.env.GOOGLE_CLOUD_PROJECT;
const origin=emailOnlyConfig?.origin||process.env.PRODUCT_PUBLIC_ORIGIN;
const firebaseLoginEnabled=process.env.FIREBASE_ACCOUNT_LOGIN_ENABLED==='1';
const migrationReady=process.env.FIREBASE_SAVE_MIGRATION_READY==='1';
const legacyLineEnabled=process.env.PRODUCT_LEGACY_LINE_LOGIN_ENABLED==='1';
const salesDisabled=process.env.PRODUCT_SALES_ENABLED==='0';
if(process.env.PRODUCT_SALES_ENABLED!==undefined&&!['0','1'].includes(process.env.PRODUCT_SALES_ENABLED))throw Error('Invalid PRODUCT_SALES_ENABLED mode.');
const required=emailVerificationOnly||salesDisabled?[]:['STRIPE_MODE','STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET',
  'STRIPE_PERSONAL_PRICE_ID','STRIPE_ORGANIZATION10_PRICE_ID','STRIPE_ORGANIZATION20_PRICE_ID','STRIPE_ORGANIZATION30_PRICE_ID'];
if(emailVerificationOnly?projectId!=='demo-email-verification':projectId!=='ailandgames')throw Error('Product API project target is not allowed for this mode.');
if(!origin||new URL(origin).origin!==origin||(emailVerificationOnly?(new URL(origin).protocol!=='http:'||new URL(origin).hostname!=='127.0.0.1'):!origin.startsWith('https://')))throw Error('Product API origin is not allowed for this mode.');
for(const key of required)if(!process.env[key])throw Error(`Missing required server setting: ${key}`);
if(firebaseLoginEnabled&&!migrationReady&&!emailVerificationOnly)throw Error('FIREBASE_SAVE_MIGRATION_READY must be enabled before existing saves can use the product account.');
if(salesDisabled&&(!firebaseLoginEnabled||!migrationReady))throw Error('Sales-disabled product access requires the existing Firebase account and save migration path.');
if(salesDisabled&&!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(process.env.PRODUCT_COMPLIMENTARY_ACCOUNT_CUTOFF||''))throw Error('PRODUCT_COMPLIMENTARY_ACCOUNT_CUTOFF must be an explicit UTC rollout timestamp.');
if(emailVerificationOnly&&(!firebaseLoginEnabled||legacyLineEnabled))throw Error('EMAIL_VERIFICATION_ONLY requires the Firebase account bridge and cannot enable legacy LINE payments.');
const emailPolicyStartAt=process.env.EMAIL_VERIFICATION_POLICY_START_AT;
if(firebaseLoginEnabled&&!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(emailPolicyStartAt||''))throw Error('EMAIL_VERIFICATION_POLICY_START_AT must be an explicit UTC rollout timestamp.');
if(!firebaseLoginEnabled&&!legacyLineEnabled)throw Error('Enable Firebase account login or the explicitly approved legacy LINE login.');
if(legacyLineEnabled){
  for(const key of ['LINE_CHANNEL_ID','LINE_CHANNEL_SECRET','LINE_PROVIDER_ID','LINE_REDIRECT_URI'])if(!process.env[key])throw Error(`Missing required server setting: ${key}`);
  if(process.env.LINE_REDIRECT_URI!==origin+'/api/auth/line/callback')throw Error('LINE_REDIRECT_URI does not match PRODUCT_PUBLIC_ORIGIN.');
}

if(emailVerificationOnly)initializeApp({projectId});
else initializeApp({credential:applicationDefault(),projectId});
const deletionDb=getFirestore();
const deletionAudits=emailVerificationOnly?null:createFirestoreAccountDeletionAudits({db:deletionDb,pageSize:200,maxDocuments:10000});
const deletionSources=emailVerificationOnly?{}:createFirestoreOwnedAccountDeletionSources({db:deletionDb,ownershipAudits:deletionAudits});
const deletionAdapter=emailVerificationOnly?null:createFirestoreAccountDeletionAdapter({db:deletionDb,auth:getAuth(),projectId,sourceAdapters:deletionSources});
const store=createFirestoreAccountStore(deletionDb,{isAccountDeletionBlocked:deletionAdapter?.isAccountIdBlocked});
const rateLimiter=createDurableRateLimiter({store});
const verifyIdToken=(token,checkRevoked)=>getAuth().verifyIdToken(token,checkRevoked);
const deletionAuthMarker=Object.freeze({});
const deletionAuthenticator=emailVerificationOnly?null:createFirebaseAccountDeletionAuthenticator({verifyIdToken,resolveAccount:uid=>deletionAdapter.resolveAccount(uid),projectId});
const accountDeletionService=emailVerificationOnly?null:createAccountDeletionService({
  adapter:deletionAdapter,
  verifyRequester:async request=>{
    if(request?.authMarker!==deletionAuthMarker)return null;
    let accountId;try{accountId=await deletionAdapter.resolveAccount(request.uid);}catch{return null;}
    if(typeof accountId!=='string'||accountId!==request.accountId)return null;
    return {verified:true,uid:request.uid,accountId,reauthenticated:request.reauthenticated===true};
  },
  executionProfile:'production-guarded',
});
const accountDeletion=emailVerificationOnly?null:createAccountDeletionHandler({
  service:accountDeletionService,
  origin,
  authenticate:async req=>{
    const principal=await deletionAuthenticator(req);
    return principal?{...principal,authMarker:deletionAuthMarker}:null;
  },
  // The calendar-month account-data window is approved. Other source dispositions
  // stay unresolved so the request remains blocked until audits/backups are ready.
  resolvePolicy:async()=>({accountRetentionPolicyId:'tokyo-calendar-month-v1'}),
});
const emailVerification=firebaseLoginEnabled?createEmailVerificationService({verifyIdToken,getUser:uid=>getAuth().getUser(uid),store,projectId,policyStartAt:emailPolicyStartAt}):null;
const emailRegistration=emailVerification?createEmailVerificationHandler({service:emailVerification,origin}):null;
const firebaseLogin=process.env.FIREBASE_ACCOUNT_LOGIN_ENABLED==='1'?createFirebaseAccountLoginHandler({origin,login:createFirebaseAccountLogin({
  verifyIdToken,getUser:uid=>getAuth().getUser(uid),store,sessions:store.sessions,rateLimiter,emailVerification,isAccountDeletionBlocked:deletionAdapter?.isUidBlocked,projectId,emulatorOnly:emailVerificationOnly,
  migrationEnabled:!emailVerificationOnly&&process.env.FIREBASE_SAVE_MIGRATION_READY==='1',facilityUids:(process.env.LEGACY_FACILITY_FIREBASE_UIDS||'').split(',').map(value=>value.trim()).filter(Boolean),
  readPrivateSaves:emailVerificationOnly?undefined:async uid=>(await getFirestore().collection('privateGame').doc(uid).collection('saves').get()).docs.map(row=>({id:row.id,...row.data()})),
})}):null;
const login=legacyLineEnabled?createLineLogin({channelId:process.env.LINE_CHANNEL_ID,channelSecret:process.env.LINE_CHANNEL_SECRET,
  providerId:process.env.LINE_PROVIDER_ID,redirectUri:process.env.LINE_REDIRECT_URI,store:store.auth}):null;
const auth=login?createLineLoginHandler({login,sessions:store.sessions,rateLimiter,origin}):null;
const googleAuth=emailVerificationOnly?null:createGoogleLoginIntegration({store:store.auth,sessions:store.sessions,rateLimiter,origin,lineAvailable:!!auth});
const productPayments=createProductPaymentMode({store,sessions:store.sessions,origin,rateLimiter,emailVerification,env:process.env});
const accounts=createAccountSaveHandler({service:productPayments.accounts,origin});
const game=createAccountGameHandler({service:createAccountGameService({store}),origin});
const port=emailOnlyConfig?.port??Number(process.env.PORT||8080);
if(!Number.isInteger(port)||port<1||port>65535)throw Error('Invalid server port.');
const server=createServer(async(req,res)=>{
  try{
    if(emailRegistration&&await emailRegistration(req,res)||firebaseLogin&&await firebaseLogin(req,res)||accountDeletion&&await accountDeletion(req,res)||auth&&await auth(req,res)||googleAuth&&await googleAuth(req,res)||await accounts(req,res)||await game(req,res)||await productPayments.handler(req,res))return;
    res.writeHead(404,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end('{"error":"not_found"}');
  }catch(error){
    const requestId=logSafeApiFailure({request:req});
    if(!res.headersSent)res.writeHead(503,{'Content-Type':'application/json','Cache-Control':'no-store','X-Request-Id':requestId});
    res.end('{"error":"service_unavailable"}');
  }
});
server.listen(port,emailOnlyConfig?.host||'0.0.0.0',()=>console.log(`${emailVerificationOnly?'Local email-verification emulator API':'AIlandGames product API'} listening on ${port}`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
