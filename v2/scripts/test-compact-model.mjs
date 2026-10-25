import assert from 'node:assert/strict';
import {embeddingBudget,loopInventory,competencePenalty,wsdStages,agentCurriculum,behaviorResults,globalCacheRatio} from '../prototypes/readers/compact-model.js';
let cases=0;
for(const v of [32000,64000,166144,262144])for(const w of [1024,2048,3072])for(const tied of [false,true]){const a=embeddingBudget(v,w,tied);assert.equal(a.total,3e9+v*w*(tied?1:2));assert.equal(a.input,v*w);assert.equal(a.output,tied?0:v*w);assert(Math.abs(a.fraction+a.body/a.total-1)<1e-12);cases++;}
assert.equal(embeddingBudget().total,4020788736);
for(const n of [1,32768,65536,262144])for(let p=1;p<=4;p++)for(const s of [true,false])for(let step=0;step<=22*p;step++){const a=loopInventory(n,p,s,step);assert.equal(a.cache,90112*n*(s?1:p));assert.equal(a.visited.length,step);assert.equal(a.applications,22*p);for(const[i,x]of a.visited.entries()){assert.equal(x.block,1+i%22);assert.equal(x.round,1+Math.floor(i/22));}assert.equal(a.complete,step===22*p);cases++;}
for(let length=0;length<=5000;length+=100)for(let pass=0;pass<=10;pass++){const r=competencePenalty(length,1000,4000,pass/10,2);assert.equal(r.penalty,2*pass/10*Math.max(0,Math.min(1,(length-1000)/3000)));assert.equal(competencePenalty(length,1000,4000,pass/10,2,false).penalty,0);cases++;}
assert.equal(wsdStages.reduce((s,x)=>s+x[1],0),23);for(const r of agentCurriculum)assert(Math.abs(r.reasoning+r.general+r.agent-100)<1e-10);assert(behaviorResults[2][1]>behaviorResults[0][1]);assert(behaviorResults[2][3]<behaviorResults[0][3]);assert.equal(globalCacheRatio().saved,.375);
for(const f of [()=>embeddingBudget(0),()=>loopInventory(0),()=>loopInventory(10,2,false,45),()=>competencePenalty(2,2,2),()=>competencePenalty(2,0,4,2),()=>globalCacheRatio(-1)])assert.throws(f,RangeError);
console.log(`Compact recipes: ${cases} embedding, loop/cache and bounded reward cases; curriculum/schedule and measured behavior identities pass.`);
