import {assertGeneratedMarkup,assertGeneratedMarkupCount} from './check-generated-markup.mjs';
import './test-consistency-reference.mjs';
import './test-consistency-implementation.mjs';
import './test-sid-gradient.mjs';
import './test-sid-recipe.mjs';
import './test-sid-implementation.mjs';
import './test-fgm-reference.mjs';
import './test-shortcut-reference.mjs';
import assert from 'node:assert/strict';
import './test-diffusion-notation.mjs';
import {readFile} from 'node:fs/promises';
import {ancestralStep,ddimStep,langevinStep,vpMarginal,progressiveTarget,consistencyPair,forwardMoments,reversePosterior,parameterization,mixtureScore,gaussianFlow,solverTrace,shortcutIdentity,progressiveSchedule} from '../site/readers/diffusion-model.js';
import {forwardBody,scoreBody,flowBody,solverBody} from '../site/readers/diffusion-scenes.js';
import {diffusionMeta,diffusionAliases,diffusionSections,diffusionReader} from '../site/readers/diffusion.js';
import {readerMetas,renderDenseReader} from '../site/readers/index.js';
import {reviewedNavigation} from '../site/reviewed-navigation.js';
import {rank} from '../site/search.js';
const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<tol,[a,b]);let cases=0;
for(const t of [.1,1,2,8])for(const fraction of [.1,.5,.9])for(const data of [-2,0,3])for(const z of [-1,0,2]){
 const s=t*fraction,pair=consistencyPair(data,z,t,s);
 near(pair.high,data+t*z);near(pair.low,data+s*z);
 near(pair.eulerLow,pair.low);near(pair.conditionalScore,(data-pair.high)/(t*t));cases++;
}
for(const args of [[0,0,1,0],[0,0,1,1],[0,0,1,2],[NaN,0,2,1]])assert.throws(()=>consistencyPair(...args),RangeError);
// Gaussian posterior quadrature: the conditional estimator's mean is the
// marginal score, but averaging a squared endpoint loss adds variance.
for(const t of [.1,1,2,8])for(const fraction of [.1,.5,.9])for(const high of [-2,0,3]){
 const s=t*fraction,posteriorMean=high/(1+t*t),posteriorStd=t/Math.sqrt(1+t*t);
 const pairs=[-1,1].map(sign=>{
  const data=posteriorMean+sign*posteriorStd;
  return consistencyPair(data,(high-data)/t,t,s);
 });
 const score=-high/(1+t*t),euler=high+(s-t)*(-t*score);
 near(pairs.reduce((sum,p)=>sum+p.conditionalScore,0)/2,score);
 near(pairs.reduce((sum,p)=>sum+p.low,0)/2,euler);
 const mse=pairs.reduce((sum,p)=>sum+(high-p.low)**2,0)/2;
 near(mse-(high-euler)**2,(t-s)**2/(1+t*t));cases++;
}
near(consistencyPair(1,1,2,1).low,2);near(3-2*(3/5),1.8);
near(3*Math.sqrt(2/5),1.8973665961010275);
// Released finite-bound final step returns clean prediction, not the DDIM state.
// Independent scalar transcription; no JAX/checkpoint execution is implied.
const alphaFromLogSnr=l=>1/(1+Math.exp(-l));
for(const bound of [4,10,20])for(const x of [-2,0,3])for(const clean of [-1,.2,2]){
 const T=alphaFromLogSnr(-bound),S=alphaFromLogSnr(bound);
 const eps=(x-Math.sqrt(T)*clean)/Math.sqrt(1-T);
 const ordinary=ddimStep(T,S,x,eps).next;
 near(ordinary,Math.sqrt(S)*clean+Math.sqrt(1-S)*eps);
 assert.ok(Math.abs(ordinary-clean)>1e-12,'Finite endpoint is not exact clean data');
 // The lowest-index training override targets clean, so final inference agrees.
 const teacherFinal=clean,studentFinal=teacherFinal;
 near(studentFinal,clean);cases++;
}
for(const n of [1,2,4,64])for(let i=0;i<n;i++){
 const t=(i+1)/n,u=t-.5/n,s=t-1/n;
 near(t-u,.5/n);near(u-s,.5/n);assert(s>=0);cases++;
}
// Reconstruct two teacher clean-prediction steps independently of the target kernel.
for(const T of [0,.01,.25,.5,.81])for(const fraction of [.1,.6,1])for(const x of [-2,0,1])for(const p of [-1,0,2])for(const q of [-2,.5,1.5]){
 const S=T+(1-T)*fraction,U=(T+S)/2;
 const aT=Math.sqrt(T),aU=Math.sqrt(U),aS=Math.sqrt(S);
 const sigmaT=Math.sqrt(1-T),sigmaU=Math.sqrt(1-U),sigmaS=Math.sqrt(1-S);
 const first=aU*p+sigmaU*(x-aT*p)/sigmaT;
 const second=aS*q+sigmaS*(first-aU*q)/sigmaU;
 const target=progressiveTarget(T,S,x,second);
 const w1=sigmaS/sigmaU*(aU-sigmaU/sigmaT*aT);
 const w2=aS-sigmaS/sigmaU*aU,den=aS-sigmaS/sigmaT*aT;
 near(target.clean,(w1*p+w2*q)/den);near((w1+w2)/den,1);
 near(target.next,second);near(aS*target.clean+sigmaS*(x-aT*target.clean)/sigmaT,second);
 if(S===1)near(target.clean,second);cases++;
}
for(const args of [[-.1,.5,1,1],[.5,.5,1,1],[.5,.4,1,1],[0,1.1,1,1],[1,1,1,1],[0,.5,NaN,1]])assert.throws(()=>progressiveTarget(...args),RangeError);
for(const B of [0,1e-12,.001,.1,Math.log(2),1,5,50])for(const clean of [-2,0,2]){
 const vp=vpMarginal(B,clean),sub=vpMarginal(B,clean,'sub-vp');
 near(vp.mean,Math.sqrt(Math.exp(-B))*clean);near(sub.mean,vp.mean);
 near(vp.variance,1-Math.exp(-B));
 // Integrate the sub-VP noise kernel in closed form, separately from v².
 near(sub.variance,1+Math.exp(-2*B)-2*Math.exp(-B));
 assert(sub.variance<=vp.variance);cases++;
}
near(vpMarginal(Math.log(2),2).variance,.5);near(vpMarginal(Math.log(2),2,'sub-vp').variance,.25);
for(const args of [[-1,0],[NaN,0],[1,Infinity],[1,0,'ve']])assert.throws(()=>vpMarginal(...args),RangeError);
// Exhaust every two-dimensional sign probe; do not treat one draw as exact.
// Bayes score decomposition for a separately conditioned noisy Gaussian.
for(const v of [.25,1,4])for(const observationVar of [.1,1,3])for(const a of [.1,.5,1])for(const noiseVar of [.01,1,4])for(const x of [-2,0,3])for(const y of [-1,2]){
 const marginalVar=a*a*v+noiseVar,c=a*v/marginalVar;
 const likelihoodVar=v+observationVar-a*a*v*v/marginalVar;
 const sum=-x/marginalVar+c*(y-c*x)/likelihoodVar;
 const posteriorMean=a*v*y/(v+observationVar),posteriorVar=noiseVar+a*a*v*observationVar/(v+observationVar);
 near(sum,(posteriorMean-x)/posteriorVar,1e-8);cases++;
}
for(const a of [-2,0,2])for(const b of [-3,0,3])for(const c of [-1,0,4])for(const d of [-2,0,5]){
 const values=[];
 for(const x of [-1,1])for(const y of [-1,1])values.push(x*(a*x+b*y)+y*(c*x+d*y));
 near(values.reduce((s,v)=>s+v,0)/4,a+d);
 near(values.reduce((s,v)=>s+(v-a-d)**2,0)/4,(b+c)**2);
 cases++;
}
assert.deepEqual([-1,1].flatMap(x=>[-1,1].map(y=>2+3*x*y)),[5,-1,-1,5]);
// Independent zero-mean,unit-variance draws reproduce Gaussian second moments.
// This is deterministic quadrature, not a neural sampling experiment.
for(const variance of [.25,.5,1,4])for(const ratio of [.01,.1,.5,1,1.9,2,2.1]){
 const h=ratio*variance,values=[];
 for(const sx of [-1,1])for(const z of [-1,1]){
  const x=sx*Math.sqrt(variance);values.push(langevinStep(x,-x/variance,h,z));
 }
 near(values.reduce((a,b)=>a+b,0)/4,0);
 near(values.reduce((a,b)=>a+b*b,0)/4,variance+h*h/variance);
 cases++;
}
near([-1,1].flatMap(x=>[-1,1].map(z=>langevinStep(x,-x,.1,z))).reduce((a,b)=>a+b*b,0)/4,1.01);
for(const args of [[0,0,0,0],[0,0,-1,0],[NaN,0,.1,0],[0,Infinity,.1,0]])assert.throws(()=>langevinStep(...args),RangeError);
for(const t of [.001,.01,.1,.25,.5])for(const s of [.6,.8,1])for(const x of [-3,0,1,4])for(const eps of [-2,0,.5,3]){
 const step=ddimStep(t,s,x,eps),middle=(t+s)/2;
 // Independent Euler update in x/sqrt(abar), with noise amplitude as time.
 const normalized=x/Math.sqrt(t)+(Math.sqrt((1-s)/s)-Math.sqrt((1-t)/t))*eps;
 near(step.next,Math.sqrt(s)*normalized,1e-8);
 near(step.next,ddimStep(middle,s,ddimStep(t,middle,x,eps).next,eps).next,1e-8);
 if(s===1){near(step.next,step.clean);near(step.noise,0);}
 cases++;
}
for(const args of [[0,.6,0,0],[1,1,0,0],[.5,.4,0,0],[.5,1.1,0,0],[.5,.6,Infinity,0]])assert.throws(()=>ddimStep(...args),RangeError);
near(ddimStep(.25,.64,1,.5).next,1.207179676972449);
assert.ok(Math.abs(ddimStep(.25,.64,1,.5).next-ancestralStep(.64,1-.25/.64,1,.5,0).mean)>.1);
// Released compute_alpha prepends beta=0 and gathers at index+1.
// Scalar transcription only; this does not execute PyTorch/checkpoints.
const betas=[.01,.03,.02,.1,.15],cumulative=[1];
for(const beta of betas)cumulative.push(cumulative.at(-1)*(1-beta));
const alphaAt=index=>cumulative[index+1];
near(alphaAt(-1),1);
for(let t=0;t<betas.length;t++)for(let s=-1;s<t;s++)for(const x of [-2,0,3])for(const eps of [-1,.5,2]){
 const at=alphaAt(t),as=alphaAt(s),clean=(x-eps*Math.sqrt(1-at))/Math.sqrt(at);
 near(ddimStep(at,as,x,eps).next,Math.sqrt(as)*clean+Math.sqrt(1-as)*eps);
 if(s===-1)near(ddimStep(at,as,x,eps).next,clean);
 cases++;
}
const uniformStride=Math.floor(1000/60),uniform=[];
for(let i=0;i<1000;i+=uniformStride)uniform.push(i);
assert.equal(uniform.length,63);assert.equal(uniform.at(-1),992);
const quad=Array.from({length:60},(_,i)=>Math.floor((Math.sqrt(800)*i/59)**2));
assert.ok(new Set(quad).size<quad.length,'Rounded released quadratic sequence can repeat');
for(const prev of [1,.9,.5,.01])for(const beta of [.0001,.01,.1,.5])for(const x0 of [-2,0,3])for(const eps of [-1,0,2])for(const z of [-3,0,4])for(const mode of ['posterior','beta']){
 const abar=prev*(1-beta),x=Math.sqrt(abar)*x0+Math.sqrt(1-abar)*eps;
 const step=ancestralStep(prev,beta,x,eps,z,mode),posterior=reversePosterior(prev,beta,x,x0);
 near(step.mean,posterior.mean,1e-8);near(step.variance,mode==='beta'?beta:posterior.variance);
 near(step.noiseStd,prev===1?0:Math.sqrt(step.variance));near(step.next,posterior.mean+step.noiseStd*z,1e-8);cases++;
}
for(const args of [[0,.1,0,0,0],[1,0,0,0,0],[1,1,0,0,0],[1,.1,NaN,0,0],[1,.1,0,0,0,'unknown']])assert.throws(()=>ancestralStep(...args),RangeError);
// Independently transcribe the released sampler's coefficient operations.
// This checks scalar arithmetic, not execution of TensorFlow or a checkpoint.
let clippedDifferences=0;
for(const prev of [1,.9,.5,.01])for(const beta of [.0001,.01,.1,.5])for(const x of [-3,-.2,0,.8,3])for(const eps of [-2,0,2]){
 const alpha=1-beta,abar=prev*alpha;
 const clean=Math.sqrt(1/abar)*x-Math.sqrt(1/abar-1)*eps;
 const c1=beta*Math.sqrt(prev)/(1-abar),c2=(1-prev)*Math.sqrt(alpha)/(1-abar);
 const step=ancestralStep(prev,beta,x,eps,0);
 near(step.mean,c1*clean+c2*x,1e-8);
 const clipped=c1*Math.max(-1,Math.min(1,clean))+c2*x;
 if(Math.abs(clean)<=1)near(clipped,step.mean,1e-8);
 else {assert.ok(Math.abs(clipped-step.mean)>1e-10);clippedDifferences++;}
 if(prev===1){near(clipped,Math.max(-1,Math.min(1,clean)));near(step.noiseStd,0);}
 cases++;
}
assert.ok(clippedDifferences>0,'Clipping can change the mean; do not claim released-sampler parity');
for(const beta of [.0001,.01,.08,.2,.7]){let mean=2,variance=0,abar=1;for(let t=0;t<=200;t++){const m=forwardMoments(t,beta);near(m.mean,mean);near(m.variance,variance);near(m.abar,abar);near(m.a*m.a+m.sigma*m.sigma,1);mean*=Math.sqrt(1-beta);variance=(1-beta)*variance+beta;abar*=1-beta;cases++;}}
for(const prev of [1,.9,.5,.01])for(const beta of [.01,.1,.5])for(const xt of [-3,0,2])for(const x0 of [-2,1]){
 const m=reversePosterior(prev,beta,xt,x0);if(prev===1){near(m.mean,x0);near(m.variance,0);}else{const precision=1/(1-prev)+(1-beta)/beta;near(m.variance,1/precision);near(m.mean,(Math.sqrt(prev)*x0/(1-prev)+Math.sqrt(1-beta)*xt/beta)/precision);}cases++;
}
for(let j=1;j<100;j++)for(const x0 of [-2,0,3])for(const eps of [-1,0,2]){const m=parameterization(j/100,x0,eps);near(m.x0FromV,x0);near(m.epsFromV,eps);near((m.xt-m.sigma*eps)/m.a,x0);near(m.conditionalScore,(m.a*x0-m.xt)/m.sigma**2);cases++;}
for(let xi=-30;xi<=30;xi++)for(let si=25;si<=200;si++){
 const x=xi/10,sigma=si/100,m=mixtureScore(x,sigma),ratio=Math.exp(4*x/sigma**2),pPlus=ratio/(1+ratio);
 near(m.posterior[1],pPlus);near(m.posterior[0]+m.posterior[1],1);near(m.mean,4*pPlus-2);near(m.tweedie,m.mean);
 const h=1e-5,derivative=(mixtureScore(x+h,sigma).logDensity-mixtureScore(x-h,sigma).logDensity)/(2*h);
 near(m.score,derivative,1e-7);cases++;
}
for(let k=0;k<=40;k++)for(const z of [-2,0,1,3]){const m=gaussianFlow(k/10,z);near(m.endpoint,z);near(m.x*m.x,z*z*m.variance);near(m.posteriorMean,m.x/(1+k/10));near(m.reverseDrift,2*m.velocity);cases++;}
for(let n=1;n<=64;n++)for(const kind of ['euler','heun']){const m=solverTrace(n,kind),h=1/n,expected=(kind==='euler'?1-h:1-h+h*h/2)**n;near(m.value,expected);assert.equal(m.nfe,n*(kind==='euler'?1:2));near(m.error,Math.abs(expected-Math.exp(-1)));assert.equal(m.points.length,n+1);cases++;}
for(let k=1;k<=50;k++)for(const x of [-2,0,3]){const m=shortcutIdentity(x,0,k/100);near(m.long,m.second);near(m.longVelocity,(m.shortVelocity+m.nextVelocity)/2);cases++;}
for(let n=0;n<=12;n++){const m=progressiveSchedule(2**n);assert.equal(m.length,n+1);assert.equal(m.at(-1),1);cases++;}
for(const fn of [()=>forwardMoments(-1),()=>forwardMoments(1,1),()=>forwardMoments(.5),()=>reversePosterior(0,.1,1,1),()=>parameterization(0,1,1),()=>mixtureScore(1,0),()=>gaussianFlow(5),()=>solverTrace(0),()=>solverTrace(2,'rk'),()=>shortcutIdentity(1,0,1),()=>progressiveSchedule(3)])assert.throws(fn,RangeError);
let states=0;const check=body=>{assertGeneratedMarkup(body,"test-diffusion.mjs");assert.ok(!/NaN|undefined|Infinity/.test(body));states++;};
for(let i=0;i<=60;i++)check(forwardBody(i));for(let i=-30;i<=30;i++)for(let s=25;s<=200;s++)check(scoreBody(i,s));for(let i=0;i<=40;i++)check(flowBody(i));for(let i=1;i<=32;i++)for(const kind of ['euler','heun'])check(solverBody(i,kind));
const html=diffusionReader(s=>'directions.html?slug='+s),ids=[...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);assert.equal(diffusionSections.length,49);for(const [id]of diffusionSections)assert.ok(ids.includes(id),id);
for(const text of ['Reuse the noise','same vector at neighboring noise levels','Shared noise is not the exact probability-flow path','1.8000','1.8974','not identify each training pair','nonlinear losses exactly equal at finite spacing','inject fresh noise'])assert.ok(html.includes(text),text);
for(const text of ['Sub-VP keeps','Continuous Gaussian corruption choices','1.4142','0.50','0.25','not the total data-population variance','unit population covariance stays unit','practical geometric schedule','For positive finite integrated beta'])assert.ok(html.includes(text),text);
assert.ok(!html.includes('variance gap vanishes only'));
for(const text of ['Square its second output','does not subtract the initial sigma squared','corrector at the current time','last predictor mean','averaged across samples and devices','keeps it fixed throughout the ODE solve','inverse data-scaling correction','sign and scale can be applied twice','different training objectives'])assert.ok(html.includes(text),text);
for(const text of ['Condition the score at the current noise level','only on clean images','terminal conditional distribution','approximation to clean-observation conditioning','Orthogonality preserves','lowest-FID checkpoint','final checkpoint','rows change total score evaluations','interpolation of a model trained at 1,000','not a guarantee that correction always helps'])assert.ok(html.includes(text),text);
assert.equal((html.match(/class="inline-math"/g)||[]).length,45);
for(const text of ['Two teacher updates become one student update','1.4142','1.3359','not data-free','second evaluation at the first predicted state','specializes to its trained grid','fewer evaluations, not fewer parameters','singular there','divergence for noise output','average four seeds','50,000 updates per stage'])assert.ok(html.includes(text),text);
const kernel=ancestralStep.toString().replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
assert(html.includes('<pre tabindex="0" role="region" aria-label="Code example"><code>'+kernel+'</code></pre>'),'Display the actual tested self-contained kernel in a keyboard-scroll surface');
const corrector=langevinStep.toString().replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
for(const text of ['Skilling–Hutchinson','a single draw is not generally exact','either −1 or 5','averages five test-set runs','starred discrete DDPM entries','solver, cutoff or model error'])assert.ok(html.includes(text),text);
assert.ok(html.includes('J=\\begin{pmatrix}2&amp;3\\\\0&amp;0\\end{pmatrix}'));
assert.ok(html.includes('<code>'+corrector+'</code>'));
for(const text of ['halfway in schedule time','lowest-index target','finite-bound DDIM formula','−20 and 20','Evaluation clips the clean estimate','Released target and sampler'])assert.ok(html.includes(text),text);
for(const text of ['does not advance diffusion time','not Heun','does not implement that adaptive rule','variance 1.01','discretization bias'])assert.ok(html.includes(text),text);
assert(html.includes('without fresh noise'));assert(html.includes('separate decoder convention'));
for(const text of ['unclipped equation','clips that estimate','not a universal rule for latent states','zero-based schedule indices','Code index 0','float64','Released DDPM sampling implementation'])assert.ok(html.includes(text),text);
for(const text of ['not as the noisy states themselves','several stochastic completions','not a sampling-speed benchmark','[0, 255] scale','DDPM Figure 5','DDPM Figures 6–7 and 14'])assert.ok(html.includes(text),text);
for(const text of ['joint coupling across levels','separately parameterized levels','finite shared network','limiting construction','1.2072','synthetic scalar calculations'])assert.ok(html.includes(text),text);
for(const text of ['index −1 denotes the clean endpoint','generalized branch does not clip','63 indices, ending at 992','quadratic indices can repeat','actual evaluation count'])assert.ok(html.includes(text),text);
for(const text of ['not exact equality between schedules','50,000 images on one Nvidia 2080 Ti','DDIM Figures 4–5 and 9'])assert.ok(html.includes(text),text);
assert.equal(diffusionMeta.date,'2026-06-11');assert.equal(diffusionMeta.prototype,false);assert.deepEqual(diffusionAliases,[]);assert.equal(renderDenseReader(diffusionMeta.slug,s=>s),diffusionReader(s=>s));assert.equal((html.match(/data-diffusion-lab=/g)||[]).length,4);
for(const text of ['posterior weighting','not numerically identical','same marginal law','not detaching','drops L₁',String.raw`a_t^2+\sigma_t^2=1`,'dt is negative','not, by itself','non-Gaussian mixture','not inherently average','boundary condition','advanced time'])assert.ok(html.includes(text),text);
assert(!html.includes('<summary>Original notes</summary>'));assert(!/href='directions\.html\?slug=ai\/modalities\/diffusion-models\//.test(html));
const catalog=JSON.parse(await readFile(new URL('../site/catalog.json',import.meta.url),'utf8')),notes=[...readerMetas,...catalog.notes.filter(n=>!reviewedNavigation[n.slug])];for(const [,slug]of html.matchAll(/href='directions\.html\?slug=([^'#]+)'/g))assert.ok(notes.some(n=>n.slug===slug),slug);
for(const q of ['DDPM','score identity','consistency','diffusion','Flow Generator Matching'])assert.ok(rank(notes,q).some(r=>r.note===diffusionMeta),q);
const words=html.replace(/<[^>]*>/g,' ').split(/\s+/).length;assert.ok(words>4000,words);
assertGeneratedMarkupCount("test-diffusion.mjs",states);
console.log('Diffusion: '+cases+' independent numerical cases; '+states+' finite rendered states; 49 sections, four scenes, links/search/gradient contracts pass; '+words+' words.');
