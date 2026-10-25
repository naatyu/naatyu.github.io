import {assertGeneratedMarkup,assertGeneratedMarkupCount} from './check-generated-markup.mjs';
import assert from "node:assert/strict";
import {logSoftmax,softDistillation,reverseDistillation,topKTeacher,twoTokenDistillation,selfSampleBatch} from "../prototypes/readers/distillation-model.js";
import {temperatureBody,gradientBody,visitationBody,tailBody,selfBatchBody,distillationScenes} from "../prototypes/readers/distillation-scenes.js";
let cases=0;
const near=(a,b,t=2e-8)=>assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b)),String(a)+" != "+String(b));
const sum=x=>x.reduce((a,b)=>a+b,0);
const perturb=(x,i,h)=>x.map((a,j)=>a+(i===j?h:0));
for(const tau of [.2,.5,1,2,4,10,32])for(let j=-10;j<=10;j++) {
 const teacher=[2,.5,-1],student=[j/3,-j/5,.3],m=softDistillation(teacher,student,tau),h=1e-5;
 near(sum(m.q),1);near(sum(m.p),1);near(m.crossEntropy,m.entropy+m.kl);near(sum(m.gradient),0);
 assert.ok(m.kl>=-1e-14);
 for(let i=0;i<3;i++){
  near(m.gradient[i],(softDistillation(teacher,perturb(student,i,h),tau).loss-softDistillation(teacher,perturb(student,i,-h),tau).loss)/(2*h),1e-7);
 }
 const shifted=softDistillation(teacher.map(x=>x+100),student.map(x=>x-90),tau);
 near(shifted.loss,m.loss);m.gradient.forEach((g,i)=>near(g,shifted.gradient[i]));
 const same=softDistillation(teacher,teacher,tau);near(same.loss,0);same.gradient.forEach(g=>near(g,0));
 cases++;
}
for(let a=-16;a<=16;a++)for(let b=-8;b<=8;b++) {
 const teacher=[a/3,.2,-.6],student=[b/4,-.4,.7],m=reverseDistillation(teacher,student),h=1e-5;
 near(sum(m.gradient),0);
 m.gradient.forEach((g,i)=>{
  near(g,m.scoreExpectation[i]);near(m.naiveExpectation[i],0);
  near(g,(reverseDistillation(teacher,perturb(student,i,h)).kl-reverseDistillation(teacher,perturb(student,i,-h)).kl)/(2*h));
 });
 cases++;
}
for(let a=-8;a<=8;a++)for(let b=-6;b<=6;b++) {
 const student=[a/4,b/3,-.8],teacher=[.3,1.1,-.3],m=twoTokenDistillation(student,teacher),h=1e-5;
 near(sum(m.trajectories.map(x=>x.probability)),1);near(sum(m.trajectories.map(x=>x.teacherProbability)),1);
 near(m.kl,m.trajectories.reduce((s,x)=>s+x.probability*Math.log(x.probability/x.teacherProbability),0));
 m.fullGradient.forEach((g,i)=>{
  near(g,m.scoreExpectation[i]);near(m.naiveExpectation[i],0);
  near(g,(twoTokenDistillation(perturb(student,i,h),teacher).kl-twoTokenDistillation(perturb(student,i,-h),teacher).kl)/(2*h));
 });
 // Hold the root visitation measure fixed when differentiating later-state KLs.
 const fixed=p=>reverseDistillation([teacher[0],0],[p[0],0]).kl+m.rows[0].p[0]*reverseDistillation([teacher[1],0],[p[1],0]).kl+m.rows[0].p[1]*reverseDistillation([teacher[2],0],[p[2],0]).kl;
 m.localGradient.forEach((g,i)=>near(g,(fixed(perturb(student,i,h))-fixed(perturb(student,i,-h)))/(2*h)));
 near(m.fullGradient[0]-m.localGradient[0],m.visitationGradient);
 cases++;
}
const tree=twoTokenDistillation([0,4,-1],[0,0,-1]);
assert.ok(Math.abs(tree.visitationGradient)>.01);
const exact=twoTokenDistillation([.3,1,-.5],[.3,1,-.5]);
near(exact.kl,0);exact.fullGradient.forEach(g=>near(g,0));
for(let n=2;n<=20;n++)for(let k=1;k<=n;k++) {
 const logits=Array.from({length:n},(_,i)=>(i%5)/2),m=topKTeacher(logits,k);
 near(sum(m.conditional),1);near(sum(m.bucket),1);near(m.retainedMass+m.tailMass,1);
 assert.equal(new Set(m.indices).size,k);assert.ok(m.retainedMass>0&&m.retainedMass<=1+1e-12);
 if(k===n)near(m.retainedMass,1);
 cases++;
}
assert.deepEqual(topKTeacher([0,0,0],2).indices,[0,1]);
for(let n=1;n<=24;n++)for(let k=0;k<=n;k++) {
 const m=selfSampleBatch(.3,n,k,.5);near(m.gradient,m.p-k/n);near(m.nextLogit,.3-.5*m.gradient);
 assert.ok(m.driftKL>=-1e-14);near(m.expectedInitialGradient,0);cases++;
}
const batch=selfSampleBatch(0,8,5,.5);
assert.ok(batch.next>.5&&batch.driftKL>0);
for(const z of [-1000,1000]) {
 const l=logSoftmax([z,0]);near(sum(l.map(Math.exp)),1);assert.ok(l.every(Number.isFinite));
}
for(const args of [[[],1],[[0],1],[[0,NaN],1],[[0,1],0],[[0,1],Infinity],[[Number.MAX_VALUE,-Number.MAX_VALUE],1]])assert.throws(()=>logSoftmax(...args),RangeError);
assert.throws(()=>softDistillation([0,1],[0,1,2]),RangeError);
assert.throws(()=>topKTeacher([0,1],0),RangeError);
assert.throws(()=>topKTeacher([0,1],3),RangeError);
assert.throws(()=>twoTokenDistillation([0,1],[0,1]),RangeError);
assert.throws(()=>selfSampleBatch(0,0,0),RangeError);
assert.throws(()=>selfSampleBatch(0,8,9),RangeError);
console.log("Distillation model: "+cases+" exact/finite-difference cases passed.");
let states=0;
for(const [body,low,high,scale] of [[temperatureBody,2,40,10],[gradientBody,-30,30,10],[visitationBody,-30,30,10],[tailBody,1,4,1],[selfBatchBody,0,8,1]])for(let i=low;i<=high;i++){
 const html=assertGeneratedMarkup(body(i/scale),"test-distillation-model.mjs");
 assert.ok(html.includes("<p>"));assert.ok(!/NaN|Infinity|undefined/.test(html));states++;
}
const scenes=distillationScenes();assert.equal(Object.keys(scenes).length,5);
for(const html of Object.values(scenes)){assert.ok(html.includes("aria-label="));assert.ok(html.includes("data-body"));assert.ok(html.includes("<figcaption>"));}
assertGeneratedMarkupCount("test-distillation-model.mjs",states);
console.log("Distillation scene render: "+states+" bounded static states passed; browser evidence is recorded separately in the topic audit.");
