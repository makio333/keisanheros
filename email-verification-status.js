import {initializeApp} from 'firebase/app';
import {inMemoryPersistence, initializeAuth, reload, signInWithEmailAndPassword, signOut} from 'firebase/auth';
import {productFirebaseConfig} from './firebase_product_config.js';

const TARGET_EMAIL = 'motoyanyouuki0326@gmail.com';
const config = productFirebaseConfig('ailandgames.firebaseapp.com');
if (config.projectId !== 'ailandgames') throw new Error('unexpected_auth_project');

const app = initializeApp(config, 'email-verification-status-only');
const auth = initializeAuth(app, {persistence: inMemoryPersistence});
auth.languageCode = 'ja';
const form = document.querySelector('#status-form');
const passwordInput = document.querySelector('#password');
const button = document.querySelector('#check-button');
const status = document.querySelector('#status');
let consumed = false;

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (consumed || !form.reportValidity()) return;
  consumed = true;
  button.disabled = true;
  passwordInput.disabled = true;
  button.textContent = '確認中…';
  status.textContent = 'Firebase Authの状態を確認しています。';
  let password = passwordInput.value;
  passwordInput.value = '';
  try {
    const credential = await signInWithEmailAndPassword(auth, TARGET_EMAIL, password);
    password = '';
    const user = credential.user;
    if (user.email?.toLowerCase() !== TARGET_EMAIL) throw new Error('auth/target_mismatch');
    await reload(user);
    status.textContent = user.emailVerified
      ? 'Firebase Authでは「確認済み」です。ゲーム側APIは呼んでいないため、ゲーム側の実アカウント判定はまだ未検証です。'
      : 'Firebase Authではまだ「未確認」です。確認メールのリンクを開いたか確認してください。再送はしていません。';
  } catch (error) {
    status.textContent = error?.code === 'auth/invalid-credential' || error?.code === 'auth/wrong-password'
      ? '認証できませんでした。状態は確認していません。再試行せず、管理者に相談してください。'
      : '状態を取得できませんでした。再試行やメール再送は行わず、管理者に相談してください。';
  } finally {
    password = '';
    passwordInput.value = '';
    try { await signOut(auth); } catch { /* Memory-only auth is discarded when this page closes. */ }
  }
});
