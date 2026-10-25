// Exact analytical teaching examples, not measured model-training results.
// q denotes the fixed teacher; p denotes the trainable student. Logs use nats.
function vector(x) {
 if(!Array.isArray(x)||x.length<2||!x.every(Number.isFinite))throw new RangeError("At least two finite logits required");
}
export function logSoftmax(logits,temperature=1) {
 vector(logits);
 if(!Number.isFinite(temperature)||temperature<=0)throw new RangeError("Positive finite temperature required");
 const max=Math.max(...logits);
 const shifted=logits.map(x=>(x-max)/temperature);
 if(!shifted.every(Number.isFinite))throw new RangeError("Logit arithmetic exceeds numeric range");
 const normalizer=Math.log(shifted.reduce((s,x)=>s+Math.exp(x),0));
 return shifted.map(x=>x-normalizer);
}
function pair(teacher,student,temperature=1) {
 const logq=logSoftmax(teacher,temperature),logp=logSoftmax(student,temperature);
 if(logq.length!==logp.length)throw new RangeError("Teacher and student vocabularies must align");
 return {logq,logp,q:logq.map(Math.exp),p:logp.map(Math.exp)};
}
export function softDistillation(teacher,student,temperature=1) {
 const {q,p,logq,logp}=pair(teacher,student,temperature);
 const entropy=-q.reduce((s,x,i)=>s+x*logq[i],0);
 const crossEntropy=-q.reduce((s,x,i)=>s+x*logp[i],0);
 const kl=q.reduce((s,x,i)=>s+x*(logq[i]-logp[i]),0);
 const loss=temperature*temperature*kl;
 const gradient=p.map((x,i)=>temperature*(x-q[i]));
 if(!Number.isFinite(loss)||!gradient.every(Number.isFinite))throw new RangeError("Loss arithmetic exceeds numeric range");
 return {q,p,entropy,crossEntropy,kl,loss,gradient,temperature};
}
export function reverseDistillation(teacher,student) {
 const {q,p,logq,logp}=pair(teacher,student);
 const gap=logp.map((x,i)=>x-logq[i]);
 const kl=p.reduce((s,x,i)=>s+x*gap[i],0);
 // The derivative is with respect to the unscaled student logits at a fixed prefix.
 const gradient=p.map((x,i)=>x*(gap[i]-kl));
 const sampleGradients=p.map((_,a)=>p.map((x,i)=>gap[a]*((i===a?1:0)-x)));
 const naiveGradients=p.map((_,a)=>p.map((x,i)=>(i===a?1:0)-x));
 const expectation=rows=>p.map((_,i)=>rows.reduce((s,row,a)=>s+p[a]*row[i],0));
 return {q,p,gap,kl,gradient,sampleGradients,scoreExpectation:expectation(sampleGradients),naiveExpectation:expectation(naiveGradients)};
}
export function topKTeacher(teacher,k=2) {
 const logq=logSoftmax(teacher),q=logq.map(Math.exp);
 if(!Number.isSafeInteger(k)||k<1||k>q.length)throw new RangeError("k must select one or more vocabulary entries");
 const indices=q.map((_,i)=>i).sort((a,b)=>q[b]-q[a]||a-b).slice(0,k);
 const retainedMass=indices.reduce((s,i)=>s+q[i],0);
 return {q,indices,retainedMass,tailMass:Math.max(0,1-retainedMass),conditional:indices.map(i=>q[i]/retainedMass),bucket:[...indices.map(i=>q[i]),Math.max(0,1-retainedMass)]};
}
export function twoTokenDistillation(student=[0,.8,-.5],teacher=[.5,1.2,-1]) {
 vector(student);vector(teacher);
 if(student.length!==3||teacher.length!==3)throw new RangeError("Three binary-state logits required");
 // Each scalar is the logit of action A relative to B: root, after A, after B.
 const rows=student.map((z,i)=>reverseDistillation([teacher[i],0],[z,0]));
 const p=rows[0].p,q=rows[0].q;
 const continuation=p[0]*rows[1].kl+p[1]*rows[2].kl;
 const kl=rows[0].kl+continuation;
 const localGradient=[rows[0].gradient[0],p[0]*rows[1].gradient[0],p[1]*rows[2].gradient[0]];
 const visitationGradient=p[0]*p[1]*(rows[1].kl-rows[2].kl);
 const fullGradient=[localGradient[0]+visitationGradient,localGradient[1],localGradient[2]];
 const trajectories=[];
 const scoreExpectation=[0,0,0],naiveExpectation=[0,0,0];
 for(let a=0;a<2;a++)for(let b=0;b<2;b++){
  const probability=p[a]*rows[a+1].p[b],teacherProbability=q[a]*rows[a+1].q[b];
  const gap=rows[0].gap[a]+rows[a+1].gap[b];
  const score=[(a===0?1:0)-p[0],a===0?((b===0?1:0)-rows[1].p[0]):0,a===1?((b===0?1:0)-rows[2].p[0]):0];
  score.forEach((s,i)=>{scoreExpectation[i]+=probability*gap*s;naiveExpectation[i]+=probability*s;});
  trajectories.push({actions:[a,b],probability,teacherProbability,gap});
 }
 return {rows,kl,continuation,localGradient,visitationGradient,fullGradient,scoreExpectation,naiveExpectation,trajectories};
}
export function selfSampleBatch(logit=0,count=8,successes=5,learningRate=.5) {
 if(!Number.isFinite(logit)||!Number.isSafeInteger(count)||count<1||!Number.isSafeInteger(successes)||successes<0||successes>count||!Number.isFinite(learningRate)||learningRate<0)throw new RangeError("Invalid finite-batch parameters");
 const p=logSoftmax([logit,0]).map(Math.exp)[0],frequency=successes/count;
 const gradient=p-frequency,nextLogit=logit-learningRate*gradient;
 const next=logSoftmax([nextLogit,0]).map(Math.exp)[0];
 // Current sampling law is held fixed; repeated fitting changes that relationship.
 return {p,frequency,gradient,nextLogit,next,expectedInitialGradient:0,driftKL:reverseDistillation([logit,0],[nextLogit,0]).kl};
}
