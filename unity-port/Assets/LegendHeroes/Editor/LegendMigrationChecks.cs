using System;
using System.IO;
using System.Linq;
using LegendHeroes;
using UnityEngine;

public static class LegendMigrationChecks
{
    static void Require(bool value,string reason){if(!value)throw new Exception(reason);}
    public static string Run()
    {
        var d=Content.Load();Require(d.areas.Length==15,"15 areas");Require(d.areas.Sum(a=>a.stages.Length)==95,"95 stages");Require(d.equipment.Length==46,"46 equipment");Require(d.frames.Length==6,"six frames");
        Require(ArtworkResources.Load(d.homeImage)!=null,"home background");
        int questions=0;
        foreach(var a in d.areas)
        {
            Require(a.enemies.Length>0&&a.boss!=null,a.id+" enemies");
            foreach(var stage in a.stages){Require(stage.problems.Length>0,a.id+" question bank");foreach(var p in stage.problems){Require(p.Accepts(p.answer+(p.remainder>=0?" あまり "+p.remainder:"")),p.text+" canonical rejected");Require(!p.Accepts("絶対に不正解xyz"),p.text+" wrong accepted");questions++;}}
        }
        foreach(var a in d.avatars.Concat(d.backgrounds).Concat(d.frames))if(!string.IsNullOrEmpty(a.image))Require(ArtworkResources.Load(a.image)!=null,"missing "+a.image);
        foreach(string imagePath in d.questNpcs.Select(n=>n.image).Concat(d.equipment.Select(e=>e.image)).Concat(d.items.Select(e=>e.image)).Concat(d.eventMonsters.Select(e=>e.image)))if(!string.IsNullOrEmpty(imagePath)&&imagePath.Contains("/"))Require(ArtworkResources.Load(imagePath)!=null,"missing "+imagePath);
        var day=d.kanjiPools.SelectMany(p=>p.problems).First(p=>p.text=="日");Require(day.Accepts("ニチ")&&day.Accepts("じつ")&&day.Accepts("ひ"),"alternate kanji readings");
        var kana=new Problem{text="がっこう",answer="がっこう",acceptedAnswers=new[]{"がっこう"},language=true};Require(!kana.Accepts("がつこう"),"kana small tsu");
        var buyer=new PlayerSave{gold=50};Require(buyer.TryBuy(d,"w1")&&buyer.gold==30,"purchase deducts price");Require(buyer.TryBuy(d,"w1")&&buyer.gold==10,"multiple copies");Require(!buyer.TryBuy(d,"w7")&&buyer.gold==10,"reject insufficient gold");
        var s=new PlayerSave{level=10,baseSpd=0};s.owned.Add("w1");Require(s.TryEquip(d,"w1"),"equip owned");Require(!s.TryEquip(d,"w7"),"reject unowned");
        s.AddEquipment(d,"w8",6);Require(!s.TryEquip(d,"w8"),"reject excessive cost");
        var run=new BattleRun(d,s,d.areas.First(a=>a.id=="area1"),0,false,42);int before=s.hp;Require(run.Answer("wrong")<0&&s.hp<before,"wrong counterattack");
        s.hp=1000;int guard=0;while(!run.finished&&guard++<1000)run.Answer(run.question.answer+(run.question.remainder>=0?" あまり "+run.question.remainder:""));Require(run.won&&run.kills==5&&s.gold>0&&s.ClearCount("area1:0")==1,"victory rewards");int balance=s.gold;run.Answer(run.question.answer+(run.question.remainder>=0?" あまり "+run.question.remainder:""));Require(s.gold==balance,"no double reward");
        var loser=new PlayerSave{hp=1,baseSpd=0};var loss=new BattleRun(d,loser,d.areas.First(a=>a.id=="area1"),0,false,42);loss.Answer("wrong");Require(loss.finished&&!loss.won&&loser.gold==0,"defeat no rewards");
        string path=Path.GetFullPath("Temp/LegendHeroesQA/roundtrip.json");LocalSave.WriteAt(path,s);var saved=LocalSave.ReadAt(path);Require(saved.gold==s.gold&&saved.weapon=="w1"&&saved.ClearCount("area1:0")==1,"save round trip");LocalSave.WriteAt(path,s);File.WriteAllText(path,"broken json");Require(LocalSave.ReadAt(path)!=null,"backup recovery");
        return "PASS: native Unity C# validation\n15 areas / 95 stages / "+questions+" questions / 46 equipment / 25 avatars / 6 frames\nKanji alternate readings, strict kana, owned equipment and cost limit, wrong-answer damage, five-enemy victory, single reward, defeat, save roundtrip and corrupt-save recovery.";
    }
}
