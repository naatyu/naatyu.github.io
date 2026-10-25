import assert from 'node:assert/strict';
import {foreignMathNodes} from './audit-mathml-namespace.mjs';
import {swallowedMarkup} from './audit-swallowed-markup.mjs';
const counts=new Map();

// Return the same markup so an existing numerical/render assertion can wrap
// its generator without invoking it twice. No runtime reader code is changed.
export function assertGeneratedMarkup(html,label='generated scene'){
  assert.equal(typeof html,'string',label+' must return HTML');
  assert(!html.includes('${'),label+' contains unresolved template interpolation');
  // These cheap prefilters only skip impossible cases for these two targeted
  // guards. They are not a general HTML validator or a raw-math classifier.
  if(/<math(?:\s|>)/i.test(html))assert.deepEqual(foreignMathNodes(html),[],label+' has foreign-namespace math descendants');
  if(/<[^>]*<\/[a-z][^>]*>/i.test(html))assert.deepEqual(swallowedMarkup(html),[],label+' has swallowed closing markup');
  counts.set(label,(counts.get(label)||0)+1);
  return html;
}

export function assertGeneratedMarkupCount(label,expected){
  assert.equal(counts.get(label)||0,expected,label+' did not guard every declared rendered state');
}
