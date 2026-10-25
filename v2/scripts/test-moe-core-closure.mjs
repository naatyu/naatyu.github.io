import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import GithubSlugger from 'github-slugger';
import {moeReader,moeAliases} from '../site/readers/moe.js';
import {reviewedFragments,resolveReviewedNote} from '../site/reviewed-navigation.js';
const root=new URL('../../',import.meta.url),ledger=JSON.parse(readFileSync(new URL('.internal/v2/moe-core-closure.json',root),'utf8'));
const html=moeReader(s=>s);let headings=0;
for(const entry of ledger.sources){
  const path='docs/'+entry.slug+'.md',source=readFileSync(new URL(path,root),'utf8');
  assert.equal(source,execFileSync('git',['show','HEAD:'+path],{cwd:root,encoding:'utf8'}));
  assert.equal(createHash('sha256').update(source).digest('hex'),entry.sha256);
  const slugger=new GithubSlugger(),actual=[...source.matchAll(/^#{1,6} (.+)$/gm)].map(m=>slugger.slug(m[1]));
  assert.deepEqual(Object.keys(entry.headings),actual);headings+=actual.length;
  assert.deepEqual(reviewedFragments[entry.slug],entry.headings);
  assert(moeAliases.includes(entry.slug));assert(!html.includes(entry.slug));
  assert(!/!\[|<img\b|<PaperFigure\b|^import /m.test(source));
  for(const old of actual){const dest=resolveReviewedNote(entry.slug+'#'+old);assert.equal(dest.slug,'models/moe');assert(html.includes('id="'+dest.anchor+'"'));}
  for(const url of new Set([...source.matchAll(/https:\/\/[^\s)]+/g)].map(m=>m[0])))assert(html.includes(url),url);
}
assert.equal(headings,30);
assert.equal((html.match(/class="katex-display"/g)||[]).length,9);
assert(html.includes(String.raw`b_i\leftarrow b_i+\eta\operatorname{sign}(2-c_i)`));
assert(html.includes('current token count'));
assert(!html.includes('Each step applies bᵢ'));
for(const detail of ['marginal loss reduction','V3’s small-model ablations','selective precision alone was insufficient','hundreds of billions of tokens','LM-head input-gradient','effective-weight-decay','1,000 bins','almost zero contribution'])assert(html.includes(detail),detail);
for(const old of ['ai/architectures/transformers/moe-looped-language-models','ai/training/optimization/muon-optimizer','systems/performance/model-flops-utilization-mfu','ai/training/scaling/transformer-scaling-rules','ai/training/optimization/rules-of-engagement-for-llm-training'])assert(!html.includes(old),old);
assert(!html.includes('Original pages remain available'));
assert(!/href="(?:ai|systems)\//.test(html),'All related topics must use canonical v2 destinations');
console.log('MoE core closure: two Git-equal bodies,30 exact headings,all source citations,9 displays and zero old-note dependencies pass; full primary/production review remains separate.');
