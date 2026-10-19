using System;
using System.Linq;
using UnityEngine;

namespace LegendHeroes
{
    public partial class LegendGame
    {
        void ShowStudyReport(bool stages=false)
        {
            Begin("study","学習の記録",Data.homeImage,ShowFeatureMenu);var stats=Save.study;
            Label(screen,"回答 "+stats.totalAnswers+" 問　正解 "+stats.totalCorrect+" 問　正答率 "+(stats.totalAnswers>0?100.0*stats.totalCorrect/stats.totalAnswers:0).ToString("0")+"%",40,100,1190,75,30,gold);
            Button(screen,"単元別",40,195,375,55,()=>ShowStudyReport(false),!stages);Button(screen,"ステージ別",435,195,375,55,()=>ShowStudyReport(true),stages);Button(screen,"苦手な漢字",830,195,400,55,ShowWeakWords);
            var rows=(stages?stats.stages:stats.units).OrderByDescending(row=>row.total).ToArray();var list=Scroll(screen,35,280,1210,470,Math.Max(470,rows.Length*120));
            for(int i=0;i<rows.Length;i++)
            {
                var row=rows[i];var panel=Box(list,"Study",0,i*120,1180,108);
                Label(panel,row.label,20,8,680,48,25,gold);Label(panel,row.correct+" / "+row.total+" 正解",800,8,350,48,25);
                Box(panel,"Accuracy track",20,72,1110,15,new Color(.25f,.2f,.3f));Box(panel,"Accuracy",20,72,(float)(1110.0*row.correct/Math.Max(1,row.total)),15,new Color(.35f,.8f,.6f));
            }
            if(rows.Length==0)Label(list,"ステージに挑戦すると、ここに記録がたまります。",30,70,1150,100,28);
        }
        void ShowWeakWords()
        {
            Begin("weak-words","復習したい漢字",Data.homeImage,()=>ShowStudyReport());
            var rows=Save.study.words.Where(r=>r.correct<r.total).OrderBy(r=>(double)r.correct/Math.Max(1,r.total)).Take(100).ToArray();var list=Scroll(screen,35,120,1210,630,Math.Max(630,rows.Length*85));
            for(int i=0;i<rows.Length;i++){var row=rows[i];Label(list,row.key+"　正解 "+row.correct+" / "+row.total+" 回",35,i*85,1120,70,30,gold);}
        }
    }
}
