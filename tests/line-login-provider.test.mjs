import test from 'node:test';import assert from 'node:assert/strict';
import {createLineLoginProvider,preferLineBrowserLogin} from '../line_login.js';
class Provider {constructor(id){this.providerId=id;this.scopes=[];}addScope(scope){this.scopes.push(scope);}setCustomParameters(params){this.params=params;}}
test('LINE browser-only retry keeps provider and profile scope and prevents app auto-login',()=>{
 const normal=createLineLoginProvider(Provider),retry=createLineLoginProvider(Provider,{browserOnly:true});
 assert.equal(normal.providerId,'oidc.line');assert.equal(retry.providerId,'oidc.line');assert.deepEqual(normal.scopes,['profile']);assert.deepEqual(retry.scopes,['profile']);assert.equal(normal.params,undefined);assert.deepEqual(retry.params,{disable_auto_login:'true'});
});
test('phones and touch iPad default to browser login; desktop keeps normal login',()=>{
 for(const nav of [{userAgent:'iPhone'},{userAgent:'Android'},{userAgent:'iPad'},{userAgent:'Macintosh',maxTouchPoints:5}])assert.equal(preferLineBrowserLogin(nav),true);
 for(const nav of [{userAgent:'Macintosh',maxTouchPoints:0},{userAgent:'Windows NT'},{}])assert.equal(preferLineBrowserLogin(nav),false);
});
