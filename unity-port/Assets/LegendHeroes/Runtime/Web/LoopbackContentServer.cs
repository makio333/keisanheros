using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;

namespace LegendHeroes.Web
{
    // Read-only app content. No save/admin API, directory listings, CORS, or LAN binding.
    public sealed class LoopbackContentServer : IDisposable
    {
        readonly string root, authority;
        readonly TcpListener listener;
        readonly Thread acceptThread;
        readonly Semaphore workers = new Semaphore(16,16);
        volatile bool stopped;
        public string Address { get; }
        public LoopbackContentServer(string directory,int port)
        {
            root=Path.GetFullPath(directory).TrimEnd(Path.DirectorySeparatorChar)+Path.DirectorySeparatorChar;
            if(!File.Exists(Path.Combine(root,"index.html")))throw new FileNotFoundException("Game package is missing index.html");
            listener=new TcpListener(IPAddress.Loopback,port);listener.Start(128);
            int actual=((IPEndPoint)listener.LocalEndpoint).Port;authority="127.0.0.1:"+actual;Address="http://"+authority+"/";
            acceptThread=new Thread(Accept){IsBackground=true,Name="Legend Heroes local content"};acceptThread.Start();
        }
        void Accept()
        {
            while(!stopped)try
            {
                var client=listener.AcceptTcpClient();
                if(!workers.WaitOne(0)){client.Close();continue;}
                ThreadPool.QueueUserWorkItem(_=>{try{Serve(client);}catch(Exception){}finally{client.Close();workers.Release();}});
            }
            catch(SocketException){if(!stopped)Thread.Sleep(50);}catch(ObjectDisposedException){break;}
        }
        void Serve(TcpClient client)
        {
            client.ReceiveTimeout=5000;client.SendTimeout=5000;
            using(var stream=client.GetStream())
            {
                string line=Line(stream,8192);if(string.IsNullOrEmpty(line))return;
                string[] request=line.Split(' ');if(request.Length!=3){Error(stream,400);return;}
                var headers=new Dictionary<string,string>(StringComparer.OrdinalIgnoreCase);int total=line.Length;
                while((line=Line(stream,8192))!=null&&line.Length>0)
                {total+=line.Length;if(total>32768){Error(stream,431);return;}int colon=line.IndexOf(':');if(colon<1){Error(stream,400);return;}headers[line.Substring(0,colon)]=line.Substring(colon+1).Trim();}
                if(!headers.TryGetValue("Host",out var host)||host!=authority){Error(stream,403);return;}
                bool head=request[0]=="HEAD";if(request[0]!="GET"&&!head){Error(stream,405);return;}
                string raw=request[1].Split('?')[0];if(!raw.StartsWith("/",StringComparison.Ordinal)){Error(stream,400);return;}
                string path;
                try
                {
                    string relative=Uri.UnescapeDataString(raw).TrimStart('/');
                    if(relative.IndexOf('\0')>=0||relative.Contains("\\")){Error(stream,403);return;}
                    foreach(string part in relative.Split('/'))if(part.StartsWith(".",StringComparison.Ordinal)){Error(stream,403);return;}
                    path=Path.GetFullPath(Path.Combine(root,relative.Length==0?"index.html":relative));
                }catch(ArgumentException){Error(stream,400);return;}
                if(!path.StartsWith(root,StringComparison.Ordinal)||!File.Exists(path)){Error(stream,404);return;}
                using(var file=new FileStream(path,FileMode.Open,FileAccess.Read,FileShare.Read))
                {
                    long start=0,end=file.Length-1;bool partial=headers.TryGetValue("Range",out var range);
                    if(partial&&!ParseRange(range,file.Length,out start,out end)){Write(stream,"HTTP/1.1 416 Range Not Satisfiable\r\nContent-Range: bytes */"+file.Length+"\r\nContent-Length: 0\r\nConnection: close\r\n\r\n");return;}
                    long count=Math.Max(0,end-start+1);
                    Write(stream,"HTTP/1.1 "+(partial?"206 Partial Content":"200 OK")+"\r\nContent-Type: "+Mime(path)+"\r\nContent-Length: "+count+"\r\nAccept-Ranges: bytes\r\nCache-Control: no-cache\r\nX-Content-Type-Options: nosniff\r\n"+(partial?"Content-Range: bytes "+start+"-"+end+"/"+file.Length+"\r\n":"")+"Connection: close\r\n\r\n");
                    if(head)return;file.Position=start;byte[] buffer=new byte[65536];while(count>0){int read=file.Read(buffer,0,(int)Math.Min(buffer.Length,count));if(read==0)break;stream.Write(buffer,0,read);count-=read;}
                }
            }
        }
        static string Line(Stream stream,int max)
        {
            var bytes=new List<byte>();int b;while((b=stream.ReadByte())>=0){if(b==10)break;if(b!=13)bytes.Add((byte)b);if(bytes.Count>max)throw new IOException("HTTP line too long");}return b<0&&bytes.Count==0?null:Encoding.ASCII.GetString(bytes.ToArray());
        }
        public static bool ParseRange(string value,long length,out long start,out long end)
        {
            start=0;end=length-1;if(length<=0||!value.StartsWith("bytes=",StringComparison.Ordinal)||value.Contains(","))return false;
            string[] parts=value.Substring(6).Split('-');if(parts.Length!=2)return false;
            if(parts[0].Length==0){if(!long.TryParse(parts[1],NumberStyles.None,CultureInfo.InvariantCulture,out var suffix)||suffix<=0)return false;start=Math.Max(0,length-suffix);return true;}
            if(!long.TryParse(parts[0],NumberStyles.None,CultureInfo.InvariantCulture,out start)||start>=length)return false;
            if(parts[1].Length>0){if(!long.TryParse(parts[1],NumberStyles.None,CultureInfo.InvariantCulture,out end)||end<start)return false;end=Math.Min(end,length-1);}return true;
        }
        static string Mime(string path)
        {
            switch(Path.GetExtension(path).ToLowerInvariant())
            {case ".html":return "text/html; charset=utf-8";case ".js":case ".mjs":return "text/javascript; charset=utf-8";case ".css":return "text/css; charset=utf-8";case ".json":case ".webmanifest":return "application/json";case ".png":return "image/png";case ".jpg":case ".jpeg":return "image/jpeg";case ".svg":return "image/svg+xml";case ".webp":return "image/webp";case ".gif":return "image/gif";case ".m4a":return "audio/mp4";case ".mp3":return "audio/mpeg";case ".ogg":return "audio/ogg";case ".wav":return "audio/wav";case ".woff2":return "font/woff2";case ".woff":return "font/woff";case ".ttf":return "font/ttf";case ".pdf":return "application/pdf";default:return "application/octet-stream";}
        }
        static void Write(Stream stream,string value){byte[] bytes=Encoding.ASCII.GetBytes(value);stream.Write(bytes,0,bytes.Length);}
        static void Error(Stream stream,int code){Write(stream,"HTTP/1.1 "+code+" Request Rejected\r\nContent-Length: 0\r\nConnection: close\r\n\r\n");}
        public void Dispose(){if(stopped)return;stopped=true;listener.Stop();acceptThread.Join(1000);}
    }
}
