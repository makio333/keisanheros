using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
namespace LegendHeroes
{
    public static class WebSaveCodec
    {
        public static PlayerSave Import(string json,Content data,string slot="")
        {
            var root=WireJson.Object(json);if(root.Get("gameData") is string wrapped)root=WireJson.Object(wrapped);root.Remove("unityStateJson");var p=root.Map("player");if(p.Count==0)throw new FormatException("プレイヤー情報がありません。");
            var save=new PlayerSave{isTestMode=root.Bool("isTestMode"),avatarHolographic=root.Bool("avatarHolographic"),backgroundHolographic=root.Bool("avatarBackgroundHolographic"),playerName=root.Str("playerName","ぼうけんしゃ"),avatar=root.Str("avatar",data.avatars[0].id),background=root.Str("avatarBackground","default"),frame=root.Str("avatarDecoration"),slotKey=slot,level=Math.Max(1,p.Int("lvl",1)),exp=p.Int("exp"),gold=p.Int("gold"),hp=p.Int("hp",30),mp=p.Int("mp",10),points=p.Int("points"),costPlus=p.Int("costPlus"),baseHp=p.Int("maxHp",30),baseMp=p.Int("maxMp",10),baseAtk=p.Int("atk",5),baseDef=p.Int("def",3),baseSpd=p.Int("spd",6),nextUid=root.Int("nextUid",2),webSourceJson=WireJson.Stringify(root)};
            // Web stores the allocated gains in the base-looking fields. Split them once.
            save.allocatedHp=Math.Max(0,(save.baseHp-(30+4*(save.level-1)))/6)*6;
            save.allocatedMp=Math.Max(0,(save.baseMp-(10+2*(save.level-1)))/4)*4;
            save.allocatedAtk=Math.Max(0,save.baseAtk-5);save.allocatedDef=Math.Max(0,save.baseDef-3);save.allocatedSpd=Math.Max(0,save.baseSpd-6);
            save.baseHp-=save.allocatedHp;save.baseMp-=save.allocatedMp;save.baseAtk-=save.allocatedAtk;save.baseDef-=save.allocatedDef;save.baseSpd-=save.allocatedSpd;
            save.owned.Clear();foreach(var raw in root.List("ownedEquips").OfType<Dictionary<string,object>>()){string id=raw.Str("id");var e=new OwnedEquipment{uid=raw.Int("uid"),id=id,rarity=raw.Int("rarity",1),ability=raw.Str("ability",data.Equip(id)?.ability)};save.ownedEquips.Add(e);if(!save.owned.Contains(id))save.owned.Add(id);}
            var eq=root.Map("equipment");save.weaponUid=eq.Map("weapon").Int("uid");save.armorUid=eq.Map("armor").Int("uid");save.accessoryUid=eq.Map("accessory").Int("uid");save.weapon=save.Owned(save.weaponUid)?.id??"";save.armor=save.Owned(save.armorUid)?.id??"";save.accessory=save.Owned(save.accessoryUid)?.id??"";
            foreach(var raw in root.List("items").OfType<Dictionary<string,object>>())save.AddItem(raw.Str("id"),raw.Int("count"));
            save.skins=root.List("unlockedSkins").OfType<string>().ToList();save.backgrounds=root.List("unlockedAvatarBackgrounds").OfType<string>().ToList();save.frames=root.List("unlockedDecorations").OfType<string>().ToList();save.holoSkins=root.List("holographicSkins").OfType<string>().ToList();save.holoBackgrounds=root.List("holographicAvatarBackgrounds").OfType<string>().ToList();
            save.raidCoins=root.Int("raidCoins");save.raidTickets=root.Int("raidTickets");save.halloweenCandy=root.Int("halloweenCandy");save.halloweenTickets=root.Int("halloweenTickets");save.skinGachaTickets=root.Int("skinGachaTickets");save.equipGachaTenPullTickets=root.Int("equipGachaTenPullTickets");save.questMedals=root.Int("questMedals");
            foreach(var kv in root.Map("stageClearCounts")){if(kv.Value is List<object> counts)for(int i=0;i<counts.Count;i++)save.clears.Add(new ClearRecord{key=kv.Key+":"+i,count=Convert.ToInt32(counts[i])});}
            foreach(var kv in root.Map("stageTotalClears"))if(kv.Value is List<object> counts)for(int i=0;i<counts.Count;i++){string key=kv.Key+":"+i;var record=save.clears.Find(c=>c.key==key);if(record==null)save.clears.Add(new ClearRecord{key=key,count=Convert.ToInt32(counts[i])});else record.count=Math.Max(record.count,Convert.ToInt32(counts[i]));}
            foreach(var kv in root.Map("areaBossClearCounts"))save.clears.Add(new ClearRecord{key=kv.Key+":boss",count=Convert.ToInt32(kv.Value)});
            foreach(var kv in root.Map("areaBossTotalClears")){string key=kv.Key+":boss";var record=save.clears.Find(c=>c.key==key);if(record==null)save.clears.Add(new ClearRecord{key=key,count=Convert.ToInt32(kv.Value)});else record.count=Math.Max(record.count,Convert.ToInt32(kv.Value));}
            foreach(var kv in root.Map("skills")){var st=kv.Value as Dictionary<string,object>;if(st!=null)save.skills.Add(new LearnedSkill{id=kv.Key,progress=st.Int("progress"),learned=st.Int("level")>=1||st.Bool("mastered")});}
            foreach(var id in root.List("claimedAdminGiftIds").OfType<string>())save.claims.Add("gift:"+id);
            foreach(var id in root.List("raidExchangeClaims").OfType<string>())save.claims.Add("raid:"+id);
            save.recalledGifts=root.List("recalledAdminGiftIds").OfType<string>().ToList();foreach(var kv in root.Map("giftRecallDebts"))save.giftDebts.Add(new GiftDebt{id=kv.Key,gold=Convert.ToInt32(kv.Value)});
            if(root.Get("questBoard")!=null)save.quests=JsonUtility.FromJson<QuestEnvelope>("{\"quests\":"+WireJson.Stringify(root.List("questBoard"))+"}").quests;
            foreach(var kv in root.Map("questMedalExchanged"))if(kv.Value is bool claimed&&claimed)save.claims.Add("quest:"+kv.Key);
            foreach(var kv in root.Map("stageDropOpportunities"))save.dropOpportunities.Add(new ClearRecord{key=kv.Key,count=Convert.ToInt32(kv.Value)});
            foreach(var kv in root.Map("areaBossLevel"))save.bossLevels.Add(new ClearRecord{key=kv.Key,count=Convert.ToInt32(kv.Value)});
            foreach(string id in root.List("rescued").OfType<string>())save.claims.Add("rescue:"+id);
            save.study=StudyCodec.Import(root.Map("studyStats"));save.currentRaidBossId=root.Str("legendCurrentRaidBossId","boss_50");
            if(root.Get("pickup")!=null)save.pickup=JsonUtility.FromJson<PickupStage>(WireJson.Stringify(root.Map("pickup")));
            foreach(var kv in root.Map("raidLearning")){var row=kv.Value as Dictionary<string,object>;if(row!=null)save.raidLearning.Add(new StudyRow{key=kv.Key,label=row.Str("label",kv.Key),total=row.Int("attempts"),correct=row.Int("correct")});}
            ImportEvent(root,save);
            var extension=root.Map("legendUnity");
            foreach(string claim in extension.List("claims").OfType<string>())if(!save.claims.Contains(claim))save.claims.Add(claim);
            if(extension.Count>0){var native=JsonUtility.FromJson<NativeExtension>(WireJson.Stringify(extension));save.prints=native.prints??save.prints;save.pendingRuns=native.pendingRuns??save.pendingRuns;}
            PrintCodec.Import(root,save,data);
            foreach(string target in root.Map("cheerHistory").List("targets").OfType<string>())save.claims.Add("cheer:"+root.Map("cheerHistory").Str("date")+":"+target);
            save.updatedAt=root.Long("updatedAt");save.cloudRevision=save.updatedAt;save.Normalize(data);return save;
        }
        public static string Export(PlayerSave s)
        {
            var root=string.IsNullOrEmpty(s.webSourceJson)?new Dictionary<string,object>():WireJson.Object(s.webSourceJson);var p=root.Map("player");
            root["isTestMode"]=s.isTestMode;root["avatarHolographic"]=s.avatarHolographic;root["avatarBackgroundHolographic"]=s.backgroundHolographic;
            p["lvl"]=s.level;p["exp"]=s.exp;p["gold"]=s.gold;p["hp"]=s.hp;p["mp"]=s.mp;p["maxHp"]=s.baseHp+s.allocatedHp;p["maxMp"]=s.baseMp+s.allocatedMp;p["atk"]=s.baseAtk+s.allocatedAtk;p["def"]=s.baseDef+s.allocatedDef;p["spd"]=s.baseSpd+s.allocatedSpd;p["points"]=s.points;p["costPlus"]=s.costPlus;
            root["player"]=p;root["playerName"]=s.playerName;root["avatar"]=s.avatar;root["avatarBackground"]=s.background;root["avatarDecoration"]=s.frame;root["updatedAt"]=DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();root["lastPlayedAt"]=root["updatedAt"];root["nextUid"]=s.nextUid;
            var originals=root.List("ownedEquips").OfType<Dictionary<string,object>>().GroupBy(e=>e.Int("uid")).ToDictionary(g=>g.Key,g=>g.First());
            root["ownedEquips"]=s.ownedEquips.Select(e=>{var entry=originals.TryGetValue(e.uid,out var original)?new Dictionary<string,object>(original):new Dictionary<string,object>();entry["uid"]=e.uid;entry["id"]=e.id;entry["rarity"]=e.rarity;entry["ability"]=e.ability;return (object)entry;}).ToList();
            root["equipment"]=new Dictionary<string,object>{{"weapon",s.weaponUid>0?(object)new Dictionary<string,object>{{"uid",s.weaponUid}}:null},{"armor",s.armorUid>0?(object)new Dictionary<string,object>{{"uid",s.armorUid}}:null},{"accessory",s.accessoryUid>0?(object)new Dictionary<string,object>{{"uid",s.accessoryUid}}:null}};
            root["items"]=s.items.Select((e,i)=>(object)new Dictionary<string,object>{{"uid",s.nextUid+i},{"id",e.id},{"count",e.count},{"rarity",1}}).ToList();root["nextUid"]=s.nextUid+s.items.Count;root["unlockedSkins"]=s.skins;root["unlockedAvatarBackgrounds"]=s.backgrounds;root["unlockedDecorations"]=s.frames;root["holographicSkins"]=s.holoSkins;root["holographicAvatarBackgrounds"]=s.holoBackgrounds;
            foreach(var kv in new Dictionary<string,int>{{"raidCoins",s.raidCoins},{"raidTickets",s.raidTickets},{"halloweenCandy",s.halloweenCandy},{"halloweenTickets",s.halloweenTickets},{"skinGachaTickets",s.skinGachaTickets},{"equipGachaTenPullTickets",s.equipGachaTenPullTickets},{"questMedals",s.questMedals}})root[kv.Key]=kv.Value;
            root["claimedAdminGiftIds"]=s.claims.Where(c=>c.StartsWith("gift:")).Select(c=>c.Substring(5)).ToList();root["raidExchangeClaims"]=s.claims.Where(c=>c.StartsWith("raid:")).Select(c=>c.Substring(5)).ToList();
            var stages=root.Map("stageClearCounts");var totals=root.Map("stageTotalClears");foreach(var group in s.clears.Where(c=>!c.key.EndsWith(":boss")).GroupBy(c=>c.key.Split(':')[0])){int max=group.Max(c=>int.Parse(c.key.Split(':')[1]));var list=Enumerable.Repeat<object>(0,max+1).ToList();foreach(var c in group)list[int.Parse(c.key.Split(':')[1])]=c.count;totals[group.Key]=list;stages[group.Key]=list.Select(n=>(object)Math.Min(3,Convert.ToInt32(n))).ToList();}root["stageClearCounts"]=stages;root["stageTotalClears"]=totals;
            var bossStars=root.Map("areaBossClearCounts");var bossTotals=root.Map("areaBossTotalClears");foreach(var c in s.clears.Where(c=>c.key.EndsWith(":boss"))){string id=c.key.Split(':')[0];bossStars[id]=Math.Min(3,c.count);bossTotals[id]=c.count;}root["areaBossClearCounts"]=bossStars;root["areaBossTotalClears"]=bossTotals;
            root["skills"]=s.skills.ToDictionary(x=>x.id,x=>(object)new Dictionary<string,object>{{"level",x.learned?1:0},{"progress",x.progress},{"mastered",x.learned}});
            root["recalledAdminGiftIds"]=s.recalledGifts;root["giftRecallDebts"]=s.giftDebts.ToDictionary(e=>e.id,e=>(object)e.gold);
            root["questBoard"]=WireJson.Object(JsonUtility.ToJson(new QuestEnvelope{quests=s.quests})).Get("quests");root["questMedalExchanged"]=s.claims.Where(c=>c.StartsWith("quest:")).ToDictionary(c=>c.Substring(6),c=>(object)true);
            var rewardClaims=root.Map("stageRewardClaims");foreach(var c in s.clears){var claim=rewardClaims.Map(c.key);claim["rewardFirst"]=c.count>=1;claim["rewardThird"]=c.count>=3;rewardClaims[c.key]=claim;}root["stageRewardClaims"]=rewardClaims;
            root["stageDropOpportunities"]=s.dropOpportunities.ToDictionary(c=>c.key,c=>(object)c.count);
            var levels=root.Map("areaBossLevel");foreach(var level in s.bossLevels)levels[level.key]=level.count;root["areaBossLevel"]=levels;root["rescued"]=s.claims.Where(c=>c.StartsWith("rescue:")).Select(c=>c.Substring(7)).Distinct().ToList();
            root["legendCurrentRaidBossId"]=s.currentRaidBossId;root["pickup"]=s.pickup==null?null:WireJson.Object(JsonUtility.ToJson(s.pickup));
            var learning=root.Map("raidLearning");foreach(var row in s.raidLearning){var value=learning.Map(row.key);value["label"]=row.label;value["attempts"]=row.total;value["correct"]=row.correct;value["wrong"]=row.total-row.correct;learning[row.key]=value;}root["raidLearning"]=learning;
            root["studyStats"]=StudyCodec.Export(s.study,root.Map("studyStats"));
            ExportEvent(root,s);
            string cheerDay=DateTimeOffset.UtcNow.UtcDateTime.ToString("yyyy-MM-dd"),cheerPrefix="cheer:"+cheerDay+":";root["cheerHistory"]=new Dictionary<string,object>{{"date",cheerDay},{"targets",s.claims.Where(c=>c.StartsWith(cheerPrefix)).Select(c=>c.Substring(cheerPrefix.Length)).ToList()}};
            PrintCodec.Export(root,s);
            root["legendUnity"]=WireJson.Object(JsonUtility.ToJson(new NativeExtension{claims=s.claims,prints=s.prints,pendingRuns=s.pendingRuns}));
            return WireJson.Stringify(root);
        }
        [Serializable] sealed class QuestEnvelope { public System.Collections.Generic.List<StoryQuest> quests; }
        [Serializable] sealed class NativeExtension { public System.Collections.Generic.List<string> claims;public System.Collections.Generic.List<PrintSheet> prints;public System.Collections.Generic.List<PendingRaidEvent> pendingRuns; }
        static void ImportEvent(Dictionary<string,object> root,PlayerSave s)
        {
            var e=root.Map("halloweenEvent").Map("halloween_2026");s.halloweenClears=e.Int("clears");string[] stages={"candy-path","moon-square","night-party"};for(int i=0;i<3;i++)s.season2Clears[i]=e.Map("season2StageClears").Int(stages[i]);
            foreach(string id in e.List("collectedPrizes").OfType<string>())s.claims.Add("halloween:"+id);
            var math=e.Map("raid");var kanji=e.Map("kanjiRaid");s.eventBest=math.Int("bestKills");s.eventTotal=math.Int("totalKills");s.raidLastStage=math.Int("lastKanjiStage");s.kanjiEventBest=kanji.Int("bestKills");s.kanjiEventTotal=kanji.Int("totalKills");s.kanjiRaidLastStage=kanji.Int("lastKanjiStage");
            foreach(var state in new[]{math,kanji})
            {
                foreach(var kv in state.Map("rewardClaims"))if(kv.Key.StartsWith("participation:")&&Convert.ToInt32(kv.Value)>=2)s.claims.Add(kv.Key);
                foreach(var kv in state.Map("bonusClaims"))if(kv.Value is bool paid&&paid&&kv.Key.StartsWith("breakthrough:"))s.claims.Add("bonus:"+kv.Key.Substring(13));
            }
            if(e.Bool("firstClearClaimed"))s.claims.Add("halloween:first-clear");
        }
        static void ExportEvent(Dictionary<string,object> root,PlayerSave s)
        {
            var events=root.Map("halloweenEvent");var e=events.Map("halloween_2026");e["clears"]=s.halloweenClears;e["season2StageClears"]=new Dictionary<string,object>{{"candy-path",s.season2Clears[0]},{"moon-square",s.season2Clears[1]},{"night-party",s.season2Clears[2]}};e["collectedPrizes"]=s.claims.Where(c=>c.StartsWith("halloween:")&&c!="halloween:first-clear").Select(c=>c.Substring(10)).ToList();e["firstClearClaimed"]=s.claims.Contains("halloween:first-clear");
            foreach(bool kanji in new[]{false,true})
            {
                string key=kanji?"kanjiRaid":"raid";var state=e.Map(key);state["bestKills"]=kanji?s.kanjiEventBest:s.eventBest;state["totalKills"]=kanji?s.kanjiEventTotal:s.eventTotal;state["lastKanjiStage"]=kanji?s.kanjiRaidLastStage:s.raidLastStage;
                var rewards=state.Map("rewardClaims");var bonuses=state.Map("bonusClaims");
                foreach(string claim in s.claims)if(claim.StartsWith("participation:"))rewards[claim]=2;else if(claim.StartsWith("bonus:")){string n=claim.Substring(6);bonuses["breakthrough:"+n]=true;var row=EventCandy(int.Parse(n));rewards["kills:"+n]=Math.Max(row,rewards.Int("kills:"+n));}
                state["rewardClaims"]=rewards;state["bonusClaims"]=bonuses;e[key]=state;
            }
            events["halloween_2026"]=e;root["halloweenEvent"]=events;
        }
        static int EventCandy(int kills)=>kills==5?5:kills==10?10:kills==20?20:kills==30?30:kills==50?50:0;
    }
}
