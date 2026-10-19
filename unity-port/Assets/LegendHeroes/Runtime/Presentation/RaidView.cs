using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.UI;
namespace LegendHeroes
{
    public partial class LegendGame
    {
        Dictionary<string,object> raidGlobal;WorldRaidFight worldFight;Text worldPrompt,worldStatus,worldTimer;InputField worldInput;float worldDeadline;bool worldSettled,worldMenuOpen;
        RectTransform worldChoices;Button worldSubmit,worldKana;
        void ShowRaids()
        {
            Begin("raids","レイド",Data.homeImage,ShowFeatureMenu);Label(screen,"レイドチケット ×"+Save.raidTickets+"    レイドコイン ×"+Save.raidCoins,40,100,1180,60,28,gold);
            Button(screen,"ワールド・レイドボス",40,185,580,100,()=>CloudAction(ShowWorldRaidMenu),true);Button(screen,"コイン交換所",650,185,590,100,()=>ShowExchange(true));
            Button(screen,"ハロウィン・算数レイド",40,335,580,105,()=>BeginEvent(true,false,false,0,"add","answer",false),true);Button(screen,"ハロウィン・漢字レイド",650,335,590,105,()=>BeginEvent(true,true,false,0,"add","answer",false),true);
            Button(screen,"算数ランキング",40,490,580,70,()=>CloudAction(()=>ShowRankings("eventRaidRankings_halloween_2026_raid_v1","totalKills")));Button(screen,"漢字ランキング",650,490,590,70,()=>CloudAction(()=>ShowRankings("eventRaidRankings_halloween_2026_raid_v1_kanji","totalKills")));
            Button(screen,"討伐履歴",40,600,580,70,()=>CloudAction(ShowRaidHistory));Button(screen,"記録を同期",650,600,590,70,()=>CloudAction(async()=>{await FlushRaidQueue();Notice("同期しました","保留していた記録を同期しました。");}));
            if(DateTimeOffset.UtcNow>=new DateTimeOffset(2026,11,1,0,0,0,TimeSpan.FromHours(9)))
            {
                Button(screen,"算数・最終ランキング報酬",40,700,580,60,()=>ClaimHalloweenFinal(false),true);
                Button(screen,"漢字・最終ランキング報酬",650,700,590,60,()=>ClaimHalloweenFinal(true),true);
            }
            else Label(screen,"1体撃破でお菓子×2。前回の2ステージ前から再開。",40,700,1180,60,23,gold);
        }
        void ClaimHalloweenFinal(bool kanji)
        {
            CloudAction(async()=>{var copy=await new RaidService(cloud,Data).ClaimEventFinal(Data,Save,kanji);if(copy==null){Notice("受け取れません","参加記録と受取済みかを確認してください。");return;}Save=copy;Persist();ShowRaids();Notice("ランキング報酬","限定武器、1〜3位には専用フレームを受け取りました。");});
        }
        async Task ShowWorldRaidMenu()
        {
            var service=new RaidService(cloud,Data);raidGlobal=await service.Refresh();string id=raidGlobal.Str("bossId");Save.currentRaidBossId=id;Begin("world-menu","ワールド・レイドボス", "assets/raid/raid_bg_magma_pixel.jpg",ShowRaids);Picture(screen,"assets/raid/raid_boss_dark_bahamut_blueflame_pixel_v2.png",60,120,500,430);int remaining=Math.Max(0,raidGlobal.Int("maxHp",1000)-raidGlobal.Int("totalDamageDealt"));Label(screen,"ダークバハムート Lv."+raidGlobal.Int("bossLevel",50)+"\n残りHP "+remaining,610,130,600,120,34,gold);
            var fight=Button(screen,"チケット1枚で挑戦",610,300,600,90,()=>{if(Save.raidTickets<=0||remaining<=0)return;Save.raidTickets--;if(!Save.backgrounds.Contains("raid_magma"))Save.backgrounds.Add("raid_magma");Persist();StartWorldFight(id,remaining,false);},true);fight.interactable=Save.raidTickets>0&&remaining>0&&raidGlobal.Long("defeatedAt")==0;
            Button(screen,"ダメージランキング",610,435,600,70,()=>CloudAction(()=>ShowRankings("raidRankings_"+id,"totalDamage")));Button(screen,"討伐報酬を受け取る",610,540,600,70,()=>CloudAction(async()=>{var rewarded=await service.ClaimRank(Data,Save,id);if(rewarded!=null){Save=rewarded;Persist();ShowRaids();Notice("報酬を獲得！","順位に応じたレイドコインなどを受け取りました。");}else Notice("まだ受け取れません","討伐後の集計が完了すると受け取れます。");}));Button(screen,"コイン交換所",610,645,600,70,()=>ShowExchange(true));
        }
        void StartWorldFight(string bossId,int hp,bool test)
        {
            worldFight=new WorldRaidFight(Data,Save,bossId,hp,test);worldSettled=false;worldMenuOpen=false;BuildWorldFight();
        }
        void BuildWorldFight()
        {
            Begin("world-fight","ワールドレイド挑戦", "assets/raid/raid_bg_magma_pixel.jpg",EndWorldFight);Avatar(screen,Save,40,160,280);Picture(screen,"assets/raid/raid_boss_dark_bahamut_blueflame_pixel_v2.png",840,110,350,370);worldStatus=Label(screen,"",360,150,450,150,29,gold,TextAnchor.MiddleCenter);worldPrompt=Label(screen,"",45,490,1190,100,35,gold,TextAnchor.MiddleCenter);worldInput=Input(screen,"",220,630,550,85);worldInput.onSubmit.AddListener(AnswerWorld);worldSubmit=Button(screen,"こたえる",810,630,260,85,()=>AnswerWorld(worldInput.text),true);worldKana=Button(screen,"かな入力",1090,630,150,85,()=>OpenKanaPad(worldInput,AnswerWorld,worldFight.problem.text+" のよみ"));worldChoices=Rect(screen,"Raid spelling choices",45,605,1190,130);worldTimer=Label(screen,"",430,350,420,65,28,null,TextAnchor.MiddleCenter);Button(screen,"特技",350,420,270,50,()=>ShowWorldCommands(true));Button(screen,"回復道具",650,420,270,50,()=>ShowWorldCommands(false));RenderWorldFight();
        }
        void RenderWorldFight()
        {
            worldPrompt.text=worldFight.problem.text+(worldFight.problem.language?" のよみ":" = ?")+(worldFight.problem.remainder>=0?"（答え あまり 数）":"");
            worldStatus.text="与えたダメージ "+worldFight.damage+"\nHP "+Save.hp+" / MP "+Save.mp+"\nボス残り "+worldFight.remaining;
            worldDeadline=Time.unscaledTime+worldFight.QuestionMilliseconds/1000f;worldInput.text="";
            foreach(Transform child in worldChoices){child.gameObject.SetActive(false);Destroy(child.gameObject);}
            var options=worldFight.problem.options;bool choice=options!=null&&options.Length>=2;worldInput.gameObject.SetActive(!choice);worldSubmit.gameObject.SetActive(!choice);worldKana.gameObject.SetActive(!choice);
            if(choice)
            {
                worldPrompt.text=string.IsNullOrEmpty(worldFight.problem.prompt)?"ただしい かきかたは どれ？":worldFight.problem.prompt;
                var shuffled=options.OrderBy(_=>gameRandom.Next()).ToArray();float width=1190f/shuffled.Length;
                for(int i=0;i<shuffled.Length;i++){string answer=shuffled[i];Button(worldChoices,answer,i*width+5,0,width-10,110,()=>AnswerWorld(answer),true);}
            }
            else worldInput.ActivateInputField();
        }

        void AnswerWorld(string input){if(worldFight==null||worldFight.over||worldMenuOpen)return;bool correct=worldFight.Answer(input);Play(correct?"se_type":"se_slash",correct?.24f:.36f);if(correct)Play("se_slash",.36f);if(worldFight.over)EndWorldFight();else RenderWorldFight();}
        void UpdateWorldRaid(){if(CurrentScreen!="world-fight"||worldFight==null||worldFight.over||worldMenuOpen)return;float left=Mathf.Max(0,worldDeadline-Time.unscaledTime);worldTimer.text=left.ToString("0.0")+" 秒";if(left<=0)AnswerWorld("");}
        void ShowWorldCommands(bool skills)
        {
            if(worldFight==null||worldFight.over||worldMenuOpen)return;
            worldMenuOpen=true;float remaining=Mathf.Max(0,worldDeadline-Time.unscaledTime);
            var overlay=Box(screen,"Raid commands",0,0,1280,800,new Color(0,0,0,.9f));Label(overlay,skills?"特技を選ぶ":"回復道具を選ぶ",200,50,880,80,34,gold);
            var learned=Data.skills.Where(s=>Save.SkillState(s.id).learned).ToArray();var items=Data.items.Where(i=>(i.effect=="heal"||i.effect=="mana")&&Save.ItemCount(i.id)>0).ToArray();int count=skills?learned.Length:items.Length;
            var list=Scroll(overlay,220,160,840,430,Math.Max(430,count*85));
            Action close=()=>{Destroy(overlay.gameObject);worldMenuOpen=false;worldDeadline=Time.unscaledTime+remaining;};
            for(int i=0;i<count;i++){int index=i;string name=skills?learned[i].name+" / MP "+learned[i].mp:items[i].name+" ×"+Save.ItemCount(items[i].id);Button(list,name,10,i*85,810,72,()=>{bool ok=skills?worldFight.SelectSkill(learned[index].id):worldFight.SelectItem(items[index].id);if(ok){close();RenderWorldFight();}},true);}
            Button(overlay,"もどる",420,650,440,75,close);
        }
        void EndWorldFight()
        {
            if(worldSettled)return;worldSettled=true;var record=worldFight.Finish();if(!worldFight.test)Save.pendingRuns.Add(record);Persist();Begin("world-result","レイド結果", "assets/raid/raid_bg_magma_pixel.jpg");Label(screen,"与えたダメージ  "+record.damage+"\n獲得レイドコイン ×"+EconomyRules.ParticipationCoins(record.damage),80,200,1120,260,43,gold,TextAnchor.MiddleCenter);Button(screen,"レイドへもどる",390,650,500,80,()=>{ShowRaids();if(!worldFight.test)CloudAction(FlushRaidQueue);},true);
        }
        async Task FlushRaidQueue()
        {
            var owner=Save;var service=new RaidService(cloud,Data);foreach(var record in owner.pendingRuns.ToArray()){if(record.mode=="world")await service.Submit(owner,record);else await service.RecordEvent(owner,record);owner.pendingRuns.Remove(record);}if(Save==owner)Persist();
        }
        async Task ShowRankings(string collection,string metric,CloudDocument[] supplied=null,string summary=null)
        {
            var rows=(supplied??(await cloud.List(collection)).ToArray()).Where(d=>!d.data.Bool("excludedFromRanking")).OrderByDescending(d=>d.data.Int(metric,d.data.Int("bestKills"))).ThenBy(d=>d.data.Str("slotKey"),StringComparer.Ordinal).ToArray();Begin("rankings",summary==null?"ランキング":"レイド討伐履歴",Data.homeImage,ShowRaids);if(summary!=null)Label(screen,summary,35,100,1210,55,20,gold);var list=Scroll(screen,35,summary==null?110:165,1210,summary==null?640:585,rows.Length*175);
            for(int i=0;i<rows.Length;i++){var d=rows[i].data;var look=new PlayerSave{avatar=d.Str("avatar"),background=d.Str("avatarBackground","default"),frame=d.Str("avatarDecoration"),avatarHolographic=d.Bool("avatarHolographic"),backgroundHolographic=d.Bool("avatarBackgroundHolographic")};var r=Box(list,"Rank",0,i*175,1185,165);Avatar(r,look,12,10,110);int rankNumber=metric!="totalDamage"?Array.FindIndex(rows,row=>row.data.Int(metric,row.data.Int("bestKills"))==d.Int(metric,d.Int("bestKills")))+1:i+1;Label(r,rankNumber+"位  "+d.Str("playerName")+" Lv."+d.Int("level",1),150,10,700,55,27,gold);Label(r,d.Int(metric,d.Int("bestKills"))+ (metric=="totalDamage"?" ダメージ":" 体"),150,70,700,45,27);
                string[] slots={"weapon","armor","accessory"};for(int j=0;j<slots.Length;j++){var item=d.Map("equipment").Map(slots[j]);if(item.Count==0)continue;var def=Data.Equip(item.Str("id"));string image=def?.image??item.Str("emoji"),name=def?.name??item.Str("name");var button=Button(r,"",900+j*90,30,76,76,()=>ArtworkDetail(name,image,"★"+item.Int("rarity",1)+" "+AbilityName(item.Str("ability"))));Picture(button.transform,image,3,3,70,70);}
                if(metric=="totalDamage"&&summary==null&&d.Str("slotKey")!=Save.slotKey)
                {
                    string target=d.Str("slotKey"),key="cheer:"+DateTimeOffset.UtcNow.UtcDateTime.ToString("yyyy-MM-dd")+":"+target;bool sent=Save.claims.Contains(key);
                    var cheer=Button(r,sent?"エール送信済み":"応援する（+50G）",900,113,270,38,()=>{if(EconomyRules.Cheer(Save,target,DateTimeOffset.UtcNow)){Persist();CloudAction(()=>ShowRankings(collection,metric));}},true);cheer.interactable=!sent;
                }}
        }
        async Task ShowRaidHistory()
        {
            var rows=(await cloud.List("raidHistory")).OrderByDescending(d=>d.data.Long("finalizedAt")).ToArray();Begin("raid-history","レイド討伐履歴",Data.homeImage,ShowRaids);var list=Scroll(screen,35,110,1210,640,rows.Length*100);for(int i=0;i<rows.Length;i++){var row=rows[i];string id=row.data.Str("bossId");Button(list,"ダークバハムート Lv."+row.data.Int("bossLevel")+" / HP "+row.data.Int("maxHp"),0,i*100,1170,85,()=>CloudAction(async()=>{var reward=await new RaidService(cloud,Data).ClaimRank(Data,Save,id);if(reward!=null){Save=reward;Persist();}var archived=RaidService.RankingRows(row.data).Select(data=>new CloudDocument{data=data}).ToArray();long at=row.data.Long("finalizedAt");string when=at>0?DateTimeOffset.FromUnixTimeMilliseconds(at).ToOffset(TimeSpan.FromHours(9)).ToString("yyyy/MM/dd HH:mm"):"記録なし";await ShowRankings("raidRankings_"+id,"totalDamage",archived.Length>0?archived:null,"ダークバハムート Lv."+row.data.Int("bossLevel")+" ｜ 討伐 "+when+" ｜ 最大HP "+row.data.Int("maxHp").ToString("N0"));}),true);}
        }
    }
}
