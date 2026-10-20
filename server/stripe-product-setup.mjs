import {PURCHASE_PRICES,PRICING_VERSION} from './purchase-pricing.mjs';

export async function registerTestStripeProducts(stripe){
  const ids={};
  for(const [id,plan] of Object.entries(PURCHASE_PRICES)){
    const lookupKey=`legend_heroes_${id}_${PRICING_VERSION}`;
    const previous=await stripe.prices.list({lookup_keys:[lookupKey],limit:2});
    if(previous.data.length>1)throw Error('duplicate_stripe_price');
    const price=previous.data[0]||await stripe.prices.create({lookup_key:lookupKey,currency:'jpy',unit_amount:plan.amount,tax_behavior:'inclusive',
      product_data:{name:`レジェンドヒーローズ ${plan.name}（買い切り）`,metadata:{productId:id,saveLimit:String(plan.saveLimit),pricingVersion:PRICING_VERSION}},
    },{idempotencyKey:'legend-price-'+lookupKey});
    if(price.livemode!==false || !price.active || price.type!=='one_time' || price.currency!=='jpy' || price.unit_amount!==plan.amount || price.tax_behavior!=='inclusive')throw Error('stripe_catalog_mismatch');
    ids[id]=price.id;
  }
  return ids;
}
