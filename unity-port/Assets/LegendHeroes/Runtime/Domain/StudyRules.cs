using System;
using System.Collections.Generic;
using System.Linq;

namespace LegendHeroes
{
    [Serializable] public class StudySample { public long t;public int ok; }
    [Serializable] public class StudyRow
    {
        public string key,label;public int total,correct,initialTotal,initialCorrect;public long timeMs;
        public List<StudySample> history=new List<StudySample>();
    }
    [Serializable] public class StudyStats
    {
        public int totalAnswers,totalCorrect;public List<StudyRow> units=new List<StudyRow>(),stages=new List<StudyRow>(),words=new List<StudyRow>();
    }
    public static class StudyRules
    {
        static void Add(List<StudyRow> rows,string key,string label,bool correct,int milliseconds,int limit)
        {
            var row=rows.FirstOrDefault(r=>r.key==key);
            if(row==null){row=new StudyRow{key=key,label=label};rows.Add(row);}
            row.total++;if(correct)row.correct++;row.timeMs+=Math.Max(0,milliseconds);
            if(row.total<=8){row.initialTotal=row.total;row.initialCorrect=row.correct;}
            row.history.Add(new StudySample{t=DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),ok=correct?1:0});
            if(row.history.Count>limit)row.history.RemoveRange(0,row.history.Count-limit);
        }
        public static void Record(PlayerSave save,Problem problem,bool correct,int milliseconds=0,string stageKey="",string stageName="")
        {
            var stats=save.study??(save.study=new StudyStats());stats.totalAnswers++;if(correct)stats.totalCorrect++;
            string tier=problem.tier??"",key,label;
            if(problem.language)
            {
                string grade=new string(tier.Where(char.IsDigit).Take(1).ToArray());
                key=tier.StartsWith("kanji")?"kanji_"+grade:string.IsNullOrEmpty(tier)?"language":tier;label=key.StartsWith("kana")?"かな："+tier:"漢字 小"+grade+"年";
            }
            else
            {
                string family=tier.StartsWith("elem5")?"elem5":tier.StartsWith("elem6")?"elem6":tier.StartsWith("frac")?"frac":tier.StartsWith("dec")?"dec":tier.StartsWith("add")?"add":tier.StartsWith("sub")?"sub":tier.StartsWith("mul")?"mul":tier.StartsWith("div")?"div":problem.text.Contains("×")?"mul":problem.text.Contains("÷")?"div":problem.text.Contains("-")?"sub":problem.text.Contains("+")?"add":"calc";
                key="math_"+family;label=family=="elem5"?"小5算数":family=="elem6"?"小6算数":family=="frac"?"分数":family=="dec"?"小数":family=="mul"?"かけ算":family=="div"?"わり算":family=="sub"?"ひき算":family=="add"?"たし算":"計算";
            }
            Add(stats.units,key,label,correct,milliseconds,50);
            if(problem.language&&problem.text.Any(c=>c>='\u3400'&&c<='\u9fff'))Add(stats.words,problem.text,problem.text,correct,milliseconds,30);
            if(!string.IsNullOrEmpty(stageKey))Add(stats.stages,stageKey,stageName,correct,milliseconds,30);
        }
    }
}
