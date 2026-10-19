using System.Linq;
using UnityEngine;

namespace LegendHeroes
{
    public partial class LegendGame
    {
        void ShowReviewOffer(PickupStage review)
        {
            var area=Data.areas.First(a=>a.id==review.areaId);var settings=Data.rewardSettings??new RewardSettings();
            var overlay=Box(screen,"Review",0,0,1280,800,new Color(0,0,0,.85f));var card=Box(overlay,"Challenge",220,130,840,540);
            Label(card,"復習チャレンジ",30,20,780,70,38,gold,TextAnchor.MiddleCenter);Label(card,area.name+" / "+area.stages[review.stageIndex].name+"\n"+review.reason,40,120,760,150,27);
            Label(card,"クリアで10連券 ×"+settings.pickupBonusTickets+"\nレイド券 ×"+settings.pickupBonusRaidTickets+"　"+settings.pickupBonusGold+" G",40,280,760,120,29,gold,TextAnchor.MiddleCenter);
            Button(card,"今はしない",35,430,360,70,()=>{review.status="declined";Persist();Destroy(overlay.gameObject);ShowHome();});
            Button(card,"このステージに挑戦",435,430,370,70,()=>StartBattle(area,review.stageIndex),true);
        }
    }
}
