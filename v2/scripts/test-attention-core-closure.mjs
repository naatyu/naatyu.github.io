import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import GithubSlugger from 'github-slugger';
import {attentionReader,attentionAliases} from '../site/readers/attention.js';
import {reviewedFragments,resolveReviewedNote} from '../site/reviewed-navigation.js';
const root=new URL('../../',import.meta.url);
const ledger=JSON.parse(readFileSync(new URL('.internal/v2/attention-core-closure.json',root),'utf8'));
const html=attentionReader(s=>s),ids=[...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]);
assert.equal((html.match(/class="inline-math"/g)||[]).length,47);
assert.equal((html.match(/<math /g)||[]).length,70);
assert(!html.includes('${inlineMath'));
for(const tex of [String.raw`\mathbb E[q_i k_i]=0`,String.raw`\mathbb E[q_i^2 k_i^2]=\sigma_q^2\sigma_k^2`,String.raw`c=\frac{1}{\sqrt{d_k}}`,String.raw`\frac{n-1}{n^2}`,String.raw`-\frac{1}{n^2}`,String.raw`H(p)=-\sum_j p_j\log p_j`,String.raw`\frac{q}{\|q\|_2}`,String.raw`\frac{k}{\|k\|_2}`])assert(html.includes(tex),tex);
let headings=0;
for(const {slug,sha256,headings:destinations} of ledger.sources){
  const p='docs/'+slug+'.md',source=readFileSync(new URL(p,root),'utf8');
  assert.equal(source,execFileSync('git',['show','HEAD:'+p],{cwd:root,encoding:'utf8'}));
  assert.equal(createHash('sha256').update(source).digest('hex'),sha256);
  const g=new GithubSlugger(),actual=[...source.matchAll(/^#{1,6} (.+)$/gm)].map(m=>g.slug(m[1]));
  assert.deepEqual(Object.keys(destinations),actual);assert.deepEqual(reviewedFragments[slug],destinations);
  assert(attentionAliases.includes(slug));assert(!html.includes(slug));
  assert(!/<img\b|<PaperFigure\b|^import /m.test(source));
  const assets=[...source.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map(m=>m[1]);
  const decisions=(ledger.assets||[]).filter(a=>a.source===slug);
  assert.deepEqual(decisions.map(a=>a.url),assets);
  for(const a of decisions){
    const bytes=readFileSync(new URL(a.path,root));
    assert(bytes.equals(execFileSync('git',['show','HEAD:'+a.path],{cwd:root})));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),a.sha256);
    assert.equal(a.decision,'replace with original explanatory content; recover art from Git');
    assert(ids.includes(a.anchor));assert(!html.includes(a.url));
  }
  for(const h of actual){const d=resolveReviewedNote(slug+'#'+h);assert.equal(d.slug,'models/attention');assert(ids.includes(d.anchor));headings++;}
  for(const url of new Set([...source.matchAll(/https:\/\/[^\s)]+/g)].map(m=>m[0])))assert(html.includes(url),url);
}
assert.equal(headings,80);
assert.equal(ledger.sources.length,5);assert.equal(ledger.assets.length,11);
assert(!html.includes('Complete current references during migration'));
for(const s of ['not a linear-attention method','causal alignment','backward determinism','random-sign Hadamard','Source builds and packaging','growing KV cache'])assert(html.includes(s)||s==='not a linear-attention method'&&html.includes('Dense arithmetic is still quadratic'),s);
console.log(`Attention core closure: ${ledger.sources.length}/5 original bodies,${headings} exact headings,11 Git-equal figure replacements,citations and removed public dependencies pass. Full external primary/production gates stay open.`);
