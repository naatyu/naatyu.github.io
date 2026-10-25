// Analytical teaching models, not a GPU benchmark or a complete serving engine.
const positive=(x,name)=>{if(!Number.isFinite(x)||x<=0)throw new RangeError(name);return x;};
const count=(x,name,zero=false)=>{if(!Number.isSafeInteger(x)||x<(zero?0:1))throw new RangeError(name);return x;};
const finiteResult=x=>{if(!Number.isFinite(x)||Math.abs(x)>Number.MAX_SAFE_INTEGER)throw new RangeError('unsafe result');return x;};

// One descriptor per distinct stored cache. Shared consumers are not counted twice.
// Local windows count resident positions, not dependencies lost by an implementation.
export function kvFootprint(lengths,layers){
 if(!Array.isArray(lengths)||!lengths.length||!Array.isArray(layers)||!layers.length)throw new RangeError('cache shape');
 lengths.forEach(x=>count(x,'tokens',true));
 const byLayer=layers.map(layer=>{
  const heads=count(layer.heads,'KV heads'),dim=count(layer.dim,'head dimension'),bytes=positive(layer.bytes,'cache bytes');
  const copies=count(layer.copies??2,'stored tensors');
  const window=layer.window===undefined?Infinity:count(layer.window,'window');
  const tokens=lengths.reduce((s,n)=>s+Math.min(n,window),0);
  return {tokens:finiteResult(tokens),perPosition:finiteResult(heads*dim*bytes*copies),bytes:finiteResult(tokens*heads*dim*bytes*copies)};
 });
 return {byLayer,bytes:finiteResult(byLayer.reduce((s,l)=>s+l.bytes,0)),logicalTokens:lengths.reduce((s,x)=>s+x,0)};
}

// Immutable full prefix blocks can share. A partial block remains private.
// The key includes the entire prefix and a model/cache namespace, not just local tokens.
export function pagedPrefixes(requests,blockSize=4){
 count(blockSize,'block size');
 if(!Array.isArray(requests)||!requests.length||requests.length>64)throw new RangeError('requests');
 const pages=[],lookup=new Map(),tables=[];
 requests.forEach((request,r)=>{
  if(typeof request.namespace!=='string'||!Array.isArray(request.tokens)||request.tokens.length>4096)throw new RangeError('request');
  request.tokens.forEach(t=>count(t,'token ID',true));
  const entries=[];
  for(let start=0;start<request.tokens.length;start+=blockSize){
   const end=Math.min(start+blockSize,request.tokens.length),tokens=request.tokens.slice(start,end),full=tokens.length===blockSize;
   const key=full?JSON.stringify([request.namespace,request.tokens.slice(0,end)]):null;
   let page=key===null?undefined:lookup.get(key);
   if(page===undefined){page=pages.length;pages.push({id:page,tokens,owners:[],full});if(key!==null)lookup.set(key,page);}
   pages[page].owners.push(r);entries.push(page);
  }
  tables.push(entries);
 });
 const logicalTokens=requests.reduce((s,r)=>s+r.tokens.length,0),physicalTokens=pages.reduce((s,p)=>s+p.tokens.length,0),allocatedTokens=pages.length*blockSize;
 return {pages,tables,logicalTokens,physicalTokens,allocatedTokens,padding:allocatedTokens-physicalTokens,savedTokens:logicalTokens-physicalTokens};
}

// Already-prefilled requests; one equal-duration decode step per token.
// A batch is admission capacity, not a prediction of latency on real hardware.
export function decodeSchedule(requests,capacity=2,policy='continuous'){
 count(capacity,'capacity');if(!['continuous','static'].includes(policy)||!Array.isArray(requests)||!requests.length||requests.length>32)throw new RangeError('schedule');
 const remaining=requests.map((r,i)=>({id:i,arrival:count(r.arrival,'arrival',true),output:count(r.output,'output'),left:r.output}));
 if(remaining.some(r=>r.output>256||r.arrival>256))throw new RangeError('bounded schedule');
 const waiting=[...remaining].sort((a,b)=>a.arrival-b.arrival||a.id-b.id),active=[],frames=[],completed=[];
 let time=0;
 while(waiting.length||active.length){
  const admitted=[];
  if(policy==='continuous'||active.length===0){while(active.length<capacity&&waiting.length&&waiting[0].arrival<=time){const r=waiting.shift();active.push(r);admitted.push(r.id);}}
  const running=active.map(r=>r.id),finished=[];
  for(const r of active){r.left--;if(r.left===0){finished.push(r.id);completed.push({id:r.id,time:time+1,arrival:r.arrival});}}
  const progress=active.map(r=>({id:r.id,generated:r.output-r.left,total:r.output}));
  for(let i=active.length-1;i>=0;i--)if(active[i].left===0)active.splice(i,1);
  frames.push({time,admitted,running,finished,progress,queued:waiting.filter(r=>r.arrival<=time).map(r=>r.id)});time++;
 }
 return {frames,completed,steps:time,tokens:requests.reduce((s,r)=>s+r.output,0),busySlots:frames.reduce((s,f)=>s+f.running.length,0),capacity,policy};
}

export function decodeRoofline({batch,activeParameters,weightBytes,kvPerSequence,flopsPerSecond,bytesPerSecond}){
 count(batch,'batch');positive(activeParameters,'active parameters');positive(weightBytes,'weight bytes');
 if(!Number.isFinite(kvPerSequence)||kvPerSequence<0)throw new RangeError('KV bytes');
 positive(flopsPerSecond,'FLOPs/s');positive(bytesPerSecond,'bytes/s');
 const compute=finiteResult(2*batch*activeParameters/flopsPerSecond),weights=finiteResult(weightBytes/bytesPerSecond),kv=finiteResult(batch*kvPerSequence/bytesPerSecond);
 const step=finiteResult(kv+Math.max(compute,weights));
 return {compute,weights,kv,step,tokensPerSecond:finiteResult(batch/step),criticalBatch:finiteResult((weightBytes/activeParameters)*(flopsPerSecond/bytesPerSecond)/2),linearRegime:compute>=weights?'compute':'weight traffic'};
}

export function poolBalance({prefillWorkers,prefillSeconds,decodeWorkers,decodeStepSeconds,decodeBatch,outputTokens}){
 count(prefillWorkers,'prefill workers');count(decodeWorkers,'decode workers');count(decodeBatch,'decode batch');
 positive(prefillSeconds,'prefill time');positive(decodeStepSeconds,'decode time');positive(outputTokens,'output tokens');
 const prefillRate=finiteResult(prefillWorkers/prefillSeconds),decodeRate=finiteResult(decodeWorkers*decodeBatch/(decodeStepSeconds*outputTokens));
 return {prefillRate,decodeRate,rate:Math.min(prefillRate,decodeRate),limiter:prefillRate<decodeRate?'prefill':prefillRate>decodeRate?'decode':'balanced'};
}

export function ttsCapacity({gpus,rtf,freeMemoryMB,streamMemoryMB,networkMbps,audioKbps}){
 count(gpus,'GPUs');positive(rtf,'RTF');positive(streamMemoryMB,'stream memory');positive(audioKbps,'audio bitrate');
 for(const x of [freeMemoryMB,networkMbps])if(!Number.isFinite(x)||x<0)throw new RangeError('resource budget');
 const compute=finiteResult(Math.floor(gpus/rtf)),memory=finiteResult(Math.floor(freeMemoryMB/streamMemoryMB)),network=finiteResult(Math.floor(networkMbps*1000/audioKbps));
 const streams=Math.min(compute,memory,network);
 return {compute,memory,network,streams,limiters:Object.entries({compute,memory,network}).filter(([,v])=>v===streams).map(([name])=>name)};
}
