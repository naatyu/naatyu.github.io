import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import GithubSlugger from 'github-slugger';
import {parallelismReader,parallelismAliases,parallelSections} from '../site/readers/parallelism.js';
import {ringFrame} from '../site/readers/parallelism-model.js';
import {reviewedFragments,resolveReviewedNote} from '../site/reviewed-navigation.js';
const root=new URL('../../',import.meta.url),closure=JSON.parse(readFileSync(new URL('.internal/v2/parallelism-core-closure.json',root),'utf8'));
const html=parallelismReader(s=>s),ids=[...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]);
assert.equal(ids.length,new Set(ids).size);
assert.equal(closure.sources.length,9);
let headings=0;
for(const {slug,sha256,headings:destinations} of closure.sources){
  const path='docs/'+slug+'.md',source=readFileSync(new URL(path,root),'utf8');
  assert.equal(source,execFileSync('git',['show','HEAD:'+path],{cwd:root,encoding:'utf8'}));
  assert.equal(createHash('sha256').update(source).digest('hex'),sha256);
  const g=new GithubSlugger(),actual=[...source.matchAll(/^#{1,6} (.+)$/gm)].map(m=>g.slug(m[1]));
  assert.deepEqual(Object.keys(destinations),actual);assert.deepEqual(reviewedFragments[slug],destinations);
  assert(parallelismAliases.includes(slug));assert(!html.includes(slug));
  // No Markdown/HTML/JSX asset dependency occurs in these nine core originals.
  assert(!/!\[[^\]]*\]\(|<img\b|<PaperFigure\b|^import /m.test(source));
  for(const h of actual){const d=resolveReviewedNote(slug+'#'+h);assert.equal(d.slug,closure.topic);assert(ids.includes(d.anchor),h);headings++;}
  assert(ids.includes(resolveReviewedNote(slug).anchor));
  // Every original external citation is kept; public recovery is not an old-note archive.
  for(const url of new Set([...source.matchAll(/\]\((https:\/\/[^)]+)\)/g)].map(m=>m[1])))assert(html.includes(url),url);
}
assert.equal(headings,97);assert(!html.includes('Complete core references retained'));
for(const [id]of parallelSections)assert(ids.includes(id),id);
for(const evidence of ['two FP32 Adam moments','eight bytes','50% more bytes','not elapsed times','ddp.no_sync()','matching feature partitions','MQA has only one KV head','fixed Q','original causal and padding masks','same 136 valid pairs','roughly 1/v','not a general measured speedup','not send every parameter','hidden gather or redistribution','unreduced partial sum','batching dimension','summed NIC bandwidth per node','SHARP','Double buffering','gathered-input and reduced-output bytes','compiler/runtime trace','full mutual overlap','not a deployable mesh','not a hardware-independent batch prescription','not measured network time'])assert(html.includes(evidence),evidence);
assert.equal((html.match(/class="katex-display"/g)||[]).length,11);assert.equal((html.match(/<math /g)||[]).length,21);assert(!html.includes('katex-error'));
let ringStates=0;
for(let ranks=1;ranks<=64;ranks++){
  const visited=Array.from({length:ranks},()=>new Set());
  for(let tick=0;tick<ranks;tick++){
    const frame=ringFrame(ranks,tick);assert.equal(new Set(frame.map(r=>r.kvOwner)).size,ranks);
    for(const row of frame){
      assert.equal(row.queryOwner,row.rank);visited[row.rank].add(row.kvOwner);
      assert.equal(frame[row.sendTo].receiveFrom,row.rank);
      if(tick){const previous=ringFrame(ranks,tick-1);assert.equal(row.kvOwner,previous[row.receiveFrom].kvOwner);}
      ringStates++;
    }
  }
  assert(visited.every(v=>v.size===ranks));
}
for(const [r,t]of [[0,0],[65,0],[4,-1],[4,4],[1.5,0],[4,NaN]])assert.throws(()=>ringFrame(r,t),RangeError);
// The rendered collective sketch has valid syntax; no distributed runtime run is claimed.
const code=html.match(/<pre><code>(# Contract-axis[\s\S]*?)<\/code>/)[1];
execFileSync('python3',['-c','import ast,sys;ast.parse(sys.argv[1])',code]);
console.log(`Parallelism preservation: nine Git-equal originals,97 exact heading destinations,all citations,zero public old dependencies,11display+10inline formulas and ${ringStates} ring ownership states pass. GPU/distributed performance and full external-primary/production review remain separate.`);
