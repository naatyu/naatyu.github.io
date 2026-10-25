import assert from 'node:assert/strict';
import {kvFootprint,pagedPrefixes,decodeSchedule,decodeRoofline,poolBalance,ttsCapacity} from '../prototypes/readers/serving-model.js';
let cases=0;
const close=(a,b)=>assert.ok(Math.abs(a-b)<=1e-11*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
for(let batch=1;batch<=16;batch++)for(const tokens of [0,1,127,128,8192])for(const heads of [1,8,32])for(const bytes of [1,2]){
 const lengths=Array(batch).fill(tokens),layers=Array.from({length:32},()=>({heads,dim:128,bytes}));
 const x=kvFootprint(lengths,layers);let reference=0;for(const n of lengths)for(const l of layers)reference+=2*n*l.heads*l.dim*l.bytes;
 assert.equal(x.bytes,reference);assert.equal(x.logicalTokens,batch*tokens);cases++;
}
assert.equal(kvFootprint([8192],Array.from({length:32},()=>({heads:8,dim:128,bytes:2}))).bytes,2**30);
for(let n=0;n<=256;n++){
 const x=kvFootprint([n,2*n],[{heads:8,dim:128,bytes:2,window:128},{heads:1,dim:128,bytes:1,copies:1}]);
 assert.equal(x.bytes,(Math.min(n,128)+Math.min(2*n,128))*4096+3*n*128);cases++;
}
// Enumerate token prefixes; a local token block with a different history must not share.
for(let length=0;length<=16;length++)for(let shared=0;shared<=length;shared++)for(const block of [1,2,4,8]){
 const a=Array.from({length},(_,i)=>i),b=a.map((v,i)=>i<shared?v:100+v);
 const req=[{namespace:'model-A',tokens:a},{namespace:'model-A',tokens:b}],before=structuredClone(req),x=pagedPrefixes(req,block);
 const sharedComplete=length===shared?Math.floor(length/block):Math.floor(shared/block);
 assert.equal(x.pages.length,2*Math.ceil(length/block)-sharedComplete);
 assert.equal(x.savedTokens,sharedComplete*block);
 for(let r=0;r<2;r++)assert.deepEqual(x.tables[r].flatMap(id=>x.pages[id].tokens),req[r].tokens);
 for(const page of x.pages){assert.equal(page.owners.length,page.id<sharedComplete?2:1);assert.ok(page.owners.length===1||page.full);}
 assert.equal(x.allocatedTokens,x.physicalTokens+x.padding);assert.deepEqual(req,before);cases++;
}
assert.equal(pagedPrefixes([{namespace:'A',tokens:[1,2,3,4]},{namespace:'B',tokens:[1,2,3,4]}],4).savedTokens,0);
assert.equal(pagedPrefixes([{namespace:'A',tokens:[1,2,3,4,5,6,7,8]},{namespace:'A',tokens:[9,2,3,4,5,6,7,8]}],4).savedTokens,0);
for(let a=1;a<=8;a++)for(let b=1;b<=8;b++)for(let c=1;c<=8;c++)for(const capacity of [1,2,3])for(const policy of ['static','continuous']){
 const req=[{arrival:0,output:a},{arrival:0,output:b},{arrival:1,output:c}],original=structuredClone(req),x=decodeSchedule(req,capacity,policy);
 const generated=Array(3).fill(0),admissions=Array(3).fill(0);
 for(const f of x.frames){assert.ok(f.running.length<=capacity);for(const id of f.running){assert.ok(f.time>=req[id].arrival);generated[id]++;}for(const id of f.admitted)admissions[id]++;for(const id of f.finished)assert.equal(generated[id],req[id].output);}
 assert.deepEqual(generated,[a,b,c]);assert.deepEqual(admissions,[1,1,1]);assert.equal(x.busySlots,a+b+c);
 if(capacity===1)assert.equal(x.steps,a+b+c);
 if(capacity===2)assert.equal(x.steps,policy==='continuous'?Math.max(a,b,Math.min(a,b)+c):Math.max(a,b)+c);
 if(capacity===3)assert.equal(x.steps,policy==='continuous'?Math.max(a,b,c+1):Math.max(a,b)+c);
 assert.deepEqual(req,original);assert.equal(new Set(x.completed.map(r=>r.id)).size,3);cases++;
}
const example=[{arrival:0,output:4},{arrival:0,output:1},{arrival:0,output:2}];
assert.equal(decodeSchedule(example,2,'static').steps,6);assert.equal(decodeSchedule(example,2,'continuous').steps,4);
for(let batch=1;batch<=256;batch++)for(const q of [.5,1,2])for(const kv of [0,2**20,2**30]){
 const P=8e9,C=200e12,W=2e12,x=decodeRoofline({batch,activeParameters:P,weightBytes:P*q,kvPerSequence:kv,flopsPerSecond:C,bytesPerSecond:W});
 close(x.criticalBatch,q*50);close(x.step,batch*kv/W+Math.max(2*batch*P/C,P*q/W));close(x.tokensPerSecond*x.step,batch);cases++;
}
for(let p=1;p<=8;p++)for(let d=1;d<=8;d++)for(const output of [1,100,1000]){
 const x=poolBalance({prefillWorkers:p,prefillSeconds:2,decodeWorkers:d,decodeStepSeconds:.05,decodeBatch:10,outputTokens:output});
 close(x.rate,Math.min(p/2,200*d/output));cases++;
}
for(let gpus=1;gpus<=8;gpus++)for(const rtf of [.05,.5,1,2])for(const memory of [0,400,24000])for(const network of [0,1,100]){
 const x=ttsCapacity({gpus,rtf,freeMemoryMB:memory,streamMemoryMB:400,networkMbps:network,audioKbps:128});
 assert.equal(x.streams,Math.min(Math.floor(gpus/rtf),Math.floor(memory/400),Math.floor(network*1000/128)));cases++;
}
assert.deepEqual(ttsCapacity({gpus:1,rtf:.05,freeMemoryMB:24000,streamMemoryMB:400,networkMbps:100,audioKbps:128}),{compute:20,memory:60,network:781,streams:20,limiters:['compute']});
for(const fn of [()=>kvFootprint([-1],[{heads:8,dim:128,bytes:2}]),()=>pagedPrefixes([{namespace:'A',tokens:[-1]}]),()=>decodeSchedule([{arrival:0,output:0}]),()=>decodeRoofline({batch:1,activeParameters:1,weightBytes:1,kvPerSequence:0,flopsPerSecond:0,bytesPerSecond:1}),()=>ttsCapacity({gpus:1,rtf:0,freeMemoryMB:100,streamMemoryMB:1,networkMbps:1,audioKbps:1})])assert.throws(fn,RangeError);
console.log(`Serving foundations: ${cases} independently checked cache, paging, scheduler, roofline, pool and TTS cases. Reader/browser integration is separate.`);
