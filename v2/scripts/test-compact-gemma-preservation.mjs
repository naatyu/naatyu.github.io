import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import GithubSlugger from 'github-slugger';
import {compactReader,compactAliases} from '../prototypes/readers/compact.js';
import {reviewedFragments,resolveReviewedNote} from '../prototypes/reviewed-navigation.js';
import {renderDenseReader} from '../prototypes/readers/index.js';
const root=new URL('../../',import.meta.url),path='docs/ai/architectures/model-reports/gemma-4-technical-report.md';
const source=readFileSync(new URL(path,root),'utf8');
assert.equal(source,execFileSync('git',['show','HEAD:'+path],{cwd:root,encoding:'utf8'}));
const slug=path.slice(5,-3),g=new GithubSlugger(),headings=[...source.matchAll(/^#{1,6} (.+)$/gm)].map(m=>g.slug(m[1]));
assert.equal(headings.length,19);assert.deepEqual(Object.keys(reviewedFragments[slug]),headings);
const html=compactReader(s=>s),ids=new Set([...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]));
for(const h of headings){const d=resolveReviewedNote(slug+'#'+h);assert.equal(d.slug,'models/compact-recipes');assert.ok(ids.has(d.anchor));}
assert.equal(compactAliases.length,5);assert.ok(compactAliases.includes(slug));
assert.ok(!html.includes('Full original notes'));assert.ok(!html.includes('href="'+slug+'"'));
for(const phrase of ['2.3B effective; about 5B total','4.5B effective; about 8B total','26B total; about 3.8B active','150M frozen ViT','305M frozen encoder','550M frozen ViT','explicit cache sharing ratios','Universal Speech Model (USM)','two downsampling convolutions and twelve Conformer','16-pixel patches','70, 140, 280, 560 and 1,120','48×48×3','35M matrix','640-sample/40ms','2, 4 and 8 bits','three local layers and one global layer','previous main activation','d×4,096','&lt;|channel&gt;thought …&lt;channel|&gt;','January 2025','4,096–12,288','Slice-Granularity Elasticity','speech translation and transcription','1,120 versus 280','96.4 versus 66.0','79.5 versus 8.6','caption says “Gb”'])assert.ok(html.includes(phrase),phrase);
const body=[...html.matchAll(/<table>([\s\S]*?)<\/table>/g)].map(m=>m[1]).find(t=>t.startsWith('<caption>Gemma Table 3'));
const rows=[...body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map(m=>[...m[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map(c=>c[1].replace(/<[^>]+>/g,'').trim()));
for(const[label,raw,quant]of [['E2B',4.6,.8],['E4B',9,2.3],['12B',24,7.65],['26B-A4B total',52,16.2],['31B',64,19.2]]){const r=rows.find(r=>r[0]===label);assert.equal(Number(r[1]),raw);assert.equal(Number(r[2]),quant);}
assert.ok(html.includes('7.6 raw/2.8 quantized'));
for(const reader of ['models/moe','models/attention','training/numerics','training/parallelism','execution/speculation']){const h=renderDenseReader(reader,s=>s);assert.ok(!h.includes('href="'+slug+'"'),reader);assert.ok(h.includes('models/compact-recipes#'),reader);}
console.log('Gemma preservation: Git-equal original,19 exact headings,five variants/footprints,cache/modal/drafter/interface/evaluation conditions and canonical cross-owner links pass. Compact no longer publishes an original-note archive.');
