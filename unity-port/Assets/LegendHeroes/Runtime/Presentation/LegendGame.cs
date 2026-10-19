using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem.UI;
using UnityEngine.UI;

namespace LegendHeroes
{
    public partial class LegendGame : MonoBehaviour
    {
        public Content Data { get; private set; }
        public PlayerSave Save { get; private set; }
        public BattleRun Battle { get; private set; }
        public string CurrentScreen { get; private set; }
        Font font; Canvas canvas; RectTransform screen; AudioSource sound,music;
        Material holographicMaterial;
        readonly Dictionary<string, Texture2D> textures = new Dictionary<string, Texture2D>();
        readonly Color ink = new Color(.08f,.06f,.14f), panel = new Color(.12f,.09f,.20f,.95f), gold = new Color(1f,.80f,.35f), text = new Color(1f,.96f,.84f);
        InputField answerInput; Text battleStatus, questionText, playerStatus, monsterStatus, timerText; RawImage monsterArt; Image enemyBar, playerBar; RectTransform combatStage;
        float deadline; bool resolving; string pendingName = "ぼうけんしゃ", selectedAvatar = "ai_hero_alchemist";
        void Awake()
        {
            Application.runInBackground=true;
            Data = Content.Load();configuration=GameConfiguration.Load();configuration.Apply(Data); Save = LocalSave.Read(); Save?.Normalize(Data);
            font = Resources.Load<Font>("LegendHeroes/Fonts/MPLUSRounded1c-Regular");
            if (!font) font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            var go = new GameObject("Legend Heroes UI", typeof(RectTransform), typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster)); go.transform.SetParent(transform, false);
            canvas = go.GetComponent<Canvas>(); canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            var scaler = go.GetComponent<CanvasScaler>(); scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize; scaler.referenceResolution = new Vector2(1280,800); scaler.matchWidthOrHeight = .5f; scaler.screenMatchMode = CanvasScaler.ScreenMatchMode.Expand;
            var events = FindAnyObjectByType<EventSystem>(); if (!events) new GameObject("UI Input", typeof(EventSystem), typeof(InputSystemUIInputModule));
            sound = gameObject.AddComponent<AudioSource>(); sound.playOnAwake = false;
            music = gameObject.AddComponent<AudioSource>();music.playOnAwake=false;music.loop=true;
            soundVolume=PlayerPrefs.GetFloat("LegendHeroes.Audio.Volume",.6f);mute=PlayerPrefs.GetInt("LegendHeroes.Audio.Mute",0)==1;
            ApplyAudioSettings();
            ShowTitle();
        }
        void OnApplicationPause(bool paused) { if (paused && Save != null) Persist(); }
        void OnApplicationQuit() { if (Save != null) Persist(); }
        void Update()
        {
            CheckPlayLimit();
            UpdateQuiz();
            UpdateEventCombat();
            UpdateWorldRaid();
            if (CurrentScreen == "battle" && Battle != null && !Battle.finished && !resolving)
            {
                float left = Mathf.Max(0, deadline - Time.unscaledTime); if (timerText) timerText.text = "のこり " + left.ToString("0.0") + " 秒";
                if (left <= 0) SubmitAnswer("");
            }
#if UNITY_EDITOR
            PollEditorPreview();
#endif
        }
        public void Persist() { if(CurrentScreen=="event-combat"&&eventCombat!=null&&eventCombat.test&&!eventCombat.over)return;Save.updatedAt=DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();SaveSlots.Store(Save);LocalSave.Write(Save); }
        Texture2D Art(string path)
        {
            if (string.IsNullOrEmpty(path)) return null;
            if (!textures.TryGetValue(path,out var texture)) { texture = ArtworkResources.Load(path); textures[path] = texture; }
            return texture;
        }
        RectTransform Rect(Transform parent, string name, float x, float y, float w, float h)
        {
            var go = new GameObject(name, typeof(RectTransform)); go.transform.SetParent(parent,false); var r = go.GetComponent<RectTransform>();
            r.anchorMin = r.anchorMax = new Vector2(0,1); r.pivot = new Vector2(0,1); r.anchoredPosition = new Vector2(x,-y); r.sizeDelta = new Vector2(w,h); return r;
        }
        RectTransform Box(Transform parent,string name,float x,float y,float w,float h,Color? color=null)
        { var r = Rect(parent,name,x,y,w,h); r.gameObject.AddComponent<Image>().color = color ?? panel; return r; }
        Text Label(Transform parent,string value,float x,float y,float w,float h,int size=22,Color? color=null,TextAnchor align=TextAnchor.MiddleLeft)
        {
            var r = Rect(parent,value,x,y,w,h); var t = r.gameObject.AddComponent<Text>(); t.font = font; t.text = value; t.fontSize = size; t.color = color ?? text; t.alignment = align; t.raycastTarget = false; t.horizontalOverflow = HorizontalWrapMode.Wrap; t.verticalOverflow = VerticalWrapMode.Truncate; return t;
        }
        Button Button(Transform parent,string title,float x,float y,float w,float h,Action click,bool primary=false)
        {
            var r = Box(parent,title,x,y,w,h,primary?gold:new Color(.23f,.18f,.34f,.97f)); var b = r.gameObject.AddComponent<Button>();
            var c=b.colors;c.highlightedColor=new Color(1,.9f,.65f);c.pressedColor=new Color(.8f,.68f,.45f);b.colors=c;
            Label(r,title,8,3,w-16,h-6,21,primary?ink:text,TextAnchor.MiddleCenter); b.onClick.AddListener(()=>{Play("se_decide",.2f);click();}); return b;
        }
        RawImage Picture(Transform parent,string path,float x,float y,float w,float h,bool cover=false,bool bottom=false)
        {
            var r=Rect(parent,"Artwork",x,y,w,h);var image=r.gameObject.AddComponent<RawImage>(); image.texture=Art(path);image.raycastTarget=false;
            if(image.texture){float aspect=(float)image.texture.width/image.texture.height;if(cover){float target=w/h;if(aspect>target){float uv=target/aspect;image.uvRect=new Rect((1-uv)/2,0,uv,1);}else{float uv=aspect/target;image.uvRect=new Rect(0,(1-uv)/2,1,uv);}}else{float ww=Mathf.Min(w,h*aspect),hh=ww/aspect;r.anchoredPosition+=new Vector2((w-ww)/2,-(h-hh)/(bottom?1:2));r.sizeDelta=new Vector2(ww,hh);}}
            else image.color=Color.clear;return image;
        }
        void Avatar(Transform parent,PlayerSave appearance,float x,float y,float size)
        {
            var r=Box(parent,"Character composition",x,y,size,size,new Color(.18f,.14f,.25f));
            var bg=Data.backgrounds.FirstOrDefault(a=>a.id==appearance.background);if(bg!=null){var image=Picture(r,bg.image,0,0,size,size,true);if(appearance.backgroundHolographic)ApplyHologram(image);}
            var character=Picture(r,Data.Avatar(appearance.avatar).image,size*.04f,size*.04f,size*.92f,size*.92f,false,true);if(appearance.avatarHolographic)ApplyHologram(character);
            var frame=Data.frames.FirstOrDefault(a=>a.id==appearance.frame);if(frame!=null)Picture(r,frame.image,0,0,size,size);
        }
        void ApplyHologram(RawImage image)
        {
            if(!holographicMaterial){var shader=Resources.Load<Shader>("LegendHeroes/Shaders/Holographic");if(shader)holographicMaterial=new Material(shader);}
            if(holographicMaterial)image.material=holographicMaterial;
        }
        void Begin(string id,string title,string background=null,Action back=null)
        {
            CancelInvoke();resolving=false;CurrentScreen=id;
            SetMusic(id=="title"||id=="create"?"bgm_title":id=="event-combat"?"bgm_halloween_normal":id=="world-fight"?"bgm_raid_boss":id=="battle"?"bgm_stage1":id=="quiz"||id=="training"?"bgm_training":id=="halloween"||id=="gacha"||id=="exchange"?"bgm_halloween_normal":"bgm_home");
            if(screen){screen.gameObject.SetActive(false);Destroy(screen.gameObject);}
            screen=Rect(canvas.transform,id,0,0,1280,800);
            screen.anchorMin=screen.anchorMax=new Vector2(.5f,.5f);screen.pivot=new Vector2(.5f,.5f);screen.anchoredPosition=Vector2.zero;screen.sizeDelta=new Vector2(1280,800);
            Box(screen,"Backdrop",0,0,1280,800,ink);if(background!=null){Picture(screen,background,0,0,1280,800,true);Box(screen,"Shade",0,0,1280,800,new Color(.03f,.02f,.08f,.4f));}
            Box(screen,"Header",0,0,1280,82,new Color(.10f,.07f,.17f,.94f));
            Label(screen,title,back==null?32:200,12,800,58,30,gold);
            if(back!=null)Button(screen,"← もどる",24,19,145,44,back);
            if(Save!=null)Label(screen,Save.gold+" G",1030,16,220,46,25,gold,TextAnchor.MiddleRight);
        }
        RectTransform Scroll(Transform parent,float x,float y,float w,float h,float contentHeight)
        {
            var r=Box(parent,"Scroll",x,y,w,h,new Color(.06f,.04f,.10f,.35f));
            var viewport=Rect(r,"Viewport",0,0,w,h);viewport.gameObject.AddComponent<RectMask2D>();
            var content=Rect(viewport,"Content",0,0,w,Mathf.Max(h,contentHeight));var s=r.gameObject.AddComponent<ScrollRect>();s.viewport=viewport;s.content=content;s.horizontal=false;s.scrollSensitivity=35;s.movementType=ScrollRect.MovementType.Clamped;return content;
        }
        InputField Input(Transform parent,string initial,float x,float y,float w,float h,bool number=false)
        {
            var r=Box(parent,"Input",x,y,w,h,new Color(.97f,.94f,.86f));var t=Label(r,"",14,0,w-28,h,32,ink);t.supportRichText=false;
            var input=r.gameObject.AddComponent<InputField>();input.textComponent=t;input.text=initial;input.lineType=InputField.LineType.SingleLine;input.contentType=InputField.ContentType.Standard;input.keyboardType=number?TouchScreenKeyboardType.NumbersAndPunctuation:TouchScreenKeyboardType.Default;input.characterLimit=40;return input;
        }
        void Play(string name,float volume=.35f) { var clip=Resources.Load<AudioClip>("LegendHeroes/Audio/"+name);if(clip)sound.PlayOneShot(clip,volume); }
        void SetMusic(string name)
        {
            if(!music)return;var clip=Resources.Load<AudioClip>("LegendHeroes/Audio/"+name);
            if(music.clip==clip)return;music.clip=clip;if(clip)music.Play();else music.Stop();
        }
        void ApplyAudioSettings()
        {
            sound.volume=soundVolume;sound.mute=mute;music.volume=soundVolume*.35f;music.mute=mute;
            PlayerPrefs.SetFloat("LegendHeroes.Audio.Volume",soundVolume);PlayerPrefs.SetInt("LegendHeroes.Audio.Mute",mute?1:0);
        }
        void Notice(string title,string message,Action after=null)
        {
            var overlay=Box(screen,"Notice",0,0,1280,800,new Color(0,0,0,.8f));var r=Box(overlay,"Message",330,230,620,330);
            Label(r,title,30,20,560,65,30,gold);Label(r,message,30,92,560,130,23);Button(r,"とじる",180,245,260,58,()=>{Destroy(overlay.gameObject);after?.Invoke();},true);
        }
    }
}
