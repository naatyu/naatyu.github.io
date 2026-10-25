import assert from 'node:assert/strict';
import {mergeSortTrace} from '../site/readers/sorting-model.js';
let arrays=0,states=0;
for(let n=0;n<=7;n++)for(let code=0;code<3**n;code++){
  let k=code;const values=Array.from({length:n},()=>{const v=k%3-1;k=Math.floor(k/3);return v;}),before=[...values],frames=mergeSortTrace(values);
  const stable=values.map((value,id)=>({value,id})).sort((a,b)=>a.value-b.value||a.id-b.id);
  assert.deepEqual(frames.at(-1).runs.flat(),stable);assert.deepEqual(values,before);
  for(const f of frames){
    const all=[...f.runs.flat(),...f.output];assert.equal(all.length,n);assert.deepEqual(all.map(r=>r.id).sort((a,b)=>a-b),Array.from({length:n},(_,i)=>i));assert(all.every(r=>r.value===values[r.id]));
    if(f.pair!==null){assert.equal(f.pair+1<f.runs.length,true);assert(f.output.every((r,i)=>!i||f.output[i-1].value<=r.value));}
    if(!['initial','split'].includes(f.stage))for(const run of f.runs)assert(run.every((r,i)=>!i||run[i-1].value<=r.value));
    states++;
  }
  arrays++;
}
const exact=mergeSortTrace([6,5,3,1,8,7,2,4]);
assert.deepEqual(exact.filter(f=>f.stage==='split').map(f=>f.runs.map(r=>r.map(x=>x.value))),[[[6,5,3,1],[8,7,2,4]],[[6,5],[3,1],[8,7],[2,4]],[[6],[5],[3],[1],[8],[7],[2],[4]]]);
assert.deepEqual(exact.filter(f=>f.stage==='round').map(f=>f.runs.map(r=>r.map(x=>x.value))),[[[5,6],[1,3],[7,8],[2,4]],[[1,3,5,6],[2,4,7,8]],[[1,2,3,4,5,6,7,8]]]);
assert.throws(()=>mergeSortTrace([NaN]));assert.throws(()=>mergeSortTrace([Infinity]));assert.throws(()=>mergeSortTrace('array'));
console.log(`Merge-sort trace: ${arrays} arrays/${states} states; occurrence conservation, sorted outputs, stable ties, caller ownership and all six source split/merge levels pass.`);
