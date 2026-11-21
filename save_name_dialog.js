import {bindInputComposition} from './input_composition_guard.js';
import './save_name_dialog.css';
export function showSaveNameDialog({name,onSave,onSaved}){
 if(document.querySelector('.save-name-overlay'))return;
 const previous=document.activeElement,overlay=document.createElement('div');overlay.className='save-name-overlay';
 const panel=document.createElement('form');panel.className='panel save-name-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','save-name-heading');
 const title=document.createElement('h2');title.id='save-name-heading';title.textContent='名前を変更';
 const label=document.createElement('label');label.textContent='あたらしい名前（12文字まで）';
 const input=document.createElement('input');input.type='text';input.className='challenge-input';input.value=name;input.maxLength=12;input.autocomplete='off';input.setAttribute('aria-label','あたらしい名前');label.append(input);
 const message=document.createElement('p');message.className='save-name-message';message.id='save-name-message';message.setAttribute('role','status');input.setAttribute('aria-describedby',message.id);
 const actions=document.createElement('div');actions.className='save-name-actions';const cancel=document.createElement('button'),save=document.createElement('button');cancel.type='button';cancel.className='btn';cancel.textContent='やめる';save.type='submit';save.className='btn btn-primary';save.textContent='変更する';actions.append(cancel,save);panel.append(title,label,message,actions);overlay.append(panel);document.body.append(overlay);
 const ime=bindInputComposition(input);let busy=false;
 const close=()=>{if(busy)return;ime.cleanup();overlay.remove();if(previous?.isConnected)previous.focus({preventScroll:true});};cancel.onclick=close;
 overlay.addEventListener('keydown',event=>{event.stopPropagation();if(event.key==='Escape'&&!ime.blocked(event)){event.preventDefault();close();}if(event.key==='Tab'){event.preventDefault();const controls=[input,cancel,save].filter(el=>!el.disabled),index=controls.indexOf(document.activeElement);if(controls.length)controls[(index+(event.shiftKey?-1:1)+controls.length)%controls.length].focus();}});
 input.addEventListener('keydown',event=>{if(event.key==='Enter'&&ime.submissionBlocked(event))event.preventDefault();});
 panel.onsubmit=async event=>{
  event.preventDefault();if(busy||ime.submissionBlocked(event))return;
  const value=input.value.trim();if(!value){message.textContent='名前を入力してください。';input.focus();return;}if(value.length>12){message.textContent='名前は12文字以内で入力してください。';return;}
  busy=true;input.disabled=cancel.disabled=save.disabled=true;save.textContent='保存中…';message.textContent='';
  try{await onSave(value);}catch(error){busy=false;input.disabled=cancel.disabled=save.disabled=false;save.textContent='変更する';message.textContent=error?.message==='save_revision_conflict'?'別の端末で更新されています。画面を再読み込みしてから変更してください。':'変更を保存できませんでした。通信を確認して、もう一度押してください。';input.focus();return;}
  busy=false;close();onSaved?.();
 };
 input.focus();input.select();
}
