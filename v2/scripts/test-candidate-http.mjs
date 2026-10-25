import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import {mkdtemp,writeFile,symlink,rename,unlink} from 'node:fs/promises';
import {buildCandidate} from './build-candidate.mjs';
import {createCandidateServer} from './serve-candidate.mjs';
import {readerMetas} from '../site/readers/index.js';
import {reviewedNavigation} from '../site/reviewed-navigation.js';
import {retiredNavigation} from '../site/retired-navigation.js';

// Separate from the offline default suite: requires local loopback binding.
const result=await buildCandidate(),server=await createCandidateServer(result.output);
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
const origin='http://127.0.0.1:'+server.address().port;
let routes=0;
async function request(route,options={}){
  const response=await fetch(origin+route,{redirect:'manual',...options});
  assert.equal(response.headers.get('x-robots-tag'),'noindex, nofollow');
  assert.equal(response.headers.get('cache-control'),'no-store');
  assert.equal(response.headers.get('x-content-type-options'),'nosniff');
  return {response,body:await response.text()};
}
try{
  for(const slug of [...readerMetas.map(meta=>meta.slug),...Object.keys(reviewedNavigation),...Object.keys(retiredNavigation)]){
    const {response,body}=await request('/atlas/'+slug+'/');
    assert.equal(response.status,200,slug);assert.equal(response.headers.get('content-type'),'text/html; charset=utf-8');
    assert(body.includes('noindex,nofollow'));routes++;
  }
  for(const route of ['/','/atlas/']){const {response,body}=await request(route);assert.equal(response.status,200);assert(body.includes('id="main"'));}
  const missing=await request('/atlas/no-such-topic/');assert.equal(missing.response.status,404);assert(missing.body.includes('<h1>Page not found</h1>'));assert(!missing.body.includes('<article'));
  const head=await request('/atlas/models/moe/',{method:'HEAD'});assert.equal(head.response.status,200);assert.equal(head.body,'');
  const missingHead=await request('/missing',{method:'HEAD'});assert.equal(missingHead.response.status,404);assert.equal(missingHead.body,'');
  const redirect=await request('/atlas/models/moe?path=models%2Farchitectures');assert.equal(redirect.response.status,308);assert.equal(redirect.response.headers.get('location'),'/atlas/models/moe/?path=models%2Farchitectures');
  const denied=await request('/.internal/v2/authoring-contract.md');assert.equal(denied.response.status,403);assert.equal(denied.body,'');
  const absent=await request('/docs/math/probability/entropy.md');assert.equal(absent.response.status,404);assert(!absent.body.includes('Coding-Theoretic Derivation'));
  const method=await request('/atlas/',{method:'POST'});assert.equal(method.response.status,405);assert.equal(method.response.headers.get('allow'),'GET, HEAD');
  for(const [route,type]of [['/runtime.js','text/javascript; charset=utf-8'],['/assets/page-metadata.js','text/javascript; charset=utf-8'],['/candidate.css','text/css; charset=utf-8'],['/search.json','application/json; charset=utf-8']]){const {response}=await request(route);assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),type);}
  // Owned disposable fixtures: neither a requested file nor its error fallback
  // may follow a symlink out of the candidate. No real user source is used.
  const fixture=await mkdtemp(path.join(os.tmpdir(),'atlas-http-outside-')),outside=path.join(fixture,'dummy.txt');
  await writeFile(outside,'Outside-candidate test fixture');
  await symlink(outside,path.join(result.output,'escape.txt'));
  const escape=await request('/escape.txt');assert.equal(escape.response.status,403);assert.equal(escape.body,'');
  const original404=path.join(result.output,'404.html'),backup404=path.join(result.output,'404-review-backup.html');
  await rename(original404,backup404);
  await symlink(outside,original404);
  try{const fallback=await request('/unknown-with-unsafe-fallback');assert.equal(fallback.response.status,403);assert.equal(fallback.body,'');}
  finally{await unlink(original404);await rename(backup404,original404);}
  console.log(`Local HTTP: ${routes} canonical/moved/retired routes plus Home/Atlas;custom404,HEAD,query-preserving308,private/symlink exclusion,405,MIME,no-store,noindex and nosniff pass.`);
}finally{server.closeAllConnections?.();await new Promise(resolve=>server.close(resolve));}
