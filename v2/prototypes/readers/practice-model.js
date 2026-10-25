// Assigned planning scenarios, not measured hardware or benchmark results.
const positive=x=>Number.isFinite(x)&&x>0;
export function runBudget({gpus=256,days=90,rate=200,main=.75,goodput=.9,parameters=7}={}){
  if(![gpus,days,rate,parameters].every(positive)||!Number.isInteger(gpus)||!positive(main)||main>1||!positive(goodput)||goodput>1)throw new RangeError('Invalid budget');
  const seconds=days*86400,healthy=gpus*rate*1e12,compute=healthy*seconds*main*goodput,tokens=compute/(6*parameters*1e9);
  if(![healthy,compute,tokens].every(Number.isFinite))throw new RangeError('Budget overflow');
  return {seconds,healthy,compute,tokens,ratio:tokens/(parameters*1e9),mainDays:days*main,idealDays:days*main*goodput};
}
export function efficiency(loss,cost,{A=1,alpha=.5,E=1}={}){
  if(![cost,A,alpha].every(positive)||!Number.isFinite(E)||!Number.isFinite(loss)||loss<=E)throw new RangeError('Loss must exceed fitted floor');
  const baseline=(A/(loss-E))**(1/alpha),gain=baseline/cost;
  if(![baseline,gain].every(positive))throw new RangeError('Inverse outside numeric range');
  return {baseline,gain,saving:1-1/gain};
}
export function contextCost(main=.99,multiplier=16,rho=.1){
  if(!Number.isFinite(main)||main<0||main>1||!positive(multiplier)||!Number.isFinite(rho)||rho<0)throw new RangeError('Invalid context scenario');
  const short=1+rho,long=1+rho*multiplier,staged=main*short+(1-main)*long;
  return {short,long,staged,relative:staged/short,always:long/short,saving:1-staged/long};
}
const advance=s=>{const sample=s.cursor+1,rng=(5*s.rng+1)%16,m=2*s.m+sample+rng;return {step:s.step+1,cursor:s.cursor+1,rng,m,w:s.w+m};};
export function recoveryTrace(policy='full'){
  if(!['full','moments','loader'].includes(policy))throw new RangeError('Unknown restore');
  const frames=[];let s={step:0,cursor:0,rng:1,m:0,w:0},durable=0,executed=0;
  const push=(label)=>frames.push({...s,label,durable,executed});push('Initial state');let saved;
  for(let i=1;i<=5;i++){s=advance(s);executed++;if(i===3){saved={...s};durable=3;}push(i===3?'Step 3: durable checkpoint':i===5?'Step 5: failure before commit':`Step ${i}: volatile progress`);}
  s={...saved};if(policy==='moments')s.m=0;if(policy==='loader'){s.cursor=0;s.rng=1;}push('Restore step 3');
  for(let i=4;i<=6;i++){s=advance(s);executed++;push(`Continue logical step ${i}`);}
  durable=6;push('Commit step 6');let reference={step:0,cursor:0,rng:1,m:0,w:0};for(let i=0;i<6;i++)reference=advance(reference);
  return {frames,reference,correct:JSON.stringify(s)===JSON.stringify(reference),lost:2};
}
export function checkpointOverhead(interval,cost,mtbf){
  if(![interval,mtbf].every(positive)||!Number.isFinite(cost)||cost<0)throw new RangeError('Invalid checkpoint model');
  return {checkpoint:cost/interval,replay:interval/(2*mtbf),total:cost/interval+interval/(2*mtbf),optimum:Math.sqrt(2*cost*mtbf)};
}
export function elasticWork(repair,reconfigure,fraction){
  if(!positive(repair)||!Number.isFinite(reconfigure)||reconfigure<0||!Number.isFinite(fraction)||fraction<0||fraction>1)throw new RangeError('Invalid repair scenario');
  const useful=Math.max(0,repair-reconfigure)*fraction;return {useful,lost:repair-useful};
}
