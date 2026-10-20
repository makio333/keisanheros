import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const handlers={},requests=[];let sequence=0,offline=false;
const context=vm.createContext({URL,console,self:{location:{origin:'https://fixture.invalid'},addEventListener:(type,fn)=>handlers[type]=fn},
  caches:{match(){throw Error('private API must never read cache');},open(){throw Error('private API must never write cache');}},
  fetch:async(request,options)=>{requests.push({request,options});if(offline)throw Error('offline');return {sequence:++sequence};},
});
vm.runInContext(fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8'),context);
async function call(path){let response;handlers.fetch({request:{url:'https://fixture.invalid'+path,method:'GET',mode:'navigate'},respondWith:value=>response=value});return response;}
for(const path of ['/api/account','/api/auth/session','/api/saves','/api/saves/fixture','/api/auth/line/callback?code=fixture']){
  const first=await call(path),next=await call(path);assert.notEqual(first.sequence,next.sequence);assert.equal(requests.at(-1).options.cache,'no-store');
}
offline=true;await assert.rejects(call('/api/account'),/offline/);
let handled=false;handlers.fetch({request:{url:'https://fixture.invalid.attacker.test/api/account',method:'GET'},respondWith:()=>handled=true});assert.equal(handled,false);
console.log('PASS: auth/account/save APIs bypass service-worker caches, stay fresh across logins and fail closed offline.');
