// Conceptual, sequentially consistent state models. Not a CUDA memory-order proof
// or an NCCL performance simulator. Transfers omit flags and transport overhead.
const integer=(x,min,max,name)=>{if(!Number.isInteger(x)||x<min||x>max)throw new RangeError(name);return x;};
const positive=(x,name)=>{if(!Number.isFinite(x)||x<=0)throw new RangeError(name);return x;};
const copy=x=>structuredClone(x),mod=(x,n)=>(x%n+n)%n;
function validate(inputs){
 if(!Array.isArray(inputs))throw new RangeError('inputs');
 const ranks=integer(inputs.length,2,32,'ranks'),width=integer(inputs[0]?.length,1,1024,'width');
 if(width%ranks||!inputs.every(row=>Array.isArray(row)&&row.length===width&&row.every(Number.isFinite)))throw new RangeError('equal finite vectors, divisible by ranks');
 return {ranks,width,chunk:width/ranks};
}
const sumVectors=rows=>rows[0].map((_,j)=>rows.reduce((s,row)=>s+row[j],0));
export function directAllReduceTrace(inputs,{shots=1,mode='push'}={}){
 const {ranks,width,chunk}=validate(inputs);
 if(![1,2].includes(shots)||!['push','pull'].includes(mode))throw new RangeError('shots or mode');
 const frames=[],initial=copy(inputs),result=sumVectors(inputs);
 const snapshot=(phase,transfers,partials,outputs)=>frames.push({phase,mode,transfers:copy(transfers),partials:copy(partials),outputs:copy(outputs)});
 snapshot('Local inputs',[],inputs,Array(ranks).fill(null));
 if(shots===1){
  const transfers=[];
  for(let source=0;source<ranks;source++)for(let destination=0;destination<ranks;destination++)if(source!==destination)transfers.push({source,destination,actor:mode==='push'?source:destination,offset:0,values:copy(inputs[source])});
  snapshot(mode==='push'?'Peer stores into incoming scratch':'Receivers load peer inputs',transfers,inputs,Array(ranks).fill(null));
  snapshot('Every rank reduces the complete contributions',[],Array(ranks).fill(null),Array.from({length:ranks},()=>copy(result)));
 }else{
  const transfers=[];
  for(let owner=0;owner<ranks;owner++)for(let source=0;source<ranks;source++)if(source!==owner)transfers.push({source,destination:owner,actor:mode==='push'?source:owner,offset:owner*chunk,values:inputs[source].slice(owner*chunk,(owner+1)*chunk)});
  const shards=Array.from({length:ranks},(_,owner)=>result.slice(owner*chunk,(owner+1)*chunk));
  snapshot('Reduce-scatter: each owner receives its partition',transfers,null,Array(ranks).fill(null));
  snapshot('Each owner reduces one partition',[],shards,shards);
  const gathered=[];
  for(let source=0;source<ranks;source++)for(let destination=0;destination<ranks;destination++)if(source!==destination)gathered.push({source,destination,actor:mode==='push'?source:destination,offset:source*chunk,values:copy(shards[source])});
  snapshot('All-gather: distribute the reduced partitions',gathered,shards,Array.from({length:ranks},()=>copy(result)));
 }
 return {ranks,width,chunk,shots,mode,inputs:initial,result,frames};
}
export function ringAllReduceTrace(inputs){
 const {ranks,width,chunk}=validate(inputs),frames=[];
 const blocks=inputs.map((row,rank)=>Array.from({length:ranks},(_,block)=>({values:row.slice(block*chunk,(block+1)*chunk),contributors:[rank]})));
 const snapshot=(phase,round,transfers)=>frames.push({phase,round,transfers:copy(transfers),blocks:copy(blocks)});
 snapshot('Local input partitions',0,[]);
 for(let step=0;step<ranks-1;step++){
  const transfers=Array.from({length:ranks},(_,source)=>{const block=mod(source-step,ranks);return {source,destination:(source+1)%ranks,block,...copy(blocks[source][block])};});
  for(const t of transfers){const local=blocks[t.destination][t.block];local.values=local.values.map((v,j)=>v+t.values[j]);local.contributors=[...t.contributors,...local.contributors].sort((a,b)=>a-b);}
  snapshot('Reduce-scatter',step+1,transfers);
 }
 const owners=Array.from({length:ranks},(_,rank)=>(rank+1)%ranks);
 for(let step=0;step<ranks-1;step++){
  const transfers=Array.from({length:ranks},(_,source)=>{const block=mod(source+1-step,ranks);return {source,destination:(source+1)%ranks,block,...copy(blocks[source][block])};});
  for(const t of transfers)blocks[t.destination][t.block]={values:copy(t.values),contributors:copy(t.contributors)};
  snapshot('All-gather',step+1,transfers);
 }
 return {ranks,width,chunk,inputs:copy(inputs),owners,result:sumVectors(inputs),frames,transferRounds:2*(ranks-1)};
}
export function communicationVolume({ranks,messageBytes,iterationBytes=messageBytes,sync='sentinel'}){
 integer(ranks,2,4096,'ranks');positive(messageBytes,'messageBytes');positive(iterationBytes,'iterationBytes');
 if(iterationBytes>messageBytes||!['ll','sentinel','atomic'].includes(sync))throw new RangeError('iteration or sync');
 const flagFactor=sync==='ll'?2:1,onePayload=(ranks-1)*messageBytes,twoPayload=2*(ranks-1)*messageBytes/ranks;
 return {ranks,messageBytes,iterationBytes,sync,oneShot:sync==='atomic'?null:{phases:1,payload:onePayload,wire:flagFactor*onePayload,scratchPerEpoch:flagFactor*ranks*iterationBytes},twoShot:{phases:2,payload:twoPayload,wire:flagFactor*twoPayload,scratchPerEpoch:sync==='atomic'?iterationBytes/ranks:flagFactor*iterationBytes},atomicApproximate:sync==='atomic'};
}
export function creditQueue(capacity=8){integer(capacity,1,64,'capacity');return {capacity,produced:0,consumed:0,slots:Array(capacity).fill(null)};}
export function queueAction(state,action){
 if(!['produce','consume'].includes(action))throw new RangeError('action');
 const next=copy(state),occupied=state.produced-state.consumed;
 const allowed=action==='produce'?occupied<state.capacity:occupied>0;
 if(!allowed)return {allowed:false,state:next,epoch:null,slot:null};
 const epoch=action==='produce'?state.produced:state.consumed,slot=epoch%state.capacity;
 if(action==='produce'){if(next.slots[slot]!==null)throw new Error('overwrite');next.slots[slot]=epoch;next.produced++;}
 else{if(next.slots[slot]!==epoch)throw new Error('wrong epoch');next.slots[slot]=null;next.consumed++;}
 return {allowed:true,state:next,epoch,slot};
}
// Two peers send epoch e, then consume the peer's epoch e before advancing.
// Arrival of peer epoch e+1 proves that peer consumed local epoch e.
export function exchangeState(){return {peers:[{epoch:0,sent:false,received:[]},{epoch:0,sent:false,received:[]}],buffers:[[null,null],[null,null]],events:0};}
export function exchangeAction(state,rank,action){
 integer(rank,0,1,'rank');if(!['send','consume'].includes(action))throw new RangeError('action');
 const next=copy(state),self=next.peers[rank],other=1-rank,epoch=self.epoch,slot=epoch%2;
 const allowed=action==='send'?!self.sent:self.sent&&next.buffers[rank][slot]===epoch;
 if(!allowed)return {allowed:false,state:next,epoch,slot,overwrite:false};
 let overwrite=false;
 if(action==='send'){overwrite=next.buffers[other][slot]!==null;next.buffers[other][slot]=epoch;self.sent=true;}
 else{next.buffers[rank][slot]=null;self.received.push(epoch);self.epoch++;self.sent=false;}
 next.events++;
 return {allowed:true,state:next,epoch,slot,overwrite};
}
// Counterexample to "two buffers alone are safe": an ungated producer writes
// epochs 0,1,2 into one delayed consumer's two slots, overwriting unread epoch0.
export function ungatedDoubleBufferTrace(){const slots=[null,null],frames=[];for(let epoch=0;epoch<3;epoch++){const slot=epoch%2,overwritten=slots[slot];slots[slot]=epoch;frames.push({epoch,slot,overwritten,slots:[...slots]});}return frames;}
