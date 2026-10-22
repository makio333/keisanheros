import {randomUUID} from 'node:crypto';
import {createAccountSaveService,DEFAULT_ACCOUNT_PRODUCTS} from './account-saves.mjs';
import {purchaseQuote,PURCHASE_PRICES} from './purchase-pricing.mjs';
import {paidSaveLimit,facilitySaveLimit} from './account-access.mjs';

// Inject the official server-only Stripe client. Receipt verification is never an HTTP API.
export function createStripePayments({stripe,store,sessions,origin,webhookSecret,personalPriceId,priceIds={},liveMode=false,now=Date.now,verifyLegacyClaim,fileMigrationAccountId,trialsEnabled=false}){
  const site=new URL(origin),local=['127.0.0.1','localhost'].includes(site.hostname);
  if(site.origin!==origin || (site.protocol!=='https:' && !(local && site.protocol==='http:')) || liveMode && site.protocol!=='https:')throw Error('unsafe_payment_origin');
  const prices=new Map(Object.entries({...{personal:personalPriceId},...priceIds}).filter(([,id])=>id));
  if(!webhookSecret?.startsWith('whsec_') || !prices.size || typeof liveMode!=='boolean' || [...prices].some(([product,id])=>!Object.hasOwn(DEFAULT_ACCOUNT_PRODUCTS,product) || typeof id!=='string' || !id.startsWith('price_')) || new Set(prices.values()).size!==prices.size)throw Error('stripe_not_configured');
  const verified=new WeakSet();
  const accounts=createAccountSaveService({store,sessions,now,verifyLegacyClaim,fileMigrationAccountId,trialsEnabled,verifyReceipt:async receipt=>verified.has(receipt)?receipt:null});
  async function productPrice(productId){
    const id=prices.get(productId);if(!id)throw Error('invalid_product');
    const price=await stripe.prices.retrieve(id);
    if(price.id!==id || !price.active || price.type!=='one_time' || price.currency!=='jpy' || price.livemode!==liveMode || price.unit_amount!==PURCHASE_PRICES[productId].amount || price.tax_behavior!=='inclusive')throw Error('invalid_stripe_price');
    return price;
  }
  const orderKey=id=>`stripeOrders/${id}`;
  const active=order=>order && !order.fulfilled && !order.cancelled;
  function validateSession(order,checkout){
    if(!checkout?.id || checkout.livemode!==liveMode || checkout.mode!=='payment' || checkout.metadata?.orderId!==order.id || checkout.client_reference_id!==order.accountId || order.stripeSessionId && order.stripeSessionId!==checkout.id)throw Error('invalid_stripe_checkout');
  }
  async function updateOrder(id,change){
    return store.transaction(async tx=>{
      const current=await tx.getGameDocument(orderKey(id));
      if(!current)throw Error('invalid_stripe_checkout');
      const next=change(current);tx.putGameDocument(orderKey(id),next);
      const key=`stripeCheckout/${next.accountId}`;
      if((await tx.getGameDocument(key))?.id===id)tx.putGameDocument(key,next);
      return next;
    });
  }
  async function sessionFor(order){
    let checkout;
    if(order.stripeSessionId)checkout=await stripe.checkout.sessions.retrieve(order.stripeSessionId);
    else{
      // Never recreate an ambiguous request after Stripe may have pruned its idempotency key.
      if(!order.checkoutParams || !Number.isFinite(order.createdAt) || now()-order.createdAt>=23*60*60*1000)throw Error('payment_processing');
      checkout=await stripe.checkout.sessions.create(order.checkoutParams,{idempotencyKey:'legend-checkout-'+order.id});
      validateSession(order,checkout);
      await updateOrder(order.id,current=>{
        validateSession(current,checkout);
        return {...current,stripeSessionId:checkout.id,expiresAt:checkout.expires_at*1000};
      });
    }
    validateSession(order,checkout);return checkout;
  }
  async function releaseExpired(order,checkout){
    if(checkout.status!=='expired' || checkout.payment_status!=='unpaid')return false;
    await updateOrder(order.id,current=>({...current,cancelled:true}));return true;
  }
  return {
    accounts,
    async listProducts(sessionId){
      const summary=await accounts.summary(sessionId),products=[];
      if(summary.facilityAccess)return products;
      for(const [id] of prices){
        const product=DEFAULT_ACCOUNT_PRODUCTS[id];if(product.saveLimit<=summary.paidSaveLimit)continue;
        await productPrice(id);
        products.push({id,saveLimit:product.saveLimit,kind:product.kind,...purchaseQuote(summary.paidSaveLimit,id),currency:'jpy'});
      }
      return products.sort((a,b)=>a.saveLimit-b.saveLimit);
    },
    async checkout(sessionId,productId='personal'){
      const summary=await accounts.summary(sessionId);
      if(summary.facilityAccess)throw Error('facility_account_managed');
      if(!prices.has(productId))throw Error('invalid_product');
      const quote=purchaseQuote(summary.paidSaveLimit,productId);
      const price=await productPrice(productId);
      const previous=await store.transaction(tx=>tx.getGameDocument(`stripeCheckout/${summary.accountId}`));
      if(active(previous)){
        const checkout=await sessionFor(previous);
        if(!await releaseExpired(previous,checkout) && (checkout.status!=='open' || checkout.payment_status!=='unpaid'))throw Error('payment_processing');
      }
      // One active order per purchaser prevents parallel purchases against the same credit.
      // Commit the order and immutable request BEFORE calling Stripe, including on timeout/restart.
      const order=await store.transaction(async tx=>{
        const account=await tx.getAccount(summary.accountId);
        if(facilitySaveLimit(account))throw Error('facility_account_managed');
        const capacity=await paidSaveLimit(tx,account);
        if(capacity!==summary.paidSaveLimit)throw Error('purchase_changed');
        const key=`stripeCheckout/${summary.accountId}`,previous=await tx.getGameDocument(key);
        let order=previous;
        if(active(previous)){
          if(previous.productId!==productId || previous.fromLimit!==quote.fromLimit || previous.amount!==quote.amount || previous.priceId!==price.id)throw Error('checkout_in_progress');
        }else{
          order={id:randomUUID(),accountId:summary.accountId,productId,priceId:price.id,...quote,createdAt:now()};
          const lineItem=quote.credit?{price_data:{currency:'jpy',unit_amount:order.amount,tax_behavior:'inclusive',product_data:{name:`レジェンドヒーローズ ${PURCHASE_PRICES[productId].name}へ増枠（差額）`}},quantity:1}:{price:order.priceId,quantity:1};
          order.checkoutParams={mode:'payment',client_reference_id:order.accountId,metadata:{orderId:order.id},line_items:[lineItem],
            adaptive_pricing:{enabled:false},success_url:origin+'/?purchase=processing',cancel_url:origin+'/?purchase=cancelled'};
        }
        tx.putGameDocument(key,order);tx.putGameDocument(`stripeOrders/${order.id}`,order);
        return order;
      });
      const checkout=await sessionFor(order);
      if(await releaseExpired(order,checkout))throw Error('purchase_changed');
      if(checkout.status!=='open' || checkout.payment_status!=='unpaid')throw Error('payment_processing');
      const current=await store.transaction(tx=>tx.getGameDocument(orderKey(order.id)));
      if(!active(current))throw Error('purchase_changed');
      const url=new URL(checkout.url);
      if(url.origin!=='https://checkout.stripe.com' || url.username || url.password)throw Error('invalid_checkout_url');
      return {url:url.href};
    },
    async cancelCheckout(sessionId){
      const summary=await accounts.summary(sessionId);
      const order=await store.transaction(tx=>tx.getGameDocument(`stripeCheckout/${summary.accountId}`));
      if(!active(order))return {cancelled:true};
      let checkout=await sessionFor(order);
      if(checkout.status==='open' && checkout.payment_status==='unpaid')checkout=await stripe.checkout.sessions.expire(checkout.id);
      validateSession(order,checkout);
      if(!await releaseExpired(order,checkout))throw Error('payment_processing');
      return {cancelled:true};
    },
    async webhook(rawBody,signature){
      let event;
      try{event=stripe.webhooks.constructEvent(rawBody,signature,webhookSecret);}catch{throw Error('invalid_stripe_signature');}
      if(event.livemode!==liveMode)throw Error('stripe_mode_mismatch');
      if(!['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type))return {received:true};
      const checkout=await stripe.checkout.sessions.retrieve(event.data.object.id,{expand:['line_items']});
      if(checkout.livemode!==liveMode || checkout.mode!=='payment')throw Error('invalid_stripe_checkout');
      if(checkout.payment_status!=='paid' || checkout.status!=='complete')return {received:true};
      const order=await store.transaction(tx=>tx.getGameDocument(`stripeOrders/${checkout.metadata?.orderId}`));
      const lines=checkout.line_items;
      const item=lines?.data?.[0];
      if(!order || order.cancelled || order.stripeSessionId && order.stripeSessionId!==checkout.id || order.accountId!==checkout.client_reference_id || lines?.has_more || lines?.data?.length!==1 || item.quantity!==1 || !order.credit && item.price?.id!==order.priceId || item.price?.unit_amount!==order.amount || item.price?.tax_behavior!=='inclusive' || item.price?.currency!=='jpy' || item.price?.type!=='one_time' || checkout.currency!=='jpy' || checkout.amount_total!==order.amount)throw Error('invalid_stripe_checkout');
      const productId=order.productId||'personal';
      if(!Object.hasOwn(DEFAULT_ACCOUNT_PRODUCTS,productId))throw Error('invalid_stripe_checkout');
      // The signed webhook can arrive even when the Session creation response was lost.
      await updateOrder(order.id,current=>{validateSession(current,checkout);return {...current,stripeSessionId:checkout.id};});
      const receipt={eventId:'stripe:'+event.id,purchaseId:'stripe:'+checkout.id,accountId:order.accountId,productId};
      verified.add(receipt);
      try{
        await accounts.applyPurchaseEvidence(receipt);
        await updateOrder(order.id,current=>({...current,fulfilled:true}));
      }finally{verified.delete(receipt);}
      return {received:true};
    },
  };
}
