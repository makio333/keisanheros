using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using UnityEngine.Networking;
namespace LegendHeroes
{
    public sealed class CloudDocument { public string path,version;public bool exists;public Dictionary<string,object> data=new Dictionary<string,object>(); }
    public interface ICloudTransport { Task<string> Send(string method,string url,string body); }
    public sealed class UnityCloudTransport:ICloudTransport
    {
        public async Task<string> Send(string method,string url,string body)
        {
            using(var request=new UnityWebRequest(url,method)){request.downloadHandler=new DownloadHandlerBuffer();if(body!=null){request.uploadHandler=new UploadHandlerRaw(Encoding.UTF8.GetBytes(body));request.SetRequestHeader("Content-Type","application/json");}request.timeout=20;var op=request.SendWebRequest();while(!op.isDone)await Task.Yield();if(request.result!=UnityWebRequest.Result.Success)throw new InvalidOperationException("クラウド通信に失敗しました（"+request.responseCode+"）。");return request.downloadHandler.text;}
        }
    }
    public sealed class FirestoreService
    {
        public const string Project="treegames-ac5db";
        const string Root="https://firestore.googleapis.com/v1/projects/"+Project+"/databases/(default)/documents";
        readonly ICloudTransport transport;public FirestoreService(ICloudTransport io=null){transport=io??new UnityCloudTransport();}
        public static string SlotDocument(string slot)=>"saves/"+Uri.EscapeDataString(Uri.EscapeDataString(slot));
        public static string SlotId(string slot)=>Uri.EscapeDataString(Uri.EscapeDataString(slot));
        public static object DecodeValue(object raw)
        {
            var v=raw as Dictionary<string,object>;if(v==null)return null;
            if(v.ContainsKey("nullValue"))return null;if(v.ContainsKey("stringValue"))return v["stringValue"];if(v.ContainsKey("integerValue"))return long.Parse(v.Str("integerValue"),CultureInfo.InvariantCulture);if(v.ContainsKey("doubleValue"))return v["doubleValue"];if(v.ContainsKey("booleanValue"))return v["booleanValue"];if(v.ContainsKey("timestampValue"))return v["timestampValue"];
            if(v.ContainsKey("mapValue"))return DecodeFields(v.Map("mapValue").Map("fields"));if(v.ContainsKey("arrayValue"))return v.Map("arrayValue").List("values").Select(DecodeValue).ToList();return null;
        }
        public static Dictionary<string,object> DecodeFields(Dictionary<string,object> fields)=>fields.ToDictionary(k=>k.Key,k=>DecodeValue(k.Value));
        public static object EncodeValue(object value)
        {
            if(value==null)return new Dictionary<string,object>{{"nullValue",null}};if(value is string s)return new Dictionary<string,object>{{"stringValue",s}};if(value is bool b)return new Dictionary<string,object>{{"booleanValue",b}};if(value is Dictionary<string,object> map)return new Dictionary<string,object>{{"mapValue",new Dictionary<string,object>{{"fields",EncodeFields(map)}}}};
            if(value is System.Collections.IEnumerable list){var values=new List<object>();foreach(var e in list)values.Add(EncodeValue(e));return new Dictionary<string,object>{{"arrayValue",new Dictionary<string,object>{{"values",values}}}};}
            if(value is float||value is double||value is decimal)return new Dictionary<string,object>{{"doubleValue",value}};return new Dictionary<string,object>{{"integerValue",Convert.ToString(value,CultureInfo.InvariantCulture)}};
        }
        public static Dictionary<string,object> EncodeFields(Dictionary<string,object> data)=>data.ToDictionary(k=>k.Key,k=>EncodeValue(k.Value));
        public async Task<CloudDocument> Get(string path)
        {
            try{var json=WireJson.Object(await transport.Send("GET",Root+"/"+path,null));return new CloudDocument{path=path,exists=true,version=json.Str("updateTime"),data=DecodeFields(json.Map("fields"))};}
            catch(InvalidOperationException e){if(e.Message.Contains("404"))return new CloudDocument{path=path};throw;}
        }
        public async Task<List<CloudDocument>> List(string collection)
        {
            var results=new List<CloudDocument>();string next="";do{string url=Root+"/"+collection+"?pageSize=100"+(next==""?"":"&pageToken="+Uri.EscapeDataString(next));var json=WireJson.Object(await transport.Send("GET",url,null));foreach(var raw in json.List("documents").OfType<Dictionary<string,object>>()){string name=raw.Str("name"),relative=name.Substring(name.IndexOf("/documents/",StringComparison.Ordinal)+11);results.Add(new CloudDocument{path=string.Join("/",relative.Split('/').Select(Uri.EscapeDataString)),exists=true,version=raw.Str("updateTime"),data=DecodeFields(raw.Map("fields"))});}next=json.Str("nextPageToken");}while(next!="");return results;
        }
        public async Task<List<CloudDocument>> QueryEqual(string collection,string field,string value)
        {
            var query=new Dictionary<string,object>{{"structuredQuery",new Dictionary<string,object>
            {
                {"from",new object[]{new Dictionary<string,object>{{"collectionId",collection}}}},
                {"where",new Dictionary<string,object>{{"fieldFilter",new Dictionary<string,object>{{"field",new Dictionary<string,object>{{"fieldPath",field}}},{"op","EQUAL"},{"value",EncodeValue(value)}}}}}
            }}};
            var rows=WireJson.Parse(await transport.Send("POST",Root+":runQuery",WireJson.Stringify(query))) as List<object>??new List<object>();
            return rows.OfType<Dictionary<string,object>>().Where(row=>row.ContainsKey("document")).Select(row=>
            {
                var doc=row.Map("document");string name=doc.Str("name"),relative=name.Substring(name.IndexOf("/documents/",StringComparison.Ordinal)+11);
                return new CloudDocument{path=string.Join("/",relative.Split('/').Select(Uri.EscapeDataString)),exists=true,version=doc.Str("updateTime"),data=DecodeFields(doc.Map("fields"))};
            }).ToList();
        }
        public async Task Commit(params CloudDocument[] docs)
        {
            if(transport is UnityCloudTransport&&(LocalSave.PathName.Contains("LegendHeroesQA")||docs.Any(d=>d.data.Get("gameData") is string json&&WireJson.Object(json).Bool("isTestMode"))))throw new InvalidOperationException("検証モードでは本番クラウドに書き込みません。");
            var writes=docs.Select(d=>(object)new Dictionary<string,object>{{"update",new Dictionary<string,object>{{"name","projects/"+Project+"/databases/(default)/documents/"+Uri.UnescapeDataString(d.path)},{"fields",EncodeFields(d.data)}}},{"currentDocument",d.exists?(object)new Dictionary<string,object>{{"updateTime",d.version}}:new Dictionary<string,object>{{"exists",false}}}}).ToList();
            await transport.Send("POST",Root+":commit",WireJson.Stringify(new Dictionary<string,object>{{"writes",writes}}));
        }
        public async Task<List<CloudDocument>> Saves()=> (await List("saves")).Where(d=>!d.data.Bool("deleted")&&!string.IsNullOrEmpty(d.data.Str("gameData"))).ToList();
        public static Dictionary<string,object> SavePayload(PlayerSave s)=>new Dictionary<string,object>{{"slotKey",s.slotKey},{"playerName",s.playerName},{"lvl",s.level},{"gold",s.gold},{"updatedAt",s.updatedAt},{"gameData",WebSaveCodec.Export(s)},{"deleted",false}};
        public async Task Save(PlayerSave save)
        {if(save.isTestMode)throw new InvalidOperationException("テストデータはクラウドに保存できません。");var remote=await Get(SlotDocument(save.slotKey));if(remote.exists&&remote.data.Long("updatedAt")!=save.cloudRevision)throw new InvalidOperationException("クラウドのセーブが更新されています。先に読み込んでください。");remote.data=SavePayload(save);await Commit(remote);save.cloudRevision=save.updatedAt;}
        public async Task<List<Gift>> Gifts(PlayerSave s)
        {
            if(s.isTestMode)return new List<Gift>();
            var docs=await QueryEqual("admin_gifts","targetSlotKey",s.slotKey);
            return docs.Where(d=>d.data.Str("targetSlotKey")==s.slotKey&&!d.data.Bool("claimed")).Select(d=>
            {
                var payload=new Dictionary<string,object>(d.data);payload["id"]=Uri.UnescapeDataString(d.path.Split('/').Last());
                var gift=UnityEngine.JsonUtility.FromJson<Gift>(WireJson.Stringify(payload));gift.fromCloud=true;return gift;
            }).ToList();
        }
        public async Task<bool> ClaimGift(Content data,PlayerSave local,string id)
        {
            for(int attempt=0;attempt<3;attempt++)
            {
                var gift=await Get("admin_gifts/"+Uri.EscapeDataString(id));var saveDoc=await Get(SlotDocument(local.slotKey));if(!gift.exists||gift.data.Bool("claimed")||gift.data.Str("targetSlotKey")!=local.slotKey)return false;
                if(saveDoc.exists&&saveDoc.data.Long("updatedAt")!=local.cloudRevision)throw new InvalidOperationException("セーブが更新されています。クラウドを読み直してください。");
                var clone=UnityEngine.JsonUtility.FromJson<PlayerSave>(UnityEngine.JsonUtility.ToJson(local));var payload=new Dictionary<string,object>(gift.data);payload["id"]=id;var row=UnityEngine.JsonUtility.FromJson<Gift>(WireJson.Stringify(payload));if(!EconomyRules.ReceiveGift(data,clone,row))return false;clone.updatedAt=DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();saveDoc.data=SavePayload(clone);gift.data["claimed"]=true;gift.data["claimedAt"]=clone.updatedAt;gift.data["appliedToSave"]=true;
                try{await Commit(saveDoc,gift);EconomyRules.ReceiveGift(data,local,row);local.updatedAt=clone.updatedAt;local.cloudRevision=clone.updatedAt;return true;}catch(InvalidOperationException){if(attempt==2)throw;}
            }return false;
        }
    }
}
