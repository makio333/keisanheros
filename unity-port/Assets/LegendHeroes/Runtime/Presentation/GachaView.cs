using System;
using System.Linq;
using UnityEngine;
namespace LegendHeroes
{
    public partial class LegendGame
    {
        string RewardImage(string kind,string id)
        {
            if(id=="halloween-candy")return "assets/halloween/candy_token.png";
            if(kind=="equip")return Data.Equip(id)?.image;
            if(kind=="skin"||kind=="character"||kind=="holo-skin")return Data.avatars.FirstOrDefault(a=>a.id==id)?.image;
            if(kind=="background"||kind=="holo-background")return Data.backgrounds.FirstOrDefault(a=>a.id==id)?.image;
            if(kind=="decoration")return Data.frames.FirstOrDefault(a=>a.id==id)?.image;
            if(id=="skin-ticket")return "assets/items/background_skin_ticket.png";if(id=="raid-ticket")return "assets/raid/raid_ticket_pixel.png";if(id=="halloween-ticket")return "assets/halloween/ticket_icon.png";if(id=="equip-ten-ticket")return "assets/items/background_skin_ticket.png";
            return Data.items.FirstOrDefault(a=>a.id==id)?.image;
        }
        void ShowGacha(string tab)
        {
            Begin("gacha","ガチャ",tab=="ハロウィン"?"assets/halloween/background_haunted_ballroom.png":Data.homeImage,ShowFeatureMenu);
            Picture(screen,tab=="ハロウィン"?"assets/halloween/gacha_logo.png":tab=="装備"?"assets/ui/equipment_gacha_logo.png":"assets/ui/background_skin_gacha_logo.png",430,2,420,76);
            string[] tabs={"装備","背景・キャラ","ハロウィン"};for(int i=0;i<tabs.Length;i++){string id=tabs[i];Button(screen,id,35+i*407,100,392,55,()=>ShowGacha(id),id==tab);}
            if(tab=="装備")
            {
                Label(screen,"1回150 G / 6回750 G / 13回1,400 G   10連券 ×"+Save.equipGachaTenPullTickets,40,165,1180,55,25,gold);
                Button(screen,"1回引く",40,230,280,65,()=>DrawEquipment(1,false),true);Button(screen,"6回引く",345,230,280,65,()=>DrawEquipment(6,false),true);Button(screen,"13回引く",650,230,280,65,()=>DrawEquipment(13,false),true);Button(screen,"10連券で引く",955,230,280,65,()=>DrawEquipment(10,true),true);
                var entries=Data.equipment.Where(e=>e.price>0&&!e.assist).ToArray();var list=Scroll(screen,35,320,1210,430,Mathf.Ceil(entries.Length/8f)*150);for(int i=0;i<entries.Length;i++){var e=entries[i];var b=Button(list,"",i%8*150,i/8*150,138,138,()=>ArtworkDetail(e.name,e.image,"★3 9% / ★4 0.7% / ★5 0.3%"));Picture(b.transform,e.image,24,8,90,90);Label(b.transform,e.name,4,100,130,35,16,gold,TextAnchor.MiddleCenter);}
            }
            else
            {
                bool halloween=tab=="ハロウィン";int tickets=halloween?Save.halloweenTickets:Save.skinGachaTickets;Label(screen,"チケット ×"+tickets+"   未所持の景品から抽選・重複なし",40,165,1180,55,25,gold);
                Button(screen,halloween?"2,000 Gで引く":"1,000 Gで引く",40,230,580,65,()=>DrawPrize(halloween,false),true);Button(screen,"チケットで引く",650,230,590,65,()=>DrawPrize(halloween,true),true);
                var prizes=halloween?Data.halloweenGacha:Data.avatars.Where(a=>string.IsNullOrEmpty(a.rewardSource)).Select(a=>new Prize{id=a.id,kind="skin",name=a.name}).Concat(Data.backgrounds.Where(a=>!string.IsNullOrEmpty(a.image)&&string.IsNullOrEmpty(a.rewardSource)).Select(a=>new Prize{id=a.id,kind="background",name=a.name})).ToArray();PrizeGrid(prizes,320,430,false,false);
            }
        }
        void DrawEquipment(int count,bool ticket)
        {
            var results=EconomyRules.DrawEquipment(Data,Save,count,ticket,gameRandom);if(results==null){Notice("引けません","ゴールドかチケットが足りません。");return;}Persist();ShowGacha("装備");Reveal(results.Select(e=>new Prize{id=e.id,name=Data.Equip(e.id).name,kind="equip",rarity=e.rarity}).ToArray());
        }
        void DrawPrize(bool halloween,bool ticket)
        {
            var prize=halloween?EconomyRules.DrawHalloween(Data,Save,ticket,gameRandom):EconomyRules.DrawSkin(Data,Save,ticket,gameRandom);if(prize==null){Notice("引けません","残高・チケット、未所持の景品を確認してください。");return;}Persist();ShowGacha(halloween?"ハロウィン":"背景・キャラ");Reveal(new[]{prize});
        }
        void Reveal(Prize[] prizes)
        {
            var overlay=Box(screen,"Summon",0,0,1280,800,new Color(.025f,.01f,.07f,.98f));Label(overlay,"召喚！",40,25,1200,80,48,gold,TextAnchor.MiddleCenter);Play("se_gacha_result",.5f);
            int columns=prizes.Length==1?1:5;float size=prizes.Length==1?330:138;
            for(int i=0;i<prizes.Length;i++){var p=prizes[i];float x=prizes.Length==1?475:140+i%columns*205,y=prizes.Length==1?150:140+i/columns*240;Picture(overlay,RewardImage(p.kind,p.id),x,y,size,size);Label(overlay,p.name+(p.rarity>0?" ★"+p.rarity:""),prizes.Length==1?250:x-20,y+size+8,prizes.Length==1?780:180,70,prizes.Length==1?30:18,gold,TextAnchor.MiddleCenter);}
            Button(overlay,"受け取った！",390,675,500,75,()=>{Destroy(overlay.gameObject);Play("se_gacha_result2",.5f);},true);
        }
        void ArtworkDetail(string title,string image,string desc="")
        {
            var overlay=Box(screen,"Artwork",0,0,1280,800,new Color(0,0,0,.9f));Label(overlay,title,80,25,1120,70,34,gold,TextAnchor.MiddleCenter);Picture(overlay,image,390,120,500,500);Label(overlay,desc,80,620,1120,60,23,null,TextAnchor.MiddleCenter);Button(overlay,"とじる",440,700,400,65,()=>Destroy(overlay.gameObject),true);
        }
        void PrizeGrid(Prize[] prizes,float y,float height,bool exchange,bool raid)
        {
            var list=Scroll(screen,35,y,1210,height,Mathf.Ceil(prizes.Length/6f)*230);
            for(int i=0;i<prizes.Length;i++){var prize=prizes[i];var r=Box(list,"Prize",i%6*200,i/6*230,188,218);string art=RewardImage(prize.kind,prize.id);var imageButton=Button(r,"",43,8,102,100,()=>ArtworkDetail(prize.name,art));Picture(imageButton.transform,art,0,0,102,100);Label(r,prize.name,8,113,172,48,18,gold,TextAnchor.MiddleCenter);
                if(exchange){string key=(raid?"raid:":"halloween:")+prize.id;bool owned=Save.claims.Contains(key);if(raid){Label(r,"●",28,154,32,32,30,gold,TextAnchor.MiddleCenter);Label(r,"R",28,154,32,32,15,ink,TextAnchor.MiddleCenter);}else Picture(r,"assets/halloween/candy_token.png",28,157,28,28);Label(r,"×"+prize.cost,66,156,110,30,20,gold);var b=Button(r,owned?"交換済み":"交換する",8,187,172,28,()=>{if(EconomyRules.Exchange(Data,Save,prize,raid)){Persist();ShowExchange(raid);Reveal(new[]{prize});}},true);b.interactable=!owned&&(raid?Save.raidCoins:Save.halloweenCandy)>=prize.cost;}
                else Label(r,EconomyRules.PrizeOwned(Save,prize)?"獲得済み":prize.kind=="equip"?"装備":prize.kind=="skin"?"キャラ":prize.kind=="background"?"背景":"フレーム",5,167,178,38,18,null,TextAnchor.MiddleCenter);
            }
        }
        void ShowExchange(bool raid)
        {
            Begin("exchange",raid?"レイドコイン交換所":"お菓子交換所",raid?Data.homeImage:"assets/halloween/background_candy_village.png",raid?(Action)ShowRaids:ShowHalloween);Label(screen,raid?"コイン ×"+Save.raidCoins:"お菓子 ×"+Save.halloweenCandy,40,100,1180,65,30,gold);PrizeGrid(raid?Data.raidExchange:Data.halloweenExchange,185,570,true,raid);
        }
    }
}
