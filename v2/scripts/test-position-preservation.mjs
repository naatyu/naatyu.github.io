import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import GithubSlugger from 'github-slugger';
import {reviewedFragments,resolveReviewedNote} from '../prototypes/reviewed-navigation.js';
import {positionReader} from '../prototypes/readers/position.js';
const root=new URL('../../',import.meta.url),html=positionReader(s=>s);
const ids=new Set([...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]));let headings=0;
for(const name of ['positional-encoding-sinusoidal-to-rope','rope-scaling','no-positional-embeddings-nope','group-theoretic-positional-encodings']){
  const source='docs/ai/architectures/transformers/'+name+'.md';
  const body=readFileSync(new URL(source,root));
  assert.deepEqual(body,execFileSync('git',['show','HEAD:'+source],{cwd:root}));
  const slug=source.slice(5,-3),g=new GithubSlugger();
  const oldIds=[...body.toString().matchAll(/^#{1,6} (.+)$/gm)].map(m=>g.slug(m[1]));
  assert.deepEqual(Object.keys(reviewedFragments[slug]),oldIds);
  for(const anchor of oldIds){const target=resolveReviewedNote(slug+'#'+anchor);assert.equal(target.slug,'models/position');assert.ok(ids.has(target.anchor),anchor);headings++;}
}
assert.equal(headings,74);assert.ok(!html.includes('Complete originals retained'));
assert.ok(!html.includes('ai/architectures/transformers/')&&!html.includes('ai/architectures/model-reports/'));
const snippets=[...html.matchAll(/<pre[^>]*><code>([\s\S]*?)<\/code><\/pre>/g)].map(m=>m[1].replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&'));
assert.equal(snippets.length,5);
const syntax=execFileSync('python3',['-c',[
  'import ast,json,sys',
  'parts=json.load(sys.stdin)',
  'trees=[ast.parse(s) for s in parts]',
  'functions=[n.name for t in trees for n in ast.walk(t) if isinstance(n,ast.FunctionDef)]',
  'assert functions == ["rope_frequencies","apply_rope","positional_attention"], functions',
  'for t in trees: compile(t,"rendered-position-example","exec")',
  'print("rendered Python syntax verified; no PyTorch tensor execution")'
].join('\n')],{input:JSON.stringify(snippets),encoding:'utf8'});
assert.ok(syntax.includes('syntax verified'));
for(const phrase of ['offset=offset','one phase per feature pair','torch.float32','q = apply_rope(q, cos, sin)','k = apply_rope(k, cos, sin)','[sequence, head_dim/2]','CPU-checked with float32, float16 and bfloat16','not a fused-kernel performance example or a GPU validation'])assert.ok(html.includes(phrase),phrase);
assert.equal((html.match(/class="inline-math"/g)||[]).length,27);
assert.equal((html.match(/<math /g)||[]).length,42);assert.ok(!html.includes('katex-error'));
assert.equal((html.match(/<table style="min-width:640px">/g)||[]).length,5);
for(const label of ['RoPE table construction','Interleaved RoPE application','Apply matching query and key phases','Local and global layer policy sketch','RoPE or NoPE attention reference'])assert.ok(html.includes('role="region" aria-label="'+label+'"'),label);
console.log('Position preservation: four original Git equalities, three complete rendered callable functions and caller syntax,27 inline formulas and focusable reference surfaces pass. Optional tensor execution: test-position-tensors.mjs.');
