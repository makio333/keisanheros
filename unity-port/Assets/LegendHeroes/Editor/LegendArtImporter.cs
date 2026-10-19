using UnityEditor;
using UnityEngine;
public class LegendArtImporter : AssetPostprocessor
{
    void OnPreprocessTexture()
    {
        if(!assetPath.StartsWith("Assets/LegendHeroes/Resources/LegendHeroes/Art/"))return;
        var t=(TextureImporter)assetImporter;t.textureType=TextureImporterType.Default;t.alphaIsTransparency=true;t.mipmapEnabled=false;t.maxTextureSize=2048;
        bool equipment=assetPath.Contains("event-pixel")||assetPath.Contains("frames-thin")||assetPath.Contains("/assets/items/")||assetPath.Contains("/halloween/equip_");
        t.filterMode=equipment?FilterMode.Point:FilterMode.Bilinear;
        t.wrapMode=TextureWrapMode.Clamp;
    }
}
