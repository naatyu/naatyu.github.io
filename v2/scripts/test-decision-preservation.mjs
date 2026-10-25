import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import GithubSlugger from 'github-slugger';
import {decisionReader,decisionAliases} from '../prototypes/readers/decision.js';
import {dataReader} from '../prototypes/readers/data.js';
import {reviewedFragments,resolveReviewedNote} from '../prototypes/reviewed-navigation.js';
const root=new URL('../../',import.meta.url),html=decisionReader(s=>s),ids=new Set([...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]));
const sources=[['ai/architectures/jev-tev-typed-decision-models','529e41b4674ad4e2b668fdb78c481f481fafa66b0f682d3cc42b405eec446b7d'],['ai/architectures/model-reports/shieldstral','3c1789df3703dc74fb03362c30d9f7a6b91d7099241f7a62631cb71e4937c492']];
let headings=0;for(const[slug,sha]of sources){const path='docs/'+slug+'.md',s=readFileSync(new URL(path,root),'utf8');assert.equal(s,execFileSync('git',['show','HEAD:'+path],{cwd:root,encoding:'utf8'}));assert.equal(createHash('sha256').update(s).digest('hex'),sha);assert(!/!\[|<PaperFigure|<img/.test(s));const g=new GithubSlugger(),hs=[...s.matchAll(/^#{1,6} (.+)$/gm)].map(m=>g.slug(m[1]));headings+=hs.length;assert.deepEqual(Object.keys(reviewedFragments[slug]),hs);assert(decisionAliases.includes(slug));assert(!html.includes(slug));assert(!dataReader(x=>x).includes(slug));for(const h of hs){const d=resolveReviewedNote(slug+'#'+h);assert.equal(d.slug,'models/decision-models');assert(ids.has(d.anchor),h);}}
assert.equal(headings,76);assert(!html.includes('<summary>Original notes'));
assert.equal((html.match(/class="katex-mathml"/g)||[]).length,12);
for(const text of ['37,840','16,929,529','4,568','1,526','6,000','8 /16 /0','2,048','5e−5','top-five','880/1,000','300/300','$17','25 minutes','H100 80GB','training-data volume','no longer current','not a second verifier','54.1M','45.2M','4.4M','4.5M','11 superclasses','73 leaf','11 source taxonomies','0.7','2,000 query','14-subcategory','30%','12 superclasses','26 subcategories','52 leaves','90 fixed','Ten of twelve','pairwise spherical','ten guard-model baselines','smaller than all compared text guards','88.5','61.1','88.7','91.3','94.1','84.9','83.8','confident error','fail-open or fail-closed'])assert(html.includes(text),text);
assert(dataReader(s=>s).includes('models/decision-models#iso-content'));
console.log('Decision preservation: two complete Git-equal originals,76 actual headings,7 MathML displays,all original recipe/result conditions and canonical Data connection pass. Full external-primary/production review remains separate.');
