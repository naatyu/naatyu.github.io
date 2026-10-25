import assert from 'node:assert/strict';
import './test-practice-core-closure.mjs';
import './test-budget-notation.mjs';
import {readFile} from 'node:fs/promises';
import {runBudget,efficiency,contextCost,recoveryTrace,checkpointOverhead,elasticWork} from '../site/readers/practice-model.js';
import {practiceMeta,practiceReader,practiceSections} from '../site/readers/practice.js';
import {readerMetas,renderDenseReader} from '../site/readers/index.js';
import {rank} from '../site/search.js';
const near=(a,b)=>assert(Math.abs(a-b)<=1e-11*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
let budgets=0;
for(let rate=100;rate<=400;rate+=10)for(const p of [3,7,13])for(let good=50;good<=100;good+=5){const b=runBudget({rate,parameters:p,goodput:good/100});near(b.compute,256*rate*1e12*90*86400*.75*good/100);near(b.tokens*6*p*1e9,b.compute);near(b.ratio,b.tokens/(p*1e9));budgets++;}
near(runBudget().compute,2.6873856e23);near(runBudget().tokens/1e12,6.398537142857143);
for(let q=90;q<=100;q++)for(const m of [8,16]){const c=contextCost(q/100,m);near(c.staged,1+.1*((q/100)+(1-q/100)*m));assert(c.short<=c.staged+1e-12);assert(c.staged<=c.long+1e-12);near(c.saving,1-c.staged/c.long);}
for(let cost=1;cost<=20;cost++)for(let gain=1;gain<=30;gain++){const equivalent=cost*gain/10,loss=1+1/Math.sqrt(equivalent),e=efficiency(loss,cost);near(e.baseline,equivalent);near(e.gain,gain/10);near(e.saving,1-10/gain);}
const truth=[];let w=0,m=0,rng=1;truth.push({step:0,cursor:0,rng,m,w});for(let step=1;step<=6;step++){rng=(5*rng+1)%16;m=2*m+step+rng;w+=m;truth.push({step,cursor:step,rng,m,w});}
for(const p of ['full','moments','loader']){const t=recoveryTrace(p);assert.equal(t.frames.length,11);assert.deepEqual(t.reference,truth[6]);assert.equal(t.correct,p==='full');assert.equal(t.frames[6].step,3);assert.equal(t.frames[6].w,truth[3].w);assert.equal(t.frames[10].executed,8);assert.equal(t.frames[10].durable,6);for(let i=0;i<=5;i++)for(const k of ['step','cursor','rng','m','w'])assert.equal(t.frames[i][k],truth[i][k]);if(p==='full')for(let i=7;i<=9;i++)for(const k of ['step','cursor','rng','m','w'])assert.equal(t.frames[i][k],truth[i-3][k]);}
assert.deepEqual(truth[6],{step:6,cursor:6,rng:11,m:715,w:1350});
for(const c of [0,1,30,90])for(const mtbf of [600,3600,21600])for(const interval of [60,300,1200,3600]){const h=checkpointOverhead(interval,c,mtbf);near(h.total,c/interval+interval/(2*mtbf));near(h.optimum*h.optimum,2*c*mtbf);if(c>0){const best=checkpointOverhead(h.optimum,c,mtbf);assert(best.total<=h.total+1e-12);near(best.checkpoint,best.replay);}}
for(let d=0;d<=900;d+=10)for(let f=0;f<=100;f+=5){const e=elasticWork(600,d,f/100);near(e.useful,Math.max(0,600-d)*f/100);near(e.lost+e.useful,600);}
for(const f of [()=>runBudget({gpus:1.5}),()=>runBudget({goodput:0}),()=>runBudget({rate:Infinity}),()=>efficiency(1,4),()=>efficiency(NaN,4),()=>contextCost(-1),()=>contextCost(.5,0),()=>recoveryTrace('weights'),()=>checkpointOverhead(0,1,10),()=>elasticWork(600,20,2)])assert.throws(f);
const html=practiceReader(s=>'directions.html?slug='+s),ids=[...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);for(const[id]of practiceSections)assert(ids.includes(id));assert.equal(practiceSections.length,36);assert.equal(practiceMeta.date,'2026-06-02');assert.equal(practiceMeta.prototype,false);assert.equal(practiceMeta.visibility,'public');assert(html.includes('m=715'));assert(html.includes('1.115'));assert(!html.includes('>undefined<'));
const catalog=JSON.parse(await readFile(new URL('../site/catalog.json',import.meta.url),'utf8')),notes=[...readerMetas,...catalog.notes];for(const[,s,anchor]of html.matchAll(/href="directions\.html\?slug=([^"#]+)(?:#([^"]+))?"/g)){assert(notes.some(n=>n.slug===s),s);if(anchor)assert(renderDenseReader(s,x=>'directions.html?slug='+x)?.includes(`id="${anchor}"`),`${s}#${anchor}`);}
for(const q of ['pretraining','goodput','scaling ladder','context extension','run design'])assert(rank(notes,q).some(r=>r.note===practiceMeta),q);
const framework=html.split('id="framework"')[1].split('id="rehearsal"')[0];
for(const detail of ['optimizer update','MoE, context parallelism and custom numerics','maintenance and recovery','community support','implementation time, debugging effort, instability and runtime cost','metaphor, not a measured dimensional throughput equation'])assert(framework.includes(detail),detail);
console.log(`Practice: ${budgets} budgets, 22 context allocations, 600 inverses, 33 recovery events, 48 checkpoint intervals, 1,911 elastic scenarios; sections, links, lineage and search pass.`);
