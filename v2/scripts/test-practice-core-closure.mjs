import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import GithubSlugger from 'github-slugger';
import {practiceReader,practiceAliases} from '../site/readers/practice.js';
import {reviewedFragments,resolveReviewedNote} from '../site/reviewed-navigation.js';
const root=new URL('../../',import.meta.url),ledger=JSON.parse(readFileSync(new URL('.internal/v2/practice-core-closure.json',root),'utf8'));
const html=practiceReader(s=>s);let headings=0;
for(const entry of ledger.sources){
  const path='docs/'+entry.slug+'.md',source=readFileSync(new URL(path,root),'utf8');
  assert.equal(source,execFileSync('git',['show','HEAD:'+path],{cwd:root,encoding:'utf8'}));
  assert.equal(createHash('sha256').update(source).digest('hex'),entry.sha256);
  const slugger=new GithubSlugger(),actual=[...source.matchAll(/^#{1,6} (.+)$/gm)].map(m=>slugger.slug(m[1]));
  assert.deepEqual(Object.keys(entry.headings),actual);headings+=actual.length;
  assert.deepEqual(reviewedFragments[entry.slug],entry.headings);
  assert(practiceAliases.includes(entry.slug));assert(!html.includes(entry.slug));
  assert(!/!\[|<img\b|<PaperFigure\b|^import /m.test(source));
  for(const old of actual){const dest=resolveReviewedNote(entry.slug+'#'+old);assert.equal(dest.slug,'training/practice');assert(html.includes('id="'+dest.anchor+'"'));}
  for(const url of new Set([...source.matchAll(/https:\/\/[^\s)]+/g)].map(m=>m[0])))assert(html.includes(url),url);
}
assert.equal(headings,185);
for(const detail of ['Width, depth, optimization, data saturation and systems overhead','not necessarily supervised fine-tuning','fresh extension schedules were better','not assuming equivalence in a new model','community support','23.1%'])assert(html.includes(detail),detail);
for(const detail of ['Untying embeddings adds a separate output matrix','Inspect system prompts and multi-turn continuations','Set an exploration deadline and a promotion threshold','not proof that the chosen recipe is globally optimal'])assert(html.includes(detail),detail);
assert(html.includes('one validated storage read followed by a broadcast'));
assert(!html.includes('Complete source notes and recipe details'));assert(!html.includes('References and complete originals'));
assert.equal((html.match(/class="katex-display"/g)||[]).length,7);
for(const detail of ['concise mode','overlap before tokenization','Replay the failing batch and neighboring batches','continuing an existing checkpoint','rare-domain coverage'])assert(html.includes(detail),detail);
console.log('Practice core closure: all nine Git-equal bodies,185 exact headings,citations,no embedded assets,7 displays and zero old-note dependencies pass. Complete primary/production gates remain separate.');
