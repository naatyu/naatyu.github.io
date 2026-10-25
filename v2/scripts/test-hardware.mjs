import {assertGeneratedMarkup,assertGeneratedMarkupCount} from './check-generated-markup.mjs';
import './test-hardware-model.mjs';
import './test-hardware-preservation.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {hardwareMeta,hardwareAliases,hardwareSections,hardwareReader} from '../prototypes/readers/hardware.js';
import {hardwareHeatBody,hardwarePlacementBody,hardwareCapacityBody} from '../prototypes/readers/hardware-scenes.js';
import {readerMetas,renderDenseReader} from '../prototypes/readers/index.js';
import {rank} from '../prototypes/search.js';
let cases=0;
for(let flow=30;flow<=240;flow+=10)for(let stage=0;stage<=4;stage++){
 const html=hardwareHeatBody(flow,stage);assertGeneratedMarkup(html,"test-hardware.mjs");assert.ok(!/NaN|undefined|Infinity/.test(html));
 assert.ok(html.includes(`flow=${flow}L/min`));assert.ok(html.includes(`Stage=${stage}/4`));cases++;
}
for(const mode of ['crowded','balanced'])for(let site=120;site<=300;site+=10){
 const html=hardwarePlacementBody(mode,site);assertGeneratedMarkup(html,"test-hardware.mjs");assert.ok(!/NaN|undefined|Infinity/.test(html));
 assert.ok(html.includes(`site margin=${site-180}kW`));assert.ok(html.includes(`feasible=${mode==='balanced'&&site>=180?'yes':'no'}`));cases++;
}
for(let a=0;a<=100;a++)for(let u=0;u<=100;u++){
 const html=hardwareCapacityBody(a,u);assertGeneratedMarkup(html,"test-hardware.mjs");assert.ok(!/NaN|undefined|Infinity/.test(html));
 const widths=[...html.matchAll(/width="([0-9.e+-]+)" height="70"/g)].map(x=>Number(x[1]));
 assert.equal(widths.length,3);assert.ok(Math.abs(widths.reduce((s,x)=>s+x,0)-540)<1e-9);assert.ok(widths.every(x=>x>=0));cases++;
}
const html=hardwareReader(s=>'directions.html?slug='+s),ids=[...html.matchAll(/ id="([^"]+)"/g)].map(x=>x[1]);
assert.equal(ids.length,new Set(ids).size);assert.equal(hardwareSections.length,16);for(const[id]of hardwareSections)assert.ok(ids.includes(id));
assert.equal(hardwareMeta.date,'2026-05-30');assert.equal(hardwareMeta.visibility,'public');assert.ok(hardwareMeta.prototype);assert.deepEqual(hardwareAliases,['systems/infrastructure/high-density-gpu-infrastructure']);
assert.equal(renderDenseReader(hardwareMeta.slug,s=>s),hardwareReader(s=>s));assert.equal((html.match(/data-hardware-lab=/g)||[]).length,3);assert.ok(!/NaN|undefined/.test(html));
for(const text of ['cold plate','CDU','technical','facility loop','heat exchanger','120 kW','1.2 MW','10–40 kW','100–150+ kW','flow balancing','particulates','biolog','Raised floors','Optionality','breaker','redundan','counterfactual','1368.576','342.144','17.28','MFU','protection'])assert.ok(html.toLowerCase().includes(text.toLowerCase()),text);
const catalog=JSON.parse(fs.readFileSync(new URL('../prototypes/catalog.json',import.meta.url),'utf8')),notes=[...readerMetas,...catalog.notes];
for(const[,slug]of html.matchAll(/href="directions\.html\?slug=([^"#]+)"/g))assert.ok(notes.some(n=>n.slug===slug),slug);
for(const q of ['GPU infrastructure','liquid cooling','CDU','rack topology'])assert.ok(rank(notes,q).some(r=>r.note===hardwareMeta),q);
assertGeneratedMarkupCount("test-hardware.mjs",cases);
console.log(`GPU Infrastructure:16 sections,three scenes,${cases} rendered states,lineage/search/links pass;${html.replace(/<[^>]*>/g,' ').split(/\s+/).length} words.`);
