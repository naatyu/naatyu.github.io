import http from 'node:http';
import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {previewPath} from './preview-path.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../prototypes');
const imageRoot = path.resolve(root, '../../static/img');
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server = http.createServer(async (req,res) => {
  const url = new URL(req.url, 'http://localhost');
  let relative;
  try {relative = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';}
  catch {res.writeHead(400);res.end();return;}
  const target = previewPath(relative, root, imageRoot);
  if (!target) {res.writeHead(403);res.end();return;}
  try {const data = await readFile(target);res.writeHead(200, {'Content-Type':types[path.extname(target)] || 'application/octet-stream'});res.end(data);}
  catch {res.writeHead(404);res.end('Not found');}
});
server.listen(4322, '127.0.0.1', () => console.log('Atlas v2 prototypes: http://localhost:4322'));
