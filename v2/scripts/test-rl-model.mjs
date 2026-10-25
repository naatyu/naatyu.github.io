import assert from "node:assert/strict";
import {groupAdvantages,clippedSurrogate,reductionWeights,binarySampling,finiteSampleMetric,samplingArea,datasetSamplingArea,ptgsTemperature,ptgsPosterior,updateEvidence,entropyControl,bellmanSweep,bellmanTrace,sequenceRatios,conditionalKL} from "../site/readers/rl-model.js";
let cases=0;
const near=(a,b,tolerance=1e-9)=>{assert.ok(Math.abs(a-b)<=tolerance*Math.max(1,Math.abs(a),Math.abs(b)),String(a)+" != "+String(b));};
for(let g=2;g<=16;g++)for(let successes=0;successes<=g;successes++){
 const rewards=Array.from({length:g},(_,i)=>i<successes?1:0),m=groupAdvantages(rewards),p=successes/g;
 near(m.mean,p);near(m.std,Math.sqrt(p*(1-p)));near(m.centered.reduce((s,x)=>s+x,0),0);near(m.normalized.reduce((s,x)=>s+x,0),0);
 m.rloo.forEach((a,i)=>near(a,rewards[i]-rewards.filter((_,j)=>i!==j).reduce((s,x)=>s+x,0)/(g-1)));
 const shifted=groupAdvantages(rewards.map(x=>x+100));m.centered.forEach((a,i)=>near(a,shifted.centered[i]));
 if(!successes||successes===g)assert.ok(m.normalized.every(x=>x===0));
 cases++;
}
assert.equal(groupAdvantages([7]).rloo,null);
for(const a of [-2,-.25,0,.25,2])for(let j=1;j<=400;j++){
 const r=j/100,m=clippedSurrogate(r,a),h=1e-6;
 const reference=a>0?a*Math.min(r,1.2):a<0?a*Math.max(r,.8):0;
 near(m.objective,reference);
 if(!m.kink){
 const numerical=(clippedSurrogate(r*Math.exp(h),a).objective-clippedSurrogate(r*Math.exp(-h),a).objective)/(2*h);
 near(m.logRatioGradient,numerical,2e-8);
 }
 cases++;
}
assert.equal(clippedSurrogate(3,-1).active,false);
near(clippedSurrogate(3,-1).logRatioGradient,-3);
assert.equal(clippedSurrogate(.1,1).active,false);
assert.equal(clippedSurrogate(3,1).active,true);
assert.equal(clippedSurrogate(.1,-1).active,true);
for(let short=1;short<=16;short++)for(let long=short;long<=32;long++){
 const lengths=[short,long],response=reductionWeights(lengths,"response",32),token=reductionWeights(lengths,"token",32),fixed=reductionWeights(lengths,"fixed",32);
 response.responseMass.forEach(x=>near(x,.5));near(response.totalMass,1);
 near(token.totalMass,1);near(token.responseMass[1],long/(short+long));
 near(fixed.totalMass,(short+long)/64);fixed.perToken.forEach(x=>near(x,1/64));
 cases++;
}
for(let k=1;k<=12;k++)for(const p of [0,.01,.1,.3,.5,.7,.9,.99,1]){
 // Independent enumeration of all binary outcome strings, not another closed form.
 let coverage=0,consistency=0,mixed=0,total=0;
 for(let mask=0;mask<2**k;mask++){
 let successes=0;for(let i=0;i<k;i++)successes+=(mask>>i)&1;
 const mass=p**successes*(1-p)**(k-successes);total+=mass;
 if(successes)coverage+=mass;if(successes===k)consistency+=mass;if(successes&&successes<k)mixed+=mass;
 }
 const m=binarySampling(p,k);near(total,1);near(m.coverage,coverage);near(m.consistency,consistency);near(m.mixed,mixed);
 assert.ok(m.entropy>=0&&m.entropy<=1);cases++;
}
near(binarySampling(1e-20,16).coverage,16e-20,1e-30);
for(let n=1;n<=10;n++)for(let c=0;c<=n;c++)for(let k=1;k<=n;k++){
 let total=0,covered=0,consistent=0;
 for(let mask=0;mask<2**n;mask++){
 let size=0,successes=0;for(let i=0;i<n;i++)if((mask>>i)&1){size++;if(i<c)successes++;}
 if(size!==k)continue;total++;if(successes)covered++;if(successes===k)consistent++;
 }
 const m=finiteSampleMetric(n,c,k);near(m.coverage,covered/total);near(m.consistency,consistent/total);cases++;
}
const broad=[.4,.4],concentrated=[.9,0],average=(ps,k)=>ps.reduce((s,p)=>s+binarySampling(p,k).coverage/ps.length,0);
assert.ok(average(concentrated,1)>average(broad,1));assert.ok(average(concentrated,10)<average(broad,10));
near(average(broad,10),1-.6**10);near(average(concentrated,10),(1-.1**10)/2);
assert.equal(samplingArea([1,1,1]).normalized,null);
near(samplingArea([.25,.5,.75]).area,.75);near(samplingArea([.25,.5,.75]).normalized,.5);
for(let a=0;a<=10;a++)for(let b=0;b<=10;b++){
 const ps=[a/10,b/10],curves=ps.map(p=>Array.from({length:5},(_,k)=>1-(1-p)**(k+1)));
 const out=datasetSamplingArea(curves),mean=Array.from({length:5},(_,k)=>((1-(1-ps[0])**(k+1))+(1-(1-ps[1])**(k+1)))/2);
 out.curve.forEach((p,k)=>near(p,mean[k]));
 const area=mean.slice(0,-1).reduce((sum,p)=>sum+mean[4]-p,0);
 near(out.area,area);if(mean[0]===1)assert.equal(out.normalized,null);else near(out.normalized,area/(4*(1-mean[0])));
 cases++;
}
const mixedCurves=[[.2,.36],[.8,.96]],datasetMetric=datasetSamplingArea(mixedCurves);
near(datasetMetric.normalized,.32);near(mixedCurves.reduce((sum,c)=>sum+samplingArea(c).normalized/2,0),.5);
assert.throws(()=>datasetSamplingArea([]));assert.throws(()=>datasetSamplingArea([[.1,.2],[.2,.3,.4]]));
assert.throws(()=>datasetSamplingArea([[.2,.1]]));assert.throws(()=>datasetSamplingArea([[1.1,1.2]]));
assert.equal(datasetSamplingArea(Array.from({length:10},()=>[1,1,1])).normalized,null);
for(const q of [.01,.1,.5,.9,.99])for(const tau of [1,1.5,3])for(let j=0;j<=100;j++){
 const p=j/100,m=ptgsTemperature(p,q,tau);
 assert.ok(m.temperature>=m.minimum-1e-10&&m.temperature<=m.maximum+1e-10);
 near(ptgsTemperature(0,q,tau).temperature,tau);near(ptgsTemperature(1,q,tau).temperature,1/tau);near(ptgsTemperature(q,q,tau).temperature,1);
 if(j)assert.ok(m.temperature<=ptgsTemperature((j-1)/100,q,tau).temperature+1e-10);
 cases++;
}
for(let s=0;s<=10;s++)for(let f=0;f<=10;f++)for(const q of [.2,.5,.8]){
 const m=ptgsPosterior(s,f,q);near(m.mean,(2*q+s)/(2+s+f));assert.ok(m.variance>0);
 for(const gamma of [0,.5,1]){
 const updated=updateEvidence(s,f,3,8,gamma);near(updated.successes,gamma*s+3);near(updated.failures,gamma*f+5);
 }
 cases++;
}
near(entropyControl(.1,1,2),.12);near(entropyControl(.1,2,1),.08);near(entropyControl(.1,1,1),.1);
near(entropyControl(0,2,1),0);near(entropyControl(.5,1,2),.5);
const trace=bellmanTrace(4,.9);
assert.deepEqual(trace.map(x=>x.values),[[0,0,0],[.4,1,0],[.9,1,0],[.9,1,0],[.9,1,0]]);
assert.equal(trace[1].actions[0],"cash out");assert.equal(trace[2].actions[0],"continue");
for(let j=0;j<100;j++){
 const gamma=j/100,x=[j/5,j/7,123],y=[-j/4,j/9,-456],a=bellmanSweep(x,gamma),b=bellmanSweep(y,gamma);
 assert.equal(a.values[2],0);
 assert.ok(Math.max(...a.values.map((v,i)=>Math.abs(v-b.values[i])))<=gamma*Math.max(...x.map((v,i)=>Math.abs(v-y[i])))+1e-10);
 cases++;
}
for(const call of [
 ()=>groupAdvantages([]),()=>groupAdvantages([NaN]),()=>groupAdvantages([1],0),()=>clippedSurrogate(0,1),()=>clippedSurrogate(1,1,1.1,2),
 ()=>reductionWeights([0]),()=>reductionWeights([129],"fixed",128),()=>reductionWeights([2],"bogus"),
 ()=>binarySampling(-.1,2),()=>binarySampling(.5,0),()=>finiteSampleMetric(3,4,2),()=>finiteSampleMetric(3,1,4),
 ()=>samplingArea([.5,.4]),()=>samplingArea([1]),()=>ptgsTemperature(.5,0),()=>ptgsTemperature(.5,.5,.9),
 ()=>ptgsPosterior(-1,0),()=>updateEvidence(0,0,3,2),()=>updateEvidence(0,0,1,2,2),()=>entropyControl(.6,1,2),
 ()=>bellmanTrace(3,1),()=>bellmanSweep([1,2]),()=>bellmanTrace(1001)
]){assert.throws(call,RangeError);cases++;}
for(let j=1;j<100;j++){
 const p=j/100,q=(101-j)/102,m=conditionalKL([p,1-p],[q,1-q]);
 near(m.forward,m.expectedEstimator);assert.ok(m.samples.every(x=>x>=-1e-14));
 const x=sequenceRatios([Math.log(p/q),Math.log((1-p)/(1-q))]);
 near(x.product,p/q*(1-p)/(1-q));near(x.geometricMean**2,x.product);cases++;
}
// Expected Bernoulli score-gradient: group mean includes self, RLOO does not.
for(let g=2;g<=8;g++)for(const p of [.1,.3,.5,.8]){
 let centeredGradient=0,rlooGradient=0;
 for(let mask=0;mask<2**g;mask++){
 const r=Array.from({length:g},(_,i)=>(mask>>i)&1),successes=r.reduce((s,x)=>s+x,0),mass=p**successes*(1-p)**(g-successes),a=groupAdvantages(r);
 centeredGradient+=mass*a.centered.reduce((s,x,i)=>s+x*(r[i]-p)/g,0);
 rlooGradient+=mass*a.rloo.reduce((s,x,i)=>s+x*(r[i]-p)/g,0);
 }
 near(centeredGradient,(1-1/g)*p*(1-p));near(rlooGradient,p*(1-p));cases++;
}
assert.throws(()=>conditionalKL([0,1],[.5,.5]),RangeError);
assert.throws(()=>conditionalKL([.4,.4],[.5,.5]),RangeError);
assert.throws(()=>sequenceRatios([]),RangeError);
assert.throws(()=>sequenceRatios([Infinity]),RangeError);
const large=sequenceRatios([1000,1000]);assert.equal(large.product,Infinity);assert.equal(large.logProduct,2000);
// Prefix correction is exact for prefix-measurable Q, not a terminal reward
// still sampled under a different suffix policy. R=a1*a2; first-token logit gradient.
let full=0,prefixOutcome=0,prefixQ=0;
for(const a1 of [0,1])for(const a2 of [0,1]){
 const behavior=.5*(a2?.2:.8),suffixRatio=(a2?.8:.2)/(a2?.2:.8),score=a1-.5;
 full+=behavior*suffixRatio*a1*a2*score;
 prefixOutcome+=behavior*a1*a2*score;
 prefixQ+=behavior*a1*.8*score;
}
near(full,.2);near(prefixOutcome,.05);near(prefixQ,.2);cases++;
console.log("RL analytical models: "+cases+" cases passed (not an integrated reader or production audit).");
