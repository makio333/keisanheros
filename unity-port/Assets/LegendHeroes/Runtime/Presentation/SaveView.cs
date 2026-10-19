using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.UI;
namespace LegendHeroes
{
    public partial class LegendGame
    {
        readonly FirestoreService cloud=new FirestoreService();bool cloudBusy;bool mute;float soundVolume=.6f;
        string lastGiftSlot="";DateTimeOffset nextGiftCheck;
        void RequestGiftCheck()
        {
            if(Save==null||Save.isTestMode||LocalSave.PathName.Contains("LegendHeroesQA")||cloudBusy)return;
            if(lastGiftSlot==Save.slotKey&&DateTimeOffset.UtcNow<nextGiftCheck)return;
            lastGiftSlot=Save.slotKey;nextGiftCheck=DateTimeOffset.UtcNow.AddSeconds(30);CheckGifts();
        }
        async void CloudAction(Func<Task> action)
        {
            if(cloudBusy)return;cloudBusy=true;try{await action();}catch(Exception e){Notice("通信できません",e.Message);}finally{cloudBusy=false;}
        }
        void ShowSaveMenu()
        {
            Begin("saves","セーブデータ",Data.homeImage,ShowFeatureMenu);
            Button(screen,"現在のデータを保存",35,105,385,65,()=>{Persist();ShowSaveMenu();},true);
            Button(screen,"クラウド一覧",445,105,385,65,()=>CloudAction(ShowCloudSlots));Button(screen,"JSONを読み込む",855,105,385,65,ShowImport);
            var saves=SaveSlots.All();var list=Scroll(screen,35,200,1210,485,saves.Count*160);
            for(int i=0;i<saves.Count;i++){var s=saves[i];var r=Box(list,"Save",0,i*160,1180,150);Avatar(r,s,10,10,130);Label(r,s.playerName+" Lv."+s.level+"\n"+s.gold+" G",170,20,590,100,29,gold);Button(r,"読み込む",840,40,300,70,()=>{Save=s;Save.Normalize(Data);LocalSave.Write(Save);ShowHome();},true);}
            Button(screen,"Web用JSONを書き出す",35,710,580,60,()=>{var path=SaveSlots.Export(Save);Notice("書き出しました",path);});Button(screen,"クラウドに保存",650,710,590,60,()=>CloudAction(async()=>{Persist();await cloud.Save(Save);LocalSave.Write(Save);Notice("クラウドへ保存しました",Save.playerName+"のデータを保存しました。");}));
        }
        async Task ShowCloudSlots()
        {
            var rows=await cloud.Saves();Begin("cloud-saves","クラウドのセーブデータ",Data.homeImage,ShowSaveMenu);var list=Scroll(screen,35,110,1210,640,rows.Count*130);
            for(int i=0;i<rows.Count;i++){var row=rows[i];var r=Box(list,"Cloud save",0,i*130,1180,115);Label(r,row.data.Str("playerName")+"  Lv."+row.data.Int("lvl"),25,15,770,80,28,gold);Button(r,"読み込む",850,25,300,65,()=>{var imported=WebSaveCodec.Import(row.data.Str("gameData"),Data,row.data.Str("slotKey"));Save=imported;Save.cloudRevision=row.data.Long("updatedAt");Persist();ShowHome();CheckGifts();},true);}
        }
        void ShowImport()
        {
            Begin("import","WebセーブJSONの読み込み",Data.homeImage,ShowSaveMenu);Label(screen,"JSON本文、またはJSONファイルのフルパスを入力",40,100,1180,60,26,gold);var input=Input(screen,"",45,185,1190,430);input.characterLimit=8000000;input.lineType=InputField.LineType.MultiLineNewline;input.textComponent.fontSize=18;input.textComponent.alignment=TextAnchor.UpperLeft;
            Button(screen,"読み込む",390,675,500,75,()=>{try{string raw=input.text.Trim();if(!raw.StartsWith("{"))raw=File.ReadAllText(raw);var imported=WebSaveCodec.Import(raw,Data);if(string.IsNullOrEmpty(imported.slotKey))imported.slotKey="typing_rpg_save_v3::unity_"+Guid.NewGuid().ToString("N");Save=imported;Persist();ShowHome();}catch(Exception e){Notice("読み込めません",e.Message);}},true);
        }
        void CheckGifts(){if(string.IsNullOrEmpty(Save?.slotKey)||LocalSave.PathName.Contains("LegendHeroesQA"))return;string key=Save.slotKey;CloudAction(async()=>{var gifts=await cloud.Gifts(Save);if(Save.slotKey!=key)return;Save.pendingGifts=gifts;Persist();if(gifts.Count>0)ShowGifts();});}
        void ShowSettings()
        {
            Begin("settings","設定",Data.homeImage,ShowFeatureMenu);Button(screen,mute?"音：OFF → ON":"音：ON → OFF",100,150,1080,90,()=>{mute=!mute;ApplyAudioSettings();ShowSettings();});Button(screen,"音量を小さく",100,280,520,80,()=>{soundVolume=Mathf.Max(0,soundVolume-.1f);ApplyAudioSettings();ShowSettings();});Button(screen,"音量を大きく",660,280,520,80,()=>{soundVolume=Mathf.Min(1,soundVolume+.1f);ApplyAudioSettings();ShowSettings();});Label(screen,"音量 "+Mathf.RoundToInt(soundVolume*100)+"%",100,390,1080,60,30,gold);
            Button(screen,"管理者設定",100,510,1080,90,ShowAdminGate);Button(screen,"漢字読みデータの出典",100,650,1080,65,()=>Application.OpenURL("https://www.edrdg.org/edrdg/licence.html"));
        }
        void ShowAdminGate()
        {
            Begin("admin-gate","管理者設定",Data.homeImage,ShowSettings);Label(screen,"Web版と同じ管理者パスワード",160,160,960,65,30,gold);var input=Input(screen,"",230,270,820,80);input.contentType=InputField.ContentType.Password;
            Button(screen,"開く",390,430,500,75,()=>{if(input.text!=AdminRules.Password){Notice("確認してください","パスワードが違います。");return;}ShowAdmin();},true);
        }
        void ShowAdmin()
        {
            Begin("admin","管理者設定",Data.homeImage,ShowSettings);Button(screen,"プレゼントを送る",70,160,550,100,()=>CloudAction(async()=>{var rows=await cloud.Saves();Begin("admin-target","送るセーブを選ぶ",Data.homeImage,ShowAdmin);var list=Scroll(screen,35,110,1210,640,rows.Count*100);for(int i=0;i<rows.Count;i++){var row=rows[i];Button(list,row.data.Str("playerName"),10,i*100,1170,85,()=>ShowGiftEditor(row.data.Str("slotKey")),true);}}));Button(screen,"報酬・難易度の設定",660,160,550,100,ShowBalanceSettings);Button(screen,"現在のプレイヤーにテストアイテム",70,330,1140,100,()=>{if(!LocalSave.PathName.Contains("LegendHeroesQA")){Notice("検証用です","検証用セーブでのみ使用できます。");return;}Save.gold+=10000;Save.raidTickets+=5;Save.halloweenCandy+=500;Save.halloweenTickets+=10;Save.equipGachaTenPullTickets+=3;Save.AddItem("cost_seed",5);Persist();ShowHome();});
        }
        void ShowBalanceSettings()=>ShowAdminOptions();
        void ShowGiftEditor(string slot)
        {
            Begin("gift-editor","プレゼントを送る",Data.homeImage,ShowAdmin);Label(screen,"メッセージ",60,120,300,45,24,gold);var message=Input(screen,"プレゼントです！",350,120,860,60);Label(screen,"ゴールド",60,220,300,45,24,gold);var money=Input(screen,"0",350,220,860,60,true);Label(screen,"プレゼントの景品",60,320,400,55,24,gold);string selectedGiftId="cost_seed";var itemName=Label(screen,"コストプラスのたね",470,320,480,60,24,gold);Button(screen,"選ぶ",980,320,230,60,()=>ShowGiftChoices(value=>{selectedGiftId=value;itemName.text=GiftChoiceName(value);}));Label(screen,"個数",60,420,300,45,24,gold);var count=Input(screen,"1",350,420,860,60,true);
            Button(screen,"送る",390,610,500,85,()=>CloudAction(async()=>{int.TryParse(money.text,out int goldValue);int.TryParse(count.text,out int n);string kind=selectedGiftId.EndsWith("ticket")?"ticket":Data.Equip(selectedGiftId)!=null?"equip":Data.frames.Any(f=>f.id==selectedGiftId)?"decoration":"item";var doc=await cloud.Get("admin_gifts/"+Guid.NewGuid().ToString("N"));doc.data=new System.Collections.Generic.Dictionary<string,object>{{"targetSlotKey",slot},{"message",message.text},{"gold",Math.Max(0,goldValue)},{"createdAt",DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()},{"claimed",false},{"items",new object[]{new System.Collections.Generic.Dictionary<string,object>{{"id",selectedGiftId},{"kind",kind},{"count",Math.Max(0,Math.Min(999,n))},{"rarity",1}}}}};await cloud.Commit(doc);ShowAdmin();Notice("送りました","対象のセーブを開くと受け取れます。");}),true);
        }
    }
}
