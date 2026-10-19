// Event combat rules are separate from stage rewards and world-raid damage.
export const EVENT_RAID_RULES = Object.freeze({
  durationMs: 120000, enemyHp: 10, slots: 7, hitIntervalMs:120,
  targetSteps: [{until:10000,count:4},{until:20000,count:3}], minimumTargets:2,
  chargeGoal: 5, specialTargets: 7, enemyAtk:2, enemyDef:0,
  hpPerKill:5, atkPerKill:1, defPerKill:1,
});

export function eventRaidTargetCount(elapsedMs, rules = EVENT_RAID_RULES) {
  return rules.targetSteps.find(step=>Math.max(0,elapsedMs)<=step.until)?.count || rules.minimumTargets;
}

export function eventRaidGaugeRatio(elapsedMs) { return Math.max(0.5,1-Math.max(0,elapsedMs)/40000); }
export function formatEventRaidTime(remainingMs) {
  const seconds=Math.ceil(Math.max(0,remainingMs)/1000);
  return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
}

export function sampleEventRaidTargets(enemies, count, random = Math.random) {
  const living = enemies.filter(enemy=>enemy.hp>0);
  for(let i=living.length-1;i>0;i--) {
    const j=Math.min(i,Math.max(0,Math.floor(random()*(i+1))));
    [living[i],living[j]]=[living[j],living[i]];
  }
  return living.slice(0,Math.max(0,count));
}

export class EventRaidRun {
  constructor(startedAt, rules = EVENT_RAID_RULES, random = Math.random) {
    this.rules=rules; this.startedAt=startedAt; this.endsAt=startedAt+rules.durationMs;
    this.charge=0; this.kills=0; this.spawnCount=0; this.over=false; this.random=random;
    this.counted=new Set(); this.answers=0;
    this.enemies=Array.from({length:rules.slots},(_,slot)=>this.spawn(slot));
  }
  spawn(partyId) {
    const spawnId=this.spawnCount++;
    const hp=this.rules.enemyHp+this.kills*this.rules.hpPerKill;
    return {partyId,spawnId,monsterIndex:Math.min(6,Math.max(0,Math.floor(this.random()*7))),hp,maxHp:hp,
      atk:this.rules.enemyAtk+this.kills*this.rules.atkPerKill,
      def:this.rules.enemyDef+this.kills*this.rules.defPerKill,spawnKills:this.kills,level:this.kills+1};
  }
  beginQuestion(now) { this.questionAt=now; this.answered=false; }
  remaining(now) { return Math.max(0,this.endsAt-now); }
  answer(correct, now, random = Math.random, elapsedMs = now-this.questionAt) {
    if(this.over || !this.remaining(now) || this.answered || this.questionAt===undefined) return null;
    this.answered=true; this.answers++;
    if(!correct) return {correct:false,special:false,targets:[]};
    const special=this.charge>=this.rules.chargeGoal;
    this.charge=special?0:this.charge+1;
    const count=special?this.rules.specialTargets:eventRaidTargetCount(elapsedMs,this.rules);
    return {correct:true,special,targets:sampleEventRaidTargets(this.enemies,count,random)};
  }
  hit(enemy, now, damage) {
    if(this.over || !this.remaining(now) || !this.enemies.includes(enemy) || enemy.hp<=0 || !Number.isFinite(damage) || damage<=0) return false;
    const hpBefore=enemy.hp;
    enemy.hp=Math.max(0,enemy.hp-damage);
    if(hpBefore>0 && enemy.hp===0 && !this.counted.has(enemy.spawnId)) {
      this.counted.add(enemy.spawnId); this.kills++;
      return true;
    }
    return false;
  }
  refill() {
    if(this.over) return;
    this.enemies=this.enemies.map(enemy=>enemy.hp<=0?this.spawn(enemy.partyId):enemy);
  }
  end() { if(this.over) return false; this.over=true; return true; }
}

export const EVENT_RAID_BONUSES = [
  {kills:5,candy:5},
  {kills:10,candy:10,halloweenTickets:1,costSeeds:1},
  {kills:20,candy:20,skinGachaTickets:1},
  {kills:30,candy:30,halloweenTickets:1,costSeeds:2},
  {kills:50,candy:50,halloweenTickets:1,equipGachaTenPullTickets:1,costSeeds:3},
];

export function eventRaidBonusEntitlements(bestKills) {
  return Object.fromEntries(EVENT_RAID_BONUSES.filter(row=>bestKills>=row.kills).map(row=>['breakthrough:'+row.kills,{...row}]));
}

export function eventRaidRewardEntitlements(bestKills, participationDay) {
  const rewards={};
  if(/^2026-10-(0[1-9]|[12]\d|3[01])$/.test(participationDay || '')) rewards['participation:'+participationDay]=2;
  for(const {kills,candy} of EVENT_RAID_BONUSES) if(bestKills>=kills) rewards['kills:'+kills]=candy;
  return rewards;
}

export function rankEventRaidRecords(records, metric='bestKills') {
  const score=row=>metric==='totalKills'?(row.totalKills ?? row.bestKills):row.bestKills;
  const rows=records.filter(row=>Number.isSafeInteger(score(row))&&score(row)>=0)
    .sort((a,b)=>score(b)-score(a) || String(a.slotKey).localeCompare(String(b.slotKey)));
  return rows.map((row,index)=>({...row,rank:index&&score(row)===score(rows[index-1])?rows.findIndex(r=>score(r)===score(row))+1:index+1}));
}
export const EVENT_RAID_FINAL_AT=Date.parse('2026-11-01T00:00:00+09:00');
export function eventRaidFinalGift(records,slotKey) {
  const row=rankEventRaidRecords(records,'totalKills').find(entry=>entry.slotKey===slotKey);
  if(!row)return null;
  const items=[{kind:'equip',id:'halloween_rank_blade',rarity:3,count:1}];
  const decoration={1:'rank_gold',2:'rank_silver',3:'rank_bronze'}[row.rank];
  if(decoration)items.push({kind:'decoration',id:decoration,count:1});
  return {id:'halloween_2026_final',gold:0,items,rank:row.rank,message:`ハロウィン最終ランキング ${row.rank}位！ 参加ありがとう！`};
}
