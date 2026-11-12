import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const handlers={},requests=[];
const context=vm.createContext({URL,console,self:{location:{origin:'https://fixture.invalid'},addEventListener:(type,fn)=>handlers[type]=fn},
  caches:{match(){throw Error('private API must never read cache');},open(){throw Error('private API must never write cache');}},
  fetch:async(request,options)=>{requests.push({request,options});throw Error('private API must use the browser network stack');},
});
vm.runInContext(fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8'),context);
for(const path of ['/api','/api/account','/api/auth/session','/api/saves','/api/saves/fixture','/api/auth/line/callback?code=fixture','/api/payments/stripe/webhook']){
  for(const mode of ['navigate','cors','same-origin']){
    let handled=false;
    handlers.fetch({request:{url:'https://fixture.invalid'+path,method:'GET',mode},respondWith:()=>handled=true});
    assert.equal(handled,false,'API requests and OAuth redirects must be handled directly by the browser');
  }
}
assert.equal(requests.length,0,'the worker must not duplicate private API requests');
let handled=false;handlers.fetch({request:{url:'https://fixture.invalid.attacker.test/api/account',method:'GET'},respondWith:()=>handled=true});assert.equal(handled,false);
console.log('PASS: auth/account/save/payment APIs bypass the service worker entirely, including OAuth navigations; no duplicate fetch or private cache fallback.');
