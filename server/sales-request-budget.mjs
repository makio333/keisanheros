// Process-local admission control; not a money cap, WAF, or durable fleet quota.
export function createSalesRequestBudget({maxPerMinute=600,maxInFlight=20,now=Date.now}={}){
  if(!Number.isInteger(maxPerMinute)||maxPerMinute<1||maxPerMinute>600||!Number.isInteger(maxInFlight)||maxInFlight<1||maxInFlight>20||typeof now!=='function')throw Error('sales_request_budget_invalid');
  let windowStart=null,count=0,inFlight=0;
  return Object.freeze({limits:Object.freeze({maxPerMinute,maxInFlight,scope:'process-local',spendingCap:false}),
    enter(){
      const time=now();if(!Number.isSafeInteger(time)||time<0)throw Error('sales_request_clock_invalid');
      if(windowStart===null||time-windowStart>=60000){windowStart=time;count=0;}
      if(inFlight>=maxInFlight||count>=maxPerMinute)return {allowed:false,retryAfterSeconds:Math.max(1,Math.ceil((60000-Math.max(0,time-windowStart))/1000))};
      count++;inFlight++;let released=false;
      return {allowed:true,release(){if(!released){released=true;inFlight--;}}};
    },
  });
}
