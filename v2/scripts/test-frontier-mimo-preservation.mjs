import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import GithubSlugger from 'github-slugger';
import {frontierReader,frontierAliases} from '../prototypes/readers/frontier.js';
import {mimoGrading,mimoEvidence} from '../prototypes/readers/mimo-recipe-details.js';
import {reviewedFragments,resolveReviewedNote} from '../prototypes/reviewed-navigation.js';
const root=new URL('../../',import.meta.url),path='docs/ai/architectures/model-reports/mimo-v2-6-scaling-rl-towards-self-improvement.md',source=readFileSync(new URL(path,root),'utf8');
assert.equal(source,execFileSync('git',['show','HEAD:'+path],{cwd:root,encoding:'utf8'}));
assert.equal(createHash('sha256').update(source).digest('hex'),'c25da18ff8c00c6cf34fad81eae23e9f098a395ebce36c7db3cfb7849d3af5da');
const slug=path.slice(5,-3),g=new GithubSlugger(),heads=[...source.matchAll(/^#{1,6} (.+)$/gm)].map(m=>g.slug(m[1]));
assert.equal(heads.length,31);assert.deepEqual(Object.keys(reviewedFragments[slug]),heads);
const html=frontierReader(s=>s),ids=new Set([...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]));
for(const h of heads){const d=resolveReviewedNote(slug+'#'+h);assert.equal(d.slug,'training/frontier-recipes');assert(ids.has(d.anchor),h);}
assert(frontierAliases.includes(slug));assert(!html.includes('href="'+slug+'"'));assert(!html.includes('Complete original report notes'));
for(const x of ['6,144','4,096','Groupwise Reward Synthesis','codebase fit','evidence gathering','zero advantages','Four sign-specific','double-bit','Kubernetes','Unreachable grader','>30×','123.1','81.8','Teacher-Prefix','SFT-Prefix','77.4B','27.2B','eleven reported evaluations','25 sources','90×','66×','10.3%','1,024','recursive self-improvement','post-base Git references'])assert(html.includes(x),x);
for(const row of [['SWE-bench Verified','61.1','66.2'],['Terminal-Bench 2.1','37.1','52.8'],['MiMo Cyber Bench mini','31.3','47.0'],['MiMo Visual Coding mini','64.0','72.4']])assert(html.includes('<td>'+row.join('</td><td>')+'</td>'),row[0]);
const details=mimoGrading(s=>s)+mimoEvidence(s=>s);assert.equal((details.match(/class="katex-mathml"/g)||[]).length,4);assert(!details.includes('katex-error'));assert(!/!\[|<PaperFigure|<img/.test(source));
for(const u of ['https://huggingface.co/XiaomiMiMo/MiMo-V2.6-Pro-RL','https://huggingface.co/XiaomiMiMo/MiMo-V2.6-Pro-RL/blob/main/MiMo_V2_6_technical_report.pdf'])assert(details.includes('href="'+u+'"'));
// Independent mass check under the displayed uncapped positive-eligibility contract.
let cases=0;for(let n=1;n<=16;n++)for(let seed=1;seed<=64;seed++){const a=Array.from({length:n},(_,i)=>1+(i*seed)%11),f=a.map((_,i)=>(1+(i+seed)%10)/10),mass=a.reduce((x,y)=>x+y),den=a.reduce((x,y,i)=>x+y*f[i],0),out=a.reduce((x,y,i)=>x+mass/den*f[i]*y,0);assert(Math.abs(out-mass)<1e-10);cases++;}
console.log(`MiMo preservation: Git-equal source,31 actual headings,grader/update/failure/transfer conditions,all four original 9B result rows,3 display+1 inline typeset formulas and ${cases} uncapped GAR mass cases pass. Full primary/production review remains separate.`);
