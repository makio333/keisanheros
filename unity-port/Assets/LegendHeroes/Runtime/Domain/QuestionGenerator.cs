using System;
using System.Globalization;
using System.Linq;
namespace LegendHeroes
{
    // Procedural arithmetic is independent of rendering; language uses the full licensed pools.
    public sealed class QuestionGenerator
    {
        readonly Random random; readonly Content data;
        public QuestionGenerator(Content content,Random rng){data=content;random=rng;}
        int R(int a,int b)=>random.Next(a,b+1);
        bool Coin()=>random.NextDouble()<.5;
        static string S(double n)=>n.ToString("0.########",CultureInfo.InvariantCulture);
        Problem P(string text,string answer,int rem=-1)=>new Problem{text=text,answer=answer,acceptedAnswers=new[]{answer},remainder=rem};
        Problem P(double a,double b,string op,double answer,int rem=-1)=>P(S(a)+" "+op+" "+S(b),S(answer),rem);
        public Problem Stage(Area area,int index,bool boss=false,bool phase2=false)
        {
            var problem=GenerateStage(area,index,boss,phase2);
            if(string.IsNullOrEmpty(problem.tier))problem.tier=area.id=="area11"?"elem5":area.id=="area12"?"elem6":area.id=="area1"?"add":area.id=="area13"?"sub":area.id=="area2"?"mul":area.id=="area3"?"div":"calc";
            return problem;
        }
        Problem GenerateStage(Area area,int index,bool boss,bool phase2)
        {
            index=Math.Max(0,Math.Min(area.stages.Length-1,index));
            if(boss){if(area.id=="area1"&&phase2){int a,b;do{a=R(15,59);b=R(15,49);}while(a%10+b%10<10);return P(a,b,"+",a+b);}if(area.id=="area13"&&phase2){int a,b;do{a=R(31,78);b=R(15,a-10);}while(a%10>=b%10);return P(a,b,"-",a-b);}if(area.id=="area2"){int a=R(6,9),b=random.NextDouble()<(phase2?.8:.7)?R(6,9):R(2,9);return P(a,b,"×",a*b);}if(area.id=="area3"&&phase2){int b=random.NextDouble()<.7?R(6,9):R(2,9),q=R(2,8),rem=R(1,b-1);return P(b*q+rem,b,"÷",q,rem);}if(area.id=="area4")return Mixed(true);if((area.id=="area14"||area.id=="area15")&&phase2){string tier=(area.id=="area14"?"kana_hira_":"kana_kata_")+(Coin()?6:7);var words=data.kanjiPools.First(p=>p.tier==tier).problems;return words[random.Next(words.Length)];}
                int first=Math.Max(0,area.stages.Length-Math.Max(2,(int)Math.Ceiling(area.stages.Length*.4)));
                var candidates=Enumerable.Range(first,area.stages.Length-first).Where(i=>!((area.id=="area11"||area.id=="area12")&&i==area.stages.Length-1)).ToArray();
                int weight=R(1,candidates.Length*(candidates.Length+1)/2);index=candidates[candidates.Length-1];
                for(int i=0;i<candidates.Length;i++){weight-=i+1;if(weight<=0){index=candidates[i];break;}}}
            var stage=area.stages[index];
            if(!string.IsNullOrEmpty(stage.tier)){var pool=data.kanjiPools.FirstOrDefault(p=>p.tier==stage.tier)?.problems??stage.problems;return pool[random.Next(pool.Length)];}
            int x,y,z;
            switch(area.id)
            {
                case "area1":
                    switch(index){case 0:do{x=R(1,9);y=R(1,9);}while(x+y>9);break;case 1:x=R(1,9);y=10-x;break;case 2:x=10;y=R(1,9);if(Coin()){int swap=x;x=y;y=swap;}break;case 3:do{x=R(2,9);y=R(2,9);}while(x+y<10);break;case 4:x=R(1,5);y=R(1,5);z=R(1,5);return P($"{x} + {y} + {z}",(x+y+z).ToString());case 5:x=R(11,49);y=R(1,9);break;default:x=R(12,48);y=R(12,48);break;}return P(x,y,"+",x+y);
                case "area13":
                    switch(index){case 0:x=R(3,9);y=R(1,x-1);break;case 1:x=10;y=R(1,9);break;case 2:x=R(11,19);y=R(1,x%10==0?1:x%10);break;case 3:do{x=R(11,18);y=R(x-9,9);}while(x%10>=y);break;case 4:do{x=R(10,18);y=R(1,5);z=R(1,5);}while(x-y-z<0);return P($"{x} - {y} - {z}",(x-y-z).ToString());case 5:do{x=R(21,58);}while(x%10==9);y=R(x%10+1,9);break;default:x=R(25,69);y=R(11,x-5);break;}return P(x,y,"-",x-y);
                case "area2":x=index+1;y=R(1,9);return P(x,y,"×",x*y);
                case "area3":x=index==0?(Coin()?2:5):index==1?R(1,3):index==2?R(4,6):index==3?R(7,9):index==5?R(2,5):index==6?R(6,9):R(2,9);y=index>=5?R(2,7):R(1,9);z=index>=5?R(1,x-1):0;return P(x*y+z,x,"÷",y,index>=5?z:-1);
                case "area4":return Mixed(false);
                case "area11":return Grade5(index);
                case "area12":return Grade6(index);
                default:return stage.problems[random.Next(stage.problems.Length)];
            }
        }
        Problem Mixed(bool hard)
        {
            int type=R(1,5),a,b,c;
            if(type==1){a=R(hard?45:10,99);b=R(hard?35:1,99);return P(a,b,"+",a+b);}
            if(type==2){a=R(hard?45:10,99);b=R(hard?15:1,hard?98:99);if(a<b){int swap=a;a=b;b=swap;}return P(a,b,"-",a-b);}
            if(type==3){a=R(hard?6:1,9);b=R(hard?6:1,9);return P(a,b,"×",a*b);}
            if(type==4){b=R(hard?6:2,9);a=R(hard?4:1,9);return P(a*b,b,"÷",a);}
            if(hard){a=R(30,70);b=R(10,40);c=R(10,40);bool plus=Coin();return P($"{a} + {b} {(plus?"+":"-")} {c}",(plus?a+b+c:a+b-c).ToString());}
            int op=R(0,2);a=R(10,50);b=R(1,20);c=R(1,20);
            if(op==2)do{a=R(20,50);b=R(1,20);c=R(1,20);}while(a-b-c<0);
            return P($"{a} {(op==2?"-":"+")} {b} {(op==0?"+":"-")} {c}",(op==0?a+b+c:op==1?a+b-c:a-b-c).ToString());
        }
        Problem Grade5(int i)
        {
            int a,b,d;if(i==0){double x=R(11,49)/10.0;b=R(2,9);return P(x,b,"×",Math.Round(x*b,1));}if(i==1){b=R(2,6);double ans=R(11,39)/10.0;return P(Math.Round(ans*b,1),b,"÷",ans);}if(i==2){d=R(3,9);a=R(1,d-2);b=R(1,d-1-a);return P($"{a}/{d} + {b}/{d}",$"{a+b}/{d}");}if(i==3){d=R(3,9);b=R(1,d-2);a=R(b+1,d-1);return P($"{a}/{d} - {b}/{d}",$"{a-b}/{d}");}if(i==4){int ans=R(5,15),offset=R(1,3);a=ans-offset;b=ans+offset;return P($"{a} と {b} の平均",ans.ToString());}if(i==5){a=R(1,9)*100;b=new[]{10,20,30,50}[R(0,3)];return P($"{a} の {b}%",S(a*b/100.0));}return Mixed(false);
        }
        static int Gcd(int a,int b){while(b!=0){int remainder=a%b;a=b;b=remainder;}return a;}
        Problem Grade6(int i)
        {
            if(i==0){int a=R(1,3),b=R(4,5),c=R(1,2),d=R(3,5);return P($"{a}/{b} × {c}/{d}",$"{a*c}/{b*d}");}if(i==1){int m=R(2,5),a=R(1,4)*m,b=R(1,4)*m;return P($"{a} : {b} をかんたんに",$"{a/Gcd(a,b)}:{b/Gcd(a,b)}");}if(i==2){int speed=R(3,8)*10,t=R(2,4);return P($"時速{speed}km で {t}時間",(speed*t).ToString());}if(i==3){int r=new[]{1,2,10}[R(0,2)];return P($"半径{r}cmの円の面積",S(Math.Round(r*r*3.14,2)));}if(i==4){int k=R(2,5),x=R(2,6);return P($"y={k}x で x={x} のとき y",(k*x).ToString());}if(i==5){int n=R(3,4);return P($"{n}人が1列に並ぶ並び方",n==3?"6":"24");}return Mixed(false);
        }
        public Problem Tier(string tier)
        {
            tier=string.IsNullOrEmpty(tier)?"add1":tier=="add"?"add1":tier=="addCarry"?"add2":tier=="sub"?"sub1":tier=="mul"?"mul1":tier=="div"?"div1":tier;
            var problem=tier=="elem5"?Grade5(R(0,5)):tier=="elem6"?Grade6(R(0,5)):GenerateTier(tier);problem.tier=tier;return problem;
        }
        Problem GenerateTier(string tier)
        {
            int a,b;switch(tier){case "add1":do{a=R(1,9);b=R(1,9);}while(a+b>9);return P(a,b,"+",a+b);case "add2":do{a=R(1,9);b=R(1,9);}while(a+b<10);return P(a,b,"+",a+b);case "add3":do{a=R(10,89);b=R(1,9);}while(a%10+b>9);return P(a,b,"+",a+b);case "add4":do{a=R(10,89);b=R(1,9);}while(a%10+b<=9);return P(a,b,"+",a+b);case "add5":do{a=R(11,88);b=R(11,88);}while(a+b>99);return P(a,b,"+",a+b);case "sub1":a=R(3,9);b=R(1,a-1);return P(a,b,"-",a-b);case "sub2":case "sub3":do{a=R(11,98);b=R(1,9);}while(tier=="sub2"?a%10<b:a%10>=b);return P(a,b,"-",a-b);case "sub4":case "sub5":do{a=R(21,98);b=R(10,a-1);}while(tier=="sub4"?a%10<b%10:a%10>=b%10);return P(a,b,"-",a-b);}
            if(tier.StartsWith("mul"))
            {
                int level=int.Parse(tier.Substring(3));
                a=level==1?R(2,3):level==2?R(4,6):level==3?R(7,9):level==4?R(10,19):R(20,49);
                b=R(level>=4?2:1,9);return P(a,b,"×",a*b);
            }
            if(tier.StartsWith("div"))
            {
                int level=int.Parse(tier.Substring(3));b=R(2,9);
                a=level==1?R(1,5):level==2?R(6,9):level==3?R(10,12):level==4?R(13,15):R(16,19);
                return P(a*b,b,"÷",a);
            }
            return Mixed(false);
        }
    }
}
