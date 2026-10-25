import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import GithubSlugger from 'github-slugger';
import {frontierReader,frontierAliases} from '../prototypes/readers/frontier.js';
import {deepseekMemory,deepseekRun,deepseekPost} from '../prototypes/readers/deepseek-recipe-details.js';
import {reviewedFragments,resolveReviewedNote} from '../prototypes/reviewed-navigation.js';
const root=new URL('../../',import.meta.url),path='docs/ai/architectures/model-reports/deepseek-v4-1-flash.md',source=readFileSync(new URL(path,root),'utf8');
assert.equal(source,execFileSync('git',['show','HEAD:'+path],{cwd:root,encoding:'utf8'}));
assert.equal(createHash('sha256').update(source).digest('hex'),'8ae8ba315b0643f15b69dda60bc5b38c86341c47d3b842971f008cfd53c024af');
const slug=path.slice(5,-3),g=new GithubSlugger(),headings=[...source.matchAll(/^#{1,6} (.+)$/gm)].map(m=>g.slug(m[1]));
assert.equal(headings.length,39);assert.deepEqual(Object.keys(reviewedFragments[slug]),headings);
const html=frontierReader(s=>s),ids=new Set([...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]));
for(const h of headings){const d=resolveReviewedNote(slug+'#'+h);assert.equal(d.slug,'training/frontier-recipes');assert(ids.has(d.anchor),h);}
assert(frontierAliases.includes(slug));assert(!html.includes('href="'+slug+'"'));
for(const phrase of ['5,120','1,280','2,304','20 Sinkhorn-Knopp','eight hash heads','16M','zero-indexed layers 1 and 14','RDMA','RL rollouts instead','short causal convolution is omitted','0.83 GiB','nonoverlapping groups','1,024','SmolVLM','larger configured epoch count','update RMS 0.18','5× multiplier','0.001 / 0.0001','weight decay 0.1','20.4','image–text pairs','OpenCode','SCHED_IDLE','AppArmor','eBPF','Fail-to-pass','pass-to-pass','container-image layer','not independent reproduction','Markov head','reference implementation'])assert(html.toLowerCase().includes(phrase.toLowerCase()),phrase);
for(const row of [['GPQA Diamond, pass@1','89.9','90.9'],['Terminal-Bench 2.1, pass@1','82.7','90.6'],['Terminal-Bench 3.0, pass@1','7.6','30.0'],['Terminal-Bench 4.0, pass@1','7.0','31.2'],['DeepSWE v1.1, resolved','54.4','74.2'],['NL2Repo-Bench, score','54.2','65.4'],['AutomationBench, pass@1','37.7','54.8'],['Agents’ Last Exam, pass@1','25.2','31.8']])assert(html.includes('<td>'+row.join('</td><td>')+'</td>'),row[0]);
for(const row of [['mini-SWE','74.2'],['DeepSeek Harness Minimal','72.6'],['Claude Code','69.8'],['Codex','65.6']])assert(html.includes('<td>'+row.join('</td><td>')+'</td>'),row[0]);
const details=deepseekMemory(s=>s)+deepseekRun(s=>s)+deepseekPost(s=>s);assert.equal((details.match(/class="katex-mathml"/g)||[]).length,8);assert.equal((details.match(/class="inline-math"/g)||[]).length,5);assert(!details.includes('katex-error'));assert(!/!\[|<PaperFigure|<img/.test(source));
for(const url of ['https://arxiv.org/abs/2405.05254','https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/tree/main/inference','https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash'])assert(details.includes('href="'+url+'"'));
// Component arithmetic, not a serving speed benchmark.
for(let n=1;n<=16;n++)for(const d of [1,128,5120])assert.equal((2*n+2)*d/((4*n+4)*d),.5);
assert.equal(890*1e6/1e6,890);assert(Math.abs(890*1e6/2**30-.8288770914)<1e-9);
console.log('DeepSeek preservation: committed original,39 actual headings,complete shape/settings/placement/task pipeline,8 benchmark and4 harness rows,3 new typeset formulas,component arithmetic and filtered old dependency pass. Fresh full-primary/production gates remain separate.');
