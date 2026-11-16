// Keep errors visible without trapping the player behind a permanent banner.
export function hideErrorBanner(){
 const banner=document.getElementById('debug-error-banner');if(!banner)return;
 banner.style.display='none';banner.replaceChildren();
}
export function showErrorBanner(message){
 const banner=document.getElementById('debug-error-banner');if(!banner)return;
 const previous=document.activeElement;
 const text=document.createElement('span');text.textContent=String(message);text.style.cssText='flex:1;min-width:0;overflow-wrap:anywhere';
 const close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label','エラー表示を閉じる');close.style.cssText='flex:0 0 36px;width:36px;min-width:36px;height:36px;min-height:36px;padding:0;margin:0;border:1px solid #ffffff99;border-radius:6px;background:#ffffff18;color:white;font:26px/1 sans-serif;cursor:pointer;align-self:flex-start';
 close.onclick=()=>{hideErrorBanner();if(previous?.isConnected)previous.focus?.({preventScroll:true});};
 banner.setAttribute('role','alert');banner.style.display='flex';banner.style.alignItems='center';banner.style.gap='12px';banner.replaceChildren(text,close);
}
