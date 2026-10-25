import assert from 'node:assert/strict';
import {flashSteps,flashState,flashInputs,flashValues,flashSections} from '../prototypes/readers/attention-flash.js';
import {attentionReader,attentionSections} from '../prototypes/readers/attention.js';
let cases=0;
for(const a of [-3,0,4])for(const b of [-3,0,4])for(const c of [-3,0,4])for(const d of [-3,0,4]){
  const scores=[a,b,c,d],steps=flashSteps(scores);
  assert.equal(steps[0].output,null);
  for(let n=1;n<=4;n++){
    const max=Math.max(...scores.slice(0,n));
    const mass=scores.slice(0,n).map(x=>Math.exp(x-max));
    const total=mass.reduce((x,y)=>x+y,0);
    const expected=[0,1].map(j=>mass.reduce((s,w,i)=>s+w*flashValues[i][j],0)/total);
    assert.equal(steps[n].m,max);
    assert(Math.abs(steps[n].l-total)<1e-12);
    expected.forEach((x,j)=>assert(Math.abs(x-steps[n].output[j])<1e-12));
    assert(steps[n].scale>=0&&steps[n].scale<=1);cases++;
  }
}
for(const scenario of Object.keys(flashInputs))for(let stage=0;stage<=4;stage++){
  const html=flashState(scenario,stage);assert(html.includes('tiles='+stage));
  assert(!html.includes('NaN'));assert(html.includes('Weighted accumulator'));cases++;
}
assert.throws(()=>flashSteps([1,2,3,NaN]),RangeError);
assert.throws(()=>flashState('missing',1),RangeError);
assert.throws(()=>flashState('rising',5),RangeError);
const html=attentionReader(s=>'/atlas/'+s);
for(const [id]of flashSections){assert(attentionSections.some(s=>s[0]===id));assert(html.includes('id="'+id+'"'));}
assert(html.indexOf('id="flash"')<html.indexOf('id="flash-worked"'));
assert(html.indexOf('id="flash-kernels"')<html.indexOf('id="sparse"'));
assert(html.includes('Tensor Memory Accelerator'));
assert(html.includes('flash_attn.cute'));
assert(html.includes('values stay fixed'));
console.log(`FlashAttention: ${cases} independently normalized prefix/scene cases; kernel contracts and meaningful section order pass.`);
