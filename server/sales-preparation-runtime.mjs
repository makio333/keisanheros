import {validateSalesEmailCutover} from './sales-email-cutover.mjs';
import {createSalesEmailDelivery} from './sales-email-delivery.mjs';
import {createSalesEmailHandler} from './sales-email-http.mjs';
import {createEmailVerificationHandler} from './email-verification-http.mjs';
import {createAccountDeletionHandler} from './account-deletion-http.mjs';

const ORIGIN='https://legend-heroes2.web.app';

// A local candidate composition point. It neither imports an Admin SDK nor reads
// environment/credentials. The serving product entry point is intentionally not
// replaced. Approved callers inject their existing identity and storage objects.
export function createSalesPreparationRuntime({emailCutover={},emailVerification,mail={},deletionRuntime,authenticateDeletion}={}){
  const config=validateSalesEmailCutover(emailCutover);
  const delivery=createSalesEmailDelivery({
    config,emailVerification,enabled:mail.enabled===true,
    generateVerificationLink:mail.generateVerificationLink,sendMessage:mail.sendMessage,
    ledger:mail.ledger,...(mail.now?{now:mail.now}:{}),
  });
  const emailHandler=createSalesEmailHandler({config,delivery,origin:ORIGIN});
  const registrationHandler=config.ready&&emailVerification?createEmailVerificationHandler({service:emailVerification,origin:ORIGIN}):null;
  if(deletionRuntime&&(deletionRuntime.service?.executionProfile!=='production-guarded'||typeof deletionRuntime.run!=='function'||typeof authenticateDeletion!=='function'))throw Error('sales_deletion_runtime_not_configured');
  const deletionHandler=deletionRuntime?createAccountDeletionHandler({service:deletionRuntime.service,origin:ORIGIN,authenticate:authenticateDeletion}):null;
  return Object.freeze({
    config,delivery,
    readiness:Object.freeze({emailCutoverConfigured:config.ready===true,emailDeliveryConfigured:delivery.ready===true,
      deletionRuntimeConfigured:!!deletionHandler,productionVerified:false,published:false}),
    async handler(req,res){
      if(await emailHandler(req,res))return true;
      if(registrationHandler&&await registrationHandler(req,res))return true;
      if(deletionHandler&&await deletionHandler(req,res))return true;
      return false;
    },
    // Deliberately not an HTTP route; Scheduler/Job IAM must be separately reviewed.
    async runDeletionWorker(){return deletionRuntime?deletionRuntime.run():{ok:false,error:'deletion_runtime_disabled'};},
  });
}
