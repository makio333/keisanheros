import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createServer as createViteServer} from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const targetEmail = 'motoyanyouuki0326@gmail.com';
const source = await readFile(new URL('../email-verification-request.js', import.meta.url), 'utf8');
const configSource = await readFile(new URL('../firebase_product_config.js', import.meta.url), 'utf8');
const imports = [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map(match => match[1]);
assert.deepEqual(imports, ['firebase/app', 'firebase/auth', './firebase_product_config.js']);
assert.doesNotMatch(source + configSource, /firestore|XMLHttpRequest|\bfetch\s*\(|\/api\//i);
assert.match(source, /productFirebaseConfig\('ailandgames\.firebaseapp\.com'\)/);
assert.match(source, /config\.projectId !== 'ailandgames'/);
assert.match(source, /persistence: inMemoryPersistence/);
assert.match(source, /auth\.languageCode = 'ja'/);

async function runScenario({verified = false, signInFails = false, sendFails = false} = {}) {
  const fixture = {calls: [], verified, signInFails, sendFails};
  globalThis.__authVerificationFixture = fixture;
  const modules = {
    'firebase/app': `
      export const initializeApp = (config, appName) => {
        globalThis.__authVerificationFixture.calls.push({op:'initializeApp', projectId:config.projectId, authDomain:config.authDomain, appName});
        return {config, appName};
      };
    `,
    'firebase/auth': `
      export const inMemoryPersistence = {kind:'memory'};
      export const initializeAuth = (app, options) => {
        globalThis.__authVerificationFixture.calls.push({op:'initializeAuth', persistence:options.persistence.kind});
        const state = globalThis.__authVerificationFixture;
        state.auth = {app, _languageCode:null, set languageCode(value) {
          this._languageCode = value;
          state.calls.push({op:'setLanguageCode', value});
        }, get languageCode() { return this._languageCode; }};
        return state.auth;
      };
      export const signInWithEmailAndPassword = async (_auth, email, _password) => {
        const state = globalThis.__authVerificationFixture;
        state.calls.push({op:'signInWithEmailAndPassword', email});
        if (state.signInFails) throw Object.assign(new Error('fixture'), {code:'auth/invalid-credential'});
        return {user:{email, emailVerified:state.verified}};
      };
      export const reload = async user => {
        const state = globalThis.__authVerificationFixture;
        state.calls.push({op:'reload'});
        user.emailVerified = state.verified;
      };
      export const sendEmailVerification = async () => {
        const state = globalThis.__authVerificationFixture;
        state.calls.push({op:'sendEmailVerification', languageCode:state.auth.languageCode});
        if (state.sendFails) throw Object.assign(new Error('fixture'), {code:'auth/network-request-failed'});
      };
      export const signOut = async () => globalThis.__authVerificationFixture.calls.push({op:'signOut'});
    `,
  };
  const dom = {
    form: {
      listener: null,
      reportValidity: () => true,
      addEventListener(_event, listener) { this.listener = listener; },
    },
    passwordInput: {value: 'fixture-only-not-a-real-password'},
    button: {disabled: false, textContent: '確認メールを送る'},
    status: {textContent: ''},
  };
  globalThis.document = {
    querySelector(selector) {
      if (selector === '#verification-form') return dom.form;
      if (selector === '#password') return dom.passwordInput;
      if (selector === '#send-button') return dom.button;
      if (selector === '#status') return dom.status;
      throw new Error('unexpected_dom_selector');
    },
  };

  const vite = await createViteServer({
    root,
    configFile: false,
    ssr: {noExternal: ['firebase']},
    plugins: [{
      name: 'auth-verification-mock-only',
      enforce: 'pre',
      resolveId(id) { if (Object.hasOwn(modules, id)) return `\0fixture:${id}`; },
      load(id) { if (id.startsWith('\0fixture:')) return modules[id.slice('\0fixture:'.length)]; },
    }],
  });
  try {
    await vite.ssrLoadModule('/email-verification-request.js');
    assert.deepEqual(fixture.calls.map(call => call.op), ['initializeApp', 'initializeAuth', 'setLanguageCode'], 'no auth request or email is sent at page load');
    assert.equal(fixture.calls[0].projectId, 'ailandgames');
    assert.equal(fixture.calls[0].authDomain, 'ailandgames.firebaseapp.com');
    assert.equal(fixture.calls[1].persistence, 'memory');
    assert.equal(fixture.calls[2].value, 'ja');

    const submit = async () => {
      const event = {preventDefaultCalled: false, preventDefault() { this.preventDefaultCalled = true; }};
      await dom.form.listener(event);
      assert.equal(event.preventDefaultCalled, true);
    };
    await submit();
    assert.equal(dom.button.disabled, true);
    assert.equal(dom.passwordInput.value, '');
    await submit(); // Duplicate submit after the lock must be a no-op.

    const operations = fixture.calls.map(call => call.op);
    assert.equal(operations.filter(op => op === 'sendEmailVerification').length, verified || signInFails ? 0 : 1);
    if (signInFails) {
      assert.match(dom.status.textContent, /認証できませんでした/);
      assert.deepEqual(operations, ['initializeApp', 'initializeAuth', 'setLanguageCode', 'signInWithEmailAndPassword', 'signOut']);
    } else if (verified) {
      assert.match(dom.status.textContent, /確認済みです/);
      assert.deepEqual(operations, ['initializeApp', 'initializeAuth', 'setLanguageCode', 'signInWithEmailAndPassword', 'reload', 'signOut']);
    } else if (sendFails) {
      assert.match(dom.status.textContent, /再送せず/);
      assert.deepEqual(operations, ['initializeApp', 'initializeAuth', 'setLanguageCode', 'signInWithEmailAndPassword', 'reload', 'sendEmailVerification', 'signOut']);
    } else {
      assert.match(dom.status.textContent, /送信を受け付けました/);
      assert.deepEqual(operations, ['initializeApp', 'initializeAuth', 'setLanguageCode', 'signInWithEmailAndPassword', 'reload', 'sendEmailVerification', 'signOut']);
    }
    const send = fixture.calls.find(call => call.op === 'sendEmailVerification');
    if (send) assert.equal(send.languageCode, 'ja');
    assert.ok(fixture.calls.filter(call => call.op === 'signInWithEmailAndPassword').every(call => call.email === targetEmail));
  } finally {
    await vite.close();
    delete globalThis.__authVerificationFixture;
    delete globalThis.document;
  }
}

await runScenario();
await runScenario({verified: true});
await runScenario({signInFails: true});
await runScenario({sendFails: true});
console.log('PASS: mocked Firebase Auth-only flow; target project/address pinned, no load-time request, one send max, verified user skips send, error does not auto-retry, memory persistence.');
