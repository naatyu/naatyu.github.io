import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import GithubSlugger from 'github-slugger';
import {lossesReader,lossesAliases} from '../site/readers/losses.js';
import {table} from '../site/readers/loss-table.js';
import {reviewedFragments,resolveReviewedNote} from '../site/reviewed-navigation.js';
const root=new URL('../../',import.meta.url),html=lossesReader(s=>s),ids=new Set([...html.matchAll(/ id="([^"]+)"/g)].map(x=>x[1]));
const sources=[['ai/training/losses/l2-norm-and-loss','7aeb1de11b82337c38bd641890aef580539e319d7af1bf8d6b570203aa3fa8ea'],['ai/training/losses/cross-entropy-loss','bcafe97112aa633c15a8926e63de7c93729276f73a2668ab38016bc950276ce8'],['ai/training/losses/binary-cross-entropy-loss','7856f084e2f551571e89261409860af479a62509e1b0a9fbb4a258c9ff66deaa'],['ai/training/losses/proper-scoring-rules-and-fenchel-young-losses','c6a41498f1e0848466906aaf5d91b71cb7c5b3d7d4aec38ca9a462cf2344e830'],['ai/modalities/classical-ml/support-vector-machines-and-the-margin','8ddd869e12c4bdcefd1b4e4280e38dcbf71a59dbd56bf9a37dec6beedc02f391']];
let headings=0;for(const[slug,sha]of sources){const p='docs/'+slug+'.md',s=readFileSync(new URL(p,root),'utf8');assert.equal(s,execFileSync('git',['show','HEAD:'+p],{cwd:root,encoding:'utf8'}));assert.equal(createHash('sha256').update(s).digest('hex'),sha);assert(!/!\[|<PaperFigure|<img/.test(s));const g=new GithubSlugger(),hs=[...s.matchAll(/^#{1,6} (.+)$/gm)].map(x=>g.slug(x[1]));assert.deepEqual(Object.keys(reviewedFragments[slug]),hs);headings+=hs.length;assert(lossesAliases.includes(slug));assert(!html.includes('href="'+slug+'"'));for(const h of hs){const d=resolveReviewedNote(slug+'#'+h);assert(['training/objectives','math/information'].includes(d.slug));if(d.slug==='training/objectives')assert(ids.has(d.anchor),h);}}
assert.equal(headings,69);assert(!html.includes('Complete originals retained'));
for(const s of ['supergradient','Rényi','rare language tokens','Forward KL is infinite','Reverse KL','Structural risk minimization','tie policy','Minimal nonnegative slack','real vocabulary size','Callable Brier reference','Unknown reduction','equal-token/equal-compute'])assert(html.includes(s),s);
const code=html.match(/aria-label="Brier loss callable reference"><code>([\s\S]*?)<\/code>/)[1];
execFileSync('python3',['-c','import sys; compile(sys.stdin.read(),"brier-reference","exec")'],{input:code});
assert(code.includes('reduction == "none"'));assert(code.includes('reduction == "sum"'));assert(code.includes('reduction == "mean"'));
// Verify geometric arithmetic and slack elimination independently, not a fitted SVM solver.
let cases=0;for(let k=1;k<=32;k++)for(let score=-20;score<=20;score++){const m=score/10,xi=Math.max(0,1-m);assert(m>=1-xi-1e-12);assert(xi>=0);if(xi>0)assert(Math.abs(m-(1-xi))<1e-12);const w=[k,k/2],norm=Math.hypot(...w),unit=w.map(v=>v/norm),plus=unit.map(v=>v/norm),minus=plus.map(v=>-v);assert(Math.abs(Math.hypot(...plus.map((v,i)=>v-minus[i]))-2/norm)<1e-12);cases++;}
assert.equal((html.match(/class="katex-display"/g)||[]).length,22);
assert.equal((html.match(/class="katex-mathml"/g)||[]).length,63);
assert.equal((html.match(/class="inline-math"/g)||[]).length,41);
assert(!html.includes('${inlineMath'));
const tables=[...html.matchAll(/<div class="dense-table-wrap"([^>]*)><table([^>]*)>/g)];
assert.equal(tables.length,7);
for(const [,wrapper,element]of tables){assert(wrapper.includes('tabindex="0"'));assert(wrapper.includes('role="region"'));assert(wrapper.includes('aria-label='));assert(element.includes('min-width:640px'));}
assert(table('Quoted "caption" & value',['A'],[['B']]).includes('aria-label="Quoted &quot;caption&quot; &amp; value"'));
for(const tex of [String.raw`\|x\|_2=\sqrt{x^\top x}`,String.raw`R^\top R=I`,String.raw`(X^\top X+\lambda I)w=X^\top y`,String.raw`q_i=\frac{e^{z_i}}{\sum_j e^{z_j}}`,String.raw`S(q,i)=\sum_j(q_j-\mathbf{1}[j=i])^2`,String.raw`\frac{|f(x)|}{\|w\|_2}`,String.raw`-\frac{wp}{q}+\frac{1-p}{1-q}=0`,String.raw`\nabla\Phi(z)=q(z)`])assert(html.includes(tex),tex);
console.log(`Loss source closure: five Git-equal originals,${headings} actual headings,no old archive,22 typeset displays,callable Python syntax and ${cases} geometry/slack cases pass. PyTorch tensor execution and complete-primary/production review remain separate.`);
