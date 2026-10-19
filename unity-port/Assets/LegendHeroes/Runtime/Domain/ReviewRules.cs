using System;
using System.Collections.Generic;
using System.Linq;

namespace LegendHeroes
{
    [Serializable] public class PickupStage { public string bossId,areaId,learningKey,reason,status="open";public int stageIndex; }
    public static class ReviewRules
    {
        public static void Record(PlayerSave save,Area area,int index,bool correct)
        {
            string key=area.id+"_"+index;var row=save.raidLearning.FirstOrDefault(s=>s.key==key);
            if(row==null){row=new StudyRow{key=key,label=area.name+" / "+area.stages[index].name};save.raidLearning.Add(row);}
            row.total++;if(correct)row.correct++;
        }
        public static PickupStage Candidate(Content d,PlayerSave save)
        {
            foreach(var row in save.raidLearning.Where(s=>s.total>=3&&s.total-s.correct>=2).OrderByDescending(s=>(s.total-s.correct)/(double)s.total).ThenByDescending(s=>s.total-s.correct).ThenByDescending(s=>s.total))
            {
                string areaId="";int index=-1;var parts=row.key.Split('_');
                if(parts.Length==2&&parts[0].StartsWith("area")&&int.TryParse(parts[1],out int stage)){areaId=parts[0];index=stage;}
                else
                {
                    var legacy=new Dictionary<string,string>{{"math_add","area1"},{"math_sub","area13"},{"math_mul","area2"},{"math_div","area3"},{"math_dec","area11"},{"math_frac","area11"},{"math_elem5","area11"},{"math_elem6","area12"},{"math_calc","area4"}};
                    if(row.key.StartsWith("kanji_")&&int.TryParse(row.key.Substring(6),out int grade))areaId="area"+(grade+4);
                    else legacy.TryGetValue(row.key,out areaId);
                    var legacyArea=d.areas.FirstOrDefault(a=>a.id==areaId);if(legacyArea==null)continue;
                    var allowed=row.key=="math_dec"?new[]{0,1}:row.key=="math_frac"?new[]{2,3}:Enumerable.Range(0,legacyArea.stages.Length).ToArray();
                    index=allowed.OrderBy(i=>save.ClearCount(areaId+":"+i)).ThenBy(i=>i).First();
                }
                var area=d.areas.FirstOrDefault(a=>a.id==areaId);if(area==null||index<0||index>=area.stages.Length)continue;
                return new PickupStage{bossId=save.currentRaidBossId,areaId=areaId,stageIndex=index,learningKey=row.key,reason="レイドでまちがえた「"+row.label+"」を復習しよう！"};
            }
            return null;
        }
        public static PickupStage Active(Content d,PlayerSave save)
        {
            if(save.pickup!=null&&save.pickup.bossId==save.currentRaidBossId&&save.pickup.status!="open")return null;
            var candidate=Candidate(d,save);if(candidate==null){save.pickup=null;return null;}
            if(save.pickup==null||save.pickup.bossId!=save.currentRaidBossId||save.pickup.learningKey!=candidate.learningKey)save.pickup=candidate;
            return save.pickup;
        }
        public static bool Claim(Content d,PlayerSave save,string areaId,int index)
        {
            var pickup=Active(d,save);if(pickup==null||pickup.areaId!=areaId||pickup.stageIndex!=index||pickup.status!="open")return false;
            var settings=d.rewardSettings??new RewardSettings();save.equipGachaTenPullTickets+=settings.pickupBonusTickets;save.raidTickets+=settings.pickupBonusRaidTickets;save.gold+=settings.pickupBonusGold;pickup.status="claimed";return true;
        }
    }
}
