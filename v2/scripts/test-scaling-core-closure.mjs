import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import GithubSlugger from 'github-slugger';
import {scalingReader,scalingAliases} from '../site/readers/scaling.js';
import {reviewedFragments,resolveReviewedNote} from '../site/reviewed-navigation.js';
const root=new URL('../../',import.meta.url),ledger=JSON.parse(readFileSync(new URL('.internal/v2/scaling-core-closure.json',root),'utf8'));
const html=scalingReader(s=>s),ids=[...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]);let count=0;
assert.equal((html.match(/class="inline-math"/g)||[]).length,84);
assert.equal((html.match(/<math /g)||[]).length,119);
for(const term of ['does not absorb the active-capacity penalty','not a measured equivalence','full-pass requirement','unconstrained mathematical examples','Optimal epochs increase','Optimal epochs decrease'])assert(html.includes(term),term);
for(const tex of [String.raw`N_{\rm eff}=\sqrt{N_{\rm act}N_{\rm total}}`,String.raw`r=t`,String.raw`K^*=U^{r/2}`])assert(html.includes(`<annotation encoding="application/x-tex">${tex}</annotation>`),tex);
assert(html.includes(String.raw`\frac{K^*}{U}&amp;\propto U^{\frac{r-s-t}{s+t}}`));
assert(html.includes('id="memory-allocation"'));
for(const term of ['not disjoint allocations','all additional storage goes to one component','not guaranteed','2.1667','3.5000'])assert(html.includes(term),term);
for(const tex of [String.raw`\frac AS\le x\le1-\frac AS`,String.raw`x^*=\frac{r}{1+r},\quad r=(a/b)^{1/(p+1)}`])assert(html.includes(`<annotation encoding="application/x-tex">${tex}</annotation>`),tex);
for(const tex of [String.raw`\alpha\approx\beta`,String.raw`\alpha\ne\beta`,String.raw`C=6ND`,String.raw`\alpha>\beta`,String.raw`k\approx0.77\text{–}0.90`,String.raw`k\approx0.31\text{–}0.45`,String.raw`\mathrm{EG}=1.3`])assert(html.includes(`<annotation encoding="application/x-tex">${tex.replaceAll('>','&gt;')}</annotation>`),tex);
assert(!html.includes('${inlineMath'));
for(const tex of [String.raw`\alpha AN^{-\alpha}=\beta BD^{-\beta}`,String.raw`C^{\frac{\alpha-\beta}{\alpha+\beta}}`,String.raw`R_N=\frac{N}{U_N}-1`,String.raw`T=\frac{K}{B^*}`,String.raw`\eta^*\propto K^{-1/4}`,String.raw`\widehat\gamma_1=\frac14`,String.raw`N\approx\sqrt{\frac{C}{120}}`,String.raw`\exp(-R/4)`])assert(html.includes(tex),tex);
for(const {slug,sha256,headings:destinations} of ledger.sources){
  const p='docs/'+slug+'.md',source=readFileSync(new URL(p,root),'utf8');
  assert.equal(source,execFileSync('git',['show','HEAD:'+p],{cwd:root,encoding:'utf8'}));
  assert.equal(createHash('sha256').update(source).digest('hex'),sha256);
  const g=new GithubSlugger(),headings=[...source.matchAll(/^#{1,6} (.+)$/gm)].map(m=>g.slug(m[1]));
  assert.deepEqual(Object.keys(destinations),headings);assert.deepEqual(reviewedFragments[slug],destinations);
  assert(!/!\[|<img\b|<PaperFigure\b|^import /m.test(source));
  assert(scalingAliases.includes(slug));assert(!html.includes(slug));
  for(const h of headings){const d=resolveReviewedNote(slug+'#'+h);assert.equal(d.slug,'training/scaling');assert(ids.includes(d.anchor));count++;}
  for(const url of new Set([...source.matchAll(/https:\/\/[^\s)]+/g)].map(m=>m[0])))assert(html.includes(url),url);
}
assert.equal(count,91);assert.equal(scalingAliases.length,5);
assert(!html.includes('Complete originals'));assert(!html.includes('The originals retain'));
assert(html.includes('Runtime')||html.includes('Serial depth'));
for(const term of ['0.77 ±0.04 → 0.41 ±0.05','0.81 ±0.14 → 0.33 ±0.11','1.48 ±0.03 → 0.47 ±0.03','0.83 ±0.11 → 0.39 ±0.05','1.98 ±0.08 → 0.88 ±0.06','1.44 ±0.03 → 0.58 ±0.07','2.46 ±0.19 → 2.31 ±0.18','5.17 ±0.28 → 0.70 ±0.39','14.63%','1.15%','2.34%','0.80%','0.99%','0.60%','2.46%→0.79%','2.32%→1.55%','134/15 sizes','125/14','0.45 to 0.03','2,000 restarts'])assert(html.includes(term),term);
for(const url of ['2401.00448','2403.08540','2604.01411','2505.09388','2412.19437','2508.06471'])assert(html.includes('https://arxiv.org/abs/'+url));
// Independent analytic first derivatives, not a proof of any empirical fit.
let gradients=0;
for(const k of [.3,1,1.5])for(const alpha of [.2,.5])for(const beta of [.3,.8])for(const N of [1,5,20])for(const D of [1,4,100]){
  const A=2,B=3,u=A*N**(-alpha)+B*D**(-beta),f=(n,d)=>(A*n**(-alpha)+B*d**(-beta))**k;
  const h=N*1e-5,j=D*1e-5;
  const n=-k*alpha*A*N**(-alpha-1)*u**(k-1),d=-k*beta*B*D**(-beta-1)*u**(k-1);
  assert(n<0&&d<0);
  assert(Math.abs(((f(N+h,D)-f(N-h,D))/(2*h))/n-1)<1e-7);
  assert(Math.abs(((f(N,D+j)-f(N,D-j))/(2*j))/d-1)<1e-7);gradients+=2;
}
console.log(`Scaling core closure:four Git-equal bodies/${count} headings plus separate data closure;preserved evidence,citations,no public archive and ${gradients} derivative comparisons pass. Full primary and production gates separate.`);
