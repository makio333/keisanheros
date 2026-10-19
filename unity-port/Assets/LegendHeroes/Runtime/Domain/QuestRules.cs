using System;
using System.Collections.Generic;
using System.Linq;

namespace LegendHeroes
{
    [Serializable] public class QuestNpc { public string name,image; }
    [Serializable] public class StoryArc { public string family,title;public string[] parts; }
    [Serializable] public class QuestMilestone { public string key,kind,id,label;public int medals,count,rarity; }
    [Serializable] public class StoryQuest { public int uid,partIndex;public string title,tier;public QuestNpc npc;public Problem[] parts; }
    [Serializable] public class RewardSettings
    {
        public int thirdGoldBase=100,thirdGoldStep=50,thirdItemCount=3,firstWeaponRarity=2,bossFirstTickets=1,bossThirdTickets=1,bossLevelUp=1,bossGrowthPct=12;
        public int repeatThreshold=3,pickupBonusTickets=1,pickupBonusRaidTickets=2,pickupBonusGold=1000;
        public double dropMultItem=.5,dropMultEquip=.5,dropMultBlueprint=.4,dropMultTicket=.5,dropMultRaidTicket=1,frontierDropMult=2,pastStageDropMult=.1,repeatMult=.1,bossEquipDrop=0,bossBlueprintRate=.03;
        public string thirdItemId="hipotion";
    }
    public static class StageRewards
    {
        static readonly string[] MathOrder={"area1","area13","area2","area3","area4","area11","area12"};
        static readonly string[] LanguageOrder={"area14","area15","area5","area6","area7","area8","area9","area10"};
        public static int SuppliesGold(Content d,Area area,int index)
        {
            var settings=d.rewardSettings??new RewardSettings();
            if(area.id=="area14"||area.id=="area15")return BattleRun.Round((settings.thirdGoldBase+index*settings.thirdGoldStep)*.5);
            int ordinal=index;
            foreach(string id in LanguageOrder.Contains(area.id)?LanguageOrder:MathOrder){if(id==area.id)break;ordinal+=d.areas.First(a=>a.id==id).stages.Length;}
            return settings.thirdGoldBase+ordinal*settings.thirdGoldStep;
        }
        public static OwnedEquipment FirstWeapon(Content d,PlayerSave save,Area area,int index)
        {
            int rarity=area.id=="area14"||area.id=="area15"?1:Math.Max(1,Math.Min(4,(d.rewardSettings??new RewardSettings()).firstWeaponRarity));
            int budget=Math.Max(1,area.recLv+index),target=2+area.recLv+index*2;
            var choice=d.Equip("w1");double best=Math.Floor(choice.stat.atk*PlayerSave.RarityMultiplier(rarity));
            foreach(var e in d.equipment.Where(e=>e.pool=="standard"&&e.slot=="weapon"&&!e.assist))
            {double atk=Math.Floor(e.stat.atk*PlayerSave.RarityMultiplier(rarity));if(PlayerSave.EquipCost(e,rarity)<=budget&&atk<=target&&atk>best){choice=e;best=atk;}}
            return save.AddEquipment(d,choice.id,rarity);
        }
        public static List<RewardEntry> Clear(Content d,PlayerSave save,Area area,int index,bool boss)
        {
            var rewards=new List<RewardEntry>();
            string key=area.id+":"+(boss?"boss":index.ToString());save.Clear(key);int count=save.ClearCount(key);var settings=d.rewardSettings??new RewardSettings();
            if(boss)
            {
                if(count==1){save.skinGachaTickets+=settings.bossFirstTickets;RewardEntry.Add(rewards,"ticket","skin-ticket",settings.bossFirstTickets);}if(count==3){save.equipGachaTenPullTickets+=settings.bossThirdTickets;RewardEntry.Add(rewards,"ticket","equip-ten-ticket",settings.bossThirdTickets);}
                var level=save.bossLevels.FirstOrDefault(l=>l.key==area.id);if(level==null){level=new ClearRecord{key=area.id,count=count-1};save.bossLevels.Add(level);}level.count+=settings.bossLevelUp;
                string[] ids={"area1","area13","area2","area3","area4","area11","area12"},npcs={"baker_sara","farmer_tom","blacksmith_ken","fisherman_dan","merchant_lina","adventurer","wiseman_gondo"};int npc=Array.IndexOf(ids,area.id);
                if(npc>=0&&!save.claims.Contains("rescue:"+npcs[npc]))save.claims.Add("rescue:"+npcs[npc]);
                return rewards;
            }
            if(count==1){var weapon=FirstWeapon(d,save,area,index);RewardEntry.Add(rewards,"equip",weapon.id,1,weapon.rarity,weapon.ability);}
            if(count==3){save.gold+=SuppliesGold(d,area,index);bool kana=area.id=="area14"||area.id=="area15";save.AddItem(kana?"potion":settings.thirdItemId,kana?Math.Min(1,settings.thirdItemCount):settings.thirdItemCount);RewardEntry.Add(rewards,"item",kana?"potion":settings.thirdItemId,kana?Math.Min(1,settings.thirdItemCount):settings.thirdItemCount);}
            if(ReviewRules.Claim(d,save,area.id,index)){RewardEntry.Add(rewards,"ticket","equip-ten-ticket",settings.pickupBonusTickets);RewardEntry.Add(rewards,"ticket","raid-ticket",settings.pickupBonusRaidTickets);}
            return rewards;
        }
    }
    public static class QuestRules
    {
        static readonly string[] Families={"add","sub","mul","div"},AreaIds={"area1","area13","area2","area3"};
        public static void EnsureBoard(Content d,PlayerSave s,Random rng)
        {s.quests.RemoveAll(q=>q.parts==null||q.parts.Length!=3);while(s.quests.Count<6)s.quests.Add(Create(d,s,rng));}
        public static StoryQuest Create(Content d,PlayerSave s,Random rng)
        {
            int front=0;
            for(int i=0;i<4;i++)if(s.clears.Any(c=>c.key.StartsWith(AreaIds[i]+":")&&c.count>0))front=i;
            int family=front>0&&rng.NextDouble()<.4?rng.Next(front):front;
            var area=d.areas.First(a=>a.id==AreaIds[family]);
            int cleared=area.stages.Select((stage,index)=>s.ClearCount(area.id+":"+index)>0?1:0).Sum();
            int highest=family==front?Math.Min(5,Math.Max(1,(int)Math.Ceiling(cleared/(double)area.stages.Length*5))):5;
            int level=highest==1?1:rng.Next(highest-1,highest+1);string tier=Families[family]+level;
            var arcs=d.storyArcs.Where(a=>a.family==Families[family]).ToArray();var arc=arcs[rng.Next(arcs.Length)];var gen=new QuestionGenerator(d,rng);
            var parts=arc.parts.Select(template=>{var p=gen.Tier(tier);var numbers=p.text.Split(' ');p.text=template.Replace("{a}",numbers[0]).Replace("{b}",numbers[2]);return p;}).ToArray();
            return new StoryQuest{uid=s.nextUid++,title=arc.title,tier=tier,npc=d.questNpcs[rng.Next(d.questNpcs.Length)],parts=parts};
        }
        public static bool CompletePart(Content d,PlayerSave s,int uid,int expectedPart,string answer)
        {
            var q=s.quests.FirstOrDefault(x=>x.uid==uid);if(q==null||q.partIndex!=expectedPart||q.partIndex>=3||!q.parts[q.partIndex].Accepts(answer))return false;
            int level=q.tier[q.tier.Length-1]-'1',family=Array.IndexOf(Families,q.tier.Substring(0,q.tier.Length-1));
            var area=d.areas.First(a=>a.id==AreaIds[family]);int index=BattleRun.Round(level/4.0*(area.stages.Length-1));
            int total=StageRewards.SuppliesGold(d,area,index)+500,g1=BattleRun.Round(total*.2),g2=BattleRun.Round(total*.3);
            s.gold+=expectedPart==0?g1:expectedPart==1?g2:total-g1-g2;
            int exp=6+level*5;s.GrantExp(d,exp+(expectedPart==2?BattleRun.Round(exp*.5):0));s.questMedals++;
            if(expectedPart<2)s.AddItem(expectedPart==0?"potion":"herb");q.partIndex++;
            if(q.partIndex>=3)s.quests.Remove(q);return true;
        }
        public static bool ClaimMilestone(Content d,PlayerSave s,QuestMilestone m)
        {
            if(s.questMedals<m.medals||s.claims.Contains("quest:"+m.key))return false;
            if(m.kind=="item")s.AddItem(m.id,m.count);else if(m.kind=="equip-ticket")s.equipGachaTenPullTickets+=m.count;else if(m.kind=="skin-ticket")s.skinGachaTickets+=m.count;else EconomyRules.GrantPrize(d,s,new Prize{id=m.id,kind=m.kind,rarity=m.rarity});
            s.claims.Add("quest:"+m.key);return true;
        }
    }
}
