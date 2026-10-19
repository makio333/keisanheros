using System;
using System.Linq;
using UnityEngine;

namespace LegendHeroes
{
    public partial class LegendGame
    {
        static readonly string[] GiftTickets={"equip-ten-ticket","skin-ticket","raid-ticket","halloween-ticket"};
        string GiftChoiceName(string id)
        {
            switch(id){case "equip-ten-ticket":return "装備ガチャ10連券";case "skin-ticket":return "背景・キャラガチャ券";case "raid-ticket":return "レイドチケット";case "halloween-ticket":return "ハロウィンチケット";}
            return Data.Equip(id)?.name??Data.items.FirstOrDefault(i=>i.id==id)?.name??Data.frames.FirstOrDefault(f=>f.id==id)?.name??id;
        }
        void ShowGiftChoices(Action<string> select)
        {
            var choices=Data.items.Select(i=>i.id).Concat(GiftTickets).Concat(Data.equipment.Select(e=>e.id)).Concat(Data.frames.Select(f=>f.id)).Distinct().ToArray();
            var overlay=Box(screen,"Choose present",0,0,1280,800,new Color(0,0,0,.9f));Label(overlay,"プレゼントの景品を選ぶ",100,35,1080,70,32,gold);
            var list=Scroll(overlay,100,130,1080,540,Mathf.Ceil(choices.Length/6f)*175);
            for(int i=0;i<choices.Length;i++)
            {
                string id=choices[i];string kind=GiftTickets.Contains(id)?"ticket":Data.Equip(id)!=null?"equip":Data.frames.Any(f=>f.id==id)?"decoration":"item";
                var b=Button(list,"",i%6*178,i/6*175,166,162,()=>{select(id);Destroy(overlay.gameObject);});Picture(b.transform,RewardImage(kind,id),35,8,96,96);Label(b.transform,GiftChoiceName(id),8,108,150,48,17,gold,TextAnchor.MiddleCenter);
            }
            Button(overlay,"やめる",440,710,400,60,()=>Destroy(overlay.gameObject));
        }
    }
}
