// Exact, bounded teaching models. These do not train a backbone or reproduce a benchmark.
const finite=x=>{if(!Number.isFinite(x))throw new RangeError('Expected a finite number');return x;};
const matrix=x=>{if(!Array.isArray(x)||!x.length||!Array.isArray(x[0])||!x[0].length)throw new RangeError('Expected a nonempty matrix');const d=x[0].length;if(x.some(row=>!Array.isArray(row)||row.length!==d))throw new RangeError('Inconsistent matrix shape');x.forEach(row=>row.forEach(finite));return d;};
export function visionSoftmax(logits,temperature=1){if(!Array.isArray(logits)||!logits.length||!(finite(temperature)>0))throw new RangeError('Invalid logits or temperature');logits.forEach(finite);const max=Math.max(...logits),shifted=logits.map(x=>finite((x-max)/temperature)),denom=shifted.reduce((s,x)=>s+Math.exp(x),0),logSum=Math.log(denom);return {probabilities:shifted.map(x=>Math.exp(x)/denom),logProbabilities:shifted.map(x=>x-logSum)};}
export function visionPatchLoss(studentLogits,teacherProbabilities,masked,scope='masked',temperature=1){
 const k=matrix(studentLogits);if(matrix(teacherProbabilities)!==k||teacherProbabilities.length!==studentLogits.length||!Array.isArray(masked)||masked.length!==studentLogits.length||masked.some(x=>typeof x!=='boolean')||!['masked','all'].includes(scope))throw new RangeError('Invalid patch contract');
 teacherProbabilities.forEach(row=>{if(row.some(x=>x<0)||Math.abs(row.reduce((s,x)=>s+x,0)-1)>1e-9)throw new RangeError('Teacher rows must be probability distributions');});
 const selected=masked.map((x,i)=>scope==='all'||x?i:-1).filter(i=>i>=0),denominator=selected.length;
 const rows=studentLogits.map((z,i)=>{const p=visionSoftmax(z,temperature);return {index:i,masked:masked[i],selected:selected.includes(i),teacher:teacherProbabilities[i].slice(),probabilities:p.probabilities,loss:-teacherProbabilities[i].reduce((s,q,j)=>s+(q===0?0:q*p.logProbabilities[j]),0)};});
 // A declared empty-selection policy: zero loss and zero gradient, not division by zero.
 const loss=denominator?selected.reduce((s,i)=>s+rows[i].loss,0)/denominator:0;
 const gradient=rows.map(r=>r.probabilities.map((p,j)=>r.selected?(p-r.teacher[j])/(denominator*temperature):0));
 return {scope,denominator,empty:denominator===0,rows,loss,gradient};
}
export function visionAgreement(views,globalCount=2){
 if(!Array.isArray(views)||!views.length)throw new RangeError('Expected views');const d=matrix(views[0]),b=views[0].length,v=views.length;
 if(!Number.isInteger(globalCount)||globalCount<1||globalCount>v||views.some(x=>matrix(x)!==d||x.length!==b))throw new RangeError('Invalid view/global shape');
 const centers=Array.from({length:b},(_,n)=>Array.from({length:d},(_,j)=>views.slice(0,globalCount).reduce((s,x)=>s+x[n][j],0)/globalCount));
 let centered=0,globalVariance=0,pairwise=0;const gradient=views.map(x=>x.map(row=>row.map(()=>0)));
 for(let n=0;n<b;n++)for(let j=0;j<d;j++){
  let centerGradient=0;
  for(let w=0;w<v;w++){const delta=views[w][n][j]-centers[n][j];centered+=delta*delta/(v*b*d);gradient[w][n][j]+=2*delta/(v*b*d);centerGradient-=2*delta/(v*b*d);}
  for(let g=0;g<globalCount;g++){gradient[g][n][j]+=centerGradient/globalCount;const delta=views[g][n][j]-centers[n][j];globalVariance+=delta*delta/(globalCount*b*d);for(let w=0;w<v;w++)pairwise+=(views[g][n][j]-views[w][n][j])**2/(globalCount*v*b*d);}
 }
 return {centers,centered,globalVariance,pairwise,gradient,shape:[v,b,d],globalCount};
}
export function visionECF(samples,t){if(!Array.isArray(samples)||!samples.length)throw new RangeError('Expected projected samples');finite(t);samples.forEach(finite);const phases=samples.map(x=>finite(t*x));return {real:phases.reduce((s,x)=>s+Math.cos(x),0)/samples.length,imaginary:phases.reduce((s,x)=>s+Math.sin(x),0)/samples.length};}
export function visionQuadrature(knots=17,limit=3){if(!Number.isInteger(knots)||knots<2||!(finite(limit)>0))throw new RangeError('Invalid quadrature');const dt=limit/(knots-1);return Array.from({length:knots},(_,i)=>({t:i*dt,weight:2*dt*(i===0||i===knots-1?.5:1)}));}
export function visionSIGReg(samples,directions,{knots=17,limit=3,scaled=false}={}){
 const d=matrix(samples),n=samples.length;if(matrix(directions)!==d||typeof scaled!=='boolean')throw new RangeError('Invalid projection contract');
 for(const a of directions)if(Math.abs(a.reduce((s,x)=>s+x*x,0)-1)>1e-9)throw new RangeError('Directions must have unit norm');
 const quadrature=visionQuadrature(knots,limit),m=directions.length,gradient=samples.map(x=>x.map(()=>0));
 const slices=directions.map(a=>{const projected=samples.map(row=>row.reduce((s,x,j)=>s+x*a[j],0));let loss=0;const frequencies=quadrature.map(({t,weight})=>{
  const ecf=visionECF(projected,t),target=Math.exp(-t*t/2),error=(ecf.real-target)**2+ecf.imaginary**2,factor=weight*target*(scaled?n:1);loss+=factor*error;
  for(let i=0;i<n;i++){const dp=2*factor*t/n*(-(ecf.real-target)*Math.sin(t*projected[i])+ecf.imaginary*Math.cos(t*projected[i]));for(let j=0;j<d;j++)gradient[i][j]+=dp*a[j]/m;}
  return {t,weight,target,...ecf,error};
 });return {direction:a.slice(),projected,frequencies,loss};});
 return {loss:slices.reduce((s,x)=>s+x.loss,0)/m,slices,gradient,n,d,m,scaled,knots,limit};
}
// Population counterexample: U~N(0,1), independent fair R in {-1,+1}, Z=(U,RU).
// Axes have Gaussian marginals and covariance I, but the joint law lies on two diagonals.
export function visionProjectedLaw(family,angleDegrees,t){if(!['gaussian','cross','square','collapsed'].includes(family)||!Number.isFinite(angleDegrees)||angleDegrees<0||angleDegrees>180)throw new RangeError('Invalid law/direction');finite(t);const theta=angleDegrees*Math.PI/180,a=Math.cos(theta),b=Math.sin(theta),target=Math.exp(-t*t/2);
 const real=family==='gaussian'?target:family==='cross'?.5*(Math.exp(-((t*(a+b))**2)/2)+Math.exp(-((t*(a-b))**2)/2)):family==='square'?Math.cos(t*a)*Math.cos(t*b):1;
 return {family,angleDegrees,t,direction:[a,b],real,imaginary:0,target,error:(real-target)**2,variance:family==='collapsed'?0:1};
}
export function visionExpectedECFError(populationCF,n,target){if(!Number.isInteger(n)||n<1||!populationCF||!target)throw new RangeError('Invalid expected error');const p=populationCF;[p.real,p.imaginary,target.real,target.imaginary].forEach(finite);const modulus=p.real*p.real+p.imaginary*p.imaginary;if(modulus>1+1e-9)throw new RangeError('Invalid characteristic value');return (1-modulus)/n+(p.real-target.real)**2+(p.imaginary-target.imaginary)**2;}
