import assert from 'node:assert/strict';
import './test-moe-core-closure.mjs';
import './test-moe-static-scenes.mjs';
import {moeMeta,moeAliases,moeSections,moeReader,selectExperts,countLoads,biasStep,demoBatch,tokenJourney} from '../prototypes/readers/moe.js';
import {makeTree,findNode} from '../prototypes/navigation.js';
import {rank} from '../prototypes/search.js';
import {readerMetas} from '../prototypes/readers/index.js';
import {reviewedNavigation,resolveReviewedNote} from '../prototypes/reviewed-navigation.js';
import {readFile} from 'node:fs/promises';
import {routingFrame,routingPoints} from '../prototypes/readers/moe-animation.js';
assert.deepEqual(routingFrame(0).counts,[6,2]);
assert.deepEqual(routingFrame(1).counts,[2,6]);
assert.equal(routingFrame(0).experts[4],0);
assert.equal(routingFrame(1).experts[4],1);
assert.equal(routingFrame(1).bias,.45);
assert.equal(routingPoints[4][0],.3);
assert.equal((1-.3)/2,.35,'Original affinity remains independent of bias');
for(let i=0;i<=100;i++)assert.equal(routingFrame(i/100).counts.reduce((a,b)=>a+b),8);
const initial=selectExperts([.8,.7,.3,.2],[0,0,0,0],2);
assert.deepEqual(initial.map(x=>x.i),[0,1]);
const biased=selectExperts([.8,.7,.3,.2],[0,0,.6,0],2);
assert.deepEqual(biased.map(x=>x.i),[2,0]);
assert(Math.abs(biased[0].weight-.3/1.1)<1e-12);
assert(Math.abs(biased.reduce((s,x)=>s+x.weight,0)-1)<1e-12);
assert.deepEqual(selectExperts([.5,.5],[0,0],1).map(x=>x.i),[0]);
assert.throws(()=>selectExperts([.5],[0],2),RangeError);
assert.throws(()=>selectExperts([NaN],[0],1),RangeError);
assert.deepEqual(countLoads(demoBatch,[0,0,0,0],1),[6,2,0,0]);
assert.deepEqual(biasStep([0,0,0,0],[6,2,0,0],2,.05),[-.05,0,.05,.05]);
for(const k of [1,2,4])assert.equal(countLoads(demoBatch,[0,0,0,0],k).reduce((a,b)=>a+b),demoBatch.length*k);
const catalog=JSON.parse(await readFile(new URL('../prototypes/catalog.json',import.meta.url),'utf8'));
const sources=catalog.notes.filter(n=>n.tracked&&!n.navigationPage&&!n.draft&&!n.unlisted);
const notes=[...readerMetas,...sources.filter(n=>!moeAliases.includes(n.slug)&&!reviewedNavigation[n.slug])];
const root=makeTree(notes);
assert(findNode(root,['models','architectures']).notes.some(n=>n===moeMeta));
assert.equal(notes.filter(n=>moeAliases.includes(n.slug)).length,0);
for(const q of ['mixture of exparts','quantile balancing','padding','z-loss'])assert(rank(notes,q).some(r=>r.note===moeMeta),q);
const html=moeReader(s=>{const target=resolveReviewedNote(s);return 'directions.html?slug='+(target?.slug||s)+(target?.anchor?'#'+target.anchor:'');});
for(const [id] of moeSections)assert(html.includes(`id="${id}"`),id);
assert.equal(new Set(moeSections.map(s=>s[0])).size,moeSections.length);
const ids=[...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,'Duplicate note anchors');
assert(html.indexOf('id="imbalance"')<html.indexOf('id="auxiliary-balancing"'));
assert(html.indexOf('id="routing"')<html.indexOf('id="loss-free-balancing"'));
assert(html.indexOf('id="practice"')<html.indexOf('id="history"'));
assert(!/Preserved Laguna|retained report summary|Consolidated reader pilot/.test(html));
assert.equal(tokenJourney.length,5);
assert(Math.abs(initial[0].weight*2-initial[1].weight-.6)<1e-12);
assert(Math.abs(4*(.75*.5+.25*.25)-1.75)<1e-12);
assert(Math.abs(4*(.75*.4+.25*.25)-1.45)<1e-12);
for(const tex of [String.raw`f_i=\frac{\mathrm{count}_i}{T}`,String.raw`p_i=\frac{1}{T}\sum_{t=1}^{T}\rho_i(x_t)`,String.raw`\frac{\mathrm{count}_i}{kT}`,String.raw`4\cdot0.75\cdot0.10=0.30`,String.raw`\frac{L_{\mathrm{aux}}}{\alpha}`])assert(html.includes(tex),tex);
assert(!html.includes('${inlineMath'),'No literal formula interpolation');
assert(html.includes('positive auxiliary coefficient'));
for(const tex of [String.raw`\frac{16}{896}=\frac{1}{56}`,String.raw`g=W_g z`,String.raw`u=W_u z`,String.raw`\beta_1=4`,String.raw`\beta_2=25`])assert(html.includes(tex),tex);
assert.equal(16*56,896);
assert(html.includes('elementwise multiplication'));
// Coverage sentinels complement the manual source-to-section audit. They prevent
// editorial changes from silently losing extracted reference blocks or cases.
for(const text of ['V3’s small-model ablations','marginal loss reduction','selective precision alone was insufficient',
  'hundreds of billions of tokens','effective-weight-decay','LM-head input-gradient',
  'SiTU-GLU','3,584',String.raw`\beta_1=4`,String.raw`\beta_2=25`,'512 experts','RMSNorm gains to zero',
  'Instruction-Following','Rollout Routing Replay','0.78','22%','30×',
  '4%–14%','25%–53%','305M','711M','Jensen–Shannon','Core 9',
  'routed scaling factor of 2.5','727B','305.5B','9.51B','MoonEP']){
  assert(html.includes(text),`Missing preserved MoE detail: ${text}`);
}
for(const selector of ['data-journey-prev','data-journey-next','data-journey-play','data-section-filter'])assert(html.includes(selector),selector);
const visuals=await readFile(new URL('../prototypes/readers/moe-visuals.css',import.meta.url),'utf8');
assert(visuals.includes('prefers-reduced-motion:reduce'));
assert(visuals.includes('overflow-x:auto'));
for(const target of [...html.matchAll(/slug=([^"#]+)/g)].map(m=>m[1]))assert(notes.some(n=>n.slug===target),`Missing related note ${target}`);
console.log('MoE score/weight separation, load updates, ties, shapes, sections, search, consolidation and related routes pass.');
