export const CHRISTMAS_SKIN_PICKUP_WEIGHT=1.5;
export const CHRISTMAS_EQUIPMENT_PICKUP_RATE=.20;
export const isChristmasPickup=p=>p.rewardSource==='christmas'||p.source==='christmas';
export function weightedPrizeRates(prizes){
 const total=prizes.reduce((n,p)=>n+(isChristmasPickup(p)?CHRISTMAS_SKIN_PICKUP_WEIGHT:1),0);
 return prizes.map(prize=>({prize,rate:(isChristmasPickup(prize)?CHRISTMAS_SKIN_PICKUP_WEIGHT:1)/total}));
}
export function pickChristmasPrize(prizes,random=Math.random){
 const rates=weightedPrizeRates(prizes);let cursor=random();
 for(const row of rates){cursor-=row.rate;if(cursor<0)return row.prize;}
 return rates.at(-1)?.prize;
}
