import assert from 'node:assert/strict';
import {parseFragment} from 'parse5';
import {packingBudget,icepopMask} from '../site/readers/training-methods-model.js';
import {renderDenseReader,readerMetas} from '../site/readers/index.js';
import {rank} from '../site/search.js';
import {assertGeneratedMarkup,assertGeneratedMarkupCount} from './check-generated-markup.mjs';
const padded=packingBudget(),packed=packingBudget({examplesPerSequence:4}),matched=packingBudget({examplesPerSequence:4,sequencesPerUpdate:2});
assert.deepEqual(padded,{sequences:1024,updates:128,tokens:131072,slots:524288,fullUpdateTokens:1024});
assert.deepEqual(packed,{sequences:256,updates:32,tokens:131072,slots:131072,fullUpdateTokens:4096});
assert.equal(matched.updates,padded.updates);assert.equal(matched.fullUpdateTokens,padded.fullUpdateTokens);
for(let examples=1;examples<=65;examples++)for(let factor=1;factor<=4;factor++){
 const b=packingBudget({examples,examplesPerSequence:factor});
 assert.equal(b.tokens,examples*128);assert(b.slots>=b.tokens);
 assert(b.sequences*factor>=examples);assert((b.sequences-1)*factor<examples);
 assert(b.updates*8>=b.sequences);assert((b.updates-1)*8<b.sequences);
}
for(const args of [{examples:0},{examples:1.5},{sequencesPerUpdate:NaN},{examplesPerSequence:5},{sequenceLength:Infinity},{examples:Number.MAX_SAFE_INTEGER}])assert.throws(()=>packingBudget(args),RangeError);
for(const [r,w]of [[0,0],[.4,0],[.5,.5],[1,1],[5,5],[6,0]])assert.equal(icepopMask(r),w);
for(const r of [-1,NaN,Infinity])assert.throws(()=>icepopMask(r),RangeError);
assert.throws(()=>icepopMask(1,0),RangeError);assert.throws(()=>icepopMask(1,2,1),RangeError);
const expected={
 'post-training/sft':['packing-budget'],
 'post-training/rl':['intellect-icepop'],
 'post-training/agents':['tool-factory-evidence'],
 'training/practice':['silent-failures','experiment-card']
};
const flat=n=>[n,...(n.childNodes||[]).flatMap(flat)];
const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value;
for(const [slug,anchors]of Object.entries(expected)){
 const html=assertGeneratedMarkup(renderDenseReader(slug,s=>'/atlas/'+s+'/'),'training-methods');
 const nodes=flat(parseFragment(html));
 for(const id of anchors){
  const node=nodes.find(n=>attr(n,'id')===id);assert(node,id);
  for(const wrapper of flat(node).filter(n=>attr(n,'class')?.includes('dense-table-wrap'))){
   assert.equal(attr(wrapper,'tabindex'),'0');assert.equal(attr(wrapper,'role'),'region');assert(attr(wrapper,'aria-label'));
  }
 }
 const meta=readerMetas.find(m=>m.slug===slug);assert.equal(meta.updated,'2026-11-01');
 for(const [,target,anchor]of html.matchAll(/href="\/atlas\/([^"#]+)\/#([^" ]+)"/g))
  assert(renderDenseReader(target,()=> '')?.includes(`id="${anchor}"`),target+'#'+anchor);
}
assertGeneratedMarkupCount('training-methods',4);
for(const [query,slug]of [['IcePop','post-training/rl'],['packing','post-training/sft'],['shared-memory','training/practice'],['tool coverage','post-training/agents']])
 assert(rank(readerMetas,query).some(r=>r.note.slug===slug),query+' must find '+slug);
console.log('Training methods: packing budgets, tail-mask boundaries, five section destinations, markup, links and dates pass.');
