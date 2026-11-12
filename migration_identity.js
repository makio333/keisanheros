export function canUsePrivateMigration(user,signInProvider){
  return !!user&&(user.emailVerified===true||signInProvider==='oidc.line');
}

export function describeLogin(user,claims={}){
  const provider=claims.firebase?.sign_in_provider;
  const profile=user?.providerData?.find(entry=>entry.providerId===provider);
  const name=profile?.displayName||claims.name||user?.displayName;
  const email=profile?.email||user?.email;
  if(provider==='oidc.line')return name?`LINEでログイン中：${name}`:'LINEでログイン中（表示名を取得できませんでした）';
  if(provider==='google.com')return `Googleでログイン中：${email||name||'アカウント情報なし'}`;
  if(provider==='password')return `メールでログイン中：${email||'アドレスを取得できませんでした'}`;
  return `ログイン中：${email||name||'アカウント情報なし'}`;
}
