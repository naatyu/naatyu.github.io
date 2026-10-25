import assert from 'node:assert/strict';
import {readFileSync}from 'node:fs';
import {createHash}from 'node:crypto';
import {matmulAccounting,rooflineAccounting,layerAccounting,utilizationAccounting}from '../site/readers/performance-model.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<=1e-11*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
let cases=0;
// Independent scalar operation/traffic enumeration, rather than formula reuse.
for(let m=1;m<=7;m++)for(let k=1;k<=7;k++)for(let n=1;n<=7;n++)for(const wa of [1,2,4]){
 const actual=matmulAccounting({rows:m,inner:k,cols:n,inputBytes:2,weightBytes:wa,outputBytes:4});
 let operations=0,bytes=0;
 for(let i=0;i<m;i++)for(let j=0;j<n;j++)for(let z=0;z<k;z++)operations+=2;
 for(let i=0;i<m;i++)for(let z=0;z<k;z++)bytes+=2;
 for(let z=0;z<k;z++)for(let j=0;j<n;j++)bytes+=wa;
 for(let i=0;i<m;i++)for(let j=0;j<n;j++)bytes+=4;
 assert.equal(actual.flops,operations);assert.equal(actual.bytes,bytes);close(actual.intensity,operations/bytes);cases++;
}
for(let f=1;f<=25;f++)for(let b=1;b<=25;b++)for(const peak of [1,5,20])for(const bandwidth of [1,4,13]){
 const x=rooflineAccounting({flops:f,bytes:b,peak,bandwidth});
 assert.ok(x.idealSeconds>=f/peak&&x.idealSeconds>=b/bandwidth);
 assert.ok(x.serializedIdealSeconds>=x.idealSeconds);
 close(x.throughput,f/x.idealSeconds);close(x.throughput,Math.min(peak,bandwidth*x.intensity));
 const doubled=rooflineAccounting({flops:f*2,bytes:b*2,peak,bandwidth});
 close(doubled.idealSeconds,x.idealSeconds*2);close(doubled.throughput,x.throughput);cases++;
}
for(const h of [1,2,4])for(const kv of [1,2,4].filter(k=>h%k===0))for(const d of [1,3])for(const s of [1,2,7])for(const b of [1,2])for(const e of [1,4])for(let selected=1;selected<=e;selected++)for(const causal of [false,true])for(const remat of [false,true]){
 const width=h*d,intermediate=3*width;
 const x=layerAccounting({sequences:b,sequence:s,width,intermediate,queryHeads:h,kvHeads:kv,headWidth:d,experts:e,selected,causal,remat});
 // Independently enumerate scalar entries in four projections and expert matrices.
 let shared=0,expert=0,pairs=0;
 for(const [rows,cols]of [[width,width],[width,width],[width,kv*d],[width,kv*d]])for(let i=0;i<rows;i++)for(let j=0;j<cols;j++)shared++;
 for(const [rows,cols]of [[width,intermediate],[width,intermediate],[intermediate,width]])for(let i=0;i<rows;i++)for(let j=0;j<cols;j++)expert++;
 for(let q=0;q<s;q++)for(let k=0;k<s;k++)if(!causal||k<=q)pairs++;
 assert.equal(x.attentionParameters,shared);assert.equal(x.expertParameters,expert);assert.equal(x.activeParameters,shared+selected*expert);assert.equal(x.storedParameters,shared+e*expert);assert.equal(x.pairs,pairs);
 assert.equal(x.linearForward,2*b*s*(shared+selected*expert));assert.equal(x.quadraticForward,4*b*pairs*width);
 assert.equal(x.modelTraining,3*(x.linearForward+x.quadraticForward));assert.equal(x.executedTraining,(remat?4:3)*(x.linearForward+x.quadraticForward));cases++;
}
const badOriginal=utilizationAccounting({modelFlops:1.2e16,executedFlops:1.2e16,seconds:0.4,devices:8,peak:1e15});
close(badOriginal.mfu,3.75);assert.equal(badOriginal.consistent,false);
const fixed=utilizationAccounting({modelFlops:1.2e15,executedFlops:1.2e15,seconds:0.4,devices:8,peak:1e15});close(fixed.mfu,0.375);
const original2=utilizationAccounting({modelFlops:8.4e16,executedFlops:8.4e16,seconds:2.8,devices:64,peak:1e15});close(original2.mfu,0.46875);
const rematerialized=utilizationAccounting({modelFlops:6e12,executedFlops:8e12,seconds:1,devices:1,peak:1e13});close(rematerialized.mfu,0.6);close(rematerialized.hfu,0.8);cases+=4;
for(const f of [()=>matmulAccounting({rows:0,inner:2,cols:3}),()=>rooflineAccounting({flops:1,bytes:1,peak:0,bandwidth:1}),()=>layerAccounting({sequences:1,sequence:1,width:3,intermediate:4,queryHeads:2,kvHeads:1,headWidth:2}),()=>utilizationAccounting({modelFlops:2,executedFlops:1,seconds:1,devices:1,peak:1})])assert.throws(f,RangeError);
const originals=[
['docs/ai/training/scaling/llm-training-capacity-planning.md','87acb5c01ac949f0f351af8e6c6005880e0208dfaa8f575470267b9aa27bf5b2'],
['docs/ai/training/scaling/transformer-performance-accounting.md','ddc5b6340eda38c0dece60b330745f7bf0a506bf958d6521c0d264d1eb41193f'],
['docs/systems/performance/latency-vs-throughput.md','bf5ffbb9b97902b776659082637fcf922610be4927bfc9bd2559fa477b4c2f7e'],
['docs/systems/performance/model-flops-utilization-mfu.md','7318ea74c8c69058276e54fcdad41f851122f5611959961889239571bb31391f'],
['docs/systems/performance/performance-vs-scalability.md','09cf78c437e60610da888a8ecebe077e8edc88df2d4120d41456d709e3cbd90d'],
['docs/systems/performance/roofline-model.md','c80162938e6bea0661ec041dbc38b5870f2cee00d9a8dd5a126f04413a70d461']];
for(const [path,hash]of originals)assert.equal(createHash('sha256').update(readFileSync(new URL('../../'+path,import.meta.url))).digest('hex'),hash);
console.log(`Performance foundations:${cases} independent arithmetic, traffic, layer and utilization cases; six originals unchanged. Reader integration checked separately.`);
