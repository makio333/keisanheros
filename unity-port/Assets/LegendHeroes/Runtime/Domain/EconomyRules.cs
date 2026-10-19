using System;
using System.Collections.Generic;
using System.Linq;
namespace LegendHeroes
{
    public static class EconomyRules
    {
        public static string RollAbility(int rarity,Random random)=>rarity<3||rarity==3&&random.NextDouble()>=.5?null:new[]{"crit_up","lifesteal","guard","power","mp_save"}[random.Next(5)];
        public static int RollRarity(Random random){double r=random.NextDouble();return r<.003?5:r<.01?4:r<.1?3:r<.4?2:1;}
        public static List<OwnedEquipment> DrawEquipment(Content d,PlayerSave s,bool ten,bool ticket,Random rng)
            =>DrawEquipment(d,s,ticket?10:ten?13:1,ticket,rng);
        public static List<OwnedEquipment> DrawEquipment(Content d,PlayerSave s,int count,bool ticket,Random rng)
        {
            int cost=count==1?150:count==6?750:count==13?1400:0;
            if(ticket){if(count!=10||s.equipGachaTenPullTickets<=0)return null;}else if(cost==0||s.gold<cost)return null;
            if(ticket)s.equipGachaTenPullTickets--;else s.gold-=cost;var result=new List<OwnedEquipment>();
            for(int i=0;i<count;i++)
            {
                int rarity=RollRarity(rng);
                var standard=d.equipment.Where(e=>e.pool=="standard"&&!e.assist).ToArray();
                var eligible=standard.Where(e=>PlayerSave.EquipCost(e,rarity)<=s.MaxCost).ToArray();
                var limited=d.equipment.Where(e=>e.pool=="limited"&&PlayerSave.EquipCost(e,rarity)<=s.MaxCost).ToArray();
                var pool=limited.Length>0&&rng.NextDouble()<.15?limited:eligible;
                if(pool.Length==0){int minimum=standard.Min(e=>PlayerSave.EquipCost(e,rarity));pool=standard.Where(e=>PlayerSave.EquipCost(e,rarity)==minimum).ToArray();}
                var item=pool[rng.Next(pool.Length)];result.Add(s.AddEquipment(d,item.id,rarity,RollAbility(rarity,rng)));
            }
            return result;
        }
        public static bool PrizeOwned(PlayerSave s,Prize p)=>p.kind=="equip"?s.Owns(p.id):p.kind=="skin"?s.skins.Contains(p.id):p.kind=="background"?s.backgrounds.Contains(p.id):s.frames.Contains(p.id);
        public static void GrantPrize(Content d,PlayerSave s,Prize p)
        {if(p.kind=="equip")s.AddEquipment(d,p.id,Math.Max(1,p.rarity),p.ability??RollAbility(p.rarity,new Random()));else{var list=p.kind=="skin"?s.skins:p.kind=="background"?s.backgrounds:s.frames;if(!list.Contains(p.id))list.Add(p.id);}}
        public static bool Exchange(Content d,PlayerSave s,Prize p,bool raid)
        {string key=(raid?"raid:":"halloween:")+p.id;int balance=raid?s.raidCoins:s.halloweenCandy;if(s.claims.Contains(key)||balance<p.cost)return false;if(raid)s.raidCoins-=p.cost;else s.halloweenCandy-=p.cost;GrantPrize(d,s,p);s.claims.Add(key);return true;}
        public static Prize DrawHalloween(Content d,PlayerSave s,bool ticket,Random random)
        {var remaining=d.halloweenGacha.Where(p=>!PrizeOwned(s,p)).ToArray();if(remaining.Length==0||ticket&&s.halloweenTickets<=0||!ticket&&s.gold<2000)return null;if(ticket)s.halloweenTickets--;else s.gold-=2000;var prize=remaining[random.Next(remaining.Length)];GrantPrize(d,s,prize);return prize;}
        public static Prize DrawSkin(Content d,PlayerSave s,bool ticket,Random random)
        {
            var standard=d.avatars.Where(a=>string.IsNullOrEmpty(a.rewardSource)&&!s.skins.Contains(a.id)).Select(a=>new Prize{id=a.id,kind="skin",name=a.name}).Concat(d.backgrounds.Where(a=>!string.IsNullOrEmpty(a.image)&&string.IsNullOrEmpty(a.rewardSource)&&!s.backgrounds.Contains(a.id)).Select(a=>new Prize{id=a.id,kind="background",name=a.name})).ToArray();
            var holo=d.avatars.Where(a=>string.IsNullOrEmpty(a.rewardSource)&&!s.holoSkins.Contains(a.id)).Select(a=>new Prize{id=a.id,kind="holo-skin",name="ホログラム・"+a.name}).Concat(d.backgrounds.Where(a=>!string.IsNullOrEmpty(a.image)&&string.IsNullOrEmpty(a.rewardSource)&&!s.holoBackgrounds.Contains(a.id)).Select(a=>new Prize{id=a.id,kind="holo-background",name="ホログラム・"+a.name})).ToArray();
            if(standard.Length+holo.Length==0||ticket&&s.skinGachaTickets<=0||!ticket&&s.gold<1000)return null;if(ticket)s.skinGachaTickets--;else s.gold-=1000;var pool=holo.Length>0&&(standard.Length==0||random.NextDouble()<.01)?holo:standard;var p=pool[random.Next(pool.Length)];if(p.kind.StartsWith("holo")){(p.kind=="holo-skin"?s.holoSkins:s.holoBackgrounds).Add(p.id);}else GrantPrize(d,s,p);return p;
        }
        public static bool ReceiveGift(Content d,PlayerSave s,Gift gift)
        {
            if(s.claims.Contains("gift:"+gift.id))return false;
            int amount=Math.Max(0,gift.gold);string original=gift.replacesGiftId;
            if(gift.recallOriginal&&!string.IsNullOrEmpty(original)&&s.claims.Contains("gift:"+original)&&!s.recalledGifts.Contains(original))
            {
                s.giftDebts.Add(new GiftDebt{id=original,gold=Math.Max(0,amount-s.gold)});
                s.gold=Math.Max(0,s.gold-amount);s.recalledGifts.Add(original);
            }
            var debt=s.giftDebts.FirstOrDefault(e=>e.id==original);int withheld=Math.Min(amount,debt?.gold??0);if(debt!=null)debt.gold-=withheld;
            s.gold+=amount-withheld;
            foreach(var i in gift.items??new GiftItem[0]){int n=Math.Max(0,Math.Min(999,i.count));switch(i.kind){case "equip":for(int j=0;j<n;j++)s.AddEquipment(d,i.id,Math.Max(1,i.rarity),i.ability);break;case "decoration":if(!s.frames.Contains(i.id))s.frames.Add(i.id);break;case "medal":s.questMedals+=n;break;case "ticket":if(i.id=="equip-ten-ticket")s.equipGachaTenPullTickets+=n;else if(i.id=="skin-ticket")s.skinGachaTickets+=n;else if(i.id=="raid-ticket")s.raidTickets+=n;else if(i.id=="halloween-ticket")s.halloweenTickets+=n;break;default:s.AddItem(i.id,n);break;}}
            s.claims.Add("gift:"+gift.id);s.pendingGifts.RemoveAll(g=>g.id==gift.id);return true;
        }
        public static int RankCoins(int rank)=>rank==1?50:rank==2?30:rank==3?15:rank>3?5:0;
        public static int ParticipationCoins(int damage)=>(int)Math.Ceiling(Math.Max(0,damage)/4.0);
        public static bool Cheer(PlayerSave save,string target,DateTimeOffset now)
        {
            if(string.IsNullOrEmpty(target)||target==save.slotKey)return false;
            string key="cheer:"+now.UtcDateTime.ToString("yyyy-MM-dd")+":"+target;
            if(save.claims.Contains(key))return false;save.claims.Add(key);save.gold+=50;return true;
        }
    }
}
