// Public Firebase Web identifiers; not server credentials.
const BASE_PRODUCT_FIREBASE_CONFIG=Object.freeze({
  apiKey:'AIzaSyB3EmoYi-AeTe7w4xDGKYM1jFmSXykwxUA',
  authDomain:'ailandgames.firebaseapp.com',projectId:'ailandgames',
  storageBucket:'ailandgames.firebasestorage.app',messagingSenderId:'255137807181',
  appId:'1:255137807181:web:e6c521f0fc5ac2b9001504',
});
// Opt-in preview only until both provider callbacks have been registered and verified.
export function productFirebaseConfig(authDomain='ailandgames.firebaseapp.com'){
  if(!['ailandgames.firebaseapp.com','legend-heroes2.web.app'].includes(authDomain))throw Error('unsupported_auth_domain');
  return Object.freeze({...BASE_PRODUCT_FIREBASE_CONFIG,authDomain});
}
export const PRODUCT_FIREBASE_CONFIG=productFirebaseConfig(import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN||'ailandgames.firebaseapp.com');
