import {createHash} from 'node:crypto';
import {salesEmailReturnPath} from './sales-email-return.mjs';

// Injected transport only. No network, SDK initialization or credentials on import.
// A reserve without confirmed completion remains uncertain: never blindly resend.
export function createSalesEmailDelivery({enabled=false,config,emailVerification,generateVerificationLink,sendMessage,ledger,now=Date.now}={}){
  if(config?.ready===true&&(config.projectId!=='ailandgames'||config.origin!=='https://legend-heroes2.web.app'))throw Error('sales_email_target_mismatch');
  const ready=enabled===true&&config?.ready===true&&typeof emailVerification?.status==='function'&&typeof generateVerificationLink==='function'&&typeof sendMessage==='function'&&typeof ledger?.reserve==='function'&&typeof ledger?.complete==='function';
  return Object.freeze({ready,async send({idToken,returnTo='/'}={}){
    if(!ready)throw Error('email_delivery_unavailable');
    const path=salesEmailReturnPath(returnTo),current=await emailVerification.status(idToken);
    if(current?.claims?.uid!==current?.user?.uid||!current.user?.email||current.user.disabled)throw Error('authentication_required');
    if(current.emailVerified===true)return {sent:false,alreadyVerified:true};
    const email=current.user.email;
    const key=createHash('sha256').update(JSON.stringify(['sales-email',config.projectId,current.claims.uid,email.toLowerCase()])).digest('hex');
    const ownerUidHash=createHash('sha256').update(current.claims.uid).digest('hex');
    const reserved=await ledger.reserve({key,ownerUidHash,now:now(),cooldownMs:60000});
    if(reserved?.status!=='reserved')throw Error(reserved?.status==='cooldown'?'email_delivery_rate_limited':'email_delivery_uncertain');
    const deliveryId=reserved.deliveryId;
    if(typeof deliveryId!=='string'||!deliveryId)throw Error('email_delivery_uncertain');
    try{
      const link=await generateVerificationLink(email,{url:config.origin+'/purchase-email-verification.html?returnTo='+encodeURIComponent(path),handleCodeInApp:false});
      const url=new URL(link);
      if(url.protocol!=='https:'||url.username||url.password||!['ailandgames.firebaseapp.com','legend-heroes2.web.app'].includes(url.hostname))throw Error('email_action_link_untrusted');
      // Stable provider idempotency key allows an operator to reconcile uncertain delivery.
      const result=await sendMessage({deliveryId,to:email,subject:'レジェンドヒーローズ メールアドレスの確認',text:'現在ログイン中のアカウントのメールアドレスを確認します。確認だけで購入・決済は行われません。\n\n'+url.href});
      if(result?.accepted!==true)throw Error('email_delivery_uncertain');
      await ledger.complete({key,deliveryId,now:now(),status:'sent'});
      return {sent:true};
    }catch{
      // Do not log the action link/address or unlock an ambiguous send for automatic retry.
      throw Error('email_delivery_uncertain');
    }
  }});
}
