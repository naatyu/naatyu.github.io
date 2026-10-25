import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import GithubSlugger from 'github-slugger';
import {compactReader,compactAliases} from '../site/readers/compact.js';
import {reviewedFragments,resolveReviewedNote} from '../site/reviewed-navigation.js';
const root=new URL('../../',import.meta.url),path='docs/ai/architectures/model-families/frontier-small-language-models.md';
const source=readFileSync(new URL(path,root),'utf8');
assert.equal(source,execFileSync('git',['show','HEAD:'+path],{cwd:root,encoding:'utf8'}));
const slug=path.slice(5,-3),g=new GithubSlugger(),headings=[...source.matchAll(/^#{1,6} (.+)$/gm)].map(m=>g.slug(m[1]));
assert.equal(headings.length,9);assert.deepEqual(Object.keys(reviewedFragments[slug]),headings);
const html=compactReader(s=>s),ids=new Set([...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]));
for(const h of headings){const d=resolveReviewedNote(slug+'#'+h);assert.equal(d.slug,'models/compact-recipes');assert.ok(ids.has(d.anchor));}
assert.ok(compactAliases.includes(slug));assert.ok(!html.includes('href="'+slug+'"'));
for(const phrase of ['350M to 24B','cars and phones','tool use and summarization','around 7B tokens','4,000 times','10T to 28T','sample five diverse responses and one deterministic','verifiable rewards and n-gram repetition penalties','finite run','teacher vocabulary','63% embedding and 90%','recursive summaries','τ²-Bench','not math, code or creative writing','no linked primary protocol'])assert.ok(html.includes(phrase),phrase);
assert.ok(html.includes('href="post-training/preferences"'));
console.log('Liquid preservation: Git-equal original,9 exact headings,deployment/overtraining/failure-control/tool details and explicit source uncertainty pass. Unlinked interview protocol is not certified.');
