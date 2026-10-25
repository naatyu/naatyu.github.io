import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import GithubSlugger from 'github-slugger';
import {rlReader,rlAliases} from '../site/readers/rl.js';
import {preferencesReader} from '../site/readers/preferences.js';
import {distillationReader} from '../site/readers/distillation.js';
import {reviewedFragments,resolveReviewedNote} from '../site/reviewed-navigation.js';
const root=new URL('../../',import.meta.url),ledger=JSON.parse(readFileSync(new URL('.internal/v2/rl-core-closure.json',root),'utf8'));
const html=rlReader(s=>s);let headings=0;
for(const entry of ledger.sources){
  const path='docs/'+entry.slug+'.md',source=readFileSync(new URL(path,root),'utf8');
  assert.equal(source,execFileSync('git',['show','HEAD:'+path],{cwd:root,encoding:'utf8'}));
  assert.equal(createHash('sha256').update(source).digest('hex'),entry.sha256);
  const slugger=new GithubSlugger(),actual=[...source.matchAll(/^#{1,6} (.+)$/gm)].map(m=>slugger.slug(m[1]));
  assert.deepEqual(Object.keys(entry.headings),actual);headings+=actual.length;
  assert.deepEqual(reviewedFragments[entry.slug],entry.headings);
  assert(rlAliases.includes(entry.slug));assert(!html.includes(entry.slug));
  assert(!/!\[|<img\b|<PaperFigure\b|^import /m.test(source));
  for(const old of actual){const dest=resolveReviewedNote(entry.slug+'#'+old);assert.equal(dest.slug,'post-training/rl');assert(html.includes('id="'+dest.anchor+'"'));}
  for(const url of new Set([...source.matchAll(/https:\/\/[^\s)]+/g)].map(m=>m[0])))assert(html.includes(url),url);
}
assert.equal(headings,184);
assert.equal((html.match(/class="katex-display"/g)||[]).length,37);
assert.equal((html.match(/<math /g)||[]).length,55);
for(const detail of ['hard outer ratio clip','where this clipped ratio enters','population standard deviation','not mathematically guarantee higher entropy','/no_think experiment','Scalar reward bandwidth alone does not determine adapter capacity','tool semantics and environment behavior','fixed entropy bonus','matched budgets'])assert(html.includes(detail),detail);
for(const [observed,expected] of [[.4,.25],[.5,.2],[.6,.15]])assert(Math.abs(Math.max(0,Math.min(.25,.2+.05*Math.sign(.5-observed)))-expected)<1e-12);
assert(!html.includes('On-Policy Distillation note remains a reference'));
for(const detail of ['dirty-page checkpoints','teacher chunks stream','router-level circuit breaking','turn boundaries','Calibrated scores','default success scores','not total training time','0.75'])assert(html.includes(detail),detail);
const durations=[1,2,3,9];assert.equal(Math.max(...durations),9);assert.equal(durations[Math.ceil(.75*2*2)-1],3);
// Integer cross-products avoid a rounded decimal changing an exact ceil boundary.
for(let n=1;n<=8;n++)for(let k=1;k<=8;k++)for(let q=1;q<=10;q++){const rank=Math.ceil(q*n*k/10);assert(rank>=1&&rank<=n*k);assert(10*rank>=q*n*k);assert(10*(rank-1)<q*n*k);}
for(const detail of ['External supervision bandwidth','Objective alignment','Estimator quality','high-dimensional update','not a proven general theory','far down a scaling curve','63.23%','incidental style','Classical RL contains on-policy and off-policy'])assert(html.includes(detail),detail);
for(const detail of ['Advance the target schedule','fixed evaluation temperature','missing temperature field','fallback rows','one terminal outcome per trajectory','FrozenLake','not a complete benchmark reproduction','intermediate SFT, RL and distillation'])assert(html.includes(detail),detail);
assert(!html.includes('Original notes and implementation context'));
for(const detail of ['RLAIF','style homogenization','thinking/non-thinking mode fusion','useful samples per accelerator-hour','post-training/preferences#margin','post-training/distillation#sequence-gradient','Break reward down by prompt difficulty'])assert(html.includes(detail),detail);
const preferenceHTML=preferencesReader(s=>s),distillationHTML=distillationReader(s=>s);
for(const anchor of ['margin','beta'])assert(preferenceHTML.includes('id="'+anchor+'"'));
for(const anchor of ['conditional-gradient','sequence-gradient','restoration'])assert(distillationHTML.includes('id="'+anchor+'"'));
assert(preferenceHTML.includes('L_{\\mathrm{DPO}}'));
assert(distillationHTML.includes('Immediate-token feedback omits future visitation credit'));
let rareCases=0;
for(const p of [0,1e-20,.001,.1,.5,1])for(const k of [1,2,3,4,8,16,32,64,100,128,1000]){
  const exact=-Math.expm1(k*Math.log1p(-p));let recursive=0;for(let i=0;i<k;i++)recursive+=p*(1-recursive);
  assert(Math.abs(exact-recursive)<1e-12);assert(exact<=Math.min(1,k*p)+1e-12);rareCases++;
}
assert.equal(rareCases,66);
assert.equal((-Math.expm1(100*Math.log1p(-.001))*100).toFixed(2),'9.52');
assert.equal((-Math.expm1(1000*Math.log1p(-.001))*100).toFixed(2),'63.23');
console.log('RL closure: nine further Git-equal sources,184 headings,37 displays/55 MathML,all citations,640 completion thresholds and66 rare-success cases pass. All ten core bodies reconciled; full primary/production gates remain.');
