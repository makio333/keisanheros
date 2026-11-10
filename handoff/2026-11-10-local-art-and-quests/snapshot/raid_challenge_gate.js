export function raidChallengeAvailability({syncStatus='idle',isTestMode=false,hasTicket=false,bossActive=true,busy=false}={}){
  if(busy)return{enabled:false,reason:'busy'};
  if(!bossActive)return{enabled:false,reason:'boss-defeated'};
  if(!isTestMode&&syncStatus!=='ready')return{enabled:false,reason:'sync-unavailable'};
  return{enabled:true,reason:null};
}

export function canReuseRaidChallengeSnapshot({syncStatus='idle',lastSyncedAt=0,now=Date.now(),pendingEvents=0,maxAgeMs=30000}={}){
  return syncStatus==='ready'
    && Number.isFinite(lastSyncedAt)
    && lastSyncedAt>0
    && now>=lastSyncedAt
    && now-lastSyncedAt<=maxAgeMs
    && pendingEvents===0;
}

export function createRaidChallengeStartGate(){
  let busy=false;
  return{
    get busy(){return busy;},
    async begin({canStart,syncState,start}){
      if(busy||!canStart())return false;
      busy=true;
      try{
        await syncState();
        if(!canStart())return false;
        return await start()!==false;
      }finally{busy=false;}
    },
  };
}
