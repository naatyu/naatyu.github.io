import {assertGeneratedMarkup,assertGeneratedMarkupCount} from './check-generated-markup.mjs';
import './test-serving-model.mjs';
import './test-serving-preservation.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {reviewedNavigation,reviewedFragments,resolveReviewedNote} from '../site/reviewed-navigation.js';
import {servingMeta,servingAliases,servingSections,servingReader} from '../site/readers/serving.js';
import {servingKVBody,servingPagesBody,servingScheduleBody} from '../site/readers/serving-scenes.js';
import {readerMetas,renderDenseReader} from '../site/readers/index.js';
import {rank} from '../site/search.js';
let cases=0;
for(let exponent=10;exponent<=20;exponent++)for(const batch of [1,4,16,64])for(const heads of [1,8,32])for(const bytes of [1,2]){
 const html=servingKVBody(exponent,batch,heads,bytes);assertGeneratedMarkup(html,"test-serving.mjs");
 const reference=2*batch*32*2**exponent*heads*128*bytes;
 assert.ok(html.includes('cache bytes='+reference));assert.ok(!/NaN|Infinity|undefined/.test(html));cases++;
}
for(const block of [1,2,4,8])for(const common of [0,4,8])for(const separate of [false,true]){
 const html=servingPagesBody(block,common,separate),saved=separate?0:Math.floor(common/block)*block;assertGeneratedMarkup(html,"test-serving.mjs");
 assert.ok(html.includes('saved='+saved));assert.ok(html.includes('logical=24'));assert.ok(!/NaN|Infinity|undefined/.test(html));cases++;
}
for(const policy of ['static','continuous'])for(const capacity of [1,2,3])for(let stage=0;stage<=6;stage++){
 const html=servingScheduleBody(policy,capacity,stage),steps=capacity===1?7:capacity===3?4:policy==='continuous'?4:6;assertGeneratedMarkup(html,"test-serving.mjs");
 assert.ok(html.includes('makespan='+steps));assert.ok(html.includes('position='+stage+'/6'));assert.ok(html.includes('step='+Math.floor(stage*(steps-1)/6)));assert.ok(!/NaN|Infinity|undefined/.test(html));cases++;
}
const html=servingReader(s=>'directions.html?slug='+s),ids=[...html.matchAll(/ id="([^"]+)"/g)].map(x=>x[1]);
assert.equal(ids.length,new Set(ids).size);assert.equal(servingSections.length,33);for(const[id]of servingSections)assert.ok(ids.includes(id));
const ttsSource='ai/inference-serving/performance/tts-stream-capacity';assert.deepEqual(reviewedNavigation[ttsSource],{slug:'execution/serving',anchor:'tts'});assert.equal(Object.keys(reviewedFragments[ttsSource]).length,9);for(const[heading,anchor]of Object.entries(reviewedFragments[ttsSource])){assert.ok(ids.includes(anchor));assert.deepEqual(resolveReviewedNote(ttsSource+'#'+heading),{slug:'execution/serving',anchor});}for(const term of ['Bark','TensorRT','FP16/INT8','FlashAttention','EnCodec','24 kHz','16 kHz'])assert.ok(html.includes(term),term);
assert.equal(servingMeta.date,'2026-04-08');assert.equal(servingMeta.visibility,'public');assert.equal(servingMeta.prototype,false);assert.deepEqual(servingAliases,[]);
assert.equal(renderDenseReader(servingMeta.slug,s=>s),servingReader(s=>s));assert.equal((html.match(/data-serving-lab=/g)||[]).length,3);
assert.ok(!/undefined/.test(html));for(const s of ['1,073,741,824','128 KiB','99.9%','token bucket','37.5%','890','5.47','ReplaySSM','Layer Split','75%','781','copy-on-write','first-token work','policy-version','capacity','2PW','200 output tokens','MXFP4'])assert.ok(html.toLowerCase().includes(s.toLowerCase()),s);
const catalog=JSON.parse(readFileSync(new URL('../site/catalog.json',import.meta.url),'utf8')),notes=[...readerMetas,...catalog.notes];
for(const[,slug]of html.matchAll(/href="directions\.html\?slug=([^"#]+)"/g))assert.ok(notes.some(n=>n.slug===slug),slug);
for(const q of ['KV cache','continuous batching','prefix caching','TTFT','Serving models'])assert.ok(rank(notes,q).some(r=>r.note===servingMeta),q);
const fingerprints=[
['ai/architectures/model-reports/deepseek-v4-1-flash','8ae8ba315b0643f15b69dda60bc5b38c86341c47d3b842971f008cfd53c024af'],
['ai/architectures/model-reports/gemma-4-technical-report','8b0b7369c49a82fadaeec5336b90712da42e25dca3c7979f59f2cfe359d19375'],
['ai/architectures/model-reports/glm-5-3-flash-hybrid-multimodal','46f77ac8c04d164f6628125781b78c74a8239d387cb8727fe7cc9c81580c41c5'],
['ai/architectures/model-reports/glm-5-agentic-engineering','563102d0092cbf6b8a1b8bcaa38c0c8ddb9b159006570492ecaf8e829be7769f'],
['ai/architectures/model-reports/kimi-k3-open-frontier-intelligence','398214742c4344fd4baabc1f64040484bf12021cc7b47be0ff71152a58d8bd0e'],
['ai/architectures/model-reports/nanbeige4-2-3b-unlocking-agentic-capabilities','d14f9b6e8d95eeee12307cba1e182e5858ea62aeaccc26ba8d5ac1cd9f1aa5de'],
['ai/architectures/model-reports/shieldstral','3c1789df3703dc74fb03362c30d9f7a6b91d7099241f7a62631cb71e4937c492'],
['ai/inference-serving/caching/kv-cache','8d91344fc5c7468c70c3dc803c491c7c0d028b72b493046ade5e25998bebb582'],
['ai/inference-serving/performance/llm-inference-economics','3086a734618cf175a432b7a9b362f9492cb64b172dc02885592e24d657553075'],
['ai/inference-serving/performance/tts-stream-capacity','62daaff5536f6919c500a4c0c8c24fcc8ca7aef728d52b2f952cc1a55d9b8039'],
['ai/inference-serving/serving-architectures/disaggregated-prefill-decode-serving','2858743828dc8868e3da1192b9854479569c076a12b42b34626941b939997044'],
['ai/inference-serving/serving-architectures/large-language-model-serving','7fd22cbe8975211f7bb5217723076a48bda4b72eb34daefab2541b8a121ebd07']
];
for(const[path,hash]of fingerprints)assert.equal(createHash('sha256').update(readFileSync(new URL('../../docs/'+path+'.md',import.meta.url))).digest('hex'),hash);
assertGeneratedMarkupCount("test-serving.mjs",cases);
console.log('Serving: 33 sections, three scenes, '+cases+' bounded rendered states, source fingerprints, registry/search/links pass; '+html.replace(/<[^>]*>/g,' ').split(/\s+/).length+' words.');
