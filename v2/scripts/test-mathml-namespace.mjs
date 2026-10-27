import assert from 'node:assert/strict';
import {readerMetas,renderDenseReader} from '../site/readers/index.js';
import {math} from '../site/readers/math.js';
import {foreignMathNodes} from './audit-mathml-namespace.mjs';

for(const malformed of ['<math><mi><munder><mo>min</mo><mi>x</mi></munder></mi></math>','<math><mo><mrow><mi>m</mi><mi>o</mi><mi>d</mi></mrow></mo></math>'])assert(foreignMathNodes(malformed).length>0);
for(const safe of ['<math><munder><mi>min</mi><mi>x</mi></munder></math>','<math><mi>mod</mi></math>','<div>Outside math <span>HTML is expected</span></div>'])assert.deepEqual(foreignMathNodes(safe),[]);
for(const tex of [String.raw`\operatorname*{arg\,max}_{z:\,\operatorname{concat}(z)=x}\sum_i\log p(z_i)`,String.raw`\operatorname*{arg\,min}_{x\in\Delta}f(x)`,String.raw`a\operatorname{mod}m`,String.raw`\mu+((t-\mu)\operatorname{mod}\lambda)`,String.raw`\frac{1-p}{2}=0.375\quad(p=1/4)`])assert.deepEqual(foreignMathNodes(math(tex,true)),[],tex);
const expected={
  'models/tokenization':String.raw`\operatorname*{arg\,max}_{z:\,\operatorname{concat}(z)=x}`,
  'training/data':String.raw`\operatorname*{arg\,min}_{x\in\Delta}`,
  'math/statistics':String.raw`r=n\operatorname{mod} k`,
  'algorithms/numbers':String.raw`\mu+((t-\mu)\operatorname{mod}\lambda)`,
  'models/compact-recipes':String.raw`=0.375\quad(p=1/4)`
};
let formulas=0;
for(const meta of readerMetas){
  const html=renderDenseReader(meta.slug,s=>'/atlas/'+s);
  formulas+=(html.match(/<math /g)||[]).length;
  assert.deepEqual(foreignMathNodes(html),[],meta.slug+' MathML must retain its namespace');
  if(expected[meta.slug])assert(html.includes(expected[meta.slug]),meta.slug+' exact revised operator annotation');
}
console.log(`MathML namespace: ${formulas} static formulas across ${readerMetas.length} readers have no HTML-namespace math descendants; malformed token/operator fixtures rejected and equivalent operator annotations retained. Not a screen-reader or mathematical correctness certification.`);
