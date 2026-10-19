using System;
using UnityEngine;
using UnityEngine.UI;
namespace LegendHeroes
{
    public partial class LegendGame
    {
        Action<string> quizSubmit;Action<bool> quizDone;Problem quizProblem;Func<Problem> quizFactory;int quizPassed,quizGoal;float quizDeadline,quizLimit;Text quizPrompt,quizProgress,quizTimer;InputField quizInput;
        void ShowQuiz(string title,int count,Func<Problem> factory,Action<bool> done,float seconds=20)
        {
            quizSubmit=null;Begin("quiz",title,Data.homeImage,()=>FinishQuiz(false));quizPassed=0;quizGoal=count;quizFactory=factory;quizDone=done;quizLimit=seconds;
            var r=Box(screen,"Quiz",200,150,880,520);quizProgress=Label(r,"",30,20,820,60,30,gold,TextAnchor.MiddleCenter);quizPrompt=Label(r,"",30,95,820,145,38,gold,TextAnchor.MiddleCenter);
            quizInput=Input(r,"",60,265,500,80);Button(r,"こたえる",590,265,230,80,()=>quizSubmit?.Invoke(quizInput.text),true);quizTimer=Label(r,"",30,375,820,60,25,null,TextAnchor.MiddleCenter);quizInput.onSubmit.AddListener(v=>quizSubmit?.Invoke(v));Button(r,"かな入力",590,355,230,50,()=>OpenKanaPad(quizInput,v=>quizSubmit?.Invoke(v),quizProblem.text));quizSubmit=AnswerQuiz;NextQuiz();
        }
        void NextQuiz(){quizProblem=quizFactory();quizPrompt.fontSize=quizProblem.text.Length>50?24:38;quizPrompt.text=quizProblem.text+(quizProblem.language?" のよみ":" = ?")+(quizProblem.remainder>=0?"\n答え あまり 数":"");quizProgress.text=(quizPassed+1)+" / "+quizGoal+" 問";quizInput.text="";quizDeadline=Time.unscaledTime+quizLimit;quizInput.ActivateInputField();}
        void AnswerQuiz(string input){if(quizSubmit==null)return;StudyRules.Record(Save,quizProblem,quizProblem.Accepts(input));if(!quizProblem.Accepts(input)){FinishQuiz(false);return;}Play("se_type",.24f);quizPassed++;if(quizPassed>=quizGoal)FinishQuiz(true);else NextQuiz();}
        void FinishQuiz(bool success){var done=quizDone;quizDone=null;quizSubmit=null;done?.Invoke(success);}
        void UpdateQuiz(){if(CurrentScreen!="quiz"||quizSubmit==null)return;float left=Mathf.Max(0,quizDeadline-Time.unscaledTime);quizTimer.text="のこり "+left.ToString("0.0")+" 秒";if(left<=0)FinishQuiz(false);}
    }
}
