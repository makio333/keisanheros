using System;
using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
[InitializeOnLoad]
public static class LegendEditorCommands
{
    [Serializable] class Command { public string action,value,requestId; }
    static double next;
    static LegendEditorCommands(){EditorApplication.update+=Poll;}
    static void Poll()
    {
            if(EditorApplication.timeSinceStartup<next||EditorApplication.isCompiling||EditorApplication.isUpdating)return;next=EditorApplication.timeSinceStartup+.3;string folder=Path.GetFullPath("Temp/LegendHeroesQA");Directory.CreateDirectory(folder);
            if(EditorApplication.isPlaying&&(File.Exists(Path.Combine(folder,"command.json"))||EditorSceneManager.GetActiveScene().path==IdenticalWebSetup.ScenePath))EditorApplication.QueuePlayerLoopUpdate();
            string path=Path.Combine(folder,"editor-command.json");if(!File.Exists(path))return;
        try{var command=JsonUtility.FromJson<Command>(File.ReadAllText(path));File.Delete(path);switch(command.action){
        case "web":
            if(EditorApplication.isPlaying)throw new System.Exception("Stop Play mode first");
            IdenticalWebSetup.EnsureScene();
            File.WriteAllText(Path.Combine(folder,"web-mode.txt"),command.value=="qa"?"qa":"production");
            LegendHeroes.Web.IdenticalWebGame.VerificationRoot=command.value=="qa"?Path.Combine(folder,"Web"):null;
            EditorSceneManager.OpenScene(IdenticalWebSetup.ScenePath);EditorApplication.isPlaying=true;break;
        case "open-web":
            if(EditorApplication.isPlaying)throw new System.Exception("Stop Play mode first");
            File.WriteAllText(Path.Combine(folder,"web-mode.txt"),"production");
            IdenticalWebSetup.EnsureScene();EditorSceneManager.OpenScene(IdenticalWebSetup.ScenePath);break;
        case "web-eval":
            if(!EditorApplication.isPlaying||string.IsNullOrEmpty(LegendHeroes.Web.IdenticalWebGame.VerificationRoot))throw new System.Exception("Isolated Web QA required");
            LegendHeroes.Web.IdenticalWebGame.LHWebEvaluate(command.value,Path.Combine(folder,"web-"+command.requestId+".json"));break;
        case "web-snapshot":LegendHeroes.Web.IdenticalWebGame.LHWebSnapshot(Path.Combine(folder,string.IsNullOrEmpty(command.value)?"web-preview.png":Path.GetFileName(command.value)+".png"));break;
        case "refresh":AssetDatabase.Refresh();break;case "validate":LegendProjectSetup.RunChecks();break;case "build":LegendBuild.MacPreview();break;case "play":if(!EditorApplication.isPlaying){if(EditorSceneManager.GetActiveScene().path!="Assets/LegendHeroes/Scenes/LegendHeroes.unity")EditorSceneManager.OpenScene("Assets/LegendHeroes/Scenes/LegendHeroes.unity");EditorApplication.isPlaying=true;}break;case "stop":EditorApplication.isPlaying=false;break;default:throw new Exception("Unknown editor command");}File.WriteAllText(Path.Combine(folder,"editor-state.json"),JsonUtility.ToJson(new State{playing=EditorApplication.isPlaying,message="ok",action=command.action}));}catch(Exception e){File.WriteAllText(Path.Combine(folder,"editor-error.txt"),e.ToString());Debug.LogException(e);}
    }
    [Serializable] class State { public bool playing;public string message,action; }
}
