export function installAccountGameAPIs(transport,{target=window,pollMs=1000}={}){
  const call=(api,method,args)=>transport.callGameAPI(api,method,args);
  const preserve=async(key,state)=>{if(state)await transport.saveSlot(key,state);};
  const raid={
    async syncPlayer(key,_profile,progress={}){await preserve(key,progress.state);const {state,claimed,...record}=progress;return call('RaidBossAPI','syncPlayer',[key,null,record]);},
    async settleReward(key,boss,state){await preserve(key,state);return call('RaidBossAPI','settleReward',[key,boss]);},
    getRankings:boss=>call('RaidBossAPI','getRankings',[boss]),
    getHistory:()=>call('RaidBossAPI','getHistory',[]),
    getGlobalBoss:()=>call('RaidBossAPI','getGlobalBoss',[]),
    receiveCheers:key=>call('RaidBossAPI','receiveCheers',[key]),
    sendCheer:(key,other,day)=>call('RaidBossAPI','sendCheer',[key,other,day]),
    watchBoss(onChange,onError){
      let stopped=false,busy=false,previous=null;
      const poll=async()=>{if(stopped || busy)return;busy=true;try{const value=JSON.stringify(await raid.getGlobalBoss());if(!stopped && value!==previous){previous=value;onChange();}}catch(error){if(!stopped)onError?.(error);}finally{busy=false;}};
      const timer=setInterval(poll,pollMs);poll();return()=>{stopped=true;clearInterval(timer);};
    },
  };
  const event={
    recordBest:(id,key,record)=>call('EventRaidAPI','recordBest',[id,key,record]),
    getRankings:id=>call('EventRaidAPI','getRankings',[id]),
    finalizeRankings:id=>call('EventRaidAPI','finalizeRankings',[id]),
    async claimFinalReward(id,key,state){await preserve(key,state);return call('EventRaidAPI','claimFinalReward',[id,key]);},
  };
  const gifts={
    send:(targets,gift)=>call('AdminGiftAPI','send',[targets,gift]),
    fetchPending:key=>call('AdminGiftAPI','fetchPending',[key]),
    claim:id=>call('AdminGiftAPI','claim',[id]),
    async claimToSave(id,key,state){await preserve(key,state);return call('AdminGiftAPI','claimToSave',[id,key]);},
    listRecent:count=>call('AdminGiftAPI','listRecent',[count]),
    listTargets:()=>call('AdminGiftAPI','listTargets',[]),
    permissions:()=>call('AdminGiftAPI','permissions',[]),
  };
  Object.assign(target,{RaidBossAPI:raid,EventRaidAPI:event,AdminGiftAPI:gifts});
  return {RaidBossAPI:raid,EventRaidAPI:event,AdminGiftAPI:gifts};
}
