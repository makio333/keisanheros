using System;
using System.Linq;
using UnityEngine;
namespace LegendHeroes
{
    public partial class LegendGame
    {
        readonly System.Random gameRandom=new System.Random();
        void ShowFeatureMenu()
        {
            Begin("menu","冒険メニュー",Data.homeImage,ShowHome);Button(screen,"設定・管理",1050,20,180,45,ShowSettings);
            string[] names={"道具・道具屋","合成","修行・特技","能力ポイント","ガチャ","ハロウィン","レイド","プリント","セーブデータ","プレゼント","学習の記録","村のお願い"};
            Action[] actions={()=>ShowItems(false),()=>ShowSynthesis(),ShowTraining,ShowPoints,()=>ShowGacha("装備"),ShowHalloween,ShowRaids,ShowPrintMenu,ShowSaveMenu,ShowGifts,()=>ShowStudyReport(),ShowQuests};
            for(int i=0;i<names.Length;i++){var action=actions[i];Button(screen,names[i],40+i%3*405,120+i/3*158,390,133,action,i<3);}
        }
        void ShowItems(bool shop)
        {
            Begin("items",shop?"道具屋":"もちもの",shop?"assets/bg/item_shop.jpg":Data.homeImage,ShowFeatureMenu);Button(screen,shop?"もちものへ":"道具屋へ",950,100,290,55,()=>ShowItems(!shop));
            var items=Data.items.Where(e=>shop?e.price>0:Save.ItemCount(e.id)>0).ToArray();var list=Scroll(screen,35,178,1210,560,((items.Length+7)/8)*155);
            for(int i=0;i<items.Length;i++)
            {
                var item=items[i];var b=Button(list,"",i%8*150,i/8*155,138,145,()=>ShowItemDetails(item,shop));b.name="item-"+item.id;
                Picture(b.transform,item.image,25,5,88,88);Label(b.transform,item.name,5,95,128,30,15,gold,TextAnchor.MiddleCenter);
                Label(b.transform,shop?item.price+" G":"×"+Save.ItemCount(item.id),5,124,128,20,16,null,TextAnchor.MiddleCenter);
            }
        }
        void ShowItemDetails(Item item,bool shop)
        {
            var overlay=Box(screen,"Item details",0,0,1280,800,new Color(0,0,0,.8f));var card=Box(overlay,"Item",280,160,720,480);
            Picture(card,item.image,35,30,180,180);Label(card,item.name,245,30,440,80,32,gold);Label(card,item.desc,245,120,440,140,24);
            Label(card,shop?item.price+" G":"所持数 ×"+Save.ItemCount(item.id),35,280,650,55,28,gold);
            Button(card,"もどる",35,370,300,70,()=>Destroy(overlay.gameObject));
            var action=Button(card,shop?"買う":item.effect=="blueprint"?"プリントを作る":"使う",385,370,300,70,()=>
            {
                if(shop){if(Save.TryBuyItem(Data,item.id)){Persist();ShowItems(true);}return;}
                if(item.effect=="blueprint"){Destroy(overlay.gameObject);CreateBlueprintPrint();return;}
                int cost=Save.MaxCost,points=Save.points;
                if(!Save.UseItem(Data,item.id)){Destroy(overlay.gameObject);Notice("今は使えません","回復や振り直しが必要なときに使えます。");return;}
                Persist();ShowItems(false);ShowItemEffect(item,cost,points);
            },true);
            action.interactable=shop?Save.gold>=item.price:Save.ItemCount(item.id)>0;
        }

        void ShowItemEffect(Item item,int oldCost,int oldPoints)
        {
            var overlay=Box(screen,"Item effect",0,0,1280,800,new Color(0,0,0,.75f));var panel=Box(overlay,"Result",340,180,600,440);Picture(panel,item.image,220,20,160,160);
            Label(panel,item.name,25,195,550,60,30,gold,TextAnchor.MiddleCenter);Label(panel,item.effect=="cost"?"装備コスト上限  "+oldCost+" → "+Save.MaxCost:item.effect=="respec"?"スキルポイント  "+oldPoints+" → "+Save.points:"HP "+Save.hp+" / MP "+Save.mp,25,265,550,60,28,null,TextAnchor.MiddleCenter);Button(panel,"つづける",120,350,360,65,()=>Destroy(overlay.gameObject),true);Play("se_gacha_result2",.4f);
        }
        void ShowPoints()
        {
            Begin("points","能力ポイント",Data.homeImage,ShowFeatureMenu);Label(screen,"残り "+Save.points+" ポイント",40,110,1100,70,32,gold);
            string[] ids={"hp","mp","atk","def","spd"},names={"HP","MP","攻撃","守備","素早さ"};for(int i=0;i<ids.Length;i++){string id=ids[i];Label(screen,names[i]+"  "+Save.Stat(Data,id),120,210+i*95,600,65,30);Button(screen,"1ポイント",850,210+i*95,250,65,()=>{if(Save.Allocate(id)){Persist();ShowPoints();}},true);}
        }
        void ShowSynthesis(int baseUid=0)
        {
            Begin("synthesis",baseUid==0?"合成：装備を選ぶ":"合成：同じ装備を選ぶ",Data.homeImage,ShowFeatureMenu);var a=Save.Owned(baseUid);
            var list=Scroll(screen,35,110,1210,640,Mathf.Ceil(Save.ownedEquips.Count/7f)*175);
            var entries=Save.ownedEquips.Where(e=>Data.Equip(e.id)!=null&&(a==null||e.uid!=a.uid&&e.id==a.id&&e.rarity==a.rarity)).ToArray();
            for(int i=0;i<entries.Length;i++){var e=entries[i];var def=Data.Equip(e.id);bool available=e.rarity<5&&Save.ownedEquips.Any(x=>x.uid!=e.uid&&x.id==e.id&&x.rarity==e.rarity);var b=Button(list,"",i%7*172,i/7*175,158,160,()=>{
                if(a==null){ShowSynthesis(e.uid);return;}int first=a.uid,second=e.uid;var generator=new QuestionGenerator(Data,gameRandom);ShowQuiz("合成の計算",2,()=>generator.Tier(def.opTier),ok=>{if(!ok){ShowSynthesis();Notice("合成は中断しました","装備は消費していません。");return;}var result=Save.Synthesize(Data,first,second,gameRandom);Persist();ShowSynthesis();Notice(result!=null?"合成成功！":"合成できません",result!=null?def.name+" ★"+result.rarity:"装備の状態が変わりました。");});
            });b.interactable=available;Picture(b.transform,def.image,32,7,94,94);Label(b.transform,def.name+"\n★"+e.rarity,4,103,150,50,17,gold,TextAnchor.MiddleCenter);}
        }
        void ShowTraining()
        {
            Begin("training","修行・特技",Data.homeImage,ShowFeatureMenu);var list=Scroll(screen,35,110,1210,640,Mathf.Ceil(Data.skills.Length/3f)*205);
            for(int i=0;i<Data.skills.Length;i++){var skill=Data.skills[i];var progress=Save.SkillState(skill.id);var b=Button(list,"",i%3*400,i/3*205,385,190,()=>{
                var generator=new QuestionGenerator(Data,gameRandom);string tier=SkillRules.Tier(skill);ShowQuiz(skill.name+"の修行",1,()=>generator.Tier(tier),ok=>{if(ok){progress.progress++;if(progress.progress>=skill.trainReq)progress.learned=true;Persist();}ShowTraining();if(ok&&progress.learned)Notice("特技を覚えた！",skill.name+"が使えるようになりました。");});
            });b.interactable=Save.level>=skill.reqLvl&&!progress.learned;Picture(b.transform,skill.image,10,15,110,110);Label(b.transform,skill.name+"\nMP "+skill.mp+"  Lv."+skill.reqLvl,130,10,245,80,23,gold);Label(b.transform,progress.learned?"習得済み":progress.progress+" / "+skill.trainReq+" 問",130,105,245,40,22);Button(list,"プリント",i%3*400+230,i/3*205+150,140,32,()=>PrintSpecial("skill:"+skill.id));}
        }
        void ShowGifts()
        {
            Begin("gifts","プレゼント",Data.homeImage,ShowFeatureMenu);if(Save.pendingGifts.Count==0){Label(screen,"未受け取りのプレゼントはありません。",45,180,1190,80,30);return;}
            var list=Scroll(screen,35,110,1210,640,Save.pendingGifts.Count*200);
            for(int i=0;i<Save.pendingGifts.Count;i++){var gift=Save.pendingGifts[i];var p=Box(list,"Gift",0,i*200,1180,185);Label(p,gift.message??"プレゼント",20,5,860,45,24,gold);Label(p,gift.gold+" G",20,57,170,40,24);int col=0;foreach(var e in gift.items??new GiftItem[0]){string path=RewardImage(e.kind,e.id);Picture(p,path,200+col*98,52,68,68);Label(p,"×"+e.count,200+col*98,125,80,30,19);col++;}Button(p,"受け取る",950,65,210,70,()=>CloudAction(async()=>{var owner=Save;bool received=gift.fromCloud?await cloud.ClaimGift(Data,owner,gift.id):EconomyRules.ReceiveGift(Data,owner,gift);if(received&&Save==owner){Persist();ShowGifts();Play("se_gacha_result2");}}),true);}
        }
    }
}
