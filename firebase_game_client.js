import panelHtml from './save-migration.html?raw';
import {collection,doc,getDocsFromServer,runTransaction} from 'firebase/firestore';
import {signOut} from 'firebase/auth';
import {mountPrivateMigrationPanel,migrationAuth,migrationDb,getFreshCheckoutEmailToken} from './save_migration_client.js';
import {createFirebaseGameTransport} from './firebase_game_transport.js';
import {installFirebaseRaidAPI} from './firebase_raid_api_client.js';

export async function initializeFirebaseGameClient(){
  const gate=document.createElement('div');gate.className='firebase-game-gate';gate.style.zIndex='10000001';
  const panel=document.createElement('div');panel.className='private-migration-ui firebase-game-panel';
  const headings=document.createElement('style');headings.textContent='.firebase-game-panel h1{color:#fff;text-shadow:none}.firebase-game-panel h2{color:#20262d;text-shadow:none}';panel.appendChild(headings);
  const source=new DOMParser().parseFromString(panelHtml,'text/html');
  for(const node of source.body.children)if(node.tagName!=='SCRIPT')panel.appendChild(document.importNode(node,true));
  panel.querySelector('h1').textContent='ログイン・セーブ管理';
  panel.querySelector('aside').textContent=import.meta.env.VITE_MIGRATION_IMPORT_ENABLED==='0'?'ゲームの進行は、ログインしたアカウント専用に保存します。':'施設で管理するアカウントを使用してください。取り込んだJSONの原本は保管し、ゲームの進行は同じアカウント専用に保存します。';
  const enter=document.createElement('button');enter.id='firebase-enter-game';enter.type='button';enter.textContent='ゲームへ進む';enter.hidden=true;
  panel.querySelector('#migration-account').prepend(enter);gate.appendChild(panel);document.body.appendChild(gate);
  let transport,started=false,resolveGame;
  const ready=new Promise(resolve=>resolveGame=resolve);
  const updateCount=()=>{const el=document.getElementById('account-save-count');if(el&&transport)el.textContent=`プレイヤー ${transport.summary.used} / ${transport.summary.saveLimit}`;};
  const enteredKey=uid=>`legend-game-entered:${uid}`;
  const errorText=error=>error.message==='save_revision_conflict'?'別の端末で更新されています。この端末の内容は上書きしません。':'保存できていません。接続とログインを確認してください。';
  const ui=mountPrivateMigrationPanel(panel,{
    originalBackup:true,
    async onReady({user,records,registration,returnToPurchase=false}){
      if(import.meta.env.VITE_FIREBASE_SALES==='1'){
        const response=await fetch('/api/auth/firebase/session',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken:await user.getIdToken()})});
        const result=await response.json();if(!response.ok)throw Error(result.error||'authentication_required');
        if(started){
          const keepForCheckout=returnToPurchase&&result.registrationState==='legacy'&&registration?.emailVerified!==true;
          if(!keepForCheckout){gate.hidden=true;gate.style.display='none';}
          return;
        }
        const {initializeAccountClient}=await import('./account_client.js');
        const account=await initializeAccountClient({firebaseUid:user.uid,getFreshCheckoutEmailToken:()=>getFreshCheckoutEmailToken(user.uid),
          onNeedEmailVerification:async()=>{gate.hidden=false;gate.style.display='grid';await ui.refreshForPurchase();},
          onLogout:()=>signOut(migrationAuth),onAuthenticationRequired:async()=>{await signOut(migrationAuth);location.reload();}});
        started=true;gate.hidden=true;gate.style.display='none';resolveGame(account);
        return;
      }
      if(!transport||transport.accountId!==user.uid){
        if(started){location.reload();return;}
        transport=await createFirebaseGameTransport({uid:user.uid,isCurrentUser:uid=>migrationAuth.currentUser?.uid===uid,
          readSaves:async uid=>(await getDocsFromServer(collection(migrationDb,'privateGame',uid,'saves'))).docs.map(row=>({id:row.id,...row.data()})),
          reference:(uid,key)=>doc(migrationDb,'privateGame',uid,'saves',key),transaction:callback=>runTransaction(migrationDb,callback),
          onFailure(error,save){try{localStorage.setItem(`legend-account-conflict::${user.uid}::${save.key}`,JSON.stringify(save.gameState));}catch{}const banner=document.getElementById('debug-error-banner');if(banner){banner.textContent=errorText(error);banner.style.display='block';}},
        });
        installFirebaseRaidAPI({getIdToken:async()=>{
          const current=migrationAuth.currentUser;
          if(!current||current.uid!==user.uid)throw Error('authentication_required');
          return current.getIdToken();
        }});
      }
      await transport.seedMigration(records);updateCount();enter.hidden=false;
      enter.textContent=transport.summary.used?'セーブを選んで遊ぶ':'ゲームをはじめる';
      try{if(!started&&localStorage.getItem(enteredKey(user.uid))==='1')queueMicrotask(()=>enter.click());}catch{}
    },
    beforeSignOut:async()=>{if(transport)await transport.flush();},
    onSignedOut(){enter.hidden=true;if(started)location.reload();transport=undefined;},
  });
  enter.onclick=async()=>{
    if(!transport||enter.disabled)return;enter.disabled=true;
    try{
      await transport.flush();
      if(started){location.reload();return;}
      window.AccountSession=transport;window.CloudSave=transport;
      const row=document.createElement('div');row.className='firebase-game-controls';
      const count=document.createElement('span');count.id='account-save-count';row.appendChild(count);
      const manage=document.createElement('button');manage.type='button';manage.textContent=import.meta.env.VITE_MIGRATION_IMPORT_ENABLED==='0'?'アカウント':'アカウント・JSON取り込み';manage.id='btn-firebase-account';
      const close=document.createElement('button');close.type='button';close.textContent='ゲームに戻る';close.id='btn-firebase-account-close';close.hidden=true;
      panel.querySelector('main').prepend(close);
      manage.onclick=()=>{gate.hidden=false;gate.style.display='grid';close.hidden=false;ui.refresh().catch(error=>panel.querySelector('#migration-status').textContent=errorText(error));};
      close.onclick=()=>{gate.hidden=true;gate.style.display='none';};
      row.appendChild(manage);document.querySelector('#screen-title .menu-grid')?.appendChild(row);
      const tab=document.createElement('button');tab.type='button';tab.className='btn';tab.textContent='アカウント';tab.id='admin-tab-btn-firebase-account';tab.onclick=()=>manage.click();document.querySelector('#screen-admin .admin-nav')?.appendChild(tab);
      updateCount();gate.hidden=true;gate.style.display='none';started=true;
      try{localStorage.setItem(enteredKey(transport.accountId),'1');}catch{}
      window.addEventListener('beforeunload',event=>{if(transport.pending){event.preventDefault();event.returnValue='';}});
      resolveGame(transport);
    }catch(error){panel.querySelector('#migration-status').textContent=errorText(error);}finally{enter.disabled=false;}
  };
  return ready;
}
