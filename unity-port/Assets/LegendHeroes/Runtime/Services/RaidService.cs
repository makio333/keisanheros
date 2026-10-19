using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
namespace LegendHeroes
{
    [Serializable] public class PendingRaidEvent { public string id,bossId,mode;public int damage,kills;public long startedAt,finishedAt; }
    public sealed class RaidService
    {
        readonly FirestoreService cloud;readonly Content catalog;public RaidService(FirestoreService service,Content content=null){cloud=service;catalog=content;}
        public static List<Dictionary<string,object>> RankingRows(Dictionary<string,object> history)
        {
            var result=new List<Dictionary<string,object>>();
            foreach(object raw in history.List("finalRankings"))
            {
                if(raw is Dictionary<string,object> row){result.Add(row);continue;}
                if(raw is List<object> pair&&pair.Count>=2)
                {
                    var entry=pair[1] is Dictionary<string,object> details?new Dictionary<string,object>(details):new Dictionary<string,object>{{"totalDamage",pair[1]}};
                    entry["slotKey"]=Convert.ToString(pair[0]);result.Add(entry);
                }
            }
            return result;
        }
        public static Dictionary<string,object> Profile(PlayerSave s,Content data=null)
        {
            var equipment=new Dictionary<string,object>();
            foreach(string slot in new[]{"weapon","armor","accessory"})
            {
                var item=s.Owned(slot=="weapon"?s.weaponUid:slot=="armor"?s.armorUid:s.accessoryUid);if(item==null)continue;var def=data?.Equip(item.id);
                var stats=new Dictionary<string,object>();if(def!=null)foreach(string key in new[]{"atk","def","hp","mp","spd"})stats[key]=(int)Math.Floor(Convert.ToDouble(typeof(Stats).GetField(key).GetValue(def.stat))*PlayerSave.RarityMultiplier(item.rarity));
                equipment[slot]=new Dictionary<string,object>{{"id",item.id},{"uid",item.uid},{"rarity",item.rarity},{"ability",item.ability},{"name",def?.name??item.id},{"emoji",def?.image??""},{"cost",def?.cost??0},{"stat",stats}};
            }
            return new Dictionary<string,object>{{"slotKey",s.slotKey},{"playerName",s.playerName},{"avatar",s.avatar},{"avatarBackground",s.background},{"avatarDecoration",s.frame},{"avatarHolographic",s.avatarHolographic},{"avatarBackgroundHolographic",s.backgroundHolographic},{"level",s.level},{"participated",true},{"equipment",equipment}};
        }
        public async Task<Dictionary<string,object>> Submit(PlayerSave save,PendingRaidEvent run)
        {
            if(save.isTestMode)return new Dictionary<string,object>{{"test",true}};
            for(int attempt=0;attempt<4;attempt++)
            {
                var global=await cloud.Get("raidGlobal/currentBoss");var g=global.data;string boss=g.Str("bossId","boss_50");if(boss!=run.bossId)return g;
                var rank=await cloud.Get("raidRankings_"+boss+"/"+FirestoreService.SlotId(save.slotKey));var processed=rank.data.Map("appliedEvents");if(processed.Bool(run.id))return g;
                long now=DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),defeated=g.Long("defeatedAt"),settles=g.Long("settlesAt");bool accepts=g.Long("finalizedAt")==0&&(defeated==0||now<=settles&&run.startedAt<=defeated);if(!accepts)return g;
                processed[run.id]=true;int damage=Math.Max(0,run.damage);foreach(var p in Profile(save,catalog))rank.data[p.Key]=p.Value;rank.data["totalDamage"]=rank.data.Int("totalDamage")+damage;rank.data["appliedEvents"]=processed;rank.data["excludedFromRanking"]=false;rank.data["lastUpdated"]=now;
                int total=g.Int("totalDamageDealt")+damage;g["totalDamageDealt"]=total;if(defeated==0&&total>=g.Int("maxHp",1000)){g["defeatedAt"]=now;g["settlesAt"]=now+60000;var finishers=g.List("finisherSlotKeys");if(!finishers.Contains(save.slotKey))finishers.Add(save.slotKey);g["finisherSlotKeys"]=finishers;}
                var count=await cloud.Get("raidClaims/"+FirestoreService.SlotId(save.slotKey)+"_challenge_count");count.data["challengeCount"]=count.data.Int("challengeCount")+1;
                var writes=new List<CloudDocument>{global,rank,count};
                var second=await cloud.Get("raidClaims/"+FirestoreService.SlotId(save.slotKey)+"_challenge2");
                var third=await cloud.Get("raidClaims/"+FirestoreService.SlotId(save.slotKey)+"_challenge3");
                bool awardTen=count.data.Int("challengeCount")>=2&&!second.exists;
                bool awardSkin=count.data.Int("challengeCount")>=3&&!third.exists;
                PlayerSave copy=null;
                if(awardTen||awardSkin)
                {
                    var saved=await cloud.Get(FirestoreService.SlotDocument(save.slotKey));
                    if(saved.exists&&saved.data.Long("updatedAt")!=save.cloudRevision)throw new InvalidOperationException("クラウドが更新されています。読み込み直してから同期してください。");
                    copy=UnityEngine.JsonUtility.FromJson<PlayerSave>(UnityEngine.JsonUtility.ToJson(save));
                    copy.equipGachaTenPullTickets+=awardTen?1:0;copy.skinGachaTickets+=awardSkin?1:0;
                    copy.updatedAt=DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();saved.data=FirestoreService.SavePayload(copy);writes.Add(saved);
                    if(awardTen){second.data=new Dictionary<string,object>{{"claimedAt",now},{"applied",true}};writes.Add(second);}
                    if(awardSkin){third.data=new Dictionary<string,object>{{"claimedAt",now},{"applied",true}};writes.Add(third);}
                }
                try
                {
                    await cloud.Commit(writes.ToArray());
                    if(copy!=null){save.equipGachaTenPullTickets=copy.equipGachaTenPullTickets;save.skinGachaTickets=copy.skinGachaTickets;save.updatedAt=save.cloudRevision=copy.updatedAt;}
                    return g;
                }
                catch(InvalidOperationException){if(attempt==3)throw;}
            }throw new InvalidOperationException("ランキング更新が競合しました。再同期してください。");
        }
        public async Task<Dictionary<string,object>> Refresh()
        {
            var global=await cloud.Get("raidGlobal/currentBoss");if(!global.exists)throw new InvalidOperationException("レイドボスがまだありません。");var g=global.data;long now=DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            if(g.Long("defeatedAt")>0&&g.Long("finalizedAt")==0&&now>=g.Long("settlesAt"))
            {
                var ranks=(await cloud.List("raidRankings_"+g.Str("bossId"))).Where(r=>!r.data.Bool("excludedFromRanking")&&(r.data.Bool("participated")||r.data.Int("totalDamage")>0)).OrderByDescending(r=>r.data.Int("totalDamage")).ThenBy(r=>r.data.Str("slotKey"),StringComparer.Ordinal).Select(r=>(object)r.data).ToList();g["finalRankings"]=ranks;g["finalizedAt"]=now;g["startsAt"]=now;await cloud.Commit(global);
            }
            else if(g.Long("finalizedAt")>0&&now>=g.Long("startsAt"))
            {
                string id=g.Str("bossId");var history=await cloud.Get("raidHistory/"+id);history.data=new Dictionary<string,object>(g);int level=g.Int("bossLevel",50)+10;global.data=new Dictionary<string,object>{{"bossId","boss_"+level},{"bossLevel",level},{"maxHp",1000+(level-50)*100},{"totalDamageDealt",0},{"defeatedAt",null},{"settlesAt",null},{"finalizedAt",null},{"startsAt",null}};await cloud.Commit(global,history);return global.data;
            }return g;
        }
        public async Task<PlayerSave> ClaimRank(Content data,PlayerSave save,string bossId)
        {
            if(save.isTestMode)return null;
            var global=await cloud.Get("raidGlobal/currentBoss");var history=global.data.Str("bossId")==bossId&&global.data.Long("finalizedAt")>0?global:await cloud.Get("raidHistory/"+bossId);if(history.data.Long("finalizedAt")==0)return null;
            var rows=RankingRows(history.data);int rank=rows.FindIndex(r=>r.Str("slotKey")==save.slotKey)+1;if(rank<=0)return null;
            var claim=await cloud.Get("raidClaims/"+FirestoreService.SlotId(save.slotKey)+"_"+bossId);var coins=await cloud.Get("raidCoinRankClaims/"+FirestoreService.SlotId(save.slotKey)+"_"+bossId);if(claim.exists&&coins.exists)return null;
            var saved=await cloud.Get(FirestoreService.SlotDocument(save.slotKey));if(saved.exists&&saved.data.Long("updatedAt")!=save.cloudRevision)throw new InvalidOperationException("クラウドが更新されています。読み込み直してから報酬を受け取ってください。");var copy=UnityEngine.JsonUtility.FromJson<PlayerSave>(UnityEngine.JsonUtility.ToJson(save));
            int coinAward=coins.exists?0:EconomyRules.RankCoins(rank);copy.raidCoins+=coinAward;
            if(!claim.exists){int gold=rank==1?5000:rank==2?3000:rank==3?2000:rank<=10?1000:500;int seeds=rank<=3?3:1,tickets=rank<=3?1:0;if(history.data.List("finisherSlotKeys").Contains(save.slotKey))tickets++;copy.gold+=gold;copy.AddItem("cost_seed",seeds);copy.skinGachaTickets+=tickets;claim.data=new Dictionary<string,object>{{"claimedAt",DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()},{"version",2},{"applied",true},{"rank",rank},{"payout",new Dictionary<string,object>{{"gold",gold},{"seeds",seeds},{"tickets",tickets},{"coins",coinAward}}}};}
            coins.data=new Dictionary<string,object>{{"coins",coinAward},{"rank",rank},{"claimedAt",DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}};copy.updatedAt=DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();saved.data=FirestoreService.SavePayload(copy);await cloud.Commit(new[]{saved}.Concat(claim.exists?new CloudDocument[0]:new[]{claim}).Concat(coins.exists?new CloudDocument[0]:new[]{coins}).ToArray());copy.cloudRevision=copy.updatedAt;return copy;
        }
        public async Task RecordEvent(PlayerSave s,PendingRaidEvent run)
        {
            if(s.isTestMode)return;
            long cutoff=new DateTimeOffset(2026,11,1,0,0,0,TimeSpan.FromHours(9)).ToUnixTimeMilliseconds();if(run.finishedAt>=cutoff)return;
            string id="halloween_2026_raid_v1"+(run.mode=="kanji"?"_kanji":"");
            for(int attempt=0;attempt<4;attempt++)
            {var rank=await cloud.Get("eventRaidRankings_"+id+"/"+FirestoreService.SlotId(s.slotKey));var claim=await cloud.Get("eventRaidClaims_"+id+"/"+FirestoreService.SlotId(s.slotKey));var processed=claim.data.Map("processedRuns");if(processed.Bool(run.id))return;processed[run.id]=true;int total=rank.data.Int("totalKills",rank.data.Int("bestKills"))+run.kills,best=Math.Max(run.kills,rank.data.Int("bestKills"));foreach(var p in Profile(s,catalog))rank.data[p.Key]=p.Value;rank.data["totalKills"]=total;rank.data["bestKills"]=best;rank.data["updatedAt"]=DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();claim.data["processedRuns"]=processed;
                var rewards=claim.data.Map("rewards");var bonuses=claim.data.Map("bonuses");
                foreach(string paid in s.claims)
                {
                    if(paid.StartsWith("participation:"))rewards[paid]=2;
                    if(paid.StartsWith("bonus:")){string n=paid.Substring(6);int k=int.Parse(n);rewards["kills:"+n]=k;bonuses["breakthrough:"+n]=new Dictionary<string,object>{{"kills",k},{"halloweenTickets",k==10||k==30||k==50?1:0},{"costSeeds",k==10?1:k==30?2:k==50?3:0},{"skinGachaTickets",k==20?1:0},{"equipGachaTenPullTickets",k==50?1:0}};}
                }
                claim.data["rewards"]=rewards;claim.data["bonuses"]=bonuses;try{await cloud.Commit(rank,claim);return;}catch(InvalidOperationException){if(attempt==3)throw;}}
        }
        public async Task<PlayerSave> ClaimEventFinal(Content data,PlayerSave s,bool kanji)
        {
            if(s.isTestMode)return null;
            if(DateTimeOffset.UtcNow<new DateTimeOffset(2026,11,1,0,0,0,TimeSpan.FromHours(9)))return null;string id="halloween_2026_raid_v1"+(kanji?"_kanji":""),path="eventRaidFinalResults/"+id;var final=await cloud.Get(path);
            if(!final.exists){var ranks=(await cloud.List("eventRaidRankings_"+id)).Select(d=>d.data).OrderByDescending(d=>d.Int("totalKills",d.Int("bestKills"))).ThenBy(d=>d.Str("slotKey"),StringComparer.Ordinal).ToList();final.data=new Dictionary<string,object>{{"rows",ranks},{"createdAt",DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}};await cloud.Commit(final);}
            var rows=final.data.List("rows").OfType<Dictionary<string,object>>().ToList();int index=rows.FindIndex(r=>r.Str("slotKey")==s.slotKey);if(index<0)return null;int score=rows[index].Int("totalKills",rows[index].Int("bestKills")),rank=rows.FindIndex(r=>r.Int("totalKills",r.Int("bestKills"))==score)+1;
            var claim=await cloud.Get("eventRaidFinalClaims_"+id+"/"+FirestoreService.SlotId(s.slotKey));if(claim.exists)return null;var saveDoc=await cloud.Get(FirestoreService.SlotDocument(s.slotKey));if(saveDoc.exists&&saveDoc.data.Long("updatedAt")!=s.cloudRevision)throw new InvalidOperationException("クラウドが更新されています。読み込み直してから報酬を受け取ってください。");var copy=UnityEngine.JsonUtility.FromJson<PlayerSave>(UnityEngine.JsonUtility.ToJson(s));var rewards=new List<GiftItem>{new GiftItem{kind="equip",id="halloween_rank_blade",rarity=3,count=1}};if(rank<=3)rewards.Add(new GiftItem{kind="decoration",id=new[]{"rank_gold","rank_silver","rank_bronze"}[rank-1],count=1});EconomyRules.ReceiveGift(data,copy,new Gift{id="halloween_2026_final",items=rewards.ToArray()});copy.updatedAt=DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();saveDoc.data=FirestoreService.SavePayload(copy);claim.data=new Dictionary<string,object>{{"rank",rank},{"claimedAt",copy.updatedAt}};await cloud.Commit(saveDoc,claim);copy.cloudRevision=copy.updatedAt;return copy;
        }
    }
}
