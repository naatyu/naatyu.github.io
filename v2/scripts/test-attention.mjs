import assert from 'node:assert/strict';
import './test-attention-preservation.mjs';
import './test-attention-notation.mjs';
import './test-attention-flash.mjs';
import './test-attention-core-closure.mjs';
import {readFile} from 'node:fs/promises';
import {softmaxRow,attentionExample,cacheElements,onlineAttention,exampleValues} from '../site/readers/attention-model.js';
import {attentionFrame,attentionSvg,attentionAnimation,mountAttentionAnimation} from '../site/readers/attention-animation.js';
import {parseFragment} from 'parse5';
import {attentionMeta,attentionReader,attentionSections} from '../site/readers/attention.js';
import {readerMetas,readerAliases,canonicalReaderSlug,renderDenseReader} from '../site/readers/index.js';
import {makeTree,findNode} from '../site/navigation.js';
import {rank} from '../site/search.js';
const close=(a,b)=>assert(Math.abs(a-b)<1e-12,`${a} != ${b}`);
const ex=attentionExample();
close(ex.weights.reduce((a,b)=>a+b),1);assert.equal(ex.weights[3],0);
close(ex.output[0],ex.weights[0]+ex.weights[2]);close(ex.output[1],ex.weights[1]+ex.weights[2]);
assert.deepEqual(softmaxRow([10000,10000]),[.5,.5]);
assert.deepEqual(softmaxRow([0,100000],[true,false]),[1,0]);
assert.throws(()=>softmaxRow([0,1],[false,false]),RangeError);
assert.throws(()=>softmaxRow([NaN]),RangeError);
assert.throws(()=>attentionExample(0),RangeError);
assert.equal(cacheElements(8192,32,32,128,128)*2,4*2**30);
assert.equal(cacheElements(8192,32,8,128,128)*2,2**30);
assert.equal(cacheElements(8192,32,1,128,128)*2,128*2**20);
// Compare tiled accumulation, including a later maximum, against the direct row.
for(const scores of [[2,.5,-.5],[0,5,-5],[1000,999,1001]]){
  const p=softmaxRow(scores),values=exampleValues.slice(0,3);
  const expected=[0,1].map(d=>p.reduce((s,w,i)=>s+w*values[i][d],0));
  for(const split of [1,2]){
    const actual=onlineAttention([{scores:scores.slice(0,split),values:values.slice(0,split)},{scores:[],values:[]},{scores:scores.slice(split),values:values.slice(split)}]);
    actual.forEach((x,i)=>close(x,expected[i]));
  }
}
assert.throws(()=>onlineAttention([]),RangeError);
assert.deepEqual([0,.2,.4,.6,.8,1].map(p=>attentionFrame(p).stage),[0,1,2,3,4,4]);
assert.equal(attentionFrame(1).mixProgress,1,'Complete animation endpoint must be exact');
const initialSvg=attentionSvg(0);assert(attentionAnimation.includes(initialSvg));assert(attentionAnimation.includes('viewBox="0 0 720 425"'));
function tree(n){return [n,...(n.childNodes||[]).flatMap(tree)];}
for(const width of [260,320,720])for(let i=0;i<=100;i++)for(const reduced of [false,true]){
  const svg=attentionSvg(i/100,width,reduced);assert(!/NaN|Infinity|undefined/.test(svg));
  const nodes=tree(parseFragment(svg));const labels=nodes.filter(n=>n.tagName==='text').map(n=>tree(n).filter(c=>c.nodeName==='#text').map(c=>c.value).join(''));
  for(const key of ['k1','k2','k3','k4'])assert(labels.includes(key));
  if(i===100)assert(labels.includes('Σ pᵢvᵢ = [0.829, 0.234]'));
}
for(let i=0;i<=100;i++){const f=attentionFrame(i/100);assert.equal(f.weights[3],0);close(f.weights.reduce((a,b)=>a+b),1);assert(f.mixProgress>=0&&f.mixProgress<=1);}
const catalog=JSON.parse(await readFile(new URL('../site/catalog.json',import.meta.url),'utf8'));
const sources=catalog.notes.filter(n=>n.tracked&&!n.navigationPage&&!n.draft&&!n.unlisted);
const notes=[...readerMetas,...sources.filter(n=>!readerAliases.includes(n.slug))];
assert(findNode(makeTree(notes),['models','architectures']).notes.some(n=>n.slug==='models/attention'));
// All five core original bodies now have reviewed destinations.
for(const slug of ['ai/architectures/transformers/flashattention','ai/architectures/transformers/linear-attention','ai/architectures/transformers/attention-variants','ai/foundations/attention-mechanism','ai/architectures/transformers/attention-softmax-and-scaling']){
  assert(!notes.some(n=>n.slug===slug));
  assert.equal(canonicalReaderSlug(slug),'models/attention');
}
assert.equal(canonicalReaderSlug('ai/architectures/transformers/flashattention'),'models/attention');
assert.equal(canonicalReaderSlug('ai/training/optimization/moe-training-stability'),'models/moe');
assert(renderDenseReader('models/attention',s=>'directions.html?slug='+s));
const html=attentionReader(s=>'directions.html?slug='+s);
const ids=[...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
for(const [id] of attentionSections)assert(ids.includes(id),id);
for(const target of [...html.matchAll(/slug=([^"#]+)/g)].map(m=>m[1]))assert(notes.some(n=>n.slug===target),target);
for(const q of ['grouped query attention','online softmax','IndexPool','bounded decay'])assert(rank(notes,q).some(r=>r.note===attentionMeta),q);
assert(html.indexOf('id="head-sharing"')<html.indexOf('id="mla"'));
for(const text of ['−∞','all-masked','2019','2020','2023','2024','192 unrotated','16,384','2,051','890 MB','arbitrarily long product','not mathematically equal','512','37.5%'])assert(html.includes(text),text);
const css=await readFile(new URL('../site/readers/attention.css',import.meta.url),'utf8');assert(css.includes('@media(max-width:600px)'));
// Headless state harness: reduced motion never starts a timed animation.
// This verifies the component branch, not a real OS/browser media preference.
const globalNames=['matchMedia','ResizeObserver','IntersectionObserver','requestAnimationFrame','cancelAnimationFrame'];
const globals=Object.fromEntries(globalNames.map(k=>[k,globalThis[k]]));
try{
  const node=()=>({textContent:'',innerHTML:'',value:'0',hidden:false,events:{},setAttribute(){},addEventListener(t,fn){this.events[t]=fn;}});
  const elements=Object.fromEntries(['svg','play','scrub','equation','stage','caption','replay','next'].map(k=>[k,node()]));
  const root={clientWidth:360,querySelector:s=>elements[s.replace('[data-attention-','').replace(']','')]};
  const disposed=[];let observersDisconnected=0;
  const article={isConnected:true,querySelector:()=>root,addEventListener:(t,fn)=>disposed.push(fn)};
  globalThis.matchMedia=()=>({matches:true});
  globalThis.ResizeObserver=globalThis.IntersectionObserver=class{observe(){}disconnect(){observersDisconnected++;}};
  globalThis.requestAnimationFrame=()=>{throw new Error('Reduced-motion branch must not schedule frames');};
  globalThis.cancelAnimationFrame=()=>{};
  mountAttentionAnimation(article);assert(elements.play.hidden);
  for(let i=0;i<4;i++)elements.next.events.click();
  assert.equal(elements.stage.textContent,'05 / Read values');
  assert(elements.svg.innerHTML.includes('Σ pᵢvᵢ = [0.829, 0.234]'));
  elements.replay.events.click();assert.equal(elements.stage.textContent,'01 / Compare');
  disposed.forEach(fn=>fn());assert.equal(observersDisconnected,2);
}finally{for(const k of globalNames){if(globals[k]===undefined)delete globalThis[k];else globalThis[k]=globals[k];}}
console.log('Attention masks, stable softmax, value mixing, cache accounting, online normalization, animation states, registry, source visibility, anchors and search pass.');
