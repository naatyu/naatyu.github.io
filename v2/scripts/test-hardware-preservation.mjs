import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import GithubSlugger from 'github-slugger';
import {hardwareReader} from '../prototypes/readers/hardware.js';
import {servingReader} from '../prototypes/readers/serving.js';
import {resolveReviewedNote,reviewedFragments} from '../prototypes/reviewed-navigation.js';
const slug='systems/infrastructure/high-density-gpu-infrastructure';
const body=readFileSync(new URL('../../docs/'+slug+'.md',import.meta.url),'utf8');
const g=new GithubSlugger(),headings=[...body.matchAll(/^## (.+)$/gm)].map(m=>g.slug(m[1]));
const html=hardwareReader(s=>s),ids=new Set([...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]));
assert.equal(headings.length,13);assert.deepEqual(Object.keys(reviewedFragments[slug]),headings);
for(const heading of headings){const target=resolveReviewedNote(slug+'#'+heading);assert.equal(target.slug,'execution/hardware');assert.ok(ids.has(target.anchor));}
assert.equal((html.match(/<math /g)||[]).length,3);
assert.ok(!html.includes('katex-error'));assert.ok(!html.includes('href="ai/'));assert.ok(!html.includes('href="systems/'));
const serving=servingReader(s=>s);
for(const anchor of ['economics','deployment']){assert.ok(serving.includes('id="'+anchor+'"'));assert.ok(html.includes('href="execution/serving#'+anchor+'"'));}
assert.ok(html.includes('href="execution/performance#roofline"'));
assert.equal((html.match(/<table style="min-width:640px">/g)||[]).length,4);
for(const phrase of ['Buffer tanks','12:19–12:44','11:14–12:03','no general ride-through duration','remaining circulation path','not permission to oversubscribe','counterfactual']){
  assert.ok(html.includes(phrase),phrase);
}
console.log('Hardware preservation: 13 exact source sections, canonical cross-links and scoped cooling-buffer evidence pass.');
