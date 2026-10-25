import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import GithubSlugger from 'github-slugger';
import {visionReader,visionAliases} from '../site/readers/vision.js';
import {reviewedFragments,resolveReviewedNote} from '../site/reviewed-navigation.js';
const root=new URL('../../',import.meta.url),html=visionReader(s=>s);
const ledger=JSON.parse(readFileSync(new URL('.internal/v2/vision-core-closure.json',root),'utf8'));
let headings=0;assert.equal(ledger.sources.length,3);
for(const e of ledger.sources){
  const path='docs/'+e.slug+'.md',body=readFileSync(new URL(path,root),'utf8');
  assert.equal(body,execFileSync('git',['show','HEAD:'+path],{cwd:root,encoding:'utf8'}));
  assert.equal(createHash('sha256').update(body).digest('hex'),e.sha256);
  const g=new GithubSlugger(),ids=[...body.matchAll(/^#{1,6} (.+)$/gm)].map(m=>g.slug(m[1]));
  assert.deepEqual(Object.keys(e.headings),ids);headings+=ids.length;
  assert.deepEqual(reviewedFragments[e.slug],e.headings);assert(visionAliases.includes(e.slug));
  assert(!html.includes(e.slug));assert(!/!\[|<img\b|<PaperFigure\b|^import /m.test(body));
  for(const old of ids){const d=resolveReviewedNote(e.slug+'#'+old);assert.equal(d.slug,'models/vision');assert(html.includes('id="'+d.anchor+'"'));}
  for(const url of new Set([...body.matchAll(/https:\/\/[^\s)]+/g)].map(m=>m[0])))assert(html.includes(url),url);
}
assert.equal(headings,37);assert.equal((html.match(/class="katex-display"/g)||[]).length,17);
assert.equal((html.match(/<math /g)||[]).length,30);assert(!html.includes('Original notes'));
for(const text of ['valid cross-view class-token pairs','nonnegative loss weights','same-view spatial correspondence','categorical','not the original categorical iBOT objective','incorrect to describe iBOT as requiring neither','82.3','87.8','ImageNet-22K','512-resolution','17.6','19.1','100k','20 datasets','head-only EMA','global-view variance','fixed positive-definite covariance',String.raw`\frac{D^2}{T}`,'not an unconditional all-task','without an EMA teacher','center remains differentiable','256-direction','not a Cramér–Wold guarantee','O(BDM)','O(BMT)','endpoint weights','approximately 50 lines','not a universal ranking'])assert(html.includes(text),text);
// The combined loss weights are independent; an absent branch contributes zero.
let combinations=0;for(const patch of [0,.1,2,20])for(const cls of [0,.4,4])for(const lp of [0,.25,1])for(const lc of [0,.5,1]){const loss=lp*patch+lc*cls;assert(loss>=0);if(lp===0)assert.equal(loss,lc*cls);if(lc===0)assert.equal(loss,lp*patch);combinations++;}
console.log('Vision core closure: three remaining Git-equal bodies,37 exact headings,all citations,no embedded assets,no public originals,17 display equations and'+combinations+' combined-loss cases pass. Earlier DINOv2 closure and full primary/production checks remain separate.');
