import {assertGeneratedMarkup,assertGeneratedMarkupCount} from './check-generated-markup.mjs';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import GithubSlugger from 'github-slugger';
import {resolveReviewedNote,reviewedFragments} from '../prototypes/reviewed-navigation.js';
import {binaryEntropy,discoveryStage,discoveryExperiment} from '../prototypes/readers/discovery-model.js';
import {discoveryLoopBody,discoveryExperimentBody} from '../prototypes/readers/discovery-scenes.js';
import {discoveryMeta,discoverySections,discoveryReader,discoveryAliases} from '../prototypes/readers/discovery.js';
import {readerMetas,renderDenseReader} from '../prototypes/readers/index.js';
import {rank} from '../prototypes/search.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,[a,b]);
const entropy=p=>p===0||p===1?0:Math.log2(1/(p**p*(1-p)**(1-p)));
let cases=0,states=0;
for(const experiment of ['observe','do0','do1'])for(let percent=10;percent<=90;percent++)for(const outcome of [0,1]){
 const prior=percent/100,m=discoveryExperiment(experiment,outcome,prior);
 const pA=experiment==='do0'?.1:.9,pB=experiment==='observe'?.9:.5;
 const jointA=prior*(outcome?pA:1-pA),jointB=(1-prior)*(outcome?pB:1-pB);
 near(m.posterior,jointA/(jointA+jointB));near(m.predictive,jointA+jointB);
 const q=prior*pA+(1-prior)*pB;
 const after1=prior*pA/q,after0=prior*(1-pA)/(1-q);
 near(q*after1+(1-q)*after0,prior);
 near(m.expectedGain,entropy(prior)-q*entropy(after1)-(1-q)*entropy(after0));
 assert.ok(m.expectedGain>=-1e-12);near(m.priorEntropy,entropy(prior));near(m.posteriorEntropy,entropy(m.posterior));
 if(experiment==='observe'){near(m.posterior,prior);near(m.expectedGain,0);}
 const html=discoveryExperimentBody(experiment,outcome,percent);assertGeneratedMarkup(html,"test-discovery.mjs");assert.ok(!/NaN|undefined/.test(html));assert.ok(html.includes('not paper measurements'));cases++;states++;
}
for(let step=0;step<6;step++){assert.equal(discoveryStage(step).step,step);const html=discoveryLoopBody(step);assertGeneratedMarkup(html,"test-discovery.mjs");assert.equal((html.match(/aria-current="step"/g)||[]).length,1);assert.ok(!/NaN|undefined/.test(html));cases++;states++;}
for(const p of [0,1]){near(binaryEntropy(p),0);for(const test of ['observe','do0','do1'])for(const y of [0,1]){near(discoveryExperiment(test,y,p).posterior,p);near(discoveryExperiment(test,y,p).expectedGain,0);cases++;}}
near(discoveryExperiment('do1',1).posterior,9/14);
for(const fn of [()=>binaryEntropy(NaN),()=>binaryEntropy(-.1),()=>discoveryStage(6),()=>discoveryStage(.5),()=>discoveryExperiment('invalid',1),()=>discoveryExperiment('do1',2),()=>discoveryExperiment('do0',1,1.1)])assert.throws(fn,RangeError);
const html=discoveryReader(s=>'directions.html?slug='+s),ids=[...html.matchAll(/ id="([^"]+)"/g)].map(x=>x[1]);assert.equal(ids.length,new Set(ids).size);assert.equal(discoverySections.length,18);for(const[id]of discoverySections)assert.ok(ids.includes(id));
assert.equal(discoveryMeta.date,'2026-08-04');assert.ok(discoveryMeta.prototype);assert.equal(discoveryMeta.visibility,'public');assert.deepEqual(discoveryAliases,['ai/foundations/llms-cant-jump-abduction-and-scientific-invention']);assert.equal(renderDenseReader(discoveryMeta.slug,s=>s),discoveryReader(s=>s));
assert.equal((html.match(/data-discovery-lab=/g)||[]).length,2);
for(const text of ['Vulcan','Mercury','inertial','weak-field','conservation','manipulative abduction','tidal','compression','latent','checker','two to five','grounding','prospective','cannot','gradient','not a facsimile','independently'])assert.ok(html.toLowerCase().includes(text.toLowerCase()),text);
const catalog=JSON.parse(await readFile(new URL('../prototypes/catalog.json',import.meta.url),'utf8')),notes=[...readerMetas,...catalog.notes];for(const[,slug]of html.matchAll(/href="directions\.html\?slug=([^"#]+)"/g))assert.ok(notes.some(n=>n.slug===slug),slug);
for(const q of ['abduction','scientific discovery','causal intervention','Einstein'])assert.ok(rank(notes,q).some(r=>r.note===discoveryMeta),q);
const original=await readFile(new URL('../../docs/ai/foundations/llms-cant-jump-abduction-and-scientific-invention.md',import.meta.url));assert.equal(createHash('sha256').update(original).digest('hex'),'ca375b51af6159154cc1be3f7277387074e6be34d498797f1c2eea34d31cd0a3');
assert.deepEqual(original,execFileSync('git',['show','HEAD:docs/ai/foundations/llms-cant-jump-abduction-and-scientific-invention.md'],{cwd:new URL('../../',import.meta.url)}));
const oldSlug=discoveryAliases[0],slugger=new GithubSlugger();
const oldHeadings=[...original.toString().matchAll(/^#{2,3} (.+)$/gm)].map(m=>slugger.slug(m[1]));
assert.equal(oldHeadings.length,16);assert.deepEqual(Object.keys(reviewedFragments[oldSlug]),oldHeadings);
for(const heading of oldHeadings){const target=resolveReviewedNote(oldSlug+'#'+heading);assert.equal(target.slug,discoveryMeta.slug);assert.ok(ids.includes(target.anchor),heading);}
assert.equal(resolveReviewedNote(oldSlug).anchor,'question');
for(const text of ['Geodesic free motion','Stress-energy as a source','General covariance','Computational analogue','not a sufficient recipe','interface sketch, not a runnable'])assert.ok(html.includes(text),text);
assert.ok(!html.includes('Migrated from'));assert.ok(!html.includes('.9/(.9+.5)'));
assert.equal((html.match(/<math /g)||[]).length,2);assert.ok(!html.includes('katex-error'));
assert.equal((html.match(/<table style="min-width:640px">/g)||[]).length,4);
assert.ok(html.includes('<pre tabindex="0" role="region" aria-label="Scientific workflow interface sketch">'));
const words=html.replace(/<[^>]*>/g,' ').split(/\s+/).length;
assertGeneratedMarkupCount("test-discovery.mjs",states);
console.log('Scientific discovery: '+cases+' independent cases, '+states+' rendered states, 18 sections; preserved original, search and links pass; '+words+' words.');
