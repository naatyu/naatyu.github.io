import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import GithubSlugger from 'github-slugger';
import {servingReader} from '../prototypes/readers/serving.js';
import {resolveReviewedNote,reviewedFragments} from '../prototypes/reviewed-navigation.js';
const root=new URL('../../',import.meta.url),html=servingReader(s=>s);
const ids=new Set([...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]));
let count=0;
for(const slug of ['ai/inference-serving/caching/kv-cache','ai/inference-serving/performance/llm-inference-economics','ai/inference-serving/serving-architectures/disaggregated-prefill-decode-serving','ai/inference-serving/serving-architectures/large-language-model-serving']){
  const source='docs/'+slug+'.md',body=readFileSync(new URL(source,root)),g=new GithubSlugger();
  assert.deepEqual(body,execFileSync('git',['show','HEAD:'+source],{cwd:root}));
  const headings=[...body.toString().matchAll(/^#{1,6} (.+)$/gm)].map(m=>g.slug(m[1]));
  assert.deepEqual(Object.keys(reviewedFragments[slug]),headings);
  for(const heading of headings){const target=resolveReviewedNote(slug+'#'+heading);assert.equal(target.slug,'execution/serving');assert.ok(ids.has(target.anchor),heading);count++;}
}
assert.equal(count,44);
const asset='static/attachments/computer-science/system-design/large-language-model-serving/large-language-model-serving-01.png';
assert.deepEqual(readFileSync(new URL(asset,root)),execFileSync('git',['show','HEAD:'+asset],{cwd:root}));
for(const text of ['eligible prompt tokens','Transfer overlap','prefill side','Auth0','Weights &amp; Biases','Grafana','return-path contract','same distinct K/V','not a guaranteed latency ratio'])assert.ok(html.includes(text),text);
assert.equal((html.match(/class="inline-math"/g)||[]).length,10);
assert.equal((html.match(/<math /g)||[]).length,23);assert.ok(!html.includes('katex-error'));
assert.equal((html.match(/<table style="min-width:640px">/g)||[]).length,6);
assert.equal((html.match(/<pre tabindex="0" role="region" aria-label="Serving interface sketch">/g)||[]).length,2);
console.log('Serving preservation: four Git-verified core bodies,44 exact headings, original diagram recovery,10 inline formulas and accessible reference surfaces pass.');
