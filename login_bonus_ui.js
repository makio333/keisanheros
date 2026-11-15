import {LOGIN_BONUS_REWARDS,loginBonusStatus} from './login_bonus.js';
import {createRewardDialog} from './announcements.js';
import './login_bonus.css';
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
export async function showLoginBonus(api){
 const {panel,overlay,close}=createRewardDialog('ログインボーナス'),message=el('p','今日の報酬を確認中…');panel.append(message);
 try{
  const day=await api.day();if(!panel.isConnected)return;const status=loginBonusStatus(api.game(),day);
  message.textContent='1日1回、日本時間の0時に切り替わります。お休みしても続きから。7日分を受け取ると、また1日目から始まります。';
  const grid=el('div',null,'login-bonus-grid');
  LOGIN_BONUS_REWARDS.forEach((reward,i)=>{const tile=el('section',null,'login-bonus-tile');tile.classList.toggle('is-current',i===status.index);const received=i<status.index||(!status.available&&i===status.index);tile.classList.toggle('is-received',received);tile.append(el('b',`${i+1}日目`));const icon=el('span');if(reward.gold)icon.innerHTML=api.goldIcon?.(64)||'';else icon.innerHTML=api.rewardIcon(reward.items[0],64);tile.append(icon,el('span',reward.gold?`${reward.gold.toLocaleString()} G`:api.rewardName(reward.items[0])+' ×1'),el('small',received?'受取済み':i===status.index?'今日の報酬':'お楽しみに'));grid.append(tile);});
  const button=el('button',status.available?`${status.index+1}日目の報酬を受け取る`:'今日は受け取り済み','btn btn-primary');button.disabled=!status.available;const feedback=el('p');feedback.setAttribute('role','status');button.onclick=async()=>{button.disabled=true;close.disabled=true;overlay.dataset.busy='1';try{await api.claim(day);button.textContent='受け取りました！';feedback.textContent='次の日も冒険に来てね。';grid.children[status.index].classList.add('is-received');grid.children[status.index].querySelector('small').textContent='受取済み';window.SM?.play?.('se_clear');}catch{feedback.textContent='保存できませんでした。通信を確認してもう一度押してください。';button.disabled=false;}finally{close.disabled=false;delete overlay.dataset.busy;}};
  panel.append(grid,button,feedback);
 }catch{message.textContent='ログインボーナスを確認できませんでした。通信を確認してもう一度開いてください。';}
}
