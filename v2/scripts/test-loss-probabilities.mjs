import assert from 'node:assert/strict';
import {binaryCalibrationFrame,weightedBinaryRisk} from '../prototypes/readers/loss-probabilities.js';
import {crossEntropy,entropy,kl} from '../prototypes/readers/information-model.js';
import {lossesReader,lossSections} from '../prototypes/readers/losses.js';
import {stableBce} from '../prototypes/readers/loss-model.js';
const close=(a,b,tol=1e-9)=>assert(Math.abs(a-b)<tol,`${a} != ${b}`);
const logit=q=>Math.log(q/(1-q));
let cases=0;
for(const w of [.25,.5,1,2,4,9])for(let i=1;i<100;i++){
  const p=i/100,f=binaryCalibrationFrame(w,p),z=logit(f.q),best=weightedBinaryRisk(z,p,w);
  close((weightedBinaryRisk(z+1e-5,p,w)-weightedBinaryRisk(z-1e-5,p,w))/2e-5,0,1e-8);
  close(f.q/(w-(w-1)*f.q),p);
  for(let j=1;j<100;j++){
    const q=j/100,expected=-w*p*Math.log(q)-(1-p)*Math.log1p(-q);
    close(weightedBinaryRisk(logit(q),p,w),expected);
    assert(expected>=best-1e-10);cases++;
  }
}
close(binaryCalibrationFrame(4,.2).q,.5);close(binaryCalibrationFrame(4,.2).threshold,.2);
for(let step=0;step<=80;step++){
  const f=binaryCalibrationFrame(1+step/10);assert(f.q>=.2-1e-12&&f.q<=9/13+1e-12);assert.equal(f.p,.2);cases++;
}
for(const p of [0,.2,.5,1])for(const w of [.5,1,4])for(const z of [-1000,-40,0,40,1000]){
  const eps=1e-4,q=1/(1+Math.exp(-z)),expected=(w*p+1-p)*q-w*p;
  close((weightedBinaryRisk(z+eps,p,w)-weightedBinaryRisk(z-eps,p,w))/(2*eps),expected,1e-7);cases++;
}
assert.equal(binaryCalibrationFrame(3,0).q,0);assert.equal(binaryCalibrationFrame(3,1).q,1);
for(const bad of [0,-1,Infinity,NaN])assert.throws(()=>binaryCalibrationFrame(bad));
assert.throws(()=>binaryCalibrationFrame(1,1.1));assert.throws(()=>weightedBinaryRisk(Infinity,.2,1));
close(stableBce(-1000,1),1000);close(stableBce(0,1),Math.log(2));
const labels=[0,0,0,1,1,2,2,2],p=[3/8,2/8,3/8],q=[.2,.3,.5];
close(labels.reduce((s,y)=>s-Math.log(q[y]),0)/labels.length,crossEntropy(p,q,Math.E));
close(crossEntropy(p,q,Math.E),entropy(p,Math.E)+kl(p,q,Math.E));
close(2**crossEntropy(p,q),Math.exp(crossEntropy(p,q,Math.E)));
const brier=q=>q.reduce((s,v,j)=>s+(v-(j===0?1:0))**2,0);
close(brier([.2,.4,.4]),.96);close(brier([.2,.7,.1]),1.14);close(brier([.2,.8]),1.28);
// Binary Brier is strictly proper despite depending only on the observed probability.
for(let i=1;i<100;i++){const p=i/100;for(let j=1;j<100;j++){const q=j/100;close(2*p*(1-q)**2+2*(1-p)*q*q,2*p*(1-p)+2*(q-p)**2);cases++;}}
const html=lossesReader(s=>'/atlas/'+s);
for(const id of ['empirical-targets','local-log-score','binary-calibration','binary-stability','binary-adversarial']){assert(lossSections.some(([s])=>s===id));assert.equal([...html.matchAll(new RegExp(`id="${id}"`,'g'))].length,1);}
assert(html.includes('/atlas/math/information#wrong-code'));assert(html.includes('/atlas/post-training/distillation'));
assert(html.indexOf('id="proper"')<html.indexOf('id="local-log-score"'));assert(html.indexOf('id="local-log-score"')<html.indexOf('id="gradients"'));
assert(html.includes('outcome-dependent additive constant'));assert(html.includes('generator instead minimizes'));
console.log(`Loss probability preservation: ${cases} independently checked weighted-risk, calibration, saturation and binary-score cases; empirical CE, units, cross-owner links and anchors pass.`);
