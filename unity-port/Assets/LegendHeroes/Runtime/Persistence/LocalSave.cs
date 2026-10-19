using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using UnityEngine;

namespace LegendHeroes
{
    public static class LocalSave
    {
        // Independent native save: never touches browser storage, Firebase or live rankings.
        #if UNITY_EDITOR
        public static string OverridePath;
#endif
        public static string PathName {
            get {
#if UNITY_EDITOR
                if (!string.IsNullOrEmpty(OverridePath)) return OverridePath;
#endif
                return Path.Combine(Application.persistentDataPath, "legend-heroes-unity-v1.json");
            }
        }
        public static void Write(PlayerSave save) => WriteAt(PathName, save);
        public static void WriteAt(string path, PlayerSave save)
        {
            Directory.CreateDirectory(Path.GetDirectoryName(path));
            File.WriteAllText(path + ".tmp", JsonUtility.ToJson(save, true), Encoding.UTF8);
            if (File.Exists(path)) File.Replace(path + ".tmp", path, path + ".bak");
            else File.Move(path + ".tmp", path);
        }
        public static PlayerSave ReadAt(string path)
        {
            foreach (var p in new[] { path, path + ".bak" }) try
            {
                if (!File.Exists(p)) continue;
                var s = JsonUtility.FromJson<PlayerSave>(File.ReadAllText(p));
                if (s != null && s.schemaVersion >= 1 && s.schemaVersion <= 2 && s.owned != null && s.clears != null && s.skins != null && s.backgrounds != null && s.frames != null && s.level >= 1) return s;
            } catch (Exception) { }
            return null;
        }
        public static PlayerSave Read() => ReadAt(PathName);
    }
}
