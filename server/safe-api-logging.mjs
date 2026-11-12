import {randomUUID} from 'node:crypto';

const ROUTES=new Map([
  ['/api/auth/firebase/session','auth.firebase.session'],
  ['/api/auth/email-registration','auth.email.registration'],
  ['/api/auth/line/start','auth.line.start'],
  ['/api/auth/line/callback','auth.line.callback'],
  ['/api/auth/google/start','auth.google.start'],
  ['/api/auth/google/callback','auth.google.callback'],
  ['/api/auth/providers','auth.providers'],
  ['/api/payments/products','payment.products'],
  ['/api/payments/status','payment.status'],
  ['/api/payments/checkout','payment.checkout'],
  ['/api/payments/checkout/cancel','payment.cancel'],
  ['/api/payments/stripe/webhook','payment.webhook'],
]);

export function safeRouteLabel(requestUrl){
  let pathname='';try{pathname=new URL(requestUrl,'https://local.invalid').pathname;}catch{}
  if(ROUTES.has(pathname))return ROUTES.get(pathname);
  if(pathname==='/api/account'||pathname.startsWith('/api/saves'))return 'account.saves';
  if(pathname.startsWith('/api/game/'))return 'account.game';
  return 'other';
}

export function logSafeApiFailure({logger=console,request,requestId=randomUUID()}={}){
  const allowedMethods=new Set(['GET','POST','PUT','PATCH','DELETE','OPTIONS','HEAD']);
  const event={event:'api_request_failed',requestId,route:safeRouteLabel(request?.url||''),method:allowedMethods.has(request?.method)?request.method:'OTHER'};
  try{logger.error(JSON.stringify(event));}catch{}
  return requestId;
}
