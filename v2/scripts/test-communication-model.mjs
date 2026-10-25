import assert from 'node:assert/strict';
import {readFileSync}from 'node:fs';
import {createHash}from 'node:crypto';
import {directAllReduceTrace,ringAllReduceTrace,communicationVolume,creditQueue,queueAction,exchangeState,exchangeAction,ungatedDoubleBufferTrace}from '../site/readers/communication-model.js';
let cases=0;
const close=(a,b)=>assert.ok(Math.abs(a-b)<=1e-11*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
for(let ranks=2;ranks<=8;ranks++)for(let size=1;size<=5;size++)for(const sign of [-1,0,1]){
 const inputs=Array.from({length:ranks},(_,rank)=>Array.from({length:ranks*size},(_,j)=>sign*(rank*17+j-12)));
 const original=structuredClone(inputs),reference=Array.from({length:ranks*size},(_,j)=>{let total=0;for(let r=0;r<ranks;r++)total+=inputs[r][j];return total;});
 for(const shots of [1,2])for(const mode of ['push','pull']){
  const trace=directAllReduceTrace(inputs,{shots,mode});assert.deepEqual(trace.result,reference);assert.deepEqual(trace.frames.at(-1).outputs,Array.from({length:ranks},()=>reference));
  let elements=0;
  for(const frame of trace.frames)for(const t of frame.transfers){assert.notEqual(t.source,t.destination);assert.equal(t.actor,mode==='push'?t.source:t.destination);elements+=t.values.length;}
  assert.equal(elements,shots===1?ranks*(ranks-1)*inputs[0].length:2*(ranks-1)*inputs[0].length);cases++;
 }
 const ring=ringAllReduceTrace(inputs),scatter=ring.frames[ranks-1];
 assert.equal(ring.frames.length,2*ranks-1);assert.equal(ring.transferRounds,2*(ranks-1));
 for(let rank=0;rank<ranks;rank++){
  const owner=ring.owners[rank];assert.deepEqual(scatter.blocks[rank][owner].values,reference.slice(owner*size,(owner+1)*size));
  assert.deepEqual(scatter.blocks[rank][owner].contributors,Array.from({length:ranks},(_,i)=>i));
  assert.deepEqual(ring.frames.at(-1).blocks[rank].flatMap(b=>b.values),reference);
 }
 for(const frame of ring.frames)for(let rank=0;rank<ranks;rank++)for(let block=0;block<ranks;block++){
  const cell=frame.blocks[rank][block];assert.equal(new Set(cell.contributors).size,cell.contributors.length);
  for(let j=0;j<size;j++){let total=0;for(const contributor of cell.contributors)total+=inputs[contributor][block*size+j];close(cell.values[j],total);}
 }
 assert.deepEqual(inputs,original);cases++;
}
for(let ranks=2;ranks<=64;ranks++)for(const messageBytes of [128,4096,1<<20])for(const iterationBytes of [64,128])for(const sync of ['ll','sentinel','atomic']){
 const x=communicationVolume({ranks,messageBytes,iterationBytes,sync});let one=0,two=0;
 for(let source=0;source<ranks;source++)for(let dest=0;dest<ranks;dest++)if(source!==dest){one+=messageBytes;two+=2*messageBytes/ranks;}
 // Count per-rank incoming regions independently; embedded LL flags double
 // representation bytes. Atomic scratch is a partition-size approximation.
 const flagBytes=sync==='ll'?iterationBytes:0;let oneScratch=0;
 for(let region=0;region<ranks;region++)oneScratch+=iterationBytes+flagBytes;
 if(x.oneShot){close(x.oneShot.payload,one/ranks);close(x.oneShot.wire,x.oneShot.payload*(sync==='ll'?2:1));close(x.oneShot.scratchPerEpoch,oneScratch);}
 close(x.twoShot.scratchPerEpoch,sync==='atomic'?iterationBytes/ranks:iterationBytes+flagBytes);
 assert.equal(x.atomicApproximate,sync==='atomic');
 close(x.twoShot.payload,two/ranks);close(x.twoShot.wire,x.twoShot.payload*(sync==='ll'?2:1));cases++;
}
// Exhaust every reachable abstract queue state, including failed operations.
for(const capacity of [1,2,8]){
 const pending=[creditQueue(capacity)],seen=new Set();
 while(pending.length){const s=pending.pop(),key=JSON.stringify(s);if(seen.has(key))continue;seen.add(key);
  assert.ok(s.produced>=s.consumed&&s.produced-s.consumed<=capacity);
  assert.equal(s.slots.filter(x=>x!==null).length,s.produced-s.consumed);
  for(const action of ['produce','consume']){const out=queueAction(s,action);assert.equal(out.allowed,action==='produce'?s.produced-s.consumed<capacity:s.produced>s.consumed);if(out.allowed&&out.state.produced<=10)pending.push(out.state);cases++;}
 }
}
// All reachable two-peer interleavings through four epochs. A fast peer can
// send e+1 early, but cannot send e+2 until receiving e+1 from its peer.
const pending=[exchangeState()],seen=new Set();
while(pending.length){const s=pending.pop(),key=JSON.stringify(s);if(seen.has(key))continue;seen.add(key);
 for(let rank=0;rank<2;rank++)for(const action of ['send','consume']){
  const out=exchangeAction(s,rank,action);assert.equal(out.overwrite,false);
  if(out.allowed){assert.deepEqual(out.state.peers[rank].received,Array.from({length:out.state.peers[rank].epoch},(_,i)=>i));if(out.state.peers.every(p=>p.epoch<=4))pending.push(out.state);}
  cases++;
 }
}
assert.equal(ungatedDoubleBufferTrace().at(-1).overwritten,0);
for(const fn of [()=>directAllReduceTrace([[1],[2]]),()=>communicationVolume({ranks:1,messageBytes:128}),()=>communicationVolume({ranks:2,messageBytes:128,iterationBytes:256}),()=>creditQueue(0),()=>exchangeAction(exchangeState(),2,'send')])assert.throws(fn,RangeError);
for(const [path,hash]of [
 ['docs/systems/parallel-computing/low-latency-gpu-collectives.md','43bfb8254040ac5c4185c25db0f240dec7c461ec64a237d092615daabb264976'],
 ['docs/systems/parallel-computing/nccl-internals-protocols-algorithms-and-transports.md','b19e2013b8c883785481c2bd712967814595ab7236c5da1e39c0a3de780c272b']
])assert.equal(createHash('sha256').update(readFileSync(new URL('../../'+path,import.meta.url))).digest('hex'),hash);
console.log(`Communication foundations: ${cases} independently checked trace, volume and exhaustive credit/interleaving cases; two original fingerprints unchanged. No CUDA ordering or performance certification.`);
