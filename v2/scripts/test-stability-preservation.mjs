import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import GithubSlugger from 'github-slugger';
import {stabilityReader,stabilityAliases} from '../prototypes/readers/stability.js';
import {reviewedFragments,resolveReviewedNote} from '../prototypes/reviewed-navigation.js';
const root=new URL('../../',import.meta.url),html=stabilityReader(s=>s),ids=new Set([...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]));
const sources=[['gradient-norm-and-training-dynamics','md','79f2d262a399dcaef1f3bce26936842fb2a56a3d6574f92ca2a7a0a7e8b1262a'],['gradient-clipping','md','a789ce6b07db16d837050c14748999defa8b3a1938db421b3e823f9c09d15414'],['training-loss-patterns','md','e96b40c6aafd8e05246d156f0bc468f990ef86080f20bb7edad7bc9583b332d9'],['generalization-dynamics-and-checkpoint-selection','mdx','93fdf0ee6959548d5f265d56e2df545cd176641f79a02659fa05ea08876f9885']];
let headings=0;for(const[name,ext,sha]of sources){const slug='ai/training/optimization/'+name,path='docs/'+slug+'.'+ext,s=readFileSync(new URL(path,root),'utf8');assert.equal(s,execFileSync('git',['show','HEAD:'+path],{cwd:root,encoding:'utf8'}));assert.equal(createHash('sha256').update(s).digest('hex'),sha);const g=new GithubSlugger(),hs=[...s.matchAll(/^#{1,6} (.+)$/gm)].map(m=>g.slug(m[1]));headings+=hs.length;assert.deepEqual(Object.keys(reviewedFragments[slug]),hs);assert(stabilityAliases.includes(slug));assert(!html.includes(slug));for(const h of hs){const d=resolveReviewedNote(slug+'#'+h);assert.equal(d.slug,'training/stability');assert(ids.has(d.anchor),h);}}
assert.equal(headings,51);assert(!html.includes('<summary>Complete original'));
const assets=new Set([...html.matchAll(/<img src="(\/img\/[^\"]+)"/g)].map(m=>m[1]));assert.equal(assets.size,14);
for(const image of assets){const path='static'+image,bytes=readFileSync(new URL(path,root));assert(bytes.equals(execFileSync('git',['show','HEAD:'+path],{cwd:root,maxBuffer:8e6})),path);}
for(const path of ['src/components/ResearchNote/index.tsx','src/components/ResearchNote/styles.module.css'])assert(readFileSync(new URL(path,root)).equals(execFileSync('git',['show','HEAD:'+path],{cwd:root})),path);
assert.equal((html.match(/class="katex-mathml"/g)||[]).length,14);
for(const text of ['Source-specific spike','Warmup changes the learning rate','Recurrent and deep networks','not the primary optimization method','zero parameter norm','nonfinite','target-token','1.0 or 0.5','2.17T','2.19T','2.21T','81.7%','20B training tokens','4.5T','4.9T','36.3%','29.8%','53%','21%','6.5 pp','32.0 pp','49K','1K','four random seeds','five questions per persona','200 times','random baseline','0.4','non-monotonic','not unrestricted generation accuracy','not a rule that all MoE failures','training/practice#framework','training/practice#metrics','training/practice#experiment','training/practice#smol'])assert(html.includes(text),text);
const jsx=readFileSync(new URL('src/components/ResearchNote/index.tsx',root),'utf8');for(const t of ["tokens: '2.17T', accuracy: 81","tokens: '2.19T', accuracy: 0","tokens: '2.21T', accuracy: 81.7","earlier: 36.3, later: 29.8","earlier: 53, later: 21"])assert(jsx.includes(t),t);
const code=html.match(/<pre><code>(# PyTorch sketch:[\s\S]*?)<\/code>/)[1];execFileSync('python3',['-c','import ast,sys;ast.parse(sys.argv[1])',code]);
assert(code.indexOf('scaler.unscale_')>code.indexOf('.backward()'));assert(code.indexOf('clip_grad_norm_')>code.indexOf('scaler.unscale_'));assert(code.indexOf('scaler.step')>code.indexOf('clip_grad_norm_'));
console.log('Stability preservation: four Git-equal bodies,51 actual headings,14 Git-equal source assets/component data,6 MathML displays and Python sketch syntax/order pass. No PyTorch/GPU or production execution claimed.');
