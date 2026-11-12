import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createServer as createViteServer} from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const targetEmail = 'motoyanyouuki0326@gmail.com';
const source = await readFile(new URL('../email-verification-status.js', import.meta.url), 'utf8');
const configSource = await readFile(new URL('../firebase_product_config.js', import.meta.url), 'utf8');
const imports = [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map(match => match[1]);
assert.deepEqual(imports, ['firebase/app', 'firebase/auth', './firebase_product_config.js']);
assert.doesNotMatch(source + configSource, /firestore|sendEmailVerification|createUserWithEmailAndPassword|XMLHttpRequest|\bfetch\s*\(|\/api\//i);
assert.match(source, /productFirebaseConfig\('ailandgames\.firebaseapp\.com'\)/);
assert.match(source, /config\.projectId !== 'ailandgames'/);
assert.match(source, /persistence: inMemoryPersistence/);

async function runScenario({verified = true, signInFails = false} = {}) {
  const fixture = {calls: [], verified, signInFails};
  globalThis.__emailStatusFixture = fixture;
  const modules = {
    'firebase/app': `
      export const initializeApp = (config, appName) => {
        globalThis.__emailStatusFixture.calls.push({op:'initializeApp', projectId:config.projectId, authDomain:config.authDomain, appName});
        return {config, appName};
      };
    `,
    'firebase/auth': `
      export const inMemoryPersistence = {kind:'memory'};
      export const initializeAuth = (app, options) => {
        const state = globalThis.__emailStatusFixture;
        state.calls.push({op:'initializeAuth', persistence:options.persistence.kind});
        state.auth = {app, _languageCode:null, set languageCode(value) { this._languageCode=value; state.calls.push({op:'setLanguageCode',value}); }, get languageCode() { return this._languageCode; }};
        return state.auth;
      };
      export const signInWithEmailAndPassword = async (_auth, email, _password) => {
        const state = globalThis.__emailStatusFixture;
        state.calls.push({op:'signInWithEmailAndPassword', email});
        if (state.signInFails) throw Object.assign(new Error('fixture'), {code:'auth/invalid-credential'});
        state.user = {email, emailVerified:false};
        return {user:state.user};
      };
      export const reload = async user => {
        const state = globalThis.__emailStatusFixture;
        state.calls.push({op:'reload'});
        user.emailVerified = state.verified;
      };
      export const signOut = async () => globalThis.__emailStatusFixture.calls.push({op:'signOut'});
    `,
  };
  const dom = {
    form: {listener:null, reportValidity:()=>true, addEventListener(_event, listener) { this.listener=listener; }},
    passwordInput:{value:'fixture-only-not-a-real-password'},
    button:{disabled:false,textContent:'確認状態をチェック'},
    status:{textContent:''},
  };
  globalThis.document = {querySelector(selector) {
    if (selector === '#status-form') return dom.form;
    if (selector === '#password') return dom.passwordInput;
    if (selector === '#check-button') return dom.button;
    if (selector === '#status') return dom.status;
    throw new Error('unexpected_dom_selector');
  }};

  const vite = await createViteServer({
    root,
    configFile:false,
    ssr:{noExternal:['firebase']},
    plugins:[{name:'email-status-auth-mock-only',enforce:'pre',
      resolveId(id) { if (Object.hasOwn(modules,id)) return `\0fixture:${id}`; },
      load(id) { if (id.startsWith('\0fixture:')) return modules[id.slice('\0fixture:'.length)]; },
    }],
  });
  try {
    await vite.ssrLoadModule('/email-verification-status.js');
    assert.deepEqual(fixture.calls.map(call=>call.op),['initializeApp','initializeAuth','setLanguageCode']);
    assert.equal(fixture.calls[0].projectId,'ailandgames');
    assert.equal(fixture.calls[0].authDomain,'ailandgames.firebaseapp.com');
    assert.equal(fixture.calls[1].persistence,'memory');
    assert.equal(fixture.calls[2].value,'ja');

    const submit=async()=>{const event={preventDefaultCalled:false,preventDefault(){this.preventDefaultCalled=true;}};await dom.form.listener(event);assert.equal(event.preventDefaultCalled,true);};
    await submit();
    assert.equal(dom.button.disabled,true);
    assert.equal(dom.passwordInput.value,'');
    await submit();
    const operations=fixture.calls.map(call=>call.op);
    assert.equal(operations.filter(op=>op==='signInWithEmailAndPassword').length,1);
    assert.equal(operations.filter(op=>op==='sendEmailVerification').length,0);
    assert.ok(fixture.calls.filter(call=>call.op==='signInWithEmailAndPassword').every(call=>call.email===targetEmail));
    if(signInFails){
      assert.match(dom.status.textContent,/認証できませんでした/);
      assert.deepEqual(operations,['initializeApp','initializeAuth','setLanguageCode','signInWithEmailAndPassword','signOut']);
    } else {
      assert.match(dom.status.textContent,verified?/Authでは「確認済み」/:/Authではまだ「未確認」/);
      assert.deepEqual(operations,['initializeApp','initializeAuth','setLanguageCode','signInWithEmailAndPassword','reload','signOut']);
    }
  } finally {
    await vite.close();
    delete globalThis.__emailStatusFixture;
    delete globalThis.document;
  }
}

await runScenario({verified:true});
await runScenario({verified:false});
await runScenario({signInFails:true});
console.log('PASS: Auth-only status reader, no game/Firestore/API/email send, no load-time sign-in, one manual login, reloads latest status, memory-only, mock handles verified/unverified/auth failure.');
