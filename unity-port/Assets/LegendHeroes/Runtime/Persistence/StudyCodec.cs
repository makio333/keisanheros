using System;
using System.Collections.Generic;
using System.Linq;

namespace LegendHeroes
{
    public static class StudyCodec
    {
        public static StudyStats Import(Dictionary<string,object> data)
        {
            return new StudyStats{totalAnswers=data.Int("totalAnswers"),totalCorrect=data.Int("totalCorrect"),units=Rows(data.Map("units")),stages=Rows(data.Map("stageHistory")),words=Rows(data.Map("kanjiWords"))};
        }
        static List<StudyRow> Rows(Dictionary<string,object> data)
        {
            return data.Select(pair=>
            {
                var row=pair.Value as Dictionary<string,object>??new Dictionary<string,object>();
                return new StudyRow{key=pair.Key,label=row.Str("label",pair.Key),total=row.Int("total"),correct=row.Int("correct"),initialTotal=row.Int("initialTotal"),initialCorrect=row.Int("initialCorrect"),timeMs=row.Long("timeMs"),history=row.List("history").OfType<Dictionary<string,object>>().Select(sample=>new StudySample{t=sample.Long("t"),ok=sample.Int("ok")}).ToList()};
            }).ToList();
        }
        public static Dictionary<string,object> Export(StudyStats stats,Dictionary<string,object> original)
        {
            original["totalAnswers"]=stats.totalAnswers;original["totalCorrect"]=stats.totalCorrect;
            original["units"]=WriteRows(stats.units,original.Map("units"));original["stageHistory"]=WriteRows(stats.stages,original.Map("stageHistory"));original["kanjiWords"]=WriteRows(stats.words,original.Map("kanjiWords"));return original;
        }
        static Dictionary<string,object> WriteRows(List<StudyRow> rows,Dictionary<string,object> original)
        {
            foreach(var row in rows)
            {
                var data=original.Map(row.key);data["label"]=row.label;data["total"]=row.total;data["correct"]=row.correct;data["initialTotal"]=row.initialTotal;data["initialCorrect"]=row.initialCorrect;data["timeMs"]=row.timeMs;
                data["history"]=row.history.Select(sample=>(object)new Dictionary<string,object>{{"t",sample.t},{"ok",sample.ok}}).ToList();original[row.key]=data;
            }
            return original;
        }
    }
}
