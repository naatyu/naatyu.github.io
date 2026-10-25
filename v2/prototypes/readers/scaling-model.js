const positive=(...xs)=>{if(xs.some(x=>!Number.isFinite(x)||x<=0))throw new RangeError('Expected positive finite values');};
export const demoLaw={A:1,B:1,alpha:.4,beta:.4,E:1};
export function loss(N,D,{A,B,alpha,beta,E,k=1}=demoLaw){positive(N,D,A,B,alpha,beta,k);if(!Number.isFinite(E)||E<0)throw new RangeError('Invalid floor');return E+(A*N**(-alpha)+B*D**(-beta))**k;}
export function allocation(C,{A,B,alpha,beta}=demoLaw,factor=6){positive(C,A,B,alpha,beta,factor);const N=(alpha*A/(beta*B))**(1/(alpha+beta))*(C/factor)**(beta/(alpha+beta));return {N,D:C/(factor*N)};}
export function mixedDerivative(N,D,{A,B,alpha,beta,k=1}=demoLaw){positive(N,D,A,B,alpha,beta,k);const u=A*N**(-alpha)+B*D**(-beta);return k*(k-1)*u**(k-2)*alpha*A*N**(-alpha-1)*beta*B*D**(-beta-1);}
export function effectiveData(unique,repeats,r=4){positive(unique,r);if(!Number.isFinite(repeats)||repeats<0)throw new RangeError('Invalid repetition');return unique*(1+r*(-Math.expm1(-repeats/r)));}
export function competing(a,b,p,q){positive(a,b,p,q);const x=(b*q/(a*p))**(1/(p+q));return {x,value:a*x**p+b*x**(-q)};}
// Fixed active capacity; divide remaining storage between inactive experts and memory.
// Coefficients multiply counts, not normalized fractions. Use log marginal gains.
export function memoryAllocation(active,total,a,b,p,q){
  positive(active,total,a,b,p,q);
  if(total<active||!Number.isFinite(total+active))throw new RangeError('Invalid storage budget');
  const sum=total+active;
  let lo=active/sum,hi=total/sum;
  if(lo===0||hi===1)throw new RangeError('Capacity ratio exceeds numerical range');
  const target=Math.log(a)+Math.log(p)-Math.log(b)-Math.log(q)+(q-p)*Math.log(sum);
  const balance=x=>(p+1)*Math.log(x)-(q+1)*Math.log1p(-x)-target;
  if(balance(lo)>=0)hi=lo;
  else if(balance(hi)<=0)lo=hi;
  else for(let i=0;i<80;i++){const mid=lo+(hi-lo)/2;if(mid===lo||mid===hi)break;if(balance(mid)<0)lo=mid;else hi=mid;}
  const moe=sum*(lo+(hi-lo)/2),mem=sum-moe;
  return {moe,mem,inactive:moe-active,memory:mem-active};
}
export function batchBudget(K,B){positive(K,B);return {K,B,T:K/B};}
export function efficiencyGain(A,alpha,E,cost,achieved){positive(A,alpha,cost);if(!Number.isFinite(E)||!Number.isFinite(achieved)||achieved<=E)throw new RangeError('Loss must exceed fitted floor');return (A/(achieved-E))**(1/alpha)/cost;}
export function gapFrames(target,trained,best,unrestricted){if([target,trained,best,unrestricted].some(x=>!Number.isFinite(x))||trained<best||best<unrestricted)throw new RangeError('Invalid nested training optima');return [{name:'Training floor',value:unrestricted},{name:'Architecture',value:best-unrestricted},{name:'Optimization',value:trained-best},{name:'Data / generalization',value:target-trained}];}
