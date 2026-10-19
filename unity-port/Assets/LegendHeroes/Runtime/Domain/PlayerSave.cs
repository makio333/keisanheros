using System;
using System.Collections.Generic;
using System.Linq;
namespace LegendHeroes
{
    [Serializable] public class ClearRecord { public string key; public int count; }
    [Serializable] public partial class PlayerSave
    {
        public long updatedAt,cloudRevision;
        public bool isTestMode;
        public bool avatarHolographic,backgroundHolographic;
        public StudyStats study=new StudyStats();
        public string currentRaidBossId="boss_50";public PickupStage pickup;public List<StudyRow> raidLearning=new List<StudyRow>();
        public int schemaVersion=2,level=1,exp,gold,hp=30,mp=10,points,costPlus,nextUid=2;
        public int baseHp=30,baseMp=10,baseAtk=5,baseDef=3,baseSpd=6;
        public int allocatedHp,allocatedMp,allocatedAtk,allocatedDef,allocatedSpd;
        public string playerName="ぼうけんしゃ",avatar="ai_hero_alchemist",background="default",frame="",weapon="",armor="a1",accessory="",slotKey="";
        public int weaponUid,armorUid=1,accessoryUid;
        public List<string> owned=new List<string>{"a1"},skins=new List<string>(),backgrounds=new List<string>{"default"},frames=new List<string>();
        public List<OwnedEquipment> ownedEquips=new List<OwnedEquipment>();
        public List<ItemStack> items=new List<ItemStack>();
        public List<LearnedSkill> skills=new List<LearnedSkill>();
        public List<ClearRecord> clears=new List<ClearRecord>();
        public List<ClearRecord> bossLevels=new List<ClearRecord>();
        public List<ClearRecord> dropOpportunities=new List<ClearRecord>();
        public List<string> claims=new List<string>(),holoSkins=new List<string>(),holoBackgrounds=new List<string>();
        public int raidCoins,raidTickets,halloweenCandy,halloweenTickets,skinGachaTickets,equipGachaTenPullTickets,questMedals,halloweenClears,raidLastStage,kanjiRaidLastStage,eventBest,eventTotal,kanjiEventBest,kanjiEventTotal;
        public string lastParticipationDay="",lastKanjiParticipationDay="",webSourceJson="";
        public List<PendingRaidEvent> pendingRuns=new List<PendingRaidEvent>();
        public List<Gift> pendingGifts=new List<Gift>();
        public List<GiftDebt> giftDebts=new List<GiftDebt>();
        public List<string> recalledGifts=new List<string>();
        public List<PrintSheet> prints=new List<PrintSheet>();
        public List<StoryQuest> quests=new List<StoryQuest>();
        public int[] season2Clears=new int[3];
        public void Normalize(Content data)
        {
            if(owned==null)owned=new List<string>{"a1"};if(skins==null)skins=new List<string>();if(backgrounds==null)backgrounds=new List<string>{"default"};if(frames==null)frames=new List<string>();
            if(items==null)items=new List<ItemStack>();if(skills==null)skills=new List<LearnedSkill>();if(clears==null)clears=new List<ClearRecord>();if(claims==null)claims=new List<string>();
            if(holoSkins==null)holoSkins=new List<string>();if(holoBackgrounds==null)holoBackgrounds=new List<string>();if(pendingRuns==null)pendingRuns=new List<PendingRaidEvent>();if(pendingGifts==null)pendingGifts=new List<Gift>();
            if(prints==null)prints=new List<PrintSheet>();if(quests==null)quests=new List<StoryQuest>();if(giftDebts==null)giftDebts=new List<GiftDebt>();if(recalledGifts==null)recalledGifts=new List<string>();
            if(bossLevels==null)bossLevels=new List<ClearRecord>();
            if(dropOpportunities==null)dropOpportunities=new List<ClearRecord>();
            if(raidLearning==null)raidLearning=new List<StudyRow>();
            if(season2Clears==null)season2Clears=new int[3];else if(season2Clears.Length!=3)Array.Resize(ref season2Clears,3);
            if(study==null)study=new StudyStats();if(study.units==null)study.units=new List<StudyRow>();if(study.stages==null)study.stages=new List<StudyRow>();if(study.words==null)study.words=new List<StudyRow>();
            foreach(var row in study.units.Concat(study.stages).Concat(study.words))if(row.history==null)row.history=new List<StudySample>();
            if(ownedEquips==null)ownedEquips=new List<OwnedEquipment>();
            if(ownedEquips.Count==0)foreach(string id in owned.Distinct())ownedEquips.Add(new OwnedEquipment{uid=nextUid++,id=id,rarity=1,ability=data.Equip(id)?.ability});
            if(!ownedEquips.Any(e=>e.uid==armorUid)){armorUid=ownedEquips.FirstOrDefault(e=>e.id==armor)?.uid??0;}
            if(weaponUid==0)weaponUid=ownedEquips.FirstOrDefault(e=>e.id==weapon)?.uid??0;
            if(accessoryUid==0)accessoryUid=ownedEquips.FirstOrDefault(e=>e.id==accessory)?.uid??0;
            nextUid=Math.Max(nextUid,ownedEquips.Select(e=>e.uid).DefaultIfEmpty(0).Max()+1);
            foreach(var e in ownedEquips){e.rarity=Math.Max(1,Math.Min(6,e.rarity));if(string.IsNullOrEmpty(e.ability))e.ability=data.Equip(e.id)?.ability;}
            schemaVersion=2;
        }
        public bool Owns(string id)=>ownedEquips.Any(e=>e.id==id)||owned.Contains(id);
        public OwnedEquipment Owned(int uid)=>ownedEquips.FirstOrDefault(e=>e.uid==uid);
        public IEnumerable<OwnedEquipment> Equipped()=>new[]{Owned(weaponUid),Owned(armorUid),Owned(accessoryUid)}.Where(e=>e!=null);
        public int ClearCount(string key)=>clears.Find(c=>c.key==key)?.count??0;
        public int BossLevel(string areaId)=>bossLevels.FirstOrDefault(b=>b.key==areaId)?.count??ClearCount(areaId+":boss");
        public void Clear(string key){var r=clears.Find(c=>c.key==key);if(r==null)clears.Add(new ClearRecord{key=key,count=1});else r.count++;}
        public static double RarityMultiplier(int rarity)=>new[]{1.0,1,1.5,2,3,4.2,5.5}[Math.Max(1,Math.Min(6,rarity))];
        public static int EquipCost(Equipment e,int rarity)=>e==null?0:e.fixedCost||e.id.StartsWith("anc_")?Math.Max(1,e.cost):Math.Max(1,(int)Math.Ceiling(e.cost*RarityMultiplier(rarity)));
        public int Stat(Content data,string type)
        {
            int n=type=="hp"?baseHp+allocatedHp:type=="mp"?baseMp+allocatedMp:type=="atk"?baseAtk+allocatedAtk:type=="def"?baseDef+allocatedDef:baseSpd+allocatedSpd;
            foreach(var item in Equipped()){var s=data.Equip(item.id)?.stat;if(s==null)continue;double value=type=="hp"?s.hp:type=="mp"?s.mp:type=="atk"?s.atk:type=="def"?s.def:s.spd;if(value!=0)n+=Math.Max(1,(int)Math.Floor(value*RarityMultiplier(item.rarity)));if(item.id=="anc_c1"&&type=="mp")n+=100;if(item.id=="anc_w2"&&type=="spd")n+=30;}
            return Math.Max(0,n);
        }
        public bool HasAbility(Content data,string ability)=>Equipped().Any(e=>(e.ability??data.Equip(e.id)?.ability)==ability);
        public bool HasAncient(string id)=>Equipped().Any(e=>e.id==id);
        public int UsedCost(Content data)=>Equipped().Sum(e=>EquipCost(data.Equip(e.id),e.rarity));
        public int MaxCost=>Math.Max(1,level)+costPlus;
        public bool TryEquip(Content data,string id){Normalize(data);var e=ownedEquips.FirstOrDefault(x=>x.id==id);return e!=null&&TryEquip(data,e.uid);}
        public bool TryEquip(Content data,int uid)
        {
            if(!CanEquip(data,uid))return false;
            var ownedItem=Owned(uid);var item=data.Equip(ownedItem?.id);if(item==null)return false;
            int oldUid=item.slot=="weapon"?weaponUid:item.slot=="armor"?armorUid:accessoryUid;var old=Owned(oldUid);
            if(UsedCost(data)-(old==null?0:EquipCost(data.Equip(old.id),old.rarity))+EquipCost(item,ownedItem.rarity)>MaxCost)return false;
            if(item.slot=="weapon"){weaponUid=uid;weapon=item.id;}else if(item.slot=="armor"){armorUid=uid;armor=item.id;}else{accessoryUid=uid;accessory=item.id;}
            hp=Math.Min(hp,Stat(data,"hp"));mp=Math.Min(mp,Stat(data,"mp"));return true;
        }
        public bool CanEquip(Content data,int uid)
        {
            var ownedItem=Owned(uid);var item=data.Equip(ownedItem?.id);if(item==null)return false;
            int previous=item.slot=="weapon"?weaponUid:item.slot=="armor"?armorUid:accessoryUid;var old=Owned(previous);
            return UsedCost(data)-(old==null?0:EquipCost(data.Equip(old.id),old.rarity))+EquipCost(item,ownedItem.rarity)<=MaxCost;
        }
        public void Unequip(string slot){if(slot=="weapon"){weaponUid=0;weapon="";}else if(slot=="armor"){armorUid=0;armor="";}else{accessoryUid=0;accessory="";}}
        public OwnedEquipment AddEquipment(Content data,string id,int rarity=1,string ability=null)
        {if(data.Equip(id)==null)return null;var fixedAbility=data.Equip(id).ability;var e=new OwnedEquipment{uid=nextUid++,id=id,rarity=rarity,ability=string.IsNullOrEmpty(fixedAbility)?ability:fixedAbility};ownedEquips.Add(e);if(!owned.Contains(id))owned.Add(id);return e;}
        public bool TryBuy(Content data,string id){var e=data.Equip(id);if(e==null||e.price<=0||gold<e.price)return false;gold-=e.price;AddEquipment(data,id);return true;}
        public bool TryBuyItem(Content data,string id){var item=data.items.FirstOrDefault(e=>e.id==id);if(item==null||item.price<=0||gold<item.price)return false;gold-=item.price;AddItem(id);return true;}
        public int ItemCount(string id)=>items.FirstOrDefault(i=>i.id==id)?.count??0;
        public void AddItem(string id,int count=1){var e=items.FirstOrDefault(i=>i.id==id);if(e==null)items.Add(new ItemStack{id=id,count=Math.Max(0,count)});else e.count=Math.Max(0,e.count+count);items.RemoveAll(i=>i.count<=0);}
        public static int ExpNext(int level)=>(int)Math.Floor(18*Math.Pow(level,1.4)+.5);
        public void GrantExp(Content data,int amount){exp+=Math.Max(0,amount);while(exp>=ExpNext(level)){exp-=ExpNext(level);level++;points+=3;baseHp+=4;baseMp+=2;hp=Stat(data,"hp");mp=Stat(data,"mp");}}
        public bool Allocate(string stat){if(points<=0)return false;switch(stat){case "hp":allocatedHp+=6;hp+=6;break;case "mp":allocatedMp+=4;mp+=4;break;case "atk":allocatedAtk++;break;case "def":allocatedDef++;break;case "spd":allocatedSpd++;break;default:return false;}points--;return true;}
        public bool UseItem(Content data,string id)
        {
            var item=data.items.FirstOrDefault(i=>i.id==id);if(item==null||ItemCount(id)<=0)return false;
            switch(item.effect){case "heal":if(hp>=Stat(data,"hp"))return false;hp=Math.Min(Stat(data,"hp"),hp+item.value);break;case "mana":if(mp>=Stat(data,"mp"))return false;mp=Math.Min(Stat(data,"mp"),mp+item.value);break;case "cost":costPlus++;break;case "respec":int sum=allocatedHp/6+allocatedMp/4+allocatedAtk+allocatedDef+allocatedSpd;if(sum==0)return false;points+=sum;allocatedHp=allocatedMp=allocatedAtk=allocatedDef=allocatedSpd=0;hp=Stat(data,"hp");mp=Stat(data,"mp");break;default:return false;}AddItem(id,-1);return true;
        }
        public OwnedEquipment Synthesize(Content data,int baseId,int materialId,Random random)
        {
            var a=Owned(baseId);var b=Owned(materialId);if(a==null||b==null||a==b||a.id!=b.id||a.rarity!=b.rarity||a.rarity>=5)return null;
            int rarity=a.rarity+1;string id=a.id;ownedEquips.Remove(a);ownedEquips.Remove(b);foreach(string slot in new[]{"weapon","armor","accessory"}){int uid=slot=="weapon"?weaponUid:slot=="armor"?armorUid:accessoryUid;if(uid==baseId||uid==materialId)Unequip(slot);}return AddEquipment(data,id,rarity,EconomyRules.RollAbility(rarity,random));
        }
        public bool StageUnlocked(Area area,int index)=>index==0||ClearCount(area.id+":"+(index-1))>=3;
        public bool BossUnlocked(Area area)=>ClearCount(area.id+":"+(area.stages.Length-1))>=3;
        public LearnedSkill SkillState(string id){var s=skills.FirstOrDefault(x=>x.id==id);if(s==null){s=new LearnedSkill{id=id};skills.Add(s);}return s;}
    }
}
