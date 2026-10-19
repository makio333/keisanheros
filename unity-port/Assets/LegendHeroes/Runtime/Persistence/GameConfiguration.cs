using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using UnityEngine;

namespace LegendHeroes
{
    [Serializable] public class NumericOverride { public string key;public double value; }
    [Serializable] public class PlayLimit { public string slotKey;public int minutes;public long endsAt; }
    [Serializable] public class GameConfiguration
    {
        public int version=1;public List<NumericOverride> numbers=new List<NumericOverride>();public List<PlayLimit> limits=new List<PlayLimit>();
        public static string PathName=>Path.Combine(Path.GetDirectoryName(LocalSave.PathName),"legend-configuration.json");
        public static GameConfiguration Load()
        {
            foreach(string path in new[]{PathName,PathName+".bak"})try{if(File.Exists(path)){var config=JsonUtility.FromJson<GameConfiguration>(File.ReadAllText(path));if(config?.version==1&&config.numbers!=null&&config.limits!=null)return config;}}catch(Exception){}
            return new GameConfiguration();
        }
        public void Store()
        {
            Directory.CreateDirectory(Path.GetDirectoryName(PathName));File.WriteAllText(PathName+".tmp",JsonUtility.ToJson(this,true));
            if(File.Exists(PathName))File.Replace(PathName+".tmp",PathName,PathName+".bak");else File.Move(PathName+".tmp",PathName);
        }
        public void Set(string key,double value)
        {var item=numbers.FirstOrDefault(n=>n.key==key);if(item==null)numbers.Add(new NumericOverride{key=key,value=value});else item.value=value;Store();}
        public void Apply(Content data)
        {
            foreach(var change in numbers)
            {
                var parts=change.key.Split(':');if(parts.Length!=3)continue;double value=Math.Max(0,Math.Min(1000000,change.value));
                if(parts[0]=="area"){var area=data.areas.FirstOrDefault(a=>a.id==parts[1]);if(area!=null)area.difficultyOverride=Math.Max(.1,value);continue;}
                if(parts[0]=="enemy")
                {
                    foreach(var e in data.areas.SelectMany(a=>a.enemies.Concat(new[]{a.boss})).Where(e=>e.id==parts[1]))SetEnemy(e,parts[2],(int)value);continue;
                }
                if(parts[0]=="equip")
                {
                    var e=data.Equip(parts[1]);if(e==null)continue;
                    if(parts[2]=="cost")e.cost=(int)value;else if(parts[2]=="price")e.price=(int)value;else SetStat(e.stat,parts[2],value);continue;
                }
                if(parts[0]=="item"){var item=data.items.FirstOrDefault(i=>i.id==parts[1]);if(item==null)continue;if(parts[2]=="price")item.price=(int)value;else if(parts[2]=="value")item.value=(int)value;continue;}
                if(parts[0]=="reward")
                {
                    var settings=data.rewardSettings??(data.rewardSettings=new RewardSettings());
                    var field=typeof(RewardSettings).GetField(parts[2]);if(field!=null){if(field.FieldType==typeof(int))field.SetValue(settings,(int)value);else if(field.FieldType==typeof(double))field.SetValue(settings,value);}
                }
            }
        }
        static void SetEnemy(Enemy e,string stat,int value){switch(stat){case "hp":e.hp=Math.Max(1,value);break;case "atk":e.atk=value;break;case "def":e.def=value;break;case "spd":e.spd=value;break;case "exp":e.exp=value;break;case "goldMin":e.goldMin=Math.Min(e.goldMax,value);break;case "goldMax":e.goldMax=Math.Max(e.goldMin,value);break;}}
        static void SetStat(Stats stats,string stat,double value){switch(stat){case "hp":stats.hp=value;break;case "mp":stats.mp=value;break;case "atk":stats.atk=value;break;case "def":stats.def=value;break;case "spd":stats.spd=value;break;}}
        public PlayLimit Limit(string slot)=>limits.FirstOrDefault(l=>l.slotKey==slot);
        public void SetLimit(string slot,int minutes)
        {
            var limit=Limit(slot);if(limit==null){limit=new PlayLimit{slotKey=slot};limits.Add(limit);}limit.minutes=Math.Max(0,Math.Min(240,minutes));limit.endsAt=limit.minutes==0?0:DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()+limit.minutes*60000L;Store();
        }
    }
}
