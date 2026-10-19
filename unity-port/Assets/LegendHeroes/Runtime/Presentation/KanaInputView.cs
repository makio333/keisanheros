using System;
using UnityEngine;
using UnityEngine.UI;

namespace LegendHeroes
{
    public partial class LegendGame
    {
        void OpenKanaPad(InputField input,Action<string> submit,string prompt,bool katakana=false)
        {
            if(!input||!input.interactable||CurrentScreen=="battle"&&resolving)return;
            input.DeactivateInputField();var overlay=Box(screen,"Kana keyboard",0,0,1280,800,new Color(.035f,.025f,.075f,.99f));
            Label(overlay,prompt,50,25,1180,100,36,gold,TextAnchor.MiddleCenter);
            var output=Label(overlay,input.text,140,145,800,75,38,gold,TextAnchor.MiddleCenter);
            var board=Rect(overlay,"Keys",65,250,1150,325);
            Action<string> set=value=>{if(!input)return;input.text=value;output.text=input.text;};
            Action redraw=null;
            redraw=()=>
            {
                foreach(Transform child in board){child.gameObject.SetActive(false);Destroy(child.gameObject);}
                string[] rows={"あいうえお","かきくけこ","さしすせそ","たちつてと","なにぬねの","はひふへほ","まみむめも","や ゆ よ","らりるれろ","わをんー "};
                for(int block=0;block<2;block++)for(int row=0;row<5;row++)
                {
                    string line=KanaRules.Script(rows[block*5+row],katakana);float left=block*580;
                    Label(board,line[0]+"行",left,row*64,75,58,20,gold,TextAnchor.MiddleCenter);
                    for(int col=0;col<5;col++){string key=line[col].ToString();if(key==" ")continue;Button(board,key,left+80+col*97,row*64,88,58,()=>{if(input&&input.text.Length<40)set(input.text+key);},true);}
                }
            };
            Button toggle=null;toggle=Button(overlay,katakana?"カタカナ → ひらがな":"ひらがな → カタカナ",955,145,275,75,()=>{katakana=!katakana;toggle.GetComponentInChildren<Text>().text=katakana?"カタカナ → ひらがな":"ひらがな → カタカナ";redraw();});
            redraw();
            Button(overlay,"゛ 濁点",65,600,265,65,()=>{if(input)set(KanaRules.Modify(input.text,"voiced"));});
            Button(overlay,"゜ 半濁点",350,600,265,65,()=>{if(input)set(KanaRules.Modify(input.text,"semi"));});
            Button(overlay,"小さく",635,600,265,65,()=>{if(input)set(KanaRules.Modify(input.text,"small"));});
            Button(overlay,"⌫ けす",920,600,265,65,()=>{if(input)set(KanaRules.Delete(input.text));});
            Button(overlay,"もどる",180,705,400,65,()=>{overlay.gameObject.SetActive(false);Destroy(overlay.gameObject);if(input)input.ActivateInputField();});
            Button(overlay,"こたえる",700,705,400,65,()=>{if(!input)return;string answer=input.text;overlay.gameObject.SetActive(false);Destroy(overlay.gameObject);submit(answer);},true);
        }
    }
}
