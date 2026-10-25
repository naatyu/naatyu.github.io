import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import GithubSlugger from 'github-slugger';
import {optimizationReader,optimizationAliases} from '../site/readers/optimization.js';
import {reviewedFragments,resolveReviewedNote} from '../site/reviewed-navigation.js';
const root=new URL('../../',import.meta.url);
const ledger=JSON.parse(readFileSync(new URL('.internal/v2/optimization-core-closure.json',root),'utf8'));
const html=optimizationReader(s=>s);let headings=0;
assert.equal(ledger.sources.length,6);
for(const entry of ledger.sources){
  const path='docs/'+entry.slug+'.md',source=readFileSync(new URL(path,root),'utf8');
  assert.equal(source,execFileSync('git',['show','HEAD:'+path],{cwd:root,encoding:'utf8'}));
  assert.equal(createHash('sha256').update(source).digest('hex'),entry.sha256);
  const slugger=new GithubSlugger(),actual=[...source.matchAll(/^#{1,6} (.+)$/gm)].map(m=>slugger.slug(m[1]));
  assert.deepEqual(Object.keys(entry.headings),actual);headings+=actual.length;
  assert.deepEqual(reviewedFragments[entry.slug],entry.headings);
  assert(optimizationAliases.includes(entry.slug));assert(!html.includes(entry.slug));
  assert(!/!\[|<img\b|<PaperFigure\b|^import /m.test(source));
  for(const old of actual){const dest=resolveReviewedNote(entry.slug+'#'+old);assert.equal(dest.slug,'training/optimization');assert(html.includes('id="'+dest.anchor+'"'));}
  for(const url of new Set([...source.matchAll(/https:\/\/[^\s)]+/g)].map(m=>m[0])))assert(html.includes(url),url);
}
assert.equal(headings,98);
assert.equal((html.match(/class="katex-display"/g)||[]).length,18);
assert.equal((html.match(/<math /g)||[]).length,83);
assert.equal((html.match(/class="inline-math"/g)||[]).length,65);
assert(!html.includes('${inlineMath'));
for(const tex of [String.raw`\frac{1}{1-\beta}`,String.raw`-\frac{1}{\log\beta}`,String.raw`X_0=\frac{M}{\|M\|_F}`,String.raw`\operatorname{SNR}=\frac{\|g\|_2^2}{\operatorname{tr}(\Sigma)/B}`,String.raw`\frac{D\eta^2\Sigma}{B^2}`,String.raw`\|\Delta\theta\|_2\le\eta\tau`])assert(html.includes(tex),tex);
assert(html.includes(String.raw`\eta_t=\eta_{\mathrm{peak}}\frac{t}{T_w}`));
assert(html.includes(String.raw`0\le t\le T_w`));
assert(html.includes(String.raw`T_w&gt;0`));
assert(!html.includes('Original notes'));
for(const detail of ['η cancels','not a covariance matrix or a Hessian','nuclear-norm multiplier','0.2','not a mathematical constant','0.95','100K','50–500','1–5%','1/\\sqrt{d_{\\mathrm{head}}}','0.3118','0.2920','near-optimal','Rank deficiency','not equivalent to a different scalar learning rate','optimizer checkpoint'])assert(html.includes(detail),detail);
for(const tex of [String.raw`\|\cdot\|_2`,String.raw`\|\cdot\|_*`,String.raw`B=256\to1024`,String.raw`\eta=10^{-4}\to2\times10^{-4}`,String.raw`b=b_{\mathrm{noise}}`,String.raw`b\in(0,1]`,String.raw`\beta_2=0.925`,String.raw`\varepsilon=10^{-20}`])assert(html.includes(`<annotation encoding="application/x-tex">${tex}</annotation>`),tex);
console.log('Optimization source closure: six Git-equal original bodies,98 exact old headings,all citations,no embedded assets,no public originals and18 display/83 total equations pass. Full primary and production gates remain separate.');
