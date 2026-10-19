using System;
using System.Linq;
using System.Collections.Generic;
namespace LegendHeroes
{
    public class BattleRun
    {
        public readonly Content data; public readonly PlayerSave save; public readonly Area area; public readonly int stageIndex; public readonly bool boss;
        public Enemy enemy; public int enemyHp,maxEnemyHp,kills,gold,exp,correct,mistakes,phase=1; public bool finished,won,lastCrit,lastEvaded;
        public Problem question; public string lastDrop=""; public Skill selectedSkill; readonly Random random; readonly QuestionGenerator generator;
        public string selectedItem;public readonly List<RewardEntry> rewards=new List<RewardEntry>();
        public BattleRun(Content d,PlayerSave s,Area a,int index,bool isBoss=false,int seed=0)
        {data=d;save=s;save.Normalize(d);area=a;stageIndex=index;boss=isBoss;random=seed==0?new Random():new Random(seed);generator=new QuestionGenerator(data,random);Spawn();}
        public static int Round(double n)=>(int)Math.Floor(n+.5);
        public static double SpeedRate(int spd)=>spd<=60?Math.Max(0,spd)*.005:.3+(spd-60)*.001;
        public static double Difficulty(string id){switch(id){case "area13":return 1.5;case "area2":case "area6":return 2;case "area3":case "area7":return 3;case "area4":case "area8":return 4;case "area11":case "area9":return 5;case "area12":case "area10":return 6;default:return 1;}}
        public void Spawn()
        {
            var template=boss?area.boss:area.enemies[random.Next(Math.Min(area.enemies.Length,Math.Max(2,(int)Math.Ceiling(area.enemies.Length*(.4+.6*stageIndex/Math.Max(1.0,area.stages.Length-1))))))];
            double m=1+stageIndex*.05,hpMult=boss?.8:area.id=="area1"?.35+stageIndex*.12:area.id=="area2"||area.id=="area5"?.5+stageIndex*.1:m;
            double difficulty=area.difficultyOverride>0?area.difficultyOverride:Difficulty(area.id),growth=boss?1+save.BossLevel(area.id)*(data.rewardSettings??new RewardSettings()).bossGrowthPct/100.0:1;
            enemy=new Enemy{id=template.id,name=template.name,image=template.image,hp=Math.Max(2,Round(Round(template.hp*hpMult)*difficulty*growth)),atk=Math.Max(1,Round((boss?Round(template.atk*.55):area.id=="area1"&&stageIndex<2?random.Next(1,3):Round(template.atk*m))*difficulty*growth)),def=Round(template.def*(boss?growth:m)),spd=template.spd+stageIndex/2,exp=Round(template.exp*m),goldMin=Round(template.goldMin*m),goldMax=Round(template.goldMax*m)};
            maxEnemyHp=enemyHp=enemy.hp;NextQuestion();
        }
        public void NextQuestion()=>question=generator.Stage(area,stageIndex,boss,phase==2);
        public bool SelectSkill(string id)
        {
            var skill=data.skills.FirstOrDefault(s=>s.id==id);if(skill==null||!save.SkillState(id).learned||selectedSkill!=null||selectedItem!=null)return false;
            int cost=Math.Max(1,skill.mp-(save.HasAbility(data,"mp_save")?1:0));if(save.mp<cost)return false;save.mp-=cost;selectedSkill=skill;question=generator.Tier(SkillRules.Tier(skill));return true;
        }
        public bool SelectItem(string id)
        {
            var item=data.items.FirstOrDefault(i=>i.id==id);if(item==null||selectedSkill!=null||selectedItem!=null||save.ItemCount(id)<=0||item.effect!="heal"&&item.effect!="mana")return false;
            if(item.effect=="heal"&&save.hp>=save.Stat(data,"hp")||item.effect=="mana"&&save.mp>=save.Stat(data,"mp"))return false;
            selectedItem=id;question=generator.Tier(item.opTier);return true;
        }
        public int Answer(string input,double timeFraction=0)
        {
            if(finished)return 0;lastCrit=lastEvaded=false;
            StudyRules.Record(save,question,question.Accepts(input),0,area.id+"_"+(boss?"boss":stageIndex.ToString()),area.name+" / "+(boss?"ボス":area.stages[stageIndex].name));
            if(!question.Accepts(input)){mistakes++;selectedSkill=null;selectedItem=null;int hurt=Counterattack();if(!finished)NextQuestion();return -hurt;}
            correct++;var skill=selectedSkill;selectedSkill=null;
            if(selectedItem!=null){string id=selectedItem;selectedItem=null;save.UseItem(data,id);NextQuestion();return 0;}
            if(skill!=null&&skill.healPct>0){int heal=Round(save.Stat(data,"hp")*skill.healPct);save.hp=Math.Min(save.Stat(data,"hp"),save.hp+heal);NextQuestion();return 0;}
            int atk=Round(save.Stat(data,"atk")*(save.HasAbility(data,"power")?1.15:1));double baseDamage=Math.Max(atk*.3,atk-enemy.def);
            if(skill!=null)baseDamage=Math.Max(baseDamage+1,atk*skill.dmgMult-(skill.ignoreDef?0:enemy.def));
            if(save.HasAncient("anc_w1")&&skill==null)baseDamage=Math.Max(atk*.8*.3,atk*.8-enemy.def)*2;
            lastCrit=random.NextDouble()<Math.Min(.95,SpeedRate(save.Stat(data,"spd"))+(save.HasAbility(data,"crit_up")?.1:0)+(save.HasAncient("anc_w3")?.3:0));
            int damage=Math.Max(1,Round(baseDamage*(1+Math.Max(0,Math.Min(1,timeFraction))*.2)))*(lastCrit?2:1),dealt=Math.Min(enemyHp,damage);
            enemyHp=Math.Max(0,enemyHp-damage);if(save.HasAbility(data,"lifesteal"))save.hp=Math.Min(save.Stat(data,"hp"),save.hp+Math.Max(1,Round(dealt*.15)));
            if(boss&&phase==1&&enemyHp>0&&enemyHp<=maxEnemyHp/2)phase=2;
            if(enemyHp==0){kills++;int coins=random.Next(enemy.goldMin,enemy.goldMax+1);gold+=coins;exp+=enemy.exp;save.gold+=coins;save.GrantExp(data,enemy.exp);RollDrops();if(kills>=(boss?1:5)){finished=won=true;Reward();}else Spawn();}else NextQuestion();return damage;
        }
        int Counterattack()
        {
            if(random.NextDouble()<SpeedRate(save.Stat(data,"spd"))+(save.HasAbility(data,"dodge_up")?.08:0)){lastEvaded=true;return 0;}
            int hurt=Math.Max(1,Round(enemy.atk*2.25)-save.Stat(data,"def"));if(save.HasAbility(data,"guard"))hurt=Math.Max(1,Round(hurt*.95));if(save.HasAncient("anc_a2"))hurt=Math.Max(1,Round(hurt*.7));save.hp=Math.Max(0,save.hp-hurt);if(save.hp==0){finished=true;won=false;}return hurt;
        }
        void RollDrops()
        {
            lastDrop="";var settings=data.rewardSettings??new RewardSettings();
            double progression=DropRules.Multiplier(data,save,area,stageIndex,boss);
            Func<double,double,bool> roll=(rate,multiplier)=>random.NextDouble()<Math.Max(0,Math.Min(1,rate*multiplier*progression));
            if(roll(boss?.075:.025,settings.dropMultTicket)){save.skinGachaTickets++;RewardEntry.Add(rewards,"ticket","skin-ticket");lastDrop="背景ガチャ券 ×1";}
            if(roll(boss?.03:.01,settings.dropMultRaidTicket)){save.raidTickets++;RewardEntry.Add(rewards,"ticket","raid-ticket");lastDrop="レイドチケット ×1";}
            if(DropRules.HalloweenActive(DateTimeOffset.UtcNow)&&random.NextDouble()<.6*(save.ClearCount(area.id+":"+(boss?"boss":stageIndex.ToString()))>=settings.repeatThreshold?.25:1)){save.halloweenCandy++;RewardEntry.Add(rewards,"item","halloween-candy");}
            if(roll(.12,settings.dropMultItem))
            {
                var item=data.items.Where(i=>i.price>0).ToArray();var selected=item[random.Next(item.Length)];int count=selected.id=="hipotion"?3:1;
                save.AddItem(selected.id,count);RewardEntry.Add(rewards,"item",selected.id,count);lastDrop=selected.name+" ×"+count;
            }
            if(roll(boss?settings.bossEquipDrop:.04,boss?1:settings.dropMultEquip))
            {
                var pool=data.equipment.Where(e=>e.pool=="standard").ToArray();var item=pool[random.Next(pool.Length)];var rarities=boss?new[]{2,3,3,4}:new[]{1,2,2};int rarity=rarities[random.Next(rarities.Length)];
                var gear=save.AddEquipment(data,item.id,rarity,EconomyRules.RollAbility(rarity,random));RewardEntry.Add(rewards,"equip",gear.id,1,gear.rarity,gear.ability);lastDrop=item.name+" ★"+rarity;
            }
            if(roll(boss?settings.bossBlueprintRate:.015,settings.dropMultBlueprint)){save.AddItem("bp_ancient");RewardEntry.Add(rewards,"item","bp_ancient");lastDrop="古代の設計図 ×1";}
            DropRules.Record(save,area.id+":"+(boss?"boss":stageIndex.ToString()));
        }
        void Reward()
        {
            int before=save.gold;
            foreach(var reward in StageRewards.Clear(data,save,area,stageIndex,boss))RewardEntry.Add(rewards,reward.kind,reward.id,reward.count,reward.rarity,reward.ability);
            gold+=save.gold-before;
        }
    }
}
