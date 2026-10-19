using System.Globalization;
using System.Text;

namespace LegendHeroes
{
    public static class KanaRules
    {
        public static string Script(string text,bool katakana)
        {
            var b=new StringBuilder();foreach(char c in text)b.Append(katakana&&c>='ぁ'&&c<='ゖ'?(char)(c+0x60):!katakana&&c>='ァ'&&c<='ヶ'?(char)(c-0x60):c);return b.ToString();
        }
        public static string Delete(string text)
        {
            if(string.IsNullOrEmpty(text))return "";var elements=StringInfo.ParseCombiningCharacters(text);return text.Substring(0,elements[elements.Length-1]);
        }
        public static string Modify(string text,string mode)
        {
            if(string.IsNullOrEmpty(text))return text;
            string start=Delete(text),last=text.Substring(start.Length),hira=Script(last,false);bool katakana=last!=hira;
            if(mode=="small")
            {
                const string large="あいうえおやゆよつわ",small="ぁぃぅぇぉゃゅょっゎ";
                int i=large.IndexOf(hira);if(i>=0)hira=small[i].ToString();else{i=small.IndexOf(hira);if(i>=0)hira=large[i].ToString();}
                return start+Script(hira,katakana);
            }
            string decomposed=hira.Normalize(NormalizationForm.FormD);char basis=decomposed[0];
            bool semi=mode=="semi";
            if((semi?"はひふへほ":"かきくけこさしすせそたちつてとはひふへほう").IndexOf(basis)<0)return text;
            char mark=semi?'\u309a':'\u3099';
            string changed=decomposed.Length>1&&decomposed[1]==mark?basis.ToString():(basis.ToString()+mark).Normalize(NormalizationForm.FormC);
            return start+Script(changed,katakana);
        }
    }
}
