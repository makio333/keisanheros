import {installAccountGameAPIs} from './account_game_client.js';

const messages={checkout_in_progress:'別の購入手続きが進行中です。プランを変える場合は、先の手続きを取り消してください。',purchase_changed:'購入状況が変わりました。ページを更新してください。',payment_processing:'お支払いを確認中です。購入状況をもう一度確認してください。',unsupported_upgrade:'このプランの増枠についてはお問い合わせください。',already_purchased:'購入済みです。購入状況をもう一度確認してください。',admin_required:'この操作には管理者の権限が必要です。',save_limit_reached:'プレイヤーの枠がいっぱいです。',authentication_required:'もう一度ログインしてください。',
  purchase_required:'購入の確認が必要です。',save_revision_conflict:'別の端末で更新されています。この端末の内容は自動で上書きしません。',
  save_not_found:'このセーブを開く権限がありません。',legacy_claim_not_available:'以前のセーブの引き継ぎは、所有者確認の準備中です。'};
export const accountErrorMessage=error=>messages[error?.message]||'接続できませんでした。時間をおいて、もう一度お試しください。';

export async function createAccountTransport({fetchImpl=fetch,onFailure=()=>{}}={}){
  const saves=new Map(),blocked=new Set();let queue=Promise.resolve(),pending=0;
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
      const list=await api('/api/saves'),loaded=await Promise.all(list.map(save=>api('/api/saves/'+encodeURIComponent(save.key))));
      saves.clear();for(const save of loaded)saves.set(save.key,save);
      return loaded.map(save=>({slotKey:save.key,gameState:structuredClone(save.gameState),updatedAt:save.gameState.updatedAt||save.updatedAt,revision:save.revision}));
    },
    saveSlot(key,gameState){
      const snapshot=structuredClone(gameState);
      return serialize(async()=>{
        if(!saves.has(key))throw Error('save_not_found');
        if(blocked.has(key))throw Error('save_revision_conflict');
        try{
          const next=await api('/api/saves/'+encodeURIComponent(key),{method:'PUT',body:{revision:saves.get(key).revision,gameState:snapshot}});
          saves.set(key,next);return true;
        }catch(error){if(error.message==='save_revision_conflict')blocked.add(key);onFailure(error,{key,gameState:snapshot});throw error;}
      });
    },
    async deleteSlot(){throw Error('save_deletion_not_enabled');},
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

async function appendPurchaseControls(container,summary){
  if(import.meta.env.VITE_STRIPE_CHECKOUT!=='1')return;
  const area=document.createElement('div');area.className='account-purchase-controls';container.appendChild(area);
  const status=document.createElement('p');status.setAttribute('role','status');
  if(new URLSearchParams(location.search).get('purchase')==='processing'){
    if(!summary.saveLimit)return;
    status.textContent='お支払い・枠数の反映を確認してください。';
    const refresh=document.createElement('button');refresh.type='button';refresh.className='btn';refresh.textContent='購入状況を確認';refresh.onclick=()=>location.reload();area.append(status,refresh);return;
  }
  try{
    const response=await fetch('/api/payments/products',{credentials:'same-origin',cache:'no-store'}),products=await response.json();
    if(!response.ok)throw Error(products.error);
    if(!products.length)return;
    const label=document.createElement('label');label.textContent=summary.saveLimit?'データ枠を増やす':'買い切りプラン';
    const select=document.createElement('select');select.id='account-purchase-plan';
    for(const product of products){
      const option=document.createElement('option');option.value=product.id;
      option.textContent=`${product.kind==='personal'?'個人':'団体'} ${product.saveLimit}人分 ・ ${product.credit?'差額 ':''}${new Intl.NumberFormat('ja-JP',{style:'currency',currency:'JPY'}).format(product.amount)}（税込）`;
      select.appendChild(option);
    }
    label.appendChild(select);area.appendChild(label);
    if(summary.saveLimit){const note=document.createElement('p');note.textContent=`現在${summary.saveLimit}人分。表示金額は増枠の差額です。元のセーブは残ります。`;area.appendChild(note);}
    const cancel=document.createElement('button');cancel.type='button';cancel.className='btn';cancel.textContent='先の購入手続きを取り消す';cancel.hidden=true;
    cancel.onclick=async()=>{
      cancel.disabled=true;
      try{
        const result=await fetch('/api/payments/checkout/cancel',{method:'POST',credentials:'same-origin'}),data=await result.json();
        if(!result.ok)throw Error(data.error);cancel.hidden=true;status.textContent='先の手続きを取り消しました。プランを選んで購入できます。';
      }catch(error){status.textContent=accountErrorMessage(error);}finally{cancel.disabled=false;}
    };
    const purchase=document.createElement('button');purchase.type='button';purchase.className='btn';purchase.id='btn-account-purchase';purchase.textContent=summary.saveLimit?'選んだ枠数で購入する':'買い切りで購入する';
    purchase.onclick=async()=>{
      purchase.disabled=true;select.disabled=true;
      try{
        await window.AccountSession?.flush();
        const result=await fetch('/api/payments/checkout',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({productId:select.value})});
        const data=await result.json();if(!result.ok)throw Error(data.error);
        const url=new URL(data.url);if(url.origin!=='https://checkout.stripe.com')throw Error('invalid_checkout_url');
        location.assign(url.href);
      }catch(error){status.textContent=accountErrorMessage(error);if(error.message==='checkout_in_progress')cancel.hidden=false;purchase.disabled=false;select.disabled=false;}
    };
    area.append(purchase,status,cancel);
  }catch(error){status.textContent=accountErrorMessage(error);area.appendChild(status);}
}

export async function initializeAccountClient(){
  const gate=document.createElement('div');gate.className='modal-overlay account-login-gate';
  gate.innerHTML='<section class="modal-panel account-login-panel"><h2>レジェンドヒーローズ</h2><p role="status" data-status>ログインを確認しています…</p><div data-actions></div></section>';
  document.body.appendChild(gate);
  if(import.meta.env.VITE_ACCOUNT_MOCK==='1'){
    const notice=document.createElement('div');notice.className='account-mock-notice';notice.textContent='ローカル検証用（LINE・購入は模擬）';document.body.appendChild(notice);
  }
  const status=gate.querySelector('[data-status]'),actions=gate.querySelector('[data-actions]');
  const button=(label,id,callback)=>{const el=document.createElement('button');el.type='button';el.className='btn';el.textContent=label;el.id=id;el.onclick=async()=>{el.disabled=true;try{await callback();}catch(error){status.textContent=accountErrorMessage(error);}finally{el.disabled=false;}};actions.appendChild(el);return el;};
  return new Promise(resolve=>{
    async function attempt(){
      actions.replaceChildren();status.textContent='ログインを確認しています…';
      try{
        const transport=await createAccountTransport({onFailure(error,save){
          try{localStorage.setItem(`legend-account-conflict::${transport.accountId}::${save.key}::${Date.now()}`,JSON.stringify(save.gameState));}catch{}
          const warning=document.getElementById('debug-error-banner');if(warning){warning.style.display='block';warning.textContent=accountErrorMessage(error);}
        }});
        if(!transport.summary.saveLimit){
          const returned=new URLSearchParams(location.search).get('purchase');
          status.textContent=returned==='processing'?'お支払いを確認しています。少し待ってから、もう一度確認してください。':returned==='cancelled'?'購入をキャンセルしました。':'購入の確認が必要です。';
          await appendPurchaseControls(actions,transport.summary);
          button('もう一度確認する','btn-account-refresh',attempt);button('ログアウト','btn-account-logout',async()=>{await transport.logout();await attempt();});return;
        }
        window.AccountSession=transport;window.CloudSave=transport;
        installAccountGameAPIs(transport);
        const title=document.querySelector('#screen-title .menu-grid'),row=document.createElement('div');row.className='account-title-controls';
        const count=document.createElement('span');count.id='account-save-count';count.textContent=`プレイヤー ${transport.summary.used} / ${transport.summary.saveLimit}`;row.appendChild(count);
        const logout=document.createElement('button');logout.type='button';logout.className='btn';logout.id='btn-account-logout';logout.textContent='ログアウト';
        logout.onclick=async()=>{logout.disabled=true;try{await transport.logout();location.reload();}catch(error){logout.disabled=false;count.textContent=accountErrorMessage(error);}};
        row.appendChild(logout);title?.appendChild(row);
        await appendPurchaseControls(row,transport.summary);
        window.addEventListener('beforeunload',event=>{if(transport.pending){event.preventDefault();event.returnValue='';}});
        gate.remove();resolve(transport);
      }catch(error){
        status.textContent=error.message==='authentication_required'?'LINEでログイン':accountErrorMessage(error);
        const login=async qr=>{const response=await fetch('/api/auth/line/start'+(qr?'?qr=1':''),{method:'POST',credentials:'same-origin'});const result=await response.json();if(!response.ok)throw Error(result.error);location.assign(result.authorizationUrl);};
        if(error.message==='authentication_required'){button('LINEでログイン','btn-account-login',()=>login(false));button('QRコードでログイン','btn-account-qr',()=>login(true));}
        button('もう一度確認する','btn-account-refresh',attempt);
      }
    }
    attempt();
  });
}
