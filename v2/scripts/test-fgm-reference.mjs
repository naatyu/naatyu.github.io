import assert from 'node:assert/strict';
import {parseFragment} from 'parse5';
import {fgmMeanCase} from '../prototypes/readers/diffusion-model.js';
import {diffusionReader,diffusionSections} from '../prototypes/readers/diffusion.js';
import {assertGeneratedMarkup} from './check-generated-markup.mjs';
const nodes=[];
function walk(n){nodes.push(n);for(const c of n.childNodes||[])walk(c);}
walk(parseFragment(assertGeneratedMarkup(diffusionReader(()=>''),'FGM reference')));
const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value;
const text=n=>(n.value||'')+(n.childNodes||[]).map(text).join('');
const descendants=(n,tag)=>{const out=[];function visit(x){if(x.tagName===tag)out.push(x);for(const c of x.childNodes||[])visit(c);}visit(n);return out;};
const section=id=>{const n=nodes.find(n=>attr(n,'id')===id);assert(n);assert(diffusionSections.some(([s])=>s===id));return n;};
const path=section('flow-matching'),gradient=section('fgm-gradient'),evidence=section('fgm-evidence');
for(const phrase of ['t=0 is data and t=1 is noise','decreasing t','conditional pairs','equation 3.5 is inconsistent'])assert(text(path).toLowerCase().includes(phrase.toLowerCase()),phrase);
const formulas=descendants(path,'annotation').map(text).join(' ');
assert(formulas.includes(String.raw`\frac{dx_t}{dt}=\epsilon-x_0`));
assert(formulas.includes(String.raw`\frac{x_t-x_0}{t}\quad(0<t<1)`));
for(const phrase of ['our explanatory example','not reported training measurements','fixed auxiliary mean','does not prove that dropping the first term is correct'])assert(text(gradient).includes(phrase),phrase);
const rows=n=>descendants(n,'tr').slice(1).map(r=>descendants(r,'td').map(text));
assert.deepEqual(rows(gradient),[['Ideal moving-field discrepancy','4','4'],['Fixed-auxiliary matching','4','0'],['FGM correction','0','4']]);
assert.deepEqual(rows(evidence),[['Unconditional','3.67','2.93','3.08'],['Conditional','3.66','2.87','2.58']]);
for(const phrase of ['20M training images','logit-normal times','500k synthetic images','omits the first FGM term','different timestep distributions','0.65','0.70','four images per prompt at 1024px','not a measured end-to-end latency ratio'])assert(text(evidence).includes(phrase),phrase);
assert(descendants(evidence,'annotation').map(text).includes(String.raw`\widehat x_0=z-0.97\,v_\theta(0.8z,0.97),\quad z\sim\mathcal N(0,I)`));
const near=(a,b,tol=2e-8)=>assert(Math.abs(a-b)<tol*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
// Four symmetric nodes integrate these degree<=3 Gaussian polynomials exactly.
// Evaluate conditional/marginal fields, rather than transcribing fgmMeanCase.
function quadrature(theta,psi,t){
  const variance=(1-t)**2+t*t,slope=(2*t-1)/variance;
  let naive=0,correction=0,projection=[0,0,0],conditional=[0,0,0];
  for(const z of [-1,1])for(const eps of [-1,1]){
    const generated=theta+z,x=(1-t)*generated+t*eps;
    const teacher=slope*x,aux=slope*x-t*psi/variance,target=eps-generated;
    naive+=(teacher-aux)**2/4;
    correction+=2*(teacher-aux)*(aux-target)/4;
    const trueField=slope*x-t*theta/variance;
    for(let k=0;k<3;k++){projection[k]+=x**k*trueField/4;conditional[k]+=x**k*target/4;}
  }
  for(let k=0;k<3;k++)near(projection[k],conditional[k]);
  return {naive,correction};
}
let cases=0;
for(const theta of [-3,-2,-1,0,1,2,3])for(const psi of [-3,-2,-1,0,1,2,3])for(const t of [.05,.2,.5,.8,.95]){
  const model=fgmMeanCase(theta,psi,t),q=quadrature(theta,psi,t),h=1e-4;
  near(q.naive,model.naive);near(q.correction,model.correction);near(q.naive+q.correction,model.total);
  const upper=quadrature(theta+h,psi,t),lower=quadrature(theta-h,psi,t);
  near((upper.naive-lower.naive)/(2*h),0);
  near((upper.correction-lower.correction)/(2*h),model.correctionGradient);
  const idealAt=a=>quadrature(a,a,t).naive;
  near((idealAt(theta+h)-idealAt(theta-h))/(2*h),model.idealGradient);
  if(theta===psi)near(model.correctionGradient,model.idealGradient);
  cases++;
}
let paths=0;
for(const clean of [-3,0,2])for(const noise of [-1,0,4])for(const t of [.01,.1,.5,.9,.99]){
  const state=s=>(1-s)*clean+s*noise,h=1e-5;
  near((state(t+h)-state(t-h))/(2*h),noise-clean);
  near((state(t)-clean)/t,noise-clean);
  near(state(t)+(noise-clean)*(-.005),state(t-.005));paths++;
}
for(const args of [[0,0,0],[0,0,1],[NaN,0,.5],[0,Infinity,.5],[1e308,0,.5]])assert.throws(()=>fgmMeanCase(...args),RangeError);
console.log(`FGM reference: ${cases} independent Gaussian field/projection/quadrature/gradient cases, ${paths} interpolation derivatives, exact evidence rows and conditions pass; not a neural/benchmark replication.`);
