using System;
using System.Collections.Generic;
using System.Linq;

namespace LegendHeroes
{
    public static class PrintCodec
    {
        public static void Import(Dictionary<string,object> root,PlayerSave save,Content d)
        {
            // The Web client removes a print after grading. An older Unity extension
            // must never revive that sheet and pay its rewards again.
            if(root.ContainsKey("activePrints"))foreach(var sheet in save.prints)
                if(!root.Map("activePrints").ContainsKey(sheet.id))sheet.claimed=true;
            foreach(var pair in root.Map("activePrints"))
            {
                if(save.prints.Any(s=>s.id==pair.Key))continue;
                var meta=pair.Value as Dictionary<string,object>;if(meta==null)continue;
                var target=meta.Str("targetId");
                var sheet=new PrintSheet{id=pair.Key,code=meta.Str("code"),name=meta.Str("name"),areaId=meta.Str("areaId"),stageIndex=meta.Int("stageIndex"),createdAt=meta.Long("createdAt"),challenge=meta.Bool("challengePrint"),mode=meta.Str("kanjiMode","yomi"),targetId=meta.Str("type")=="boss"||meta.Str("type")=="stage_boss"?"boss":meta.Str("type")=="blueprint"?"blueprint":meta.Str("type")=="skill"?"skill:"+target:target=="levelup"||target=="demon_castle"?target:"stage"};
                sheet.problems=meta.List("problems").OfType<Dictionary<string,object>>().Select(raw=>
                {
                    string text=raw.Str("text"),answer=raw.Str("answer");
                    var matching=d.kanjiPools.SelectMany(pool=>pool.problems).FirstOrDefault(p=>p.text==text&&p.answer==answer);
                    return new Problem{text=text,answer=answer,acceptedAnswers=matching?.acceptedAnswers??new[]{answer},language=matching?.language??answer.Any(c=>c>='\u3040'&&c<='\u9fff'),tier=raw.Str("tier"),remainder=raw.Int("remainder",-1)};
                }).ToArray();
                if(sheet.problems.Length>0)save.prints.Add(sheet);
            }
        }
        public static void Export(Dictionary<string,object> root,PlayerSave save)
        {
            var active=root.Map("activePrints");var claimed=root.List("claimedChallengePrintIds");
            foreach(var sheet in save.prints)
            {
                if(sheet.claimed){active.Remove(sheet.id);if(sheet.challenge&&!claimed.Contains(sheet.id))claimed.Add(sheet.id);continue;}
                var meta=active.Map(sheet.id);meta["targetId"]=sheet.targetId=="blueprint"?"bp_ancient":sheet.targetId.StartsWith("skill:")?sheet.targetId.Substring(6):sheet.targetId=="boss"?sheet.areaId+"_boss":sheet.targetId=="stage"?sheet.areaId+"_"+sheet.stageIndex:sheet.targetId;
                meta["type"]=sheet.targetId.StartsWith("skill:")?"skill":sheet.targetId=="blueprint"?"blueprint":sheet.targetId=="boss"?"boss":"stage";meta["code"]=sheet.code;meta["name"]=sheet.name;meta["createdAt"]=sheet.createdAt;meta["areaId"]=sheet.areaId;meta["stageIndex"]=sheet.stageIndex;meta["kanjiMode"]=sheet.mode;meta["challengePrint"]=sheet.challenge;
                meta["problems"]=sheet.problems.Select(p=>(object)WireJson.Object(UnityEngine.JsonUtility.ToJson(p))).ToList();active[sheet.id]=meta;
            }
            root["activePrints"]=active;root["claimedChallengePrintIds"]=claimed;
        }
    }
}
