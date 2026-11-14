import http from 'node:http';
import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export async function createMediaTestServer(){
 const root=fileURLToPath(new URL('../dist-test',import.meta.url));let port;
 const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg','.m4a':'audio/mp4','.wav':'audio/wav','.ogg':'audio/ogg','.ico':'image/x-icon'};
 const server=http.createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}const s=await stat(file);if(!s.isFile())throw Error();res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Content-Length':s.size});createReadStream(file).pipe(res);}catch{res.writeHead(404).end();}});
 async function start(){await new Promise(resolve=>server.listen(port||0,'127.0.0.1',resolve));port=server.address().port;}
 async function stop(){if(server.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});}
 await start();return {url:`http://127.0.0.1:${port}/`,start,stop};
}
