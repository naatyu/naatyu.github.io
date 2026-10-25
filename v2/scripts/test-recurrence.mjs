import assert from 'node:assert/strict';
import './test-recurrence-notation.mjs';
import {readFile} from 'node:fs/promises';
import {lstmCell,unroll,exitProfiles,exitDistribution,scaling,mixResidual,passCompute,feedbackInputs,timingFrames} from '../prototypes/readers/recurrence-model.js';
import {recurrenceReader,recurrenceMeta,recurrenceSections} from '../prototypes/readers/recurrence.js';
import {readerMetas,renderDenseReader} from '../prototypes/readers/index.js';
import {rank} from '../prototypes/search.js';
const near=(a,b,e=1e-10)=>assert(Math.abs(a-b)<e,`${a} != ${b}`);
for(let i=0;i<=20;i++){const f=i/20,c=lstmCell(3,f,.5,1,.8);near(c.cell,3*f+.5);near(c.hidden,.8*Math.tanh(c.cell));near(c.directDerivative,f);const derivative=(lstmCell(3+1e-5,f,.5,1,.8).cell-lstmCell(3-1e-5,f,.5,1,.8).cell)/2e-5;near(derivative,f,1e-9);}
for(let k=1;k<=8;k++)for(let r=1;r<=8;r++){const fs=unroll(k,r);assert.equal(fs.length,k*r+1);assert(fs.at(-1).complete);assert.equal(fs.at(-1).visited.length,k*r);for(let i=0;i<k*r;i++){assert.equal(fs[i].block,i%k+1);assert.equal(fs[i].round,Math.floor(i/k)+1);assert.equal(fs[i].stored,k);assert.equal(fs[i].visited.length,i);}}
for(const hazards of Object.values(exitProfiles))for(let i=0;i<=20;i++){const q=i/20,f=exitDistribution(hazards,q);near(f.rows.reduce((s,r)=>s+r.mass,0),1);assert(f.rows.every(r=>r.mass>=0));assert(f.expected>=1&&f.expected<=4);assert(f.kl>=-1e-10);assert(f.rows[f.selected-1].cdf>=q);if(f.selected>1)assert(f.rows[f.selected-2].cdf<q);}
const uniform=exitDistribution(exitProfiles.uniform);uniform.rows.forEach(r=>near(r.mass,.25));near(uniform.expected,2.5);near(uniform.kl,0);assert.equal(uniform.selected,2);assert.equal(exitDistribution([0,0,0,0],1).selected,4);assert.equal(exitDistribution([1,0,0,0],1).selected,1);
for(let k=1;k<=32;k++)for(let r=1;r<=32;r++){near(scaling(k,r,.25).bound,r/2);near(scaling(k,r,.5).bound,1/(8*k));near(scaling(k,r,.25,false).bound,.5);}
for(let i=0;i<=10;i++)for(const addition of [false,true]){const a=i/20,b=addition?1:1-a,m=mixResidual([1,0],[-4,3],a,b);near(Math.hypot(...m.source),1);near(m.mixed[0],b-.8*a);near(m.mixed[1],.6*a);if(!addition)assert(m.mixedNorm<=1+1e-10);}
assert.deepEqual(mixResidual([1,2],[0,0],.1,.9).mixed,[.9,1.8]);assert.deepEqual(mixResidual([0,0],[3,4],.1,.9).mixed,[0,0]);near(passCompute([.75,.22,.03]),1.28);
const e=[[1,2],[3,4],[5,6]],h=[[7,8],[9,10],[11,12]],f=feedbackInputs(e,h);assert.deepEqual(f[0],e[0]);near(f[1][0],7/(1+Math.exp(-3)));near(f[2][1],10/(1+Math.exp(-6)));const future=feedbackInputs(e,[h[0],h[1],[999,999]]);assert.deepEqual(f,future);assert.deepEqual(feedbackInputs(e,h,3),e);
assert.equal(timingFrames.length,9);for(const kind of ['loop','feedback','recirculation'])assert.deepEqual(timingFrames.filter(f=>f.kind===kind).map(f=>f.active),[0,1,2]);
for(const fn of [()=>lstmCell(1,2,0,0,0),()=>lstmCell(1,0,0,2,0),()=>unroll(0,2),()=>exitDistribution([]),()=>exitDistribution([.2],2),()=>scaling(1,1,.1),()=>mixResidual([1],[1,2],1,1),()=>mixResidual([1],[1],1,1,0),()=>passCompute([.5,.2]),()=>feedbackInputs(e,h,0)])assert.throws(fn);
const html=recurrenceReader(s=>'directions.html?slug='+s),ids=[...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);for(const [id]of recurrenceSections)assert(ids.includes(id));assert.equal(recurrenceMeta.date,'2026-05-07');assert(recurrenceMeta.prototype);assert(!html.includes('undefined'));
const catalog=JSON.parse(await readFile(new URL('../prototypes/catalog.json',import.meta.url),'utf8')),notes=[...readerMetas,...catalog.notes];for(const [,s,anchor]of html.matchAll(/href="directions\.html\?slug=([^"#]+)(?:#([^"]+))?"/g)){assert(notes.some(n=>n.slug===s),s);if(anchor)assert(renderDenseReader(s,s=>'directions.html?slug='+s)?.includes(`id="${anchor}"`));}for(const q of ['DeepLoop','Ouro','LSTM','Recirculation','Full-Bandwidth','LoopMoE'])assert(rank(notes,q).some(r=>r.note===recurrenceMeta),q);
console.log('Recurrence: 21 cell/derivative cases, 64 unrolls, 63 halting states, 3,072 scaling identities, mixing/zero norms, shifted feedback causality, timing, domains, anchors, routes and search pass.');
await import('./test-recurrence-preservation.mjs');
await import('./test-recirculation-reference.mjs');
await import('./test-feedback-reference.mjs');
if(process.env.ATLAS_TORCH_PYTHON) await import('./test-recurrence-tensors.mjs');
import './test-nanbeige-geometry.mjs';
