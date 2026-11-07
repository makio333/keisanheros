import './save_migration.css';
import {initializeApp} from 'firebase/app';
import {getAuth,GoogleAuthProvider,OAuthProvider,EmailAuthProvider,linkWithCredential,linkWithPopup,onAuthStateChanged,signInWithPopup,signInWithEmailAndPassword,createUserWithEmailAndPassword,sendEmailVerification,verifyBeforeUpdateEmail,sendPasswordResetEmail,signOut,reload} from 'firebase/auth';
import {getFirestore,collection,doc,getDocsFromServer,runTransaction} from 'firebase/firestore';
import {PRODUCT_FIREBASE_CONFIG} from './firebase_product_config.js';
import {preparePrivateMigration,applyPrivateMigration} from './private_save_migration.js';
import {buildLegacySaveFile,LEGACY_FILE_MAX_BYTES} from './legacy_save_file.js';
import {canUsePrivateMigration,describeLogin} from './migration_identity.js';
import {createLineLoginProvider} from './line_login.js';

const app=initializeApp(PRODUCT_FIREBASE_CONFIG);
function lineProvider(browserOnly){return createLineLoginProvider(OAuthProvider,{browserOnly});}
export const migrationAuth=getAuth(app),migrationDb=getFirestore(app);
export async function getFreshCheckoutEmailToken(expectedUid){
  const user=migrationAuth.currentUser;
  if(!user||expectedUid&&user.uid!==expectedUid)throw Error('authentication_required');
  await reload(user);
  if(migrationAuth.currentUser?.uid!==user.uid)throw Error('authentication_required');
  const idToken=await user.getIdToken(true),state=await requestEmailRegistration(user,idToken,'purchase');
  if(state.emailVerified!==true)throw Error('email_verification_required');
  return idToken;
}
async function requestEmailRegistration(user,idToken,purpose='gameplay'){
  const token=idToken||await user.getIdToken();
  const response=await fetch('/api/auth/email-registration',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken:token,purpose})});
  const data=await response.json();if(!response.ok)throw Error(data.error||'email_verification_unavailable');return data;
}
export function mountPrivateMigrationPanel(root=document,{onReady=async()=>{},onSignedOut=()=>{},beforeSignOut=async()=>{},originalBackup=false}={}){
const auth=migrationAuth,db=migrationDb;
const $=id=>root.querySelector('#migration-'+id);
if(import.meta.env.VITE_LINE_OIDC_ENABLED!=='1'){
  $('line').disabled=true;$('line').textContent='LINE（設定待ち）';
  $('link-line').disabled=true;$('link-line').textContent='LINEの追加（設定待ち）';
  if ($('line-browser')) $('line-browser').disabled=true;
}
let plan=null,generation=0,busy=false;
let confirmationRecheckRequested=false,purchaseVerificationInProgress=false;
const importEnabled=import.meta.env.VITE_MIGRATION_IMPORT_ENABLED!=='0';
const status=text=>{$('status').textContent=text;};
function loading(text,percent=null){$('loading').hidden=false;$('loading-label').textContent=text+(percent===null?'':` ${percent}%`);if(percent===null)$('progress').removeAttribute('value');else $('progress').value=percent;}
function stopLoading(){$('loading').hidden=true;}
function readFile(file,onProgress){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onprogress=event=>{if(event.lengthComputable)onProgress(Math.round(event.loaded/event.total*100));};reader.onerror=()=>reject(Error('file_read_failed'));reader.onabort=()=>reject(Error('file_read_failed'));reader.onload=()=>{onProgress(100);resolve(reader.result);};reader.readAsText(file,'UTF-8');});}
function message(error){
  const authHelp={
    'auth/web-storage-unsupported':'ログイン情報を保存できません。SafariまたはChromeの通常のタブでゲームを開き、同じブラウザでログインしてください。',
    'auth/operation-not-supported-in-this-environment':'この画面ではログインを完了できません。SafariまたはChromeでゲームを開いてください。',
    'auth/network-request-failed':'ログイン先と通信できませんでした。接続を確認してもう一度お試しください。',
    'auth/internal-error':'認証の途中でエラーになりました。エラー画面を閉じ、ゲームを開いた同じブラウザからやり直してください。',
    'auth/account-exists-with-different-credential':'このメールには別のログイン方法が登録されています。以前使った方法でログインし、アカウント画面からログイン方法を追加してください。',
  };
  if(authHelp[error.code])return `${authHelp[error.code]}（${error.code}）`;
  return ({'email_verification_required':'今のアカウントのまま確認できます。確認後購入内容へ戻ります。既存セーブと利用権はそのままです。','email_verification_refresh_required':'確認状態が最新でないため、確認・再読み込みを押してください。','email_verification_unavailable':'確認状態を取得できません。時間をおいて再確認してください。','email_identity_mismatch':'この購入手続きはログイン中のアカウントと一致しません。別アカウントを統合せず、ログインを確認してください。','account_disabled':'このアカウントでは続行できません。サポートへお問い合わせください。','migration_not_ready':'以前のセーブの引き継ぎ準備がまだ完了していません。担当者に確認してください。','firebase_source_changed':'以前の保存先で進行が更新されています。上書きせず担当者に確認してください。','account_switch_requires_logout':'いったんログアウトしてから、使うアカウントでログインしてください。','auth/popup-closed-by-user':'ログインがキャンセルされました。','auth/popup-blocked':'ポップアップを許可して、もう一度押してください。','auth/unauthorized-domain':'この公開先のログイン設定が未完了です。担当者に確認してください。','auth/invalid-credential':'メールアドレスかパスワードを確認してください。','auth/email-already-in-use':'登録済みのメールです。ログインか再設定を選んでください。','auth/weak-password':'パスワードを長く、推測されにくいものにしてください。','auth/too-many-requests':'操作が集中しています。少し待ってください。','permission-denied':'保存先へのアクセスが許可されていません。アカウントとメール確認の状態を確認してください。','migration_save_too_large':'大きすぎるセーブが含まれています。ファイルは変更せず担当者へ確認してください。','migration_file_too_large':'ファイルが大きすぎます。ファイルは変更せず担当者へ確認してください。'}[error.code||error.message]||'処理できませんでした。取り込み結果を再確認してください。元のJSONは残してください。');
}
async function action(callback){try{await callback();}catch(error){stopLoading();status(error.code==='auth/operation-not-allowed'?'このログイン方法はFirebase側の設定が未完了です。担当者に確認してください。':error.code==='auth/credential-already-in-use'?'そのログイン方法は別の保存先で使われています。自動では統合しません。':error.code==='auth/provider-already-linked'?'このログイン方法は追加済みです。':message(error));}}
function clearPreview(keepFile=false){plan=null;generation++;$('apply').hidden=true;$('preview').textContent='';$('names').replaceChildren();if(!keepFile)$('json').value='';}
async function refresh({returnToPurchase=false}={}){
  if(returnToPurchase)purchaseVerificationInProgress=true;
  const purchaseReturn=returnToPurchase||purchaseVerificationInProgress;
  const user=auth.currentUser;clearPreview();const expected=generation;
  $('login').hidden=!!user;$('account').hidden=!user;$('upload').hidden=true;$('saved').replaceChildren();$('downloads').replaceChildren();$('count').textContent='';
  if(!user){stopLoading();$('email-registration').hidden=true;onSignedOut();return;}
  loading('ログイン情報を確認中…');
  $('user').textContent='アカウント情報を確認中…';
  const claims=(await user.getIdTokenResult()).claims;
  if(expected!==generation||auth.currentUser?.uid!==user.uid)return;
  $('user').textContent=describeLogin(user,claims);
  if(import.meta.env.VITE_FIREBASE_SALES==='1'){
    const registration=await requestEmailRegistration(user);
    if(expected!==generation||auth.currentUser?.uid!==user.uid)return;
    const pending=registration.registrationState==='pending';
    const purchaseCheckOnly=registration.registrationState==='legacy'&&registration.emailVerified!==true&&purchaseReturn;
    $('email-registration').hidden=!(pending||purchaseCheckOnly);
    $('resend-email').hidden=registration.hasEmail!==true||registration.emailVerified===true;
    if(pending){
      status(confirmationRecheckRequested?'リンクの期限切れ・使用済みの可能性があります。アカウント画面で状態を確認し、未確認なら再送してください。':'レジェンドヒーローズの購入者・団体管理者アカウントはメール確認後に登録完了となります。届いた確認リンクを開いてから確認して続けるを押してください。メール確認だけで購入や決済は行われません。');
      stopLoading();return;
    }
    if(purchaseCheckOnly)status('今のアカウントのまま確認できます。確認後購入内容へ戻ります。既存セーブと利用権はそのままです。');
    else status('');
    loading('ゲームのアカウントを確認中…');
    await onReady({user,records:[],registration,returnToPurchase:purchaseReturn});
    if(expected!==generation||auth.currentUser?.uid!==user.uid)return;
    confirmationRecheckRequested=false;if(registration.emailVerified===true)purchaseVerificationInProgress=false;stopLoading();return;
  }
  $('email-registration').hidden=true;
  if(!canUsePrivateMigration(user,claims.firebase?.sign_in_provider)){stopLoading();status('確認メールのリンクを開いてから「確認・再読み込み」を押してください。');return;}
  $('upload').hidden=!importEnabled;loading('保存済みのデータを確認中…');
  const snapshot=await getDocsFromServer(collection(db,'privateMigration',user.uid,'saves'));
  if(expected!==generation||auth.currentUser?.uid!==user.uid)return;
  loading('ゲームのセーブを準備中…');
  await onReady({user,records:snapshot.docs.map(entry=>({id:entry.id,...entry.data()}))});
  if(expected!==generation||auth.currentUser?.uid!==user.uid)return;
  const groups=new Map();
  for(const entry of snapshot.docs){const row=entry.data(),gameState=JSON.parse(row.gameData);const li=document.createElement('li');li.textContent=`${gameState.playerName||'プレイヤー'} / Lv.${gameState.player?.lvl||1}`;$('saved').appendChild(li);if(!groups.has(row.sourceProject))groups.set(row.sourceProject,[]);groups.get(row.sourceProject).push({documentId:row.sourceDocumentId,gameState});}
  $('count').textContent=`${snapshot.size}人分をこのアカウントに保管しています。`;$('upload').hidden=!importEnabled;
  for(const [source,rows] of groups){const button=document.createElement('button');button.type='button';button.textContent=(originalBackup?'引っ越し前の原本JSON':'バックアップJSON')+'を保存（'+rows.length+'人分）';button.onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(buildLegacySaveFile(source,rows))],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download='legend-heroes-migration-backup.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};$('downloads').appendChild(button);}
  stopLoading();
}
$('google').onclick=()=>action(async()=>{await signInWithPopup(auth,new GoogleAuthProvider());});
$('line').onclick=()=>action(async()=>{await signInWithPopup(auth,lineProvider());});
if ($('line-browser')) $('line-browser').onclick=()=>action(async()=>{
  status('LINEアプリを開かず、このブラウザでログインします。');
  await signInWithPopup(auth,lineProvider(true));
});
for(const provider of ['google','line'])$('link-'+provider).onclick=()=>action(async()=>{
  if(busy||!auth.currentUser)return;
  await linkWithPopup(auth.currentUser,provider==='google'?new GoogleAuthProvider():lineProvider());
  await refresh();status('同じ保存先にログイン方法を追加しました。');
});
$('link-email-form').onsubmit=event=>{event.preventDefault();action(async()=>{
  if(busy||!auth.currentUser)return;
  const result=await linkWithCredential(auth.currentUser,EmailAuthProvider.credential($('link-email').value.trim(),$('link-password').value));$('link-password').value='';
  if(!result.user.emailVerified)await sendEmailVerification(result.user);
  await result.user.getIdToken(true);await refresh();status('確認メールの送信を受け付けました。迷惑メール/入力アドレスを確認。確認だけで決済しません。');
});};
$('change-email-form').onsubmit=event=>{event.preventDefault();action(async()=>{
  if(busy||!auth.currentUser)return;
  await verifyBeforeUpdateEmail(auth.currentUser,$('change-email').value.trim());
  $('change-email').value='';status('新しいメールの確認が終わるまで変更手続き未完了。別アカウントと自動統合しません。');
});};
$('resend-email').onclick=()=>action(async()=>{
  const user=auth.currentUser;if(!user?.email)throw Error('email_verification_required');
  await sendEmailVerification(user);status('送信を受け付けました。迷惑メール/入力アドレスを確認。確認だけで決済しません。');
});
$('email-form').onsubmit=event=>{event.preventDefault();action(async()=>{await signInWithEmailAndPassword(auth,$('email').value.trim(),$('password').value);$('password').value='';});};
$('register').onclick=()=>action(async()=>{if(!$('email-form').reportValidity())return;status('レジェンドヒーローズの購入者・団体管理者アカウントはメール確認後に登録完了となります。届いた確認リンクを開いてから確認して続けるを押してください。メール確認だけで購入や決済は行われません。');const result=await createUserWithEmailAndPassword(auth,$('email').value.trim(),$('password').value);$('password').value='';await sendEmailVerification(result.user);status('送信を受け付けました。迷惑メール/入力アドレスを確認。確認だけで決済しません。');});
$('reset').onclick=()=>action(async()=>{if(!$('email').reportValidity())return;await sendPasswordResetEmail(auth,$('email').value.trim());status('登録されている場合は再設定メールが届きます。');});
$('logout').onclick=()=>action(async()=>{if(busy)return;await beforeSignOut();await signOut(auth);$('password').value='';$('link-password').value='';status('ログアウトしました。');});
$('refresh').onclick=()=>action(async()=>{if(busy)return;confirmationRecheckRequested=true;if(auth.currentUser){await reload(auth.currentUser);await auth.currentUser.getIdToken(true);}await refresh();});
$('json').onchange=()=>action(async()=>{
  if(!importEnabled)return;
  const selected=$('json').files[0];clearPreview(true);if(!selected){stopLoading();return;}
  const expected=generation,user=auth.currentUser;if(!user)return;
  const current=()=>expected===generation&&user.uid===auth.currentUser?.uid;
  loading('JSONを読み込み中',0);
  $('loading').scrollIntoView({block:'nearest'});
  if(!canUsePrivateMigration(user,(await user.getIdTokenResult()).claims.firebase?.sign_in_provider))return;
  if(selected.size>LEGACY_FILE_MAX_BYTES)throw Error('migration_file_too_large');
  const text=await readFile(selected,percent=>{if(current())loading('JSONを読み込み中',percent);});if(!current())return;
  loading('JSONの内容を確認中…');
  const prepared=await preparePrivateMigration(text);if(!current())return;
  loading('取り込み済みのデータと照合中…');
  const existing=await getDocsFromServer(collection(db,'privateMigration',user.uid,'saves'));
  if(expected!==generation||user.uid!==auth.currentUser?.uid)return;
  const keys=new Set(existing.docs.map(row=>row.id)),skipped=prepared.records.filter(row=>keys.has(row.key)).length;
  plan={...prepared,uid:user.uid};$('preview').textContent=`保存元：${prepared.file.sourceProject} / 全${prepared.records.length}人分。新規${prepared.records.length-skipped}人、取り込み済み${skipped}人。既存データは上書きしません。`;
  for(const row of prepared.file.saves){const li=document.createElement('li');li.textContent=row.gameState.playerName||'プレイヤー';$('names').appendChild(li);}
  $('apply').hidden=false;loading('取り込み前の確認が完了しました',100);status('人数・名前・ログイン中のアカウントを確認してから取り込んでください。');
});
$('apply').onclick=()=>action(async()=>{
  if(!importEnabled||busy||!plan||plan.uid!==auth.currentUser?.uid)return;
  busy=true;for(const id of ['apply','json','logout','refresh'])$(id).disabled=true;
  loading('データを保存中… この画面を閉じずにお待ちください。');
  $('loading').scrollIntoView({block:'nearest'});
  try{
    const result=await applyPrivateMigration(plan,{uid:auth.currentUser.uid,transaction:callback=>runTransaction(db,callback),reference:(uid,key)=>doc(db,'privateMigration',uid,'saves',key)});
    await refresh();status(`${result.imported}人を取り込みました。取り込み済み${result.skipped}人は変更していません。別端末でも同じアカウントで確認してください。`);
  }finally{busy=false;for(const id of ['apply','json','logout','refresh'])$(id).disabled=false;}
});
const unsubscribe=onAuthStateChanged(auth,()=>{action(async()=>{status('');await refresh();});});
return {refresh,refreshForPurchase:()=>refresh({returnToPurchase:true}),destroy:unsubscribe};
}
if(document.getElementById('migration-google'))mountPrivateMigrationPanel();
