using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using LegendHeroes;
using UnityEngine;

static class RulesTests
{
    static int checks;
    static void Require(bool ok, string reason) { checks++; if (!ok) throw new Exception(reason); }
    static string Answer(Problem p) => p.answer + (p.remainder >= 0 ? " あまり " + p.remainder : "");
    static PlayerSave Player(Content d) { var s = new PlayerSave(); s.Normalize(d); return s; }
    static void Main(string[] args)
    {
        Resources.Root = args[0]; var d = Content.Load();
        Require(d.areas.Length == 15 && d.areas.Sum(a => a.stages.Length) == 95, "content counts");
        foreach (var area in d.areas)
        foreach (var stage in area.stages)
        foreach (var p in stage.problems)
        { Require(p.Accepts(Answer(p)), "canonical: " + p.text); Require(!p.Accepts("絶対に不正解xyz"), "wrong: " + p.text); }
        var generator = new QuestionGenerator(d, new Random(42));
        foreach (var area in d.areas)
        for (int i = 0; i < area.stages.Length; i++)
        for (int n = 0; n < 150; n++) { var p = generator.Stage(area, i); Require(p.Accepts(Answer(p)), "generated " + p.text); }
        var day = d.kanjiPools.SelectMany(p => p.problems).First(p => p.text == "日");
        Require(day.Accepts("ニチ") && day.Accepts("じつ") && day.Accepts("ひ"), "alternate readings");
        Require(new Problem { text = "がっこう", answer = "がっこう", language = true }.Accepts("がっこう"), "small kana canonical");
        Require(!new Problem { text = "がっこう", answer = "がっこう", language = true }.Accepts("がつこう"), "small kana strict");
        Require(new Problem { answer = "1/2" }.Accepts("2/4"), "equivalent fractions");
        Require(!new Problem { answer = "12" }.Accepts("1,2"), "no grouping ambiguity");
        Require(KanaRules.Modify("き","voiced")=="ぎ"&&KanaRules.Modify("ぎや","small")=="ぎゃ","kana modifiers");
        Require(KanaRules.Modify(KanaRules.Modify("は","semi"),"voiced")=="ば"&&KanaRules.Modify("ば","voiced")=="は","dakuten/handakuten toggles");
        Require(KanaRules.Modify("ん","voiced")=="ん"&&KanaRules.Modify("ガ","voiced")=="カ"&&KanaRules.Delete("きゃ")=="き","strict kana board editing");
        var s = Player(d); s.gold = 10000; s.level = 100;
        Require(s.TryBuy(d, "w1") && s.TryBuy(d, "w1"), "multiple copies purchasable");
        var copies = s.ownedEquips.Where(e => e.id == "w1").ToArray();
        Require(copies.Length == 2 && copies[0].uid != copies[1].uid, "individual UIDs");
        Require(s.TryEquip(d, copies[1].uid) && s.weaponUid == copies[1].uid, "select particular copy");
        Require(s.Synthesize(d, copies[0].uid, copies[0].uid, new Random(1)) == null, "cannot self synthesize");
        var made = s.Synthesize(d, copies[0].uid, copies[1].uid, new Random(1));
        Require(made != null && made.rarity == 2 && s.weaponUid == 0, "synthesis consumes exact equipped copies");
        Require(s.Synthesize(d, copies[0].uid, copies[1].uid, new Random(1)) == null, "stale synthesis blocked");
        s.AddItem("cost_seed"); int cap = s.MaxCost;
        Require(s.UseItem(d, "cost_seed") && s.MaxCost == cap + 1 && !s.UseItem(d, "cost_seed"), "seed once");
        s.points = 3; s.Allocate("atk"); s.Allocate("hp"); s.AddItem("respec_seed");
        Require(s.UseItem(d, "respec_seed") && s.points == 3 && s.allocatedAtk == 0, "point refund");
        s.equipGachaTenPullTickets = 1; int gold = s.gold;
        Require(EconomyRules.DrawEquipment(d, s, true, true, new Random(2)).Count == 10 && s.gold == gold && s.equipGachaTenPullTickets == 0, "ten ticket");
        s.gold = 0; Require(EconomyRules.DrawEquipment(d, s, false, false, new Random(2)) == null, "poor gacha no charge");
        var prize = d.halloweenExchange[0]; s.halloweenCandy = 100000;
        Require(EconomyRules.Exchange(d, s, prize, false) && !EconomyRules.Exchange(d, s, prize, false), "exchange once");
        var gift = new Gift { id = "offline-gift", gold = 50, items = new GiftItem[0] }; gold = s.gold;
        Require(EconomyRules.ReceiveGift(d, s, gift) && !EconomyRules.ReceiveGift(d, s, gift) && s.gold == gold + 50, "gift once");
        var fighter = Player(d); fighter.baseAtk = 10000; fighter.baseHp = fighter.hp = 10000; fighter.baseSpd = 0;
        var battle = new BattleRun(d, fighter, d.areas.First(a => a.id == "area1"), 0, false, 42);
        battle.Answer("wrong"); Require(fighter.hp < 10000, "counterattack");
        int guard = 0; while (!battle.finished && guard++ < 1000) battle.Answer(Answer(battle.question));
        Require(battle.won && battle.kills == 5 && fighter.ClearCount("area1:0") == 1, "five kills clear");
        gold = fighter.gold; battle.Answer("wrong"); Require(fighter.gold == gold, "battle rewards once");
        var loser = Player(d); loser.hp = 1; loser.baseSpd = 0;
        var loss = new BattleRun(d, loser, d.areas.First(a => a.id == "area1"), 0, false, 42); loss.Answer("wrong");
        Require(loss.finished && !loss.won, "defeat");
        var now = new DateTimeOffset(2026, 10, 22, 12, 0, 0, TimeSpan.Zero);
        var eventSave = Player(d); eventSave.baseAtk = 10000;
        var raid = new EventCombat(d, eventSave, true, true, false, 0, "add", "answer", false, now, 42);
        raid.Answer(Answer(raid.problem), now.AddSeconds(1)); Require(raid.kills == 4 && eventSave.halloweenCandy == 8, "fast raid four targets + candy");
        raid.End(now.AddSeconds(121)); int candy = eventSave.halloweenCandy;
        raid.End(now.AddSeconds(122)); Require(eventSave.halloweenCandy == candy, "raid settlement once");
        var testSave = Player(d); var test = new EventCombat(d, testSave, true, true, false, 0, "add", "answer", true, now, 42);
        test.End(now.AddSeconds(121)); Require(testSave.halloweenCandy == 0 && testSave.kanjiEventTotal == 0, "preview no rewards/ranking");
        Require(EconomyRules.ParticipationCoins(1023) == 256 && EconomyRules.RankCoins(1) == 50 && EconomyRules.RankCoins(4) == 5, "coin rules");
        var dropSave=Player(d);var firstArea=d.areas.First(a=>a.id=="area1");
        Require(DropRules.Multiplier(d,dropSave,firstArea,0,false)==2,"new frontier drop boost");
        for(int i=0;i<5;i++)DropRules.Record(dropSave,"area1:0");
        Require(DropRules.Multiplier(d,dropSave,firstArea,0,false)==.1,"abandon/retry does not reset drop boost");
        dropSave.clears.Add(new ClearRecord{key="area1:0",count=3});
        Require(Math.Abs(DropRules.Multiplier(d,dropSave,firstArea,0,false)-.01)<.00000001,"repeat past stage multiplier");
        Require(DropRules.Multiplier(d,dropSave,firstArea,1,false)==2,"next difficulty gets boost");
        var reviewSave=Player(d);for(int i=0;i<3;i++)ReviewRules.Record(reviewSave,firstArea,1,i==0);
        var pickup=ReviewRules.Active(d,reviewSave);Require(pickup!=null&&pickup.stageIndex==1,"exact mistaken stage review");
        Require(!ReviewRules.Claim(d,reviewSave,"area1",0)&&ReviewRules.Claim(d,reviewSave,"area1",1)&&!ReviewRules.Claim(d,reviewSave,"area1",1),"review only correct stage once");
        Require(reviewSave.gold==1000&&reviewSave.equipGachaTenPullTickets==1&&reviewSave.raidTickets==2,"review prizes");
        Require(EconomyRules.Cheer(reviewSave,"other",now)&&!EconomyRules.Cheer(reviewSave,"other",now)&&reviewSave.gold==1050,"daily cheer reward once");
        var world = new WorldRaidFight(d, eventSave, "offline", 100000, false); world.Answer(Answer(world.problem));
        var finish = world.Finish(); int coins = eventSave.raidCoins;
        Require(world.Finish().id == finish.id && eventSave.raidCoins == coins, "world finish idempotent");
        var skilled=Player(d);skilled.SkillState("renzoku").learned=true;skilled.mp=10;skilled.baseSpd=0;
        var skillRaid=new WorldRaidFight(d,skilled,"offline",100000,true);
        Require(skillRaid.SelectSkill("renzoku")&&skilled.mp==7&&skillRaid.problem.tier=="add1","raid skill MP and dedicated problem");
        skillRaid.Answer(Answer(skillRaid.problem));Require(skillRaid.damage>0&&skillRaid.selectedSkill==null,"raid skill resolves once");
        skilled.hp=1;skilled.AddItem("potion");Require(skillRaid.SelectItem("potion"),"raid recovery selection");
        int dealtBefore=skillRaid.damage;skillRaid.Answer(Answer(skillRaid.problem));Require(skilled.hp==21&&skilled.ItemCount("potion")==0&&skillRaid.damage==dealtBefore,"raid correct recovery consumes one without attack");
        var printSave = Player(d); var sheet = PrintRules.Create(d, printSave, d.areas[0], 0, true);
        Require(PrintRules.Claim(d, printSave, sheet, sheet.code, sheet.problems.Select(Answer).ToArray()) && printSave.gold == 1800 && printSave.equipGachaTenPullTickets == 1, "challenge print 3x + ten ticket");
        Require(!PrintRules.Claim(d, printSave, sheet, sheet.code, sheet.problems.Select(Answer).ToArray()), "print once");
        var web = WebSaveCodec.Export(s); var roundtrip = WebSaveCodec.Import(web, d);
        Require(roundtrip.gold == s.gold && roundtrip.ownedEquips.Count == s.ownedEquips.Count && roundtrip.costPlus == s.costPlus, "web roundtrip");
        var native = Player(d);native.level=12;native.baseHp=74;native.baseMp=32;native.points=3;
        native.Allocate("hp");native.Allocate("mp");native.Allocate("atk");native.AddItem("cost_seed",3);
        native.clears.Add(new ClearRecord{key="area1:0",count=8});native.kanjiEventBest=30;native.kanjiEventTotal=58;native.kanjiRaidLastStage=12;
        native.claims.Add("bonus:10");native.claims.Add("participation:2026-10-22");
        var imported=WebSaveCodec.Import(WebSaveCodec.Export(native),d);
        Require(imported.Stat(d,"hp")==native.Stat(d,"hp")&&imported.Stat(d,"mp")==native.Stat(d,"mp")&&imported.Stat(d,"atk")==native.Stat(d,"atk"),"allocated stats roundtrip without double gains");
        imported.AddItem("respec_seed");Require(imported.UseItem(d,"respec_seed")&&imported.points==3,"Web allocated points refund");
        Require(imported.ClearCount("area1:0")==8&&imported.kanjiRaidLastStage==12&&imported.claims.Contains("bonus:10"),"repeat/event progress preserved");
        var webRoot=WireJson.Object(WebSaveCodec.Export(native));
        Require(webRoot.Int("nextUid")>webRoot.List("items").OfType<Dictionary<string,object>>().Max(item=>item.Int("uid")),"Web next UID above exported items");
        webRoot["unknownFutureFeature"]=new Dictionary<string,object>{{"keep",123}};
        webRoot.List("ownedEquips").Add(new Dictionary<string,object>{{"id","custom_future_weapon"},{"uid",9999},{"rarity",3}});
        var future=WebSaveCodec.Import(WireJson.Stringify(webRoot),d);
        var futureExport=WireJson.Object(WebSaveCodec.Export(future));
        Require(futureExport.Map("unknownFutureFeature").Int("keep")==123&&futureExport.List("ownedEquips").OfType<Dictionary<string,object>>().Any(e=>e.Str("id")=="custom_future_weapon"),"future fields and custom equipment retained");
        var replacementSave=Player(d);replacementSave.gold=20;replacementSave.claims.Add("gift:old");
        var replacement=new Gift{id="new",replacesGiftId="old",recallOriginal=true,gold=100,items=new GiftItem[0]};
        Require(EconomyRules.ReceiveGift(d,replacementSave,replacement)&&replacementSave.gold==20&&!EconomyRules.ReceiveGift(d,replacementSave,replacement),"replacement gift debt and one claim");
        var shared=Player(d);shared.baseAtk=10000;
        var mathRaid=new EventCombat(d,shared,true,false,false,0,"add","answer",false,now,42);mathRaid.End(now.AddSeconds(121));
        var kanjiRaid=new EventCombat(d,shared,true,true,false,0,"add","answer",false,now,42);kanjiRaid.End(now.AddSeconds(121));
        Require(shared.halloweenCandy==2,"daily participation shared across modes");
        foreach(string operation in new[]{"add","sub","mul","div"})
        foreach(string mode in new[]{"answer","combine","mixed"})
        {
            var partySave=Player(d);partySave.baseAtk=10000;partySave.baseHp=partySave.hp=10000;
            var party=new EventCombat(d,partySave,false,false,true,1,operation,mode,true,now,42);
            for(int step=0;step<5;step++)
            {
                if(!party.Combine)party.Select(party.enemies.First(e=>e.number==party.target).slot,now.AddSeconds(step+1));
                else
                {
                    var pair=(from a in party.enemies from b in party.enemies where a.slot!=b.slot&&PairAnswer(a.number,b.number,operation,party.target) select new[]{a.slot,b.slot}).First();
                    party.Select(pair[0],now.AddSeconds(step+1));party.Select(pair[1],now.AddSeconds(step+1));
                }
            }
            Require(party.won&&party.over&&party.answers==5,"season2 five questions: "+operation+" "+mode);
            Require(partySave.halloweenCandy==0&&partySave.season2Clears[1]==0,"season2 preview isolated");
        }
        var questSave=Player(d);QuestRules.EnsureBoard(d,questSave,new Random(42));
        Require(questSave.quests.Count==6,"six story quests");var quest=questSave.quests[0];
        for(int part=0;part<3;part++)
        {
            Require(QuestRules.CompletePart(d,questSave,quest.uid,part,quest.parts[part].answer),"story part reward");
            Require(!QuestRules.CompletePart(d,questSave,quest.uid,part,quest.parts[part].answer),"stale story part prevented");
        }
        Require(questSave.questMedals==3&&questSave.quests.Count==5,"three medals and completed quest removed");
        Require(QuestRules.ClaimMilestone(d,questSave,d.questMilestones[0])&&!QuestRules.ClaimMilestone(d,questSave,d.questMilestones[0])&&questSave.questMedals==3,"medal reward once and medals retained");
        var questRestored=WebSaveCodec.Import(WebSaveCodec.Export(questSave),d);
        Require(questRestored.quests.Count==5&&questRestored.claims.Contains("quest:cost_seed"),"quest progress Web roundtrip");
        StudyRules.Record(questSave,new Problem{text="日",answer="ひ",tier="kanji_1",language=true},false,1500,"area5_0","漢字");
        var studied=WebSaveCodec.Import(WebSaveCodec.Export(questSave),d);
        Require(studied.study.totalAnswers==1&&studied.study.words.Single().total==1&&studied.study.stages.Single().correct==0,"learning history Web roundtrip");
        foreach(var p in d.kanjiPools.SelectMany(pool=>pool.problems).Where(p=>p.tier.StartsWith("kana")))
            Require(p.options!=null&&(p.options.Length==2||p.options.Length==4)&&p.options.Distinct().Count()==p.options.Length&&p.options.Contains(p.answer),"kana distinct distractors "+p.text);
        for(int n=0;n<300;n++)
        {
            var average=generator.Stage(d.areas.First(a=>a.id=="area11"),4);
            var numbers=System.Text.RegularExpressions.Regex.Matches(average.text,@"\d+").Select(m=>int.Parse(m.Value)).ToArray();
            Require(decimal.Parse(average.answer)==(numbers[0]+numbers[1])/2m,"independent average correctness");
            var multiplication=generator.Tier("mul5");Require(int.Parse(multiplication.text.Split(' ')[0])>=20,"mul5 range");
            var division=generator.Tier("div5");Require(int.Parse(division.answer)>=16&&int.Parse(division.answer)<=19,"div5 quotient range");
        }
        var json = new Dictionary<string, object> { { "日本語", "\"\n🌕" }, { "n", 1023L }, { "items", new List<object> { null, true, 1.25 } } };
        Require(WireJson.Stringify(WireJson.Object(WireJson.Stringify(json))) == WireJson.Stringify(json), "wire roundtrip");
        Require(WireJson.Stringify(FirestoreService.DecodeFields(FirestoreService.EncodeFields(json))) == WireJson.Stringify(json), "firestore field codec");
        string path = Path.Combine(Application.persistentDataPath, "roundtrip.json"); LocalSave.WriteAt(path, s); LocalSave.WriteAt(path, s); File.WriteAllText(path, "broken");
        Require(LocalSave.ReadAt(path)?.gold == s.gold, "corrupt save backup");
        LocalSave.OverridePath = path; bool blocked = false;
        try { new FirestoreService().Commit(new CloudDocument()).GetAwaiter().GetResult(); } catch (InvalidOperationException) { blocked = true; }
        Require(blocked, "QA cloud write blocked");
        var printed=Player(d);var ungraded=PrintRules.Create(d,printed,d.areas[0],0,true);
        var exportedPrint=WireJson.Object(WebSaveCodec.Export(printed));
        Require(exportedPrint.Map("activePrints").ContainsKey(ungraded.id),"print visible to Web");
        exportedPrint.Map("activePrints").Remove(ungraded.id);
        var afterWebGrade=WebSaveCodec.Import(WireJson.Stringify(exportedPrint),d);
        Require(afterWebGrade.prints.Single().claimed&&!PrintRules.Claim(d,afterWebGrade,afterWebGrade.prints[0],ungraded.code,ungraded.problems.Select(Answer).ToArray()),"Web grading cannot be paid again in Unity");
        var bossPrint=PrintRules.CreateBoss(d,printed,d.areas[0]);
        Require(PrintRules.Claim(d,printed,bossPrint,bossPrint.code,bossPrint.problems.Select(Answer).ToArray())&&printed.ClearCount(d.areas[0].id+":boss")==1&&printed.skinGachaTickets==1,"boss print shares clear rewards");
        var skillPrint=PrintRules.CreateSpecial(d,printed,"skill:renzoku");
        Require(PrintRules.Claim(d,printed,skillPrint,skillPrint.code,skillPrint.problems.Select(Answer).ToArray())&&printed.SkillState("renzoku").learned,"skill print learns skill");
        var config=new GameConfiguration();config.Set("equip:w1:atk",9);var modified=Content.Load();GameConfiguration.Load().Apply(modified);
        Require(modified.Equip("w1").stat.atk==9&&d.Equip("w1").stat.atk!=9,"configuration persists without editing catalog");
        config.SetLimit("offline",30);Require(config.Limit("offline").endsAt>DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),"time limit persists future deadline");
        CloudRulesTests.Run(d).GetAwaiter().GetResult();
        Console.WriteLine("PASS: " + checks + " offline native rule checks (no network)");
    }
    static bool PairAnswer(int a,int b,string op,int target)=>op=="add"?a+b==target:op=="sub"?a-b==target:op=="mul"?a*b==target:b!=0&&a%b==0&&a/b==target;
}
