import assert from 'node:assert/strict';
import {parseFragment} from 'parse5';
import {sftReader} from '../prototypes/readers/sft.js';
import {newToken,invariantScale} from '../prototypes/readers/sft-model.js';
import {assertGeneratedMarkup} from './check-generated-markup.mjs';
const html=assertGeneratedMarkup(sftReader(s=>s),'SFT notation');
const annotations=[],parts=[],tables=[];
const text=n=>(n.nodeName==='#text'?n.value:'')+(n.childNodes||[]).map(text).join('');
function walk(n){if(n.tagName==='annotation')annotations.push(text(n));if(n.nodeName==='#text')parts.push(n.value);if(n.tagName==='table')tables.push(n);for(const c of n.childNodes||[])walk(c);}
walk(parseFragment(html));
assert.equal((html.match(/<math /g)||[]).length,26);
for(const tex of [String.raw`Z=\sum_{i\in\mathcal V_{\mathrm{old}}}\exp(z_i)`,String.raw`a=\exp(z_{\mathrm{new}})`,String.raw`\frac{Z}{Z+a}`,String.raw`D_{\mathrm{KL}}(p_{\mathrm{old}}\Vert p_{\mathrm{expanded}})=\log\left(1+\frac aZ\right)`,String.raw`W_{\mathrm{merged}}=W+\gamma BA`,String.raw`\frac\alpha r`,String.raw`\frac\alpha{\sqrt r}`,'p=2','q=3',String.raw`\alpha`,String.raw`\dfrac13`,String.raw`c_{\mathrm{initial}}=0.0002`,String.raw`c_{\mathrm{time}}=100`])assert(annotations.includes(tex),tex);
for(const condition of ['old logits','fixed-logit normalization drift','full-model stability','dropout disabled','Quantization and rounding','negligible epsilon effects','not a measured training comparison'])assert(parts.join(' ').includes(condition),condition);
const table=tables.find(n=>text(n).includes('One idealized LoRA coordinate rescaling'));
assert(table);
const cells=[];function collect(n){if(n.tagName==='td')cells.push(n);else for(const c of n.childNodes||[])collect(c);}collect(table);
assert.equal(cells.length,12);
for(const [i,value] of [[1,'2'],[4,'0.1'],[5,'0.2'],[7,'0.001'],[8,'0.002'],[10,'0.001'],[11,'0.003']])assert.equal(text(cells[i]),value);
let cases=0;
for(let i=-20;i<=20;i++){
  const h=i/10,result=newToken(undefined,undefined,[h,.5]);
  const weights=[1,0,-1].map(Math.exp),z=weights.reduce((a,b)=>a+b,0),extra=Math.exp(.5*h+.5);
  let directKL=0;
  for(const w of weights){const old=w/z,expanded=w/(z+extra);directKL+=old*(Math.log(old)-Math.log(expanded));}
  assert(Math.abs(result.oldKL-directKL)<1e-14);
  assert(Math.abs(result.retained-z/(z+extra))<1e-14);
  cases++;
}
const example=invariantScale(2,.1,.001,.001,2,3);
assert.equal(example.alpha,1/3);assert.equal(example.init,.2);assert.equal(example.lrA,.002);assert.equal(example.lrB,.003);
assert(Math.abs(example.alpha*example.init*example.lrB-.0002)<1e-18);assert.equal(example.init/example.lrA,100);
console.log(`SFT notation:13inline additions, parsed rescaling table/conditions and ${cases} independent normalization/KL checks pass.`);
