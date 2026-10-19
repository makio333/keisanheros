using System;
using System.Collections;
using System.IO;
using System.Runtime.InteropServices;
using UnityEngine;

namespace LegendHeroes.Web
{
    public sealed class IdenticalWebGame : MonoBehaviour
    {
        LoopbackContentServer server;
        string failure;
        bool quitRequested,allowQuit;
        int diagnosticAttempts;
        readonly string diagnosticId=Guid.NewGuid().ToString("N");
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
        static void AllowBackgroundStartup(){Application.runInBackground=true;}
#if UNITY_EDITOR
        public static string VerificationRoot;
#endif
#if UNITY_STANDALONE_OSX || UNITY_EDITOR_OSX
        [DllImport("LegendHeroesWebKit")] static extern void LHWebOpen(string address,int editor);
        [DllImport("LegendHeroesWebKit")] static extern void LHWebClose();
        [DllImport("LegendHeroesWebKit")] public static extern void LHWebEvaluate(string script,string output);
        [DllImport("LegendHeroesWebKit")] public static extern void LHWebSnapshot(string output);
#endif
        void Start()
        {
            Application.runInBackground=true;
            Application.wantsToQuit+=FlushBeforeQuit;
            try
            {
#if UNITY_STANDALONE_OSX || UNITY_EDITOR_OSX
                string root=Path.Combine(Application.streamingAssetsPath,"LegendHeroesWeb");int port=49317,editor=0;
#if UNITY_EDITOR
                port=49320;editor=1;
                string marker=Path.GetFullPath(Path.Combine(Application.dataPath,"../Temp/LegendHeroesQA/web-mode.txt"));
                VerificationRoot=File.Exists(marker)&&File.ReadAllText(marker)=="qa"?Path.Combine(Path.GetDirectoryName(marker),"Web"):null;
                if(!string.IsNullOrEmpty(VerificationRoot)){
                    root=VerificationRoot;port=49318;editor=2;
                    if(!File.ReadAllText(Path.Combine(root,"unity-web-manifest.json")).Contains("isolated-qa"))throw new InvalidOperationException("Verification package is not isolated");
                }
#endif
                server=new LoopbackContentServer(root,port);LHWebOpen(server.Address,editor);
                if(Debug.isDebugBuild)InvokeRepeating(nameof(RecordStartup),1,2);
#else
                failure="このビルドでは、同一UI版のホストが未対応です。macOS版を使用してください。";
#endif
            }
            catch(Exception e){failure="起動できませんでした。別のレジェンドヒーローズが開いていれば閉じてから再起動してください。\n"+e.Message;Debug.LogException(e);}
        }
        void OnGUI(){if(!string.IsNullOrEmpty(failure)){GUI.Box(new Rect(20,20,Screen.width-40,140),failure);}}
        void OnDestroy()
        {
            Application.wantsToQuit-=FlushBeforeQuit;
#if UNITY_STANDALONE_OSX || UNITY_EDITOR_OSX
            try{LHWebClose();}catch(DllNotFoundException){}
#endif
            server?.Dispose();server=null;
        }
        void OnApplicationQuit(){OnDestroy();}
        bool FlushBeforeQuit()
        {
            if(allowQuit||server==null||!string.IsNullOrEmpty(failure))return true;
            if(quitRequested)return false;quitRequested=true;
#if UNITY_STANDALONE_OSX || UNITY_EDITOR_OSX
            LHWebEvaluate("window.dispatchEvent(new Event('pagehide'));if(window.CloudSave)window.CloudSave.flush();true",Path.Combine(Application.temporaryCachePath,"legend-web-close.json"));
#endif
            StartCoroutine(FinishQuit());return false;
        }
        IEnumerator FinishQuit(){yield return new WaitForSecondsRealtime(1);allowQuit=true;Application.Quit();}
        [Serializable] class StartupDiagnostic { public string result,error; }
        void RecordStartup()
        {
#if UNITY_STANDALONE_OSX || UNITY_EDITOR_OSX
            string folder=Application.persistentDataPath;Directory.CreateDirectory(folder);
            string output=Path.Combine(folder,"legend-web-startup.json");
            if(File.Exists(output))try{
                var previous=JsonUtility.FromJson<StartupDiagnostic>(File.ReadAllText(output));
                if(diagnosticAttempts>0&&previous.error==""&&previous.result!=null&&previous.result.Contains(diagnosticId)&&previous.result.Contains("\"loaded\":\"100%\"")){
                    LHWebSnapshot(Path.Combine(folder,"legend-web-startup.png"));CancelInvoke(nameof(RecordStartup));return;
                }
            }catch(Exception){}
            if(diagnosticAttempts++>=60){CancelInvoke(nameof(RecordStartup));return;}
            LHWebEvaluate("JSON.stringify({startup:'"+diagnosticId+"',url:location.href,title:document.title,ready:document.readyState,loaded:document.getElementById('boot-load-percent')?.textContent,screen:document.querySelector('.screen.active')?.id,error:document.getElementById('debug-error-banner')?.textContent})",output);
#endif
        }
    }
}
