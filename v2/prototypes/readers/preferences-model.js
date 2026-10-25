const finite=Number.isFinite;
const sigmoid=x=>x>=0?1/(1+Math.exp(-x)):Math.exp(x)/(1+Math.exp(x));
const softplus=x=>Math.max(x,0)+Math.log1p(Math.exp(-Math.abs(x)));
function positive(beta){if(!finite(beta)||beta<=0)throw new RangeError('Positive finite beta required');}
export function dpoPair(chosen,rejected,refChosen,refRejected,beta=.1){
 positive(beta);if(![chosen,rejected,refChosen,refRejected].every(finite))throw new RangeError('Finite log probabilities required');
 const margin=(chosen-rejected)-(refChosen-refRejected),z=beta*margin;
 if(!finite(z))throw new RangeError('Preference margin overflow');
 const p=sigmoid(z),weight=beta*sigmoid(-z);
 return {margin,z,p,loss:softplus(-z),chosenGradient:-weight,rejectedGradient:weight};
}
export function normalizedLogits(logits){
 if(!logits.length||!logits.every(finite))throw new RangeError('Finite nonempty logits required');
 const max=Math.max(...logits),logZ=max+Math.log(logits.reduce((s,x)=>s+Math.exp(x-max),0));
 return {logps:logits.map(x=>x-logZ),probs:logits.map(x=>Math.exp(x-logZ))};
}
export function marginPath(t=0,mode='split',beta=.1){
 if(!finite(t)||t< -4||t>4||!['split','down'].includes(mode))throw new RangeError('Margin path domain');
 const change=mode==='split'?[t,-t,0]:[-t,-2*t,0],base=[.4,.4,.2],q=[.5,.3,.2],s=normalizedLogits(base.map((p,i)=>Math.log(p)+change[i]));
 return {...s,q,base,change,t,mode,...dpoPair(s.logps[0],s.logps[1],Math.log(q[0]),Math.log(q[1]),beta)};
}
export function rewardOptimum(beta=.5){
 positive(beta);const q=[.5,.3,.2],reward=[1,0,-1],s=normalizedLogits(q.map((p,i)=>Math.log(p)+reward[i]/beta));
 const kl=s.probs.reduce((a,p,i)=>a+p*(s.logps[i]-Math.log(q[i])),0),expected=s.probs.reduce((a,p,i)=>a+p*reward[i],0);
 return {...s,q,reward,kl,expected,objective:expected-beta*kl};
}
export function responseScore(logps,mask){
 if(logps.length!==mask.length||!logps.every(x=>finite(x)&&x<=0)||!mask.every(x=>typeof x==='boolean'))throw new RangeError('Response mask domain');
 return logps.reduce((s,x,i)=>s+(mask[i]?x:0),0);
}
