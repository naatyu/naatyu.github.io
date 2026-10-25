import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {profilerPhase,intervalAccounting,nestedSelfTime,launchTimeline} from '../site/readers/profiling-model.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
let cases=0;
for(let wait=0;wait<=3;wait++)for(let warmup=0;warmup<=3;warmup++)for(let active=1;active<=4;active++)for(let repeat=1;repeat<=2;repeat++)for(let skipFirst=0;skipFirst<=2;skipFirst++){
 const expected=Array(skipFirst).fill('skip');for(let c=0;c<repeat;c++)expected.push(...Array(wait).fill('wait'),...Array(warmup).fill('warmup'),...Array(active).fill('record'));
 for(let step=0;step<expected.length+3;step++){
  const r=profilerPhase(step,{wait,warmup,active,repeat,skipFirst});assert.equal(r.phase,expected[step]||'done');
  if(r.save)assert.equal(expected[step],'record');
  if(r.cycle!==null){const last=skipFirst+(r.cycle+1)*(wait+warmup+active)-1;assert.equal(r.save,step===last);}
  cases++;
 }
}
const ints=[];for(let a=-2;a<=6;a++)for(let b=a;b<=6;b++)ints.push([a,b]);
for(const a of ints)for(const b of ints){
 const r=intervalAccounting([a,b],0,5);const counts=Array.from({length:5},(_,i)=>[a,b].filter(([s,e])=>s<=i&&e>=i+1).length);
 assert.equal(r.busy,counts.filter(x=>x>0).length);assert.equal(r.sum,counts.reduce((s,x)=>s+x,0));assert.equal(r.overlap,r.sum-r.busy);assert.equal(r.idle,5-r.busy);cases++;
}
for(let a=0;a<=8;a++)for(let b=a;b<=8;b++)for(let c=0;c<=8;c++)for(let d=c;d<=8;d++){
 const r=nestedSelfTime([0,8],[[a,b],[c,d]]);const covered=Array.from({length:8},(_,i)=>(a<=i&&b>=i+1)||(c<=i&&d>=i+1)).filter(Boolean).length;
 assert.equal(r.childrenUnion,covered);assert.equal(r.self,8-covered);assert.equal(r.total,8);cases++;
}
for(let count=1;count<=8;count++)for(let h=0;h<=40;h++)for(const kernelMS of [.5,2,5])for(const synchronizeEach of [false,true]){
 const r=launchTimeline({count,launchMS:h/10,kernelMS,synchronizeEach});
 const expected=synchronizeEach?count*(h/10+kernelMS):(h/10)+(count-1)*Math.max(h/10,kernelMS)+kernelMS;
 close(r.end,expected);close(r.deviceAccounting.busy,count*kernelMS);close(r.hostAccounting.busy,count*h/10);
 for(let i=0;i<count;i++){assert.ok(r.gpu[i][0]>=r.cpu[i][1]);if(i){assert.ok(r.gpu[i][0]>=r.gpu[i-1][1]);if(synchronizeEach)close(r.cpu[i][0],r.gpu[i-1][1]);}}
 cases++;
}
assert.deepEqual(intervalAccounting([[0,4],[2,6]],0,6).merged,[[0,6]]);
assert.equal(intervalAccounting([[0,4],[2,6]],0,6).sum,8);
assert.equal(profilerPhase(999,{wait:0,warmup:0,active:1,repeat:0}).save,true);
assert.throws(()=>intervalAccounting([[2,1]]),RangeError);assert.throws(()=>nestedSelfTime([0,3],[[0,4]]),RangeError);assert.throws(()=>launchTimeline({kernelMS:0}),RangeError);
for(const[file,hash]of [['nsys-profiler.md','84d37483f00bb1f2d1c0726d993180f7894b57e5edf046bc0be74aa31647e308'],['pytorch-profiler-and-gpu-trace-reading.md','e4ede844f53cf4fab171b42e99727c56840a233f17b5ed3e4d5a76c37412234b']])assert.equal(crypto.createHash('sha256').update(fs.readFileSync(new URL('../../docs/tooling/profiling/'+file,import.meta.url))).digest('hex'),hash);
console.log(`Profiling foundations:${cases} phase,interval,exclusive-time and asynchronous-launch cases; two original fingerprints unchanged.`);
