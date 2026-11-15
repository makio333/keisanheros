// Test Hosting only. This adapter never contacts production or publishes rankings.
import {raidJstMonthKey,raidMonthlyBossId} from './raid_monthly_rules.js';
import {validRaidDamage} from './raid_run_rules.js';
export function createTestRaidAPI({storage=localStorage,now=Date.now}={}){
 const key='legend-test-raid-v1';
 const fresh=()=>{const periodKey=raidJstMonthKey(now());return {periodKey,bossId:raidMonthlyBossId(periodKey,50),bossLevel:50,monsterId:'moonWraith',maxHp:50000,totalDamageDealt:0,players:{},events:{},cheers:{}};};
 const read=()=>{let data;try{data=JSON.parse(storage.getItem(key));}catch{}return data?.periodKey===raidJstMonthKey(now())?data:fresh();};
 const write=data=>storage.setItem(key,JSON.stringify(data));
 const ranks=data=>Object.entries(data.players).filter(([,p])=>p.participated||p.totalDamage>0).map(([slotKey,p])=>({slotKey,...p})).sort((a,b)=>b.totalDamage-a.totalDamage||a.participationAt-b.participationAt);
 const global=data=>{if(data.defeatedAt&&!data.finalizedAt&&now()>=data.settlesAt){data.finalizedAt=now();data.finalRankings=ranks(data);write(data);}const {players,events,cheers,...boss}=data;return boss;};
 return {
  mode:'browser-test',
  async syncPlayer(slotKey,profile={},progress={}){
   const data=read(),old=data.players[slotKey]||{totalDamage:0,challengeCount:0,participated:false,participationAt:now()},row={...old,...profile};
   if(!old.legacyImported){row.totalDamage=Math.max(old.totalDamage,validRaidDamage(progress.legacyDamage)||0);data.totalDamageDealt+=row.totalDamage-old.totalDamage;row.legacyImported=true;}
   const acknowledged=[];
   for(const event of progress.events||[]){if(!event?.id||validRaidDamage(event.damage)===null)continue;if(event.bossId!==data.bossId&&event.bossId!==progress.bossId)continue;acknowledged.push(event.id);if(data.events[event.id])continue;if(data.settlesAt&&now()>data.settlesAt)continue;data.events[event.id]=true;row.totalDamage+=event.damage;row.challengeCount++;row.participated=true;data.totalDamageDealt+=event.damage;}
   row.participated ||= !!progress.participated;data.players[slotKey]=row;
   if(data.totalDamageDealt>=data.maxHp&&!data.defeatedAt){data.defeatedAt=now();data.settlesAt=now()+60000;data.finisherSlotKeys=[slotKey];}
   write(data);return {...global(data),acknowledged,challengeCount:row.challengeCount};
  },
  async getGlobalBoss(){return global(read());},
  async getRankings(bossId){const data=read();return !bossId||bossId===data.bossId?ranks(data):[];},
  async getMonthlyRankings(periodKey){const data=read();return periodKey===data.periodKey?ranks(data):[];},
  async getHistory(){const data=read();return data.defeatedAt?[{...global(data),rankings:ranks(data)}]:[];},
  async settleReward(){return {eligible:false};},
  async receiveCheers(){return 0;},
  async sendCheer(from,to,day){if(from===to)return false;const data=read(),id=from+':'+to+':'+day;if(data.cheers[id])return false;data.cheers[id]=true;write(data);return true;},
  watchBoss(onChange){return ()=>{};},
 };
}
export function installTestRaid(target=window){target.RaidBossAPI=createTestRaidAPI({storage:target.localStorage});}
