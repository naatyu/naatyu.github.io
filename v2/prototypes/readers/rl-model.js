// Exact, bounded demonstrations. These are analytical models, not measured training runs.
const finite=Number.isFinite;
const clip=(x,l,u)=>Math.min(u,Math.max(l,x));
function probability(p){if(!finite(p)||p<0||p>1)throw new RangeError("Probability must be in [0,1]");}
function count(n,min=1){if(!Number.isSafeInteger(n)||n<min)throw new RangeError("Invalid integer count");}
export function groupAdvantages(rewards,epsilon=1e-8){
 if(!Array.isArray(rewards)||!rewards.length||!rewards.every(finite)||!finite(epsilon)||epsilon<=0)throw new RangeError("Finite rewards and positive epsilon required");
 const n=rewards.length,origin=rewards[0],mean=origin+rewards.reduce((s,x)=>s+(x-origin)/n,0);
 const centered=rewards.map(x=>x-mean),std=Math.sqrt(centered.reduce((s,x)=>s+x*x/n,0));
 if(!finite(mean)||!finite(std))throw new RangeError("Reward arithmetic overflow");
 return {mean,std,centered,normalized:centered.map(x=>x/(std+epsilon)),rloo:n>1?centered.map(x=>x*n/(n-1)):null};
}
export function clippedSurrogate(ratio,advantage,lower=.8,upper=1.2){
 if(![ratio,advantage,lower,upper].every(finite)||ratio<=0||lower<=0||lower>1||upper<1)throw new RangeError("Positive ratio and valid clipping bounds required");
 const raw=ratio*advantage,bounded=clip(ratio,lower,upper)*advantage;
 if(!finite(raw)||!finite(bounded))throw new RangeError("Surrogate arithmetic overflow");
 const active=advantage>0?ratio>upper:advantage<0&&ratio<lower;
 // Derivative with respect to log(ratio), holding sampled actions and advantage fixed.
 // At the beneficial boundary the derivative is not unique.
 return {raw,bounded,objective:Math.min(raw,bounded),active,logRatioGradient:active?0:raw,kink:advantage>0?ratio===upper:advantage<0&&ratio===lower};
}
export function reductionWeights(lengths,mode="response",maxLength=128){
 if(!Array.isArray(lengths)||!lengths.length)throw new RangeError("Nonempty response lengths required");
 lengths.forEach(n=>count(n));count(maxLength);
 if(!["response","token","fixed"].includes(mode)||lengths.some(n=>n>maxLength))throw new RangeError("Invalid reduction");
 const total=lengths.reduce((s,x)=>s+x,0),g=lengths.length;
 if(!Number.isSafeInteger(total)||!Number.isSafeInteger(g*maxLength))throw new RangeError("Count overflow");
 const perToken=lengths.map(n=>mode==="response"?1/(g*n):mode==="token"?1/total:1/(g*maxLength));
 return {perToken,responseMass:perToken.map((w,i)=>w*lengths[i]),totalMass:perToken.reduce((s,w,i)=>s+w*lengths[i],0)};
}
export function binarySampling(p,k){
 probability(p);count(k);
 const coverage=p===1?1:-Math.expm1(k*Math.log1p(-p));
 const consistency=p===0?0:Math.exp(k*Math.log(p));
 // G=1 cannot have a mixed group. log1p/expm1 retain rare-event precision.
 const mixed=k===1?0:Math.max(0,(p<=.5?-Math.expm1(k*Math.log1p(-p))-consistency:-Math.expm1(k*Math.log(p))-Math.exp(k*Math.log1p(-p))));
 const entropy=(p===0||p===1)?0:-(p*Math.log2(p)+(1-p)*Math.log2(1-p));
 return {coverage,consistency,mixed,entropy};
}
function noEvent(total,eligible,k){
 if(eligible<k)return 0;
 let value=1;for(let j=0;j<k;j++)value*=(eligible-j)/(total-j);
 return value;
}
export function finiteSampleMetric(n,c,k){
 count(n);count(c,0);count(k);if(c>n||k>n)throw new RangeError("Sample counts inconsistent");
 return {coverage:1-noEvent(n,n-c,k),consistency:noEvent(n,c,k)};
}
export function samplingArea(curve){
 if(!Array.isArray(curve)||curve.length<2)throw new RangeError("At least two sampling budgets required");
 curve.forEach(probability);
 if(curve.some((p,i)=>i&&p<curve[i-1]))throw new RangeError("Coverage must be nondecreasing");
 const k=curve.length,area=curve.slice(0,-1).reduce((s,p)=>s+curve[k-1]-p,0),headroom=(k-1)*(1-curve[0]);
 // No failure headroom: show undefined, not invented zero tax.
 return {area,normalized:headroom===0?null:area/headroom,headroom};
}
export function datasetSamplingArea(taskCurves){
 if(!Array.isArray(taskCurves)||!taskCurves.length)throw new RangeError("At least one task required");
 const budgets=taskCurves[0]?.length;
 for(const curve of taskCurves){if(curve?.length!==budgets)throw new RangeError("Matched task budgets required");samplingArea(curve);}
 const curve=Array.from({length:budgets},(_,k)=>taskCurves.reduce((sum,row)=>sum+row[k],0)/taskCurves.length);
 return {curve,...samplingArea(curve)};
}
export function ptgsTemperature(p,q=.5,tau=1.5,reference=1){
 probability(p);
 if(!finite(q)||q<=0||q>=1||!finite(tau)||tau<1||!finite(reference)||reference<=0)throw new RangeError("PTGS parameter domain");
 const exponent=(q-p)/(p<=q?q:1-q),temperature=reference*Math.pow(tau,exponent);
 if(!finite(temperature)||temperature<=0)throw new RangeError("Temperature outside numeric range");
 return {exponent,temperature,minimum:reference/tau,maximum:reference*tau};
}
export function ptgsPosterior(successes,failures,q=.5){
 if(![successes,failures].every(x=>finite(x)&&x>=0)||!finite(q)||q<=0||q>=1)throw new RangeError("Posterior domain");
 const alpha=2*q+successes,beta=2*(1-q)+failures,total=alpha+beta;
 if(!finite(total))throw new RangeError("Posterior count overflow");
 return {alpha,beta,mean:alpha/total,variance:alpha/total*(beta/total)/(total+1)};
}
export function updateEvidence(successes,failures,u,n,gamma=1){
 ptgsPosterior(successes,failures);count(n);count(u,0);
 if(u>n||!finite(gamma)||gamma<0||gamma>1)throw new RangeError("Evidence update domain");
 const next={successes:gamma*successes+u,failures:gamma*failures+n-u};
 if(!Object.values(next).every(finite))throw new RangeError("Evidence count overflow");
 return next;
}
export function entropyControl(k,observed,target,delta=.02,maximum=.5){
 if(![k,observed,target,delta,maximum].every(finite)||Math.min(k,observed,target,delta,maximum)<0||k>maximum)throw new RangeError("Entropy controller domain");
 return clip(k+delta*Math.sign(target-observed),0,maximum);
}
export function bellmanSweep(values=[0,0,0],gamma=.9){
 if(!Array.isArray(values)||values.length!==3||!values.every(finite)||!finite(gamma)||gamma<0||gamma>=1)throw new RangeError("Finite three-state discounted model required");
 // s0: cash out .4, or continue to s1. s1: cash out 1, or wait at cost -.1.
 // Both cash-out actions terminate. Terminal s2 is always fixed to zero.
 const q0=[.4,gamma*values[1]],q1=[1,-.1+gamma*values[1]];
 return {values:[Math.max(...q0),Math.max(...q1),0],actions:[q0[0]>=q0[1]?"cash out":"continue",q1[0]>=q1[1]?"cash out":"wait","terminal"],q:[q0,q1]};
}
export function bellmanTrace(steps=3,gamma=.9){
 count(steps,0);if(steps>1000)throw new RangeError("Bounded trace required");
 const trace=[{values:[0,0,0],actions:["unknown","unknown","terminal"]}];
 // Validate discount even for zero sweeps.
 bellmanSweep(trace[0].values,gamma);
 for(let i=0;i<steps;i++)trace.push(bellmanSweep(trace.at(-1).values,gamma));
 return trace;
}
export function sequenceRatios(logRatios){
 if(!Array.isArray(logRatios)||!logRatios.length||!logRatios.every(finite))throw new RangeError("Finite nonempty log ratios required");
 const logProduct=logRatios.reduce((s,x)=>s+x,0),logGeometricMean=logProduct/logRatios.length;
 if(!finite(logProduct))throw new RangeError("Log ratio sum overflow");
 return {logProduct,logGeometricMean,product:Math.exp(logProduct),geometricMean:Math.exp(logGeometricMean)};
}
export function conditionalKL(policy,reference){
 if(!Array.isArray(policy)||!Array.isArray(reference)||!policy.length||policy.length!==reference.length)throw new RangeError("Matched probability vectors required");
 for(const vector of [policy,reference]){
  if(!vector.every(x=>finite(x)&&x>0&&x<=1)||Math.abs(vector.reduce((s,x)=>s+x,0)-1)>1e-10)throw new RangeError("Strictly positive normalized distributions required");
 }
 const logReferenceRatio=policy.map((p,i)=>Math.log(reference[i])-Math.log(p));
 const samples=logReferenceRatio.map(x=>Math.expm1(x)-x);
 // Expectation is under the current policy, at one fixed prefix. Replayed old-policy
 // actions need a correction; summing over changed prefixes is a separate issue.
 return {samples,forward:policy.reduce((s,p,i)=>s-p*logReferenceRatio[i],0),expectedEstimator:policy.reduce((s,p,i)=>s+p*samples[i],0)};
}
