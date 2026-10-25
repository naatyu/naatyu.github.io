import './test-communication-model.mjs';
import './test-communication-scenes.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseFragment} from 'parse5';
import {communicationMeta,communicationAliases,communicationSections,communicationReader}from '../prototypes/readers/communication.js';
import {readerMetas,renderDenseReader}from '../prototypes/readers/index.js';
import {rank}from '../prototypes/search.js';
import {reviewedNavigation,resolveReviewedNote}from '../prototypes/reviewed-navigation.js';
const html=communicationReader(s=>'directions.html?slug='+s),ids=[...html.matchAll(/ id="([^"]+)"/g)].map(x=>x[1]);
assert.equal(ids.length,new Set(ids).size);assert.equal(communicationSections.length,43);for(const[id]of communicationSections)assert.ok(ids.includes(id));
assert.deepEqual(communicationAliases,[]);assert.equal(communicationMeta.date,'2026-07-21');assert.equal(communicationMeta.visibility,'public');assert.ok(communicationMeta.prototype);assert.equal(renderDenseReader(communicationMeta.slug,s=>s),communicationReader(s=>s));assert.equal((html.match(/data-communication-lab=/g)||[]).length,4);assert.ok(!/undefined/.test(html));
assert.equal((html.match(/class="inline-math"/g)||[]).length,12);
assert.equal((html.match(/<math /g)||[]).length,17);
const doc=parseFragment(html),queue=[doc];let comparison;
while(queue.length){const n=queue.pop();if(n.tagName==='section'&&n.attrs?.some(a=>a.name==='id'&&a.value==='one-two-shot'))comparison=n;queue.push(...n.childNodes||[]);}
const formulas=[],nodes=[comparison];while(nodes.length){const n=nodes.pop();if(n.tagName==='annotation')formulas.push(n.childNodes.map(c=>c.value||'').join(''));nodes.push(...(n.childNodes||[]).slice().reverse());}
assert.deepEqual(formulas.slice(0,10),[String.raw`2(N-1)M`,String.raw`2ND`,String.raw`(N-1)M`,String.raw`ND`,String.raw`\dfrac{4(N-1)M}{N}`,String.raw`2D`,String.raw`\dfrac{2(N-1)M}{N}`,String.raw`D`,String.raw`\approx\dfrac{2(N-1)M}{N}`,String.raw`\approx\dfrac{D}{N}`]);
assert(html.includes('<table style="min-width:480px">')&&html.includes('scroll horizontally on narrow screens'));
assert(formulas.includes(String.raw`N\ge2`));
assert(html.includes('M is the logical message size in bytes; D is input bytes per iteration')&&html.includes('per-GPU quantities, not total cluster traffic')&&html.includes('not the full allocator footprint'));
for(const term of ['2N−1','2(N−1)','93.75%','512KiB','562.5KiB','nvidia-peermem','DMA-BUF','clear-to-send','ncclIbIflush','QPS_PER_CONNECTION','NCCL_CROSS_NIC','recvReduceCopySend','implicit credit','1.404','7%','70%','100–200K','16K','32768','65536','+7.0%','+1.5%','5%','NCCL_SYM_KERNEL'])assert.ok(html.replace(/\s+/g,'').includes(term.replace(/\s+/g,'')),term);
const catalog=JSON.parse(fs.readFileSync(new URL('../prototypes/catalog.json',import.meta.url),'utf8')),notes=[...readerMetas,...catalog.notes.filter(n=>!reviewedNavigation[n.slug])];
for(const source of ['systems/parallel-computing/low-latency-gpu-collectives','systems/parallel-computing/nccl-internals-protocols-algorithms-and-transports']){assert.equal(reviewedNavigation[source].slug,communicationMeta.slug);assert.ok(!notes.some(n=>n.slug===source));}
assert.deepEqual(resolveReviewedNote('systems/parallel-computing/low-latency-gpu-collectives#double-buffering'),{slug:communicationMeta.slug,anchor:'double-buffering'});
for(const term of ['aggregates chunks before notifying the CPU proxy','Ring favors large messages and Tree favors smaller ones'])assert.ok(html.includes(term));
for(const[,slug]of html.matchAll(/href="directions\.html\?slug=([^"#]+)"/g))assert.ok(notes.some(n=>n.slug===slug),slug);
for(const q of ['NCCL','LL128','push pull','double buffering'])assert.ok(rank(notes,q).some(r=>r.note===communicationMeta),q);
console.log(`Communication reader: 43 sections, four scenes, registry/search/links/conditions pass; ${html.replace(/<[^>]*>/g,' ').split(/\s+/).length} words.`);
