using System;
using System.Collections.Generic;
using System.Linq;
namespace LegendHeroes
{
    public class EventEnemy { public int slot,spawnId,monster,hp,maxHp,atk,def,number; public bool boss; }
    public sealed class EventCombat
    {
        public readonly Content data;public readonly PlayerSave save;public readonly bool timed,kanji,season2,test;public readonly int stage;public readonly string operation;public readonly string selectionMode;
        public readonly List<EventEnemy> enemies=new List<EventEnemy>();public readonly List<int> selected=new List<int>();
        readonly Random random;readonly QuestionGenerator questions;readonly DateTimeOffset started;readonly int originalHp,originalMp;int spawnId,normalDropRolls;bool settled,partySkill;
        public Problem problem;public int kills,answers,charge,candy,stageCursor,damageTotal,target;public bool over,won,special;public DateTimeOffset questionAt;
        public EventCombat(Content d,PlayerSave s,bool raid,bool language,bool multi,int stageId,string op,string mode,bool isTest,DateTimeOffset now,int seed=0)
        {data=d;save=s;originalHp=s.hp;originalMp=s.mp;save.Normalize(d);timed=raid;kanji=language;season2=multi;stage=stageId;operation=op;selectionMode=mode;test=isTest||!DropRules.HalloweenActive(now);started=now;random=seed==0?new Random():new Random(seed);questions=new QuestionGenerator(d,random);stageCursor=raid?Math.Max(0,(kanji?s.kanjiRaidLastStage:s.raidLastStage)-2):s.halloweenClears;for(int i=0;i<(timed?7:season2?10:1);i++)enemies.Add(Spawn(i));Next(now);}
        public double Remaining(DateTimeOffset now)=>timed?Math.Max(0,120-(now-started).TotalSeconds):Math.Max(0,30-(now-questionAt).TotalSeconds);
        EventEnemy Spawn(int slot,bool finalBoss=false)
        {
            bool boss=!timed&&(!season2?kills>=7:finalBoss);double growth=season2?1:Math.Pow(1.1,save.halloweenClears),grade=season2?stage==0?1:stage==1?1.2:1.5:1;
            int hp=timed?10+kills*5:BattleRun.Round(((boss?32:8)+grade*(boss?14:4))*growth);
            return new EventEnemy{slot=slot,spawnId=spawnId++,monster=boss?7:random.Next(7),boss=boss,hp=hp,maxHp=hp,atk=timed?2+kills:Math.Max(1,BattleRun.Round((boss?3+grade*3:grade*2)*growth)),def=timed?kills:boss?Math.Max(1,BattleRun.Round(grade*growth)):0};
        }
        void Next(DateTimeOffset now)
        {
            questionAt=now;selected.Clear();
            if(season2){int a=random.Next(2,10),b=random.Next(2,10);if(operation=="sub"&&a<=b)a+=b;if(operation=="div")a*=b;target=Calculate(a,b);bool combine=selectionMode=="combine"||selectionMode=="mixed"&&answers%2==1;var slots=enemies.OrderBy(e=>random.Next()).ToArray();var used=new HashSet<int>{target};for(int i=0;i<slots.Length;i++){int value=combine?(i==0?a:i==1?b:random.Next(1,13)):target;if(!combine&&i>0){value=random.Next(1,31);while(used.Contains(value))value++;used.Add(value);}slots[i].number=value;}problem=new Problem{text=combine?"2体の数字を順に選んで "+Symbol+" で "+target+" をつくる":a+" "+Symbol+" "+b+" = ?",answer=target.ToString()};return;}
            string[] ids=kanji?new[]{"area5","area6","area7","area8","area9","area10"}:new[]{"area1","area13","area2","area3","area4","area11","area12"};var catalog=ids.SelectMany(id=>data.areas.First(a=>a.id==id).stages.Select((s,i)=>new{area=data.areas.First(a=>a.id==id),index=i})).ToArray();int n=Math.Min(catalog.Length-1,stageCursor+(timed?answers/5:0));var source=catalog[n];problem=questions.Stage(source.area,source.index);
        }
        int Calculate(int a,int b)=>operation=="sub"?a-b:operation=="mul"?a*b:operation=="div"&&b!=0?a/b:a+b;
        public string Symbol=>operation=="sub"?"−":operation=="mul"?"×":operation=="div"?"÷":"＋";
        public bool Combine=>selectionMode=="combine"||selectionMode=="mixed"&&answers%2==1;
        public bool SelectPartySkill()
        {
            if(over||!season2||partySkill||save.mp<5)return false;partySkill=true;return true;
        }
        public bool Select(int slot,DateTimeOffset now)
        {
            if(over||!season2)return false;
            var enemy=enemies.FirstOrDefault(e=>e.slot==slot&&e.hp>0);if(enemy==null)return false;
            if(!Combine){selected.Clear();selected.Add(slot);return AnswerInternal(enemy.number==target,now);}
            if(selected.Contains(slot)){selected.Remove(slot);return true;}
            selected.Add(slot);if(selected.Count<2)return true;
            int a=enemies.First(e=>e.slot==selected[0]).number,b=enemies.First(e=>e.slot==selected[1]).number;
            return AnswerInternal((operation!="div"||b!=0&&a%b==0)&&Calculate(a,b)==target,now);
        }
        public bool Answer(string text,DateTimeOffset now)=>season2?false:AnswerInternal(problem.Accepts(text),now);
        public bool Timeout(DateTimeOffset now)
        {
            if(timed&&Remaining(now)<=0){End(now);return true;}
            AnswerInternal(false,now,false);return false;
        }
        bool AnswerInternal(bool correct,DateTimeOffset now,bool submitted=true)
        {
            if(over)return false;
            if(timed&&Remaining(now)<=0){End(now);return false;}
            if(submitted||timed)answers++;
            if(!test)StudyRules.Record(save,problem,correct,(int)(now-questionAt).TotalMilliseconds);
            bool allTargets=partySkill;partySkill=false;if(allTargets)save.mp=Math.Max(0,save.mp-5);
            if(correct)
            {
                special=timed&&charge>=5;charge=special?0:charge+1;
                int count=timed?(special?7:(now-questionAt).TotalSeconds<=10?4:(now-questionAt).TotalSeconds<=20?3:2):1;
                var boss=enemies.FirstOrDefault(e=>e.boss&&e.hp>0);
                var targets=season2?(allTargets?enemies.Where(e=>e.hp>0):boss!=null?new[]{boss}:enemies.Where(e=>e.hp>0&&selected.Contains(e.slot))):enemies.Where(e=>e.hp>0).OrderBy(_=>random.Next()).Take(count);
                foreach(var enemy in targets.ToArray())
                {
                    int atk=BattleRun.Round(save.Stat(data,"atk")*(save.HasAbility(data,"power")?1.15:1));
                    int hit=Math.Max(1,BattleRun.Round(save.HasAncient("anc_w1")?Math.Max(atk*.8*.3,atk*.8-enemy.def)*2:Math.Max(atk*.3,atk-enemy.def)));
                    if(random.NextDouble()<Math.Min(.95,BattleRun.SpeedRate(save.Stat(data,"spd"))+(save.HasAbility(data,"crit_up")?.1:0)+(save.HasAncient("anc_w3")?.3:0)))hit*=2;
                    if(season2&&enemy.boss)hit=enemy.hp;
                    damageTotal+=Math.Min(hit,enemy.hp);enemy.hp=Math.Max(0,enemy.hp-hit);
                    if(save.HasAbility(data,"lifesteal"))save.hp=Math.Min(save.Stat(data,"hp"),save.hp+Math.Max(1,BattleRun.Round(hit*.15)));
                    if(enemy.hp==0){kills++;if(timed){candy+=2;if(!test)save.halloweenCandy+=2;}else RewardEnemy(enemy);}
                }
                if(season2&&boss!=null&&boss.hp==0){won=true;End(now);return true;}
                if(!timed&&!season2&&enemies.All(e=>e.hp==0))
                {
                    if(kills>=8){won=true;End(now);return true;}
                    enemies.Clear();enemies.Add(Spawn(0));
                }
                if(timed||season2)for(int i=0;i<enemies.Count;i++)if(enemies[i].hp<=0)enemies[i]=Spawn(i);
            }
            else
            {
                var attackers=season2?enemies.Where(e=>e.hp>0):enemies.Where(e=>e.hp>0).Take(1);
                foreach(var enemy in attackers)
                {
                    if(random.NextDouble()<BattleRun.SpeedRate(save.Stat(data,"spd"))+(save.HasAbility(data,"dodge_up")?.08:0))continue;
                    int hurt=Math.Max(1,BattleRun.Round(enemy.atk*2.25)-save.Stat(data,"def"));
                    if(save.HasAbility(data,"guard"))hurt=Math.Max(1,BattleRun.Round(hurt*.95));
                    if(save.HasAncient("anc_a2"))hurt=Math.Max(1,BattleRun.Round(hurt*.7));
                    save.hp=Math.Max(0,save.hp-hurt);if(save.hp==0){End(now);return false;}
                }
            }
            if(season2&&answers>=4&&!enemies.Any(e=>e.boss))enemies[enemies.Count-1]=Spawn(enemies.Count-1,true);
            Next(now);return correct;
        }
        void RewardEnemy(EventEnemy enemy)
        {
            if(test)return;
            // Season 2 has more targets, but keeps the original five drop opportunities.
            if(season2&&!enemy.boss&&normalDropRolls++>=4)return;
            int amount=enemy.boss?random.Next(3,5):random.NextDouble()<.95?random.Next(1,3):0;
            save.halloweenCandy+=amount;candy+=amount;
            if(random.NextDouble()<(enemy.boss?.25:.05))save.halloweenTickets++;
            save.gold+=random.Next(2,enemy.boss?13:6);
            save.GrantExp(data,enemy.boss?12:5);
        }
        public void End(DateTimeOffset now)
        {
            if(settled)return;over=true;settled=true;if(test){save.hp=originalHp;save.mp=originalMp;return;}
            if(timed){if(kanji){save.kanjiEventBest=Math.Max(save.kanjiEventBest,kills);save.kanjiEventTotal+=kills;save.kanjiRaidLastStage=stageCursor+answers/5;}else{save.eventBest=Math.Max(save.eventBest,kills);save.eventTotal+=kills;save.raidLastStage=stageCursor+answers/5;}
                string day=started.ToOffset(TimeSpan.FromHours(9)).ToString("yyyy-MM-dd"),key=day;if(!save.claims.Contains("participation:"+key)){save.claims.Add("participation:"+key);save.halloweenCandy+=2;candy+=2;}
                foreach(var b in data.eventBonuses){string id="bonus:"+b.kills;if(kills<b.kills||save.claims.Contains(id))continue;save.claims.Add(id);save.halloweenCandy+=b.candy;candy+=b.candy;save.halloweenTickets+=b.halloweenTickets;save.skinGachaTickets+=b.skinGachaTickets;save.equipGachaTenPullTickets+=b.equipGachaTenPullTickets;save.AddItem("cost_seed",b.costSeeds);}
            }else if(won){if(season2)save.season2Clears[Math.Max(0,Math.Min(2,stage))]++;else{save.halloweenClears++;if(!save.claims.Contains("halloween:first-clear")){save.claims.Add("halloween:first-clear");save.raidTickets+=2;}}}
        }
    }
}
