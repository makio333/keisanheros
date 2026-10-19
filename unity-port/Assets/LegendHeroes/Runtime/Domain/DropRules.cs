using System;
using System.Linq;

namespace LegendHeroes
{
    public static class DropRules
    {
        public static int Difficulty(Area area,int index,bool boss)=>BattleRun.Round(BattleRun.Difficulty(area.id)*100)+(boss?area.stages.Length:index);
        public static double Multiplier(Content data,PlayerSave save,Area area,int index,bool boss)
        {
            int highest=0;
            foreach(var clear in save.clears.Where(c=>c.count>0))
            {
                var parts=clear.key.Split(':');if(parts.Length!=2)continue;
                var previous=data.areas.FirstOrDefault(a=>a.id==parts[0]);if(previous==null)continue;
                if(parts[1]=="boss")highest=Math.Max(highest,Difficulty(previous,0,true));
                else if(int.TryParse(parts[1],out int stage))highest=Math.Max(highest,Difficulty(previous,stage,false));
            }
            var settings=data.rewardSettings??new RewardSettings();string key=area.id+":"+(boss?"boss":index.ToString());
            bool frontier=Difficulty(area,index,boss)>highest&&(save.dropOpportunities.FirstOrDefault(c=>c.key==key)?.count??0)<(boss?1:5);
            return (frontier?settings.frontierDropMult:settings.pastStageDropMult)*(save.ClearCount(key)>=settings.repeatThreshold?settings.repeatMult:1);
        }
        public static void Record(PlayerSave save,string key)
        {var entry=save.dropOpportunities.FirstOrDefault(c=>c.key==key);if(entry==null)save.dropOpportunities.Add(new ClearRecord{key=key,count=1});else entry.count++;}
        public static bool HalloweenActive(DateTimeOffset now)=>now>=new DateTimeOffset(2026,10,1,0,0,0,TimeSpan.FromHours(9))&&now<new DateTimeOffset(2026,11,1,0,0,0,TimeSpan.FromHours(9));
    }
}
