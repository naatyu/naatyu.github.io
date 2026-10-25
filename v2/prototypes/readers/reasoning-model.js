// Exact constructed teaching models, not learned performance curves.
const unit=x=>{if(!Number.isFinite(x)||x<0||x>1)throw new RangeError("Probability in [0,1] required");};
const count=(x,lo=0,hi=100)=>{if(!Number.isSafeInteger(x)||x<lo||x>hi)throw new RangeError("Bounded integer required");};
export function passAtLeastOne(p,n){unit(p);count(n,1,10000);return p===1?1:-Math.expm1(n*Math.log1p(-p));}
function factorial(n){let v=1;for(let i=2;i<=n;i++)v*=i;return v;}
export function samplingOutcomes(p=.4,n=5,splitWrong=true,shared=.0){
 unit(p);unit(shared);count(n,1,30);if(typeof splitWrong!=="boolean")throw new RangeError("Boolean wrong-answer split required");
 const probabilities=splitWrong?[p,(1-p)/2,(1-p)/2]:[p,1-p,0];
 let mass=0,vote=0,tieMass=0;
 for(let a=0;a<=n;a++)for(let b=0;b<=n-a;b++){
  const c=n-a-b,counts=[a,b,c];
  const probability=factorial(n)/factorial(a)/factorial(b)/factorial(c)*probabilities[0]**a*probabilities[1]**b*probabilities[2]**c;
  const max=Math.max(...counts),ties=counts.filter(x=>x===max).length;
  mass+=probability;if(ties>1)tieMass+=probability;if(a===max)vote+=probability/ties;
 }
 const oracle=passAtLeastOne(p,n);
 return {probabilities,mass,iidVote:vote,iidOracle:oracle,iidTie:tieMass,vote:shared*p+(1-shared)*vote,oracle:shared*p+(1-shared)*oracle,tie:(1-shared)*tieMass,shared};
}
export const voteSequence=["B","A","C","A","A","B","A","A"];
export function voteState(step=1,sequence=voteSequence){
 if(!Array.isArray(sequence)||!sequence.length||sequence.length>30||sequence.some(x=>!["A","B","C"].includes(x)))throw new RangeError("A/B/C sequence required");
 count(step,0,sequence.length);
 const counts={A:0,B:0,C:0};for(const label of sequence.slice(0,step))counts[label]++;
 const ranked=Object.keys(counts).sort((a,b)=>counts[b]-counts[a]||a.localeCompare(b)),remaining=sequence.length-step,margin=counts[ranked[0]]-counts[ranked[1]];
 return {counts,leader:step===0?null:ranked[0],remaining,margin,strictLock:margin>remaining,finalized:remaining===0,canStop:remaining===0||margin>remaining,history:sequence.slice(0,step)};
}
export function refinement(initial=.6,recovery=.2,damage=.3,rounds=4){
 [initial,recovery,damage].forEach(unit);count(rounds,0,1000);
 const rows=[{round:0,current:initial,best:initial}];let current=initial;
 for(let t=1;t<=rounds;t++){
  const recovered=(1-current)*recovery,lost=current*damage;
  current=current+recovered-lost;
  rows.push({round:t,current,best:1-(1-initial)*(1-recovery)**t,recovered,lost});
 }
 return {rows,current,best:rows.at(-1).best,equilibrium:recovery+damage===0?null:recovery/(recovery+damage)};
}
export function budgetTrace(budget=6,reasoning=12,answer=3,prompt=5){
 count(budget,0,10000);count(reasoning,1,10000);count(answer,1,10000);count(prompt,0,10000);
 const retained=Math.min(budget,reasoning),externalClose=retained<reasoning;
 const spans=[{role:"prompt",tokens:prompt,target:false},{role:"reasoning",tokens:retained,target:true},{role:externalClose?"inserted closure":"natural closure",tokens:1,target:!externalClose},{role:"answer",tokens:answer,target:true}];
 return {retained,removed:reasoning-retained,externalClose,spans,context:spans.reduce((a,s)=>a+s.tokens,0),targets:spans.reduce((a,s)=>a+(s.target?s.tokens:0),0)};
}
export function effortRewards(cost=.001){
 if(!Number.isFinite(cost)||cost<0||cost>.1)throw new RangeError("Finite bounded token cost required");
 const candidates=[{tokens:50,success:.4},{tokens:100,success:.6},{tokens:200,success:.7},{tokens:400,success:.75}];
 const rows=candidates.map(c=>({...c,reward:c.success-cost*c.tokens})),max=Math.max(...rows.map(r=>r.reward));
 // Numerical near-ties use a stated tolerance, then prefer shorter candidates.
 const winners=rows.flatMap((r,i)=>Math.abs(r.reward-max)<=1e-12?[i]:[]);
 return {cost,rows,winners,choice:rows[winners[0]]};
}
export const bookInference=[
 {method:"Greedy base",model:"Base",accuracy:15.2,minutes:10.1},
 {method:"Greedy reasoning",model:"Reasoning",accuracy:48.2,minutes:182.1},
 {method:"Step-by-step prompt",model:"Base",accuracy:40.6,minutes:84.5},
 {method:"Temperature + nucleus",model:"Base",accuracy:17.8,minutes:30.7},
 {method:"Vote 3, sampling",model:"Base",accuracy:29.6,minutes:97.6},
 {method:"Vote 5, sampling",model:"Base",accuracy:27.8,minutes:116.8},
 {method:"Vote 10, sampling",model:"Base",accuracy:31.6,minutes:300.4},
 {method:"Sampling + step-by-step",model:"Base",accuracy:33.4,minutes:129.2},
 {method:"Vote 3 + step-by-step",model:"Base",accuracy:42.2,minutes:211.6},
 {method:"Vote 5 + step-by-step",model:"Base",accuracy:48.0,minutes:452.9},
 {method:"Vote 10 + step-by-step",model:"Base",accuracy:52.0,minutes:862.6},
 {method:"Vote 3 + step-by-step",model:"Reasoning",accuracy:55.2,minutes:544.4}
];
export const bookRefinement=[
 {model:"Base",scorer:"None",rounds:1,accuracy:25.0,minutes:84.8},
 {model:"Base",scorer:"None",rounds:2,accuracy:22.0,minutes:165.4},
 {model:"Base",scorer:"Heuristic",rounds:1,accuracy:21.6,minutes:84.7},
 {model:"Base",scorer:"Heuristic",rounds:2,accuracy:20.8,minutes:151.4},
 {model:"Base",scorer:"Average log probability",rounds:1,accuracy:21.4,minutes:85.3},
 {model:"Base",scorer:"Average log probability",rounds:2,accuracy:22.0,minutes:165.3},
 {model:"Reasoning",scorer:"None",rounds:1,accuracy:56.6,minutes:498.8},
 {model:"Reasoning",scorer:"Heuristic",rounds:1,accuracy:57.8,minutes:498.6},
 {model:"Reasoning",scorer:"Average log probability",rounds:1,accuracy:48.4,minutes:499.7}
];
export const bookRL=[
 {step:50,budget:256,group:4,accuracy:43.2,tokens:560.22},
 {step:50,budget:512,group:4,accuracy:45.6,tokens:579.81},
 {step:50,budget:512,group:8,accuracy:47.4,tokens:586.11}
];
export const bookDistillation=[
 {teacher:"DeepSeek-R1",epoch:1,loss:.5436,accuracy:30.6},
 {teacher:"DeepSeek-R1",epoch:2,loss:.5349,accuracy:32.4},
 {teacher:"DeepSeek-R1",epoch:3,loss:.5343,accuracy:33.6},
 {teacher:"Qwen3 235B-A22B",epoch:1,loss:.4043,accuracy:45.0},
 {teacher:"Qwen3 235B-A22B",epoch:2,loss:.3963,accuracy:43.8},
 {teacher:"Qwen3 235B-A22B",epoch:3,loss:.3948,accuracy:44.2}
];
