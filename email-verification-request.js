import {initializeApp} from 'firebase/app';
import {
  inMemoryPersistence,
  initializeAuth,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {productFirebaseConfig} from './firebase_product_config.js';

const TARGET_EMAIL = 'motoyanyouuki0326@gmail.com';
const config = productFirebaseConfig('ailandgames.firebaseapp.com');
if (config.projectId !== 'ailandgames') throw new Error('unexpected_auth_project');

const app = initializeApp(config, 'email-verification-one-time');
const auth = initializeAuth(app, {persistence: inMemoryPersistence});
auth.languageCode = 'ja';
const form = document.querySelector('#verification-form');
const passwordInput = document.querySelector('#password');
const button = document.querySelector('#send-button');
const status = document.querySelector('#status');

let consumed = false;

function messageFor(error) {
  switch (error?.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return '認証できませんでした。入力を確認してください。再送は行っていません。';
    case 'auth/too-many-requests':
      return '試行回数の上限に達しました。時間をおいてから管理者に相談してください。';
    default:
      return '処理を完了できませんでした。受信状況を確認し、再送せず管理者に相談してください。';
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (consumed || !form.reportValidity()) return;

  consumed = true;
  button.disabled = true;
  passwordInput.disabled = true;
  button.textContent = '処理中…';
  status.textContent = '認証しています。画面を閉じずにお待ちください。';

  let password = passwordInput.value;
  passwordInput.value = '';
  try {
    const credential = await signInWithEmailAndPassword(auth, TARGET_EMAIL, password);
    password = '';
    const user = credential.user;
    if (user.email?.toLowerCase() !== TARGET_EMAIL) throw new Error('auth/target_mismatch');

    await reload(user);
    if (user.emailVerified) {
      status.textContent = 'このメールアドレスは確認済みです。新しいメールは送っていません。';
      return;
    }

    await sendEmailVerification(user);
    status.textContent = 'Firebase が確認メールの送信を受け付けました。受信箱と迷惑メールを確認し、届いたリンクを開いてください。';
  } catch (error) {
    status.textContent = messageFor(error);
  } finally {
    password = '';
    passwordInput.value = '';
    try { await signOut(auth); } catch { /* Memory-only auth is discarded when this page closes. */ }
  }
});
