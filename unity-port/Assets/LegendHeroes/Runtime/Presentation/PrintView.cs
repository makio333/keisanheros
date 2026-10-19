using System;
using System.Linq;
using UnityEngine;
using UnityEngine.UI;
namespace LegendHeroes
{
    public partial class LegendGame
    {
        void SuggestPrintBeforeSave()
        {
            var review=ReviewRules.Candidate(Data,Save);var source=review==null?PrintRules.HighestCleared(Data,Save):Tuple.Create(Data.areas.First(a=>a.id==review.areaId),review.stageIndex);var overlay=Box(screen,"Print suggestion",0,0,1280,800,new Color(0,0,0,.8f));var r=Box(overlay,"Suggestion",240,160,800,480);Label(r,"チャレンジプリントにも挑戦しよう！",25,20,600,70,27,gold);Button(r,"やめる",650,25,125,45,()=>Destroy(overlay.gameObject));Label(r,source.Item1.name+" / "+source.Item1.stages[source.Item2].name,25,100,750,70,24);
            Label(r,"EXP",45,180,150,85,40,gold,TextAnchor.MiddleCenter);Label(r,"G",225,180,150,85,44,gold,TextAnchor.MiddleCenter);Picture(r,"assets/items/potion.png",435,180,85,85);Picture(r,"assets/items/background_skin_ticket.png",615,180,85,85);
            string[] rewards={"経験値 ×3","ゴールド ×3","消耗品 ×3","10連券 ×1"};for(int i=0;i<4;i++)Label(r,rewards[i],30+i*185,270,180,40,21,gold,TextAnchor.MiddleCenter);Label(r,"10連券は80%以上の正解で確定！",30,312,740,30,21,null,TextAnchor.MiddleCenter);Button(r,"プリントを出して保存",30,350,350,75,()=>{var sheet=PrintRules.Create(Data,Save,source.Item1,source.Item2,true);Persist();Application.OpenURL(new Uri(PrintService.Write(Save,sheet)).AbsoluteUri);ShowHome();},true);Button(r,"今回は保存だけ",420,350,350,75,()=>{Persist();Destroy(overlay.gameObject);Notice("保存しました","冒険の記録を保存しました。");});
        }
        void ShowPrintMenu()
        {
            Begin("prints","プリント",Data.homeImage,ShowFeatureMenu);Button(screen,"おすすめのチャレンジプリント",40,110,580,90,()=>{var s=PrintRules.HighestCleared(Data,Save);ChoosePrintMode(s.Item1,s.Item2,true);},true);Button(screen,"古代の設計図",650,110,590,90,CreateBlueprintPrint);
            Button(screen,"レベルアップ修行",40,220,580,55,()=>PrintSpecial("levelup"));Button(screen,"魔王城のプリント",650,220,590,55,()=>PrintSpecial("demon_castle"));
            var list=Scroll(screen,35,305,1210,435,Math.Max(435,Save.prints.Count*95));int i=0;foreach(var sheet in Save.prints.OrderByDescending(s=>s.createdAt)){var p=sheet;var r=Box(list,"Print",0,i++*95,1185,85);Label(r,p.name+"\n番号："+p.id+(p.claimed?"（採点済み）":""),15,5,820,75,21,gold);Button(r,p.claimed?"印刷":"採点する",870,12,290,60,()=>{if(p.claimed)Application.OpenURL(new Uri(PrintService.Write(Save,p)).AbsoluteUri);else ShowPrintGrade(p);},!p.claimed);}
        }
        void PrintSpecial(string target)
        {
            var sheet=PrintRules.CreateSpecial(Data,Save,target);Persist();Application.OpenURL(new Uri(PrintService.Write(Save,sheet)).AbsoluteUri);ShowPrintMenu();
        }
        void ChoosePrintMode(Area area,int index,bool challenge,string target="stage")
        {
            Begin("print-mode","プリントの形式",area.image,ShowPrintMenu);string[] ids={"yomi","kaki","mix"},names={"読み・計算","書き","読み書きミックス"};for(int i=0;i<3;i++){string mode=ids[i];Button(screen,names[i],80+i*405,260,380,160,()=>{var sheet=target=="boss"?PrintRules.CreateBoss(Data,Save,area,mode):PrintRules.Create(Data,Save,area,index,challenge,target,mode);Persist();Application.OpenURL(new Uri(PrintService.Write(Save,sheet)).AbsoluteUri);ShowPrintMenu();},true);}
        }
        void CreateBlueprintPrint()
        {
            if(!Save.clears.Any(c=>c.count>0)){Notice("ステージをクリアしよう","クリアした最高難易度のステージの設計図プリントを作れます。");return;}if(Save.ItemCount("bp_ancient")<=0){Notice("設計図がありません","ステージのドロップで古代の設計図を集めよう。");return;}var highest=PrintRules.HighestCleared(Data,Save);ChoosePrintMode(highest.Item1,highest.Item2,false,"blueprint");
        }
        void ShowPrintGrade(PrintSheet sheet)
        {
            Begin("grade",sheet.name,Data.homeImage,ShowPrintMenu);Label(screen,"暗号を入力",40,98,300,45,22,gold);var code=Input(screen,"",340,98,300,50);var list=Scroll(screen,35,170,1210,500,sheet.problems.Length*105);var answers=new InputField[sheet.problems.Length];
            for(int i=0;i<answers.Length;i++){var p=sheet.problems[i];bool writing=sheet.mode=="kaki"||sheet.mode=="mix"&&i%2==1;Label(list,(i+1)+"  "+(writing&&p.language?p.answer+" を漢字で":p.text),15,i*105,650,85,24,gold);answers[i]=Input(list,"",690,i*105+15,450,65);}
            Button(screen,"採点して報酬を受け取る",340,700,600,65,()=>{var input=answers.Select(a=>a.text).ToArray();if(!PrintRules.Claim(Data,Save,sheet,code.text,input)){Notice("採点できません","暗号、受取済み、発行から30日の期限を確認してください。");return;}Persist();ShowPrintMenu();Notice("プリントの報酬を獲得！",sheet.challenge?"報酬3倍。80%以上の正解で装備10連券も獲得！":"正解数に応じた経験値とゴールドを獲得しました。");},true);
        }
    }
}
