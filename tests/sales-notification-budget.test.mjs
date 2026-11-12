import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createAccountDeletionNotificationDelivery} from '../server/account-deletion-notification-delivery.mjs';
const hash=value=>createHash('sha256').update(value).digest('hex');

test('repeated provider failures stop after the configured bounded attempts and are never reported as delivered',async()=>{
  let clock=Date.parse('2026-11-02T00:00:00.000Z'),sends=0;const rows=new Map();
  const store={transaction:async cb=>cb({get:async id=>structuredClone(rows.get(id)||null),put:(id,row)=>rows.set(id,structuredClone(row))}),listDue:async()=>[...rows.values()].map(row=>({id:row.id}))};
  const outbox=createAccountDeletionNotificationDelivery({store,deliveryEnabled:true,now:()=>clock,maxAttempts:3,
    transport:{idempotent:true,send:async()=>{sends++;throw Error('synthetic provider failure');}}});
  const uidHash=hash('synthetic'),accountIdHash=hash('synthetic-account');
  await outbox.enqueue({requestId:'synthetic-request',uidHash,accountIdHash,verifiedContact:{verified:true,uidHash,accountIdHash,email:'synthetic@example.test'},notice:{stage:'received',state:'retention_pending',purgeAfter:clock+31*86400000}});
  for(let attempt=0;attempt<10;attempt++){clock+=86400000;const result=await outbox.drain();assert.equal(result.sent,0);}
  assert.equal(sends,3);const [row]=rows.values();assert.equal(row.state,'held');assert.equal(row.holdReason,'attempt_limit');assert.equal(row.attempts,3);
  assert.equal(row.sentAt,undefined,'held is not delivery completion');
});

test('retry caps cannot be raised silently or disabled by malformed configuration',()=>{
  const store={transaction:async()=>{},listDue:async()=>[]};
  for(const maxAttempts of [0,9,Infinity,'8'])assert.throws(()=>createAccountDeletionNotificationDelivery({store,maxAttempts}),/notification_attempt_limit_invalid/);
});
