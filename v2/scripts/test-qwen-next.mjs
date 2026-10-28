import assert from 'node:assert/strict';
import {parseFragment} from 'parse5';
import {qsaToy,qwenBaseRows,qwenLongRows,qwenBatchRows} from '../site/readers/qwen-next-model.js';
import {qsaToyBody} from '../site/readers/qwen-next-scenes.js';
import {readerMetas,renderDenseReader} from '../site/readers/index.js';
import {rank} from '../site/search.js';
import {assertGeneratedMarkup,assertGeneratedMarkupCount} from './check-generated-markup.mjs';
const flat=n=>[n,...(n.childNodes||[]).flatMap(flat)],attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value;
let states=0;
for(let position=0;position<12;position++)for(let step=0;step<4;step++){
 const f=qsaToy(position,step);
 assert.equal(f.blocks.length,Math.floor((position+1)/4));
 assert(f.blocks.every(b=>b.end<=position));
 assert.deepEqual(f.tail,Array.from({length:(position+1)%4},(_,i)=>4*Math.floor((position+1)/4)+i));
 assert(f.indices.every(i=>i<=position));assert.equal(new Set(f.indices).size,f.indices.length);
 assert(f.indices.length<=7);assert(f.tail.every(i=>f.indices.includes(i)));
 if(position>=3)assert.equal(f.selected[0].index,0);
 assertGeneratedMarkup(qsaToyBody(position,step),'qwen-qsa');states++;
}
assert.equal(states,48);assertGeneratedMarkupCount('qwen-qsa',48);
assert.deepEqual(qsaToy(0).indices,[0]);assert.deepEqual(qsaToy(3).indices,[0,1,2,3]);
assert.deepEqual(qsaToy(10).indices,[0,1,2,3,8,9,10]);
assert.deepEqual(qsaToy(11).indices,[0,1,2,3]);
assert.deepEqual(qsaToy(11).blocks.map(b=>b.score),[1,0,0]);
for(const x of [-1,12,.5,NaN])assert.throws(()=>qsaToy(x),RangeError);
for(const x of [-1,4,.5,NaN])assert.throws(()=>qsaToy(10,x),RangeError);
assert.equal(qwenBaseRows.length,14);assert.equal(qwenBaseRows.filter(([,a,,b])=>a>b).length,8);
assert(qwenBaseRows.every(([,a,b])=>a>b));
assert(Math.abs(Math.max(...qwenBaseRows.map(([,a,,b])=>b-a))-2.59)<1e-10);
assert.equal(qwenLongRows.find(([n])=>n==='8-needle MRCR 1M')[2],26.44);
assert(Math.abs(qwenBatchRows[0][3]-qwenBatchRows[1][3]-.0072)<1e-10);
assert.equal(1000*8*262144,2097152000);assert.equal(8000*96*262144,201326592000);
const ns=(a,b)=>32*Math.max(a,b)*Math.min(a,b)**2;
assert.equal(4096**2,1024*16384);assert.equal(ns(4096,4096)/ns(1024,16384),4);
assert.equal(.5*2+.25*(3-.5*2),1.5,'Decay must precede prediction in the scalar recurrence');
const expected={
 'models/attention':['qwen-gdn','qwen-qsa'],
 'models/transformers':['qwen-gr'],
 'training/scaling':['qwen-hyperparameters','qwen-memory'],
 'training/optimization':['qwen-muon'],
 'training/stability':['qwen-stress'],
 'execution/performance':['qwen-systems'],
 'execution/speculation':['qwen-mtp'],
 'training/frontier-recipes':['qwen-next','qwen-next-evidence'],
};
const link=s=>'/atlas/'+s.split('#')[0]+'/' +(s.includes('#')?'#'+s.split('#')[1]:'');
for(const [slug,anchors] of Object.entries(expected)){
 const html=renderDenseReader(slug,link),nodes=flat(parseFragment(html)),ids=nodes.map(n=>attr(n,'id')).filter(Boolean);
 for(const id of anchors){assert.equal(ids.filter(x=>x===id).length,1);assert(nodes.some(n=>n.tagName==='a'&&attr(n,'href')==='#'+id));}
 assert(html.includes('tech_report.pdf'));assert(html.includes('Updated 2026-10-28'));
 assert(!html.includes('>undefined<'));
 for(const n of nodes.filter(n=>n.tagName==='a')){
  const href=attr(n,'href')||'',match=href.match(/^\/atlas\/([^#]+)\/#(.+)$/);
  if(match){const target=renderDenseReader(match[1],link);assert(target?.includes('id="'+match[2]+'"'),href);}
 }
 assertGeneratedMarkup(html,'qwen-static');
}
assertGeneratedMarkupCount('qwen-static',8);
for(const [query,slug] of [['QSA','models/attention'],['Canzona','execution/performance'],['Gated Residual','models/transformers'],['Qwen3.8','training/frontier-recipes']]){
 assert(rank(readerMetas,query).some(r=>r.note.slug===slug),query+' missing from search');
}
const disclosure=renderDenseReader('training/frontier-recipes',link);
assert(disclosure.includes('Named final policy algorithm'));assert(disclosure.includes('sandbox construction'));
assert(disclosure.includes('does not identify the algorithm'));
console.log('Qwen Next: 48 causal selector states, 8 topic integrations, 11 anchors, source tables, budget arithmetic, cross-links, dates and search pass.');
