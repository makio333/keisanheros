#!/usr/bin/env python3
"""Verify the app's read-only localhost server, including audio range requests."""
import json,subprocess,tempfile
from pathlib import Path
root=Path(__file__).resolve().parent.parent
engine=Path('/Applications/Unity/Hub/Editor/6000.6.3f1/Unity.app/Contents/Resources/Scripting')
folder=Path(tempfile.gettempdir())/'legend-web-server-tests';folder.mkdir(exist_ok=True)
source=folder/'ServerTests.cs'
source.write_text(r'''
using System;using System.IO;using System.Net.Sockets;using System.Text;using LegendHeroes.Web;
class Tests {
 static int checks;static void Check(bool value,string label){checks++;if(!value)throw new Exception(label);}
 static string Get(LoopbackContentServer server,string path,string method="GET",string extra="",string host=null){var uri=new Uri(server.Address);using(var client=new TcpClient()){client.Connect("127.0.0.1",uri.Port);using(var stream=client.GetStream()){var bytes=Encoding.ASCII.GetBytes(method+" "+path+" HTTP/1.1\r\nHost: "+(host??uri.Authority)+"\r\n"+extra+"\r\n");stream.Write(bytes);var result=new MemoryStream();stream.CopyTo(result);return Encoding.UTF8.GetString(result.ToArray());}}}
 static void Main(){string dir=Path.Combine(Path.GetTempPath(),"legend-web-fixture-"+Guid.NewGuid().ToString("N"));Directory.CreateDirectory(dir);try{File.WriteAllText(Path.Combine(dir,"index.html"),"exact-ui");File.WriteAllText(Path.Combine(dir,"音声.mp3"),"0123456789");File.WriteAllText(Path.Combine(dir,".private"),"hidden");using(var server=new LoopbackContentServer(dir,0)){
 Check(Get(server,"/").EndsWith("exact-ui"),"index");Check(Get(server,"/?version=2").EndsWith("exact-ui"),"query");Check(Get(server,"/","HEAD").EndsWith("\r\n\r\n"),"head no body");Check(Get(server,"/","POST").Contains("405"),"read only");Check(Get(server,"/",host:"attacker.example").Contains("403"),"host isolation");Check(Get(server,"/missing").Contains("404"),"missing");
 foreach(string p in new[]{"/../index.html","/%2e%2e/index.html","/.private","/%2Eprivate","/..%5cindex.html"})Check(Get(server,p).Contains("403"),"traversal:"+p);
 var audio=Get(server,"/%E9%9F%B3%E5%A3%B0.mp3",extra:"Range: bytes=2-5\r\n");Check(audio.Contains("206 Partial Content")&&audio.EndsWith("2345"),"audio range");Check(audio.Contains("Content-Range: bytes 2-5/10")&&audio.Contains("audio/mpeg"),"range headers");Check(Get(server,"/%E9%9F%B3%E5%A3%B0.mp3",extra:"Range: bytes=-3\r\n").EndsWith("789"),"suffix");Check(Get(server,"/%E9%9F%B3%E5%A3%B0.mp3",extra:"Range: bytes=8-\r\n").EndsWith("89"),"open end");Check(Get(server,"/%E9%9F%B3%E5%A3%B0.mp3",extra:"Range: bytes=40-50\r\n").Contains("416"),"past end");
 foreach(string range in new[]{"bytes=0-99","bytes=-100"}){Check(LoopbackContentServer.ParseRange(range,10,out long first,out long last)&&first==0&&last==9,"clamp");}
 foreach(string range in new[]{"bytes=5-2","bytes=-0","bytes=0-1,2-3","items=0-1","bytes=a-b","bytes=999999999999999999999999-","bytes=1--",""})Check(!LoopbackContentServer.ParseRange(range,10,out _,out _),"bad range "+range);
 Check(!LoopbackContentServer.ParseRange("bytes=0-",0,out _,out _),"empty range");
 }Console.WriteLine("PASS: "+checks+" loopback serving / range / traversal checks");}finally{Directory.Delete(dir,true);}}
}
''')
refs=next((engine/'DotNetSdk/packs/Microsoft.NETCore.App.Ref').glob('*/ref/net8.0'))
compiler=next((engine/'DotNetSdk/sdk').glob('*/Roslyn/bincore/csc.dll'))
assembly=folder/'ServerTests.dll';rsp=folder/'ServerTests.rsp'
rsp.write_text('\n'.join(['-nologo','-target:exe','-out:"'+str(assembly)+'"']+['-r:"'+str(p)+'"' for p in refs.glob('*.dll')]+['"'+str(source)+'"','"'+str(root/'unity-port/Assets/LegendHeroes/Runtime/Web/LoopbackContentServer.cs')+'"']))
(folder/'ServerTests.runtimeconfig.json').write_text(json.dumps({'runtimeOptions':{'tfm':'net8.0','framework':{'name':'Microsoft.NETCore.App','version':'8.0.21'}}}))
subprocess.run([str(engine/'NetCoreRuntime/dotnet'),str(compiler),'@'+str(rsp)],check=True)
subprocess.run([str(engine/'NetCoreRuntime/dotnet'),str(assembly)],check=True)
