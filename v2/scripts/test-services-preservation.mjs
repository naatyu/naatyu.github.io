import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import GithubSlugger from 'github-slugger';
import {servicesReader,servicesAliases,servicesMeta} from '../prototypes/readers/services.js';
import {reviewedFragments,resolveReviewedNote} from '../prototypes/reviewed-navigation.js';
const html=servicesReader(s=>s),ids=new Set([...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]));
let count=0;
for(const slug of servicesAliases){
 const source='docs/'+slug+'.md',body=readFileSync(new URL('../../'+source,import.meta.url),'utf8');
 const committed=execFileSync('git',['show','HEAD:'+source],{cwd:new URL('../../',import.meta.url),encoding:'utf8'});assert.equal(body,committed);
 const g=new GithubSlugger(),headings=[...body.matchAll(/^#{1,6} (.+)$/gm)].map(m=>g.slug(m[1]));
 assert.deepEqual(Object.keys(reviewedFragments[slug]),headings);
 for(const heading of headings){const destination=resolveReviewedNote(slug+'#'+heading);assert.equal(destination.slug,servicesMeta.slug);assert.ok(ids.has(destination.anchor));count++;}
}
assert.equal(count,74);assert.equal((html.match(/<math /g)||[]).length,7);
assert.equal((html.match(/class="inline-math"/g)||[]).length,3);
assert.equal((html.match(/<pre tabindex="0" role="region"/g)||[]).length,3);
assert.equal((html.match(/<table style="min-width:640px">/g)||[]).length,8);
for(const phrase of ['service IP address','Address takeover alone','CDN delivery charges','least-recently-used','log-structured merge-tree','input/output operations per second','Time to live','same fixed','not a proof of linearizability','not observed YouTube statistics'])assert.ok(html.includes(phrase),phrase);
assert.ok(!html.includes('katex-error'));assert.ok(!html.includes('href="systems/'));assert.ok(!html.includes('href="interview-prep/'));
assert.ok(servicesMeta.related.includes('math/probability'));
console.log('Services preservation: 10 Git-verified originals, 74 exact headings, 3 inline formulas and accessible static paths pass.');
