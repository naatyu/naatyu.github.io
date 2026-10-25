import assert from 'node:assert/strict';
import './test-ordering-preservation.mjs';
import './test-insertion-trace.mjs';
import './test-merge-sort-trace.mjs';
import './test-crossing-partition.mjs';
import {readFile} from 'node:fs/promises';
import {BinaryHeap,topKTrace,threeWaySelectTrace,mergeStreamsTrace,medianTrace} from '../site/readers/ordering-model.js';
import {orderingMeta,orderingReader,orderingSections} from '../site/readers/ordering.js';
import {readerMetas,readerAliases,renderDenseReader} from '../site/readers/index.js';
import {rank} from '../site/search.js';
import {reviewedNavigation,reviewedFragments,resolveReviewedNote} from '../site/reviewed-navigation.js';
const preservedOrdering=orderingReader(s=>s);for(const[source,anchor,count]of [['algorithms/data-structures/heap','heap',12],['algorithms/data-structures/priority-queues','priority',11]]){assert.deepEqual(reviewedNavigation[source],{slug:'algorithms/ordering',anchor});assert.equal(Object.keys(reviewedFragments[source]).length,count);for(const[heading,destination]of Object.entries(reviewedFragments[source])){assert.ok(preservedOrdering.includes('id="'+destination+'"'));assert.deepEqual(resolveReviewedNote(source+'#'+heading),{slug:'algorithms/ordering',anchor:destination});}assert.ok(!preservedOrdering.includes(source));}for(const term of ['max_heap = [-x for x in values]','task-b','urgent','arrival counter'])assert.ok(preservedOrdering.includes(term),term);
const sorted=a=>[...a].sort((a,b)=>a-b),isHeap=(a,compare=(a,b)=>a-b)=>a.every((v,i)=>i===0||compare(a[Math.floor((i-1)/2)],v)<=0);
let arrayCases=0,selectionCases=0,topCases=0,medianPrefixes=0;
for(let n=0;n<=7;n++)for(let code=0;code<3**n;code++){
  arrayCases++;let c=code;const input=Array.from({length:n},()=>{const x=c%3-1;c=Math.floor(c/3);return x;}),before=JSON.stringify(input),order=sorted(input);
  for(const compare of [(a,b)=>a-b,(a,b)=>b-a]){const heap=new BinaryHeap(compare);for(const v of input){heap.push(v);assert(isHeap(heap.values,compare));}const result=[];while(heap.size){result.push(heap.pop());assert(isHeap(heap.values,compare));}assert.deepEqual(result,[...input].sort(compare));assert.throws(()=>heap.pop());}
  for(let k=0;k<=n;k++){topCases++;const fs=topKTrace(input,k);for(const f of fs){assert(isHeap(f.heap));assert(f.heap.length<=k);const ref=sorted(input.slice(0,f.processed));assert.deepEqual(sorted(f.heap),k===0?[]:ref.slice(-k));}}
  for(let k=0;k<n;k++){selectionCases++;const fs=threeWaySelectTrace(input,k);assert.equal(fs.at(-1).answer,order[k]);let width=n+1;
    for(const f of fs){assert.deepEqual(sorted(f.values),order);assert(f.lo<=k&&k<=f.hi);if(f.event==='pivot'){assert(f.hi-f.lo+1<width);width=f.hi-f.lo+1;}if(f.pivot!==null){assert(f.values.slice(f.lo,f.lt).every(x=>x<f.pivot));assert(f.values.slice(f.lt,f.i).every(x=>x===f.pivot));assert(f.values.slice(f.gt+1,f.hi+1).every(x=>x>f.pivot));assert(f.lo<=f.lt&&f.lt<=f.i&&f.i<=f.gt+1&&f.gt+1<=f.hi+1);}}
  }
  for(const f of medianTrace(input)){
    assert(isHeap(f.lower,(a,b)=>b-a));assert(isHeap(f.upper));assert.deepEqual(sorted([...f.lower,...f.upper]),sorted(input.slice(0,f.count)));assert(!f.lower.length||!f.upper.length||Math.max(...f.lower)<=Math.min(...f.upper));
    if(f.stage==='balanced'){medianPrefixes++;assert(f.lower.length===f.upper.length||f.lower.length===f.upper.length+1);const a=sorted(input.slice(0,f.count)),expected=a.length?(a.length%2?a[Math.floor(a.length/2)]:(a[a.length/2-1]+a[a.length/2])/2):null;assert.equal(f.median,expected);}else assert.equal(f.median,null);
  }assert.equal(JSON.stringify(input),before);
}
const sources=[[],[-1],[0],[1],[-1,0],[0,0],[0,1],[-1,0,1]];let mergeCases=0;
for(const a of sources)for(const b of sources)for(const c of sources){mergeCases++;const streams=[a,b,c],before=JSON.stringify(streams),fs=mergeStreamsTrace(streams),expected=sorted(streams.flat());assert.deepEqual(fs.at(-1).output,expected);
  for(const f of fs){assert(isHeap(f.heap,(a,b)=>a.value-b.value||a.source-b.source||a.index-b.index));assert.deepEqual(f.output,expected.slice(0,f.output.length));assert.equal(new Set(f.heap.map(x=>x.source)).size,f.heap.length);for(let i=0;i<streams.length;i++){const items=f.heap.filter(x=>x.source===i);if(f.positions[i]<streams[i].length){assert.equal(items.length,1);assert.equal(items[0].index,f.positions[i]);assert.equal(items[0].value,streams[i][f.positions[i]]);}else assert.equal(items.length,0);}assert.equal(f.positions.reduce((a,b)=>a+b,0),f.output.length);}assert.equal(JSON.stringify(streams),before);
}
assert.throws(()=>topKTrace([1],2));assert.throws(()=>threeWaySelectTrace([],0));assert.throws(()=>threeWaySelectTrace([NaN],0));assert.throws(()=>mergeStreamsTrace([[2,1]]));
const link=s=>'directions.html?slug='+s,html=orderingReader(link),ids=[...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);for(const [id]of orderingSections)assert(ids.includes(id));assert(renderDenseReader(orderingMeta.slug,link));
const catalog=JSON.parse(await readFile(new URL('../site/catalog.json',import.meta.url),'utf8')),notes=[...readerMetas,...catalog.notes.filter(n=>!readerAliases.includes(n.slug))];
for(const [,slug,anchor]of html.matchAll(/href="directions\.html\?slug=([^"#]+)(?:#([^"]+))?"/g)){assert(notes.some(n=>n.slug===slug),slug);if(anchor)assert(renderDenseReader(slug,link)?.includes(`id="${anchor}"`),slug+'#'+anchor);}
for(const q of ['quickselect','priority queue','top k','median','k-way merge'])assert(rank(notes,q).some(r=>r.note===orderingMeta),q);
console.log(`Ordering: ${arrayCases} min/max heap inputs; ${topCases} top-k capacities; ${selectionCases} ranks with every partition and shrink invariant; ${medianPrefixes} balanced median prefixes; ${mergeCases} frontiers with exact source coverage; anchors, links and search pass.`);
