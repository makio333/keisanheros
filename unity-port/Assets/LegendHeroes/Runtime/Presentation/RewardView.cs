using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

namespace LegendHeroes
{
    public partial class LegendGame
    {
        string RewardName(RewardEntry reward)
        {
            if(reward.kind=="equip")return Data.Equip(reward.id)?.name??reward.id;
            switch(reward.id){case "halloween-candy":return "ハロウィンのお菓子";case "skin-ticket":return "背景・キャラ券";case "raid-ticket":return "レイド券";case "equip-ten-ticket":return "装備10連券";case "halloween-ticket":return "ハロウィン券";}
            return Data.items.FirstOrDefault(i=>i.id==reward.id)?.name??reward.id;
        }
        void RewardGrid(Transform parent,IEnumerable<RewardEntry> rewards,float x,float y,float width,float height,int columns=6)
        {
            var grouped=new List<RewardEntry>();foreach(var e in rewards)RewardEntry.Add(grouped,e.kind,e.id,e.count,e.rarity,e.ability);
            float cell=width/columns;var list=Scroll(parent,x,y,width,height,Math.Max(height,Mathf.Ceil(grouped.Count/(float)columns)*160));
            for(int i=0;i<grouped.Count;i++)
            {
                var reward=grouped[i];string title=RewardName(reward),image=RewardImage(reward.kind,reward.id);
                var button=Button(list,"",i%columns*cell+4,i/columns*160+3,cell-8,150,()=>ArtworkDetail(title,image,reward.rarity>0?"★"+reward.rarity+" "+AbilityName(reward.ability):"×"+reward.count));
                Picture(button.transform,image,(cell-100)/2,6,92,85);Label(button.transform,title,6,91,cell-20,38,16,gold,TextAnchor.MiddleCenter);Label(button.transform,"×"+reward.count+(reward.rarity>0?"  ★"+reward.rarity:""),6,129,cell-20,22,17,null,TextAnchor.MiddleCenter);
            }
            if(grouped.Count==0)Label(list,"今回の獲得アイテムはありません。",20,20,width-40,80,24);
        }
    }
}
