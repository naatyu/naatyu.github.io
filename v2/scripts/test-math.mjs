import assert from 'node:assert/strict';
import './test-inline-math-inventory.mjs';
import {readFile} from 'node:fs/promises';
import {math,texEq} from '../site/readers/math.js';
import {optimizationReader} from '../site/readers/optimization.js';
import {reviewedNavigation,reviewedFragments,resolveReviewedNote} from '../site/reviewed-navigation.js';
import {canonicalReaderSlug,renderDenseReader} from '../site/readers/index.js';
import {mathInventory} from './audit-math.mjs';
const html=optimizationReader(s=>'/atlas/'+s),rows=mathInventory(),optimization=rows.find(r=>r.slug==='training/optimization');
assert.equal(optimization.legacy,0);assert.equal(optimization.errors,0);assert.equal(optimization.typeset,18);
assert.equal((html.match(/<math /g)||[]).length,83);
assert(!html.includes('Complete originals'));assert(!/href="\/atlas\/(ai|systems|interview-prep)\//.test(html));
assert(html.includes('functional-scaling'));assert(html.includes('gradient-diagnostics'));
for(const [source,{slug,anchor}]of Object.entries(reviewedNavigation)){
  assert.equal(canonicalReaderSlug(source),slug);assert(renderDenseReader(slug,s=>'/atlas/'+s).includes(`id="${anchor}"`));
}
for(const [source,map]of Object.entries(reviewedFragments))for(const [old,anchor]of Object.entries(map)){
  const r=resolveReviewedNote(source,'#'+old);
  const expected=typeof anchor==='object'?anchor.anchor:anchor;
  assert.equal(r.anchor,expected);
  if(typeof anchor==='object')assert.equal(r.slug,anchor.slug);
  assert(renderDenseReader(r.slug,s=>'/atlas/'+s).includes(`id="${expected}"`));
  assert.deepEqual(resolveReviewedNote(source+'#'+old),r);
}
assert.equal(resolveReviewedNote('math/probability/entropy','#unreviewed-fragment').anchor,'unreviewed-fragment');
assert.equal(resolveReviewedNote('not-a-reviewed-note'),null);
assert.throws(()=>math(String.raw`\frac{1}{`));
assert.throws(()=>math(String.raw`\unknowncommand`));
assert(texEq('x^2','Example').includes('tabindex="0"'));
assert(!math(String.raw`\href{javascript:alert(1)}{x}`).includes('href="javascript:'));
const css=await readFile(new URL('../site/readers/math.css',import.meta.url),'utf8');
assert(css.includes('overflow-x:auto'));assert(css.includes('white-space:nowrap'));
assert.equal(rows.find(r=>r.slug==='models/moe').legacy,0);
assert.equal(rows.find(r=>r.slug==='models/moe').typeset,9);
for(const [slug,count]of [['math/information',12],['training/objectives',22],['models/attention',19],['math/geometry',7],['math/calculus',16],['models/position',15],['math/statistics',10],['models/diffusion',38],['post-training/preferences',5],['training/scaling',35],['training/parallelism',11],['execution/speculation',12],['execution/decoding',7],['models/tokenization',4],['models/transformers',21],['models/recurrence',15],['training/data',8],['training/stability',6],['training/practice',7],['training/numerics',7],['post-training/distillation',13],['post-training/agents',14],['post-training/reasoning',8],['training/frontier-recipes',29],['models/compact-recipes',7],['models/decision-models',7],['models/vision-detection',6],['execution/hardware',3],['execution/profiling',1],['execution/communication',5],['computing/services',4],['execution/performance',23],['models/vision',17],['execution/serving',13],['algorithms/arrays',2],['algorithms/windows',1],['algorithms/stacks',1],['algorithms/binary-search',1],['algorithms/graphs',3],['algorithms/trees',1],['algorithms/dp',5],['algorithms/greedy',2],['algorithms/ordering',3]]){
  const row=rows.find(r=>r.slug===slug),body=renderDenseReader(slug,s=>'/atlas/'+s);
  assert.equal(row.legacy,0);assert.equal(row.typeset,count);assert.equal(row.errors,0);
assert.equal((body.match(/<math /g)||[]).length,count+(slug==='models/transformers'?59:slug==='post-training/preferences'?12:slug==='post-training/distillation'?19:slug==='math/statistics'?12:slug==='math/geometry'?17:slug==='math/calculus'?28:slug==='training/stability'?8:slug==='models/recurrence'?41:slug==='training/scaling'?84:slug==='training/practice'?14:slug==='training/objectives'?41:slug==='models/attention'?45:slug==='training/parallelism'?10:slug==='models/position'?27:slug==='models/vision'?13:slug==='models/vision-detection'?9:slug==='models/diffusion'?45:slug==='math/information'?9:slug==='execution/performance'?33:slug==='training/numerics'?35:slug==='models/compact-recipes'?11:slug==='post-training/agents'?4:slug==='execution/serving'?10:slug==='training/frontier-recipes'?25:slug==='training/data'?4:slug==='models/decision-models'?5:slug==='computing/services'?3:slug==='execution/communication'?12:slug==='algorithms/greedy'?1:slug==='algorithms/ordering'?2:['models/recurrence','execution/serving','execution/profiling','algorithms/arrays','algorithms/windows','algorithms/trees'].includes(slug)?2:0)); // Count display and reviewed inline formulas separately.
}
const problem=rows.find(r=>r.slug==='math/problem-solving');assert.equal(problem.typeset,11);assert.equal(problem.legacy,0);assert.equal(problem.errors,0);assert.equal((renderDenseReader('math/problem-solving',s=>'/atlas/'+s).match(/<math /g)||[]).length,33);
const numbers=rows.find(r=>r.slug==='algorithms/numbers'),numbersBody=renderDenseReader('algorithms/numbers',s=>'/atlas/'+s);assert.equal(numbers.typeset,5);assert.equal(numbers.legacy,0);assert.equal(numbers.errors,0);assert.equal((numbersBody.match(/class="inline-math"/g)||[]).length,9);assert.equal((numbersBody.match(/<math /g)||[]).length,14); // Five displays and nine inline representation/cycle/distance/LCM formulas.
const sft=renderDenseReader('post-training/sft',s=>'/atlas/'+s),sftRow=rows.find(r=>r.slug==='post-training/sft');assert.equal(sftRow.typeset,10);assert.equal(sftRow.legacy,0);assert.equal(sftRow.errors,0);assert.equal((sft.match(/<math /g)||[]).length,26); // Ten displays and sixteen reviewed inline formulas.
const information=renderDenseReader('math/information',s=>'/atlas/'+s);
assert.equal((information.match(/class="inline-math"/g)||[]).length,9); // Coding proof,unit conversion,mixture,log ratio and incremental cost.
const rl=renderDenseReader('post-training/rl',s=>'/atlas/'+s),rlRow=rows.find(r=>r.slug==='post-training/rl');
assert.equal(rlRow.typeset,37);assert.equal(rlRow.legacy,0);assert.equal(rlRow.errors,0);
assert.equal((rl.match(/<math /g)||[]).length,55); // 37 displays and 18 reviewed inline formulas.
const probability=renderDenseReader('math/probability',s=>'/atlas/'+s),probabilityRow=rows.find(r=>r.slug==='math/probability');
assert.equal(probabilityRow.typeset,14);assert.equal(probabilityRow.legacy,0);assert.equal(probabilityRow.errors,0);
assert.equal((probability.match(/<math /g)||[]).length,32);
assert.equal((probability.match(/class="inline-math"/g)||[]).length,18); // CF examples/identities plus covariance, nonlinear dependence, quantile and empirical examples.
assert(!probability.includes('Complete originals'));assert(!/href="\/atlas\/(ai|systems|interview-prep)\//.test(probability));
assert(probability.includes('below 3'));assert(probability.includes('widehat'));
assert(!information.includes('Complete originals'));
assert(!/href="\/atlas\/(ai|systems|interview-prep)\//.test(information));
for(const phrase of ['Fitch–Margoliash','prefix code','description length','Lempel and Ziv','On Information and Sufficiency','long snippet'])assert(information.includes(phrase),phrase);
assert(rows.every(r=>r.errors===0));
assert(rows.every(r=>r.legacy===0));
const discovery=rows.find(r=>r.slug==='models/scientific-discovery');assert.equal(discovery.typeset,1);assert.equal((renderDenseReader(discovery.slug,s=>'/atlas/'+s).match(/<math /g)||[]).length,2);
for(const slug of ['algorithms/backtracking','algorithms/choosing']){assert.equal(rows.find(r=>r.slug===slug).typeset,slug==='algorithms/choosing'?1:0);assert(renderDenseReader(slug,s=>'/atlas/'+s).includes('<figure class="dense-boundary">'));}
console.log(`Math: ${rows.length} readers inventoried; ${rows.reduce((n,r)=>n+r.typeset,0)} typeset displays parse with MathML. ${rows.reduce((n,r)=>n+r.legacy,0)} legacy displays remain. Invalid/unsafe TeX and exact reviewed navigation are checked separately from mathematical correctness.`);
