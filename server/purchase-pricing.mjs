export const PRICING_VERSION='2026-10-20-v1';
export const PURCHASE_PRICES=Object.freeze({
  personal:Object.freeze({name:'個人 3人分',saveLimit:3,amount:4980}),
  organization10:Object.freeze({name:'団体 10人分',saveLimit:10,amount:19800}),
  organization20:Object.freeze({name:'団体 20人分',saveLimit:20,amount:34800}),
  organization30:Object.freeze({name:'団体 30人分',saveLimit:30,amount:49800}),
});

export function purchaseQuote(saveLimit,productId){
  if(!Object.hasOwn(PURCHASE_PRICES,productId))throw Error('invalid_product');
  const target=PURCHASE_PRICES[productId];
  if(target.saveLimit<=saveLimit)throw Error('already_purchased');
  const base=Object.entries(PURCHASE_PRICES).find(([,plan])=>plan.saveLimit===saveLimit);
  if(saveLimit!==0 && !base)throw Error('unsupported_upgrade');
  const credit=base?.[1].amount||0;
  return {amount:target.amount-credit,totalAmount:target.amount,credit,fromProductId:base?.[0]||null,fromLimit:saveLimit,pricingVersion:PRICING_VERSION};
}
