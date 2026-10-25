import assert from 'node:assert/strict';
import {parseFragment} from 'parse5';
import {transformersReader} from '../site/readers/transformers.js';
import {assertGeneratedMarkup} from './check-generated-markup.mjs';
const html=assertGeneratedMarkup(transformersReader(s=>s),'Transformer notation');
const annotations=[],text=[],tables=[];
const content=n=>(n.nodeName==='#text'?n.value:'')+(n.childNodes||[]).map(content).join('');
function walk(n){if(n.tagName==='annotation')annotations.push(content(n));if(n.nodeName==='#text')text.push(n.value);if(n.tagName==='table')tables.push(n);for(const c of n.childNodes||[])walk(c);}
walk(parseFragment(html));
assert.equal((html.match(/<math /g)||[]).length,80);
for(const tex of [String.raw`\operatorname{softmax}\left(\frac{QK^\top}{\sqrt p}+M\right)V`,'M',String.raw`x_L=x_0+\sum_{\ell=0}^{L-1}F_\ell(x_\ell)`,String.raw`\varepsilon=10^{-5},\ \gamma=1,\ \beta=0`,String.raw`x+F(\operatorname{Norm}(x))`,String.raw`\operatorname{Norm}(x+F(x))`,String.raw`\operatorname{Norm}(x_L)`,String.raw`\operatorname{LN}(\alpha x+F(x))`,String.raw`\alpha=(2M)^{1/4}`,String.raw`\beta=(8M)^{-1/4}`,String.raw`\frac1d`,String.raw`\frac1{\sqrt L}`,'d=768',String.raw`\frac1{\sqrt d}\approx0.036`,String.raw`\sqrt p`,String.raw`\max(0,x)`,String.raw`\begin{cases}x&x\ge0\\ax&x<0\end{cases}`,String.raw`\sigma(x)=\dfrac1{1+e^{-x}}`,String.raw`\tanh(x)`,String.raw`x\Phi(x)`,String.raw`x\sigma(\beta x)`,String.raw`\beta=1`,String.raw`\operatorname{clamp}(x,-1,1)`])assert(annotations.includes(tex),tex);
for(const phrase of ['not a sum of independent random variables','selected Xavier gains','Q/K gains remain 1','uncorrelated model','not the DeepNorm formula','Real queries and keys can be correlated','endpoints nondifferentiable'])assert(text.join(' ').includes(phrase),phrase);
for(const caption of ['Same normalization family, different placement','Scalar activations; x is a preactivation']){
  const table=tables.find(n=>content(n).includes(caption));assert(table,caption);
  assert.equal(table.attrs.find(a=>a.name==='style')?.value,'min-width:560px');
}
for(const tex of [String.raw`S=\frac LN`,'O(Nd)','N=L','N=1','L=128, N=8, S=16','3d','5.5d','24d','34d','NTd',String.raw`N\frac TP d`,String.raw`D_{c,x}=\log\frac{p(x\mid c)}{p(r\mid c)}`,String.raw`h_c^\top(w_x-w_r)`,String.raw`(\log 2)^2`,'d=1',String.raw`d<\operatorname{rank}(A)-1`,String.raw`h'=\sum_k\pi_k h_k`,String.raw`\operatorname{softmax}(h'W^\top)`,'d=hp',String.raw`h_{\mathrm{kv}}`,'p=64','3.5d','10.5d^2','4d','8d^2'])assert(annotations.includes(tex),tex);
for(const phrase of ['not identical to it','residual-mechanism estimates, not whole-model traffic','before sharding','probability matrix P itself can have higher rank','deliberately bias-free','not quality or hardware guarantees','Parameter count is not wall-clock cost'])assert(text.join(' ').includes(phrase),phrase);
const counterexample=tables.find(n=>content(n).includes('A positive target distribution from two contexts'));
assert(counterexample);assert.equal(counterexample.attrs.find(a=>a.name==='style')?.value,'min-width:560px');
const targetAnnotations=[];function collect(n){if(n.tagName==='annotation')targetAnnotations.push(content(n));for(const c of n.childNodes||[])collect(c);}collect(counterexample);
assert.deepEqual(targetAnnotations,[String.raw`\dfrac12`,String.raw`\dfrac14`,String.raw`\dfrac14`,String.raw`\log 2`,String.raw`\dfrac14`,String.raw`\dfrac12`,String.raw`\dfrac14`,String.raw`\log 2`]);
const target=[[.5,.25,.25],[.25,.5,.25]],odds=target.map(row=>row.slice(0,2).map(p=>Math.log(p/row[2])));
assert.equal(odds[0][0]*odds[1][1]-odds[0][1]*odds[1][0],Math.log(2)**2);
assert.equal(4096/32,128);assert.equal(4096/64,64);
assert.equal(3*4096*14336/4096**2,10.5);assert.equal(2*4096*(4*4096)/4096**2,8);
const geometry=tables.find(n=>content(n).includes('Valid illustrative geometries'));
assert(geometry);assert.equal(geometry.attrs.find(a=>a.name==='style')?.value,'min-width:560px');
const values=[];function cells(n){if(n.tagName==='td')values.push(content(n));else for(const c of n.childNodes||[])cells(c);}cells(geometry);
assert.deepEqual(values,['2,048','16','4','128','~5,461','3,072','24','6','128','8,192','4,096','32','8','128','14,336','4,096','64','8','64','14,336']);
console.log('Transformer notation:59 inline formulas, parsed assumptions,four readable comparisons and independently checked rank/budget examples pass. Broader numerical checks remain in the owning test.');
