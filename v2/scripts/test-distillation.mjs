import "./test-distillation-model.mjs";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {distillationMeta,distillationReader,distillationSections,distillationAliases} from "../prototypes/readers/distillation.js";
import {readerMetas,renderDenseReader} from "../prototypes/readers/index.js";
import {rank} from "../prototypes/search.js";
import {reviewedNavigation} from "../prototypes/reviewed-navigation.js";
const html=distillationReader(s=>"directions.html?slug="+s);
const ids=[...html.matchAll(/ id="([^"]+)"/g)].map(x=>x[1]);
assert.equal(distillationSections.length,35);
assert.equal(ids.length,new Set(ids).size);
for(const[id]of distillationSections)assert.ok(ids.includes(id),id);
assert.equal(distillationMeta.date,"2026-06-08");assert.ok(distillationMeta.prototype);assert.equal(distillationMeta.visibility,"public");assert.deepEqual(distillationAliases,[]);
assert.equal(renderDenseReader(distillationMeta.slug,s=>s),distillationReader(s=>s));
for(const phrase of ["extrapolated, not run","teacher was Qwen3-8B","Qwen3-32B FLOPs","9–30×","77k prompts","rank 32","13%","6%","18","85","43","45","36","79","41","83","7–10×","50–100×","rank-128","O(1M)","over 40 teachers","nine teachers","Nanbeige3.5-Pro","percentage-point units","sampling measure","expected initial SFT score gradient","not generally the full sequence-KL gradient","stopped","not production"]) {
 if(phrase==="not production")assert.ok(html.includes("Neither snippet is a production"));else assert.ok(html.includes(phrase),phrase);
}
assert.ok(!/undefined|NaN/.test(html));
assert.equal((html.match(/data-distillation-lab=/g)||[]).length,5);
const catalog=JSON.parse(await readFile(new URL("../prototypes/catalog.json",import.meta.url),"utf8"));
const notes=[...readerMetas,...catalog.notes.filter(n=>!reviewedNavigation[n.slug])];
assert.ok(!html.includes("Original notes and report context"));
assert.ok(!html.includes("The earlier OPD note records"));
assert.ok(html.includes("the guarantee concerns its declared teacher distribution"));
for(const slug of ["ai/training/losses/knowledge-distillation","ai/training/optimization/on-policy-distillation","ai/training/optimization/self-distillation-in-rl-climbs"]){
 assert.equal(reviewedNavigation[slug].slug,distillationMeta.slug);
 assert.ok(!notes.some(n=>n.slug===slug));
}
for(const[,slug]of html.matchAll(/href='directions\.html\?slug=([^'#]+)'/g))assert.ok(notes.some(n=>n.slug===slug),slug);
for(const q of ["on-policy distillation","GKD","self-distillation","teacher consolidation","label repair","reverse KL"])assert.ok(rank(notes,q).some(r=>r.note===distillationMeta),q);
const words=html.replace(/<[^>]*>/g," ").split(/\s+/).length;assert.ok(words>4500);
console.log("Distillation: 35 unique sections, five scenes, lineage, scope caveats, original/canonical links and semantic search pass.");
