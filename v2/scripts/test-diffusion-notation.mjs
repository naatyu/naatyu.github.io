import assert from 'node:assert/strict';
import {parseFragment} from 'parse5';
import {diffusionReader} from '../site/readers/diffusion.js';
import {assertGeneratedMarkup} from './check-generated-markup.mjs';
const html=assertGeneratedMarkup(diffusionReader(()=>'')),nodes=[];
function visit(n){nodes.push(n);for(const c of n.childNodes||[])visit(c);}
visit(parseFragment(html));
const text=n=>(n.value||'')+(n.childNodes||[]).map(text).join('');
const annotations=nodes.filter(n=>n.tagName==='annotation').map(text);
const formulas=[String.raw`x_t=a_tx_0+\sigma_t\epsilon`,String.raw`a_t^2+\sigma_t^2=1`,String.raw`a_t=1`,String.raw`v_t=\alpha_t v_{t-1}+\beta_t`,String.raw`v_0=0`,String.raw`v_t=1-\bar\alpha_t`,String.raw`\beta=0.08`,String.raw`\bar\alpha=0.92^{10}\approx0.4344`,String.raw`\widetilde\beta_1=0`,String.raw`s_{\mathrm{target}}=-\frac{\epsilon}{\sigma_t}`,String.raw`\Delta t=t_{\mathrm{next}}-t<0`,String.raw`\sqrt{|\Delta t|}`,String.raw`\sqrt{\Delta t}`,String.raw`\tau=T-t`,String.raw`-f+g^2s`,String.raw`-\frac{x}{1+t}`,String.raw`\frac{x}{2(1+t)}`,String.raw`x(t)=z\sqrt{1+t}`,String.raw`x=\sqrt5\approx2.2361`,String.raw`\frac{x}{5}\approx0.4472`,String.raw`b=f-\frac12g^2s`,String.raw`x^{\prime}=-x`,String.raw`\frac{x(e^{-d}-1)}d`];
for(const tex of formulas)assert(annotations.includes(tex),tex);
assert.equal(nodes.filter(n=>n.tagName==='math').length,83);
assert.equal(nodes.filter(n=>n.attrs?.some(a=>a.name==='class'&&a.value==='inline-math')).length,45);
const prose=text(parseFragment(html));
for(const condition of ['Divisions require nonzero coefficients','not errors against the marginal score on every pair','state-independent isotropic diffusion','Both conventions are valid','correct answers to different questions','A learned network only approximates this composition','not sampled images'])assert(prose.includes(condition),condition);
assert(!prose.includes('inlineMath(String.raw'));
const near=(a,b)=>assert(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
// Direct accumulation of independent noise contributions, not the recurrence.
let variances=0;
for(const beta of [.001,.01,.08,.5,.9])for(let n=0;n<=40;n++){
  let recurrence=0,direct=0;
  for(let j=0;j<n;j++){recurrence=(1-beta)*recurrence+beta;direct+=beta*(1-beta)**j;}
  near(recurrence,direct);near(direct,1-(1-beta)**n);variances++;
}
let trajectories=0;
for(const z of [-3,-1,0,1,4])for(const t of [.01,.1,.5,1,4,10]){
  const x=z*Math.sqrt(1+t),h=1e-5;
  const derivative=(z*Math.sqrt(1+t+h)-z*Math.sqrt(1+t-h))/(2*h);
  near(derivative,x/(2*(1+t)));
  near(x/Math.sqrt(1+t),z);
  const mean=x/(1+t);near(mean,z/Math.sqrt(1+t));trajectories++;
}
let shortcuts=0;
for(const x of [-3,-1,0,1,3])for(const d of [.01,.1,.5,1,2]){
  const first=x*Math.expm1(-d)/d,next=x+d*first;
  const second=next*Math.expm1(-d)/d;
  near((first+second)/2,x*Math.expm1(-2*d)/(2*d));shortcuts++;
}
near(Math.sqrt(.92**10)*2,1.3181630464);
near(1-.92**10,.5656115458);
near(Math.sqrt(5)/5,1/Math.sqrt(5));
console.log(`Diffusion notation:25 inline additions,${variances} independent variance sums,${trajectories} analytic trajectory derivatives and${shortcuts} finite shortcut compositions pass;source/native scopes remain separate.`);
