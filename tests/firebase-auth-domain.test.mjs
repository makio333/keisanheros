import {test} from 'node:test';import assert from 'node:assert/strict';
import {PRODUCT_FIREBASE_CONFIG,productFirebaseConfig} from '../firebase_product_config.js';
test('same-origin auth candidate changes only authDomain and is opt-in',()=>{
 assert.equal(PRODUCT_FIREBASE_CONFIG.authDomain,'ailandgames.firebaseapp.com');
 const candidate=productFirebaseConfig('legend-heroes2.web.app');
 assert.deepEqual({...candidate,authDomain:PRODUCT_FIREBASE_CONFIG.authDomain},PRODUCT_FIREBASE_CONFIG);
 assert.equal(candidate.projectId,'ailandgames');assert.equal(Object.isFrozen(candidate),true);
 for(const value of ['attacker.example','https://legend-heroes2.web.app','legend-heroes2.web.app.attacker.example'])assert.throws(()=>productFirebaseConfig(value),/unsupported_auth_domain/);
});
