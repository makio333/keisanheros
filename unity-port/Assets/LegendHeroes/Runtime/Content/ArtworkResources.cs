using System.IO;
using System.Text;
using UnityEngine;
namespace LegendHeroes
{
    public static class ArtworkResources
    {
        public static Texture2D Load(string path)
        {
            if(string.IsNullOrEmpty(path))return null;
            path=path.Replace('\\','/');while(path.StartsWith("./"))path=path.Substring(2);
            string key="LegendHeroes/Art/"+Path.ChangeExtension(path,null);
            // macOS filenames may use decomposed Japanese, while Web data uses composed text.
            return Resources.Load<Texture2D>(key) ?? Resources.Load<Texture2D>(key.Normalize(NormalizationForm.FormD)) ?? Resources.Load<Texture2D>(key.Normalize(NormalizationForm.FormC));
        }
    }
}
