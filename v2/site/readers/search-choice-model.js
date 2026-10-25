// Exact bounded teaching traces. Copy snapshots; never mutate caller input.
export function combinationTrace(input,target){
  if(!Array.isArray(input)||input.length>10||input.some(x=>!Number.isSafeInteger(x)||x<=0)||!Number.isSafeInteger(input.reduce((a,b)=>a+b,0))||!Number.isSafeInteger(target)||target<0)throw new Error('Safely summable positive integer candidates, nonnegative target and at most ten candidates required');
  const values=[...input].sort((a,b)=>a-b),path=[],calls=[],results=[],frames=[];
  const save=(event,index=null,message='')=>frames.push({event,index,message,values:[...values],path:[...path],sum:path.reduce((s,i)=>s+values[i],0),calls:calls.map(c=>({...c})),results:results.map(r=>[...r])});
  function dfs(start,sum){
    calls.push({start,sum});save('enter',null,`Enter with start ${start} and sum ${sum}.`);
    if(sum===target){results.push(path.map(i=>values[i]));save('output',null,'Copy the complete path into the results.');}
    else for(let i=start;i<values.length;i++){
      if(i>start&&values[i]===values[i-1]){save('duplicate',i,'Skip an equal sibling choice; its value branch was already explored.');continue;}
      if(sum+values[i]>target){save('prune',i,`Next sum ${sum+values[i]} exceeds target ${target}; positive sorted later choices cannot repair it.`);break;}
      path.push(i);save('choose',i,`Choose index ${i}; add ${values[i]} to this branch.`);
      dfs(i+1,sum+values[i]);path.pop();save('undo',i,`Remove index ${i}; restore the parent path before its next sibling.`);
    }
    calls.pop();save('return',null,'Return from this call; its caller owns the next choice.');
  }
  save('initial',null,'No choices made. Each candidate index may be used at most once.');dfs(0,0);return frames;
}
function intervals(input){
  if(!Array.isArray(input)||input.some(x=>!Array.isArray(x)||x.length!==2||!x.every(Number.isFinite)||x[1]<=x[0]))throw new Error('Finite positive-duration intervals required');
  return input.map(([start,end],id)=>({start,end,id}));
}
export function mergeTrace(input,closed=true){
  const jobs=intervals(input).sort((a,b)=>a.start-b.start||a.end-b.end||a.id-b.id),merged=[],frames=[];
  const save=(job,message)=>frames.push({job:job?{...job}:null,jobs:jobs.map(x=>({...x})),merged:merged.map(x=>({...x})),message});
  save(null,'Sort by start; no processed interval yet.');
  for(const job of jobs){const last=merged.at(-1),overlap=last&&(closed?job.start<=last.end:job.start<last.end);
    if(overlap){last.end=Math.max(last.end,job.end);save(job,'Overlap the current component; extend its end without moving its start.');}
    else{merged.push({start:job.start,end:job.end});save(job,'Start a new disjoint component after the processed frontier.');}
  }return frames;
}
export function schedulingTrace(input,rule='end'){
  if(!['end','start'].includes(rule))throw new Error('Use end or start sorting');
  const jobs=intervals(input).sort((a,b)=>a[rule]-b[rule]||a.end-b.end||a.id-b.id),kept=[],frames=[];let end=-Infinity;
  const save=(job,accepted,message)=>frames.push({jobs:jobs.map(x=>({...x})),job:job?{...job}:null,kept:kept.map(x=>({...x})),end,accepted,message});
  save(null,false,'No interval selected; inspect candidates in the chosen order.');
  for(const job of jobs){const accepted=job.start>=end;if(accepted){kept.push(job);end=job.end;}save(job,accepted,accepted?'Keep this compatible interval and move the finish frontier.':'Reject this interval because it starts before the finish frontier.');}return frames;
}
export function overlapTrace(input,closed=false){
  const jobs=intervals(input),events=jobs.flatMap(j=>[{time:j.start,delta:1,id:j.id},{time:j.end,delta:-1,id:j.id}]).sort((a,b)=>a.time-b.time||(closed?b.delta-a.delta:a.delta-b.delta)||a.id-b.id),active=new Set(),frames=[];let maximum=0;
  const save=(event,message)=>frames.push({jobs:jobs.map(j=>({...j})),event:event?{...event}:null,active:[...active],count:active.size,maximum,message});
  save(null,'No event processed. At a tied coordinate, the endpoint policy chooses which events happen first.');
  for(const event of events){if(event.delta===1)active.add(event.id);else active.delete(event.id);maximum=Math.max(maximum,active.size);save(event,`${event.delta===1?'Start':'End'} interval ${event.id} at ${event.time}; active count becomes ${active.size}.`);}return frames;
}
export function reachableTrace(jumps){
  if(!Array.isArray(jumps)||jumps.some((x,i)=>!Number.isSafeInteger(x)||x<0||!Number.isSafeInteger(i+x)))throw new Error('Nonnegative safely representable integer maximum jumps required');
  let farthest=0;const frames=[{index:null,farthest,reachable:true,message:'The start is reachable; each jump can choose any shorter nonnegative distance.'}];
  for(let i=0;i<jumps.length;i++){if(i>farthest){frames.push({index:i,farthest,reachable:false,message:'This index is beyond the reachable frontier; stop.'});break;}farthest=Math.max(farthest,i+jumps[i]);frames.push({index:i,farthest,reachable:true,message:`Reachable index ${i} extends the frontier to ${farthest}.`});}return frames;
}
