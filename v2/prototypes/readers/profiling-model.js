// Exact bounded illustrations; no measured profiler trace is synthesized.
const finite=x=>{if(!Number.isFinite(x))throw new RangeError('finite');return x;};
const integer=(x,min=0)=>{if(!Number.isSafeInteger(x)||x<min)throw new RangeError('integer');return x;};
export function profilerPhase(step,{wait=1,warmup=2,active=3,repeat=1,skipFirst=0}={}){
 integer(step);integer(wait);integer(warmup);integer(active,1);integer(repeat);integer(skipFirst);
 const cycle=wait+warmup+active;if(!Number.isSafeInteger(cycle))throw new RangeError('cycle');
 if(step<skipFirst)return{phase:'skip',cycle:null,save:false};
 const local=step-skipFirst,c=Math.floor(local/cycle),position=local%cycle;
 if(repeat>0&&c>=repeat)return{phase:'done',cycle:null,save:false};
 if(position<wait)return{phase:'wait',cycle:c,save:false};
 if(position<wait+warmup)return{phase:'warmup',cycle:c,save:false};
 return{phase:'record',cycle:c,save:position===cycle-1};
}
export function intervalAccounting(events,start=0,end=10){
 finite(start);finite(end);if(end<start)throw new RangeError('window');
 if(!Array.isArray(events))throw new RangeError('events');
 const clipped=events.map(e=>{
  if(!Array.isArray(e)||e.length!==2)throw new RangeError('interval');
  finite(e[0]);finite(e[1]);if(e[1]<e[0])throw new RangeError('interval order');
  return[Math.max(start,e[0]),Math.min(end,e[1])];
 }).filter(([a,b])=>b>a).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
 const merged=[];let sum=0;
 for(const[a,b]of clipped){sum+=b-a;const last=merged.at(-1);if(last&&a<=last[1])last[1]=Math.max(last[1],b);else merged.push([a,b]);}
 const busy=merged.reduce((s,[a,b])=>s+b-a,0),window=end-start;
 if(![sum,busy,window].every(Number.isFinite))throw new RangeError('overflow');
 return{clipped,merged,sum,busy,idle:window-busy,window,overlap:sum-busy};
}
export function nestedSelfTime(parent,children){
 if(!Array.isArray(parent)||parent.length!==2)throw new RangeError('parent');
 const r=intervalAccounting(children,parent[0],parent[1]);
 for(const[a,b]of children)if(a<parent[0]||b>parent[1])throw new RangeError('child outside parent');
 return{total:r.window,childrenUnion:r.busy,self:r.idle};
}
export function launchTimeline({count=5,launchMS=1,kernelMS=2,synchronizeEach=false}={}){
 integer(count,1);if(count>1000)throw new RangeError('bounded count');
 finite(launchMS);finite(kernelMS);if(launchMS<0||kernelMS<=0)throw new RangeError('duration');
 if(typeof synchronizeEach!=='boolean')throw new RangeError('sync flag');
 const cpu=[],gpu=[];let host=0,device=0;
 for(let i=0;i<count;i++){
  const launchEnd=host+launchMS;cpu.push([host,launchEnd]);
  const begin=Math.max(launchEnd,device);device=begin+kernelMS;gpu.push([begin,device]);
  host=synchronizeEach?device:launchEnd;
 }
 const end=Math.max(host,device);if(!Number.isFinite(end))throw new RangeError('overflow');
 const deviceAccounting=intervalAccounting(gpu,0,end),hostAccounting=intervalAccounting(cpu,0,end);
 return{cpu,gpu,end,deviceAccounting,hostAccounting,launchMS,kernelMS,count,synchronizeEach};
}
