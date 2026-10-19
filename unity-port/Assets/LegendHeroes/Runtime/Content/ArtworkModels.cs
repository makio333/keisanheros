using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using UnityEngine;

namespace LegendHeroes
{
    [Serializable] public class Stats { public double atk, def, hp, mp, spd; }
    [Serializable] public class Artwork { public string id, name, image, gender, desc, rewardSource; public bool gachaOnly; }
    [Serializable] public class Equipment { public string id, name, slot, image, ability, opTier,pool; public Stats stat; public int cost, price; public bool fixedCost, assist; }
    [Serializable] public class Item { public string id, name, image, effect, desc,opTier; public int value, price; }
}
