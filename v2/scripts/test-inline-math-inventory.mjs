import assert from 'node:assert/strict';
import {rawMathCandidates,inlineMathInventory} from './audit-math.mjs';
import {inlineMath} from '../site/readers/math.js';
const html=`<section id="outer"><p>x=1/2</p><div class="topic-scene" id="demo"><p>y=√2</p><figcaption>z=Σx²</figcaption></div><p>w=3/4</p><table><tr><td>q=1/3</td></tr></table><p>${inlineMath(String.raw`r=\frac12`)}</p><pre><code>s=1/5</code></pre><svg><text>t=√3</text></svg></section>`;
assert.deepEqual(rawMathCandidates(html),[
  {section:'outer',context:'prose',text:'x=1/2'},
  {section:'demo',context:'scene',text:'y=√2'},
  {section:'demo',context:'caption',text:'z=Σx²'},
  {section:'outer',context:'prose',text:'w=3/4'},
  {section:'outer',context:'table',text:'q=1/3'},
]);
assert.deepEqual(rawMathCandidates('<p>Ordinary prose. Model size 7B.</p>'),[]);
const rows=inlineMathInventory();
assert.equal(rows.length,56);assert.equal(new Set(rows.map(r=>r.slug)).size,56);
for(const row of rows)for(const candidate of row.candidates){
  assert.equal(typeof candidate.section,'string');
  assert(['prose','scene','caption','table'].includes(candidate.context));
  assert(candidate.text.length>0);
}
console.log('Raw inline-math review queue:56 readers;scope/context/exclusion tests pass. Candidates are not automatic errors or semantic certification.');
