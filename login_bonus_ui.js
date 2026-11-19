import {DAILY_CHALLENGES,DAILY_MILESTONES,challengeBonusStatus} from './login_bonus.js';
import {createRewardDialog} from './announcements.js';
import './login_bonus.css';
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
export async function showLoginBonus(api){
 const {panel,overlay,close}=createRewardDialog('デイリーミッション'),message=el('p','今日のミッションを確認中…');panel.classList.add('daily-mission-panel');close.classList.add('daily-mission-close');close.textContent='×';close.setAttribute('aria-label','とじる');const header=el('header',null,'daily-mission-header');header.append(panel.querySelector('h2'),message,close);panel.append(header);close.focus({preventScroll:true});
 try{const day=await api.day();if(!panel.isConnected)return;const status=challengeBonusStatus(api.game(),day),count=status.completed.length;
 message.textContent=`${day}・毎日0時更新`;
 const progress=el('section',null,'daily-mission-progress');progress.append(el('b',`${count} / ${DAILY_CHALLENGES.length}`,'daily-mission-count'));const gauge=el('div',null,'daily-mission-gauge');gauge.setAttribute('role','progressbar');gauge.setAttribute('aria-label','デイリーミッションの達成数');gauge.setAttribute('aria-valuemin','0');gauge.setAttribute('aria-valuemax','8');gauge.setAttribute('aria-valuenow',String(count));for(let i=0;i<8;i++){const segment=el('span',null,i<count?'is-filled':'');segment.append(el('i',i<count?'✓':''),el('small',String(i+1)));segment.style.setProperty('--delay',`${i*45}ms`);gauge.append(segment);}panel.append(progress);
 const track=el('div',null,'daily-mission-track'),rewards=el('div',null,'daily-mission-rewards'),feedback=el('p');feedback.setAttribute('role','status');
 for(const milestone of DAILY_MILESTONES){const claimed=status.claimed.includes(milestone.id),ready=count>=milestone.count,tile=el('section',null,'daily-mission-reward');tile.style.gridColumn=String(milestone.count);tile.dataset.milestone=String(milestone.count);tile.classList.toggle('is-ready',ready&&!claimed);tile.classList.toggle('is-received',claimed);const icon=el('span');icon.innerHTML=milestone.gold?api.goldIcon(52):api.rewardIcon(milestone.items[0],52);const artwork=icon.querySelector('img');if(artwork)icon.replaceChildren(artwork);if(milestone.gold&&milestone.items.length){const extra=el('span',null,'daily-mission-extra-prize');extra.innerHTML=api.rewardIcon(milestone.items[0],36);const img=extra.querySelector('img');if(img)extra.replaceChildren(img);icon.append(extra);}const stateLabel=el('small',claimed?'受取済み':ready?'受取可能':`${milestone.count}個で解放`,'daily-mission-prize-state');tile.setAttribute('aria-label',`${milestone.count}個達成の報酬：${stateLabel.textContent}`);tile.title=`${milestone.count}個達成：${milestone.gold?milestone.gold+' G'+(milestone.items.length?' ＋ '+api.rewardName(milestone.items[0])+' ×1':''):api.rewardName(milestone.items[0])+' ×1'}`;tile.append(icon,el('span',milestone.gold?`${milestone.gold.toLocaleString()} G${milestone.items.length?' ＋ 🎟1':''}`:'×1'),stateLabel);rewards.append(tile);}track.append(rewards,gauge);progress.append(track);panel.append(feedback);
 const available=DAILY_MILESTONES.filter(m=>count>=m.count&&!status.claimed.includes(m.id));
 const claimButton=el('button',available.length?'受け取る':status.claimed.length?'受取済み':'受け取る','btn btn-primary daily-mission-claim');claimButton.type='button';claimButton.disabled=!available.length;
 claimButton.setAttribute('aria-label',available.length?`達成報酬をまとめて受け取る（${available.length}件）`:claimButton.textContent);
 claimButton.onclick=async()=>{
  if(overlay.dataset.busy)return;
  const controls=[...panel.querySelectorAll('button')].map(button=>({button,disabled:button.disabled}));
  controls.forEach(({button})=>button.disabled=true);overlay.dataset.busy='1';claimButton.textContent='受け取り中…';
  try{
   const gifts=await api.claimAll(day);
   for(const milestone of available){const tile=rewards.querySelector(`[data-milestone="${milestone.count}"]`);tile.classList.remove('is-ready');tile.classList.add('is-received');tile.querySelector('.daily-mission-prize-state').textContent='受取済み';}
   delete overlay.dataset.busy;close.disabled=false;close.click();api.showRewards(gifts);
  }catch{
   feedback.textContent='受け取れませんでした。日付と通信を確認してもう一度押してください。';
   claimButton.textContent='受け取る';controls.forEach(({button,disabled})=>button.disabled=disabled);delete overlay.dataset.busy;claimButton.focus({preventScroll:true});
  }
 };
 panel.insertBefore(claimButton,feedback);
 const tasks=el('div',null,'daily-mission-tasks');for(const q of DAILY_CHALLENGES){const done=status.completed.includes(q.id),row=el('section',null,'daily-mission-task');row.classList.toggle('is-complete',done);row.setAttribute('aria-label',q.name+'：'+(done?'達成':'未達成'));const shortName=q.name.replace('算数の','算数').replace('国語の','国語').replace(/をクリア$/,'をクリアする');row.append(el('span',done?'✓':'','daily-mission-check'),el('b',shortName));if(api.navigate){const go=el('button',q.id.endsWith('-print')?'印刷':'挑戦','btn daily-challenge-go');go.setAttribute('aria-label',q.name+'へ進む');go.onclick=()=>{if(overlay.dataset.busy)return;close.click();api.navigate(q.id);};row.append(go);}tasks.append(row);}panel.append(tasks);
 const help=el('details',null,'daily-mission-help');help.append(el('summary','達成条件'),el('p','1項目達成でゲージが1つ増えます。ミッション画面以外からの挑戦も対象です。通常ステージは1ステージ、チャレンジはおすすめステージ、サブクエストは5問すべて正解で達成。印刷はチャレンジ問題の印刷後に確認すると達成します。景品はゲージが届いたら「受け取る」でまとめて受け取れます。'));panel.append(help);
 }catch{message.textContent='ミッションを確認できませんでした。通信を確認してもう一度開いてください。';}
}
