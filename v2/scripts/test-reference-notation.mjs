// Scoped notation preservation, not a complete source or mathematical audit.
import assert from 'node:assert/strict';
import {parseFragment} from 'parse5';
import {parallelismReader,parallelismMeta} from '../site/readers/parallelism.js';
import {dataReader,dataMeta} from '../site/readers/data.js';
import {decisionReader,decisionMeta} from '../site/readers/decision.js';
import {decisionScenes} from '../site/readers/decision-scenes.js';
import {assertGeneratedMarkup} from './check-generated-markup.mjs';
import {rawMathCandidates} from './audit-math.mjs';

function elements(html){
  const nodes=[];
  function visit(n){nodes.push(n);for(const c of n.childNodes||[])visit(c);}
  visit(parseFragment(html));return nodes;
}
const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value;
function text(n){return n.nodeName==='#text'?n.value:(n.childNodes||[]).map(text).join('');}
function annotations(html){return elements(html).filter(n=>n.tagName==='annotation'&&attr(n,'encoding')==='application/x-tex').map(text);}
function sectionText(html,id){const n=elements(html).find(n=>attr(n,'id')===id);assert(n,id);return text(n);}
const samples=[
  [parallelismReader,parallelismMeta,10,[String.raw`N=XY`,String.raw`X`,String.raw`\frac1X`,String.raw`Y=\frac NX`]],
  [dataReader,dataMeta,4,[String.raw`D_{\rm KL}(x\|x_0)`]],
  [decisionReader,decisionMeta,5,[String.raw`p_i\ge0`,String.raw`\sum_{i=0}^{n-1}p_i=1`,String.raw`0,\ldots,n-1`,String.raw`q=0.7`,String.raw`\mathbb E[(p-Y)^2]`]],
];
for(const [render,meta,count,formulas]of samples){
  const html=assertGeneratedMarkup(render(s=>'/atlas/'+s+'/'),'reference notation');
  assert.equal(elements(html).filter(n=>attr(n,'class')==='inline-math').length,count,meta.slug);
  const actual=annotations(html);for(const f of formulas)assert(actual.includes(f),meta.slug+': '+f);
  assert.equal(meta.updated,'2026-10-18');
  assert.equal(meta.date,meta===decisionMeta?'2026-08-05':'2026-04-08');
}
const parallel=parallelismReader(s=>s),data=dataReader(s=>s),decision=decisionReader(s=>s);
const roof=sectionText(parallel,'rooflines');
for(const term of ['simplified forward MLP model','continuous candidate','valid hardware divisors','full mutual overlap'])assert(roof.includes(term),term);
assert(!rawMathCandidates(parallel).some(c=>c.section==='rooflines'));
const surrogate=sectionText(data,'surrogate');
for(const term of ['positive mass','zero mass','explicit modeling decision','does not validate the surrogate'])assert(surrogate.includes(term),term);
assert(!rawMathCandidates(data).some(c=>c.section==='surrogate'));
const distribution=sectionText(decision,'distributions');
for(const term of ['mean is 1.2','does not reconstruct a distribution','not automatically an interval scale'])assert(distribution.includes(term),term);
assert(!rawMathCandidates(decision).some(c=>c.section==='distributions'));
const objective=decisionScenes().objective;
assert(text(parseFragment(objective)).includes('not two-class sum'));
assert(!rawMathCandidates(objective).some(c=>c.context==='caption'));
console.log('Reference notation: 10 new inline expressions, parsed support/mesh/rubric/Brier conditions and publication lineage pass. Numerical model tests remain separate.');
