import assert from 'node:assert/strict';
import {parseFragment} from 'parse5';
import {diffusionReader,diffusionSections} from '../prototypes/readers/diffusion.js';
import {assertGeneratedMarkup} from './check-generated-markup.mjs';

const nodes=[];
function visit(n){nodes.push(n);for(const child of n.childNodes||[])visit(child);}
visit(parseFragment(assertGeneratedMarkup(diffusionReader(()=>''),'SiD gradient example')));
const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value;
const text=n=>(n.value||'')+(n.childNodes||[]).map(text).join('');
const descendants=(n,tag)=>{const result=[];function walk(x){if(x.tagName===tag)result.push(x);for(const c of x.childNodes||[])walk(c);}walk(n);return result;};
const section=nodes.find(n=>attr(n,'id')==='sid-gradient-example');
assert(section);assert(diffusionSections.some(([id])=>id==='sid-gradient-example'));
for(const phrase of ['constant assigned weight','held fixed during the generator update','does not connect their computation graphs','different, detached adaptive weight','not measured training','retain both denoisers’ input derivatives'])assert(text(section).includes(phrase),phrase);
const rows=descendants(section,'tr').slice(1).map(n=>descendants(n,'td').map(text));
assert.deepEqual(rows,[['Ideal moving-score discrepancy','1','1'],['Naive fixed-auxiliary norm','1','0'],['Fused SiD term','0','0.5']]);
const formulas=descendants(section,'annotation').map(text).join(' ');
for(const tex of [String.raw`v=1+\sigma^2`,String.raw`\frac{\psi\theta-\lambda\psi^2}{v^2}`,String.raw`\left.\partial_\theta L_{\mathrm{naive}}\right|_\psi=0`,String.raw`\frac{\psi}{v^2}`])assert(formulas.includes(tex),tex);
assert(descendants(section,'a').some(n=>attr(n,'href')==='https://arxiv.org/html/2404.04057v2#A4'));
const near=(a,b)=>assert(Math.abs(a-b)<2e-7*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
// Symmetric nodes exactly integrate these degree-two Gaussian polynomials.
// This tests the denoiser expression, not another copy of the closed form.
function objective(theta,psi,sigma,lambda){
  let fused=0,naive=0;
  const v=1+sigma*sigma;
  for(const z of [-1,1])for(const eps of [-1,1]){
    const generated=theta+z,noisy=generated+sigma*eps;
    const teacher=noisy/v,aux=(noisy+psi*sigma*sigma)/v;
    const difference=teacher-aux;
    fused+=((1-lambda)*difference*difference+difference*(aux-generated))/sigma**4/4;
    naive+=difference*difference/sigma**4/4;
  }
  return {fused,naive};
}
let cases=0;
for(const theta of [-3,-2,-1,0,1,2,3])for(const psi of [-3,-2,-1,0,1,2,3])for(const sigma of [.25,.5,1,2,4])for(const lambda of [0,1,1.2]){
  const v=1+sigma*sigma,result=objective(theta,psi,sigma,lambda),h=1e-4;
  near(result.fused,(psi*theta-lambda*psi*psi)/(v*v));
  near(result.naive,psi*psi/(v*v));
  const upper=objective(theta+h,psi,sigma,lambda),lower=objective(theta-h,psi,sigma,lambda);
  near((upper.fused-lower.fused)/(2*h),psi/(v*v));
  near((upper.naive-lower.naive)/(2*h),0);
  near(((theta+h)**2-(theta-h)**2)/(2*h*v*v),2*theta/(v*v));
  cases++;
}
const example=objective(2,2,1,1);
near(example.fused,Number(rows[2][1]));near(example.naive,Number(rows[1][1]));
near((objective(2.0001,2,1,1).fused-objective(1.9999,2,1,1).fused)/.0002,Number(rows[2][2]));
console.log(`SiD: ${cases} independent affine Gaussian quadrature/finite-difference cases and parsed static table/conditions pass; no neural training execution.`);
