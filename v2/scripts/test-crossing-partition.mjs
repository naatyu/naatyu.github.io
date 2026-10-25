import assert from 'node:assert/strict';
import {crossingPartitionTrace} from '../site/readers/sorting-model.js';
const sorted=a=>[...a].sort((a,b)=>a-b);
let cases=0,states=0;
// Independently execute the end-pivot procedure described in the reader.
function endPivot(a,p){a=[...a];const hi=a.length-1,pivot=a[p];[a[p],a[hi]]=[a[hi],a[p]];let i=0,j=hi-1;while(i<=j){while(i<=j&&a[i]<=pivot)i++;while(i<=j&&a[j]>pivot)j--;if(i<=j){[a[i],a[j]]=[a[j],a[i]];i++;j--;}}assert.equal(i,j+1);[a[i],a[hi]]=[a[hi],a[i]];return{a,i,pivot};}
function recursiveSort(a){if(a.length<2)return [...a];const f=crossingPartitionTrace(a).at(-1),p=f.rank;return [...recursiveSort(f.values.slice(0,p)),f.pivot,...recursiveSort(f.values.slice(p+1))];}
for(let n=0;n<=7;n++)for(let code=0;code<3**n;code++){
  let c=code;const a=Array.from({length:n},()=>{const v=c%3-1;c=Math.floor(c/3);return v;}),before=[...a],fs=crossingPartitionTrace(a),ref=sorted(a);cases++;
  for(const f of fs){states++;assert.deepEqual(sorted(f.values),ref);if(!['initial','choose'].includes(f.stage)&&f.pivot!==null){assert.equal(f.values[f.pivotIndex],f.pivot);if(f.stage!=='done'){assert(f.values.slice(1,Math.min(f.i,n)).every(v=>v<=f.pivot));assert(f.values.slice(Math.max(f.j+1,1)).every(v=>v>=f.pivot));}}}
  const f=fs.at(-1);if(n){assert(Number.isInteger(f.rank)&&f.rank>=0&&f.rank<n);assert.equal(ref[f.rank],f.pivot);assert(f.values.slice(0,f.rank).every(v=>v<=f.pivot));assert(f.values.slice(f.rank+1).every(v=>v>=f.pivot));}else assert.equal(f.rank,null);
  assert.deepEqual(recursiveSort(a),ref);assert.deepEqual(a,before);assert(fs.length<=8*n+6);
  for(let p=0;p<n;p++){const e=endPivot(a,p);assert.deepEqual(sorted(e.a),ref);assert.equal(ref[e.i],e.pivot);assert(e.a.slice(0,e.i).every(v=>v<=e.pivot));assert(e.a.slice(e.i+1).every(v=>v>e.pivot));}
}
const fs=crossingPartitionTrace([4,1,7,3,2,5,8,6]);
assert.equal(fs.find(f=>f.stage==='choose').pivot,4);
assert.deepEqual(fs.find(f=>f.stage==='swap').values,[4,1,2,3,7,5,8,6]);
assert.deepEqual([fs.at(-2).i,fs.at(-2).j],[4,3]);
assert.deepEqual(fs.at(-1).values,[3,1,2,4,7,5,8,6]);assert.equal(fs.at(-1).rank,3);
for(const a of [[NaN],[Infinity],[-Infinity],null])assert.throws(()=>crossingPartitionTrace(a));
console.log(`Crossing partition: ${cases} arrays/${states} states; multisets, classified sides, final rank, recursive whole-sort reference, ties, caller ownership; exact source ${fs.length} states.`);
