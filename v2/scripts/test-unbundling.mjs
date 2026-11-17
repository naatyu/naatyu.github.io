import assert from 'node:assert/strict';
import {parseFragment} from 'parse5';
import {visionAllocations,allocationState,fusionState} from '../site/readers/unbundling-model.js';
import {allocationBody,fusionBody} from '../site/readers/unbundling-scenes.js';
import {visionReader,visionMeta,visionSections} from '../site/readers/vision.js';
import {readerMetas,renderDenseReader} from '../site/readers/index.js';
import {rank} from '../site/search.js';
import {assertGeneratedMarkup,assertGeneratedMarkupCount} from './check-generated-markup.mjs';
const expected={early:[45,36,50.4],late:[35.1,23.3,49.8],spread:[37.6,28.1,50],every:[39.4,31.3,50.7],'all-branch':[42.3,30.8,51.2],shared:[40.1,29.6,51.2]};
let states=0;
for(const c of visionAllocations)for(const [j,metric]of ['vqa','ocr','text'].entries())for(const reveal of [false,true]){
 const s=allocationState(c.id,metric);assert.equal(s.score,expected[c.id][j]);assert.equal(s.layers.length,28);assert.equal(s.activeLayers,c.id==='every'?28:8);
 assert(Math.abs(s.layers.reduce((a,l)=>a+l.share,0)-1)<1e-14);assert.equal(s.budget,.4);
 if(c.id==='early')assert.deepEqual(s.layers.filter(l=>l.selected).map(l=>l.index),[0,1,2,3,4,5,6,7]);
 if(c.id==='late')assert.deepEqual(s.layers.filter(l=>l.selected).map(l=>l.index),[20,21,22,23,24,25,26,27]);
 const html=assertGeneratedMarkup(allocationBody(c.id,metric,reveal),'uv-allocation');assert.equal(html.includes('Selected allocation'),reveal);states++;
}
for(const modality of ['vision','text'])for(let stage=0;stage<=4;stage++){
 const s=fusionState(modality,stage);assert.equal(s.attentionPasses,1);assert.equal(s.shared,true);assert.equal(s.branch,modality==='vision');assert.equal(s.queryWidth,16*128);assert.equal(s.keyWidth,8*128);assert.equal(s.outputWidth,2048);assert.equal(s.toy.output,s.toy.residual+s.toy.shared+s.toy.vision);assert.equal(s.toy.output,modality==='vision'?10:5);assertGeneratedMarkup(fusionBody(modality,stage),'uv-fusion');states++;
}
for(const f of [()=>allocationState('other'),()=>allocationState('early','other'),()=>fusionState('image'),()=>fusionState('text',-1),()=>fusionState('vision',.1),()=>fusionState('vision',5),()=>allocationBody('early','vqa',1)])assert.throws(f,RangeError);
assertGeneratedMarkupCount('uv-allocation',36);assertGeneratedMarkupCount('uv-fusion',10);
const flat=n=>[n,...(n.childNodes||[]).flatMap(flat)],attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value;
const html=visionReader(s=>{const [slug,hash]=s.split('#');return '/atlas/'+slug+'/'+(hash?'#'+hash:'');}),nodes=flat(parseFragment(html)),ids=nodes.map(n=>attr(n,'id')).filter(Boolean);
assert.equal(ids.length,new Set(ids).size);for(const[id]of visionSections)assert(ids.includes(id));
assert.equal(visionMeta.date,'2026-04-08');assert.equal(visionMeta.updated,'2026-11-17');assert.equal(nodes.filter(n=>attr(n,'data-uv-lab')).length,2);
for(const id of ['unbundling','in-fusion','vision-allocation','vision-budget-evidence'])assert(ids.includes(id));
for(const phrase of ['common instruction-tuning evaluation stage is excluded','supplies no equivalence test','not a guarantee','before that instruction tuning','eager implementation','different numbers of tokens','additional data'])assert(html.includes(phrase),phrase);
for(const q of ['Unbundling','in-fusion','vision capacity'])assert(rank(readerMetas,q).some(r=>r.note.slug==='models/vision'),q);
for(const n of nodes){const href=attr(n,'href');if(!href?.startsWith('/atlas/'))continue;const [path,anchor]=href.slice(7).split('#'),slug=path.replace(/\/$/,'');const target=renderDenseReader(slug,s=>s);assert(target,href);if(anchor)assert(target.includes(`id="${anchor}"`),href);}
console.log(`Unbundling: ${states} guarded states; independent source-table values, capacity conservation, token eligibility, single attention path, dimensions, links, search and dates pass.`);
