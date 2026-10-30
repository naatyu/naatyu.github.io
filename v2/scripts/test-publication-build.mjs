import {inflateSync} from 'node:zlib';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {parse} from 'parse5';
import {buildPublication} from './build-publication.mjs';
import {readerMetas,renderDenseReader} from '../site/readers/index.js';
const result=await buildPublication();
assert(readerMetas.every(meta=>meta.prototype===false),'Live readers must not retain prototype metadata');
assert.equal(result.indexedPages,58);assert.equal(result.deployed,false);
const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value;
const walk=n=>[n,...(n.childNodes||[]).flatMap(walk)];
const prose=n=>n.nodeName==='#text'?n.value:(n.childNodes||[]).map(prose).join('');
const normalize=s=>s.replaceAll(' · Local reader draft','').replaceAll(' · Consolidated reader pilot','');
const svg=await readFile(path.join(result.output,'img/favicon.svg'),'utf8');
assert(svg.includes('viewBox="0 0 64 64"')&&!/<rect\b/.test(svg),'Favicon must have no opaque SVG backdrop');
// Check real alpha values, not merely an RGBA declaration around opaque pixels.
function assertTransparentPng(png,size,label){
  assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a',label);
  assert.equal(png.readUInt32BE(16),size,label);assert.equal(png.readUInt32BE(20),size,label);
  assert.equal(png[24],8,label+' must use 8-bit channels');assert.equal(png[25],6,label+' must preserve RGBA');
  assert.equal(png[28],0,label+' must be noninterlaced');
  const chunks=[];for(let p=8;p<png.length;){const n=png.readUInt32BE(p);if(png.toString('ascii',p+4,p+8)==='IDAT')chunks.push(png.subarray(p+8,p+8+n));p+=n+12;}
  const raw=inflateSync(Buffer.concat(chunks)),stride=size*4,pixels=Buffer.alloc(size*stride);
  const paeth=(a,b,c)=>{const p=a+b-c,da=Math.abs(p-a),db=Math.abs(p-b),dc=Math.abs(p-c);return da<=db&&da<=dc?a:db<=dc?b:c;};
  assert.equal(raw.length,size*(stride+1));
  for(let y=0;y<size;y++){
    const filter=raw[y*(stride+1)];assert(filter<=4,label+' invalid PNG filter');
    for(let x=0;x<stride;x++){
      const i=y*stride+x,a=x>=4?pixels[i-4]:0,b=y?pixels[i-stride]:0,c=y&&x>=4?pixels[i-stride-4]:0;
      const prediction=[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter];
      pixels[i]=(raw[y*(stride+1)+x+1]+prediction)&255;
    }
  }
  const alpha=(x,y)=>pixels[(y*size+x)*4+3];
  for(const [x,y]of [[0,0],[size-1,0],[0,size-1],[size-1,size-1],[Math.floor(size/2),Math.floor(size/2)]])assert.equal(alpha(x,y),0,label+' background/interior must be transparent');
  assert(pixels.some((v,i)=>i%4===3&&v>0),label+' must retain the logo');
}
const image=svg.match(/href="data:image\/png;base64,([A-Za-z0-9+/=]+)"/);
assert(image,'Approved artwork must be self-contained inside the favicon SVG');
const embedded=Buffer.from(image[1],'base64');
assert.equal(embedded.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
assertTransparentPng(embedded,256,'SVG embedded icon');
assert(!/href="https?:|href="\//.test(svg),'Favicon cannot depend on external image requests');
await assert.rejects(readFile(path.join(result.output,'img/favicon-master.png')),{code:'ENOENT'},'Do not publish the full-resolution source artwork');
const ico=await readFile(path.join(result.output,'favicon.ico'));
assert.equal(ico.readUInt16LE(2),1);assert.equal(ico.readUInt16LE(4),3);
for(let i=0;i<3;i++){
  const entry=6+16*i,size=[16,32,48][i];
  assert.equal(ico[entry],size);assert.equal(ico[entry+1],size);
  const offset=ico.readUInt32LE(entry+12),length=ico.readUInt32LE(entry+8);
  assert(offset+length<=ico.length);assertTransparentPng(ico.subarray(offset,offset+length),size,`ICO ${size}px`);
}
const touch=await readFile(path.join(result.output,'img/apple-touch-icon.png'));
assertTransparentPng(touch,180,'Touch icon');
for(const meta of readerMetas){
  const html=await readFile(path.join(result.output,'atlas',meta.slug,'index.html'),'utf8');
  const nodes=walk(parse(html)),article=nodes.find(n=>n.tagName==='article');assert(article);
  assert(!nodes.some(n=>n.tagName==='meta'&&attr(n,'name')==='robots'));
  assert.equal(normalize(prose(article)),normalize(prose(walk(parse(renderDenseReader(meta.slug,s=>'/atlas/'+s))).find(n=>n.tagName==='article'))),meta.slug+' changed scientific text');
  assert.equal(nodes.filter(n=>n.tagName==='link'&&attr(n,'rel')==='canonical').length,1);
  assert(nodes.some(n=>attr(n,'property')==='article:published_time'&&attr(n,'content')===meta.date));
}
const sitemap=await readFile(path.join(result.output,'sitemap.xml'),'utf8');
assert.equal((sitemap.match(/<url>/g)||[]).length,58);
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
console.log('Publication-format build:58 canonical pages,56 unchanged reader texts/date lineages,sitemap/robots/.nojekyll and232 noindex legacy/retired/404 pages pass. Not release approval or deployment.');
