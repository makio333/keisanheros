// Explicitly local mock preview. Never import this into the product API.
import {createServer} from 'node:http';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createServer as createViteServer} from 'vite';
import Stripe from 'stripe';
import {openLocalAccountStore} from '../../server/local-account-store.mjs';
import {createFirebaseAccountLogin,createFirebaseAccountLoginHandler} from '../../server/firebase-account-login.mjs';
import {createEmailVerificationService} from '../../server/email-verification.mjs';
import {createEmailVerificationHandler} from '../../server/email-verification-http.mjs';
import {createStripePayments} from '../../server/stripe-payments.mjs';
import {createStripePaymentHandler} from '../../server/stripe-payments-http.mjs';
import {createAccountSaveService} from '../../server/account-saves.mjs';
import {createAccountSaveHandler} from '../../server/account-saves-http.mjs';
import {createAccountGameService} from '../../server/account-game-service.mjs';
import {createAccountGameHandler} from '../../server/account-game-http.mjs';
import {PURCHASE_PRICES} from '../../server/purchase-pricing.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const initialState=()=>({playerName:'引き継ぎ確認',avatar:'ai_hero_spellblade',avatarBackground:'forest',skinInventoryVersion:1,unlockedSkins:['ai_hero_spellblade'],unlockedAvatarBackgrounds:['default','forest'],player:{lvl:7,exp:12,points:2,maxHp:54,hp:54,maxMp:22,mp:22,atk:8,def:5,spd:6,gold:123},equipment:{weapon:{uid:2},armor:{uid:1},accessory:null},ownedEquips:[{uid:1,id:'a1',rarity:1,ability:null},{uid:2,id:'anc_w1',rarity:6,awakeningLevel:25,awakeningExp:70,ability:null}],nextUid:3,items:[],skills:{},clears:{},clearCounts:{},stageClearCounts:{},stageRewardClaims:{},kanaStagesVersion:2,areaBossClearCounts:{},rescued:[],questBoard:[],printSheetCodes:{},failTracking:{gameOvers:{},mistakes:{}},raidLearning:{}});
export async function startSalesPreview({directory,mock=false,port=0,emailState='complete',salesEnabled=true}={}){
 if(mock!==true)throw Error('explicit_mock_required');
 if(typeof salesEnabled!=='boolean')throw Error('explicit_sales_mode_required');
 const store=await openLocalAccountStore(directory),checkouts=new Map();
 const fixtureEmail={uid:'fixture-sales-user',email:emailState==='complete'?'fixture-sales@example.test':emailState==='pending'?'fixture-sales@example.test':null,
  emailVerified:emailState==='complete',disabled:false,metadata:{creationTime:emailState==='legacy-unverified'?'2025-01-01T00:00:00.000Z':'2026-10-26T00:00:00.000Z'}};
 const source=new Map([['fixture-sales-user',[{id:'fixture-existing',ownerUid:'fixture-sales-user',revision:3,gameData:JSON.stringify(initialState())}]]]);
 let vite,origin,payments,sdk,secret,authHandler,emailHandler,accountHandler,paymentHandler,gameHandler,checkoutCreateCalls=0;
 const server=createServer(async(req,res)=>{
  try{
   if(!origin){res.writeHead(503);res.end();return;}
   const url=new URL(req.url,origin);
   if(req.headers.host!==new URL(origin).host){res.writeHead(403);res.end();return;}
   if(!salesEnabled&&url.pathname.startsWith('/api/payments/')){res.writeHead(403,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({error:'sales_disabled'}));return;}
   if(url.pathname==='/api/auth/providers'){res.writeHead(200,{'Content-Type':'application/json'});res.end('{"google":false}');return;}
   if(url.pathname==='/api/auth/logout'){
    if(req.method!=='POST'||req.headers.origin!==origin){res.writeHead(403);res.end();return;}
    const session=String(req.headers.cookie||'').match(/(?:^|;\s*)legend-local-session=([a-f0-9]{64})/)?.[1];if(session)await store.sessions.remove(session);
    res.writeHead(200,{'Content-Type':'application/json','Set-Cookie':'legend-local-session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'});res.end('{}');return;
   }
   if(url.pathname==='/preview-checkout'){
    const row=checkouts.get(url.searchParams.get('session'));if(!row){res.writeHead(404);res.end();return;}
    const session=String(req.headers.cookie||'').match(/(?:^|;\s*)legend-local-session=([a-f0-9]{64})/)?.[1];
    if((await payments.accounts.summary(session)).accountId!==row.client_reference_id){res.writeHead(403);res.end();return;}
    res.writeHead(200,{'Content-Type':'text/html;charset=utf-8','Cache-Control':'no-store'});res.end(`<meta name="viewport" content="width=device-width,initial-scale=1"><title>模擬決済</title><main style="max-width:500px;margin:60px auto;font-family:sans-serif;padding:20px"><h1>模擬決済・請求は発生しません</h1><p>金額 ${row.amount_total.toLocaleString('ja-JP')}円（税込・買い切り）</p><form method="post" action="/api/preview/complete"><input type="hidden" name="session" value="${row.id}"><button name="outcome" value="paid">支払い成功を確認</button> <button name="outcome" value="failed">支払い失敗を確認</button> <button name="outcome" value="cancelled">キャンセル</button></form></main>`);return;
   }
   if(url.pathname==='/api/preview/complete'){
    if(req.method!=='POST'||req.headers.origin!==origin){res.writeHead(403);res.end();return;}
    let body='';for await(const chunk of req){body+=chunk;if(body.length>4096)throw Error('too_large');}
    const params=new URLSearchParams(body),row=checkouts.get(params.get('session')),outcome=params.get('outcome');
    const session=String(req.headers.cookie||'').match(/(?:^|;\s*)legend-local-session=([a-f0-9]{64})/)?.[1];
    if(!row||(await payments.accounts.summary(session)).accountId!==row.client_reference_id)throw Error('not_owner');
    if(outcome==='cancelled')await payments.cancelCheckout(session);
    else if(['paid','failed'].includes(outcome))await finish(row.id,outcome);
    else throw Error('invalid_outcome');
    res.writeHead(303,{Location:'/?purchase='+(outcome==='cancelled'?'cancelled':'processing'),'Cache-Control':'no-store'});res.end();return;
   }
   if(await emailHandler(req,res)||await authHandler(req,res)||await accountHandler(req,res)||paymentHandler&&await paymentHandler(req,res)||await gameHandler(req,res))return;
   if(url.pathname.startsWith('/api/')){res.writeHead(404);res.end('{}');return;}
   vite.middlewares(req,res);
  }catch(error){if(!res.headersSent)res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({error:error.message}));}
 });
 async function finish(id,outcome){
  if(!salesEnabled)throw Error('sales_disabled');
  const row=checkouts.get(id);if(!row)throw Error('unknown_fixture_checkout');
  row.status='complete';row.payment_status=outcome==='paid'?'paid':'unpaid';
  const event={id:'evt_fixture_'+id+'_'+outcome,livemode:false,type:outcome==='paid'?'checkout.session.completed':'checkout.session.async_payment_failed',data:{object:{id}}};
  const payload=JSON.stringify(event),signature=sdk.webhooks.generateTestHeaderString({payload,secret});
  return payments.webhook(Buffer.from(payload),signature);
 }
 const modules={
  'firebase/app':'export const initializeApp=()=>({});',
  'firebase/auth':`const listeners=[];const identity={uid:'fixture-sales-user',email:${JSON.stringify(fixtureEmail.email)},emailVerified:${fixtureEmail.emailVerified},provider:'oidc.line',pendingEmail:null};const makeUser=()=>({uid:identity.uid,get email(){return identity.email},get emailVerified(){return identity.emailVerified},get providerData(){return [{providerId:identity.provider,email:identity.email}]},getIdToken:async()=>('fixture.sales.'+identity.provider),getIdTokenResult:async()=>({claims:{email:identity.email,email_verified:identity.emailVerified,firebase:{sign_in_provider:identity.provider}}})});const auth={currentUser:localStorage.getItem('sales-preview-login')?makeUser():null};window.__fixtureConfirmEmail=()=>{if(identity.pendingEmail)identity.email=identity.pendingEmail;identity.pendingEmail=null;identity.emailVerified=true;};window.__fixtureLinkedUid=()=>identity.uid;export const getAuth=()=>auth;export class GoogleAuthProvider{constructor(){this.providerId='google.com'}};export class OAuthProvider{constructor(providerId){this.providerId=providerId}addScope(){}setCustomParameters(){}};export class EmailAuthProvider{static credential(email,password){return {email,password,providerId:'password'}}}export const onAuthStateChanged=(_a,cb)=>{listeners.push(cb);queueMicrotask(()=>cb(auth.currentUser));};export const signInWithPopup=async(_a,provider)=>{identity.provider=provider.providerId||'oidc.line';localStorage.setItem('sales-preview-login','1');auth.currentUser=makeUser();listeners.forEach(cb=>cb(auth.currentUser));};export const signOut=async()=>{localStorage.removeItem('sales-preview-login');auth.currentUser=null;listeners.forEach(cb=>cb(null));};export const signInWithEmailAndPassword=async(_a,email)=>{identity.provider='password';identity.email=email;localStorage.setItem('sales-preview-login','1');auth.currentUser=makeUser();listeners.forEach(cb=>cb(auth.currentUser));return {user:auth.currentUser}};export const createUserWithEmailAndPassword=async(_a,email)=>{identity.provider='password';identity.email=email;identity.emailVerified=false;localStorage.setItem('sales-preview-login','1');auth.currentUser=makeUser();listeners.forEach(cb=>cb(auth.currentUser));return {user:auth.currentUser}};export const sendEmailVerification=async()=>{};export const verifyBeforeUpdateEmail=async(_user,email)=>{identity.pendingEmail=email};export const sendPasswordResetEmail=async()=>{};export const reload=async()=>{};export const linkWithPopup=async(_user,provider)=>{identity.provider=provider.providerId||'oidc.line';return {user:auth.currentUser}};export const linkWithCredential=async(_user,credential)=>{identity.email=credential.email;identity.emailVerified=false;identity.provider='oidc.line';return {user:auth.currentUser}};`,
  'firebase/firestore':'export const getFirestore=()=>({});export const collection=(_db,...parts)=>parts.join("/");export const doc=collection;export const getDocsFromServer=async()=>({docs:[],size:0});export const runTransaction=async()=>{};',
 };
 try{
  vite=await createViteServer({root,configFile:false,define:{'import.meta.env.VITE_FIREBASE_GAME':'"1"','import.meta.env.VITE_FIREBASE_SALES':'"1"','import.meta.env.VITE_ACCOUNT_BACKEND':'"0"','import.meta.env.VITE_ACCOUNT_MOCK':'"1"','import.meta.env.VITE_STRIPE_CHECKOUT':JSON.stringify(salesEnabled?'1':'0'),'import.meta.env.VITE_LINE_OIDC_ENABLED':'"1"','import.meta.env.VITE_MIGRATION_IMPORT_ENABLED':'"0"'},server:{middlewareMode:true,hmr:{server}},plugins:[{name:'sales-preview-fixture',enforce:'pre',resolveId(id){if(modules[id])return '\0fixture:'+id;},load(id){if(id.startsWith('\0fixture:'))return modules[id.slice(9)];},transform(code,id){if(id.endsWith('/account_client.js'))return code.replace("location.assign(url.href);\n      }catch(error){status.textContent", "location.assign('/preview-checkout?session='+url.pathname.split('/').at(-1));\n      }catch(error){status.textContent");}}]});
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});origin=`http://127.0.0.1:${server.address().port}`;
  const verifyIdToken=async(token,checkRevoked)=>{
   if(checkRevoked!==true||!/^fixture\.sales\.(?:oidc\.line|google\.com|password)$/.test(token||''))throw Error('invalid_fixture_token');
   return {uid:'fixture-sales-user',aud:'ailandgames',iss:'https://securetoken.google.com/ailandgames',exp:Date.now()/1000+3600,
    email:fixtureEmail.email||undefined,email_verified:fixtureEmail.emailVerified,firebase:{sign_in_provider:token.split('.').slice(2).join('.')}};
  };
  const emailVerification=createEmailVerificationService({verifyIdToken,getUser:async uid=>{if(uid!=='fixture-sales-user')throw Error('auth/user-not-found');return structuredClone(fixtureEmail);},store,policyStartAt:'2026-10-25T00:00:00.000Z'});
  emailHandler=createEmailVerificationHandler({service:emailVerification,origin});
  if(salesEnabled){
   sdk=new Stripe('sk_test_fixture_only');secret='whsec_local_sales_fixture';
   const catalog=new Map(Object.entries(PURCHASE_PRICES).map(([id,p])=>['price_fixture_'+id,{id:'price_fixture_'+id,active:true,livemode:false,type:'one_time',currency:'jpy',tax_behavior:'inclusive',unit_amount:p.amount}]));
   const stripe={prices:{retrieve:async id=>catalog.get(id)},webhooks:sdk.webhooks,checkout:{sessions:{create:async(params,options)=>{
    checkoutCreateCalls++;const id='cs_fixture_'+options.idempotencyKey;if(checkouts.has(id))return structuredClone(checkouts.get(id));const line=params.line_items[0],price=line.price_data?{id:'price_inline_'+id,type:'one_time',...line.price_data}:catalog.get(line.price);
    const row={...params,id,livemode:false,status:'open',payment_status:'unpaid',currency:'jpy',amount_total:price.unit_amount,url:'https://checkout.stripe.com/c/pay/'+id,expires_at:Math.floor(Date.now()/1000)+86400,line_items:{has_more:false,data:[{quantity:1,price}]}};checkouts.set(id,row);return row;},retrieve:async id=>structuredClone(checkouts.get(id)),expire:async id=>{const row=checkouts.get(id);row.status='expired';return row;}}}};
   payments=createStripePayments({stripe,store,sessions:store.sessions,origin,webhookSecret:secret,priceIds:Object.fromEntries(Object.keys(PURCHASE_PRICES).map(id=>[id,'price_fixture_'+id])),trialsEnabled:true,requireAdultManagerAcknowledgement:true,verifyCheckoutEligibility:emailVerification.assertCheckoutEligible});
   paymentHandler=createStripePaymentHandler({payments,origin});
  }else payments={accounts:createAccountSaveService({store,sessions:store.sessions,trialsEnabled:false})};
  const login=createFirebaseAccountLogin({store,sessions:store.sessions,migrationEnabled:true,emailVerification,readPrivateSaves:async uid=>structuredClone(source.get(uid)||[]),verifyIdToken});
  authHandler=createFirebaseAccountLoginHandler({login,origin});accountHandler=createAccountSaveHandler({service:payments.accounts,origin});gameHandler=createAccountGameHandler({service:createAccountGameService({store}),origin});
  return {url:origin,store,payments,checkouts,source,finish,get checkoutCreateCalls(){return checkoutCreateCalls;},async verifyEmail(email=fixtureEmail.email){if(email)fixtureEmail.email=email;fixtureEmail.emailVerified=true;},async close(){await vite.close();await new Promise(resolve=>server.close(resolve));await store.close();}};
 }catch(error){if(vite)await vite.close();if(server.listening)await new Promise(resolve=>server.close(resolve));await store.close();throw error;}
}
