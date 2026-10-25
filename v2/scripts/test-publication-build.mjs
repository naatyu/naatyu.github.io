import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {parse} from 'parse5';
import {buildPublication} from './build-publication.mjs';
import {readerMetas,renderDenseReader} from '../site/readers/index.js';
const result=await buildPublication();
assert(readerMetas.every(meta=>meta.prototype===false),'Live readers must not retain prototype metadata');
assert.equal(result.indexedPages,56);assert.equal(result.deployed,false);
const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value;
const walk=n=>[n,...(n.childNodes||[]).flatMap(walk)];
const prose=n=>n.nodeName==='#text'?n.value:(n.childNodes||[]).map(prose).join('');
const normalize=s=>s.replaceAll(' · Local reader draft','').replaceAll(' · Consolidated reader pilot','');
const svg=await readFile(path.join(result.output,'img/favicon.svg'),'utf8');
assert(svg.includes('viewBox="0 0 64 64"')&&svg.includes('#702b40')&&svg.includes('#c5e2fa'));
const ico=await readFile(path.join(result.output,'favicon.ico'));
assert.equal(ico.readUInt16LE(2),1);assert.equal(ico.readUInt16LE(4),3);
for(let i=0;i<3;i++){
  const entry=6+16*i,size=[16,32,48][i];
  assert.equal(ico[entry],size);assert.equal(ico[entry+1],size);
  const offset=ico.readUInt32LE(entry+12),length=ico.readUInt32LE(entry+8);
  assert(offset+length<=ico.length);assert.equal(ico.subarray(offset,offset+8).toString('hex'),'89504e470d0a1a0a');
}
const touch=await readFile(path.join(result.output,'img/apple-touch-icon.png'));
assert.equal(touch.readUInt32BE(16),180);assert.equal(touch.readUInt32BE(20),180);
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
    const html=await readFile(file,'utf8');
    assert(html.includes('rel="icon" type="image/svg+xml" href="/img/favicon.svg"'),relative+' missing SVG favicon');
    assert(html.includes('rel="icon" href="/favicon.ico"'),relative+' missing ICO fallback');
    assert(html.includes('rel="apple-touch-icon" href="/img/apple-touch-icon.png"'),relative+' missing touch icon');
    if(relative==='index.html'||relative==='atlas/index.html'||readerMetas.some(m=>relative===`atlas/${m.slug}/index.html`))continue;
    assert((await readFile(file,'utf8')).includes('noindex,nofollow'),relative);protectedPages++;
  }
}}
await check(result.output);assert.equal(protectedPages,232);
console.log('Publication-format build:56 canonical pages,54 unchanged reader texts/date lineages,sitemap/robots/.nojekyll and232 noindex legacy/retired/404 pages pass. Not release approval or deployment.');
