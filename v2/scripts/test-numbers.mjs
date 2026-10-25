import assert from 'node:assert/strict';
import './test-numbers-preservation.mjs';
import {readFile} from 'node:fs/promises';
import {word,signedWord,xorTrace,addTrace,alignment,spiralTrace} from '../site/readers/numbers-model.js';
import {numbersReader,numbersMeta,numbersSections} from '../site/readers/numbers.js';
import {readerMetas,renderDenseReader} from '../site/readers/index.js';
import {rank} from '../site/search.js';
let additions=0,alignments=0,spirals=0;
for(let a=0;a<256;a++)for(let b=0;b<256;b++){const f=addTrace(a,b);additions++;assert(f.length<=9);assert(f.at(-1).done);assert.equal(f.at(-1).a,(a+b)%256);for(const s of f){assert.equal((s.a+s.b)%256,(a+b)%256);assert.equal(word(s.a).length,8);assert.equal(word(s.b).length,8);}}
assert.equal(signedWord(255),-1);assert.equal(signedWord(128),-128);assert.equal(signedWord(127),127);
for(let width=1;width<=16;width++)assert.equal(addTrace(2**width-1,1,width).at(-1).a,0);
for(let x=0;x<256;x++)for(const a of [1,2,4,8,16,32,64,128]){const f=alignment(x,a);alignments++;assert.equal(f.down,Math.floor(x/a)*a);assert.equal(f.up,Math.ceil(x/a)*a);assert(f.down<=x&&f.up>=x);assert.equal(f.down%a,0);assert.equal(f.up%a,0);assert.equal(f.offset,x%a);}
// Independent direction-changing walk, rather than another boundary-peeling routine.
function walk(rows,cols){if(!rows||!cols)return [];const seen=new Set(),out=[],dirs=[[0,1],[1,0],[0,-1],[-1,0]];let r=0,c=0,d=0;while(out.length<rows*cols){const index=r*cols+c;seen.add(index);out.push(index);let nr=r+dirs[d][0],nc=c+dirs[d][1];if(nr<0||nr>=rows||nc<0||nc>=cols||seen.has(nr*cols+nc)){d=(d+1)%4;nr=r+dirs[d][0];nc=c+dirs[d][1];}r=nr;c=nc;}return out;}
for(let r=0;r<=8;r++)for(let c=0;c<=8;c++){const frames=spiralTrace(r,c),expected=walk(r,c);spirals++;for(const f of frames){assert.deepEqual(f.output,expected.slice(0,f.output.length));assert.equal(f.output.length,new Set(f.output).size);assert(f.current===null||f.output.at(-1)===f.current);}assert.deepEqual(frames.at(-1).output,expected);}
for(let unique=0;unique<16;unique++){const values=[5,2,5,unique,2],frames=xorTrace(values);assert.equal(frames.at(-1).accumulator,unique);for(const f of frames)assert.equal(f.accumulator,values.slice(0,f.processed).reduce((a,b)=>a^b,0));assert.equal(xorTrace([...values].reverse()).at(-1).accumulator,unique);}
for(const fn of [()=>word(-1),()=>word(256),()=>word(0,0),()=>signedWord(NaN),()=>addTrace(0,-1),()=>alignment(1,0),()=>alignment(1,3),()=>alignment(-1,8),()=>alignment(1.5,8),()=>spiralTrace(9,1),()=>spiralTrace(-1,1)])assert.throws(fn);
const link=s=>'directions.html?slug='+s,html=numbersReader(link),ids=[...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);for(const [id]of numbersSections)assert(ids.includes(id));assert.equal(numbersMeta.prototype,false);assert.equal(numbersMeta.date,'2026-07-24');
const catalog=JSON.parse(await readFile(new URL('../site/catalog.json',import.meta.url),'utf8')),notes=[...readerMetas,...catalog.notes];
for(const [,slug,anchor]of html.matchAll(/href="directions\.html\?slug=([^"#]+)(?:#([^"]+))?"/g)){assert(notes.some(n=>n.slug===slug),slug);if(anchor)assert(renderDenseReader(slug,link)?.includes(`id="${anchor}"`),slug+'#'+anchor);}
for(const query of ['alignment','bit manipulation','modular','spiral','slope'])assert(rank(notes,query).some(r=>r.note===numbersMeta),query);
console.log(`Numbers: ${additions} exact carry cases, ${alignments} alignments, ${spirals} independently checked matrix shapes, XOR prefixes, domain guards, routes and semantic search pass.`);
