import assert from 'node:assert/strict';
import {parseFragment} from 'parse5';
import {swallowedMarkup} from './audit-swallowed-markup.mjs';
import {readerMetas,renderDenseReader} from '../site/readers/index.js';

for(const relation of ['l<h','Lᵢ<Lⱼ','0<fᵢ≤1','s<t','a<b']){
  const html=`<figure><figcaption>Require ${relation}. Keep this condition.</figcaption></figure>`;
  assert.equal(swallowedMarkup(html).length,1,relation+' must expose swallowed closing markup');
}
for(const html of ['<p>a&lt;b. Keep this condition.</p>','<p>a < b. Keep this condition.</p>','<span title="Use </p> as text">Attribute only</span>',"<span title='Use </p> as text'>Attribute only</span>",'<figure><figcaption>Safe <em>condition</em>.</figcaption></figure>'])assert.deepEqual(swallowedMarkup(html),[]);
const captions={
  'training/scaling':['The displayed difference is predicted; measured differences are fitting targets.','k is the outer exponent, not a run index.'],
  'training/frontier-recipes':['Require a positive denominator.','soft rewards need an explicit eligibility rule.'],
  'models/diffusion':['Use a compatible schedule and output conversion.'],
  'training/numerics':['without clipping and with exact probabilities.','A value already on the grid can be returned exactly; do not divide by']
};
for(const meta of readerMetas){
  const html=renderDenseReader(meta.slug,s=>'/atlas/'+s);
  assert.deepEqual(swallowedMarkup(html),[],meta.slug);
  const queue=[parseFragment(html)],text=[];
  while(queue.length){const n=queue.pop();if(n.tagName==='figcaption'){
    const items=[n],parts=[];while(items.length){const child=items.pop();if(child.nodeName==='#text')parts.push(child.value);items.push(...(child.childNodes||[]).slice().reverse());}text.push(parts.join(''));
  }queue.push(...n.childNodes||[]);}
  for(const phrase of captions[meta.slug]||[])assert(text.some(t=>t.includes(phrase)),meta.slug+' parsed caption must retain '+phrase);
}
console.log('Swallowed-caption markup: all 54 static readers pass; five broken comparisons detected, escaped/spaced relations and quoted attributes accepted; four affected caption bodies preserved.');
