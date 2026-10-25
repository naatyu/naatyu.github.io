import http from 'node:http';
import path from 'node:path';
import {readFile, realpath, stat} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

// Accept only a fresh, isolated candidate from build-candidate.mjs, never a repo.
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf'};
export async function createCandidateServer(directory){
const root=await realpath(directory);
if (!path.basename(root).startsWith('atlas-v2-candidate-')) throw new Error('Expected an isolated candidate directory');
return http.createServer(async(req,res)=>{
  res.setHeader('X-Robots-Tag','noindex, nofollow');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return;}
  let relative;
  try{relative=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/, '');}
  catch{res.writeHead(400);res.end('Invalid URL');return;}
  if(relative.split('/').some(part=>part.startsWith('.'))){res.writeHead(403);res.end();return;}
  let target=path.resolve(root,relative);
  if(target!==root&&!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  try{
    if((await stat(target)).isDirectory()){
      if(!req.url.split('?')[0].endsWith('/')){const url=new URL(req.url,'http://localhost');res.writeHead(308,{Location:url.pathname+'/'+url.search});res.end();return;}
      target=path.join(target,'index.html');
    }
    target=await realpath(target);
    if(!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
    const body=await readFile(target);
    res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream'});res.end(req.method==='HEAD'?undefined:body);
  }catch(error){
    if(!['ENOENT','ENOTDIR'].includes(error.code)){res.writeHead(500);res.end('Preview unavailable');return;}
    try{
      const fallback=await realpath(path.join(root,'404.html'));
      if(!fallback.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
      const body=await readFile(fallback);res.writeHead(404,{'Content-Type':mime['.html']});res.end(req.method==='HEAD'?undefined:body);
    }
    catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end(req.method==='HEAD'?undefined:'Not found');}
  }
});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  if(!process.argv[2])throw new Error('Pass the temporary candidate output directory');
  const port=Number(process.argv[3]||4323);
  if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Invalid local review port');
  const server=await createCandidateServer(process.argv[2]);
  server.listen(port,'127.0.0.1',()=>console.log(`Local static candidate: http://localhost:${port}`));
}
