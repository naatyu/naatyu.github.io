import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import GithubSlugger from 'github-slugger';
import {parse} from 'parse5';
import {numericsReader,numericsAliases} from '../site/readers/numerics.js';
import {reviewedFragments,resolveReviewedNote} from '../site/reviewed-navigation.js';
const root=new URL('../../',import.meta.url),html=numericsReader(s=>s),ids=new Set([...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]));
const files=[['fp8-training','e30ab61730a302d47a6ae879b06e0ec63091d60fb6dfb00b5b73a0fe9a68542f'],['low-precision-attention-rounding-bias','96f118101854d75daf8228d4794463af8c99d75fd39f63f6fcb0f2a5c725c3d3'],['quantization-aware-training','c15a487212b3986abf0357e8f4ce00ab7cc1a134de1f8a9152efad54c79721a2']];
let headings=0;for(const[name,sha]of files){const slug='ai/training/precision/'+name,path='docs/'+slug+'.md',s=readFileSync(new URL(path,root),'utf8');assert.equal(s,execFileSync('git',['show','HEAD:'+path],{cwd:root,encoding:'utf8'}));assert.equal(createHash('sha256').update(s).digest('hex'),sha);assert(!/!\[|<PaperFigure|<img/.test(s));const g=new GithubSlugger(),hs=[...s.matchAll(/^#{1,6} (.+)$/gm)].map(m=>g.slug(m[1]));assert.deepEqual(Object.keys(reviewedFragments[slug]),hs);headings+=hs.length;assert(numericsAliases.includes(slug));assert(!html.includes('href="'+slug+'"'));for(const h of hs){const d=resolveReviewedNote(slug+'#'+h);assert.equal(d.slug,'training/numerics');assert(ids.has(d.anchor),h);}}
assert.equal(headings,47);assert(!html.includes('Complete original notes'));
for(const x of ['[T,1]','[1,D]','logical broadcast shapes','Range collapse','Outlier domination','Train–deploy mismatch','Late instability','Misleading compression','signed mean','stochastic','1,024 maxima','400→200 MB','390→87 MB','44%','unbiased','round(x / s) + z','static weight range'])assert(html.toLowerCase().includes(x.toLowerCase()),x);
assert.equal((html.match(/class="katex-mathml"/g)||[]).length,42);
assert.equal((html.match(/class="inline-math"/g)||[]).length,35);
const queue=[parse(html)],annotations=[];
while(queue.length){const node=queue.pop();if(node.tagName==='annotation'&&node.attrs?.some(a=>a.name==='encoding'&&a.value==='application/x-tex'))annotations.push(node.childNodes.map(c=>c.value||'').join(''));queue.push(...node.childNodes||[]);}
for(const tex of [String.raw`a=\max_i|x_i|`,String.raw`s=\frac{a}{F}`,String.raw`\alpha=\frac{F}{a}`,String.raw`s=\frac{\max_{i\in g}|x_i|}{6}`,String.raw`(AH)(H^\top B)=AB`,String.raw`X\in\mathbb R^{B\times d}`,String.raw`W\in\mathbb R^{d\times m}`,String.raw`G=\frac{\partial\mathcal L}{\partial Y}\in\mathbb R^{B\times m}`,String.raw`\Delta O\approx\Delta P\,V+P\,\Delta V`,String.raw`\operatorname{Var}(\Delta O)=\sum_j V_j^2\operatorname{Var}(e_j)`,String.raw`\max(\lVert O\rVert,\varepsilon)`,String.raw`1+\frac{1}{256}`,String.raw`2^{-16}`,String.raw`(4n+4)d`,String.raw`(2n+2)d`])assert(annotations.includes(tex),tex);
assert(!html.includes('s=max|x|/6')&&!html.includes('Var(ΔO)=Σ'));
assert(html.includes('one output component')&&html.includes('independent probability-entry errors')&&html.includes('Correlated errors add covariance terms'));
for(const tex of [String.raw`l<h`,String.raw`l\le x\le h`,String.raw`h-l`,String.raw`l=h`])assert(annotations.includes(tex),tex);
const caption=parse(html);const textNodes=[];const nodes=[caption];while(nodes.length){const n=nodes.pop();if(n.nodeName==='#text')textNodes.push(n.value);nodes.push(...n.childNodes||[]);}
const parsedText=textNodes.join(' ');assert(parsedText.includes('without clipping and with exact probabilities')&&parsedText.includes('A value already on the grid can be returned exactly')&&parsedText.includes('do not divide by'));
const code=html.match(/<pre><code>(def fake_quant[\s\S]*?)<\/code>/)[1];
const check=String.raw`
cases=0
for step in [0.0625, 0.25, 1, 4]:
    for zero in [0, 1, 3]:
        for numerator in range(-64, 65):
            x=numerator*step/8
            u=x/step
            lo=int(u//1)
            frac=u-lo
            nearest=lo if frac<0.5 or (frac==0.5 and lo%2==0) else lo+1
            expected=step*(min(15,max(0,nearest+zero))-zero)
            assert fake_quant(x,step,zero,0,15)==expected
            cases+=1
print(cases)
`;
assert.equal(Number(execFileSync('python3',['-c',code+check],{encoding:'utf8'}).trim()),1548);
console.log('Numerics preservation: three Git-equal core bodies,47 exact headings,7 display+35 inline MathML formulas with exact annotations/conditions,zero old dependencies and1548 actual Python scalar cases pass. Full external-primary/GPU/production checks remain separate.');
