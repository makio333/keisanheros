using System.Linq;
using UnityEngine;

namespace LegendHeroes
{
    public partial class LegendGame
    {
        void ShowEquipment(bool shop,string filter="すべて")
        {
            Begin(shop?"shop":"equipment",shop?"ぶきや":"そうび",shop?"assets/bg/weapon_shop.jpg":Data.homeImage,ShowHome);
            var entries=Save.ownedEquips.Where(item=>Data.Equip(item.id)!=null).Where(item=>filter=="すべて"||Data.Equip(item.id).slot==filter).ToArray();
            var all=shop?Data.equipment.Where(e=>e.price>0).ToArray():Save.ownedEquips.Select(e=>Data.Equip(e.id)).Where(e=>e!=null).ToArray();all=all.Where(e=>filter=="すべて"||e.slot==filter).ToArray();
            var sidebar=Box(screen,"Equipment summary",30,110,325,650);
            Avatar(sidebar,Save,32,20,260);Label(sidebar,"装備コスト "+Save.UsedCost(Data)+" / "+Save.MaxCost,20,300,285,50,25,gold);
            Label(sidebar,"攻撃 "+Save.Stat(Data,"atk")+"\n守備 "+Save.Stat(Data,"def")+"\n最大HP "+Save.Stat(Data,"hp"),20,360,285,150,25);
            Label(sidebar,"商品を選ぶと、\n詳細を確認できます。",20,535,285,80,21);
            var filters=new[]{"すべて","weapon","armor","accessory"};var names=new[]{"すべて","武器","防具","アクセサリー"};
            for(int i=0;i<filters.Length;i++){string f=filters[i];Button(screen,names[i],385+i*217,110,203,52,()=>ShowEquipment(shop,f),filter==f);}
            var list=Scroll(screen,385,185,865,575,((all.Length+6)/7)*125);
            for(int i=0;i<all.Length;i++)
            {
                var e=all[i];var copy=shop?null:entries[i];float x=(i%7)*122,y=(i/7)*125;var b=Button(list,"",x,y,110,110,()=>EquipmentDetails(e,shop,filter,copy?.uid??0));
                b.name="item-"+e.id;if(e.image.Contains("/"))Picture(b.transform,e.image,12,6,86,80);else Label(b.transform,e.name,6,10,98,68,20,gold,TextAnchor.MiddleCenter);Label(b.transform,shop?e.price+" G":"★"+copy.rarity+" C "+PlayerSave.EquipCost(e,copy.rarity),3,82,104,26,17,gold,TextAnchor.MiddleCenter);
            }
        }
        void EquipmentDetails(Equipment e,bool shop,string filter,int uid=0)
        {
            var copy=shop?null:Save.Owned(uid);int rarity=copy?.rarity??1;double multiplier=PlayerSave.RarityMultiplier(rarity);
            var overlay=Box(screen,"Equipment modal",0,0,1280,800,new Color(0,0,0,.78f));var r=Box(overlay,"Item",310,145,660,520);
            Picture(r,e.image,30,30,180,180);Label(r,e.name+(shop?"":" ★"+rarity),235,30,390,85,30,gold);
            Label(r,"コスト "+PlayerSave.EquipCost(e,rarity)+"\n攻撃 +"+System.Math.Floor(e.stat.atk*multiplier)+"  守備 +"+System.Math.Floor(e.stat.def*multiplier)+"\nHP +"+System.Math.Floor(e.stat.hp*multiplier)+"  MP +"+System.Math.Floor(e.stat.mp*multiplier),235,130,390,130,23);
            Label(r,string.IsNullOrEmpty(copy?.ability??e.ability)?"":"特殊能力："+AbilityName(copy?.ability??e.ability),30,285,600,75,23,gold);
            bool owned=Save.Owns(e.id);
            Button(r,"とじる",30,420,270,65,()=>Destroy(overlay.gameObject));
            var act=Button(r,shop?e.price+" G で買う":"装備する",340,420,290,65,()=>{
                if(shop){if(!Save.TryBuy(Data,e.id))return;Persist();ShowEquipment(true,filter);}
                else if(Save.CanEquip(Data,uid))
                {
                    var generator=new QuestionGenerator(Data,gameRandom);ShowQuiz("装備するための計算",1,()=>generator.Tier(e.opTier),ok=>{if(ok&&Save.TryEquip(Data,uid))Persist();ShowEquipment(false,filter);if(!ok)Notice("装備はそのままです","もう一度挑戦しよう。");});
                }
                else{Destroy(overlay.gameObject);Notice("コストが足りません","今の装備コスト上限は "+Save.MaxCost+" です。");}
            },true);act.interactable=!shop||Save.gold>=e.price;
        }
        static string AbilityName(string id)
        {switch(id){case "guard":return "鉄壁：受けるダメージ -5%";case "power":return "剛力：攻撃力 +15%";case "lifesteal":return "吸収：与えたダメージの一部で回復";case "crit_up":return "会心率 +10%";case "mp_save":return "消費MP -1";default:return id;}}
    }
}
