// Test-only contract adapter; never use this volatile store for production accounts.
import {randomUUID} from 'node:crypto';
export function createLocalAuthStore() {
  const attempts=new Map(),identities=new Map(),accounts=new Map(),sessions=new Map();
  return {
    attempts,identities,accounts,sessions,
    async getAuthenticatedAccount(id){return sessions.get(id) || null;},
    async putAttempt(key,attempt){attempts.set(key,attempt);},
    async consumeAttempt(key,browserHash,now){
      const attempt=attempts.get(key);
      if(!attempt || attempt.browserHash!==browserHash || attempt.expiresAt<=now)return null;
      attempts.delete(key);return attempt;
    },
    async resolveIdentity({provider,providerId,subject,linkAccountId}) {
      const key=JSON.stringify([provider,providerId,subject]);
      const existing=identities.get(key);
      if(existing){if(linkAccountId && existing!==linkAccountId)throw Error('identity_already_linked');return {accountId:existing,created:false};}
      if(linkAccountId && !accounts.has(linkAccountId))throw Error('account_not_found');
      const accountId=linkAccountId || randomUUID();
      if(!linkAccountId)accounts.set(accountId,{id:accountId,entitlements:[]});
      identities.set(key,accountId);
      return {accountId,created:!linkAccountId};
    },
  };
}
