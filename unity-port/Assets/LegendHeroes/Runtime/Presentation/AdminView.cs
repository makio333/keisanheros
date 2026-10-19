using System;
using System.Globalization;
using System.Linq;
using UnityEngine;

namespace LegendHeroes
{
    public partial class LegendGame
    {
        GameConfiguration configuration;
        void ShowAdminOptions()
        {
            Begin("admin-options","ゲームの調整",Data.homeImage,ShowAdmin);
            string[] names={"装備の能力と価格","敵の能力","道具の値段と回復量","エリアの難しさ","クリア報酬","プレイ時間"};
            Action[] actions={()=>ShowDefinitionList("equip"),()=>ShowDefinitionList("enemy"),()=>ShowDefinitionList("item"),()=>ShowDefinitionList("area"),ShowRewardConfiguration,ShowPlayLimit};
            for(int i=0;i<names.Length;i++){var action=actions[i];Button(screen,names[i],70+i%2*600,150+i/2*190,550,155,action,true);}
        }
        void ShowDefinitionList(string kind)
        {
            Begin("admin-definitions","調整するものを選ぶ",Data.homeImage,ShowAdminOptions);
            var entries=kind=="equip"?Data.equipment.Select(e=>new{id=e.id,name=e.name}):kind=="item"?Data.items.Select(e=>new{id=e.id,name=e.name}):kind=="area"?Data.areas.Select(e=>new{id=e.id,name=e.name}):Data.areas.SelectMany(a=>a.enemies.Concat(new[]{a.boss})).GroupBy(e=>e.id).Select(g=>new{id=g.Key,name=g.First().name});
            var rows=entries.ToArray();var list=Scroll(screen,35,120,1210,630,Math.Max(630,rows.Length*80));
            for(int i=0;i<rows.Length;i++){var entry=rows[i];Button(list,entry.name,10,i*80,1170,65,()=>ShowDefinitionFields(kind,entry.id),true);}
        }
        void ShowDefinitionFields(string kind,string id)
        {
            Begin("admin-fields","能力・価格の調整",Data.homeImage,()=>ShowDefinitionList(kind));
            string[] fields=kind=="equip"?new[]{"atk","def","hp","mp","spd","cost","price"}:kind=="enemy"?new[]{"hp","atk","def","spd","exp","goldMin","goldMax"}:kind=="item"?new[]{"price","value"}:new[]{"difficulty"};
            var list=Scroll(screen,35,115,1210,630,fields.Length*100);
            for(int i=0;i<fields.Length;i++)
            {
                string field=fields[i];double current=DefinitionValue(kind,id,field);
                Label(list,SettingLabel(field),35,i*100,500,75,26,gold);var input=Input(list,current.ToString(CultureInfo.InvariantCulture),550,i*100+10,350,65,true);
                Button(list,"保存",930,i*100+10,230,65,()=>
                {
                    if(!double.TryParse(input.text,NumberStyles.AllowDecimalPoint,CultureInfo.InvariantCulture,out var value)||value<0||value>1000000){Notice("入力を確認してください","0〜1000000の数値を入力してください。");return;}
                    configuration.Set(kind+":"+id+":"+field,value);configuration.Apply(Data);ShowDefinitionFields(kind,id);
                },true);
            }
        }
        double DefinitionValue(string kind,string id,string field)
        {
            if(kind=="area"){var a=Data.areas.First(x=>x.id==id);return a.difficultyOverride>0?a.difficultyOverride:BattleRun.Difficulty(id);}
            if(kind=="item"){var item=Data.items.First(x=>x.id==id);return field=="price"?item.price:item.value;}
            if(kind=="enemy"){var e=Data.areas.SelectMany(a=>a.enemies.Concat(new[]{a.boss})).First(x=>x.id==id);return Convert.ToDouble(typeof(Enemy).GetField(field).GetValue(e));}
            var equip=Data.Equip(id);if(field=="price")return equip.price;if(field=="cost")return equip.cost;return Convert.ToDouble(typeof(Stats).GetField(field).GetValue(equip.stat));
        }
        void ShowRewardConfiguration()
        {
            Begin("admin-rewards","クリア報酬の設定",Data.homeImage,ShowAdminOptions);
            var settings=Data.rewardSettings??(Data.rewardSettings=new RewardSettings());var fields=typeof(RewardSettings).GetFields().Where(f=>f.FieldType==typeof(int)||f.FieldType==typeof(double)).ToArray();var list=Scroll(screen,35,115,1210,630,fields.Length*95);
            for(int i=0;i<fields.Length;i++){var field=fields[i];Label(list,SettingLabel(field.Name),30,i*95,620,75,24,gold);var input=Input(list,field.GetValue(settings).ToString(),670,i*95+10,240,65,true);Button(list,"保存",940,i*95+10,220,65,()=>{if(double.TryParse(input.text,NumberStyles.AllowDecimalPoint,CultureInfo.InvariantCulture,out double value)&&value>=0&&value<=1000000){configuration.Set("reward:clear:"+field.Name,value);configuration.Apply(Data);ShowRewardConfiguration();}},true);}
        }
        static string SettingLabel(string key)
        {
            switch(key)
            {
                case "atk":return "攻撃力";case "def":return "守備力";case "hp":return "HP";case "mp":return "MP";case "spd":return "すばやさ";case "cost":return "装備コスト";case "price":return "値段（G）";case "value":return "回復量";case "difficulty":return "敵の強さの倍率";case "exp":return "獲得経験値";case "goldMin":return "落とすゴールド・最小";case "goldMax":return "落とすゴールド・最大";
                case "thirdGoldBase":return "3回クリアのゴールド・基本";case "thirdGoldStep":return "次のステージごとの加算G";case "thirdItemCount":return "3回クリアの道具の個数";case "firstWeaponRarity":return "初回の武器のレアリティ";case "bossFirstTickets":return "ボス初回の背景券の枚数";case "bossThirdTickets":return "ボス3回目の10連券の枚数";case "bossLevelUp":return "ボス強化レベルの上昇量";case "bossGrowthPct":return "ボス強化ごとの上昇率（%）";
                case "repeatThreshold":return "復習のドロップ低下までの回数";case "repeatMult":return "復習を繰り返した時の倍率";case "pastStageDropMult":return "過去の難易度のドロップ倍率";case "frontierDropMult":return "新しい難易度のドロップ倍率";
                case "dropMultItem":return "道具のドロップ倍率";case "dropMultEquip":return "装備のドロップ倍率";case "dropMultBlueprint":return "設計図のドロップ倍率";case "dropMultTicket":return "背景券のドロップ倍率";case "dropMultRaidTicket":return "レイド券のドロップ倍率";case "bossEquipDrop":return "ボスの装備ドロップ率（0〜1）";case "bossBlueprintRate":return "ボスの設計図ドロップ率（0〜1）";
                case "pickupBonusTickets":return "復習ボーナスの10連券";case "pickupBonusRaidTickets":return "復習ボーナスのレイド券";case "pickupBonusGold":return "復習ボーナスのゴールド";default:return "調整値";
            }
        }
        void ShowPlayLimit()
        {
            Begin("admin-time","プレイ時間",Data.homeImage,ShowAdminOptions);Label(screen,Save.playerName+"の制限時間（0分で制限なし、最大240分）",70,170,1140,100,28,gold);
            var input=Input(screen,(configuration.Limit(Save.slotKey)?.minutes??0).ToString(),350,340,580,90,true);
            Button(screen,"この時間で開始する",350,530,580,90,()=>{if(int.TryParse(input.text,out int minutes)&&minutes>=0&&minutes<=240){configuration.SetLimit(Save.slotKey,minutes);ShowAdminOptions();}},true);
        }
        void CheckPlayLimit()
        {
            if(Save==null||CurrentScreen=="time-up"||CurrentScreen=="title"||CurrentScreen=="create"||CurrentScreen.StartsWith("admin")||CurrentScreen=="settings")return;
            var limit=configuration.Limit(Save.slotKey);if(limit==null||limit.minutes<=0||DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()<limit.endsAt)return;
            if(eventCombat!=null&&!eventCombat.over)eventCombat.End(DateTimeOffset.UtcNow);
            Persist();Battle=null;quizSubmit=null;worldFight=null;eventCombat=null;
            Begin("time-up","今日はここまで",Data.homeImage);Label(screen,"よくがんばったね！\n記録を保存しました。",100,180,1080,250,45,gold,TextAnchor.MiddleCenter);
            Button(screen,"保護者の設定",390,560,500,90,ShowAdminGate);
        }
    }
}
