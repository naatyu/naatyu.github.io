import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import GithubSlugger from 'github-slugger';
import {parse} from 'parse5';
import {compactReader,compactAliases} from '../prototypes/readers/compact.js';
import {reviewedFragments,resolveReviewedNote} from '../prototypes/reviewed-navigation.js';
const root=new URL('../../',import.meta.url);
const path='docs/ai/architectures/model-reports/nanbeige4-3b-technical-report.md';
const source=readFileSync(new URL(path,root),'utf8');
assert.equal(source,execFileSync('git',['show','HEAD:'+path],{cwd:root,encoding:'utf8'}));
const slug=path.slice(5,-3),g=new GithubSlugger();
const anchors=[...source.matchAll(/^#{1,6} (.+)$/gm)].map(m=>g.slug(m[1]));
assert.equal(anchors.length,24);
assert.deepEqual(Object.keys(reviewedFragments[slug]),anchors);
const html=compactReader(s=>s),ids=new Set([...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]));
assert.ok(compactAliases.includes(slug));
for(const a of anchors){const t=resolveReviewedNote(slug+'#'+a);assert.equal(t.slug,'models/compact-recipes');assert.ok(ids.has(t.anchor),a);}
assert.ok(!html.includes('href="'+slug+'"'));
const tables=[...html.matchAll(/<table>([\s\S]*?)<\/table>/g)].map(m=>m[1]);
const selected=tables.filter(t=>t.startsWith('<caption>Nanbeige 4 stages;')||t.startsWith('<caption>Controlled 1B-model,')||t.startsWith('<caption>Nanbeige 4 Thinking'));
assert.equal(selected.length,3);
const rows=selected.flatMap(t=>[...t.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map(m=>[...m[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map(c=>c[1].replace(/<[^>]+>/g,'').trim())));
const original=source.split('\n').filter(l=>l.startsWith('|')).map(l=>l.split('|').slice(1,-1).map(c=>c.replace(/\*\*|`/g,'').trim()));
const benchmarks=['AIME 2024','AIME 2025','GPQA-Diamond','SuperGPQA','BFCL V4','Fullstack Bench','ArenaHard V2','Multi-Challenge'];
for(const e of original.filter(r=>benchmarks.includes(r[0]))){const a=rows.find(r=>r[0]===e[0]);assert.ok(a,e[0]);for(let i=1;i<e.length;i++)assert.equal(Number(a[i]),Number(e[i]),e[0]);}
for(const [name,label] of [['Vanilla WSD','WSD'],['FG-WSD','FG-WSD']]){const e=original.find(r=>r[0]===name),a=rows.find(r=>r[0]===label);assert.ok(a);for(let i=1;i<e.length;i++)assert.equal(Number(a[i]),Number(e[i]));}
for(const phrase of ['at least two epochs','Provenance and learned quality scores','Qwen3-4B-Base and Qwen3-8B-Base','teacher models and the current model','forward-KL teacher supervision','relative gains, not percentage-point','RL from the distilled checkpoint','two through fourteen successes','truncated sequences','AIME averages eight runs','Thinking-2511','multi-turn instruction following','some teachers and evaluators are proprietary'])assert.ok(html.includes(phrase),phrase);
const document=parse(html),all=[];function visit(n){all.push(n);for(const c of n.childNodes||[])visit(c);}visit(document);
const attrs=(n,k)=>n.attrs?.find(a=>a.name===k)?.value;
assert.equal(all.filter(n=>attrs(n,'class')?.split(' ').includes('typeset-equation')).length,7);
assert.ok(!html.includes('katex-error'));
const visibleText=all.filter(n=>n.nodeName==='#text').map(n=>n.value).join(' ');
assert.ok(visibleText.includes('student support must cover teacher mass. A mean needs its own denominator.'));
assert.ok(!all.some(n=>n.tagName==='t'));
for(const f of ['data.js','scaling.js','rl-recipes.js']){const body=readFileSync(new URL('../prototypes/readers/'+f,import.meta.url),'utf8');assert.ok(!body.includes(slug),f);assert.ok(body.includes('models/compact-recipes#nan4'),f);}
console.log('Nanbeige4 preservation: Git-equal original,24 exact headings,all8 final benchmark and2 ablation rows,forward-KL scope,RL-init evidence and canonical cross-owner links pass. Full external figure/production gates remain separate.');
