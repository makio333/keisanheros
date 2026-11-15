import {applyGiftPayload} from './economy.js';
export const DAILY_CHALLENGES=Object.freeze([
 ['math-stage','算数のステージをクリア'],['japanese-stage','国語のステージをクリア'],
 ['math-challenge','算数のチャレンジ問題をクリア'],['japanese-challenge','国語のチャレンジ問題をクリア'],
 ['math-print','算数のチャレンジ問題を印刷する'],['japanese-print','国語のチャレンジ問題を印刷する'],
 ['math-subquest','算数のサブクエストをクリア'],['japanese-subquest','国語のサブクエストをクリア']
].map(([id,name])=>({id,name,gold:500})));
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
 const s=challengeBonusStatus(game,day),q=DAILY_CHALLENGES.find(q=>q.id===id);
 if(s.claimed.includes(id)||!(id==='all'?s.allComplete:q&&s.completed.includes(id)))return null;
 const gift={id:`challenge-bonus:${day}:${id}`,gold:q?.gold||0,items:id==='all'?[{kind:'ticket',id:'skin-ticket',count:1}]:[]};
 if(!applyGiftPayload(game,gift))return null;
 game.challengeBonus={day,completed:s.completed,claimed:[...s.claimed,id]};return gift;
}
