using System.IO;
using System.Linq;
using LegendHeroes.Web;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

public static class IdenticalWebSetup
{
    public const string ScenePath="Assets/LegendHeroes/Scenes/LegendHeroesIdentical.unity";
    public static void EnsureScene()
    {
        EditorBuildSettings.scenes=new[]{new EditorBuildSettingsScene(ScenePath,true)}.Concat(EditorBuildSettings.scenes.Where(s=>s.path!=ScenePath)).ToArray();
        if(File.Exists(ScenePath))return;
        Directory.CreateDirectory(Path.GetDirectoryName(ScenePath));
        var active=SceneManager.GetActiveScene();
        var scene=EditorSceneManager.NewScene(NewSceneSetup.EmptyScene,NewSceneMode.Additive);
        var root=new GameObject("Legend Heroes — Shared Web UI",typeof(IdenticalWebGame));SceneManager.MoveGameObjectToScene(root,scene);
        EditorSceneManager.SaveScene(scene,ScenePath);EditorSceneManager.CloseScene(scene,true);if(active.IsValid())SceneManager.SetActiveScene(active);
        AssetDatabase.Refresh();
    }
    [MenuItem("Tools/Legend Heroes/Open Game (same as Web)")]
    public static void Open(){EnsureScene();if(EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo()){
        string folder=Path.GetFullPath("Temp/LegendHeroesQA");Directory.CreateDirectory(folder);File.WriteAllText(Path.Combine(folder,"web-mode.txt"),"production");
        EditorSceneManager.OpenScene(ScenePath);
    }}
}
