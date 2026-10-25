import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {runInNewContext} from 'node:vm';
import {parseFragment} from 'parse5';
import {diffusionReader,diffusionSections,diffusionMeta} from '../prototypes/readers/diffusion.js';
import {sidGeneratorNoise} from '../prototypes/readers/diffusion-model.js';
import {assertGeneratedMarkup} from './check-generated-markup.mjs';
const nodes=[];
function walk(n){nodes.push(n);for(const c of n.childNodes||[])walk(c);}
walk(parseFragment(assertGeneratedMarkup(diffusionReader(()=>''),'SiD recipe')));
const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value;
const text=n=>(n.value||'')+(n.childNodes||[]).map(text).join('');
const descendants=(n,tag)=>{const out=[];function visit(x){if(x.tagName===tag)out.push(x);for(const c of x.childNodes||[])visit(c);}visit(n);return out;};
const section=id=>{const n=nodes.find(n=>attr(n,'id')===id);assert(n);assert(diffusionSections.some(([s])=>s===id));return n;};
const recipe=section('sid-recipe'),evidence=section('sid-evidence');
for(const phrase of ['EDM’s denoising sampler and weighting','Hold the generator fixed','uniform t on [0,0.8]','pixel count; sg stops gradients','Generator input-noise scale: 2.5','zero or nonfinite denominators','Do not silently introduce epsilon clipping'])assert(text(recipe).includes(phrase),phrase);
for(const phrase of ['50k images','every 500k synthetic images and select the lowest FID','not ten independent training runs','from 1024 to 8192','from 5e−6 to 4e−6','not an established diagnosis','not exponential convergence','excludes FID-evaluation cost'])assert(text(evidence).includes(phrase),phrase);
const annotations=descendants(recipe,'annotation').map(text);
assert(annotations.some(t=>t.includes(String.raw`\gamma(t)\lVert D_\psi(x_g+\sigma_t\epsilon,t)-x_g\rVert^2`)));
assert(annotations.some(t=>t.includes(String.raw`\operatorname{sg}(\lVert x_g-D_T(x_t,t)\rVert_1)`)));
const referenceRows=[['CIFAR-10 unconditional','35 / 1.97','2.028 ± 0.020','1.923 ± 0.017'],['ImageNet-64 conditional','511 / 1.36','2.022 ± 0.031','1.524 ± 0.009'],['ImageNet-64 conditional','79 / 2.64','Same student','Same student']];
assert.deepEqual(descendants(evidence,'tr').slice(1).map(r=>descendants(r,'td').map(text)),referenceRows);
const code=text(descendants(recipe,'code')[0]);assert.equal(code,sidGeneratorNoise.toString());assert(code.split('\n').length<=15);
const actual=runInNewContext('('+code+')');
// Decimal reference uses the paper's original high+(1-t)*(low-high)
// orientation, not the reader's simplified low+t*(high-low) expression.
const values=JSON.parse(execFileSync('python3',['-c',`from decimal import Decimal, localcontext
import json
with localcontext() as ctx:
    ctx.prec=70
    low=(Decimal('0.002').ln()/7).exp()
    high=(Decimal(80).ln()/7).exp()
    print(json.dumps([float((high+(1-Decimal(i)/1250)*(low-high))**7) for i in range(1001)]))
`],{encoding:'utf8'}));
for(let i=0;i<values.length;i++){
  const t=i/1250,expected=values[i];
  for(const result of [sidGeneratorNoise(t),actual(t)])assert(Math.abs(result-expected)<1e-12*Math.max(1,expected),`${t}: ${result} != ${expected}`);
  if(i)assert(sidGeneratorNoise(t)>sidGeneratorNoise((i-1)/1250));
}
for(const bad of [-1,-Number.MIN_VALUE,.8000001,1,NaN,Infinity,-Infinity,undefined,'0.5',null]){
  assert.throws(()=>sidGeneratorNoise(bad),RangeError);assert.throws(()=>actual(bad),/Generator time outside/);
}
assert.deepEqual(descendants(recipe,'tr').slice(1).map(r=>descendants(r,'td').map(text)),[['0','0.002000'],['0.4','0.965417'],['0.8','24.408342']]);
assert.equal(diffusionMeta.date,'2026-06-11');
console.log('SiD recipe: 1,001 Decimal-checked levels, actual rendered kernel execution, ten invalid domains, exact reported FID rows and source conditions pass; no neural or benchmark replication.');
