using System;
using System.Linq;
using UnityEngine;
using UnityEngine.UI;

namespace LegendHeroes
{
    public partial class LegendGame
    {
        RectTransform battleChoices;Button battleSubmit;Text battleHelp;
        public void StartBattle(Area area,int index,bool boss=false)
        {
            if(Save.hp<=0)Save.hp=Save.Stat(Data,"hp");
            Battle=new BattleRun(Data,Save,area,index,boss);BuildBattleView();
        }
        void BuildBattleView()
        {
            Begin("battle",Battle.area.name+"  /  "+(Battle.boss?"ボス":Battle.area.stages[Battle.stageIndex].name),Battle.area.image,()=>Notice("拠点へもどる","倒した敵の獲得分は保存されます。この挑戦を終了しますか？",()=>{Persist();Battle=null;ShowHome();}));
            combatStage=Box(screen,"Combat",30,105,1220,375,new Color(.06f,.03f,.12f,.55f));
            Avatar(combatStage,Save,35,35,280);Label(combatStage,Save.playerName,35,310,300,40,24,gold);
            monsterArt=Picture(combatStage,Battle.enemy.image,875,15,300,280);monsterStatus=Label(combatStage,"",795,300,400,40,24,gold,TextAnchor.MiddleCenter);
            playerBar=Box(combatStage,"Player HP",370,95,390,18,new Color(.3f,.9f,.65f)).GetComponent<Image>();
            enemyBar=Box(combatStage,"Enemy HP",800,270,390,18,new Color(.9f,.3f,.45f)).GetComponent<Image>();
            playerStatus=Label(combatStage,"",370,120,390,60,22);battleStatus=Label(combatStage,"",360,180,430,115,29,gold,TextAnchor.MiddleCenter);
            Button(combatStage,"特技 / MP "+Save.mp,370,320,190,42,ShowBattleSkills);
            Button(combatStage,"回復アイテム",575,320,190,42,ShowBattleItems);
            var q=Box(screen,"Question",30,500,1220,266);
            questionText=Label(q,"",25,12,900,96,42,gold,TextAnchor.MiddleCenter);timerText=Label(q,"",940,12,255,80,24,null,TextAnchor.MiddleCenter);
            answerInput=Input(q,"",160,125,580,78,!Battle.question.language);answerInput.onSubmit.AddListener(SubmitAnswer);
            battleSubmit=Button(q,"こたえる",770,125,285,78,()=>SubmitAnswer(answerInput.text),true);
            battleHelp=Label(q,"正解で攻撃！  まちがい・時間切れで敵の攻撃",160,215,900,35,21,null,TextAnchor.MiddleCenter);
            battleChoices=Rect(q,"Kana choices",20,105,1180,105);
            if(Battle.question.language)Button(q,"かな入力",955,215,230,35,()=>OpenKanaPad(answerInput,SubmitAnswer,Battle.question.text+" のよみ"));
            UpdateBattleView();
        }
        void UpdateBattleView()
        {
            if(Battle==null)return;
            questionText.text=Battle.question.language?Battle.question.text+" の よみかた":Battle.question.text+" = ?";if(Battle.question.remainder>=0)questionText.text+=" （答え あまり 数）";
            playerStatus.text="HP  "+Save.hp+" / "+Save.Stat(Data,"hp")+"\nMP  "+Save.mp+" / "+Save.Stat(Data,"mp");monsterStatus.text=Battle.enemy.name+"  "+Battle.enemyHp+" / "+Battle.maxEnemyHp;
            playerBar.rectTransform.sizeDelta=new Vector2(390f*Save.hp/Save.Stat(Data,"hp"),18);enemyBar.rectTransform.sizeDelta=new Vector2(390f*Battle.enemyHp/Battle.maxEnemyHp,18);
            var tex=Art(Battle.enemy.image);monsterArt.texture=tex;
            deadline=Time.unscaledTime+BattleQuestionSeconds;
            answerInput.text="";answerInput.ActivateInputField();
            foreach(Transform child in battleChoices){child.gameObject.SetActive(false);Destroy(child.gameObject);}
            var choices=Battle.question.options;bool multiple=choices!=null&&choices.Length>=2;
            answerInput.gameObject.SetActive(!multiple);battleSubmit.gameObject.SetActive(!multiple);
            if(multiple)
            {
                questionText.text=string.IsNullOrEmpty(Battle.question.prompt)?"ただしい かきかたは どれ？":Battle.question.prompt;
                var shuffled=choices.OrderBy(_=>gameRandom.Next()).ToArray();float width=1160f/shuffled.Length;
                for(int i=0;i<shuffled.Length;i++){string option=shuffled[i];Button(battleChoices,option,i*width,5,width-12,90,()=>SubmitAnswer(option),true);}
            }
            battleStatus.text="撃破 "+Battle.kills+" / "+(Battle.boss?1:5);
        }
        public void SubmitAnswer(string input)
        {
            if(resolving||Battle==null||Battle.finished)return;
            bool correct=Battle.question.Accepts(input);string spelling=Battle.question.answer;
            resolving=true;int damage=Battle.Answer(input,Math.Max(0,(deadline-Time.unscaledTime)/Math.Max(1,BattleQuestionSeconds)));
            Persist();battleStatus.text=correct?damage>0?(Battle.lastCrit?"会心！":"正解！")+"\n"+damage+" ダメージ":"正解！ 回復した！":Battle.lastEvaded?"攻撃をよけた！":"まちがい！\n"+(-damage)+" ダメージ";
            if(!correct)battleHelp.text="正解は「"+spelling+"」";
            if(correct){Play("se_type",.24f);if(damage>0)Play(Battle.lastCrit?"se_crit":"se_slash",.36f);}else Play("se_slash",.2f);
            answerInput.DeactivateInputField();answerInput.interactable=false;
            Invoke(nameof(ContinueBattle),.65f);
        }
        float BattleQuestionSeconds=>Battle.boss?(Battle.phase==2?Battle.area.bossTimeLimit2:Battle.area.bossTimeLimit1)/1000f:Battle.area.stages[Battle.stageIndex].timeLimit/1000f;
        void ShowBattleSkills()
        {
            if(resolving||Battle==null||Battle.finished)return;
            var options=Data.skills.Where(s=>Save.SkillState(s.id).learned).ToArray();
            BattleCommandMenu("特技を選ぶ",options.Select(s=>s.name+" / MP "+Math.Max(1,s.mp-(Save.HasAbility(Data,"mp_save")?1:0))).ToArray(),index=>Battle.SelectSkill(options[index].id));
        }
        void ShowBattleItems()
        {
            if(resolving||Battle==null||Battle.finished)return;
            var options=Data.items.Where(i=>Save.ItemCount(i.id)>0&&(i.effect=="heal"||i.effect=="mana")).ToArray();
            BattleCommandMenu("道具を選ぶ",options.Select(i=>i.name+" ×"+Save.ItemCount(i.id)).ToArray(),index=>Battle.SelectItem(options[index].id));
        }
        void BattleCommandMenu(string title,string[] names,Func<int,bool> apply)
        {
            resolving=true;float remaining=Mathf.Max(0,deadline-Time.unscaledTime);
            var overlay=Box(screen,"Battle commands",0,0,1280,800,new Color(0,0,0,.85f));
            Label(overlay,title,200,70,880,65,34,gold,TextAnchor.MiddleCenter);
            var list=Scroll(overlay,220,160,840,430,Math.Max(430,names.Length*82));
            Action close=()=>{Destroy(overlay.gameObject);resolving=false;deadline=Time.unscaledTime+remaining;playerStatus.text="HP "+Save.hp+" / "+Save.Stat(Data,"hp")+"  MP "+Save.mp;};
            for(int i=0;i<names.Length;i++){int index=i;Button(list,names[i],10,i*82,810,70,()=>{if(apply(index)){close();UpdateBattleView();battleHelp.text=Battle.selectedSkill!=null?Battle.selectedSkill.name+"：正解して発動！":"正解すると道具を使います";}},true);}
            if(names.Length==0)Label(list,"使えるものがありません。",25,40,780,90,28);
            Button(overlay,"もどる",420,650,440,75,close);
        }
        void ContinueBattle()
        {
            resolving=false;if(Battle.finished){ShowBattleResult();return;}answerInput.interactable=true;UpdateBattleView();
        }
        void ShowBattleResult()
        {
            var run=Battle;Persist();Begin("result",run.won?"ステージクリア！":"また挑戦しよう",run.area.image);
            var r=Box(screen,"Result",90,120,1100,640);
            Label(r,run.won?"ステージクリア！":"力をためて、もう一度！",25,15,1050,65,36,gold,TextAnchor.MiddleCenter);
            Label(r,"撃破 "+run.kills+" 体　正解 "+run.correct+" 回　まちがい "+run.mistakes+" 回",30,85,1040,55,27);
            Label(r,"獲得ゴールド +"+run.gold+" G　獲得経験値 +"+run.exp,30,145,1040,55,28,gold);
            RewardGrid(r,run.rewards,20,220,1060,285);
            Button(r,"拠点へもどる",280,545,540,70,()=>{Battle=null;ShowHome();},true);if(run.won)Play("se_clear",.35f);
        }
    }
}
