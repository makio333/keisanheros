import {installAccountGameAPIs} from './account_game_client.js';
import {mountLegacyFileImport} from './legacy_file_ui.js';

const messages={checkout_in_progress:'別の購入手続きが進行中です。プランを変える場合は、先の手続きを取り消してください。',purchase_changed:'購入状況が変わりました。ページを更新してください。',payment_processing:'お支払いを確認中です。購入状況をもう一度確認してください。',unsupported_upgrade:'このプランの増枠についてはお問い合わせください。',already_purchased:'購入済みです。購入状況をもう一度確認してください。',admin_required:'この操作には管理者の権限が必要です。',save_limit_reached:'プレイヤーの枠がいっぱいです。',authentication_required:'もう一度ログインしてください。',
  adult_manager_acknowledgement_required:'購入には、保護者または施設担当者によるアカウント管理の確認が必要です。',
  email_verification_required:'今のアカウントのまま確認できます。確認後購入内容へ戻ります。既存セーブと利用権はそのままです。',email_verification_refresh_required:'確認状態が更新されていません。メール確認後に再読み込みしてください。',email_verification_unavailable:'確認状態を取得できません。時間をおいて再確認してください。',email_identity_mismatch:'この購入手続きはログイン中のアカウントと一致しません。別アカウントを統合せず、ログイン状態を確認してください。',account_disabled:'このアカウントでは続行できません。サポートへお問い合わせください。',
  purchase_required:'購入の確認が必要です。',save_revision_conflict:'別の端末で更新されています。この端末の内容は自動で上書きしません。',save_too_large:'セーブデータが大きすぎて保存できません。',
  save_not_found:'このセーブを開く権限がありません。',legacy_claim_not_available:'引っ越しの受付は準備中です。',legacy_ownership_unverified:'このアカウントでは使えないか、期限が切れた引っ越しコードです。施設の担当者に確認してください。',legacy_already_claimed:'このセーブは引っ越し済みです。'};
export const accountErrorMessage=error=>error?.message==='facility_account_managed'?'施設用アカウントの枠数は担当者が管理しています。':messages[error?.message]||'接続できませんでした。時間をおいて、もう一度お試しください。';

async function googleLoginAvailable(){
  try{
    const response=await fetch('/api/auth/providers',{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(5000)});
    return response.ok&&(await response.json()).google===true;
  }catch{return false;}
}
export async function startGoogleLogin(intent='login'){
  const response=await fetch('/api/auth/google/start'+(intent==='link'?'?intent=link':''),{method:'POST',credentials:'same-origin'});
  const result=await response.json();if(!response.ok)throw Error(result.error);
  const url=new URL(result.authorizationUrl);if(url.origin!=='https://accounts.google.com')throw Error('invalid_authorization_url');
  location.assign(url.href);
}

export async function createAccountTransport({fetchImpl=fetch,onFailure=()=>{},onRecovery=()=>{}}={}){
  const saves=new Map(),blocked=new Set(),failedWrites=new Set();let queue=Promise.resolve(),pending=0;
  async function api(url,{method='GET',body}={}){
    let response;try{response=await fetchImpl(url,{method,credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});}catch{throw Error('connection_failed');}
    const value=await response.json();if(!response.ok)throw Error(value.error||'connection_failed');return value;
  }
  const summary=await api('/api/account');
  if(!summary.accountId)throw Error('authentication_required');
  function serialize(callback){
    pending++;const result=queue.then(callback);queue=result.catch(()=>{}).finally(()=>{pending--;});return result;
  }
  const transport={
    accountId:summary.accountId,summary,owns:key=>saves.has(key),hasConflict:key=>blocked.has(key),get pending(){return pending;},
    async refreshSummary(){transport.summary=await api('/api/account');return transport.summary;},
    async createSave(name,gameState){
      return serialize(async()=>{
        const save=await api('/api/saves',{method:'POST',body:{name,gameState}});saves.set(save.key,save);
        transport.summary={...transport.summary,used:saves.size,canCreate:saves.size<transport.summary.saveLimit};
        await transport.refreshSummary().catch(()=>{});return save;
      });
    },
    async fetchAllSlots(){
      await queue;if(blocked.size)throw Error('save_revision_conflict');
      const list=await transport.listSaves(),loaded=await Promise.all(list.map(save=>api('/api/saves/'+encodeURIComponent(save.key))));
      saves.clear();for(const save of loaded)saves.set(save.key,save);
      return loaded.map(save=>({slotKey:save.key,gameState:structuredClone(save.gameState),updatedAt:save.gameState.updatedAt||save.updatedAt,revision:save.revision}));
    },
    async listSaves(){await queue;return api('/api/saves');},
    saveSlot(key,gameState){
      const snapshot=structuredClone(gameState);
      return serialize(async()=>{
        if(!saves.has(key))throw Error('save_not_found');
        if(blocked.has(key))throw Error('save_revision_conflict');
        try{
          const next=await api('/api/saves/'+encodeURIComponent(key),{method:'PUT',body:{revision:saves.get(key).revision,gameState:snapshot}});
          saves.set(key,next);
          if(failedWrites.delete(key) && !failedWrites.size && !blocked.size)onRecovery();
          return true;
        }catch(error){failedWrites.add(key);if(error.message==='save_revision_conflict')blocked.add(key);onFailure(error,{key,gameState:snapshot});throw error;}
      });
    },
    deleteSlot(key){return serialize(async()=>{
      if(!saves.has(key))throw Error('save_not_found');
      const result=await api('/api/saves/'+encodeURIComponent(key),{method:'DELETE'});
      saves.delete(key);blocked.delete(key);failedWrites.delete(key);
      transport.summary={...transport.summary,used:result.used,saveLimit:result.saveLimit,paidSaveLimit:result.paidSaveLimit,complimentarySaveLimit:result.complimentarySaveLimit,facilityAccess:result.facilityAccess,complimentaryAccess:result.complimentaryAccess,canCreate:result.used<result.saveLimit};
      return result;
    });},
    flush:()=>queue,
    callGameAPI(apiName,method,args){
      return serialize(async()=>{
        const keys=args.filter(value=>typeof value==='string' && saves.has(value));
        for(const key of keys)if(blocked.has(key))throw Error('save_revision_conflict');
        try{
          const response=await api('/api/game',{method:'POST',body:{api:apiName,method,args,revisions:Object.fromEntries(keys.map(key=>[key,saves.get(key).revision]))}});
          for(const save of response.saves||[]){if(!saves.has(save.key) || save.ownerAccountId!==transport.accountId)throw Error('save_not_found');saves.set(save.key,save);}
          return response.result;
        }catch(error){if(error.message==='save_revision_conflict')for(const key of keys){blocked.add(key);onFailure(error,{key,gameState:saves.get(key).gameState});}throw error;}
      });
    },
    async logout(){await queue;await api('/api/auth/logout',{method:'POST'});},
    async claimLegacy(legacyKey,proof){const save=await api('/api/legacy/claim',{method:'POST',body:{legacyKey,proof}});saves.set(save.key,save);await transport.refreshSummary();return save;},
  };
  transport.initialSlots=await transport.fetchAllSlots();return transport;
}

export function appendLegacyMigrationControls(container,transport){
  if(!transport.summary.legacyMigrationEnabled)return;
  const section=document.createElement('section');section.className='account-migration';
  const heading=document.createElement('h3');heading.textContent='以前のゲームから引っ越す';
  const recipient=document.createElement('p');recipient.textContent='引っ越し先ID：'+transport.accountId;
  const label=document.createElement('label');label.textContent='引っ越しコード';
  const input=document.createElement('input');input.id='legacy-transfer-code';input.type='text';input.autocomplete='off';input.spellcheck=false;input.maxLength=43;input.setAttribute('autocapitalize','none');label.appendChild(input);
  const status=document.createElement('p');status.setAttribute('role','status');
  const submit=document.createElement('button');submit.type='button';submit.className='btn';submit.id='btn-legacy-transfer';submit.textContent='セーブを引っ越す';
  let complete=false;
  submit.onclick=async()=>{
    if(complete){location.reload();return;}
    const code=input.value.trim();
    if(!/^[A-Za-z0-9_-]{43}$/.test(code)){status.textContent='施設から受け取った引っ越しコードを確認してください。';return;}
    submit.disabled=true;input.disabled=true;
    try{
      await transport.flush();const save=await transport.claimLegacy(undefined,code);
      status.textContent=save.name+' の引っ越しが完了しました。';input.value='';complete=true;submit.textContent='ゲームに戻る';
    }catch(error){status.textContent=accountErrorMessage(error);input.disabled=false;}
    finally{submit.disabled=false;}
  };
  section.append(heading,recipient,label,submit,status);container.appendChild(section);
}

async function appendPurchaseControls(container,summary,{getFreshCheckoutEmailToken,onNeedEmailVerification}={}){
  const paid=summary.paidSaveLimit??summary.saveLimit;
  const entitlementLimit=Math.max(paid,summary.complimentarySaveLimit||0);
  if(summary.facilityAccess)return;
  if(import.meta.env.VITE_STRIPE_CHECKOUT!=='1')return;
  const area=document.createElement('div');area.className='account-purchase-controls';container.appendChild(area);
  const status=document.createElement('p');status.setAttribute('role','status');
  const returned=new URLSearchParams(location.search).get('purchase');
  if(returned){
    let state='processing';
    try{const response=await fetch('/api/payments/status',{credentials:'same-origin',cache:'no-store'});if(response.ok)state=(await response.json()).state;}catch{}
    status.textContent=state==='paid'?'購入を確認しました。セーブはそのまま使えます。':state==='failed'?'お支払いは完了しませんでした。セーブは残っています。別の購入手続きを開始できます。':state==='cancelled'?'購入手続きを取り消しました。セーブは残っています。':'お支払いの確認中です。重ねて購入せず、購入状況を確認してください。';
    if(state==='processing'){
      const refresh=document.createElement('button');refresh.type='button';refresh.className='btn';refresh.textContent='購入状況を確認';refresh.onclick=()=>location.reload();area.append(status,refresh);return;
    }
    if(state==='paid'){const url=new URL(location.href);url.searchParams.delete('purchase');history.replaceState(null,'',url.href);}
  }
  try{
    const response=await fetch('/api/payments/products',{credentials:'same-origin',cache:'no-store'}),products=await response.json();
    if(!response.ok)throw Error(products.error);
    if(!products.length)return;
    const label=document.createElement('label');label.textContent=entitlementLimit?'データ枠を増やす':'買い切りプラン';
    const select=document.createElement('select');select.id='account-purchase-plan';
    for(const product of products){
      const option=document.createElement('option');option.value=product.id;
      const planLabel=product.kind==='personal'?'個人 1〜3人分（最大3枠）':`団体 ${product.saveLimit}人分`;
      option.textContent=`${planLabel} ・ ${product.credit?'差額 ':''}${new Intl.NumberFormat('ja-JP',{style:'currency',currency:'JPY'}).format(product.amount)}（税込）`;
      select.appendChild(option);
    }
    label.appendChild(select);area.appendChild(label);
    if(summary.complimentaryAccess){const note=document.createElement('p');note.textContent=`登録済みアカウントに個人プラン相当の利用権（${summary.complimentarySaveLimit}人分）を付与しています。さらに増やす場合は表示金額で購入できます。`;area.appendChild(note);}
    else if(paid){const note=document.createElement('p');note.textContent=`現在${paid}人分。表示金額は増枠の差額です。元のセーブは残ります。`;area.appendChild(note);}
    else if(summary.trial?.startedAt){const note=document.createElement('p');note.textContent='購入後も、無料体験のセーブをそのまま使えます。';area.appendChild(note);}
    let adultManagerAcknowledged=summary.adultManagerAcknowledged===true,managerCheckbox=null;
    if(!adultManagerAcknowledged){
      const managerLabel=document.createElement('label');managerLabel.className='account-adult-manager-confirmation';
      managerCheckbox=document.createElement('input');managerCheckbox.type='checkbox';managerCheckbox.id='account-adult-manager-acknowledgement';
      const managerText=document.createElement('span');managerText.textContent='私は保護者または施設担当者で、このアカウントと子どもの利用内容を管理します。';
      managerLabel.append(managerCheckbox,managerText);area.appendChild(managerLabel);
      const note=document.createElement('p');note.textContent='この確認は、アカウントを管理する大人の申告を記録します。子どもの氏名や生年月日は入力しません。';area.appendChild(note);
    }
    const cancel=document.createElement('button');cancel.type='button';cancel.className='btn';cancel.textContent='先の購入手続きを取り消す';cancel.hidden=true;
    cancel.onclick=async()=>{
      cancel.disabled=true;
      try{
        const result=await fetch('/api/payments/checkout/cancel',{method:'POST',credentials:'same-origin'}),data=await result.json();
        if(!result.ok)throw Error(data.error);cancel.hidden=true;status.textContent='先の手続きを取り消しました。プランを選んで購入できます。';
      }catch(error){status.textContent=accountErrorMessage(error);}finally{cancel.disabled=false;}
    };
    const purchase=document.createElement('button');purchase.type='button';purchase.className='btn';purchase.id='btn-account-purchase';purchase.textContent=summary.saveLimit?'選んだ枠数で購入する':'買い切りで購入する';purchase.disabled=!adultManagerAcknowledged;
    if(managerCheckbox)managerCheckbox.addEventListener('change',()=>{purchase.disabled=!managerCheckbox.checked;});
    purchase.onclick=async()=>{
      purchase.disabled=true;select.disabled=true;
      try{
        await window.AccountSession?.flush();
        if(!adultManagerAcknowledged){
          if(!managerCheckbox?.checked)throw Error('adult_manager_acknowledgement_required');
          const acknowledgement=await fetch('/api/account/adult-manager-acknowledgement',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({acknowledged:true})});
          const acknowledgementResult=await acknowledgement.json();if(!acknowledgement.ok)throw Error(acknowledgementResult.error||'adult_manager_acknowledgement_required');
          adultManagerAcknowledged=true;summary.adultManagerAcknowledged=true;
        }
        if(typeof getFreshCheckoutEmailToken!=='function')throw Error('email_verification_unavailable');
        const idToken=await getFreshCheckoutEmailToken();
        const result=await fetch('/api/payments/checkout',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','Authorization':`Bearer ${idToken}`},body:JSON.stringify({productId:select.value})});
        const data=await result.json();if(!result.ok)throw Error(data.error);
        const url=new URL(data.url);if(url.origin!=='https://checkout.stripe.com')throw Error('invalid_checkout_url');
        location.assign(url.href);
      }catch(error){status.textContent=accountErrorMessage(error);if(error.message==='checkout_in_progress')cancel.hidden=false;purchase.disabled=false;select.disabled=false;if(['email_verification_required','email_verification_refresh_required'].includes(error.message))try{await onNeedEmailVerification?.();}catch{}}
    };
    area.append(purchase,status,cancel);
  }catch(error){status.textContent=accountErrorMessage(error);area.appendChild(status);}
}

export async function initializeAccountClient({onLogout,onAuthenticationRequired,getFreshCheckoutEmailToken,onNeedEmailVerification} = {}){
  const gate=document.createElement('div');gate.className='modal-overlay account-login-gate';
  gate.innerHTML='<section class="modal-panel account-login-panel"><h2>レジェンドヒーローズ</h2><p role="status" data-status>ログインを確認しています…</p><div data-actions></div></section>';
  document.body.appendChild(gate);
  if(import.meta.env.VITE_ACCOUNT_MOCK==='1'){
    const notice=document.createElement('div');notice.className='account-mock-notice';notice.textContent='ローカル検証用（LINE・購入は模擬）';document.body.appendChild(notice);
  }
  const status=gate.querySelector('[data-status]'),actions=gate.querySelector('[data-actions]');
  if(import.meta.env.VITE_STRIPE_CHECKOUT==='1'){
    fetch('/api/payments/legal',{cache:'no-store',credentials:'same-origin'}).then(async response=>{
      if(!response.ok)return;const links=await response.json(),footer=document.createElement('p');footer.className='account-legal-links';
      for(const [key,label] of Object.entries({terms:'利用規約',privacy:'プライバシー',commerce:'販売条件・事業者情報'})){
        if(!links[key])continue;let url;try{url=new URL(links[key]);}catch{continue;}if(url.protocol!=='https:'||url.username||url.password)continue;
        const link=document.createElement('a');link.href=url.href;link.textContent=label;link.target='_blank';link.rel='noopener noreferrer';footer.append(link,document.createTextNode('　'));
      }
      if(footer.childNodes.length)gate.querySelector('section').appendChild(footer);
    }).catch(()=>{});
  }
  const button=(label,id,callback)=>{const el=document.createElement('button');el.type='button';el.className='btn';el.textContent=label;el.id=id;el.onclick=async()=>{el.disabled=true;try{await callback();}catch(error){status.textContent=accountErrorMessage(error);}finally{el.disabled=false;}};actions.appendChild(el);return el;};
  return new Promise(resolve=>{
    async function attempt(){
      actions.replaceChildren();status.textContent='ログインを確認しています…';
      try{
        const transport=await createAccountTransport({onFailure(error,save){
          try{localStorage.setItem(`legend-account-conflict::${transport.accountId}::${save.key}::${Date.now()}`,JSON.stringify(save.gameState));}catch{}
          const warning=document.getElementById('debug-error-banner');if(warning){warning.style.display='block';warning.textContent=accountErrorMessage(error);}
        },onRecovery(){
          const warning=document.getElementById('debug-error-banner');
          if(warning){warning.style.display='none';warning.textContent='';}
        }});
        if(onLogout){const logout=transport.logout;transport.logout=async()=>{await logout();await onLogout();};}
        if(!transport.summary.saveLimit){
          const returned=new URLSearchParams(location.search).get('purchase');
          status.textContent=import.meta.env.VITE_PRODUCT_NO_SALES==='1'?'販売休止中です。今回の公開前に登録済みのアカウントでプレイできます。':returned==='processing'?'お支払いを確認しています。少し待ってから、もう一度確認してください。':returned==='cancelled'?'購入をキャンセルしました。':'購入の確認が必要です。';
          if(transport.summary.legacyFileMigrationEnabled){status.textContent='施設の引っ越しファイルを選んでください。購入は不要です。';mountLegacyFileImport(actions,transport);}
          else {
            if(transport.summary.trial?.available){
              status.textContent='個人・団体どちらも、7日間・3人分で無料体験できます。';
              button('7日間無料で試す（3人分）','btn-account-trial',async()=>{const response=await fetch('/api/trial/start',{method:'POST',credentials:'same-origin'});const result=await response.json();if(!response.ok)throw Error(result.error);await attempt();});
            }else if(transport.summary.trial?.expiresAt)status.textContent='無料体験は終了しました。セーブは残っています。購入すると続きから遊べます。';
            await appendPurchaseControls(actions,transport.summary,{getFreshCheckoutEmailToken,onNeedEmailVerification});
          }
          appendLegacyMigrationControls(actions,transport);
          button('もう一度確認する','btn-account-refresh',attempt);button('ログアウト','btn-account-logout',async()=>{await transport.logout();await attempt();});return;
        }
        window.AccountSession=transport;window.CloudSave=transport;
        installAccountGameAPIs(transport);
        const title=document.querySelector('#screen-title .menu-grid'),row=document.createElement('div');row.className='account-title-controls';
        const count=document.createElement('span');count.id='account-save-count';count.textContent=`プレイヤー ${transport.summary.used} / ${transport.summary.saveLimit}`;row.appendChild(count);
        if(transport.summary.complimentaryAccess){const note=document.createElement('span');note.className='account-complimentary-note';note.textContent=import.meta.env.VITE_PRODUCT_NO_SALES==='1'?'販売休止中・プレイ権付与済み':`登録済み特典・個人プラン相当 ${transport.summary.complimentarySaveLimit}人分`;row.appendChild(note);}
        title?.appendChild(row);
        const manage=document.createElement('button');manage.type='button';manage.id='btn-account-manage';manage.className='btn';manage.textContent='アカウント・購入';row.appendChild(manage);
        manage.onclick=async()=>{
          document.querySelector('.account-settings-modal')?.remove();
          const overlay=document.createElement('div');overlay.className='modal-overlay account-settings-modal';
          const panel=document.createElement('section');panel.className='modal-panel account-login-panel';
          const heading=document.createElement('h2');heading.textContent='アカウント・購入';
          const text=document.createElement('p');text.textContent='購入状況を確認しています…';text.setAttribute('role','status');
          const close=document.createElement('button');close.type='button';close.className='btn';close.textContent='ゲームへ戻る';close.onclick=()=>overlay.remove();
          panel.append(heading,text,close);overlay.appendChild(panel);document.body.appendChild(overlay);
          const logout=document.createElement('button');logout.type='button';logout.className='btn';logout.id='btn-account-manage-logout';logout.textContent='ログアウト';
          logout.onclick=async()=>{logout.disabled=true;try{await transport.logout();location.reload();}catch(error){text.textContent=accountErrorMessage(error);logout.disabled=false;}};
          panel.appendChild(logout);
          try{const summary=await transport.refreshSummary();text.textContent=summary.facilityAccess?'施設の引き継ぎアカウントです。購入は不要です。':`プレイヤー ${summary.used} / ${summary.saveLimit}人分。増枠しても現在のセーブは残ります。`;await appendPurchaseControls(panel,summary,{getFreshCheckoutEmailToken,onNeedEmailVerification});}catch(error){text.textContent=accountErrorMessage(error);}
        };
        if(transport.summary.trial?.active){
          const expiration=transport.summary.trial.expiresAt;
          const notice=document.createElement('p');notice.textContent=`無料体験：${new Date(expiration).toLocaleString('ja-JP')}まで（3人分）`;row.appendChild(notice);
          const remaining=Math.max(0,expiration-transport.summary.serverNow);
          setTimeout(async()=>{
            const latest=await transport.refreshSummary().catch(()=>null);
            if(latest?.saveLimit&&!latest.trial?.active)return;
            status.textContent='無料体験は終了しました。セーブは残っています。購入すると続きから遊べます。';actions.replaceChildren();document.body.appendChild(gate);
            await appendPurchaseControls(actions,latest||transport.summary,{getFreshCheckoutEmailToken,onNeedEmailVerification});
            button('購入状況を確認する','btn-account-refresh',()=>location.reload());
          },remaining);
        }
        const accountTab=document.createElement('button');accountTab.type='button';accountTab.id='admin-tab-btn-account';accountTab.className='room-nav-btn admin-nav-btn';accountTab.dataset.adminTab='account';
        accountTab.innerHTML='<span class="room-nav-icon">👤</span><span class="room-nav-text">アカウント</span>';
        document.querySelector('#screen-admin .admin-nav')?.appendChild(accountTab);
        const accountPane=document.createElement('div');accountPane.id='admin-tab-pane-account';accountPane.className='room-tab-pane admin-tab-pane';
        const settings=document.createElement('section');settings.className='account-settings';
        settings.innerHTML='<h3>アカウントとデータ枠</h3><p>保護者・管理者の方が操作してください。</p>';
        const settingsCount=document.createElement('p');settingsCount.textContent=transport.summary.facilityAccess?`施設用：${transport.summary.saveLimit}人分（既存利用の引き継ぎ・購入不要）`:`現在 ${transport.summary.saveLimit}人分のデータ枠を利用できます。`;settings.appendChild(settingsCount);
        accountPane.appendChild(settings);document.querySelector('#screen-admin .admin-main-content')?.appendChild(accountPane);
        await appendPurchaseControls(settings,transport.summary,{getFreshCheckoutEmailToken,onNeedEmailVerification});
        const logout=document.createElement('button');logout.type='button';logout.className='btn';logout.id='btn-account-logout';logout.textContent='ログアウト';
        const settingsStatus=document.createElement('p');settingsStatus.setAttribute('role','status');
        logout.onclick=async()=>{logout.disabled=true;try{await transport.logout();location.reload();}catch(error){logout.disabled=false;settingsStatus.textContent=accountErrorMessage(error);}};
        settings.append(logout,settingsStatus);
        appendLegacyMigrationControls(settings,transport);
        mountLegacyFileImport(settings,transport);
        if(await googleLoginAvailable()){
          const googleLink=document.createElement('button');googleLink.type='button';googleLink.className='btn';googleLink.id='btn-account-google-link';googleLink.textContent='Googleログインを追加';
          googleLink.onclick=async()=>{googleLink.disabled=true;try{await transport.flush();await startGoogleLogin('link');}catch(error){settingsStatus.textContent=error.message==='identity_already_linked'?'そのGoogleアカウントは別のゲームアカウントに登録されています。':accountErrorMessage(error);googleLink.disabled=false;}};
          settings.appendChild(googleLink);
        }
        window.addEventListener('beforeunload',event=>{if(transport.pending){event.preventDefault();event.returnValue='';}});
        gate.remove();resolve(transport);
      }catch(error){
        status.textContent=error.message==='authentication_required'?'ログイン方法を選んでください':accountErrorMessage(error);
        const login=async qr=>{const response=await fetch('/api/auth/line/start'+(qr?'?qr=1':''),{method:'POST',credentials:'same-origin'});const result=await response.json();if(!response.ok)throw Error(result.error);location.assign(result.authorizationUrl);};
        if(error.message==='authentication_required'&&onAuthenticationRequired)button('ログイン画面へ','btn-account-login',onAuthenticationRequired);
        else if(error.message==='authentication_required'){button('LINEでログイン','btn-account-login',()=>login(false));button('QRコードでログイン','btn-account-qr',()=>login(true));}
        if(error.message==='authentication_required'&&!onAuthenticationRequired&&await googleLoginAvailable())button('Googleでログイン','btn-account-google',()=>startGoogleLogin());
        button('もう一度確認する','btn-account-refresh',attempt);
      }
    }
    attempt();
  });
}
