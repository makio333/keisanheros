export async function questRewardFlight(source){
 const target=document.querySelector('.reading-subquest-overlay .reading-v2-hud-meter');
 if(!source||!target||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const a=source.getBoundingClientRect(),b=target.getBoundingClientRect();
 const dots=[];
 for(let i=0;i<16;i++){
  const dot=document.createElement('span');dot.setAttribute('aria-hidden','true');dot.style.cssText=`position:fixed;left:${a.x+a.width/2}px;top:${a.y+a.height/2}px;width:12px;height:12px;clip-path:polygon(50% 0,62% 35%,100% 50%,62% 65%,50% 100%,38% 65%,0 50%,38% 35%);background:#ffe391;pointer-events:none;z-index:2147483646;box-shadow:0 0 6px #ffcf55`;
  document.body.append(dot);const animation=dot.animate([{transform:`translate(${(i%4-1.5)*16}px,${(i%3-1)*18}px) scale(1.4)`,opacity:1},{transform:`translate(${b.x+b.width/2-a.x-a.width/2}px,${b.y+b.height/2-a.y-a.height/2}px) scale(.5)`,opacity:.8}],{duration:400,delay:i*10,easing:'ease-in',fill:'forwards'});
  dots.push(animation.finished.catch(()=>{}).finally(()=>dot.remove()));
 }
 await Promise.all(dots);
 target.animate([{filter:'brightness(1)'},{filter:'brightness(2.5)'},{filter:'brightness(1)'}],{duration:300});
}

export function revealQuestResults(root){
 const rows=[...root.querySelectorAll('.math-word-result-row,.reading-v2-result-row')];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const allCorrect=rows.length>0&&rows.every(row=>!row.classList.contains('is-wrong')&&(!row.dataset.status||row.dataset.status==='correct'));
 rows.forEach((row,i)=>{
  const correct=!row.classList.contains('is-wrong')&&(!row.dataset.status||row.dataset.status==='correct');
  if(!reduced)row.animate([{opacity:.25,transform:'translateY(12px)',backgroundColor:'transparent'},{opacity:1,transform:'translateY(0)',backgroundColor:correct?'#ffe5a680':'#ffb7ad40'},{opacity:1,backgroundColor:'transparent'}],{duration:650,delay:i*220,fill:'backwards'});
  if(correct){const mark=document.createElement('span');mark.textContent='○';mark.setAttribute('aria-hidden','true');mark.style.cssText='display:inline-block;color:#dc4141;font-size:28px;font-weight:bold;margin-right:8px';(row.querySelector('summary,b')||row).prepend(mark);if(!reduced)mark.animate([{transform:'scale(2)',opacity:0},{transform:'scale(.85)',opacity:1},{transform:'scale(1)',opacity:1}],{duration:420,delay:i*220,fill:'backwards'});}
 });
 if(allCorrect){const title=document.createElement('h2');title.textContent='全問正解！ おめでとう！';title.style.cssText='text-align:center;color:#ffd865;text-shadow:0 2px 6px #513400;font-size:clamp(24px,4vw,40px)';root.prepend(title);if(!reduced)title.animate([{transform:'scale(.7)',opacity:0},{transform:'scale(1.12)',opacity:1},{transform:'scale(1)',opacity:1}],{duration:600,delay:rows.length*220,fill:'backwards'});}
}
