import {applyGiftPayload} from './economy.js';
export const LOGIN_BONUS_REWARDS=Object.freeze([
 {gold:500,items:[]},
 {gold:0,items:[{kind:'ticket',id:'skin-ticket',count:1}]},
 {gold:1000,items:[]},
 {gold:0,items:[{kind:'ticket',id:'skin-ticket',count:1}]},
 {gold:1500,items:[]},
 {gold:0,items:[{kind:'ticket',id:'skin-ticket',count:1}]},
 {gold:0,items:[{kind:'ticket',id:'equip-ten-ticket',count:1}]},
]);
export function loginBonusDay(now=Date.now()){return new Date(now+9*60*60*1000).toISOString().slice(0,10);}
export function loginBonusStatus(game,day){
 if(typeof day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(Date.parse(day))||new Date(day).toISOString().slice(0,10)!==day)throw Error('invalid_bonus_day');
 const count=Number.isSafeInteger(game?.loginBonus?.count)&&game.loginBonus.count>0?game.loginBonus.count:0;
 const available=!game?.loginBonus?.lastDay||game.loginBonus.lastDay<day;
 const index=available?count%7:(Math.max(0,count-1)%7);
 return {available,index,count,reward:LOGIN_BONUS_REWARDS[index],day};
}
export function claimLoginBonus(game,day){
 const status=loginBonusStatus(game,day);if(!status.available)return null;
 const gift={id:'login-bonus:'+day,...structuredClone(status.reward)};
 if(!applyGiftPayload(game,gift))return null;
 game.loginBonus={count:status.count+1,lastDay:day};return gift;
}
