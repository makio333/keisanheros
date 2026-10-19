using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using UnityEngine;

namespace LegendHeroes
{
    [Serializable] public class Stage { public int index, timeLimit; public string name, tier; public Problem[] problems; }
    [Serializable] public class Enemy { public string id, name, image; public int hp, atk, def, spd, exp, goldMin, goldMax; }
    [Serializable] public class Area { public string id, name, image, opLabel; public int recLv;public double difficultyOverride; public Stage[] stages; public Enemy[] enemies; public Enemy boss; public int bossTimeLimit1,bossTimeLimit2; public Problem[] bossProblems,bossPhase2Problems; }
    [Serializable] public class KanjiPool { public string tier; public Problem[] problems; }
    [Serializable] public class Content
    {
        public int schemaVersion; public string sourceHash, homeImage; public Artwork[] avatars, backgrounds, frames;
        public Skill[] skills; public Prize[] halloweenGacha,halloweenExchange,raidExchange; public Artwork[] eventMonsters; public EventBonus[] eventBonuses; public Equipment[] equipment; public Item[] items; public Area[] areas; public KanjiPool[] kanjiPools;
        public QuestNpc[] questNpcs;public StoryArc[] storyArcs;public QuestMilestone[] questMilestones;public RewardSettings rewardSettings;
        public static Content Load() => JsonUtility.FromJson<Content>(Resources.Load<TextAsset>("LegendHeroes/Data/content").text);
        public Equipment Equip(string id) => equipment.FirstOrDefault(e => e.id == id);
        public Artwork Avatar(string id) => avatars.FirstOrDefault(a => a.id == id) ?? avatars[0];
    }
}
