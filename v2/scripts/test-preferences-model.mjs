import assert from 'node:assert/strict';
import {dpoPair,marginPath,rewardOptimum,normalizedLogits,responseScore} from '../site/readers/preferences-model.js';
const close=(a,b)=>assert(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),a+' != '+b);
let cases=0;
for(const beta of [.01,.1,.5,1,2])for(const mode of ['split','down'])for(let i=-40;i<=40;i++){
 const s=marginPath(i/10,mode,beta);close(s.probs.reduce((a,b)=>a+b),1);close(s.margin,(mode==='split'?2:1)*i/10-Math.log(5/3));
 const h=1e-5,d=dpoPair(s.logps[0]+h,s.logps[1],Math.log(.5),Math.log(.3),beta),e=dpoPair(s.logps[0]-h,s.logps[1],Math.log(.5),Math.log(.3),beta);close((d.loss-e.loss)/(2*h),s.chosenGradient);
 assert(s.loss>=0&&s.p>=0&&s.p<=1);close(s.chosenGradient,-s.rejectedGradient);cases++;
}
const down=marginPath(4,'down');assert(down.probs[0]<.4&&down.probs[1]<.4&&down.margin>marginPath().margin);
for(const z of [-1000,-100,-1,0,1,100,1000]){const s=dpoPair(z,0,0,0,1);assert(Number.isFinite(s.loss));if(z===0){close(s.loss,Math.log(2));close(s.chosenGradient,-.5);}cases++;}
let previous=Infinity;for(let i=1;i<=200;i++){const s=rewardOptimum(i/100);close(s.probs.reduce((a,b)=>a+b),1);assert(s.kl>=0&&s.kl<=previous+1e-10);previous=s.kl;close(Math.log(s.probs[0]/s.probs[1]),Math.log(5/3)+1/(i/100));cases++;}
close(responseScore([-1,-2,-3,-4],[false,true,true,false]),-5);
assert.throws(()=>responseScore([-1],[true,false]),RangeError);assert.throws(()=>dpoPair(0,0,0,0,0),RangeError);assert.throws(()=>marginPath(5),RangeError);
const a=normalizedLogits([1,2,3]),b=normalizedLogits([101,102,103]);a.probs.forEach((p,i)=>close(p,b.probs[i]));
console.log('Preferences: '+cases+' finite-difference, normalized margin-path and fixed-reward beta cases; mask domains, saturation and common-shift invariance pass.');
