import assert from 'node:assert/strict';
import './test-speculation-scenes.mjs';
import {readFile} from 'node:fs/promises';
import {speculativeMass,exactP,exactQ,expectedCommitted,cachePlan,ancestorMask,roundFrame} from '../prototypes/readers/speculation-model.js';
import {samplingDistribution,guidedLogits} from '../prototypes/readers/decoding-model.js';
import {speculationMeta,speculationReader,speculationSections} from '../prototypes/readers/speculation.js';
import {decodingMeta,decodingReader,decodingSections,samplerPresentation} from '../prototypes/readers/decoding.js';
import {entropy} from '../prototypes/readers/information-model.js';
import {parseFragment} from 'parse5';
import {readerMetas,readerAliases,renderDenseReader} from '../prototypes/readers/index.js';
import {reviewedNavigation} from '../prototypes/reviewed-navigation.js';
import {rank} from '../prototypes/search.js';
const close=(a,b)=>assert(Math.abs(a-b)<1e-10,`${a} != ${b}`);
const f=speculativeMass(exactP,exactQ);close(f.alpha,.8);close(f.rejection,.2);f.output.forEach((v,i)=>close(v,exactP[i]));f.residual.forEach((v,i)=>close(v,[0,.5,.5,0][i]));
for(const [p,q] of [[[1,0],[0,1]],[[0,1],[0,1]],[[.5,.5],[1,0]],[[.01,.99],[.9,.1]]]){const m=speculativeMass(p,q);m.output.forEach((v,i)=>close(v,p[i]));close(m.alpha+m.rejection,1);if(m.residual)close(m.residual.reduce((s,v)=>s+v,0),1);}
assert.equal(speculativeMass([0,1],[0,1]).residual,null);assert.equal(speculativeMass([0,1],[0,1]).ratios[0],null);assert.throws(()=>speculativeMass([1],[.5,.5]));
// Enumerate two-position joint probabilities with different conditional models.
const firstP=[.7,.3],firstQ=[.5,.5],secondP=[[.2,.8],[.9,.1]],secondQ=[[.8,.2],[.1,.9]];
const first=speculativeMass(firstP,firstQ).output;for(let a=0;a<2;a++){const second=speculativeMass(secondP[a],secondQ[a]).output;for(let b=0;b<2;b++)close(first[a]*second[b],firstP[a]*secondP[a][b]);}
close(expectedCommitted([.8,.8,.8]).total,2.952);close(expectedCommitted([1,1,1]).total,4);close(expectedCommitted([0,1,1]).total,1);assert.throws(()=>expectedCommitted([1.1]));
// Independent complete Bernoulli paths: first rejection commits a correction;
// an all-accepted path commits the bonus. Includes both closed-form endpoints.
let budgetCases=0;
for(const alpha of [0,.1,.5,.8,.999,1])for(let gamma=1;gamma<=8;gamma++){
  let enumerated=0;
  for(let mask=0;mask<2**gamma;mask++){
    let probability=1,accepted=gamma;
    for(let i=0;i<gamma;i++){
      const survives=Boolean(mask&(1<<i));probability*=survives?alpha:1-alpha;
      if(!survives&&accepted===gamma)accepted=i;
    }
    enumerated+=probability*(accepted+1);
  }
  close(expectedCommitted(Array(gamma).fill(alpha)).total,enumerated);
  const closed=alpha===1?gamma+1:(1-alpha**(gamma+1))/(1-alpha);
  close(closed,enumerated);
  for(const cost of [0,.05,1])close(closed/(1+gamma*cost),1/((1+gamma*cost)/enumerated));
  budgetCases++;
}
assert.deepEqual(cachePlan(100,4,2),{verified:104,retain:102,discard:2,logical:103,pending:'correction'});assert.equal(cachePlan(100,4,4).logical,105);assert.equal(cachePlan(100,4,4).retain,104);assert.equal(cachePlan(100,4,0).retain,100);
const mask=ancestorMask([-1,0,0,1,2]);assert.deepEqual(mask[3],[true,true,false,true,false]);assert.deepEqual(mask[4],[true,false,true,false,true]);assert.throws(()=>ancestorMask([1]));
for(let i=0;i<=100;i++){const r=roundFrame(i/100);assert(r.stage>=0&&r.stage<=5);if(r.stage>=4)assert.deepEqual(r.committed,['the','blue','cat']);}assert.equal(roundFrame(1).stage,5);
for(const t of [0,.1,.5,1,2,100])for(const k of [0,1,2,4])for(const p of [.01,.5,.9,1]){const q=samplingDistribution([4,2,1,0],{temperature:t,topK:k,topP:p});close(q.reduce((s,v)=>s+v,0),1);assert(q.every(v=>v>=0));if(k)assert(q.filter(v=>v>0).length<=k);if(k===1||t===0)assert.deepEqual(q,[1,0,0,0]);}
assert.deepEqual(samplingDistribution([2,2,1],{temperature:0}),[1,0,0]);assert.deepEqual(samplingDistribution([2,1],{banned:[0]}),[0,1]);assert.throws(()=>samplingDistribution([1,2],{banned:[0,1]}));assert.throws(()=>samplingDistribution([1],{temperature:-1}));assert.throws(()=>samplingDistribution([1],{topP:0}));
// Nucleus crossing token retained. At log-probability logits this is exact.
assert.deepEqual(samplingDistribution([Math.log(.6),Math.log(.3),Math.log(.1)],{topP:.7}).map(v=>Math.round(v*3)/3),[2/3,1/3,0]);
assert.deepEqual(guidedLogits([2.1,2],[2,1],0),[2.1,2]);close(guidedLogits([2.1,2],[2,1],.5)[0],2.15);close(guidedLogits([2.1,2],[2,1],.5)[1],2.5);assert.throws(()=>guidedLogits([1],[1,2],.5));
const catalog=JSON.parse(await readFile(new URL('../prototypes/catalog.json',import.meta.url),'utf8'));const notes=[...readerMetas,...catalog.notes.filter(n=>!readerAliases.includes(n.slug)&&!reviewedNavigation[n.slug])];
for(const [meta,reader,sections] of [[speculationMeta,speculationReader,speculationSections],[decodingMeta,decodingReader,decodingSections]]){const html=reader(s=>'directions.html?slug='+s);const ids=[...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);for(const [id] of sections)assert(ids.includes(id),id);for(const [,s] of html.matchAll(/slug=([^"#]+)/g))assert(notes.some(n=>n.slug===s),s);assert(renderDenseReader(meta.slug,s=>s));}
for(const [q,meta] of [['DSpark',speculationMeta],['residual distribution',speculationMeta],['KVShare',speculationMeta],['SynthID',decodingMeta],['LoopCD',decodingMeta],['nucleus',decodingMeta]])assert(rank(notes,q).some(r=>r.note===meta),q);
assert(!notes.some(n=>n.slug==='ai/inference-serving/decoding/speculative-decoding'));
const speculationBody=speculationReader(s=>'/atlas/'+s);
const speculationNodes=flatten(parseFragment(speculationBody));
const formulas=speculationNodes.filter(n=>attr(n,'data-tex')!==undefined).map(n=>attr(n,'data-tex'));
assert.equal(formulas.length,12,'Keep stable display grouping while fixing raw notation');
for(const fragment of [String.raw`\frac{p(x)}{q(x)}`,String.raw`\frac12\sum_x`,String.raw`a_j&=\prod_{i=1}^{j}c_i`,String.raw`\dfrac{1-\alpha^{\gamma+1}}{1-\alpha}`,String.raw`\gamma+1&\alpha=1`,String.raw`S_{\rm ideal}&=\frac{\mathbb E[N]}{1+\gamma c}`])assert(formulas.some(tex=>tex.includes(fragment)),fragment);
assert(!speculationNodes.some(n=>n.tagName==='sup'),'No split raw exponent remains');
assert.equal(speculationNodes.filter(n=>n.tagName==='math').length,12);
assert(!speculationBody.includes('Original speculative-decoding reference'));
for(const phrase of ['GPU-resident metadata','Soft-label binary cross-entropy','RMS normalization','Choose a drafter by its dependencies'])assert(speculationBody.includes(phrase),phrase);
const decodingBody=decodingReader(s=>'/atlas/'+s);
const initial=samplerPresentation();const denominator=[4,2,1,0].reduce((s,z)=>s+Math.exp(z),0);
initial.probabilities.forEach((v,i)=>close(v,Math.exp([4,2,1,0][i])/denominator));
assert.equal(initial.entropy,'0.859');assert.equal(initial.support,4);assert(decodingBody.includes(initial.rows));
function flatten(n){return [n,...(n.childNodes||[]).flatMap(flatten)];}
const staticNodes=flatten(parseFragment(decodingBody));
function attr(n,k){return n.attrs?.find(a=>a.name===k)?.value;}
const text=n=>n.nodeName==='#text'?n.value:(n.childNodes||[]).map(text).join('');
for(const [name,expected] of [['data-entropy',initial.entropy],['data-support','4']]){const nodes=staticNodes.filter(n=>attr(n,name)!==undefined);assert.equal(nodes.length,1);assert.equal(text(nodes[0]),expected);}
for(const temperature of [.1,.5,1,2])for(const topK of [0,1,2,3])for(const topP of [.7,.9,1]){
  const state=samplerPresentation({temperature,topK,topP});
  const nodes=flatten(parseFragment(state.rows));const rows=nodes.filter(n=>attr(n,'class')==='probability-row');assert.equal(rows.length,4);
  assert.equal(state.entropy,entropy(state.probabilities).toFixed(3));assert.equal(state.support,state.probabilities.filter(v=>v>0).length);
  rows.forEach((r,i)=>assert.equal(text(r),'ABCD'[i]+state.probabilities[i].toFixed(3)));
  assert(!/NaN|Infinity|undefined/.test(state.rows));
}
assert(!/href="\/atlas\/(ai|systems)\//.test(decodingBody));
assert(!decodingBody.includes('Complete originals'));
for(const phrase of ['T′=|I|>0','Looped-Qwen3','key rotation','peak memory','buffer reuse'])assert(decodingBody.includes(phrase),phrase);
console.log('Speculation/decoding: exact probability accounting, joint conditionals, pending KV, tree masks, normalized transforms, guidance, anchors, links and search pass.');
console.log(`Speculative budget: ${budgetCases} complete-path enumerations, endpoint closed forms and three time-cost comparisons pass.`);
