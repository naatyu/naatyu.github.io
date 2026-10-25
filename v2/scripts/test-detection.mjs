import {assertGeneratedMarkup,assertGeneratedMarkupCount} from './check-generated-markup.mjs';
import './test-detection-model.mjs';
import assert from 'node:assert/strict';
import './test-detection-notation.mjs';
import {readFile} from 'node:fs/promises';
import {detectionGeometryBody,detectionTraceBody} from '../prototypes/readers/detection-scenes.js';
import {overlap,detectionBoxes,suppressionTrace} from '../prototypes/readers/detection-model.js';
import {detectionMeta,detectionSections,detectionReader,detectionAliases} from '../prototypes/readers/detection.js';
import {readerMetas,renderDenseReader} from '../prototypes/readers/index.js';
import {rank} from '../prototypes/search.js';
import {reviewedNavigation,resolveReviewedNote} from '../prototypes/reviewed-navigation.js';
let states=0;const check=html=>{assertGeneratedMarkup(html,"test-detection.mjs");assert.ok(!/NaN|undefined/.test(html));states++;};
for(let d=0;d<=160;d++){const html=detectionGeometryBody(d),intersection=Math.max(0,100-d)*100,union=20000-intersection;check(html);assert.ok(html.includes('Intersection area='+intersection));assert.ok(html.includes('union area='+union));const m=overlap([0,0,100,100],[d,0,d+100,100]);assert.ok(Math.abs(m.iou-intersection/union)<1e-10);assert.ok(Math.abs(m.centerPenalty-d*d/((100+d)**2+10000))<1e-10);}
for(const method of ['hard','linear','gaussian','diou'])for(let percent=0;percent<=100;percent++)for(const aware of [true,false])for(let stage=0;stage<=5;stage++){const html=detectionTraceBody(method,percent,aware,stage);check(html);assert.ok(html.includes('not detector measurements or ground truth'));assert.equal((html.match(/<tr>/g)||[]).length,6);}
assert.equal(states,5009);
const gaussian=suppressionTrace(detectionBoxes,{method:'gaussian'});assert.equal(gaussian[2].selected.id,'D');assert.ok(Math.abs(gaussian[1].remaining.find(b=>b.id==='B').score-.2950658754896255)<1e-12);
const html=detectionReader(s=>'directions.html?slug='+s),ids=[...html.matchAll(/ id="([^"]+)"/g)].map(x=>x[1]);assert.equal(detectionSections.length,21);assert.equal(ids.length,new Set(ids).size);for(const[id]of detectionSections)assert.ok(ids.includes(id));
assert.equal(detectionMeta.date,'2026-04-16');assert.ok(detectionMeta.prototype);assert.equal(detectionMeta.visibility,'public');assert.deepEqual(detectionAliases,[]);assert.equal(renderDenseReader(detectionMeta.slug,s=>s),detectionReader(s=>s));
assert.equal((html.match(/data-detection-lab=/g)||[]).length,2);
for(const word of ['intersection','union','score floor','N(N−1)/2','O(N²)','O(N)','retraining','DIoU','CIoU','anchors','Faster R-CNN','face','Pedestrian','OCR','.45','precision','recall','DETR','stable_score_order','not a complete Weighted Boxes Fusion'])assert.ok(html.toLowerCase().includes(word.toLowerCase()),word);
const catalog=JSON.parse(await readFile(new URL('../prototypes/catalog.json',import.meta.url),'utf8')),notes=[...readerMetas,...catalog.notes.filter(n=>!reviewedNavigation[n.slug])];for(const[,slug]of html.matchAll(/href="directions\.html\?slug=([^"#]+)"/g))assert.ok(notes.some(n=>n.slug===slug),slug);
const oldNms='ai/modalities/computer-vision/non-maximum-suppression';assert.equal(reviewedNavigation[oldNms].slug,detectionMeta.slug);assert.ok(!notes.some(n=>n.slug===oldNms));assert.deepEqual(resolveReviewedNote(oldNms+'#3-the-nms-algorithm'),{slug:detectionMeta.slug,anchor:'hard-nms'});
for(const q of ['NMS','Soft-NMS','weighted boxes fusion','object detection'])assert.ok(rank(notes,q).some(r=>r.note===detectionMeta),q);
for(const fn of [()=>detectionGeometryBody(-1),()=>detectionTraceBody('hard',101),()=>detectionTraceBody('hard',50,true,6)])assert.throws(fn,RangeError);
assertGeneratedMarkupCount("test-detection.mjs",states);
console.log('Detection: 21 sections, '+states+' bounded rendered states, preserved algorithms/applications/conditions, lineage, links and search pass.');
