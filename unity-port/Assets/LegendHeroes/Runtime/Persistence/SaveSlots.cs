using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using UnityEngine;
namespace LegendHeroes
{
    public static class SaveSlots
    {
        static string Folder=>Path.Combine(Path.GetDirectoryName(LocalSave.PathName),"slots");
        static string FileName(string key){using(var hash=SHA256.Create())return BitConverter.ToString(hash.ComputeHash(Encoding.UTF8.GetBytes(key))).Replace("-","").ToLowerInvariant()+".json";}
        public static void Store(PlayerSave save){if(string.IsNullOrEmpty(save.slotKey))save.slotKey="typing_rpg_save_v3::unity_"+Guid.NewGuid().ToString("N");Directory.CreateDirectory(Folder);LocalSave.WriteAt(Path.Combine(Folder,FileName(save.slotKey)),save);}
        public static List<PlayerSave> All(){if(!Directory.Exists(Folder))return new List<PlayerSave>();return Directory.GetFiles(Folder,"*.json").Select(LocalSave.ReadAt).Where(s=>s!=null).OrderByDescending(s=>s.updatedAt).ToList();}
        public static string Export(PlayerSave save){var folder=Path.Combine(Path.GetDirectoryName(LocalSave.PathName),"exports");Directory.CreateDirectory(folder);string path=Path.Combine(folder,"legend-heroes-"+DateTime.Now.ToString("yyyyMMdd-HHmmss")+".json");File.WriteAllText(path,WebSaveCodec.Export(save),Encoding.UTF8);return path;}
    }
}
