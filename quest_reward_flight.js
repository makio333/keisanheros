export async function questRewardFlight(source){
 const target=document.querySelector('.reading-subquest-overlay .reading-v2-hud-meter');
 if(!source||!target||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const a=source.getBoundingClientRect(),b=target.getBoundingClientRect();
 const dots=[];
 for(let i=0;i<5;i++){
  const dot=document.createElement('span');dot.setAttribute('aria-hidden','true');dot.style.cssText=`position:fixed;left:${a.x+a.width/2}px;top:${a.y+a.height/2}px;width:8px;height:8px;border-radius:50%;background:#ffd565;pointer-events:none;z-index:2147483646;box-shadow:0 0 6px #ffcf55`;
  document.body.append(dot);const animation=dot.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${b.x+b.width/2-a.x-a.width/2}px,${b.y+b.height/2-a.y-a.height/2}px) scale(.5)`,opacity:.8}],{duration:400,delay:i*35,easing:'ease-in',fill:'forwards'});
  dots.push(animation.finished.catch(()=>{}).finally(()=>dot.remove()));
 }
 await Promise.all(dots);
 target.animate([{filter:'brightness(1)'},{filter:'brightness(1.7)'},{filter:'brightness(1)'}],{duration:300});
}
