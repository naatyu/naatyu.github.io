import assert from 'node:assert/strict';
import {insertionTrace} from '../site/readers/sorting-model.js';
let cases=0,states=0;
for(let n=0;n<=7;n++)for(let code=0;code<3**n;code++){
  let x=code;const input=Array.from({length:n},()=>{const v=x%3-1;x=Math.floor(x/3);return v;}),before=[...input],frames=insertionTrace(input);
  for(const f of frames){
    states++;const placed=f.records.filter(Boolean),all=[...placed,...(f.held?[f.held]:[])];
    assert.equal(all.length,n);assert.equal(new Set(all.map(r=>r.id)).size,n);
    for(const r of all)assert.equal(r.value,input[r.id]);
    assert.equal(f.records.filter(r=>r===null).length,f.held?1:0);
    if(f.held)assert.equal(f.records[f.gap],null);
    const prefix=f.records.slice(0,f.sortedLength).filter(Boolean);
    for(let i=1;i<prefix.length;i++)assert(prefix[i-1].value<=prefix[i].value);
    for(let i=1;i<placed.length;i++)if(placed[i-1].value===placed[i].value)assert(placed[i-1].id<placed[i].id);
  }
  assert.deepEqual(frames.at(-1).values,[...input].sort((a,b)=>a-b));assert.deepEqual(input,before);cases++;
}
const sample=insertionTrace([6,5,3,1,8,7,2,4]);
assert.deepEqual(sample.filter(f=>f.stage==='place').map(f=>f.values.slice(0,f.sortedLength)),[[5,6],[3,5,6],[1,3,5,6],[1,3,5,6,8],[1,3,5,6,7,8],[1,2,3,5,6,7,8],[1,2,3,4,5,6,7,8]]);
for(const invalid of [null,[NaN],[Infinity],['1']])assert.throws(()=>insertionTrace(invalid));
console.log(`Insertion trace: ${cases} arrays/${states} states preserve identity,held+gap conservation,sorted prefixes,stable ties and the original seven placements.`);
