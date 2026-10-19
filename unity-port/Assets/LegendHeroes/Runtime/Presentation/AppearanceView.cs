using System.Linq;
using UnityEngine;

namespace LegendHeroes
{
    public partial class LegendGame
    {
        PlayerSave previewAppearance;
        void ShowAppearance(string tab,bool reset=true)
        {
            if(reset)previewAppearance=new PlayerSave{avatar=Save.avatar,background=Save.background,frame=Save.frame,avatarHolographic=Save.avatarHolographic,backgroundHolographic=Save.backgroundHolographic};
            Begin("appearance","キャラ・背景・フレーム",Data.homeImage,ShowHome);
            var left=Box(screen,"Options",30,110,590,650);string[] tabs={"キャラ","背景","フレーム"};
            for(int i=0;i<3;i++){string next=tabs[i];Button(left,next,12+i*192,12,180,60,()=>ShowAppearance(next,false),tab==next);}
            Artwork[] options;
            if(tab=="キャラ")options=Data.avatars.Where(a=>(!a.gachaOnly&&string.IsNullOrEmpty(a.rewardSource))||Save.skins.Contains(a.id)||Save.holoSkins.Contains(a.id)).ToArray();
            else if(tab=="背景")options=Data.backgrounds.Where(a=>Save.backgrounds.Contains(a.id)||Save.holoBackgrounds.Contains(a.id)).ToArray();
            else options=new[]{new Artwork{id="",name="フレームなし"}}.Concat(Data.frames.Where(a=>Save.frames.Contains(a.id))).ToArray();
            var list=Scroll(left,12,90,566,530,((options.Length+3)/4)*180);
            for(int i=0;i<options.Length;i++)
            {
                var a=options[i];var b=Button(list,"",i%4*140,i/4*180,132,166,()=>{
                    if(tab=="キャラ"){previewAppearance.avatar=a.id;previewAppearance.avatarHolographic=false;}else if(tab=="背景"){previewAppearance.background=a.id;previewAppearance.backgroundHolographic=false;}else previewAppearance.frame=a.id;
                    ShowAppearance(tab,false);
                });Picture(b.transform,a.image,10,7,112,112);Label(b.transform,a.name,6,120,120,42,17,null,TextAnchor.MiddleCenter);
            }
            var right=Box(screen,"Preview",650,110,600,650);Avatar(right,previewAppearance,60,25,480);
            Label(right,Data.Avatar(previewAppearance.avatar).name,30,520,540,40,25,gold);
            if(Save.holoSkins.Contains(previewAppearance.avatar))Button(right,previewAppearance.avatarHolographic?"キャラ：ホログラムON":"キャラ：ホログラムOFF",20,558,270,30,()=>{previewAppearance.avatarHolographic=!previewAppearance.avatarHolographic;ShowAppearance(tab,false);});
            if(Save.holoBackgrounds.Contains(previewAppearance.background))Button(right,previewAppearance.backgroundHolographic?"背景：ホログラムON":"背景：ホログラムOFF",310,558,270,30,()=>{previewAppearance.backgroundHolographic=!previewAppearance.backgroundHolographic;ShowAppearance(tab,false);});
            Button(right,"この組み合わせにする",30,600,540,40,()=>{Save.avatar=previewAppearance.avatar;Save.background=previewAppearance.background;Save.frame=previewAppearance.frame;Save.avatarHolographic=previewAppearance.avatarHolographic;Save.backgroundHolographic=previewAppearance.backgroundHolographic;Persist();ShowHome();},true);
        }
    }
}
