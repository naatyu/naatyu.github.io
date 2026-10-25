import assert from 'node:assert/strict';
import {dialog,targetStream,lowRank,adapterBudget,invariantScale,newToken} from '../prototypes/readers/sft-model.js';
let cases=0;
for(const p of ['assistant','final','all'])for(const b of ['none','end','both'])for(let i=0;i<dialog.length;i++){const s=targetStream(p,b,i);assert.equal(s.current.i,i);assert(s.targets.every(t=>t.i>0&&t.role!=='pad'));for(const t of s.targets){assert.equal(t.predictor+1,t.i);if(p!=='all')assert.equal(t.role,'assistant');if(p==='final')assert(t.i>=12);if(b==='none')assert.equal(t.kind,'body');}assert.equal(s.count,s.targets.length);assert(Math.abs(s.sum-s.targets.reduce((v,t)=>v+Math.log(1/t.p),0))<1e-12);cases++;}
assert.deepEqual(targetStream('assistant','end').targets.map(t=>t.i),[7,8,13,14,15]);assert.deepEqual(targetStream('final','none').targets.map(t=>t.i),[13,14]);
for(let r=1;r<=3;r++)for(const a of [0,1,2,8,32])for(let phase=0;phase<4;phase++){const m=lowRank(r,a,phase);for(let i=0;i<4;i++){let v=0;for(let j=0;j<3;j++)v+=(m.W[i][j]+m.update[i][j])*m.x[j];assert(Math.abs(v-m.output[i])<1e-12);}assert.equal(m.trainable,7*r);cases++;}
for(const n of [16,128,1024,4096])for(const r of [1,4,16,64,128]){const b=adapterBudget(n,r);assert.equal(b.adapter,2*n*r);assert(Math.abs(b.ratio-(2/3+2*r/n))<1e-12);assert.equal(b.adapterOps<b.fullOps,r<n/6);cases++;}
for(const p of [.25,1,2,4])for(const q of [.25,1,2,4]){const z=invariantScale(32,.02,.001,.003,p,q);assert(Math.abs(z.alpha*z.init*z.lrB-z.initial)<1e-12);assert.equal(z.init/z.lrA,z.timescale);cases++;}
for(let h=-20;h<=20;h++){const t=newToken(undefined,undefined,[h/10,.5]);assert.deepEqual(t.embedding,[.5,1]);assert(Math.abs(t.retained+t.newProbability-1)<1e-12);assert(t.oldKL>=0);cases++;}
assert.equal(newToken([[2,4]]).embedding[0],2);for(const f of [()=>targetStream('bad'),()=>targetStream('all','end',18),()=>lowRank(0),()=>adapterBudget(0),()=>invariantScale(1,1,1,1,0,1),()=>newToken([])])assert.throws(f,RangeError);
console.log(`SFT foundation: ${cases} shifted target, exact factorization, matrix budget, scaling and new-token normalization cases pass.`);
