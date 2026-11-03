import assert from 'node:assert/strict';
import {parseFragment} from 'parse5';
import {mistralLayers,mistralLayer,lengthBonuses,lengthCases,rolloutHistory,mistralGroupWeights} from '../site/readers/mistral-model.js';
import {surgeryBody,rolloutBody,bonusBody} from '../site/readers/mistral-scenes.js';
import {readerMetas,renderDenseReader} from '../site/readers/index.js';
import {rank} from '../site/search.js';
import {assertGeneratedMarkup,assertGeneratedMarkupCount} from './check-generated-markup.mjs';
const near=(a,b)=>assert(Math.abs(a-b)<1e-12,`${a} versus ${b}`);
let states=0;
for(let stage=0;stage<4;stage++)for(const layer of mistralLayers){
 const f=mistralLayer(layer,stage);
 // Independent explicit producer mapping for the Figure 3 excerpts.
 const initial={7:3,39:35,43:35},final={39:35,43:35};
 assert.equal(f.owner,(stage===0?initial:final)[layer]??layer);
 assert(f.owner<=layer);assert.equal(f.shared,f.owner!==layer);
 assert.equal(f.window,stage===0&&![3,7,35,39,43].includes(layer)?512:null);
 assert.equal(f.backboneFrozen,stage===2);assert.equal(f.sparse,stage===3);
 if(stage===3){const groups={32:32,33:32,34:32,36:36,37:36,38:36,40:40,41:40,42:40};assert.equal(f.indexOwner,groups[layer]??layer);}
 assertGeneratedMarkup(surgeryBody(stage,layer),'ml4-surgery');states++;
}
assert.equal(mistralLayer(7,0).owner,3);assert.equal(mistralLayer(7,1).owner,7);assert.equal(mistralLayer(39,3).owner,35);
assert.equal(mistralLayer(33,3).owner,33);assert.equal(mistralLayer(33,3).indexOwner,32);
let groups=0;
// Independent bin assignment by walking integer boundaries, not the production floor formula.
for(const minimum of [10,40,100,310])for(const second of [0,1,5,10,11,39,40])for(let mask=0;mask<16;mask++)for(const lambda of [0,.2,.4,1]){
 const lengths=[minimum,minimum+second,minimum+41,Math.max(1,minimum-1)],correct=lengths.map((_,i)=>Boolean(mask&(1<<i))),f=lengthBonuses(lengths,correct,lambda),good=lengths.filter((_,i)=>correct[i]);
 if(!good.length)assert.deepEqual(f.bonus,[0,0,0,0]);
 else{
  const lo=Math.min(...good),width=lo/10;
  const bin=x=>{let n=0;if(x<lo)return -1;while(lo+(n+1)*width<=x+1e-10)n++;return n;};
  const maxBin=Math.max(...good.map(bin));
  f.bonus.forEach((b,i)=>{assert(b>=0&&b<=lambda);if(!correct[i])assert.equal(b,0);else near(b,maxBin===0?0:lambda*(maxBin-bin(lengths[i]))/maxBin);});
 }
 groups++;
}
lengthBonuses([100,109,110,150,60],[true,true,true,true,false],.4).bonus.forEach((x,i)=>near(x,[.4,.4,.32,0,0][i]));
assert.deepEqual(lengthBonuses([100,109],[true,true],.4).bonus,[0,0]);
assert.deepEqual(lengthBonuses([100,110],[false,false]).bonus,[0,0]);
// Large accepted integers do not overflow the intermediate ten-times difference.
near(lengthBonuses([1,Number.MAX_SAFE_INTEGER],[true,true],.4).bonus[0],.4);
for(const id of Object.keys(lengthCases))for(let n=0;n<=100;n+=5){assertGeneratedMarkup(bonusBody(id,n/100),'ml4-bonus');states++;}
const expectedCaches=[[],[0,0,0],[0,0,0],[0,0,0,1,1],[0,0,0,1,1,2,2]];
for(let step=0;step<=4;step++){const f=rolloutHistory(step);assert.deepEqual(f.cache,expectedCaches[step]);assert.equal(f.segments.reduce((s,x)=>s+x.count,0),f.cache.length);assertGeneratedMarkup(rolloutBody(step),'ml4-rollout');states++;}
for(const rollouts of [2,16,32])for(const tokens of [32000,64000,128000]){const f=mistralGroupWeights([{rollouts,tokens}])[0];near(f.perToken*tokens,rollouts);assert.equal(f.total,rollouts);}
for(const f of [()=>mistralLayer(8),()=>mistralLayer(39,4),()=>rolloutHistory(-1),()=>rolloutHistory(.5),()=>lengthBonuses([],[]),()=>lengthBonuses([0],[true]),()=>lengthBonuses([100],[1]),()=>lengthBonuses([100],[true],NaN),()=>lengthBonuses([100],[true],-1),()=>lengthBonuses([100],[true,true]),()=>mistralGroupWeights([{rollouts:2,tokens:0}])])assert.throws(f,RangeError);
assertGeneratedMarkupCount('ml4-surgery',80);assertGeneratedMarkupCount('ml4-bonus',63);assertGeneratedMarkupCount('ml4-rollout',5);
const flat=n=>[n,...(n.childNodes||[]).flatMap(flat)],attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value;
const owners={'training/frontier-recipes':['mistral','mistral-serving','mistral-evidence'],'models/attention':['mistral-surgery'],'post-training/agents':['mistral-factory'],'post-training/rl':['mistral-update'],'post-training/distillation':['mistral-effort']};
for(const [slug,sections]of Object.entries(owners)){
 const html=renderDenseReader(slug,s=>{const [path,hash]=s.split('#');return '/atlas/'+path+'/'+(hash?'#'+hash:'');}),nodes=flat(parseFragment(html)),ids=nodes.map(n=>attr(n,'id')).filter(Boolean);assert.equal(ids.length,new Set(ids).size);
 for(const id of sections)assert(ids.includes(id),slug+'#'+id);
 assert(!html.includes('undefined'));assert(html.includes('technical_report.pdf'));
 assert.equal(readerMetas.find(x=>x.slug===slug).updated,'2026-11-03');
 assert(rank(readerMetas,'Mistral Large 4').some(x=>x.note.slug===slug));
 const added=sections.map(id=>html.slice(html.indexOf(`<section id="${id}"`)).split('</section>')[0]).join('');
 for(const node of flat(parseFragment(added))){const href=attr(node,'href');if(!href?.startsWith('/atlas/'))continue;const [path,anchor]=href.slice(7).split('#'),target=path.replace(/\/$/,'');assert(readerMetas.some(x=>x.slug===target),href);if(anchor)assert(renderDenseReader(target,s=>s).includes(`id="${anchor}"`),href);}
}
console.log(`Mistral: ${groups} independent length-bonus groups, ${states} guarded scene states, cache/index ownership, mixed-version lineage, group weights, five owning topics and section links pass.`);
