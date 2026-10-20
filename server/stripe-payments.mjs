import {randomUUID} from 'node:crypto';
import {createAccountSaveService,DEFAULT_ACCOUNT_PRODUCTS} from './account-saves.mjs';
import {purchaseQuote,PURCHASE_PRICES} from './purchase-pricing.mjs';

// Inject the official server-only Stripe client. Receipt verification is never an HTTP API.
export function createStripePayments({stripe,store,sessions,origin,webhookSecret,personalPriceId,priceIds={},liveMode=false,now=Date.now}){
  const site=new URL(origin),local=['127.0.0.1','localhost'].includes(site.hostname);
  if(site.origin!==origin || (site.protocol!=='https:' && !(local && site.protocol==='http:')) || liveMode && site.protocol!=='https:')throw Error('unsafe_payment_origin');
  const prices=new Map(Object.entries({...{personal:personalPriceId},...priceIds}).filter(([,id])=>id));
  if(!webhookSecret?.startsWith('whsec_') || !prices.size || typeof liveMode!=='boolean' || [...prices].some(([product,id])=>!Object.hasOwn(DEFAULT_ACCOUNT_PRODUCTS,product) || typeof id!=='string' || !id.startsWith('price_')) || new Set(prices.values()).size!==prices.size)throw Error('stripe_not_configured');
  const verified=new WeakSet();
  const accounts=createAccountSaveService({store,sessions,now,verifyReceipt:async receipt=>verified.has(receipt)?receipt:null});
  async function productPrice(productId){
    const id=prices.get(productId);if(!id)throw Error('invalid_product');
    const price=await stripe.prices.retrieve(id);
    if(price.id!==id || !price.active || price.type!=='one_time' || price.currency!=='jpy' || price.livemode!==liveMode || price.unit_amount!==PURCHASE_PRICES[productId].amount || price.tax_behavior!=='inclusive')throw Error('invalid_stripe_price');
    return price;
  }
  return {
    accounts,
    async listProducts(sessionId){
      const summary=await accounts.summary(sessionId),products=[];
      for(const [id] of prices){
        const product=DEFAULT_ACCOUNT_PRODUCTS[id];if(product.saveLimit<=summary.saveLimit)continue;
        await productPrice(id);
        products.push({id,saveLimit:product.saveLimit,kind:product.kind,...purchaseQuote(summary.saveLimit,id),currency:'jpy'});
      }
      return products.sort((a,b)=>a.saveLimit-b.saveLimit);
    },
    async checkout(sessionId,productId='personal'){
      const summary=await accounts.summary(sessionId);
      if(!prices.has(productId))throw Error('invalid_product');
      const quote=purchaseQuote(summary.saveLimit,productId);
      const price=await productPrice(productId);
      // One active order per purchaser prevents parallel purchases against the same credit.
      return store.transaction(async tx=>{
        const capacity=tx.listPurchases(summary.accountId).reduce((max,row)=>Math.max(max,row.active===true?(DEFAULT_ACCOUNT_PRODUCTS[row.productId]?.saveLimit||0):0),0);
        if(capacity!==summary.saveLimit)throw Error('purchase_changed');
        const key=`stripeCheckout/${summary.accountId}`,previous=tx.getGameDocument(key);
        let order=previous;
        if(previous && !previous.fulfilled && !previous.cancelled && previous.expiresAt>now()){
          if(previous.productId!==productId || previous.fromLimit!==quote.fromLimit || previous.amount!==quote.amount || previous.priceId!==price.id)throw Error('checkout_in_progress');
        }else{
          order={id:randomUUID(),accountId:summary.accountId,productId,priceId:price.id,...quote,expiresAt:now()+24*60*60*1000};
        }
        const lineItem=quote.credit?{price_data:{currency:'jpy',unit_amount:order.amount,tax_behavior:'inclusive',product_data:{name:`レジェンドヒーローズ ${PURCHASE_PRICES[productId].name}へ増枠（差額）`}},quantity:1}:{price:order.priceId,quantity:1};
        const checkout=await stripe.checkout.sessions.create({mode:'payment',client_reference_id:order.accountId,
          metadata:{orderId:order.id},line_items:[lineItem],
          success_url:origin+'/?purchase=processing',cancel_url:origin+'/?purchase=cancelled',
        },{idempotencyKey:'legend-checkout-'+order.id});
        const url=new URL(checkout.url);
        if(url.origin!=='https://checkout.stripe.com')throw Error('invalid_checkout_url');
        order={...order,stripeSessionId:checkout.id,expiresAt:checkout.expires_at*1000||order.expiresAt};
        tx.putGameDocument(key,order);tx.putGameDocument(`stripeOrders/${order.id}`,order);
        return {url:url.href};
      });
    },
    async cancelCheckout(sessionId){
      const summary=await accounts.summary(sessionId);
      return store.transaction(async tx=>{
        const key=`stripeCheckout/${summary.accountId}`,order=tx.getGameDocument(key);
        if(!order || order.fulfilled || order.cancelled)return {cancelled:true};
        const checkout=await stripe.checkout.sessions.retrieve(order.stripeSessionId);
        if(checkout.status==='complete')throw Error('payment_processing');
        if(checkout.status==='open')await stripe.checkout.sessions.expire(checkout.id);
        else if(checkout.status!=='expired')throw Error('payment_processing');
        const cancelled={...order,cancelled:true};tx.putGameDocument(key,cancelled);tx.putGameDocument(`stripeOrders/${order.id}`,cancelled);
        return {cancelled:true};
      });
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
      if(!order || order.cancelled || order.stripeSessionId!==checkout.id || order.accountId!==checkout.client_reference_id || lines?.has_more || lines?.data?.length!==1 || item.quantity!==1 || !order.credit && item.price?.id!==order.priceId || item.price?.unit_amount!==order.amount || item.price?.tax_behavior!=='inclusive' || item.price?.currency!=='jpy' || item.price?.type!=='one_time' || checkout.currency!=='jpy' || checkout.amount_total!==order.amount)throw Error('invalid_stripe_checkout');
      const productId=order.productId||'personal';
      if(!Object.hasOwn(DEFAULT_ACCOUNT_PRODUCTS,productId))throw Error('invalid_stripe_checkout');
      const receipt={eventId:'stripe:'+event.id,purchaseId:'stripe:'+checkout.id,accountId:order.accountId,productId};
      verified.add(receipt);
      try{
        await accounts.applyPurchaseEvidence(receipt);
        await store.transaction(tx=>{
          const fulfilled={...order,fulfilled:true};tx.putGameDocument(`stripeOrders/${order.id}`,fulfilled);
          const key=`stripeCheckout/${order.accountId}`;
          if(tx.getGameDocument(key)?.id===order.id)tx.putGameDocument(key,fulfilled);
        });
      }finally{verified.delete(receipt);}
      return {received:true};
    },
  };
}
