// Exact constructed teaching models. These are not measured RL curves or production schedulers.
const sum=x=>x.reduce((a,b)=>a+b,0);
function array(x,n=1){if(!Array.isArray(x)||x.length<n||!x.every(Number.isFinite))throw new RangeError("Finite nonempty vector required");}
function unit(x){if(!Number.isFinite(x)||x<0||x>1)throw new RangeError("Value must lie in [0,1]");}
export function executableTask(failBefore,passAfter,regressBefore,regressAfter){
 for(const x of [failBefore,passAfter,regressBefore,regressAfter])if(typeof x!=="boolean")throw new RangeError("Boolean test results required");
 // failBefore means the target test FAILS before the patch, not that a failing run passed.
 const necessary=failBefore&&passAfter,regressionSafe=regressBefore&&regressAfter;
 return {necessary,regressionSafe,valid:necessary&&regressionSafe};
}
export function rubricRewards(outcomes,solution,behavior){
 array(outcomes);array(solution);array(behavior);
 if(outcomes.length!==solution.length||outcomes.length!==behavior.length)throw new RangeError("Aligned group required");
 outcomes.forEach(unit);solution.forEach(unit);behavior.forEach(unit);
 if(outcomes.some(x=>x!==0&&x!==1))throw new RangeError("Binary executable outcome required");
 const rewards=outcomes.map((x,i)=>x*solution[i]*behavior[i]),mean=sum(rewards)/rewards.length;
 return {rewards,mean,advantages:rewards.map(x=>x-mean)};
}
export function redistributeGroup(outcomes,quality,hacks=[],lambdaCap=Infinity){
 array(outcomes);array(quality);
 if(outcomes.length!==quality.length||outcomes.some(x=>x!==0&&x!==1)||quality.some(x=>x<=0||x>1)||!(lambdaCap>=1)||Number.isNaN(lambdaCap))throw new RangeError("Aligned binary group, positive quality and cap>=1 required");
 if(!Array.isArray(hacks)||hacks.some(i=>!Number.isSafeInteger(i)||i<0||i>=outcomes.length))throw new RangeError("Invalid hack indexes");
 const invalid=new Set(hacks),rewards=outcomes.map((x,i)=>invalid.has(i)?0:x),mean=sum(rewards)/rewards.length;
 const advantages=rewards.map(x=>x-mean),passing=rewards.flatMap((x,i)=>x===1?[i]:[]);
 const positiveMass=sum(passing.map(i=>advantages[i])),weightedMass=sum(passing.map(i=>advantages[i]*quality[i]));
 if(positiveMass>0&&(!Number.isFinite(weightedMass)||weightedMass<=0||!Number.isFinite(positiveMass/weightedMass)))throw new RangeError("Quality normalization exceeds numeric range");
 // All-pass and all-fail groups supply no binary advantage to redistribute.
 const rawLambda=positiveMass===0?null:positiveMass/weightedMass,lambda=rawLambda===null?null:Math.min(lambdaCap,rawLambda);
 const beforeCenter=advantages.map((a,i)=>rewards[i]===1&&lambda!==null?a*quality[i]*lambda:a);
 const shift=sum(beforeCenter)/beforeCenter.length,final=beforeCenter.map(a=>a-shift);
 return {rewards,mean,advantages,passing,positiveMass,weightedMass,rawLambda,lambda,capped:rawLambda!==null&&rawLambda>lambdaCap,beforeCenter,shift,final,positiveBeforeCenter:sum(passing.map(i=>beforeCenter[i])),positiveAfterCenter:sum(passing.map(i=>final[i]))};
}
export function localCredit(advantage,flags,kappa=2){
 if(!Number.isFinite(advantage)||!Array.isArray(flags)||!flags.length||!flags.every(x=>typeof x==="boolean")||!Number.isFinite(kappa)||kappa<1)throw new RangeError("Finite advantage, flags and kappa>=1 required");
 const n=flags.length,clean=flags.filter(x=>!x).length;
 if(advantage>0&&clean===0)return {weights:null,total:null,unallocated:advantage,reason:"No clean token to receive positive mass"};
 const scores=flags.map(f=>advantage>0?(f?0:1):advantage<0?(f?kappa:1):1),mass=sum(scores);
 const weights=scores.map(s=>advantage*s/mass);
 return {weights,total:sum(weights),unallocated:0,reason:advantage===0?"No outcome credit":"Normalized sign-specific token mass"};
}
export function harnessMass(episodes,lengths,mode="response",weights=null){
 array(episodes);array(lengths);
 if(episodes.length!==lengths.length||episodes.some(x=>!Number.isSafeInteger(x)||x<0)||lengths.some(x=>!Number.isSafeInteger(x)||x<1)||!["response","token"].includes(mode))throw new RangeError("Aligned counts/lengths and declared reduction required");
 const alpha=weights??episodes.map(()=>1);array(alpha);
 if(alpha.length!==episodes.length||alpha.some(x=>x<0))throw new RangeError("Nonnegative aligned harness weights required");
 const raw=episodes.map((n,i)=>n*alpha[i]*(mode==="token"?lengths[i]:1));
 const total=sum(raw);if(!Number.isFinite(total)||total<=0)throw new RangeError("Positive finite loss mass required");
 return {raw,total,shares:raw.map(x=>x/total)};
}
export function completionMixture(durations=[1,4],concurrency=[1,1],horizon=8){
 array(durations);array(concurrency);
 if(durations.length!==concurrency.length||durations.some(x=>!Number.isSafeInteger(x)||x<1)||concurrency.some(x=>!Number.isSafeInteger(x)||x<0)||!Number.isSafeInteger(horizon)||horizon<0)throw new RangeError("Discrete positive durations and nonnegative counts required");
 const completions=durations.map((d,i)=>Math.floor(horizon/d)*concurrency[i]),total=sum(completions);
 const rates=durations.map((d,i)=>concurrency[i]/d),rateTotal=sum(rates);
 if(!Number.isSafeInteger(total))throw new RangeError("Completion count overflow");
 return {completions,total,shares:total===0?null:completions.map(n=>n/total),rates,steadyShares:rateTotal===0?null:rates.map(r=>r/rateTotal)};
}
export function familyMixture(families){
 if(!Array.isArray(families)||!families.length)throw new RangeError("Family definitions required");
 families.forEach(f=>{unit(f.weight);array(f.conditional);f.conditional.forEach(unit);if(Math.abs(sum(f.conditional)-1)>1e-12)throw new RangeError("Conditional weights must sum to one");});
 if(Math.abs(sum(families.map(f=>f.weight))-1)>1e-12)throw new RangeError("Family weights must sum to one");
 return families.map(f=>f.conditional.map(p=>f.weight*p));
}
export function correctnessEfficiency(correct,efficiency,beta=.1){
 if(typeof correct!=="boolean"||!Number.isFinite(beta)||beta<0)throw new RangeError("Boolean correctness and nonnegative beta required");unit(efficiency);
 return correct?1+beta*efficiency:0;
}
export function prefixCapture(calls){
 if(!Array.isArray(calls))throw new RangeError("Call list required");
 const ids=new Set(),nodes=[];
 for(const call of calls){
  if(typeof call.id!=="string"||!call.id||ids.has(call.id)||!Array.isArray(call.prompt)||!Array.isArray(call.completion)||![...call.prompt,...call.completion].every(x=>Number.isSafeInteger(x)&&x>=0)||typeof call.retained!=="boolean")throw new RangeError("Unique IDs and exact nonnegative token IDs required");
  ids.add(call.id);
  // Deterministic teaching policy: longest matching prior full prefix, then first occurrence.
  // This is NOT a claimed reproduction of a vendor graph implementation.
  const candidates=nodes.filter(n=>n.full.length>0&&call.prompt.length>=n.full.length&&n.full.every((x,i)=>call.prompt[i]===x)).sort((a,b)=>b.full.length-a.full.length);
  const parent=candidates[0]?.id??null;
  nodes.push({id:call.id,parent,full:[...call.prompt,...call.completion],retained:call.retained,targetCount:call.retained?call.completion.length:0});
 }
 return nodes;
}
export const recoveryTrace=[
 {actor:"assistant",text:"Call unavailable tool",tokens:4,imitate:false},
 {actor:"tool",text:"Tool not available",tokens:3,imitate:false},
 {actor:"assistant",text:"Use supported tool",tokens:5,imitate:true},
 {actor:"tool",text:"Valid result",tokens:3,imitate:false},
 {actor:"assistant",text:"Finish the task",tokens:2,imitate:true}
];
export function recoveryState(step=4){
 if(!Number.isSafeInteger(step)||step<0||step>=recoveryTrace.length)throw new RangeError("Bounded recovery step required");
 const history=recoveryTrace.slice(0,step+1);
 return {history,contextTokens:sum(history.map(x=>x.tokens)),targetTokens:sum(history.filter(x=>x.imitate).map(x=>x.tokens)),maskedAssistantTokens:sum(history.filter(x=>x.actor==="assistant"&&!x.imitate).map(x=>x.tokens)),toolTokens:sum(history.filter(x=>x.actor==="tool").map(x=>x.tokens))};
}
