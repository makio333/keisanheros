export function preferLineBrowserLogin(navigatorLike = globalThis.navigator) {
  const ua=navigatorLike?.userAgent||'';
  return /Android|iPhone|iPad|iPod/i.test(ua)||/Macintosh/i.test(ua)&&navigatorLike?.maxTouchPoints>1;
}
export function createLineLoginProvider(OAuthProvider, {browserOnly = preferLineBrowserLogin()} = {}) {
  const provider = new OAuthProvider('oidc.line');
  provider.addScope('profile');
  if (browserOnly) provider.setCustomParameters({disable_auto_login:'true'});
  return provider;
}
