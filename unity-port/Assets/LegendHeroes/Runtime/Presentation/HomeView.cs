using System.Linq;
using UnityEngine;

namespace LegendHeroes
{
    public partial class LegendGame
    {
        public void ShowTitle()
        {
            Begin("title","レジェンドヒーローズ",Data.homeImage);
            var r=Box(screen,"Title card",330,170,620,440);
            Label(r,"LEGEND HEROES",25,30,570,80,46,gold,TextAnchor.MiddleCenter);
            Label(r,"知恵をつないで、冒険しよう。",25,117,570,50,24,null,TextAnchor.MiddleCenter);
            Button(r,"はじめから",100,210,420,66,ShowCreate,true);
            var b=Button(r,"つづきから",100,297,420,66,()=>ShowHome());b.interactable=Save!=null;
        }
        void ShowCreate()
        {
            Begin("create","冒険のじゅんび",Data.homeImage,ShowTitle);
            var r=Box(screen,"Create",30,105,1220,660);
            Label(r,"なまえ",32,20,200,40,25,gold);var field=Input(r,pendingName,32,68,430,62);field.onValueChanged.AddListener(v=>pendingName=v);
            var preview=new PlayerSave{avatar=selectedAvatar};Avatar(r,preview,40,160,350);
            Button(r,"このキャラで はじめる",32,548,430,70,()=>{
                if(Save!=null){ConfirmNew();return;}StartNew();
            },true);
            var options=Data.avatars.Where(a=>!a.gachaOnly&&string.IsNullOrEmpty(a.rewardSource)).ToArray();
            var list=Scroll(r,500,25,690,590,((options.Length+3)/4)*185);
            for(int i=0;i<options.Length;i++){var a=options[i];int col=i%4,row=i/4;var b=Button(list,"",col*168,row*185,157,175,()=>{selectedAvatar=a.id;ShowCreate();});Picture(b.transform,a.image,18,8,122,122);Label(b.transform,a.name,8,132,141,38,16,null,TextAnchor.MiddleCenter);}
        }
        void ConfirmNew()
        {
            var r=Box(screen,"Confirm",250,210,780,350,new Color(.12f,.07f,.18f,.99f));Label(r,"Unity版のセーブを新しくしますか？",35,30,710,80,29,gold);Label(r,"現在のUnity版セーブはバックアップに残ります。",35,125,710,60,22);
            Button(r,"やめる",40,230,330,65,()=>Destroy(r.gameObject));Button(r,"はじめる",405,230,330,65,StartNew,true);
        }
        void StartNew()
        {
            Save=new PlayerSave{playerName=string.IsNullOrWhiteSpace(pendingName)?"ぼうけんしゃ":pendingName.Trim(),avatar=selectedAvatar};Save.Normalize(Data);Save.skins.Add(selectedAvatar);Persist();ShowHome();
        }
        public void ShowHome()
        {
            Begin("home","レジェンドヒーローズ",Data.homeImage);
            var left=Box(screen,"Hero",28,108,355,650);Avatar(left,Save,22,22,310);
            Label(left,Save.playerName+"  Lv."+Save.level,22,345,310,45,28,gold);
            Label(left,"HP  "+Save.hp+" / "+Save.Stat(Data,"hp")+"\nMP  "+Save.mp+" / "+Save.Stat(Data,"mp")+"\n攻撃 "+Save.Stat(Data,"atk")+"   守備 "+Save.Stat(Data,"def")+"\n経験値 "+Save.exp+" / "+PlayerSave.ExpNext(Save.level)+"\n装備コスト "+Save.UsedCost(Data)+" / "+Save.MaxCost,22,395,310,165,22);
            Button(left,"キャラ・背景・フレーム",18,570,319,58,()=>ShowAppearance("キャラ"));
            var main=Box(screen,"Adventure",410,108,840,650);
            Label(main,"今日は、どこへ冒険する？",30,25,780,55,32,gold);var review=ReviewRules.Active(Data,Save);if(review!=null)Button(main,"復習ボーナス",560,25,250,55,()=>ShowReviewOffer(review),true);
            Button(main,"算数のステージ",30,110,375,135,()=>ShowAreas(false),true);
            Button(main,"ことば・漢字のステージ",435,110,375,135,()=>ShowAreas(true),true);
            Button(main,"そうび",30,280,375,90,()=>ShowEquipment(false));
            Button(main,"ぶきや",435,280,375,90,()=>ShowEquipment(true));
            Button(main,"休む・HPを回復",30,400,375,80,()=>{Save.hp=Save.Stat(Data,"hp");Persist();ShowHome();});
            Button(main,"セーブする",435,400,375,80,()=>{SuggestPrintBeforeSave();});
            Button(main,"タイトルへ",30,535,375,65,()=>{Persist();ShowTitle();});
            Button(main,"冒険メニュー",435,535,375,65,ShowFeatureMenu,true);
            if(Save.pendingGifts.Count>0)ShowGifts();else RequestGiftCheck();
        }
        public void ShowAreas(bool language)
        {
            Begin("areas",language?"ことば・漢字の冒険":"算数の冒険",Data.homeImage,ShowHome);
            var areas=Data.areas.Where(a=>a.id=="area14"||a.id=="area15"||new[]{"area5","area6","area7","area8","area9","area10"}.Contains(a.id)?language:!language).ToArray();
            var list=Scroll(screen,30,108,1220,654,((areas.Length+2)/3)*220);
            for(int i=0;i<areas.Length;i++)
            {
                var a=areas[i];float x=(i%3)*405,y=(i/3)*220;var b=Button(list,"",x,y,390,202,()=>ShowStages(a));
                Picture(b.transform,a.image,0,0,390,202,true);Box(b.transform,"Shade",0,110,390,92,new Color(.06f,.03f,.12f,.86f));Label(b.transform,a.name,18,113,354,42,26,gold);Label(b.transform,a.opLabel,18,154,354,40,18);
            }
        }
        public void ShowStages(Area area)
        {
            bool language=area.stages[0].problems[0].language;
            Begin("stages",area.name,area.image,()=>ShowAreas(language));
            var list=Scroll(screen,40,110,1200,650,((area.stages.Length+2)/3)*165+170);
            for(int i=0;i<area.stages.Length;i++)
            {
                int index=i;var s=area.stages[i];float x=i%3*397,y=i/3*165;var b=Button(list,"",x,y,380,147,()=>StartBattle(area,index));
                Label(b.transform,(i+1)+"  "+s.name,18,12,344,85,23,gold);
                int count=Save.ClearCount(area.id+":"+i);Label(b.transform,count>0?"クリア済み ×"+count:"未クリア",18,103,200,30,18);Button(list,"プリント",x+235,y+103,130,32,()=>ChoosePrintMode(area,index,false));
            }
            float bossY=((area.stages.Length+2)/3)*165;
            Button(list,"ボスに挑戦  ―  "+area.boss.name,0,bossY,900,100,()=>StartBattle(area,0,true),true);Button(list,"ボスのプリント",930,bossY,244,100,()=>ChoosePrintMode(area,0,false,"boss"));
        }
    }
}
