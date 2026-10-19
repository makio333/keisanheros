using System;
using System.Linq;
namespace LegendHeroes
{
    public sealed class WorldRaidFight
    {
        public readonly PlayerSave save;public readonly Content data;public readonly string bossId;public readonly long startedAt;public readonly bool test;readonly Random random;readonly QuestionGenerator generator;readonly Area[] areas;
        public int damage,remaining,areaIndex,stageIndex,answers;public bool over;public Problem problem;
        public Skill selectedSkill;public string selectedItem;
        public int QuestionMilliseconds=>selectedSkill!=null||selectedItem!=null?12000:areas[areaIndex].stages[stageIndex].timeLimit;
        PendingRaidEvent settlement;
        public WorldRaidFight(Content d,PlayerSave s,string id,int hp,bool testing){data=d;save=s;bossId=id;save.currentRaidBossId=id;remaining=hp;test=testing;startedAt=DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();random=new Random();generator=new QuestionGenerator(d,random);areas=new[]{"area1","area13","area2","area3","area4","area11","area12","area14","area15"}.Select(key=>d.areas.First(a=>a.id==key)).ToArray();Next();}
        void Next()=>problem=generator.Stage(areas[areaIndex],stageIndex);
        public bool SelectSkill(string id)
        {
            var skill=data.skills.FirstOrDefault(s=>s.id==id);if(over||skill==null||!save.SkillState(id).learned||selectedSkill!=null||selectedItem!=null)return false;
            int cost=Math.Max(1,skill.mp-(save.HasAbility(data,"mp_save")?1:0));if(save.mp<cost)return false;
            save.mp-=cost;selectedSkill=skill;problem=generator.Tier(SkillRules.Tier(skill));return true;
        }
        public bool SelectItem(string id)
        {
            var item=data.items.FirstOrDefault(i=>i.id==id);if(over||item==null||selectedSkill!=null||selectedItem!=null||save.ItemCount(id)<=0||item.effect!="heal"&&item.effect!="mana")return false;
            if(item.effect=="heal"&&save.hp>=save.Stat(data,"hp")||item.effect=="mana"&&save.mp>=save.Stat(data,"mp"))return false;
            selectedItem=id;problem=generator.Tier(item.opTier);return true;
        }
        public bool Answer(string input)
        {
            if(over)return false;bool correct=problem.Accepts(input);answers++;if(!test){StudyRules.Record(save,problem,correct);ReviewRules.Record(save,areas[areaIndex],stageIndex,correct);}
            var skill=selectedSkill;string itemId=selectedItem;selectedSkill=null;selectedItem=null;
            if(correct)
            {
                if(itemId!=null)save.UseItem(data,itemId);
                else if(skill!=null&&skill.healPct>0)save.hp=Math.Min(save.Stat(data,"hp"),save.hp+BattleRun.Round(save.Stat(data,"hp")*skill.healPct));
                else
                {
                    int atk=BattleRun.Round(save.Stat(data,"atk")*(save.HasAbility(data,"power")?1.15:1));
                    double baseHit=skill!=null?Math.Max(1,atk*skill.dmgMult-(skill.ignoreDef?0:15)):save.HasAncient("anc_w1")?Math.Max(atk*.8*.3,atk*.8-15)*2:Math.Max(atk*.3,atk-15);
                    int hit=Math.Max(1,BattleRun.Round(baseHit*(1+areaIndex*.5+stageIndex*.1)));
                    if(random.NextDouble()<Math.Min(.95,BattleRun.SpeedRate(save.Stat(data,"spd"))+(save.HasAbility(data,"crit_up")?.1:0)+(save.HasAncient("anc_w3")?.3:0)))hit*=2;
                    int dealt=Math.Min(remaining,hit);remaining-=dealt;damage+=dealt;
                    if(save.HasAbility(data,"lifesteal"))save.hp=Math.Min(save.Stat(data,"hp"),save.hp+Math.Max(1,BattleRun.Round(dealt*.15)));
                }
            }
            else{int hurt=random.NextDouble()<BattleRun.SpeedRate(save.Stat(data,"spd"))+(save.HasAbility(data,"dodge_up")?.08:0)?0:Math.Max(1,225-save.Stat(data,"def"));if(hurt>0&&save.HasAbility(data,"guard"))hurt=Math.Max(1,BattleRun.Round(hurt*.95));if(hurt>0&&save.HasAncient("anc_a2"))hurt=Math.Max(1,BattleRun.Round(hurt*.7));save.hp=Math.Max(0,save.hp-hurt);}
            if(save.hp<=0||remaining<=0){over=true;return correct;}stageIndex++;if(stageIndex>=areas[areaIndex].stages.Length){stageIndex=0;areaIndex=(areaIndex+1)%areas.Length;}Next();return correct;
        }
        public PendingRaidEvent Finish()
        {
            if(settlement!=null)return settlement;
            if(!test)save.raidCoins+=EconomyRules.ParticipationCoins(damage);
            over=true;
            return settlement=new PendingRaidEvent{id=Guid.NewGuid().ToString("N"),bossId=bossId,damage=damage,startedAt=startedAt,finishedAt=DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),mode="world"};
        }
    }
    public static class AdminRules { public static string Password=>DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(9)).ToString("MMdd"); }
}
