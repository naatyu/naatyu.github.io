import assert from 'node:assert/strict';
import {parseFragment} from 'parse5';
import {threadMap,sectorAccess,bankAccess,gemmState,pipelineSchedule,reductionState,matrixA,matrixB,accessPatterns,bankPatterns,gemmStrategies,tileTraversal,xorSwizzle,cachePatterns} from '../site/readers/cuda-model.js';
import {threadBody,sectorBody,bankBody,gemmBody,pipelineBody,reductionBody,cudaScenes,cacheBody,swizzleFigure} from '../site/readers/cuda-scenes.js';
import {cudaMeta,cudaSections,cudaReader} from '../site/readers/cuda.js';
import {readerMetas,renderDenseReader} from '../site/readers/index.js';
import {rank} from '../site/search.js';
import {assertGeneratedMarkup,assertGeneratedMarkupCount} from './check-generated-markup.mjs';
let mapping=0,states=0,schedules=0;
const check=html=>{assertGeneratedMarkup(html,'CUDA bounded states');assert(!/NaN|undefined|Infinity|\$\{/.test(html));states++;};
for(const n of [1,31,32,33,63,64,65,129,130,257,1024]){
 const valid=[];
 for(let b=0;b<Math.ceil(n/64);b++)for(let w=0;w<2;w++){
  const m=threadMap(n,b,w,0);assert.equal(m.activeBlocks.length,new Set(m.activeBlocks).size);
  for(const t of m.lanes){assert.equal(t.index,b*64+w*32+t.lane);assert.equal(t.valid,t.index<n);assert.equal(t.result,3*t.index);if(t.valid)valid.push(t.index);mapping++;}
  if([65,130,257,1024].includes(n))for(const lane of [0,1,2,31])check(threadBody(n,b,w,lane));
 }
 assert.deepEqual(valid,Array.from({length:n},(_,i)=>i));
}
assert.equal(threadMap(130,2,0,1).selected.index,129);assert(!threadMap(130,2,0,2).selected.valid);
for(const [p,expected]of Object.entries({contiguous:4,offset:5,strided:32,reversed:4})){
 const m=sectorAccess(p);assert.equal(m.sectors.length,expected);const sectors=new Set();
 for(const a of m.accesses)for(let byte=a.byte;byte<a.byte+4;byte++)sectors.add(Math.floor(byte/32));
 assert.deepEqual(m.sectors.map(s=>s.index),[...sectors].sort((a,b)=>a-b));assert.equal(m.bytes,32*sectors.size);
 assert.equal(m.efficiency,128/m.bytes);for(let lane=0;lane<32;lane++)check(sectorBody(p,lane));
}
assert.deepEqual(sectorAccess('contiguous').sectors,sectorAccess('reversed').sectors);
for(const [p,expected]of Object.entries({row:1,stride2:2,column:32,padded:1,broadcast:1})){
 const m=bankAccess(p);assert.equal(m.rounds,expected);
 const readers=m.banks.flatMap(b=>b.requests.flatMap(r=>r.lanes));assert.deepEqual(readers.sort((a,b)=>a-b),Array.from({length:32},(_,i)=>i));
 for(const b of m.banks){assert.equal(b.requests.length,new Set(b.requests.map(r=>r.word)).size);for(const r of b.requests)assert.equal(r.word%32,b.bank);}
 for(let r=0;r<=m.rounds;r++)check(bankBody(p,r));
}
assert.equal(bankAccess('broadcast').banks[0].requests[0].lanes.length,32);
const product=Array.from({length:4},(_,r)=>Array.from({length:4},(_,c)=>matrixA[r].reduce((s,a,k)=>s+a*matrixB[k][c],0)));
assert.deepEqual(product,[[11,13,8,8],[27,29,24,24],[43,45,40,40],[59,61,56,56]]);
for(const strategy of gemmStrategies)for(let stage=0;stage<=4;stage++){
 const m=gemmState(strategy,stage);for(let r=0;r<4;r++)for(let c=0;c<4;c++){
  const expected=r<m.tile&&c<m.tile?Array.from({length:m.processed},(_,k)=>matrixA[r][k]*matrixB[k][c]).reduce((a,b)=>a+b,0):null;assert.equal(m.partial[r][c],expected);
 }
 // Independently enumerate loads for all output blocks and K steps.
 let loads=0;for(let row=0;row<4;row+=m.tile)for(let col=0;col<4;col+=m.tile)for(let k=0;k<4;k++)loads+=2*m.tile;
 assert.equal(m.globalLoads,loads);assert.equal(m.threads*m.accumulators,m.tile*m.tile);check(gemmBody(strategy,stage));
}
for(let l=1;l<=6;l++)for(let c=1;c<=6;c++)for(let j=2;j<=6;j++){
 const m=pipelineSchedule(l,c,j);assert.equal(m.parallelEnd,l+c+(j-1)*Math.max(l,c));assert.equal(m.serialEnd,j*(l+c));assert(m.parallelEnd<=m.serialEnd);
 for(const [i,t]of m.parallel.entries()){
  assert.equal(t.slot,i%2);assert.equal(t.loadEnd-t.loadStart,l);assert.equal(t.computeEnd-t.computeStart,c);assert(t.computeStart>=t.loadEnd);
  if(i){assert(t.loadStart>=m.parallel[i-1].loadEnd);assert(t.computeStart>=m.parallel[i-1].computeEnd);}if(i>=2)assert(t.loadStart>=m.parallel[i-2].computeEnd);
 }
 for(let t=0;t<=m.serialEnd;t++)for(const slot of [0,1])assert(m.parallel.filter(x=>x.slot===slot&&x.loadStart<=t&&t<x.computeEnd).length<=1);
 for(const t of new Set([0,l,m.parallelEnd,m.serialEnd]))check(pipelineBody(l,c,j,t));schedules++;
}
for(let stage=0;stage<=5;stage++){
 const m=reductionState(stage);assert.equal(m.active,32/(2**stage));assert.equal(m.values.slice(0,m.active).reduce((a,b)=>a+b,0),528);
 for(let lane=0;lane<m.active;lane++){let expected=0;for(let source=lane;source<32;source+=m.active)expected+=source+1;assert.equal(m.values[lane],expected);}
 check(reductionBody(stage));
}
for(const fn of [()=>threadMap(0),()=>threadMap(130,3),()=>threadMap(130,0,2),()=>threadMap(130,0,0,32),()=>sectorAccess('bad'),()=>bankAccess('bad'),()=>gemmState('bad'),()=>gemmState('naive',5),()=>pipelineSchedule(0),()=>pipelineSchedule(1,1,1),()=>reductionState(6)])assert.throws(fn,RangeError);
for(const pattern of cachePatterns)for(const capacity of [2,4,6,8]){
 const m=tileTraversal(pattern,capacity),visited=new Set();let previousMisses=0;
 for(const [step,f]of m.frames.entries()){
  visited.add(`${f.row},${f.col}`);assert.equal(f.hits+f.misses,(step+1)*2);assert(f.cache.length<=capacity);assert.equal(f.cache.length,new Set(f.cache).size);assert(f.misses>=previousMisses);previousMisses=f.misses;
  check(cacheBody(pattern,capacity,step));
 }
 assert.equal(visited.size,16);assert.equal(m.hits+m.misses,32);assert(m.misses>=8);
 if(pattern==='hilbert')for(let i=1;i<m.order.length;i++)assert.equal(Math.abs(m.order[i][0]-m.order[i-1][0])+Math.abs(m.order[i][1]-m.order[i-1][1]),1);
}
assert.equal(tileTraversal('row-major',4).misses,20);assert.equal(tileTraversal('hilbert',4).misses,12);
const offsets=Array.from({length:1024},(_,i)=>xorSwizzle(i));assert.equal(new Set(offsets).size,1024);
for(let i=0;i<1024;i++){assert.equal(xorSwizzle(xorSwizzle(i)),i);assert.equal(xorSwizzle(i)%16,i%16);assert.equal(Math.floor(xorSwizzle(i)/128),Math.floor(i/128));}
const bankSet=new Set();for(let r=0;r<8;r++){const offset=r*128+3*16;assert.equal((offset/4)%32,12);bankSet.add((xorSwizzle(offset)/4)%32);}assert.equal(bankSet.size,8);
check(swizzleFigure());assertGeneratedMarkupCount('CUDA bounded states',states);
for(const h of Object.values(cudaScenes()))assertGeneratedMarkup(h,'CUDA static wrappers');assertGeneratedMarkupCount('CUDA static wrappers',8);
const html=assertGeneratedMarkup(cudaReader(s=>'/atlas/'+s),'CUDA reader'),ids=[...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]);
assert.equal(ids.length,new Set(ids).size);for(const [id]of cudaSections)assert(ids.includes(id));assert.equal(cudaSections.length,20);
assert.equal((html.match(/data-cuda-lab=/g)||[]).length,7);assert.equal((html.match(/typeset-equation/g)||[]).length,5);
assert.equal(renderDenseReader(cudaMeta.slug,s=>s),cudaReader(s=>s));assert.equal(cudaMeta.date,'2026-10-30');assert.equal(cudaMeta.visibility,'public');assert.equal(cudaMeta.prototype,false);
for(const related of cudaMeta.related)assert(readerMetas.some(m=>m.slug===related));for(const q of ['CUDA programming','bank conflicts','coalescing','Tensor Cores'])assert(rank(readerMetas,q).some(r=>r.note===cudaMeta));
// Static parsing also catches empty image surfaces and text swallowed by HTML.
const walk=n=>[n,...(n.childNodes||[]).flatMap(walk)];const nodes=walk(parseFragment(html));assert.equal(nodes.filter(n=>n.tagName==='svg'&&n.attrs?.some(a=>a.name==='class'&&a.value==='cuda-svg')).length,6);assert.equal(nodes.filter(n=>n.tagName==='math').length,5);
assert(html.includes('They do not execute CUDA.')&&html.includes('not GPU-validated benchmark artifacts'));
console.log(`CUDA: ${mapping} lane mappings, ${states} rendered bounded states, ${schedules} two-buffer schedules, independent products/reductions/banks/sectors, registry and search pass.`);
