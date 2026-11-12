import {createHash} from 'node:crypto';

export const DEFAULT_RATE_LIMIT_POLICIES=Object.freeze({
  'payment.checkout':Object.freeze({limit:5,windowMs:15*60_000}),
  'payment.cancel':Object.freeze({limit:8,windowMs:15*60_000}),
  'auth.firebase.session':Object.freeze({limit:12,windowMs:15*60_000}),
  'auth.line.start':Object.freeze({limit:6,windowMs:15*60_000}),
  'auth.google.start':Object.freeze({limit:6,windowMs:15*60_000}),
});

const digest=value=>createHash('sha256').update(value).digest('hex');

// Counters are transactionally stored in the configured account database, not in
// process memory. Identities are hashed before becoming Firestore document IDs.
export function createDurableRateLimiter({store,now=Date.now,policies=DEFAULT_RATE_LIMIT_POLICIES}){
  if(typeof store?.transaction!=='function'||typeof now!=='function')throw Error('rate_limit_store_not_configured');
  return Object.freeze({
    async consume(scope,identity){
      const policy=policies[scope];
      if(!policy||!Number.isSafeInteger(policy.limit)||policy.limit<1||!Number.isSafeInteger(policy.windowMs)||policy.windowMs<1000)throw Error('rate_limit_policy_not_configured');
      if(typeof identity!=='string'||!identity||identity.length>256)throw Error('rate_limit_identity_invalid');
      const time=now();if(!Number.isFinite(time))throw Error('rate_limit_clock_invalid');
      const key='rate-'+digest(`${scope}\0${identity}`);
      return store.transaction(async tx=>{
        const saved=await tx.getAttempt(key);
        const recent=(saved?.kind==='rate-limit'&&saved.scope===scope&&Array.isArray(saved.timestamps)?saved.timestamps:[])
          .filter(value=>Number.isFinite(value)&&value>time-policy.windowMs).sort((a,b)=>a-b);
        if(recent.length>=policy.limit){
          return {allowed:false,retryAfterSeconds:Math.max(1,Math.ceil((recent[0]+policy.windowMs-time)/1000))};
        }
        recent.push(time);
        const expiresAt=recent[0]+policy.windowMs;
        tx.putAttempt(key,{kind:'rate-limit',scope,timestamps:recent,expiresAt,ttlAt:new Date(expiresAt)});
        return {allowed:true,remaining:policy.limit-recent.length};
      });
    },
  });
}
