using System;
using System.Collections.Generic;
using System.Linq;

namespace LegendHeroes
{
    [Serializable] public class RewardEntry
    {
        public string kind,id,ability;public int count,rarity;
        public static void Add(List<RewardEntry> entries,string kind,string id,int count=1,int rarity=0,string ability=null)
        {
            if(count<=0)return;
            var entry=entries.FirstOrDefault(e=>e.kind==kind&&e.id==id&&e.rarity==rarity&&e.ability==ability);
            if(entry==null)entries.Add(new RewardEntry{kind=kind,id=id,count=count,rarity=rarity,ability=ability});else entry.count+=count;
        }
    }
}
