import assert from 'node:assert/strict';
import {parseFragment} from 'parse5';
import {collectiveTrace,patterns} from '../site/readers/collectives-model.js';
import {collectiveSceneBody,collectiveScene} from '../site/readers/collectives-scenes.js';
import {collectivesMeta,collectivesSections,collectivesReader} from '../site/readers/collectives.js';
import {readerMetas,renderDenseReader} from '../site/readers/index.js';
import {rank} from '../site/search.js';
import {assertGeneratedMarkup,assertGeneratedMarkupCount} from './check-generated-markup.mjs';
const values=rows=>rows.map(row=>row.map(b=>b?.value??null));
const expected={broadcast:Array(4).fill([1,2,3,4]),reduce:[[28,32,36,40],[],[],[]],allreduce:Array(4).fill([28,32,36,40]),allgather:Array(4).fill([1,6,11,16]),reducescatter:[[28],[32],[36],[40]],alltoall:[[1,5,9,13],[2,6,10,14],[3,7,11,15],[4,8,12,16]],'send-receive':[[1,2,3,4],[1,2,3,4],[],[]]};
let states=0;
for(const pattern of patterns){
 const trace=collectiveTrace(pattern);
 assert.deepEqual(values(trace.result),expected[pattern],pattern+' independent endpoint');
 for(const [i,f]of trace.frames.entries()){
  const html=assertGeneratedMarkup(collectiveSceneBody(trace,i),'collectives states');states++;
  assert(!/NaN|undefined|Infinity|\$\{/.test(html));
  const doc=parseFragment(html);assert(doc.childNodes.length>0);
  if(f.phase==='sending'){
   assert.deepEqual(f.outputs,trace.frames[i-1].outputs,'Sending cannot update the receiver');
   assert.notEqual(f.transfer.from,f.transfer.to,'Local pieces must not become network sends');
   assert(html.includes(`Sender</small><strong>Rank ${f.transfer.from}`));
   assert(html.includes(`Receiver</small><strong>Rank ${f.transfer.to}`));
  }
  if(f.phase==='received'){
   const prev=trace.frames[i-1],t=f.transfer;assert.equal(prev.phase,'sending');
   for(let r=0;r<4;r++)if(r!==t.to)assert.deepEqual(f.outputs[r],prev.outputs[r],'Only receiver changes');
   for(const [k,j]of t.slots.entries()){
    const old=prev.outputs[t.to][j],b=f.outputs[t.to][j],incoming=t.payload[k];
    assert.equal(b.value,t.mode==='sum'?old.value+incoming.value:incoming.value);
    assert.deepEqual(b.sources,t.mode==='sum'?[...old.sources,...incoming.sources].sort():incoming.sources);
   }
  }
  for(const row of f.outputs)for(const b of row.filter(Boolean)){
   assert.equal(new Set(b.sources).size,b.sources.length,'No contribution may be counted twice');
   if(b.sources.length>1){const j=Number(b.label.slice(1));assert.equal(b.value,b.sources.reduce((s,r)=>s+trace.inputs[r][j].value,0),'Independent partial sum');}
  }
 }
 if(pattern==='alltoall')assert.equal(new Set(trace.result.flat().map(b=>b.label)).size,16,'Every addressed block has exactly one output owner');
 if(['reduce','allreduce','reducescatter'].includes(pattern))for(const b of trace.result.flat())assert.deepEqual(b.sources,[0,1,2,3]);
 assertGeneratedMarkup(collectiveScene(pattern,pattern),'collective wrappers');
 assert.throws(()=>collectiveSceneBody(trace,-1),RangeError);
}
assertGeneratedMarkupCount('collectives states',states);assertGeneratedMarkupCount('collective wrappers',7);
assert.throws(()=>collectiveTrace('bad'),RangeError);
const html=assertGeneratedMarkup(collectivesReader(s=>'/atlas/'+s+'/'),'collectives reader');
const ids=[...html.matchAll(/ id="([^"]+)"/g)].map(x=>x[1]);assert.equal(ids.length,new Set(ids).size);
for(const[id]of collectivesSections)assert(ids.includes(id));
assert.equal((html.match(/data-collective=/g)||[]).length,7);
assert.equal(renderDenseReader(collectivesMeta.slug,s=>s),collectivesReader(s=>s));
for(const [,target]of html.matchAll(/href="\/atlas\/([^"#]+?)(?:#[^"]*)?\/"/g))assert(readerMetas.some(m=>m.slug===target),target);
for(const q of ['AllToAll','ReduceScatter','communication patterns'])assert(rank(readerMetas,q).some(r=>r.note===collectivesMeta));
// Verify the actual FSDP worked table against the independently checked trace.
const walk=n=>[n,...(n.childNodes||[]).flatMap(walk)];
const prose=n=>n.nodeName==='#text'?n.value:(n.childNodes||[]).map(prose).join('');
const tables=walk(parseFragment(html)).filter(n=>n.tagName==='table');
const fsdpTable=tables.find(n=>prose(n).includes('One FSDP optimizer step'));
assert(fsdpTable);
const rows=walk(fsdpTable).filter(n=>n.tagName==='tr').slice(1);
const reduced=collectiveTrace('reducescatter').result;
assert.equal(rows.length,4);
for(const [r,row]of rows.entries()){
 const cells=row.childNodes.filter(n=>n.tagName==='td').map(prose);
 const sum=reduced[r][0].value,mean=sum/4,weight=(r+1)*10;
 assert.deepEqual(cells,[`Rank ${r}`,`w${r} = ${weight}`,String(sum),String(mean),(weight-0.1*mean).toFixed(1)]);
}
assert(html.includes('The synchronized gradients remain sharded.'));
assert.equal(collectivesMeta.date,'2026-10-27');assert.equal(collectivesMeta.visibility,'public');assert.equal(collectivesMeta.prototype,false);
console.log(`Collectives: ${states} exact intermediate states, seven contracts, source provenance, ownership, markup, registry and search pass.`);
