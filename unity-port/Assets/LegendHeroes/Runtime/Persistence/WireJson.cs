using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.Text;
namespace LegendHeroes
{
    // Data-only JSON codec, used to preserve Web save fields that this version does not edit.
    public static class WireJson
    {
        public static Dictionary<string,object> Object(string json)=>Parse(json) as Dictionary<string,object>??new Dictionary<string,object>();
        public static object Parse(string json){var p=new Reader(json);var v=p.Value(0);p.White();if(p.index!=json.Length)throw new FormatException("Trailing JSON data");return v;}
        public static string Stringify(object value){var b=new StringBuilder();Write(b,value);return b.ToString();}
        static void Write(StringBuilder b,object value)
        {
            if(value==null){b.Append("null");return;}if(value is string s){b.Append('"');foreach(char c in s){switch(c){case '"':b.Append("\\\"");break;case '\\':b.Append("\\\\");break;case '\n':b.Append("\\n");break;case '\r':b.Append("\\r");break;case '\t':b.Append("\\t");break;default:if(c<32)b.Append("\\u"+((int)c).ToString("x4"));else b.Append(c);break;}}b.Append('"');return;}
            if(value is bool flag){b.Append(flag?"true":"false");return;}if(value is IDictionary map){b.Append('{');bool first=true;foreach(DictionaryEntry e in map){if(!first)b.Append(',');first=false;Write(b,Convert.ToString(e.Key,CultureInfo.InvariantCulture));b.Append(':');Write(b,e.Value);}b.Append('}');return;}
            if(value is IEnumerable list){b.Append('[');bool first=true;foreach(var e in list){if(!first)b.Append(',');first=false;Write(b,e);}b.Append(']');return;}b.Append(Convert.ToString(value,CultureInfo.InvariantCulture));
        }
        sealed class Reader
        {
            readonly string text;public int index;
            public Reader(string s){if(s==null||s.Length>16000000)throw new FormatException("JSON size");text=s;}
            public void White(){while(index<text.Length&&char.IsWhiteSpace(text[index]))index++;}
            char Take(){if(index>=text.Length)throw new FormatException("Unexpected JSON end");return text[index++];}
            public object Value(int depth)
            {
                if(depth>128)throw new FormatException("JSON nesting");White();char c=Take();
                if(c=='"')return Quoted();if(c=='{'){var m=new Dictionary<string,object>();White();if(index<text.Length&&text[index]=='}'){index++;return m;}while(true){White();if(Take()!='"')throw new FormatException("Object key");string k=Quoted();White();if(Take()!=':')throw new FormatException("Missing colon");m[k]=Value(depth+1);White();char sep=Take();if(sep=='}')return m;if(sep!=',')throw new FormatException("Object separator");}}
                if(c=='['){var a=new List<object>();White();if(index<text.Length&&text[index]==']'){index++;return a;}while(true){a.Add(Value(depth+1));White();char sep=Take();if(sep==']')return a;if(sep!=',')throw new FormatException("Array separator");}}
                if(c=='t'){Literal("rue");return true;}if(c=='f'){Literal("alse");return false;}if(c=='n'){Literal("ull");return null;}
                int start=index-1;while(index<text.Length&&"0123456789eE+-.".IndexOf(text[index])>=0)index++;string n=text.Substring(start,index-start);if(long.TryParse(n,NumberStyles.Integer,CultureInfo.InvariantCulture,out long integer))return integer;if(double.TryParse(n,NumberStyles.Float,CultureInfo.InvariantCulture,out double number)&&!double.IsNaN(number)&&!double.IsInfinity(number))return number;throw new FormatException("JSON number");
            }
            void Literal(string value){foreach(char c in value)if(Take()!=c)throw new FormatException("JSON literal");}
            string Quoted(){var b=new StringBuilder();while(true){char c=Take();if(c=='"')return b.ToString();if(c=='\\'){char e=Take();switch(e){case '"':case '\\':case '/':b.Append(e);break;case 'b':b.Append('\b');break;case 'f':b.Append('\f');break;case 'n':b.Append('\n');break;case 'r':b.Append('\r');break;case 't':b.Append('\t');break;case 'u':int v=0;for(int i=0;i<4;i++)v=v*16+Convert.ToInt32(Take().ToString(),16);b.Append((char)v);break;default:throw new FormatException("JSON escape");}}else{if(c<32)throw new FormatException("Control in string");b.Append(c);}}}
        }
        public static object Get(this IDictionary<string,object> m,string key,object fallback=null)=>m!=null&&m.TryGetValue(key,out var value)?value:fallback;
        public static string Str(this IDictionary<string,object> m,string key,string fallback="")=>Convert.ToString(m.Get(key,fallback),CultureInfo.InvariantCulture)??fallback;
        public static int Int(this IDictionary<string,object> m,string key,int fallback=0){try{return Convert.ToInt32(m.Get(key,fallback),CultureInfo.InvariantCulture);}catch{return fallback;}}
        public static long Long(this IDictionary<string,object> m,string key,long fallback=0){try{return Convert.ToInt64(m.Get(key,fallback),CultureInfo.InvariantCulture);}catch{return fallback;}}
        public static bool Bool(this IDictionary<string,object> m,string key)=>m.Get(key) is bool b&&b;
        public static Dictionary<string,object> Map(this IDictionary<string,object> m,string key)=>m.Get(key) as Dictionary<string,object>??new Dictionary<string,object>();
        public static List<object> List(this IDictionary<string,object> m,string key)=>m.Get(key) as List<object>??new List<object>();
    }
}
