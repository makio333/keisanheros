using System;
using System.Collections.Generic;
using System.Linq;
namespace LegendHeroes
{
    [Serializable] public class PrintSheet
    {
        public string id,code,name,areaId,targetId="stage",mode="yomi";public int stageIndex;public long createdAt;public bool challenge,claimed;public Problem[] problems;
    }
    public static class PrintRules
    {
        static string NewId(PlayerSave save,Random rng)
        {
            for(int attempt=0;attempt<10000;attempt++){string id=rng.Next(1000,10000).ToString();if(save.prints.All(p=>p.id!=id))return id;}
            throw new InvalidOperationException("保存済みプリントが多すぎます。");
        }
        public static PrintSheet Create(Content d,PlayerSave save,Area area,int index,bool challenge,string target="stage",string mode="yomi")
        {
            var rng=new Random();var q=new QuestionGenerator(d,rng);var sheet=new PrintSheet{id=NewId(save,rng),code=rng.Next(0,1000000).ToString("D6"),name=(target=="blueprint"?"古代の設計図・":"")+(challenge?"チャレンジプリント・":"")+area.name+" / "+area.stages[index].name,areaId=area.id,stageIndex=index,challenge=challenge,mode=mode,targetId=target,createdAt=DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),problems=Enumerable.Range(0,10).Select(_=>q.Stage(area,index)).ToArray()};save.prints.Add(sheet);return sheet;
        }
        public static bool Claim(Content d,PlayerSave save,PrintSheet sheet,string code,string[] answers)
        {
            if(sheet.claimed||sheet.code!=code||answers==null||answers.Length!=sheet.problems.Length||DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()-sheet.createdAt>30L*86400000)return false;
            int correct=0;for(int i=0;i<answers.Length;i++){var p=sheet.problems[i];bool writing=sheet.mode=="kaki"||sheet.mode=="mix"&&i%2==1;bool ok=writing&&p.language?p.text==(answers[i]??"").Trim():p.Accepts(answers[i]);if(ok)correct++;}
            int multiplier=sheet.challenge?3:1;double rate=(double)correct/answers.Length;sheet.claimed=true;
            save.gold+=correct*10*multiplier;save.GrantExp(d,correct*20*multiplier);if(rate>=.5)save.AddItem("potion",multiplier);if(rate>=.8)save.AddItem("hipotion",3*multiplier);if(rate>=1){save.AddItem("cost_seed",multiplier);save.gold+=500*multiplier;}if(sheet.challenge&&rate>=.8)save.equipGachaTenPullTickets++;
            if(sheet.targetId=="blueprint"&&rate>=.8&&save.ItemCount("bp_ancient")>0){var pool=d.equipment.Where(e=>e.id.StartsWith("anc_")).ToArray();var remaining=pool.Where(e=>!save.Owns(e.id)).ToArray();if(remaining.Length>0)pool=remaining;var e=pool[new Random().Next(pool.Length)];save.AddItem("bp_ancient",-1);save.AddEquipment(d,e.id,6);}
            if(sheet.targetId=="levelup"&&rate>=.8){for(int i=0;i<5;i++){save.level++;save.points+=3;save.baseHp+=4;save.baseMp+=2;}save.hp=save.Stat(d,"hp");save.mp=save.Stat(d,"mp");}
            if(sheet.targetId.StartsWith("skill:")&&rate>=.8){var skill=save.SkillState(sheet.targetId.Substring(6));skill.learned=true;skill.progress=10;}
            if(sheet.targetId=="demon_castle"&&rate>=.5){save.gold+=10000;save.GrantExp(d,1000);save.AddEquipment(d,"demon_sword",5,EconomyRules.RollAbility(5,new Random()));}
            if((sheet.targetId=="stage"||sheet.targetId=="boss")&&rate>=.8)
                StageRewards.Clear(d,save,d.areas.First(a=>a.id==sheet.areaId),sheet.stageIndex,sheet.targetId=="boss");
            return true;
        }
        public static PrintSheet CreateBoss(Content d,PlayerSave save,Area area,string mode="yomi")
        {
            var sheet=Create(d,save,area,area.stages.Length-1,false,"boss",mode);sheet.name=area.name+" ボス戦プリント";
            var generator=new QuestionGenerator(d,new Random());sheet.problems=Enumerable.Range(0,10).Select(i=>generator.Stage(area,area.stages.Length-1,true,i>=5)).ToArray();return sheet;
        }
        public static PrintSheet CreateSpecial(Content d,PlayerSave save,string target,string tier=null)
        {
            var source=HighestCleared(d,save);var sheet=Create(d,save,source.Item1,source.Item2,false,target);
            var rng=new Random();var generator=new QuestionGenerator(d,rng);
            if(target.StartsWith("skill:"))
            {
                var skill=d.skills.First(s=>s.id==target.Substring(6));sheet.name=skill.name+"の修行プリント";
                tier=SkillRules.Tier(skill);
            }
            if(target=="levelup"){sheet.name="レベルアップ修行プリント";tier="mul3";}
            if(target=="demon_castle")
            {
                sheet.name="禁断の魔王城";var tiers=new[]{"add5","sub5","mul4","div3","div4"};
                sheet.problems=Enumerable.Range(0,20).Select(i=>
                {
                    if(i<15)return generator.Tier(tiers[rng.Next(tiers.Length)]);
                    var pool=d.kanjiPools.Where(p=>p.tier.StartsWith("kanji_g")).ToArray();var words=pool[rng.Next(pool.Length)].problems;var word=words[rng.Next(words.Length)];
                    return new Problem{text="「"+word.text+"」のよみは何文字？",answer=word.answer.Length.ToString()};
                }).ToArray();return sheet;
            }
            if(!string.IsNullOrEmpty(tier))sheet.problems=Enumerable.Range(0,10).Select(_=>generator.Tier(tier)).ToArray();
            return sheet;
        }
        public static Tuple<Area,int> HighestCleared(Content d,PlayerSave save)
        {
            var candidates=d.areas.SelectMany(area=>area.stages.Select((stage,index)=>Tuple.Create(area,index)))
                .Where(x=>save.ClearCount(x.Item1.id+":"+x.Item2)>0)
                .OrderBy(x=>BattleRun.Difficulty(x.Item1.id)*100+x.Item2);
            return candidates.LastOrDefault()??Tuple.Create(d.areas.First(a=>a.id=="area1"),0);
        }
    }
}
