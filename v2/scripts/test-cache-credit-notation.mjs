import assert from 'node:assert/strict';
import {parseFragment} from 'parse5';
import {compactReader,compactMeta} from '../site/readers/compact.js';
import {servingReader,servingMeta} from '../site/readers/serving.js';
import {agentsReader,agentsMeta} from '../site/readers/agents.js';
import {globalCacheRatio} from '../site/readers/compact-model.js';
import {redistributeGroup,localCredit} from '../site/readers/agents-model.js';
import {assertGeneratedMarkup} from './check-generated-markup.mjs';
const text=n=>(n.value||'')+(n.childNodes||[]).map(text).join('');
function parsed(f){
 const html=assertGeneratedMarkup(f(s=>'/atlas/'+s)),nodes=[];
 function walk(n){nodes.push(n);for(const c of n.childNodes||[])walk(c);}walk(parseFragment(html));
 return {html,nodes,prose:text(parseFragment(html)),annotations:nodes.filter(n=>n.tagName==='annotation').map(text)};
}
const compact=parsed(compactReader),serving=parsed(servingReader),agents=parsed(agentsReader);
for(const[r,total,inline]of[[compact,18,11],[serving,23,10],[agents,18,4]]){
 assert.equal(r.nodes.filter(n=>n.tagName==='math').length,total);
 assert.equal((r.html.match(/class="inline-math"/g)||[]).length,inline);
 assert(!r.prose.includes('inlineMath(String.raw'));
}
for(const a of [String.raw`\frac{23\times10^{12}}{3\times10^9}\approx7{,}667`,'p=0.25','2d','d+pd','d>0',String.raw`p\in[0,1]`,'K=V',String.raw`\frac{20}{35}`,String.raw`\frac{18}{42}`])assert(compact.annotations.includes(a),a);
for(const a of ['q_w=2',String.raw`\frac CW`,'V=K','p=0.25','2d','d+pd=1.25d',String.raw`\frac{20}{35}`,String.raw`\frac{18}{42}`])assert(serving.annotations.includes(a),a);
for(const a of [String.raw`\lambda=\frac53`,String.raw`\left[\frac16,\frac56,-0.5,-0.5\right]`,String.raw`\frac13`,String.raw`\kappa=2`])assert(agents.annotations.includes(a),a);
for(const condition of ['not a measured runtime allocation','96 entries are removed','not total runtime memory','Do not apply the larger models'])assert(compact.prose.includes(condition),condition);
for(const condition of ['not total model memory','not a universal economic optimum','Shared storage need not remove repeated reads'])assert(serving.prose.includes(condition),condition);
for(const condition of ['uniform groups need a separate zero-contrast branch','not generally restore the original positive budget','no clean recipient','not a causal proof'])assert(agents.prose.includes(condition),condition);
assert(serving.html.includes('href="/atlas/models/compact-recipes#gemma-cache"'));
const table=compact.nodes.find(n=>n.tagName==='table'&&n.childNodes.some(c=>c.tagName==='caption'&&text(c)==='Illustrative global-cache payload per head and token'));
assert(table);const cells=[];
function collect(n){if(n.tagName==='td')cells.push(text(n));for(const c of n.childNodes||[])collect(c);}collect(table);
assert.deepEqual(cells,['Separate key and value','256','128 key + 128 value','Shared unrotated key/value','128','One shared unrotated representation','Additional rotated key slice','32','Position-dependent quarter of the key']);
// Enumerate feature slots independently; the source formula assumes a common element size.
let cases=0;
for(const d of [4,8,16,32,64,128])for(let rotary=0;rotary<=d;rotary++){
 const separate=Array.from({length:d},(_,i)=>'K'+i).concat(Array.from({length:d},(_,i)=>'V'+i));
 const shared=Array.from({length:d},(_,i)=>'KV'+i).concat(Array.from({length:rotary},(_,i)=>'R'+i));
 const m=globalCacheRatio(rotary/d);
 assert.equal(m.ratio,shared.length/separate.length);
 assert.equal(m.saved,(separate.length-shared.length)/separate.length);cases++;
}
assert.equal(globalCacheRatio(.25).shared*128,160);
assert.equal(256-160,96);assert.equal(96/256,.375);
const group=redistributeGroup([1,1,0,0],[.2,1,1,1]);
assert.equal(group.rawLambda,5/3);
for(const[i,x]of[1/6,5/6,-.5,-.5].entries())assert(Math.abs(group.final[i]-x)<1e-12);
assert.deepEqual(localCredit(1,[true,false,false,false]).weights,[0,1/3,1/3,1/3]);
assert.deepEqual(localCredit(-1,[true,false,false,false],2).weights,[-.4,-.2,-.2,-.2]);
assert.equal(localCredit(1,[true,true]).unallocated,1);
assert.equal(compactMeta.date,'2026-04-20');assert.equal(servingMeta.date,'2026-04-08');assert.equal(agentsMeta.date,'2026-07-25');
console.log('Cache/credit notation:23 inline additions across three readers,exact parsed conditions/table,canonical owner link,'+cases+' enumerated cache layouts and exact credit examples pass;not measured allocation or training evidence.');
