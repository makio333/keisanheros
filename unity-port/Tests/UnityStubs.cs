// Offline rules only: not copied under Assets and never shipped.
using System;
using System.IO;
using System.Text.Json;
namespace UnityEngine
{
    public static class Application { public static string persistentDataPath => Path.Combine(Path.GetTempPath(), "LegendHeroesQA"); }
    public class Texture2D { }
    public class TextAsset { public string text; }
    public static class Resources
    {
        public static string Root;
        public static T Load<T>(string path) where T : class => typeof(T) == typeof(TextAsset)
            ? new TextAsset { text = File.ReadAllText(Path.Combine(Root, path + ".json")) } as T : null;
    }
    public static class JsonUtility
    {
        static readonly JsonSerializerOptions Options = new JsonSerializerOptions { IncludeFields = true, IgnoreReadOnlyProperties = true };
        public static string ToJson(object value, bool pretty = false) => JsonSerializer.Serialize(value, value.GetType(), Options);
        public static T FromJson<T>(string json) => JsonSerializer.Deserialize<T>(json, Options);
    }
}
namespace UnityEngine.Networking
{
    public class DownloadHandlerBuffer { public string text; }
    public class UploadHandlerRaw { public UploadHandlerRaw(byte[] bytes) { } }
    public sealed class UnityWebRequest : IDisposable
    {
        public enum Result { Success }
        public DownloadHandlerBuffer downloadHandler; public UploadHandlerRaw uploadHandler; public int timeout; public long responseCode; public Result result;
        public UnityWebRequest(string url, string method) { throw new InvalidOperationException("Network forbidden in offline tests"); }
        public void SetRequestHeader(string name, string value) { }
        public Operation SendWebRequest() => throw new InvalidOperationException("Network forbidden");
        public void Dispose() { }
        public class Operation { public bool isDone; }
    }
}
