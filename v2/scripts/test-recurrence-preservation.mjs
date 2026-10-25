import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import GithubSlugger from 'github-slugger';
import {reviewedFragments,resolveReviewedNote} from '../site/reviewed-navigation.js';
import {recurrenceReader,recurrenceAliases} from '../site/readers/recurrence.js';
import {inlineMath} from '../site/readers/math.js';
const root=new URL('../../',import.meta.url),html=recurrenceReader(s=>s);
const ids=new Set([...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]));let count=0;
for(const slug of recurrenceAliases){
  const source='docs/'+slug+'.md',body=readFileSync(new URL(source,root));
  assert.deepEqual(body,execFileSync('git',['show','HEAD:'+source],{cwd:root}));
  const g=new GithubSlugger(),anchors=[...body.toString().matchAll(/^#{1,6} (.+)$/gm)].map(m=>g.slug(m[1]));
  assert.deepEqual(Object.keys(reviewedFragments[slug]),anchors);
  for(const anchor of anchors){const target=resolveReviewedNote(slug+'#'+anchor);assert.equal(target.slug,'models/recurrence');assert.ok(ids.has(target.anchor),anchor);count++;}
  assert.ok(!html.includes('href="'+slug+'"'),'Retained original dependency '+slug);
}
assert.equal(count,143);
assert.equal((html.match(/<math /g)||[]).length,56);
assert.equal((html.match(/class="inline-math"/g)||[]).length,41);
assert(!html.includes('${im('));
for(const tex of [String.raw`\alpha=(2N)^p`,String.raw`\beta=(8N)^{-p}`,String.raw`\frac1{8K}=\frac1{32}`,String.raw`M\kappa\left(\frac\beta\alpha\right)^2`,String.raw`\beta h_d+\alpha s'`,String.raw`O(Td(d+d_{\mathrm{input}}))`])assert(html.includes(inlineMath(tex)),tex);
assert.ok(!html.includes('katex-error'));
const snippets=[...html.matchAll(/<pre[^>]*aria-label="(?:LSTM |Loop scaling |Shared matrix initialization |Shared stack execution )[^\"]*"[^>]*><code>([\s\S]*?)<\/code><\/pre>/g)].map(m=>m[1].replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&'));
assert.equal(snippets.length,5);
const syntax=execFileSync('python3',['-c','import ast,json,sys\nparts=json.load(sys.stdin)\ntrees=[ast.parse(s) for s in parts]\nfunctions=[n.name for t in trees for n in ast.walk(t) if isinstance(n,ast.FunctionDef)]\nassert functions == ["lstm_step","lstm_sequence","loop_scales","initialize_shared_once","residual_sublayer","run_shared_stack"], functions\nfor t in trees: compile(t,"rendered-recurrence","exec")\nprint("syntax verified")'],{input:JSON.stringify(snippets),encoding:'utf8'});
assert.ok(syntax.includes('syntax verified'));
for(const text of ['forget, input, candidate, output','i/f/g/o','The empty sequence','PIQA is the exception','nine write/read pairings','small-model advantage peaks at R=5','not prevent accidental reinitialization']){
  // The prose spells out the native gate order rather than abbreviating it.
  if(text==='i/f/g/o')assert.ok(html.includes('input, forget, candidate, output'));
  else assert.ok(html.includes(text),text);
}
for(const text of ['executes all allowed loops','Stage II freezes','776M-parameter prior ablation','fourth-loop cache','MATH500 drops by 2.00/3.88','36T training tokens','Stored parameters','37% exact overlap and 3% disjoint','first candidate boundary','normalized JSD below 0.5','width 704'])assert.ok(html.includes(text),text);
for(const text of ['60%','r+1 stack-like executions','less than about 0.5%','0×infinity','5d² matrix weights and 8d','Recirculation adapter construction reference'])assert.ok(html.includes(text),text);
console.log('Recurrence preservation: six Git-equal originals,143 exact headings,six state/scaling functions,conditioned evidence and15 typeset displays pass. Mixer and feedback functions are checked separately.');
