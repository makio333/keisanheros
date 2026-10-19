using System;
using System.Linq;
using UnityEngine;
using UnityEngine.UI;
namespace LegendHeroes
{
    public partial class LegendGame
    {
        EventCombat eventCombat;Text eventPrompt,eventTimer,eventInfo;InputField eventInput;RectTransform eventBoard;Button eventSubmit;float nextEventRefresh;bool eventShowingResult;
        void ShowHalloween()
        {
            Begin("halloween","ハロウィンの森", "assets/halloween/battle_background.png",ShowFeatureMenu);Label(screen,"お菓子 ×"+Save.halloweenCandy+"    チケット ×"+Save.halloweenTickets,40,100,1180,70,30,gold);
            Button(screen,"ステージに挑戦する",40,195,580,115,()=>BeginEvent(false,false,false,0,"add","answer",false),true);Button(screen,"景品を交換",650,195,590,115,()=>ShowExchange(false));
            Label(screen,"シーズン2：複数モンスター戦",40,340,1180,65,32,gold);string[] names={"お菓子の小道","月夜のおばけ広場","かかし王の夜会"};string[] modes={"answer","combine","mixed"};
            for(int i=0;i<3;i++){int stage=i;Button(screen,names[i],40+i*405,430,390,90,()=>ShowEventOperations(stage,modes[stage]),true);}
            Button(screen,"ハロウィンガチャ",40,640,580,80,()=>ShowGacha("ハロウィン"));Button(screen,"イベントレイド",650,640,590,80,ShowRaids);
        }
        void ShowEventOperations(int stage,string mode)
        {
            Begin("event-operation","シーズン2・計算を選ぶ","assets/halloween/battle_background.png",ShowHalloween);string[] ops={"add","sub","mul","div"},names={"たし算","ひき算","かけ算","わり算"};
            bool before=DateTimeOffset.UtcNow<new DateTimeOffset(2026,10,21,0,0,0,TimeSpan.FromHours(9));for(int i=0;i<4;i++){string op=ops[i];Button(screen,names[i]+(before?"（先行テスト）":""),70+i%2*600,180+i/2*230,550,185,()=>BeginEvent(false,false,true,stage,op,mode,before),true);}
        }
        void BeginEvent(bool timed,bool kanji,bool season2,int stage,string operation,string mode,bool test)
        {
            if(Save.hp<=0)Save.hp=Save.Stat(Data,"hp");eventCombat=new EventCombat(Data,Save,timed,kanji,season2,stage,operation,mode,test,DateTimeOffset.UtcNow);eventShowingResult=false;BuildEventView();
        }
        void BuildEventView()
        {
            Begin("event-combat",eventCombat.timed?"2分間・ハロウィンレイド":eventCombat.season2?"シーズン2・おばけの夜会":"ハロウィンの森","assets/halloween/battle_background.png",()=>{eventCombat.End(DateTimeOffset.UtcNow);ShowEventResult();});
            eventInfo=Label(screen,"",35,95,900,55,27,gold);eventTimer=Label(screen,"",970,95,275,55,28,gold,TextAnchor.MiddleRight);eventBoard=Box(screen,"Enemies",30,165,1220,340,new Color(.07f,.04f,.12f,.7f));eventPrompt=Label(screen,"",35,520,1210,90,34,gold,TextAnchor.MiddleCenter);
            eventInput=Input(screen,"",210,640,560,80);eventInput.onSubmit.AddListener(SubmitEventAnswer);eventSubmit=Button(screen,"こたえる",810,640,260,80,()=>SubmitEventAnswer(eventInput.text),true);if(eventCombat.season2)Button(screen,"全体攻撃 MP5",450,700,380,55,()=>{if(eventCombat.SelectPartySkill())eventInfo.text="次の正解で全体攻撃！ MP5";});if(eventCombat.kanji)Button(screen,"かな入力",1075,640,165,80,()=>OpenKanaPad(eventInput,SubmitEventAnswer,eventCombat.problem.text+" のよみ"));RenderEventBoard();
        }
        void RenderEventBoard()
        {
            foreach(Transform child in eventBoard){child.gameObject.SetActive(false);Destroy(child.gameObject);}var run=eventCombat;int n=run.enemies.Count;float w=1180/Math.Max(1,n),size=Mathf.Min(230,w-10);
            foreach(var e in run.enemies){int slot=e.slot;float x=20+slot*w;var m=Data.eventMonsters[e.monster];var b=Button(eventBoard,"",x,25,w-8,280,()=>{if(!run.season2)return;int before=run.answers;bool correct=run.Select(slot,DateTimeOffset.UtcNow);if(run.answers!=before)Play(correct?"se_type":"se_slash",correct?.24f:.36f);if(run.over)ShowEventResult();else RenderEventBoard();},run.selected.Contains(slot));Picture(b.transform,m.image,(w-size)/2,20,size,size);Label(b.transform,run.season2?e.number.ToString():m.name,4,190,w-16,55,run.season2?30:17,gold,TextAnchor.MiddleCenter);Label(b.transform,"HP "+e.hp,4,246,w-16,30,16,null,TextAnchor.MiddleCenter);}
            eventPrompt.text=run.problem.text+(run.problem.language?" のよみ":"")+(run.season2?"":run.problem.remainder>=0?"\n答え あまり 数":" = ?");eventInfo.text="撃破 "+run.kills+" 体   HP "+Save.hp+"   必殺 "+run.charge+" / 5"+(run.test?"（テスト・報酬と順位へ反映しません）":"");eventInput.text="";eventInput.gameObject.SetActive(!run.season2);eventSubmit.gameObject.SetActive(!run.season2);if(!run.season2)eventInput.ActivateInputField();
        }
        void SubmitEventAnswer(string input){if(eventCombat==null||eventCombat.over||CurrentScreen!="event-combat")return;bool ok=eventCombat.Answer(input,DateTimeOffset.UtcNow);Play(ok?"se_type":"se_slash",ok?.24f:.36f);if(ok)Play("se_slash",.36f);if(eventCombat.over)ShowEventResult();else RenderEventBoard();}
        void UpdateEventCombat()
        {
            if(CurrentScreen!="event-combat"||eventCombat==null||eventShowingResult)return;var now=DateTimeOffset.UtcNow;double remain=eventCombat.Remaining(now);eventTimer.text=eventCombat.timed?TimeSpan.FromSeconds(remain).ToString(@"mm\:ss"):remain.ToString("0.0")+" 秒";if(remain<=0){eventCombat.Timeout(now);if(eventCombat.over)ShowEventResult();else RenderEventBoard();}
        }
        void ShowEventResult()
        {
            if(eventShowingResult)return;eventShowingResult=true;var run=eventCombat;if(run.timed&&!run.test)Save.pendingRuns.Add(new PendingRaidEvent{id=Guid.NewGuid().ToString("N"),mode=run.kanji?"kanji":"math",kills=run.kills,finishedAt=DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()});Persist();Begin("event-result","終了！","assets/halloween/battle_background.png");Label(screen,"TIME UP！",80,140,1120,100,60,gold,TextAnchor.MiddleCenter);Label(screen,"倒したおばけ  "+run.kills+" 体\n獲得したお菓子  ×"+run.candy+"\n回答 "+run.answers+" 問",100,280,1080,240,38,null,TextAnchor.MiddleCenter);Button(screen,"もどる",390,650,500,85,run.timed?(Action)ShowRaids:ShowHalloween,true);Play("se_clear",.5f);
        }
    }
}
