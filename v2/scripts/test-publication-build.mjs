import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {parse} from 'parse5';
import {buildPublication} from './build-publication.mjs';
import {readerMetas,renderDenseReader} from '../prototypes/readers/index.js';
const result=await buildPublication();
assert.equal(result.indexedPages,56);assert.equal(result.deployed,false);
const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value;
const walk=n=>[n,...(n.childNodes||[]).flatMap(walk)];
const prose=n=>n.nodeName==='#text'?n.value:(n.childNodes||[]).map(prose).join('');
const normalize=s=>s.replaceAll(' · Local reader draft','').replaceAll(' · Consolidated reader pilot','');
for(const meta of readerMetas){
  const html=await readFile(path.join(result.output,'atlas',meta.slug,'index.html'),'utf8');
  const nodes=walk(parse(html)),article=nodes.find(n=>n.tagName==='article');assert(article);
  assert(!nodes.some(n=>n.tagName==='meta'&&attr(n,'name')==='robots'));
  assert.equal(normalize(prose(article)),normalize(prose(walk(parse(renderDenseReader(meta.slug,s=>'/atlas/'+s))).find(n=>n.tagName==='article'))),meta.slug+' changed scientific text');
  assert.equal(nodes.filter(n=>n.tagName==='link'&&attr(n,'rel')==='canonical').length,1);
  assert(nodes.some(n=>attr(n,'property')==='article:published_time'&&attr(n,'content')===meta.date));
}
const sitemap=await readFile(path.join(result.output,'sitemap.xml'),'utf8');
assert.equal((sitemap.match(/<url>/g)||[]).length,56);
for(const meta of readerMetas)assert(sitemap.includes(`https://naatyu.github.io/atlas/${meta.slug}/</loc><lastmod>${meta.updated}</lastmod>`));
assert(!(await readFile(path.join(result.output,'robots.txt'),'utf8')).includes('Disallow: /'));
assert.equal(await readFile(path.join(result.output,'.nojekyll'),'utf8'),'');
let protectedPages=0;
async function check(dir){for(const e of await readdir(dir,{withFileTypes:true})){
  const file=path.join(dir,e.name);if(e.isDirectory())await check(file);
  else if(e.name.endsWith('.html')){
    const relative=path.relative(result.output,file).split(path.sep).join('/');
    if(relative==='index.html'||relative==='atlas/index.html'||readerMetas.some(m=>relative===`atlas/${m.slug}/index.html`))continue;
    assert((await readFile(file,'utf8')).includes('noindex,nofollow'),relative);protectedPages++;
  }
}}
await check(result.output);assert.equal(protectedPages,232);
console.log('Publication-format build:56 canonical pages,54 unchanged reader texts/date lineages,sitemap/robots/.nojekyll and232 noindex legacy/retired/404 pages pass. Not release approval or deployment.');
