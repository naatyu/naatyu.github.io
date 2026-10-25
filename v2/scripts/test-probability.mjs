import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {testFrame,jointFrame,bernoulliCdf,quantile,bernoulliCf,empiricalCf,gaussianCf} from '../site/readers/probability-model.js';
import {probabilityMeta,probabilityReader,probabilitySections} from '../site/readers/probability.js';
import {readerMetas,readerAliases,renderDenseReader} from '../site/readers/index.js';
import {reviewedNavigation} from '../site/reviewed-navigation.js';
import {rank} from '../site/search.js';
const close=(a,b)=>assert(Math.abs(a-b)<1e-9,`${a} != ${b}`),cc=(a,b)=>{close(a.re,b.re);close(a.im,b.im);};
const diagnostic=testFrame();close(diagnostic.positive,.0297);close(diagnostic.posterior,1/3);assert.equal(testFrame(0,0,0).posterior,null);assert.throws(()=>testFrame(1.01));
for(let cents=-25;cents<=25;cents++){const f=jointFrame(cents/100);for(const row of f.cells){close(row.reduce((a,b)=>a+b),.5);assert(row.every(v=>v>=0&&v<=.5));}for(let j=0;j<2;j++)close(f.cells[0][j]+f.cells[1][j],.5);close(f.cells[1][1]-.25,f.cov);close(f.cells[1][1]/.5,f.conditional);close(f.correlation,4*f.cov);}
assert.throws(()=>jointFrame(.26));
for(const p of [0,.01,.5,.99,1]){close(bernoulliCdf(-Infinity,p),0);close(bernoulliCdf(0,p),1-p);close(bernoulliCdf(.999,p),1-p);close(bernoulliCdf(1,p),1);close(bernoulliCdf(Infinity,p),1);cc(bernoulliCf(0,p),{re:1,im:0});cc(bernoulliCf(2*Math.PI,p),{re:1,im:0});for(let t=0;t<10;t+=.2){const f=bernoulliCf(t,p),neg=bernoulliCf(-t,p);assert(Math.hypot(f.re,f.im)<=1+1e-12);cc(neg,{re:f.re,im:-f.im});}}
const values=[1,2,3,4,5,6],weights=values.map(()=>1/6),counts=[0,0,0,0,0,0];for(let i=0;i<600;i++)counts[quantile(values,weights,(i+.5)/600)-1]++;assert.deepEqual(counts,[100,100,100,100,100,100]);assert.equal(quantile([0,1],[.5,.5],.5),0);assert.equal(quantile([0,1],[.5,.5],.50001),1);assert.equal(quantile([0,1],[0,1],0),1);assert.throws(()=>quantile([0,1],[.4,.5],.2));
cc(empiricalCf([0,1],.8),bernoulliCf(.8,.5));cc(gaussianCf(0,10,2),{re:1,im:0});const a=gaussianCf(.7,1,2),b=gaussianCf(.7,3,4);cc({re:a.re*b.re-a.im*b.im,im:a.re*b.im+a.im*b.re},gaussianCf(.7,4,Math.sqrt(20)));assert.throws(()=>empiricalCf([],0));assert.throws(()=>bernoulliCf(NaN,.5));assert.throws(()=>bernoulliCdf(NaN,.5));
const multiply=(x,y)=>({re:x.re*y.re-x.im*y.im,im:x.re*y.im+x.im*y.re});
let affineCases=0,binomialCases=0;
for(const scale of [-2,-.5,0,1,3])for(const shift of [-3,-.25,0,.5,4])for(const t of [-3,-1,-.1,0,.2,.7,1,2,4]){
  const samples=[-2,-.5,0,1,3];
  cc(empiricalCf(samples.map(x=>scale*x+shift),t),multiply({re:Math.cos(t*shift),im:Math.sin(t*shift)},empiricalCf(samples,scale*t)));
  affineCases++;
}
for(let n=1;n<=8;n++)for(const t of [-3,-1,-.1,0,.2,.7,1,2,4]){
  let sums=[0];for(let trial=0;trial<n;trial++)sums=sums.flatMap(sum=>[sum,sum+1]);
  let product={re:1,im:0};for(let trial=0;trial<n;trial++)product=multiply(product,bernoulliCf(t,.5));
  cc(empiricalCf(sums,t),product);binomialCases++;
}
console.log(`Probability inline mechanisms: ${affineCases} affine cases including zero/negative scale and ${binomialCases} exhaustive independent fair-binomial cases pass.`);
// Directly enumerate the displayed nonlinear, zero-covariance example.
const nonlinear=[-1,0,1].map(x=>({x,y:x*x}));
const ex=nonlinear.reduce((s,r)=>s+r.x,0)/3,ey=nonlinear.reduce((s,r)=>s+r.y,0)/3;
close(ex,0);close(ey,2/3);close(nonlinear.reduce((s,r)=>s+(r.x-ex)*(r.y-ey),0)/3,0);
assert.equal(nonlinear.filter(r=>r.x===0&&r.y===1).length,0);
// Independence would instead assign P(X=0)*P(Y=1)=2/9 to that event.
close((1/3)*(2/3),2/9);
let quantileCases=0;
for(let a=0;a<=5;a++)for(let b=0;b<=5;b++)for(let c=0;c<=5;c++){
  const total=a+b+c;if(!total)continue;
  const raw=[0,a,b,c,0],support=[-1,0,1,2,3],weights=raw.map(x=>x/total);
  for(let j=0;j<=total*2;j++){
    // Probe interiors of rational mass intervals plus software endpoints.
    // A nondyadic jump can round to opposite sides in distinct evaluations.
    if(j>0&&j<total*2&&j%2===0)continue;
    const u=j/(total*2),q=quantile(support,weights,u);
    let expected;
    if(j===total*2)expected=support[raw.findLastIndex(x=>x>0)];
    else {let sum=0;for(let i=0;i<raw.length;i++){sum+=raw[i];if(raw[i]>0&&sum*2>=j){expected=support[i];break;}}}
    assert.equal(q,expected);assert(raw[support.indexOf(q)]>0);quantileCases++;
  }
}
assert.equal(quantile([0,1,2,3],[.1,.2,.6999999999999998,0],1),2);
assert.equal(quantile([0,1,2,3],[.1,.2,.6999999999999998,0],1-Number.EPSILON/2),2);
for(const missing of [[0,,1],[0,undefined,1],new Array(3)]){
  assert.throws(()=>quantile(missing,[.2,.3,.5],.5));
  assert.throws(()=>empiricalCf(missing,0));
}
for(const missing of [[.5,,.5],[.5,undefined,.5],new Array(3)])assert.throws(()=>quantile([0,1,2],missing,.5));
cc(empiricalCf([0,0,1],0),{re:1,im:0});
let gaussianRangeCases=0;
for(const sigma of [1e-308,1e-150,1,1e150,1e308])for(const product of [.25,.5,1,2,4]){
  const t=product/sigma;if(!Number.isFinite(t))continue;
  const f=gaussianCf(t,0,sigma);
  close(f.re,Math.exp(-(product**2)/2));close(f.im,0);gaussianRangeCases++;
}
for(const sigma of [0,1e-308,1,1e150,1e308])cc(gaussianCf(0,1e308,sigma),{re:1,im:0});
cc(gaussianCf(1e308,1e308,1e308),{re:0,im:0});
assert.throws(()=>gaussianCf(1e308,1e308,0),/Phase/);
assert.throws(()=>empiricalCf([1e308],1e308),/Phase/);
console.log(`Probability numeric range: ${gaussianRangeCases} balanced scale/frequency pairs, zero frequency, damping underflow and explicit phase-overflow guards pass.`);
for(const slug of ['law-of-total-probability','covariance-from-joint-pmf','cumulative-distribution-function','characteristic-function']){
  const path='docs/math/probability/'+slug+'.md';
  assert.deepEqual(await readFile(new URL('../../'+path,import.meta.url)),execFileSync('git',['show','HEAD:'+path],{cwd:new URL('../../',import.meta.url)}));
}
console.log(`Probability example/guards: ${quantileCases} rational inverse-CDF cases, rounding/zero-mass endpoints, missing entries, nonlinear dependence and four Git-equal originals pass.`);
const catalog=JSON.parse(await readFile(new URL('../site/catalog.json',import.meta.url),'utf8')),notes=[...readerMetas,...catalog.notes.filter(n=>!readerAliases.includes(n.slug)&&!reviewedNavigation[n.slug])],html=probabilityReader(s=>'directions.html?slug='+s),ids=[...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);for(const [id]of probabilitySections)assert(ids.includes(id),id);for(const slug of [...html.matchAll(/slug=([^"#]+)/g)].map(m=>m[1]))assert(notes.some(n=>n.slug===slug),slug);assert(renderDenseReader(probabilityMeta.slug,s=>s));for(const query of ['Epps-Pulley','CDF','characteristic function','covariance','Bayes'])assert(rank(notes,query).some(r=>r.note===probabilityMeta),query);
for(const slug of ['law-of-total-probability','covariance-from-joint-pmf','cumulative-distribution-function','characteristic-function'])assert(!notes.some(n=>n.slug==='math/probability/'+slug));
assert.equal((html.match(/class="inline-math"/g)||[]).length,18);
assert.equal((html.match(/<math /g)||[]).length,32);
assert(!html.includes('${'));
const escapeTex=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
for(const tex of [String.raw`p_{00}=p_{11}=0.4`,String.raw`p_{01}=p_{10}=0.1`,String.raw`\mathbb E[XY]=0.4`,String.raw`\operatorname{Cov}(X,Y)=0.4-0.25=0.15`,String.raw`Y=X^2`,String.raw`\mathbb E[X]=0,\quad\mathbb E[Y]=\frac23`,String.raw`\mathbb E[XY]=\mathbb E[X^3]=0`,String.raw`Q(u)=\lceil6u\rceil,\quad0<u<1`,String.raw`F_n(2)=\frac34`,String.raw`i^2=-1`])assert(html.includes(`<annotation encoding="application/x-tex">${escapeTex(tex)}</annotation>`),tex);
console.log('Probability: conditional totals, joint marginals/covariance, discrete CDF endpoints, quantile mass, CF conjugacy/periodicity/bounds, Gaussian sums, anchors, source visibility and search pass.');
