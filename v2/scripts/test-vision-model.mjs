import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {visionSoftmax,visionPatchLoss,visionAgreement,visionECF,visionSIGReg,visionQuadrature,visionProjectedLaw,visionExpectedECFError} from '../prototypes/readers/vision-model.js';
let cases=0;const near=(x,y,t=1e-9)=>assert.ok(Math.abs(x-y)<t,[x,y,t]);const perturb=(x,i,j,delta)=>x.map((row,k)=>row.map((v,l)=>v+(i===k&&j===l?delta:0)));
const logits=[[2,-1,0],[0,1,3],[-2,2,0],[1,1,1]],teacher=[[.7,.2,.1],[.1,.6,.3],[.2,.3,.5],[0,0,1]];
for(let mask=0;mask<16;mask++)for(const scope of ['masked','all'])for(const temperature of [.1,.5,1,2,10]){
 const masked=logits.map((_,i)=>Boolean(mask&(1<<i))),x=visionPatchLoss(logits,teacher,masked,scope,temperature),selected=logits.map((_,i)=>i).filter(i=>scope==='all'||masked[i]);near(x.denominator,selected.length);
 let expected=0;for(const i of selected){const z=logits[i].map(v=>Math.exp(v/temperature)),sum=z.reduce((s,v)=>s+v,0);expected+=-teacher[i].reduce((s,q,j)=>s+(q?q*Math.log(z[j]/sum):0),0)/selected.length;}near(x.loss,expected);
 for(let i=0;i<4;i++)for(let j=0;j<3;j++){const h=1e-5,fd=(visionPatchLoss(perturb(logits,i,j,h),teacher,masked,scope,temperature).loss-visionPatchLoss(perturb(logits,i,j,-h),teacher,masked,scope,temperature).loss)/(2*h);near(x.gradient[i][j],fd,2e-7);}
 for(const row of x.gradient)near(row.reduce((s,v)=>s+v,0),0);if(scope==='all')near(x.loss,visionPatchLoss(logits,teacher,[false,false,false,false],'all',temperature).loss);cases++;
}
for(const temp of [.01,.1,1,10]){const s=visionSoftmax([10000,9999,-10000],temp);near(s.probabilities.reduce((a,b)=>a+b,0),1);assert.ok(s.logProbabilities.every(Number.isFinite));assert.deepEqual(s,visionSoftmax([0,-1,-20000],temp));cases++;}
// Exact decomposition: pairwise global-to-all = centered + global variance.
for(let seed=0;seed<60;seed++)for(let g=1;g<=3;g++){
 const views=Array.from({length:3},(_,v)=>Array.from({length:2},(_,n)=>Array.from({length:2},(_,d)=>Math.sin(seed+v*7+n*3+d))));const x=visionAgreement(views,g);near(x.pairwise,x.centered+x.globalVariance);
 for(let v=0;v<3;v++)for(let n=0;n<2;n++)for(let d=0;d<2;d++){const h=1e-5,changed=delta=>views.map((view,w)=>w===v?perturb(view,n,d,delta):view);near(x.gradient[v][n][d],(visionAgreement(changed(h),g).centered-visionAgreement(changed(-h),g).centered)/(2*h),1e-8);}
 // Translating all views preserves the loss. The sum of all derivatives is zero per coordinate.
 near(visionAgreement(views.map(view=>view.map(row=>row.map(x=>x+7))),g).centered,x.centered);for(let d=0;d<2;d++)near(x.gradient.reduce((s,view)=>s+view.reduce((a,row)=>a+row[d],0),0),0);cases++;
}
const counter=visionAgreement([[[-1]],[[1]]],2);near(counter.centered,1);near(counter.pairwise,2);near(counter.globalVariance,1);
assert.equal(visionAgreement([[[3]],[[3]],[[3]]],2).centered,0);
const samples=[[-1,.5],[0,-1],[1,2],[2,-.5]],directions=[[1,0],[0,1],[Math.SQRT1_2,Math.SQRT1_2]];
for(const knots of [2,5,17,33])for(const limit of [1,3,5])for(const scaled of [false,true]){
 const x=visionSIGReg(samples,directions,{knots,limit,scaled});near(visionQuadrature(knots,limit).reduce((s,q)=>s+q.weight,0),2*limit);assert.ok(x.loss>=0);
 for(let i=0;i<samples.length;i++)for(let j=0;j<2;j++){const h=1e-5,fd=(visionSIGReg(perturb(samples,i,j,h),directions,{knots,limit,scaled}).loss-visionSIGReg(perturb(samples,i,j,-h),directions,{knots,limit,scaled}).loss)/(2*h);near(x.gradient[i][j],fd,3e-8);}
 for(const slice of x.slices){let integral=0;for(let k=0;k<knots-1;k++){const a=slice.frequencies[k],b=slice.frequencies[k+1];integral+=(b.t-a.t)*(a.target*a.error+b.target*b.error);}near(slice.loss,integral*(scaled?samples.length:1));}
 near(x.loss,visionSIGReg(samples.map(row=>row.map(v=>-v)),directions,{knots,limit,scaled}).loss);near(x.loss,visionSIGReg(samples,directions.map(row=>row.map(v=>-v)),{knots,limit,scaled}).loss);cases++;
}
for(let degree=0;degree<=180;degree++)for(let k=0;k<=30;k++)for(const family of ['gaussian','cross','square','collapsed']){
 const t=k/10,x=visionProjectedLaw(family,degree,t);near(x.direction.reduce((s,v)=>s+v*v,0),1);assert.ok(x.real>=-1-1e-12&&x.real<=1+1e-12);near(x.error,(x.real-x.target)**2);near(x.real,visionProjectedLaw(family,degree,-t).real);if(family==='gaussian')near(x.error,0);if(t===0)near(x.real,1);cases++;
}
for(const t of [.1,.5,1,2,3]){near(visionProjectedLaw('cross',0,t).real,Math.exp(-t*t/2));near(visionProjectedLaw('cross',90,t).real,Math.exp(-t*t/2));near(visionProjectedLaw('cross',45,t).real,(1+Math.exp(-t*t))/2);assert.ok(visionProjectedLaw('cross',45,t).error>0);cases++;}
// Exhaustively average the squared empirical CF error over all binary sample draws.
for(let n=1;n<=6;n++)for(const t of [.2,1,2]){
 const target={real:Math.exp(-t*t/2),imaginary:0};let exact=0;for(let bits=0;bits<2**n;bits++){const a=Array.from({length:n},(_,i)=>bits&(1<<i)?1:-1),c=visionECF(a,t);exact+=((c.real-target.real)**2+c.imaginary**2)/(2**n);}near(exact,visionExpectedECFError({real:Math.cos(t),imaginary:0},n,target));cases++;
}
for(const fn of [()=>visionPatchLoss([[1]],[[.9]],[true]),()=>visionPatchLoss([[1]],[[1]],[1]),()=>visionSoftmax([1],0),()=>visionAgreement([[[1]],[[1,2]]]),()=>visionAgreement([[[1]]],2),()=>visionSIGReg([[1]],[[2]]),()=>visionSIGReg([[1]],[[1]],{knots:1}),()=>visionECF([],1),()=>visionProjectedLaw('bad',0,1),()=>visionExpectedECFError({real:2,imaginary:0},1,{real:1,imaginary:0})])assert.throws(fn,RangeError);
const plan=JSON.parse(await readFile(new URL('../../.internal/v2/dense-preservation.json',import.meta.url),'utf8'));for(const slug of plan.topics.find(t=>t.slug==='models/vision').sources){const row=plan.sourceLedger.find(x=>x.originalSlug===slug);assert.equal(createHash('sha256').update(await readFile(new URL('../../'+row.source,import.meta.url))).digest('hex'),row.sha256);}
assert.throws(()=>visionSoftmax([1e308,-1e308]),RangeError);assert.throws(()=>visionECF([1e308],3),RangeError);
console.log('Vision foundations: '+cases+' mask/gradient/quadrature/projection/finite-sample cases; all eleven source fingerprints unchanged. Reader integration checked separately.');
