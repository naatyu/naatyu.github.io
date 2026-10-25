import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {compactReader} from '../site/readers/compact.js';
import GithubSlugger from 'github-slugger';
import {reviewedFragments,resolveReviewedNote} from '../site/reviewed-navigation.js';
import {recurrenceReader} from '../site/readers/recurrence.js';
const root=new URL('../../',import.meta.url);
const path='docs/ai/architectures/model-reports/nanbeige4-2-3b-unlocking-agentic-capabilities.md';
const source=readFileSync(new URL(path,root),'utf8');
assert.equal(source,execFileSync('git',['show','HEAD:'+path],{cwd:root,encoding:'utf8'}));
const html=compactReader(s=>s);
const slug=path.slice(5,-3),g=new GithubSlugger();
const anchors=[...source.matchAll(/^#{1,6} (.+)$/gm)].map(m=>g.slug(m[1]));
assert.equal(anchors.length,26);
assert.deepEqual(Object.keys(reviewedFragments[slug]),anchors);
const ids=new Set([...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]));
for(const a of anchors){const target=resolveReviewedNote(slug+'#'+a);assert.equal(target.slug,'models/compact-recipes');assert.ok(ids.has(target.anchor),a);}
assert.ok(!html.includes('href="'+slug+'"'));
const recurrence=recurrenceReader(s=>s);
assert.ok(!recurrence.includes('Complete originals'));
assert.ok(!recurrence.includes('href="'+slug+'"'));
assert.ok(recurrence.includes('href="models/compact-recipes#nan42"'));
function rows(text){
  return [...text.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map(m=>[...m[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map(c=>c[1].replace(/<[^>]+>/g,'').trim()));
}
const tables=[...html.matchAll(/<table>([\s\S]*?)<\/table>/g)].map(m=>m[1]);
const selected=tables.filter(t=>t.startsWith('<caption>Nanbeige base models;')||t.startsWith('<caption>Nanbeige 4.2 reported comparisons;'));
assert.equal(selected.length,2);
const rendered=selected.flatMap(rows);
const original=source.split('\n').filter(l=>l.startsWith('|')).map(l=>l.split('|').slice(1,-1).map(c=>c.replace(/\*\*/g,'').trim()));
const targets=original.filter(r=>['Nanbeige4-3B','Nanbeige4.2-3B','GDPval Rubrics','PinchBench-V2','MCP-Atlas','SWE-Bench Verified','SWE-Bench Pro','Terminal-Bench 2.0','GPQA-Diamond','LiveCodeBench-V6','SciCode','IF-Bench','Recruit-Bench'].includes(r[0]));
assert.equal(targets.length,13);
for(const expected of targets){
  const actual=rendered.find(r=>r[0]===expected[0]);
  assert.ok(actual,expected[0]);
  assert.equal(actual.length,expected.length);
  for(let i=1;i<expected.length;i++)assert.equal(Number(actual[i]),Number(expected[i]),expected[0]+' column '+i);
}
for(const phrase of ['cross-tool composition','invalid calls, non-terminating loops','9,333 training tokens per non-embedding parameter','Gemma leads SciCode, IF-Bench and Recruit-Bench','fixed throughout it','Model Context Protocol (MCP)','An independent judge','in-house harnesses'])assert.ok(html.includes(phrase),phrase);
console.log('Nanbeige4.2 source preservation: Git-equal original, all13 base/comparator rows,26 exact headings,environment/budget conditions and removed old dependencies pass. External figure/primary/production gates remain separate.');
