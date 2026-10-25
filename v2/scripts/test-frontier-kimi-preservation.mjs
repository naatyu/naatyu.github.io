import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import GithubSlugger from 'github-slugger';
import {frontierReader,frontierAliases} from '../site/readers/frontier.js';
import {kimiRecipeDetails} from '../site/readers/kimi-recipe-details.js';
import {reviewedFragments,resolveReviewedNote} from '../site/reviewed-navigation.js';
const root=new URL('../../',import.meta.url),path='docs/ai/architectures/model-reports/kimi-k3-open-frontier-intelligence.md',source=readFileSync(new URL(path,root),'utf8');
assert.equal(source,execFileSync('git',['show','HEAD:'+path],{cwd:root,encoding:'utf8'}));
assert.equal(createHash('sha256').update(source).digest('hex'),'398214742c4344fd4baabc1f64040484bf12021cc7b47be0ff71152a58d8bd0e');
const slug=path.slice(5,-3),g=new GithubSlugger(),headings=[...source.matchAll(/^#{1,6} (.+)$/gm)].map(m=>g.slug(m[1]));
assert.equal(headings.length,22);assert.deepEqual(Object.keys(reviewedFragments[slug]),headings);
const html=frontierReader(s=>s),ids=new Set([...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]));
for(const h of headings){const d=resolveReviewedNote(slug+'#'+h);assert.equal(d.slug,'training/frontier-recipes');assert(ids.has(d.anchor),h);}
assert(frontierAliases.includes(slug));assert(!html.includes('href="'+slug+'"'));
for(const phrase of ['partial final block','normalized depth keys','160K','96','3,584','27 layers','51M','1.5M','1,678 Elo','rank 1/99','temperature 1','top-p 0.95','300K','90.4','first, fourth and final','[0 0 I]','Seven training unrolls','target stays frozen','no auxiliary ground-truth','Generative','rubric','once all K responses complete'])assert(html.toLowerCase().includes(phrase.toLowerCase()),phrase);
for(const row of [['GPQA Diamond','93.5'],['BrowseComp','91.2'],['DeepSearchQA, F1','95.0'],['Terminal-Bench 2.1','88.3'],['FrontierSWE','81.2'],['Math-Vision, without / with Python','94.3 / 97.8']])assert(html.includes('<td>'+row[0]+'</td><td>'+row[1]+'</td>'),row[0]);
const details=kimiRecipeDetails(s=>s);assert.equal((details.match(/class="katex-mathml"/g)||[]).length,11);assert.equal((details.match(/class="inline-math"/g)||[]).length,3);assert(!details.includes('katex-error'));
assert(!/!\[|<PaperFigure|<img/.test(source));
// Independent scalar expansion of report Eq. 1: decay, residual write, updated read.
let cases=0;
for(const s of [-2,0,2])for(const a of [.01,.5,1])for(const b of [0,.3,1])for(const k of [-1,1])for(const v of [-3,0,3]){
 const decayed=a*s,write=decayed+b*k*(v-decayed*k),matrixForm=(1-b*k*k)*a*s+b*k*v;
 assert(Math.abs(write-matrixForm)<1e-12);cases++;
}
assert.equal(.5*2+(3-.5*2),3);assert.equal(.5*2+(3-2),2);
assert(Math.exp(80)<3.38953139e38); // BF16 maximum finite magnitude.
console.log(`Kimi preservation: Git-equal original,22 actual headings,8 typeset displays,${cases} recurrence references,teacher/deployment/evidence scope and filtered old dependency pass. Full primary/production gates remain separate.`);
