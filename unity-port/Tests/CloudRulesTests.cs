using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using LegendHeroes;

static class CloudRulesTests
{
    // Every request terminates here: no sockets, production URLs or player data are used.
    sealed class MemoryTransport:ICloudTransport
    {
        public readonly Dictionary<string,Dictionary<string,object>> documents=new Dictionary<string,Dictionary<string,object>>();
        readonly Dictionary<string,string> versions=new Dictionary<string,string>();int revision;
        public int commits;
        public void Put(string path,Dictionary<string,object> data){documents[path]=data;versions[path]="v"+(++revision);}
        object Document(string path)=>new Dictionary<string,object>{{"name","projects/test/databases/(default)/documents/"+path},{"fields",FirestoreService.EncodeFields(documents[path])},{"updateTime",versions[path]}};
        public Task<string> Send(string method,string url,string body)
        {
            int offset=url.IndexOf("/documents",StringComparison.Ordinal)+10;string path=url.Substring(offset);
            if(url.EndsWith(":runQuery"))
            {
                var query=WireJson.Object(body).Map("structuredQuery");var filter=query.Map("where").Map("fieldFilter");string field=filter.Map("field").Str("fieldPath"),collection=(query.List("from")[0] as Dictionary<string,object>).Str("collectionId")+"/";var value=FirestoreService.DecodeValue(filter.Get("value"));
                return Task.FromResult(WireJson.Stringify(documents.Where(pair=>pair.Key.StartsWith(collection)&&Equals(pair.Value.Get(field),value)).Select(pair=>(object)new Dictionary<string,object>{{"document",Document(pair.Key)}}).ToList()));
            }
            if(method=="POST")
            {
                var writes=WireJson.Object(body).List("writes").OfType<Dictionary<string,object>>().ToArray();
                foreach(var w in writes)
                {
                    string key=w.Map("update").Str("name").Split(new[]{"/documents/"},StringSplitOptions.None)[1];var expected=w.Map("currentDocument");
                    if(expected.ContainsKey("updateTime")&&(!versions.ContainsKey(key)||versions[key]!=expected.Str("updateTime"))||expected.Get("exists") is bool exists&&!exists&&documents.ContainsKey(key))throw new InvalidOperationException("412 conflict");
                }
                foreach(var w in writes){string key=w.Map("update").Str("name").Split(new[]{"/documents/"},StringSplitOptions.None)[1];Put(key,FirestoreService.DecodeFields(w.Map("update").Map("fields")));}
                commits++;return Task.FromResult("{}");
            }
            path=Uri.UnescapeDataString(path.TrimStart('/'));
            if(path.Contains("?"))
            {
                string collection=path.Split('?')[0]+"/";
                return Task.FromResult(WireJson.Stringify(new Dictionary<string,object>{{"documents",documents.Keys.Where(key=>key.StartsWith(collection)&&!key.Substring(collection.Length).Contains('/')).Select(Document).ToList()}}));
            }
            if(!documents.ContainsKey(path))throw new InvalidOperationException("404 missing");
            return Task.FromResult(WireJson.Stringify(Document(path)));
        }
    }
    static void Require(bool ok,string text){if(!ok)throw new Exception("Cloud mock: "+text);}
    public static async Task Run(Content d)
    {
        var memory=new MemoryTransport();var cloud=new FirestoreService(memory);
        var player=new PlayerSave{slotKey="offline:test",updatedAt=100,playerName="隔離テスト"};player.Normalize(d);
        string slot=Uri.UnescapeDataString(FirestoreService.SlotDocument(player.slotKey));
        await cloud.Save(player);Require(memory.commits==1&&player.cloudRevision==100,"initial save");
        player.updatedAt=200;await cloud.Save(player);Require(memory.documents[slot].Long("updatedAt")==200,"save own revision");
        var changed=new Dictionary<string,object>(memory.documents[slot]);changed["updatedAt"]=300L;memory.Put(slot,changed);player.updatedAt=400;
        bool conflict=false;try{await cloud.Save(player);}catch(InvalidOperationException){conflict=true;}
        Require(conflict&&memory.documents[slot].Long("updatedAt")==300,"newer local clock cannot overwrite remote edit");
        player.cloudRevision=300;player.updatedAt=400;
        memory.Put("admin_gifts/gift1",new Dictionary<string,object>{{"id","gift1"},{"targetSlotKey",player.slotKey},{"gold",80},{"claimed",false},{"message","おめでとう"},{"items",new List<object>{new Dictionary<string,object>{{"kind","ticket"},{"id","equip-ten-ticket"},{"count",3}}}}});
        var gifts=await cloud.Gifts(player);Require(gifts.Count==1&&gifts[0].fromCloud,"gift discovery including existing id");
        player.pendingGifts=gifts;
        Require(await cloud.ClaimGift(d,player,"gift1"),"claim gift");
        Require(player.gold==80&&player.equipGachaTenPullTickets==3&&memory.documents["admin_gifts/gift1"].Bool("claimed"),"atomic gift and save");
        Require(!await cloud.ClaimGift(d,player,"gift1")&&player.gold==80,"gift replay blocked");
        var doc=await cloud.Get(FirestoreService.SlotDocument(player.slotKey));
        var stale=await cloud.Get(FirestoreService.SlotDocument(player.slotKey));doc.data["gold"]=90;await cloud.Commit(doc);
        conflict=false;try{await cloud.Commit(stale);}catch(InvalidOperationException){conflict=true;}
        Require(conflict,"optimistic precondition");
        player.cloudRevision=memory.documents[slot].Long("updatedAt");
        memory.Put("raidGlobal/currentBoss",new Dictionary<string,object>{{"bossId","offline_boss"},{"bossLevel",50},{"maxHp",100000},{"totalDamageDealt",0}});
        var raid=new RaidService(cloud);var first=new PendingRaidEvent{id="run-1",bossId="offline_boss",damage=100,mode="world",startedAt=DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()};
        await raid.Submit(player,first);await raid.Submit(player,first);
        Require(memory.documents["raidGlobal/currentBoss"].Int("totalDamageDealt")==100,"raid run replay blocked");
        int ten=player.equipGachaTenPullTickets,skin=player.skinGachaTickets;
        await raid.Submit(player,new PendingRaidEvent{id="run-2",bossId="offline_boss",damage=100,startedAt=first.startedAt});
        await raid.Submit(player,new PendingRaidEvent{id="run-3",bossId="offline_boss",damage=100,startedAt=first.startedAt});
        Require(player.equipGachaTenPullTickets==ten+1&&player.skinGachaTickets==skin+1,"second and third participation prizes");
        await raid.Submit(player,new PendingRaidEvent{id="run-4",bossId="offline_boss",damage=100,startedAt=first.startedAt});
        Require(player.equipGachaTenPullTickets==ten+1&&player.skinGachaTickets==skin+1,"participation prizes exactly once");
        Console.WriteLine("PASS: offline cloud save conflicts, gift discovery, atomic claim and replay prevention");
    }
}
