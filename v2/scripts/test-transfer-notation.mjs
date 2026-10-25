import assert from 'node:assert/strict';
import {parseFragment} from 'parse5';
import {preferencesReader} from '../site/readers/preferences.js';
import {distillationReader} from '../site/readers/distillation.js';
import {assertGeneratedMarkup} from './check-generated-markup.mjs';
const expectations=[
  ['Preferences',preferencesReader,17,[String.raw`\pi_\theta=\pi_{\mathrm{ref}}`,String.raw`\Delta=0`,String.raw`\frac12`,String.raw`\log 2`,String.raw`-\log\frac53`,'t=4',String.raw`\mathbb E[r]-\beta D_{\mathrm{KL}}(\pi\Vert\pi_{\mathrm{ref}})`,'r',String.raw`\pi_{\mathrm{ref}}\exp\left(\frac r\beta\right)`,String.raw`-\frac{\beta}{2}`],['need not have equal absolute probability','not a prediction of every DPO run','score-coordinate partial derivatives','fixed reward','local gradient magnitude','not a universal default']],
  ['Distillation',distillationReader,32,['z_T','z_S',String.raw`\tau>0`,String.raw`q_\tau=\operatorname{softmax}\left(\frac{z_T}{\tau}\right)`,String.raw`p_\tau=\operatorname{softmax}\left(\frac{z_S}{\tau}\right)`,String.raw`D_{\mathrm{KL}}(p\Vert q)=\sum_i p_i(\log p_i-\log q_i)`,String.raw`\tau^2`,String.raw`\frac{p_\tau-q_\tau}{\tau}`,String.raw`\frac1\tau`,'d(a)',String.raw`\nabla d(a)=\nabla\log p(a\mid h)`,String.raw`A=\log q(a\mid h)-\log p_b(a\mid h)`,'p_b',String.raw`-\mathbb E[A\log p_\theta(a\mid h)]`,String.raw`\rho=\frac{p_\theta(a\mid h)}{p_b(a\mid h)}`,String.raw`\rho A`,String.raw`\rho=1`],['same ordered label set','student entropy is now trainable','parameter-dependent sampling probabilities','fixed-prefix reverse-KL gradient','Stale prefixes require more care','not generally the full sequence-KL gradient']]
];
for(const [name,reader,count,texes,conditions] of expectations){
  const html=assertGeneratedMarkup(reader(s=>s),name+' notation');
  const annotations=[],parts=[];
  function walk(n){if(n.tagName==='annotation')annotations.push(n.childNodes.map(c=>c.value||'').join(''));if(n.nodeName==='#text')parts.push(n.value);for(const c of n.childNodes||[])walk(c);}
  walk(parseFragment(html));
  assert.equal((html.match(/<math /g)||[]).length,count);
  for(const tex of texes)assert(annotations.includes(tex),name+': '+tex);
  for(const condition of conditions)assert(parts.join(' ').includes(condition),name+': '+condition);
}
console.log('Transfer notation: Preferences12inline/17MathML andDistillation19inline/32MathML; exact annotations and parsed assumptions pass. Numerical gradients are checked in the owning model tests.');
