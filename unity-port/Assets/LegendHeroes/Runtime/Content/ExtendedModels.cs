using System;
namespace LegendHeroes
{
    [Serializable] public class Skill { public string id,name,image,zone,desc,fixedTier; public int mp,trainReq,reqLvl; public float dmgMult,healPct; public bool ignoreDef; }
    public static class SkillRules { public static string Tier(Skill skill)=>!string.IsNullOrEmpty(skill.fixedTier)?skill.fixedTier:skill.zone=="tower"?"add1":skill.zone=="dungeon"?"sub1":skill.zone=="crypt"?"add2":"add3"; }
    [Serializable] public class Prize { public string id,kind,name,ability; public int cost,rarity; }
    [Serializable] public class OwnedEquipment { public int uid,rarity=1; public string id,ability; }
    [Serializable] public class ItemStack { public string id; public int count; }
    [Serializable] public class LearnedSkill { public string id; public int progress; public bool learned; }
    [Serializable] public class EventBonus { public int kills,candy,halloweenTickets,costSeeds,skinGachaTickets,equipGachaTenPullTickets; }
    [Serializable] public class Gift { public string id,message,replacesGiftId; public int gold; public bool recallOriginal,fromCloud; public GiftItem[] items; }
    [Serializable] public class GiftDebt { public string id;public int gold; }
    [Serializable] public class GiftItem { public string id,kind,ability; public int count,rarity; }
}
