export async function questRewardFlight(source){
 const target=document.querySelector('.reading-subquest-overlay .reading-v2-hud-meter');
 if(!source||!target)return;
 window.SM?.play?.('se_decide',.7);
 if(matchMedia('(prefers-reduced-motion: reduce)').matches){window.SM?.play?.('se_heal',.65);return;}
 const a=source.getBoundingClientRect(),b=target.getBoundingClientRect();
 const dots=[];
 for(let i=0;i<16;i++){
  const dot=document.createElement('span');dot.setAttribute('aria-hidden','true');dot.style.cssText=`position:fixed;left:${a.x+a.width/2}px;top:${a.y+a.height/2}px;width:12px;height:12px;clip-path:polygon(50% 0,62% 35%,100% 50%,62% 65%,50% 100%,38% 65%,0 50%,38% 35%);background:#ffe391;pointer-events:none;z-index:2147483646;box-shadow:0 0 6px #ffcf55`;
  document.body.append(dot);const animation=dot.animate([{transform:`translate(${(i%4-1.5)*16}px,${(i%3-1)*18}px) scale(1.4)`,opacity:1},{transform:`translate(${b.x+b.width/2-a.x-a.width/2}px,${b.y+b.height/2-a.y-a.height/2}px) scale(.5)`,opacity:.8}],{duration:400,delay:i*10,easing:'ease-in',fill:'forwards'});
  dots.push(animation.finished.catch(()=>{}).finally(()=>dot.remove()));
 }
 await Promise.all(dots);
 if(target.isConnected)window.SM?.play?.('se_heal',.65);
 target.animate([{filter:'brightness(1)'},{filter:'brightness(2.5)'},{filter:'brightness(1)'}],{duration:300});
}

export function revealQuestResults(root){
 const rows=[...root.querySelectorAll('.math-word-result-row,.reading-v2-result-row')];
 if(!rows.length)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const correct=row=>!row.classList.contains('is-wrong')&&(!row.dataset.status||row.dataset.status==='correct');
 const board=document.createElement('section');board.className='quest-result-scoreboard';board.setAttribute('aria-label','各問題の採点結果');
 board.style.cssText=`display:grid;grid-template-columns:repeat(${rows.length},minmax(0,1fr));gap:8px;margin:16px 0 24px`;
 rows.forEach((row,i)=>{
  const cell=document.createElement('div');cell.style.cssText='text-align:center;border:2px solid #bba06b;border-radius:12px;padding:10px 0;background:#fff8e5';
  const label=document.createElement('div');label.textContent=(i+1)+'問め';label.style.cssText='font-weight:bold;font-size:clamp(12px,2vw,18px)';
  const mark=document.createElement('div');mark.textContent=correct(row)?'○':row.dataset.status==='needs-review'?'？':'×';mark.style.cssText='font:bold clamp(32px,5vw,54px)/1.2 sans-serif;color:'+(correct(row)?'#dc4141':'#376fb4');
  cell.append(label,mark);board.append(cell);
  if(!reduced)mark.animate([{opacity:0,transform:'scale(2)'},{opacity:1,transform:'scale(.85)'},{opacity:1,transform:'scale(1)'}],{duration:400,delay:250+i*450,fill:'backwards'});
  if(!reduced)row.animate([{opacity:0},{opacity:1}],{duration:300,delay:250+rows.length*450,fill:'backwards'});
 });
 root.prepend(board);
 if(rows.every(correct)){
  const showClear=()=>{if(root.isConnected)showQuestClear(root);};
  if(reduced)showClear();else setTimeout(showClear,250+rows.length*450+500);
  const title=document.createElement('h2');title.textContent='全問正解！ おめでとう！';title.style.cssText='text-align:center;color:#a46613;font-size:clamp(24px,4vw,40px)';board.after(title);
  if(!reduced)title.animate([{opacity:0,transform:'scale(.7)'},{opacity:1,transform:'scale(1)'}],{duration:500,delay:250+rows.length*450,fill:'backwards'});
 }
}

function showQuestClear(root){
 if(document.querySelector('.quest-clear-reward-overlay'))return;
 const layer=document.createElement('div');layer.className='quest-clear-reward-overlay';layer.style.cssText='position:fixed;inset:0;z-index:2147483646;display:grid;place-items:center;padding:16px;background:radial-gradient(ellipse,#87651e99,#080714ed)';
 const card=document.createElement('section');card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');card.setAttribute('aria-label','クエストクリア報酬');card.style.cssText='width:min(620px,100%);box-sizing:border-box;text-align:center;color:#fff1bd;border:3px solid #ffd667;border-radius:24px;padding:32px 24px;background:linear-gradient(145deg,#302144,#141225);box-shadow:0 0 60px #ffc85566';
 const title=document.createElement('h2');title.textContent='クエストクリア！';title.style.cssText='font-size:clamp(28px,6vw,48px);color:#ffdc70;margin:0 0 12px;text-shadow:0 3px #6f4217';
 const message=document.createElement('p');message.textContent='全問正解！ 報酬100％を受け取りました！';
 const rewards=root.closest('.reading-subquest-overlay')?.querySelector('.reading-v2-hud-counters')?.cloneNode(true);
 if(rewards){rewards.style.cssText='display:flex;flex-wrap:wrap;justify-content:center;gap:18px;padding:24px 8px;background:#fff1c9;color:#503716;border-radius:16px;margin:24px 0';}
 const close=document.createElement('button');close.className='btn btn-primary';close.textContent='答え合わせを見る';close.style.cssText='width:100%;margin-top:20px';close.onclick=()=>{layer.remove();root.querySelector('button')?.focus();};
 card.append(title,message);if(rewards)card.append(rewards);card.append(close);layer.append(card);document.body.append(layer);close.focus();
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches)card.animate([{transform:'scale(.5)',opacity:0},{transform:'scale(1.05)',opacity:1},{transform:'scale(1)',opacity:1}],{duration:600});
 layer.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();close.click();}if(e.key==='Tab'){e.preventDefault();close.focus();}};
}
