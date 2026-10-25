// Synthetic schedules and probability/resource accounting, not a database protocol.
const probability=p=>{if(!Number.isFinite(p)||p<0||p>1)throw new RangeError('probability');return p;};
const count=(n,max=8)=>{if(!Number.isSafeInteger(n)||n<1||n>max)throw new RangeError('count');return n;};
export function quorumSets(n,r,w){
 count(n);count(r,n);count(w,n);
 const members=mask=>Array.from({length:n},(_,i)=>i).filter(i=>mask&(1<<i)),reads=[],writes=[];
 for(let mask=0;mask<(1<<n);mask++){const set=members(mask);if(set.length===r)reads.push(set);if(set.length===w)writes.push(set);}
 let min=n,max=0;
 for(const a of reads)for(const b of writes){const size=a.filter(x=>b.includes(x)).length;min=Math.min(min,size);max=Math.max(max,size);}
 return {reads,writes,minOverlap:min,maxOverlap:max,guaranteedOverlap:r+w>n,writeOverlap:2*w>n};
}
export function partitionStory(policy='cp'){
 if(!['cp','ap'].includes(policy))throw new RangeError('policy');
 return [
  {stage:0,values:[0,0,0],partition:false,event:'All replicas agree on value 0.',read:null,blocked:false,ack:false},
  {stage:1,values:[0,0,0],partition:true,event:'A/B cannot exchange messages with C.',read:null,blocked:false,ack:false},
  {stage:2,values:[1,1,0],partition:true,event:'A/B complete write 1. C has not received the update.',read:null,blocked:false,ack:true},
  {stage:3,values:[1,1,0],partition:true,event:policy==='cp'?'C refuses this read because it cannot establish the committed value.':'C returns local value 0 after write 1 completed elsewhere.',read:policy==='cp'?null:0,blocked:policy==='cp',ack:true},
  {stage:4,values:[1,1,1],partition:false,event:'Communication recovers; the chosen update reaches C.',read:null,blocked:false,ack:true},
  {stage:5,values:[1,1,1],partition:false,event:'A new read at C returns 1.',read:1,blocked:false,ack:true}
 ];
}
export function availabilityBudget(components,common=1){
 if(!Array.isArray(components)||!components.length||components.length>16)throw new RangeError('components');
 components.forEach(probability);probability(common);
 return {series:common*components.reduce((a,p)=>a*p,1),parallel:common*(1-components.reduce((a,p)=>a*(1-p),1))};
}
export function downtime(availability){
 probability(availability);return {yearSeconds:(1-availability)*365*86400,monthSeconds:(1-availability)*30*86400};
}
export function workerBudget({dailyJobs,serviceSeconds,utilization=1}){
 for(const n of [dailyJobs,serviceSeconds,utilization])if(!Number.isFinite(n)||n<=0)throw new RangeError('positive budget');
 if(utilization>1)throw new RangeError('utilization');
 const arrival=dailyJobs/86400,inService=dailyJobs*serviceSeconds/86400;
 // Ceiling uses the declared decimal inputs exactly, not rounded float divisions.
 const ratio=x=>{const[m,e='0']=String(x).toLowerCase().split('e'),places=(m.split('.')[1]||'').length-Number(e),digits=BigInt(m.replace('.',''));return places>=0?[digits,10n**BigInt(places)]:[digits*10n**BigInt(-places),1n];};
 const[a,ad]=ratio(dailyJobs),[t,td]=ratio(serviceSeconds),[u,ud]=ratio(utilization),num=a*t*ud,den=ad*td*u*86400n;
 const workers=Number((num+den-1n)/den);
 if(!Number.isSafeInteger(workers))throw new RangeError('unsafe budget');
 return {arrival,inService,workers,utilization};
}
export function ringOwner(key,positions){
 if(!Number.isFinite(key)||key<0||key>=1||!Array.isArray(positions)||!positions.length)throw new RangeError('ring');
 if(positions.some(p=>!Number.isFinite(p.at)||p.at<0||p.at>=1||typeof p.owner!=='string')||new Set(positions.map(p=>p.at)).size!==positions.length)throw new RangeError('positions');
 const sorted=[...positions].sort((a,b)=>a.at-b.at);
 return (sorted.find(p=>p.at>=key)||sorted[0]).owner;
}
