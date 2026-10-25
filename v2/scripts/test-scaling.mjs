import assert from 'node:assert/strict';
import './test-scaling-data-closure.mjs';
import './test-scaling-core-closure.mjs';
import {readFile} from 'node:fs/promises';
import {loss,allocation,mixedDerivative,effectiveData,competing,batchBudget,efficiencyGain,gapFrames,demoLaw,memoryAllocation} from '../site/readers/scaling-model.js';
import {scalingMeta,scalingSections,scalingReader,scalingBudgetBody} from '../site/readers/scaling.js';
import {readerMetas,renderDenseReader} from '../site/readers/index.js';
import {rank} from '../site/search.js';
const near=(a,b,e=1e-9)=>assert(Math.abs(a-b)<=e*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
for(const k of [.5,1,1.5])for(let step=0;step<=50;step++){
  const body=scalingBudgetBody(step,k);
  assert.equal((body.match(/<math /g)||[]).length,4);
  assert(!body.includes('${'));assert(!body.includes('katex-error'));
  for(const tex of ['A=B=1',String.raw`\alpha=\beta=0.4`,'E=1',`k=${k}`])assert(body.includes(`<annotation encoding="application/x-tex">${tex}</annotation>`),tex);
  assert(body.includes('fixed-inner-parameter optimum'));
}
let cases=0;
// Solve the two stationary log equations independently, then check the
// displayed resource exponents and the three marginal contributions.
let sizeCases=0;
for(const g1 of [.5,1,2])for(const g2 of [.5,1])for(const g3 of [.5,1,2])for(const g5 of [.25,.75])for(const g6 of [0,.5])for(const g7 of [.25,1]){
  const delta=g1*g3+g2*(g1+g3),a1=2,a2=3,a3=5;
  const solve=(N,K)=>{
    const r1=Math.log(g2*a2/(g1*a1))+(g5+g6)*Math.log(N)+g1*Math.log(K);
    const r2=Math.log(g1*a1/(g3*a3))-(g5+g7)*Math.log(N)-g1*Math.log(K);
    const B=Math.exp(((g1+g3)*r1+g1*r2)/delta);
    const eta=Math.exp((g1*r1+(g1+g2)*r2)/delta);
    const parts=(b,e)=>[a1*N**(-g5)*K**(-g1)*b**g1*e**(-g1),a2*N**g6*b**(-g2),a3*N**g7*e**g3];
    const [travel,noise,update]=parts(B,eta),F=travel+noise+update;
    near(g1*travel,g2*noise);near(g1*travel,g3*update);
    for(const b of [.8,1,1.2])for(const e of [.8,1,1.2])assert(parts(B*b,eta*e).reduce((s,x)=>s+x,0)>=F-1e-10);
    return {B,eta,F};
  };
  const base=solve(3,1000),n=solve(6,1000),k=solve(3,2000);
  near(n.eta/base.eta,2**((g1*g6-g7*(g1+g2)-g5*g2)/delta));
  near(n.B/base.B,2**((g6*(g1+g3)+g5*g3-g7*g1)/delta));
  near(n.F/base.F,2**((g1*g2*g7+g1*g3*g6-g2*g3*g5)/delta));
  near(k.eta/base.eta,2**(-g1*g2/delta));
  near(k.B/base.B,2**(g1*g3/delta));
  near(k.F/base.F,2**(-g1*g2*g3/delta));sizeCases++;
}
near(16**(-.25),.5);near(16**.5,4);
const sizeHtml=scalingReader(s=>s);
assert(sizeHtml.includes('class="stability-plot-scroll" tabindex="0" role="region"'));
assert(sizeHtml.includes('scroll horizontally for all three panels'));
for(const term of ['Skaling Figure 1','/img/scaling/skaling-residuals-v1.png','both axes are logarithmic','capped at 16×','do not show a training speedup','CC BY 4.0','not directly measured optimal training runs','outside the shaded data range'])assert(sizeHtml.includes(term),term);
const residualAsset=await readFile(new URL('../../static/img/scaling/skaling-residuals-v1.png',import.meta.url));
assert.equal(residualAsset.subarray(1,4).toString(),'PNG');
assert.equal(residualAsset.readUInt32BE(16),1320);assert.equal(residualAsset.readUInt32BE(20),375);
assert(scalingSections.some(([id])=>id==='size-optimization'));
for(const tex of [String.raw`N^{[\gamma_1\gamma_6-\gamma_7(\gamma_1+\gamma_2)-\gamma_5\gamma_2]/\Delta}`,String.raw`N^{[\gamma_6(\gamma_1+\gamma_3)+\gamma_5\gamma_3-\gamma_7\gamma_1]/\Delta}`,String.raw`N^{[\gamma_1\gamma_2\gamma_7+\gamma_1\gamma_3\gamma_6-\gamma_2\gamma_3\gamma_5]/\Delta}`])assert(sizeHtml.includes(tex),tex);
for(const term of ['Size independence is an extra assumption','continuous, unconstrained variables','Integer batches, memory limits','normalized illustrations'])assert(sizeHtml.includes(term),term);
console.log(`Size-conditioned optimization: ${sizeCases} independent stationary/resource/minimum checks pass.`);
// Independently solve the outer compute allocation. Constants affect levels,
// not the ratios; each inner optimum must stay on the same conditional law.
let computeCases=0,rateCases=0;
for(const optCoefficient of [.5,2,8])for(const archCoefficient of [.25,1,4])for(const C of [10,1000,1e6])for(const growth of [2,16,128])for(const g7 of [0,.25,.5]){
  const solve=c=>{
    const p=.25,q=1/3;
    const N=(q*archCoefficient/(p*optCoefficient)*c**p)**(1/(p+q)),K=c/N;
    const B=K**.5,T=K/B,eta=K**(-.25)*N**(-g7);
    const training=optCoefficient*K**(-p),architecture=archCoefficient*N**(-q),F=training+architecture;
    near(p*training,q*architecture);near(N*K,c);near(B*T,K);
    for(const factor of [.5,.9,1.1,2])assert(optCoefficient*(c/(N*factor))**(-p)+archCoefficient*(N*factor)**(-q)>=F-1e-10*F);
    return {N,K,B,T,eta,F};
  };
  const a=solve(C),b=solve(C*growth);
  for(const [key,exponent]of [['N',3/7],['K',4/7],['B',2/7],['T',2/7],['eta',-(1+3*g7)/7],['F',-1/7]])near(b[key]/a[key],growth**exponent);
  computeCases++;
}
for(const g1 of [.5,1,2])for(const g3 of [.5,1,2])for(const g5 of [.25,1])for(const g7 of [.25,.5])for(const N of [1,16])for(const T of [10,1000]){
  const eta=(g1*2/(g3*5))**(1/(g1+g3))*T**(-g1/(g1+g3))*N**(-(g5+g7)/(g1+g3));
  const f=e=>2*N**(-g5)*(T*e)**(-g1)+5*N**g7*e**g3;
  near(g1*2*N**(-g5)*(T*eta)**(-g1),g3*5*N**g7*eta**g3);
  for(const factor of [.5,.9,1.1,2])assert(f(eta*factor)>=f(eta)-1e-10*f(eta));rateCases++;
}
near(128**(3/7),8);near(128**(4/7),16);near(128**(2/7),4);near(128**(-1/7),.5);
assert.equal((128**(-.25)).toFixed(4),'0.2973');
for(const tex of [String.raw`C^{-\frac{1+3\gamma_7}{7}}`,String.raw`T^*&amp;=\frac{K^*}{B^*}\propto C^{2/7}`,String.raw`N^{-\frac{\gamma_5+\gamma_7}{\gamma_1+\gamma_3}}`])assert(sizeHtml.includes(tex),tex);
for(const term of ['first rate optimum holds T and B fixed','fixed dense cost per processed sample','not independent hyperparameter sweeps','not a universal scaling recipe'])assert(sizeHtml.includes(term),term);
console.log(`Compute frontier: ${computeCases} independent allocation/ratio checks; ${rateCases} fixed-step stationary/minimum checks; 128× example pass.`);
// Primary Table 1 transcription is separate from numeric model validation.
for(const cell of ['0.77 ±0.04 → 0.41 ±0.05','0.81 ±0.14 → 0.33 ±0.11','1.48 ±0.03 → 0.47 ±0.03','0.83 ±0.11 → 0.39 ±0.05','1.98 ±0.08 → 0.88 ±0.06','1.44 ±0.03 → 0.58 ±0.07','2.46 ±0.19 → 2.31 ±0.18','5.17 ±0.28 → 0.70 ±0.39'])assert(sizeHtml.includes(cell),cell);
assert(sizeHtml.includes(String.raw`\operatorname{MAPE}=\frac{100}{m}\sum_{i=1}^{m}\frac{|\widehat L_i-L_i|}{L_i}`));
for(const term of ['not confidence intervals','seven Farseer runs and three SK-Grid runs','not a new exhaustive tuning sweep','give 10% MAPE'])assert(sizeHtml.includes(term),term);
const mape=(truth,pred)=>100*truth.reduce((s,l,i)=>s+Math.abs(pred[i]-l)/l,0)/truth.length;
near(mape([2,4],[2.2,3.6]),10);
let mapeCases=0;
for(const x of [1,2,4])for(const y of [1,2,4])for(const r of [.8,1,1.2])for(const s of [.8,1,1.2]){
  const expected=50*(Math.abs(r-1)+Math.abs(s-1));near(mape([x,y],[r*x,s*y]),expected);
  near(mape([10*x,10*y],[10*r*x,10*s*y]),expected);mapeCases++;
}
near(5e22/5.1e21,9.803921568627452);near(3.1e21/6.5e20,4.769230769230769);
console.log(`Skaling evidence: eight mean/deviation cells, scoped fold/sample caveats, ${mapeCases} metric cases, worked example and fitting-compute ratios pass. Figure/appendix review separate.`);
// Appendix E Equation 9: keep token-batch units and the refitted policy
// separate from the theoretical fixed-K optimizer above.
assert(scalingSections.some(([id])=>id==='sk-grid-recipe'));
for(const tex of [String.raw`B_{\rm tokens}&amp;=896.07\,F^{0.231}`,String.raw`\eta_{\rm peak}&amp;=0.0709\,F^{-0.4303}D^{0.2785}`,String.raw`\delta=0.05`])assert(sizeHtml.includes(tex),tex);
for(const term of ['FLOPs per token','not the sequences','coefficients were refitted','Changing units changes','not the fixed-K optimum','60% DCLM-Edu web, 30% code, 10% math','held-out split of this mixture','moments (0.9, 0.95)','gradient clipping 0.1','10% warmup','not a full Cartesian grid'])assert(sizeHtml.includes(term),term);
let recipeCases=0;
for(const F of [1e8,1e9,1e10])for(const D of [1e9,1e10,1e11])for(const growth of [2,10,100]){
  const recipe=(f,d)=>({B:896.07*Math.exp(.231*Math.log(f)),eta:.0709*Math.exp(-.4303*Math.log(f)+.2785*Math.log(d))});
  const base=recipe(F,D),moreCompute=recipe(F*growth,D),moreTokens=recipe(F,D*growth);
  near(moreCompute.B/base.B,growth**.231);near(moreCompute.eta/base.eta,growth**(-.4303));
  near(moreTokens.B/base.B,1);near(moreTokens.eta/base.eta,growth**.2785);
  // Re-express F in GFLOPs/token and D in billions of tokens.
  near(base.B,896.07*(1e9)**.231*(F/1e9)**.231);
  near(base.eta,.0709*(1e9)**(-.4303+.2785)*(F/1e9)**(-.4303)*(D/1e9)**.2785);
  recipeCases++;
}
assert.equal([16,16,15,14,11,11,9,9,7,5,5,4,2,1].reduce((sum,n)=>sum+n,0),125);
console.log(`SK-Grid recipe: exact source expressions/settings, ${recipeCases} independent ratio/unit checks and staircase count pass; empirical policy validation remains separate.`);
let chainCases=0,pairCases=0;
// Differentiate exp(a log N + b log D + c log N log D) in real
// coordinates. The independent central difference must include the product
// of the log slopes, including cases where it reverses the mixed sign.
for(const a of [-.5,-.2,.3])for(const b of [-.3,.1,.4])for(const c of [-.02,0,.1])for(const N of [1,3,10])for(const D of [1,4,8]){
  const x=Math.log(N),y=Math.log(D),f=(n,d)=>Math.exp(a*Math.log(n)+b*Math.log(d)+c*Math.log(n)*Math.log(d));
  const L=f(N,D),zx=a+c*y,zy=b+c*x,h=N*1e-4,j=D*1e-4;
  const nd=(f(N+h,D+j)-f(N+h,D-j)-f(N-h,D+j)+f(N-h,D-j))/(4*h*j);
  near(nd,L/(N*D)*(c+zx*zy),1e-6);chainCases++;
}
near(-.02+(-.2)*(-.3),.04);
for(const A of [1,3])for(const B of [2,5])for(const k of [.5,1,1.5])for(const E of [0,.7,2.4]){
  const runs=[[1,1],[2,3],[4,8]].map(([X,D],i)=>{const r=(A*X**(-.5)+B*D**(-.4))**k;return {X,D,r,L:r+E,noise:[-.1,0,.1][i]};});
  for(let i=1;i<runs.length;i++)for(let j=0;j<i;j++){
    assert(runs[i].X>=runs[j].X&&runs[i].D>=runs[j].D&&runs[i].L<runs[j].L);
    near(runs[j].L-runs[i].L,runs[j].r-runs[i].r);
    near((runs[j].L+10)-(runs[i].L+10),runs[j].L-runs[i].L);pairCases++;
  }
  const residuals=runs.map(r=>r.L+r.noise-r.r).sort((a,b)=>a-b);near(residuals[1],E);
}
for(const tex of [String.raw`L_{ND}&amp;=\frac L{ND}(z_{xy}+z_xz_y)`,String.raw`\widehat E&amp;=\operatorname{median}_j\,[L_j-r(X_j,D_j)]`])assert(sizeHtml.includes(tex),tex);
for(const term of ['separate fitting run','not merely reported precision','not simply the same objective','1.57% to 5.87%','negative log mixed derivative alone','not total training compute C'])assert(sizeHtml.includes(term),term);
assert(scalingSections.some(([id])=>id==='coupling-measurement'));
console.log(`Skaling appendices: ${chainCases} independent real/log derivative comparisons, sign-reversal example, ${pairCases} floor cancellation/offset cases and median recovery pass; source-run distinction retained.`);
// Check the rendered static derivations independently of an interactive model.
let effectiveCases=0,epochCases=0;
for(const active of [1,4,16])for(const ratio of [1,4,9])for(const ga of [.25,.5,1])for(const gt of [.25,.5,1])for(const a of [.5,2]){
  const total=active*ratio,n=active**(ga/(ga+gt))*total**(gt/(ga+gt));
  near(a*n**(-ga-gt),a*active**(-ga)*total**(-gt));
  assert(n>=active-1e-12&&n<=total+1e-12);
  if(ga===gt)near(n,Math.sqrt(active*total));effectiveCases++;
}
near(Math.sqrt(4*36),12);
for(const U of [1,2,16,100])for(const a of [.1,1,10])for(const b of [.1,1,10])for(const s of [.25,1,2])for(const t of [.5,1,3])for(const r of [.5,1,2,3,4]){
  const K=(a*s/(b*t)*U**r)**(1/(s+t)),f=k=>a*k**(-s)+b*k**t*U**(-r),v=f(K);
  near(a*s*K**(-s),b*t*K**t*U**(-r));
  const h=1e-5,numeric=(f(K*Math.exp(h))-f(K*Math.exp(-h)))/(2*h);
  assert(Math.abs(numeric)<1e-7*v);
  for(const factor of [.25,.5,.9,1.1,2,4])assert(f(K*factor)>=v-1e-10*v);
  // Convex in log K; the full-pass boundary is a feasible constraint, not a fit.
  const feasible=Math.max(U,K);for(const candidate of [U,2*U,10*U,feasible*2])assert(f(feasible)<=f(candidate)+1e-10*f(candidate));
  const K2=(a*s/(b*t)*(2*U)**r)**(1/(s+t));near((K2/(2*U))/(K/U),2**((r-s-t)/(s+t)));epochCases++;
}
for(const [r,K,epochs] of [[1,4,.25],[2,16,1],[3,64,4]]){near(16**(r/2),K);near(K/16,epochs);}
console.log(`Static scaling extensions: ${effectiveCases} weighted-capacity identities and ${epochCases} independent marginal/grid/finite-difference/epoch-ratio checks pass; assigned examples verified.`);
let storageCases=0;
for(const A of [1,8,64])for(const ratio of [1,2,3,10])for(const a of [.1,1,10])for(const b of [.1,1,10])for(const p of [.5,1,2])for(const q of [.5,1,2]){
  const total=A*ratio,S=A+total,r=memoryAllocation(A,total,a,b,p,q);
  near(r.moe+r.mem,S);near(A+r.inactive+r.memory,total);
  assert(r.moe>=A-1e-12&&r.mem>=A-1e-12);assert(r.inactive>=-1e-12&&r.memory>=-1e-12);
  const f=x=>a*x**(-p)+b*(S-x)**(-q),v=f(r.moe);
  // Independent dense feasible grid checks both endpoints and the interior.
  for(let j=0;j<=100;j++)assert(v<=f(A+(total-A)*j/100)+1e-10);
  if(p===q){const z=(a/b)**(1/(p+1)),expected=Math.max(A,Math.min(total,S*z/(1+z)));near(r.moe,expected);}
  if(r.inactive>1e-8&&r.memory>1e-8)near(p*a*r.moe**(-p-1),q*b*r.mem**(-q-1));
  storageCases++;
}
const memoryExample=memoryAllocation(8,24,25,9,1,1);
near(memoryExample.moe,20);near(memoryExample.mem,12);near(memoryExample.inactive,12);near(memoryExample.memory,4);
near(25/memoryExample.moe+9/memoryExample.mem,2);
assert.equal(memoryAllocation(8,24,1e200,1e-200,1,1).memory,0);
assert.equal(memoryAllocation(8,24,1e-200,1e200,1,1).inactive,0);
for(const args of [[0,24,1,1,1,1],[8,7,1,1,1,1],[8,24,0,1,1,1],[8,24,1,1,0,1],[8,24,1,NaN,1,1],[Number.MAX_VALUE,Number.MAX_VALUE,1,1,1,1],[Number.MIN_VALUE,1,1,1,1,1]])assert.throws(()=>memoryAllocation(...args));
console.log(`Memory allocation: ${storageCases} independent grid/marginal/equal-exponent cases, exact worked example, boundary optima and invalid domains pass.`);
for(const alpha of [.1,.4,.9])for(const beta of [.2,.4,.8])for(const A of [.1,1,10])for(const B of [.1,1,10])for(const C of [6,60,600,6000]){const law={A,B,alpha,beta,E:1},f=allocation(C,law);near(6*f.N*f.D,C);near(alpha*A*f.N**(-alpha),beta*B*f.D**(-beta));for(const factor of [.5,.9,1.1,2])for(const k of [.3,1,1.7])assert(loss(f.N*factor,f.D/factor,{...law,k})>=loss(f.N,f.D,{...law,k})-1e-10);cases++;}
for(const k of [.3,.5,1,1.5])for(const N of [1,3,10,100])for(const D of [1,4,16,256]){const law={...demoLaw,k},h=N*.001,j=D*.001,numeric=(loss(N+h,D+j,law)-loss(N+h,D-j,law)-loss(N-h,D+j,law)+loss(N-h,D-j,law))/(4*h*j);near(numeric,mixedDerivative(N,D,law),1e-6);assert(loss(N*2,D,law)<loss(N,D,law));assert(loss(N,D*2,law)<loss(N,D,law));const gains=[1,4,16,64,256].map(d=>loss(N,d,law)-loss(2*N,d,law));for(let i=1;i<gains.length;i++)if(k===1)near(gains[i],gains[0]);else if(k<1)assert(gains[i]>gains[i-1]);else assert(gains[i]<gains[i-1]);}
for(const U of [1,2,1e6])for(const r of [.5,1,4,10]){near(effectiveData(U,0,r),U);let previous=U;for(let R=1;R<=100;R++){const d=effectiveData(U,R,r);assert(d>=previous);assert(d<=U*(1+r));near(d,U+U*r*(1-Math.exp(-R/r)));previous=d;}}
for(const a of [.1,1,10])for(const b of [.1,1,10])for(const p of [.25,1,3])for(const q of [.5,1,2]){const f=competing(a,b,p,q);near(p*a*f.x**p,q*b*f.x**(-q));near(f.value,(p+q)*(a**q*b**p/(p**p*q**q))**(1/(p+q)));for(const factor of [.5,.9,1.1,2])assert(a*(f.x*factor)**p+b*(f.x*factor)**(-q)>=f.value);}
for(const K of [100,1000,1e6])for(const B of [1,10,100])near(batchBudget(K,B).T*B,K);
for(const cost of [1,10,100])for(const gain of [.5,1,1.3,3]){const A=2,alpha=.4,E=1,achieved=E+A*(cost*gain)**(-alpha);near(efficiencyGain(A,alpha,E,cost,achieved),gain);}
for(const target of [1,1.7,2.5,3]){const f=gapFrames(target,2.2,1.8,1.4);near(f.reduce((s,x)=>s+x.value,0),target);}assert(gapFrames(1.7,2.2,1.8,1.4).at(-1).value<0);
for(const fn of [()=>loss(0,1),()=>allocation(-1),()=>effectiveData(1,-1),()=>effectiveData(1,1,0),()=>competing(0,1,1,1),()=>batchBudget(0,1),()=>efficiencyGain(1,1,1,1,1),()=>gapFrames(1,1,2,0)])assert.throws(fn);
const html=scalingReader(s=>'directions.html?slug='+s),ids=[...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);for(const [id] of scalingSections)assert(ids.includes(id));assert(!html.includes('undefined'));assert.equal(scalingMeta.date,'2026-04-08');assert.equal(scalingMeta.prototype,false);
const catalog=JSON.parse(await readFile(new URL('../site/catalog.json',import.meta.url),'utf8')),notes=[...readerMetas,...catalog.notes];for(const [,s,anchor]of html.matchAll(/href="directions\.html\?slug=([^"#]+)(?:#([^"]+))?"/g)){assert(notes.some(n=>n.slug===s),s);if(anchor)assert(renderDenseReader(s,x=>'directions.html?slug='+x)?.includes(`id="${anchor}"`));}for(const q of ['Chinchilla','Skaling','Kaplan','K BT','overtraining','efficiency gain'])assert(rank(notes,q).some(r=>r.note===scalingMeta),q);
console.log(`Scaling: ${cases} independently checked allocation cases, monotonic coupling/finite differences, 1,200 repetition points, 81 competing-power optima, budgets, EG inversion, signed accounting, domains, routes and search pass.`);
