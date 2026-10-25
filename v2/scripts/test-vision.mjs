import './test-vision-model.mjs';
import './test-vision-core-closure.mjs';
import './test-vision-notation.mjs';
import './test-vision-scenes.mjs';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {reviewedNavigation,reviewedFragments,resolveReviewedNote} from '../site/reviewed-navigation.js';
import {visionMeta,visionAliases,visionSections,visionReader} from '../site/readers/vision.js';
import {readerMetas,renderDenseReader} from '../site/readers/index.js';
import {rank} from '../site/search.js';
const html=visionReader(s=>'directions.html?slug='+s),ids=[...html.matchAll(/ id="([^"]+)"/g)].map(x=>x[1]);assert.equal(ids.length,new Set(ids).size);assert.equal(visionSections.length,37);for(const[id]of visionSections)assert.ok(ids.includes(id));
const dinoSource='ai/modalities/computer-vision/models/dinov2';assert.deepEqual(reviewedNavigation[dinoSource],{slug:'models/vision',anchor:'dinov2'});assert.equal(Object.keys(reviewedFragments[dinoSource]).length,7);for(const [heading,anchor]of Object.entries(reviewedFragments[dinoSource])){assert.ok(ids.includes(anchor));assert.deepEqual(resolveReviewedNote(dinoSource+'#'+heading),{slug:'models/vision',anchor});}
assert.equal(visionMeta.date,'2026-04-08');assert.equal(visionMeta.prototype,false);assert.equal(visionMeta.visibility,'public');assert.equal(visionAliases.length,3);assert.equal(renderDenseReader(visionMeta.slug,s=>s),visionReader(s=>s));assert.equal((html.match(/data-vision-lab=/g)||[]).length,3);assert.ok(!/NaN|undefined/.test(html));
for(const text of ['online','categorical','cosine','stopped','Sinkhorn','KoLeo','LayerScale','block-diagonal','40%','82.3','87.8','ImageNet-22K','512-resolution','14.1','3.5','17.6','head-only','PaliGemma','Gemini','global-view variance','Fisher','Cramér','trapezoid','sampling noise','256-direction','O(BDM)','O(BMT)','unit','EMA','pixel unshuffle','236B','47B','401M','3584','10240','Pixtral','unknown','fine-tuned'])assert.ok(html.includes(text),text);
const catalog=JSON.parse(await readFile(new URL('../site/catalog.json',import.meta.url),'utf8')),notes=[...readerMetas,...catalog.notes];for(const[,slug]of html.matchAll(/href="directions\.html\?slug=([^"#]+)"/g))assert.ok(notes.some(n=>n.slug===slug),slug);
for(const q of ['iBOT','SIGReg','self supervised vision','patch text alignment','LeJEPA'])assert.ok(rank(notes,q).some(r=>r.note===visionMeta),q);
console.log('Vision reader:37 sections,three scenes,registry/search/metadata/related links pass;'+html.replace(/<[^>]*>/g,' ').split(/\s+/).length+' rendered words.');
