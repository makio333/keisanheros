import test from 'node:test';
import assert from 'node:assert/strict';
import {createSalesRequestBudget} from '../server/sales-request-budget.mjs';

test('admission bounds concurrency and minute count, releases safely, and cannot be reset by a backwards clock',()=>{
  let time=100000;const budget=createSalesRequestBudget({maxPerMinute:2,maxInFlight:1,now:()=>time});
  const first=budget.enter();assert.equal(first.allowed,true);assert.equal(budget.enter().allowed,false);
  first.release();first.release();const second=budget.enter();second.release();
  assert.equal(budget.enter().allowed,false);time-=5000;assert.equal(budget.enter().allowed,false);
  time=160000;assert.equal(budget.enter().allowed,true);
  assert.equal(budget.limits.spendingCap,false);assert.equal(budget.limits.scope,'process-local');
});

test('unsafe limits fail rather than lifting the request guard',()=>{
  for(const input of [{maxPerMinute:0},{maxPerMinute:601},{maxInFlight:0},{maxInFlight:21},{maxPerMinute:Infinity}])assert.throws(()=>createSalesRequestBudget(input));
});
