using System;
using System.Linq;
using UnityEngine;

namespace LegendHeroes
{
    public partial class LegendGame
    {
        void ShowQuests()
        {
            QuestRules.EnsureBoard(Data,Save,gameRandom);Persist();
            Begin("quests","村のお願い・サブクエスト",Data.homeImage,ShowFeatureMenu);
            Label(screen,"クエストメダル ×"+Save.questMedals,40,100,700,60,28,gold);
            Button(screen,"メダルの報酬",850,105,380,55,ShowQuestRewards,true);
            var list=Scroll(screen,35,185,1210,570,570);
            for(int i=0;i<Save.quests.Count;i++)
            {
                var q=Save.quests[i];var card=Box(list,"Quest",i%3*400,i/3*280,385,265);
                Picture(card,q.npc.image,15,10,110,120);Label(card,q.npc.name,135,15,235,65,23,gold);
                Label(card,q.title,135,85,235,90,23);Label(card,"進み具合 "+q.partIndex+" / 3",15,160,355,45,22);
                Button(card,"お願いを聞く",15,210,355,42,()=>ShowQuestPart(q),true);
            }
        }
        void ShowQuestPart(StoryQuest quest)
        {
            int index=quest.partIndex;if(index>=3)return;
            var problem=quest.parts[index];
            ShowQuiz(quest.npc.name+"："+quest.title,1,()=>problem,ok=>
            {
                if(ok)QuestRules.CompletePart(Data,Save,quest.uid,index,problem.answer);
                Persist();ShowQuests();Notice(ok?"ありがとう！":"もう一度考えてみよう",ok?"クエストメダル ×1、ゴールドと経験値を獲得しました。":"お願いはそのまま残っています。");
            },25);
        }
        void ShowQuestRewards()
        {
            Begin("quest-rewards","クエストメダルの報酬",Data.homeImage,ShowQuests);
            Label(screen,"集めたメダル ×"+Save.questMedals+"（受け取っても減りません）",40,100,1190,70,28,gold);
            var list=Scroll(screen,35,190,1210,565,Data.questMilestones.Length*120);
            for(int i=0;i<Data.questMilestones.Length;i++)
            {
                var m=Data.questMilestones[i];bool claimed=Save.claims.Contains("quest:"+m.key);
                string kind=m.kind=="equip-ticket"||m.kind=="skin-ticket"?"ticket":m.kind;
                string id=m.kind=="equip-ticket"?"equip-ten-ticket":m.kind=="skin-ticket"?"skin-ticket":m.id;
                var row=Box(list,"Reward",0,i*120,1180,110);Picture(row,RewardImage(kind,id),12,10,90,90);
                Label(row,m.label+"\nメダル "+m.medals+"枚",125,10,740,85,25,gold);
                var button=Button(row,claimed?"受取済み":"受け取る",890,25,260,65,()=>{if(QuestRules.ClaimMilestone(Data,Save,m)){Persist();ShowQuestRewards();}},true);
                button.interactable=!claimed&&Save.questMedals>=m.medals;
            }
        }
    }
}
