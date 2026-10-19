using System;
using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using LegendHeroes;

[InitializeOnLoad]
public static class LegendProjectSetup
{
    const string ScenePath="Assets/LegendHeroes/Scenes/LegendHeroes.unity";
    static LegendProjectSetup(){EditorApplication.delayCall+=EnsureScene;}
    static void EnsureScene()
    {
        if(EditorApplication.isPlayingOrWillChangePlaymode||File.Exists(ScenePath))return;
        // Never replace a user's unsaved scene.
        if(EditorSceneManager.GetActiveScene().isDirty){Debug.Log("Legend Heroes: use Tools > Legend Heroes > Open Game when your scene is saved.");return;}
        Directory.CreateDirectory("Assets/LegendHeroes/Scenes");
        var scene=EditorSceneManager.NewScene(NewSceneSetup.EmptyScene,NewSceneMode.Single);
        var camera=new GameObject("Main Camera",typeof(Camera));camera.tag="MainCamera";camera.GetComponent<Camera>().backgroundColor=new Color(.06f,.04f,.10f);camera.AddComponent<AudioListener>();
        new GameObject("Legend Heroes",typeof(LegendGame));
        EditorSceneManager.SaveScene(scene,ScenePath);
        EditorBuildSettings.scenes=new[]{new EditorBuildSettingsScene(ScenePath,true)};
        AssetDatabase.Refresh();Debug.Log("Legend Heroes native scene is ready. Press Play.");
        RunChecks();
    }
    [MenuItem("Tools/Legend Heroes/Open C# Comparison Scene")]
    public static void OpenGame(){if(!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo())return;if(!File.Exists(ScenePath))EnsureScene();else EditorSceneManager.OpenScene(ScenePath);}
    [MenuItem("Tools/Legend Heroes/Validate Migration")]
    public static void RunChecks()
    {
        var dir=Path.GetFullPath("Temp/LegendHeroesQA");Directory.CreateDirectory(dir);
        try {string report=LegendMigrationChecks.Run();File.WriteAllText(Path.Combine(dir,"validation.txt"),report);Debug.Log(report);}
        catch(Exception e){File.WriteAllText(Path.Combine(dir,"validation.txt"),"FAIL\n"+e);Debug.LogException(e);}
    }
}
