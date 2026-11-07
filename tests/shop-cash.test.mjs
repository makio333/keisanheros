import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const elements=new Map();let granted=0,overlay;
const node=id=>{
  if(!elements.has(id))elements.set(id,{value:'',textContent:'',innerHTML:'',children:[],appendChild(child){this.children.push(child);},before(child){this.beforeChild=child;},focus(){},querySelector:selector=>selectors[selector],querySelectorAll:()=>[],remove(){this.removed=true;},onclick:null});
  return elements.get(id);
};
const context=vm.createContext({
  G:{player:{gold:1681}},escapeHtml:String,
  showConfirmModal:(title,message,onYes)=>{context.lastConfirmation={title,message,onYes};},
  document:{querySelector:()=>null,createElement:()=>node('created-'+elements.size),body:{appendChild(value){overlay=value;}}},
});
vm.runInContext(source.slice(source.indexOf('const SHOP_CASH_DENOMINATIONS ='),source.indexOf('/* ==========================================================\n   装備画面')),context);

assert.deepEqual(Array.from(context.shopCashBreakdown(1681),row=>[row.value,row.count]),[[1000,1],[500,1],[100,1],[50,1],[10,3],[1,1]]);
const selectors={
  '#shop-payment-tender':node('tender'),'#shop-payment-change':node('change'),
  '#shop-payment-feedback':node('feedback'),'.confirm-actions':node('actions'),
  '[data-cancel]':node('cancel'),'[data-pay]':node('pay'),
};
context.showShopPaymentModal('検証アイテム',350,()=>granted++);
assert.match(overlay.innerHTML,/1000G札 ×1/,'the payment UI shows available bills');
assert.match(overlay.innerHTML,/500G玉 ×1/,'the payment UI shows available coins');
selectors['#shop-payment-tender'].value='1000';selectors['#shop-payment-change'].value='649';selectors['[data-pay]'].onclick();
assert.equal(granted,0,'incorrect change cannot complete purchase');
assert.match(selectors['#shop-payment-feedback'].textContent,/おつりが違う/);
selectors['#shop-payment-change'].value='650';selectors['[data-pay]'].onclick();
assert.equal(granted,1,'correct change completes the purchase once');
assert.equal(overlay.removed,true);
assert.equal(vm.runInContext('SHOP_CASH_TENDER_EXERCISE_ENABLED',context),false,'cash tender practice remains off until resumed');
let directPurchase=0;
context.confirmShopPurchase('購入テスト',350,()=>directPurchase++);
assert.match(context.lastConfirmation.message,/価格 <b>350G<\/b>/,'disabled tender flow shows a simple exact-price confirmation');
assert.equal(directPurchase,0,'purchase waits for confirmation');
context.lastConfirmation.onYes();
assert.equal(directPurchase,1,'confirmation keeps normal purchasing available');
console.log('PASS: cash breakdown shows G denominations; shop purchase requires correct change before completing.');
