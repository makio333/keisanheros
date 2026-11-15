import {applyGiftPayload} from './economy.js';
export const DAILY_CHALLENGES=Object.freeze([
 ['math-stage','算数のステージをクリア'],['japanese-stage','国語のステージをクリア'],
 ['math-challenge','算数のチャレンジ問題をクリア'],['japanese-challenge','国語のチャレンジ問題をクリア'],
 ['math-print','算数のチャレンジ問題を印刷する'],['japanese-print','国語のチャレンジ問題を印刷する'],
 ['math-subquest','算数のサブクエストをクリア'],['japanese-subquest','国語のサブクエストをクリア']
].map(([id,name])=>({id,name})));
export const DAILY_MILESTONES=Object.freeze([{id:'milestone-2',count:2,gold:0,items:[{kind:'item',id:'cost_seed',count:1}]},{id:'milestone-4',count:4,gold:1000,items:[]},{id:'milestone-6',count:6,gold:0,items:[{kind:'ticket',id:'equip-ten-ticket',count:1}]},{id:'all',count:8,gold:0,items:[{kind:'ticket',id:'skin-ticket',count:1}]}]);
let serverOffset=0;
export function syncChallengeClock(now){if(Number.isFinite(now))serverOffset=now-Date.now();}
export function loginBonusDay(now=Date.now()+serverOffset){return new Date(now+9*3600000).toISOString().slice(0,10);}
function validDay(day){if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(Date.parse(day))||new Date(day).toISOString().slice(0,10)!==day)throw Error('invalid_bonus_day');}
export function challengeBonusStatus(game,day=loginBonusDay()){
 validDay(day);const state=game?.challengeBonus?.day===day?game.challengeBonus:{completed:[],claimed:[]};
 const completed=DAILY_CHALLENGES.filter(q=>state.completed?.includes(q.id)).map(q=>q.id);
 return {day,completed,claimed:state.claimed||[],allComplete:completed.length===DAILY_CHALLENGES.length};
}
export function recordChallengeClear(game,id,day=loginBonusDay()){
 if(!DAILY_CHALLENGES.some(q=>q.id===id))throw Error('invalid_challenge');
 const s=challengeBonusStatus(game,day);if(game.challengeBonus?.day>day||s.completed.includes(id))return false;
 game.challengeBonus={day,completed:[...s.completed,id],claimed:s.claimed};return true;
}
export function claimChallengeBonus(game,id,day=loginBonusDay()){
 const s=challengeBonusStatus(game,day),q=DAILY_MILESTONES.find(q=>q.id===id);
 if(!q||s.claimed.includes(id)||s.completed.length<q.count)return null;
 const gift={id:`challenge-bonus:${day}:${id}`,gold:q.gold,items:structuredClone(q.items)};
 if(!applyGiftPayload(game,gift))return null;
 game.challengeBonus={day,completed:s.completed,claimed:[...s.claimed,id]};return gift;
}
