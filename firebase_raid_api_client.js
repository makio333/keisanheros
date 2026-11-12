const API_PATH='/api/raid-game';

export function installFirebaseRaidAPI({getIdToken,target=window,fetchImpl=fetch}){
  let activeKey='';
  async function call(method,args=[]){
    const response=await fetchImpl(API_PATH,{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json','Authorization':`Bearer ${await getIdToken()}`},body:JSON.stringify({method,args})});
    let payload;try{payload=await response.json();}catch{throw Error('raid_api_unavailable');}
    if(!response.ok)throw Error(payload?.error||'raid_api_unavailable');
    return payload.result;
  }
  const raid={
    syncPlayer:(key,profile,progress)=>{activeKey=key;return call('syncPlayer',[key,profile,progress]);},
    settleReward:(key,boss,state)=>{activeKey=key;return call('settleReward',[key,boss,state]);},
    getRankings:(boss)=>call('getRankings',[boss,activeKey]),
    getMonthlyRankings:(period)=>call('getMonthlyRankings',[period]),
    getHistory:()=>call('getHistory',[activeKey]),
    getGlobalBoss:()=>call('getGlobalBoss',[activeKey]),
    receiveCheers:(key,state)=>call('receiveCheers',[key,state]),
    sendCheer:(key,other,day)=>call('sendCheer',[key,other,day]),
    watchBoss(onChange,onError){
      let stopped=false,busy=false,previous='';
      const poll=async()=>{if(stopped||busy)return;busy=true;try{const next=JSON.stringify(await raid.getGlobalBoss());if(!stopped&&next!==previous){previous=next;onChange();}}catch(error){if(!stopped)onError?.(error);}finally{busy=false;}};
      let timer=null;
      const schedule=()=>{if(timer!==null)clearInterval(timer);timer=null;if(!stopped&&target.document?.visibilityState!=='hidden')timer=setInterval(poll,15000);};
      const onVisibility=()=>{schedule();if(target.document?.visibilityState!=='hidden')poll();};
      target.document?.addEventListener('visibilitychange',onVisibility);
      schedule();poll();return()=>{stopped=true;if(timer!==null)clearInterval(timer);target.document?.removeEventListener('visibilitychange',onVisibility);};
    },
  };
  target.RaidBossAPI=raid;return raid;
}
