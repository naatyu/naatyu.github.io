import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import GithubSlugger from 'github-slugger';
import {reasoningReader,reasoningAliases} from '../prototypes/readers/reasoning.js';
import {reviewedFragments,resolveReviewedNote} from '../prototypes/reviewed-navigation.js';
const root=new URL('../../',import.meta.url);
const ledger=JSON.parse(readFileSync(new URL('.internal/v2/reasoning-core-closure.json',root),'utf8'));
const html=reasoningReader(s=>s);let headings=0;
assert.equal(ledger.sources.length,4);
for(const entry of ledger.sources){
  const path='docs/'+entry.slug+'.md',source=readFileSync(new URL(path,root),'utf8');
  assert.equal(source,execFileSync('git',['show','HEAD:'+path],{cwd:root,encoding:'utf8'}));
  assert.equal(createHash('sha256').update(source).digest('hex'),entry.sha256);
  const slugger=new GithubSlugger(),actual=[...source.matchAll(/^#{1,6} (.+)$/gm)].map(m=>slugger.slug(m[1]));
  assert.deepEqual(Object.keys(entry.headings),actual);headings+=actual.length;
  assert.deepEqual(reviewedFragments[entry.slug],entry.headings);
  assert(reasoningAliases.includes(entry.slug));assert(!html.includes(entry.slug));
  assert(!/!\[|<img\b|<PaperFigure\b|^import /m.test(source));
  for(const old of actual){const dest=resolveReviewedNote(entry.slug+'#'+old);assert.equal(dest.slug,'post-training/reasoning');assert(html.includes('id="'+dest.anchor+'"'));}
  for(const url of new Set([...source.matchAll(/https:\/\/[^\s)]+/g)].map(m=>m[0])))assert(html.includes(url),url);
}
assert.equal(headings,58);
assert.equal((html.match(/class="katex-display"/g)||[]).length,8);
assert.equal((html.match(/<math /g)||[]).length,8);
assert(!html.includes('Original notes'));
assert(!html.includes('ai/inference-serving/serving-architectures/large-language-model-serving'));
for(const detail of ['complete inference-method observations','862.6','33.6','45.0','57.8','47.4','response mask','two-fold cross-validation','not establish a fixed exchange','not a universal','2,000','global token','outweigh','zero probability','unconstrained','masked','intermediate sentence','execution/serving'])assert(html.includes(detail),detail);
// Exact FLOP-accounting identity, not a predicted quality or latency equivalence.
let comparisons=0;
for(const n of [1,3,10])for(const m of [1,2,14])for(const pre of [10,100,1000])for(const infer of [1,100,10000]){
  const k=m+3*(m-1)/(infer/pre);
  const large=6*m*n*pre+2*m*n*infer,small=6*n*pre+2*n*k*infer;
  assert(Math.abs(large-small)<=1e-12*Math.max(1,large));comparisons++;
}
assert.equal(comparisons,81);
console.log('Reasoning source closure: four Git-equal bodies,58 exact headings,all citations,no public originals,8 displays and81 FLOP-accounting identities pass. Full primary/book/figure and production gates remain separate.');
