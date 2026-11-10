import './hp_recovery_feedback.css';

export function createHpRecoveryTracker(onRecover){
 const previous=new WeakMap();
 return player=>{
  if(!player||typeof player!=='object'||!Number.isFinite(player.hp))return;
  const before=previous.get(player);previous.set(player,player.hp);
  if(before!==undefined&&player.hp>before)onRecover(player.hp-before);
 };
}
const activeEffects=new WeakMap();
export function showHpRecovery(amount){
 if(!Number.isFinite(amount)||amount<=0)return;
 const screen=document.querySelector('.screen.active');
 if(!screen)return;
 const prefix=screen.id==='screen-battle'?'battle':screen.id==='screen-home'?'home':screen.id==='screen-room'?'room':null;
 if(!prefix)return;
 const hp=document.getElementById(`${prefix}-player-hp`);
 const anchor=hp?.closest('.stat-bar-wrap');
 if(!anchor||!anchor.getClientRects().length)return;
 const old=activeEffects.get(screen);
 const total=amount+(old?.amount||0);old?.clear();
 const wash=document.createElement('div');wash.className='hp-recovery-glow';wash.setAttribute('aria-hidden','true');
 for(let i=0;i<7;i++){const spark=document.createElement('i');spark.style.setProperty('--spark-x',`${12+i*12}%`);spark.style.setProperty('--spark-delay',`${i*35}ms`);wash.append(spark);}
 const label=document.createElement('span');label.className='hp-recovery-amount';label.textContent=`＋${total.toLocaleString('ja-JP')}`;label.setAttribute('role','status');label.setAttribute('aria-label',`HPが${total.toLocaleString('ja-JP')}回復`);
 anchor.classList.add('hp-recovery-anchor','hp-recovery-gauge');anchor.append(label);screen.append(wash);
 let timeout;
 const clear=()=>{clearTimeout(timeout);label.remove();wash.remove();anchor.classList.remove('hp-recovery-gauge');if(activeEffects.get(screen)?.clear===clear)activeEffects.delete(screen);};
 activeEffects.set(screen,{amount:total,clear});
 timeout=setTimeout(clear,1000);
}
export const trackHpRecovery=createHpRecoveryTracker(showHpRecovery);
