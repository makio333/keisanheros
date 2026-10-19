using System;
using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEngine;

public static class LegendBuild
{
    [MenuItem("Tools/Legend Heroes/Build macOS Preview")]
    public static void MacPreview()
    {
        if(EditorApplication.isPlayingOrWillChangePlaymode)throw new InvalidOperationException("Stop Play mode before building.");
        IdenticalWebSetup.EnsureScene();
        if(!File.Exists("Assets/StreamingAssets/LegendHeroesWeb/unity-web-manifest.json"))throw new FileNotFoundException("Run scripts/build-unity-web.mjs and sync before building.");
        string folder=Path.GetFullPath("Builds/macOS");Directory.CreateDirectory(folder);
        string application=Path.Combine(folder,"LegendHeroes.app");
        string originalIdentifier=PlayerSettings.GetApplicationIdentifier(UnityEditor.Build.NamedBuildTarget.Standalone);
        bool originalBackground=PlayerSettings.runInBackground;
        UnityEditor.Build.Reporting.BuildReport report;
        try
        {
            PlayerSettings.SetApplicationIdentifier(UnityEditor.Build.NamedBuildTarget.Standalone,"jp.treegames.legendheroes");
            PlayerSettings.runInBackground=true;
            report=BuildPipeline.BuildPlayer(new BuildPlayerOptions
            {
                scenes=new[]{IdenticalWebSetup.ScenePath},locationPathName=application,
                target=BuildTarget.StandaloneOSX,options=BuildOptions.Development
            });
        }
        finally{PlayerSettings.SetApplicationIdentifier(UnityEditor.Build.NamedBuildTarget.Standalone,originalIdentifier);PlayerSettings.runInBackground=originalBackground;}
        File.WriteAllText(Path.Combine(folder,"build-report.json"),JsonUtility.ToJson(new Result
        {
            result=report.summary.result.ToString(),path=application,errors=report.summary.totalErrors,bytes=report.summary.totalSize
        },true));
        if(report.summary.result!=BuildResult.Succeeded)throw new Exception("macOS build failed. Check the Unity Console and build-report.json.");
    }
    [Serializable] class Result { public string result,path;public int errors;public ulong bytes; }
}
