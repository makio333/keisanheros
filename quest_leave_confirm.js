// Returning does not revoke rewards already paid or discard saved answers.
export function confirmQuestLeave({image,remaining,onLeave}){
 if(remaining<=0){onLeave();return;}
 if(document.querySelector('.quest-leave-confirm'))return;
 const previous=document.activeElement;
 const overlay=document.createElement('div');overlay.className='quest-leave-confirm';overlay.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#000a;display:grid;place-items:center;padding:16px';
 const panel=document.createElement('section');panel.setAttribute('role','alertdialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','quest-leave-title');panel.style.cssText='width:min(480px,100%);box-sizing:border-box;max-height:90dvh;overflow:auto;border:3px solid #cda755;border-radius:20px;background:#fff3d9;color:#493321;padding:24px;text-align:center;box-shadow:0 12px 48px #0008';
 const portrait=document.createElement('img');portrait.src=image;portrait.alt='依頼主の村人';portrait.style.cssText='width:96px;height:112px;object-fit:contain';
 const title=document.createElement('h2');title.id='quest-leave-title';title.textContent='依頼一覧に戻りますか？';
 const note=document.createElement('p');note.textContent=`まだ受け取れる報酬が ${remaining}％ 残っています。ここで戻ると、残りの報酬は今は受け取れません。`;
 const safe=document.createElement('p');safe.textContent='受け取り済みの報酬と回答は残ります。あとから続きを解けます。';
 const stay=document.createElement('button');stay.className='btn btn-primary';stay.textContent='続けて解く';
 const leave=document.createElement('button');leave.className='btn';leave.textContent='残りは受け取らず戻る';
 const dismiss=()=>{overlay.remove();previous?.focus({preventScroll:true});};stay.onclick=dismiss;leave.onclick=()=>{overlay.remove();onLeave();};
 panel.append(portrait,title,note,safe,stay,leave);panel.querySelectorAll('button').forEach(b=>b.style.cssText='display:block;width:100%;margin-top:12px');overlay.append(panel);document.body.append(overlay);stay.focus();
 overlay.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();dismiss();}if(e.key==='Tab'){e.preventDefault();(document.activeElement===stay?leave:stay).focus();}};
}
