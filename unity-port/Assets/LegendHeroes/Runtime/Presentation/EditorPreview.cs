#if UNITY_EDITOR
using System;
using System.IO;
using System.Linq;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;
using System.Collections.Generic;
namespace LegendHeroes
{
    public partial class LegendGame
    {
        float nextPreviewPoll;
        string previewError="";
        string previewRequestId="";
        [Serializable] class PreviewCommand { public string action, value,requestId; public int index; }
        [Serializable] class PreviewState { public string screen, question, answer, name, savePath, error,requestId; public int hp, enemyHp, gold, kills;public string[] buttons,labels; }
        void PollEditorPreview()
        {
            if(Time.unscaledTime<nextPreviewPoll)return;nextPreviewPoll=Time.unscaledTime+.3f;
            var dir=Path.GetFullPath(Path.Combine(Application.dataPath,"../Temp/LegendHeroesQA"));Directory.CreateDirectory(dir);
            var command=Path.Combine(dir,"command.json");if(!File.Exists(command)){WritePreviewState(dir, previewError);return;}
            string error="";
            try
            {
                var c=JsonUtility.FromJson<PreviewCommand>(File.ReadAllText(command));File.Delete(command);
                previewRequestId=c.requestId;
                switch(c.action)
                {
                    case "fixture":LocalSave.OverridePath=Path.Combine(dir,"preview-save.json");Save=new PlayerSave{playerName="動作確認",avatar="halloween_ghost_ranger",background="halloween_moon_garden",frame="moon_ribbon",gold=200};sound.mute=true;music.mute=true;Save.Normalize(Data);Save.frames=Data.frames.Select(f=>f.id).ToList();Save.backgrounds=Data.backgrounds.Select(f=>f.id).ToList();ShowHome();break;
                    case "prepare":
                        if(!LocalSave.PathName.Contains("LegendHeroesQA"))throw new InvalidOperationException("QA save required");
                        Save.gold=10000;Save.level=40;Save.hp=Save.baseHp=10000;Save.mp=Save.baseMp=100;
                        Save.AddEquipment(Data,"w1");Save.AddEquipment(Data,"w1");Save.AddItem("cost_seed",2);Save.AddItem("respec_seed",1);Save.points=3;Save.Allocate("atk");
                        foreach(var skill in Data.skills)Save.SkillState(skill.id).learned=true;Save.holoSkins.Add(Save.avatar);Save.avatarHolographic=true;ShowHome();break;
                    case "probe":
                        var lines=new List<string>();
                        foreach(var b in screen.GetComponentsInChildren<Button>()){
                            var rect=(RectTransform)b.transform;var position=RectTransformUtility.WorldToScreenPoint(null,rect.TransformPoint(rect.rect.center));
                            var results=new List<RaycastResult>();EventSystem.current.RaycastAll(new PointerEventData(EventSystem.current){position=position},results);
                            lines.Add(b.name+" | "+position+" | "+string.Join(",",results.Take(3).Select(r=>r.gameObject.name)));
                        }
                        File.WriteAllLines(Path.Combine(dir,"raycasts.txt"),lines);break;
                    case "home":ShowHome();break;
                    case "screenshot":ScreenCapture.CaptureScreenshot(Path.Combine(dir,"preview.png"));break;
                    case "battle":StartBattle(Data.areas.First(a=>a.id==c.value),c.index);break;
                    case "answer":if(CurrentScreen=="quiz")quizSubmit?.Invoke(c.value);else if(CurrentScreen=="event-combat")SubmitEventAnswer(c.value);else SubmitAnswer(c.value);break;
                    case "shop":ShowEquipment(true);break;
                    case "equipment":ShowEquipment(false);break;
                    case "appearance":ShowAppearance("フレーム");break;
                    case "menu":ShowFeatureMenu();break;
                    case "quests":ShowQuests();break;
                    case "study":ShowStudyReport();break;
                    case "admin":ShowAdminOptions();break;
                    case "items":ShowItems(c.index==1);break;
                    case "gacha":ShowGacha(string.IsNullOrEmpty(c.value)?"装備":c.value);break;
                    case "exchange":ShowExchange(c.index==1);break;
                    case "training":ShowTraining();break;
                    case "synthesis":ShowSynthesis();break;
                    case "prints":ShowPrintMenu();break;
                    case "halloween":ShowHalloween();break;
                    case "event":BeginEvent(c.index==1,false,c.index==2,0,"add","answer",true);break;
                    case "event-finish":eventCombat.End(DateTimeOffset.UtcNow.AddMinutes(3));ShowEventResult();break;
                    case "gift":
                        if(!LocalSave.PathName.Contains("LegendHeroesQA"))throw new InvalidOperationException("QA save required");
                        Save.pendingGifts.Add(new Gift{id="qa-gift",message="動作確認のプレゼント",gold=50,items=new[]{new GiftItem{id="cost_seed",kind="item",count=2}}});ShowGifts();break;
                    case "raids":ShowRaids();break;
                    case "click":
                        var button=screen.GetComponentsInChildren<Button>().First(b=>b.name==c.value&&b.interactable);
                        button.onClick.Invoke();break;
                    case "save":Persist();break;
                    case "restore":LocalSave.OverridePath=null;Save=LocalSave.Read();ShowTitle();break;
                    default:throw new Exception("Unknown preview command");
                }
            }
            catch(Exception e){error=e.ToString();Debug.LogException(e);}
            previewError=error;WritePreviewState(dir, error);
        }
        void WritePreviewState(string dir,string error)
        {
            var problem=CurrentScreen=="quiz"?quizProblem:CurrentScreen=="event-combat"?eventCombat?.problem:Battle?.question;
            File.WriteAllText(Path.Combine(dir,"state.json"),JsonUtility.ToJson(new PreviewState{requestId=previewRequestId,screen=CurrentScreen,question=problem?.text,answer=problem==null?"":problem.answer+(problem.remainder>=0?" あまり "+problem.remainder:""),name=Save?.playerName,hp=Save?.hp??0,enemyHp=Battle?.enemyHp??0,kills=Battle?.kills??0,gold=Save?.gold??0,savePath=LocalSave.PathName,error=error,buttons=screen.GetComponentsInChildren<Button>().Where(b=>b.interactable).Select(b=>b.name).ToArray(),labels=screen.GetComponentsInChildren<Text>().Select(t=>t.text).ToArray()},true));
        }
    }
}
#endif
