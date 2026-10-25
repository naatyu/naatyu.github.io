import assert from 'node:assert/strict';
import './test-position-preservation.mjs';
import './test-position-notation.mjs';
if(process.env.ATLAS_TORCH_PYTHON)await import('./test-position-tensors.mjs');
import {readFile} from 'node:fs/promises';
import {rotate,dot,rotaryFrequencies,shiftFrame,positionalBlock,apply2,multiply2,localDistanceWarp} from '../site/readers/position-model.js';
import {positionMeta,positionReader,positionSections} from '../site/readers/position.js';
import {readerMetas,readerAliases,renderDenseReader} from '../site/readers/index.js';
import {rank} from '../site/search.js';
const close=(a,b)=>assert(Math.abs(a-b)<1e-9,`${a} != ${b}`),matrixClose=(a,b)=>a.forEach((r,i)=>r.forEach((v,j)=>close(v,b[i][j])));
assert.deepEqual(rotaryFrequencies(8,10000),[1,.1,.01,.001]);assert.equal(rotaryFrequencies(8,500000)[0],1);for(let i=1;i<4;i++)assert(rotaryFrequencies(8,500000)[i]<rotaryFrequencies(8,10000)[i]);
for(const width of [2,8,128]){const f=rotaryFrequencies(width,10000);assert.equal(f.length,width/2);close(f.at(-1),10000**(-1+2/width));}assert.throws(()=>rotaryFrequencies(3,10000));assert.throws(()=>rotaryFrequencies(8,1));
for(const q of [[1,0],[.6,.8],[-1,2]])for(const k of [[1,0],[.6,.8],[-1,2]])for(const w of [.1,.4,1])for(const [m,n]of [[0,0],[2,5],[100,-13],[2000,3000]]){close(dot(rotate(q,m*w),rotate(k,n*w)),dot(q,rotate(k,(n-m)*w)));close(Math.hypot(...rotate(q,m*w)),Math.hypot(...q));}
for(let t=0;t<=100;t++)for(const w of [.2,.4,1]){const f=shiftFrame(t/5,w);close(f.score,Math.cos(3*w));close(f.delta,3);close(Math.hypot(...f.q),1);close(Math.hypot(...f.k),1);}
for(const kind of ['identity','rotation','decay','damped','jordan'])for(const a of [-20,-3,0,4,20])for(const b of [-2,0,5]){matrixClose(multiply2(positionalBlock(kind,a),positionalBlock(kind,b)),positionalBlock(kind,a+b));matrixClose(multiply2(positionalBlock(kind,a),positionalBlock(kind,-a)),[[1,0],[0,1]]);}
close(Math.hypot(...apply2(positionalBlock('decay',20),[0,1])),Math.exp(-2));close(Math.hypot(...apply2(positionalBlock('decay',-20),[0,1])),Math.exp(2));assert.deepEqual(apply2(positionalBlock('jordan',5),[0,1]),[5,1]);close(dot([1,0],apply2(positionalBlock('jordan',7),[0,-.3])),-2.1);assert.throws(()=>positionalBlock('unknown',0));
close(localDistanceWarp(3,4,2),3);close(localDistanceWarp(10,4,2),7);close(localDistanceWarp(-10,4,2),-7);close(localDistanceWarp(4,4,2),4);assert.throws(()=>localDistanceWarp(10,4,0));assert.notEqual(localDistanceWarp(3+3,4,2),localDistanceWarp(3,4,2)+localDistanceWarp(3,4,2));
const catalog=JSON.parse(await readFile(new URL('../site/catalog.json',import.meta.url),'utf8')),notes=[...readerMetas,...catalog.notes.filter(n=>!readerAliases.includes(n.slug))],html=positionReader(s=>'directions.html?slug='+s),ids=[...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);for(const [id]of positionSections)assert(ids.includes(id),id);for(const slug of [...html.matchAll(/slug=([^"#]+)/g)].map(m=>m[1]))assert(notes.some(n=>n.slug===slug),slug);assert(renderDenseReader(positionMeta.slug,s=>s));for(const query of ['NoPE','Jordan','ReRoPE','YaRN','signed displacement','group representation'])assert(rank(notes,query).some(r=>r.note===positionMeta),query);
for(const s of ['positional-encoding-sinusoidal-to-rope','rope-scaling','no-positional-embeddings-nope','group-theoretic-positional-encodings'])assert(!notes.some(n=>n.slug==='ai/architectures/transformers/'+s));
console.log('Position: phase frequencies, relative Q/K scores, common shifts, norm conservation, group composition/inverses, decay direction, ALiBi channel, warp limits, anchors, links and search pass.');
