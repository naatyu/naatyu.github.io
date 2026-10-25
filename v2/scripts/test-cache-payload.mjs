import assert from 'node:assert/strict';
import {kvCacheAccounting} from '../prototypes/readers/performance-model.js';
import {performanceReader} from '../prototypes/readers/performance.js';
let cases=0;
for(const layers of [1,2,32])for(const kvHeads of [1,2,8,32])for(const headWidth of [1,4,128])for(const elementBytes of [1,2,4])for(const sequence of [0,1,8192])for(const sequences of [0,1,4]){
 const r=kvCacheAccounting({layers,kvHeads,headWidth,elementBytes,sequence,sequences});
 let perToken=0n;
 // Enumerate key and value scalar storage independently.
 for(let l=0;l<layers;l++)for(let h=0;h<kvHeads;h++)for(let k=0;k<headWidth;k++){perToken+=BigInt(elementBytes);perToken+=BigInt(elementBytes);}
 assert.equal(r.bytesPerToken,perToken);
 assert.equal(r.totalBytes,perToken*BigInt(sequence)*BigInt(sequences));cases++;
}
const base={layers:32,kvHeads:8,headWidth:128,elementBytes:2,sequence:8192};
assert.equal(kvCacheAccounting(base).totalBytes,2n**30n);
assert.equal(kvCacheAccounting({...base,kvHeads:32}).totalBytes,4n*2n**30n);
assert.equal(kvCacheAccounting({...base,kvHeads:1}).totalBytes,2n**27n);
assert.ok(kvCacheAccounting({...base,sequence:Number.MAX_SAFE_INTEGER}).totalBytes>BigInt(Number.MAX_SAFE_INTEGER));
for(const key of Object.keys(base))for(const value of [-1,0.5,Infinity,NaN,Number.MAX_SAFE_INTEGER+1])assert.throws(()=>kvCacheAccounting({...base,[key]:value}),RangeError);
for(const key of ['layers','kvHeads','headWidth','elementBytes'])assert.throws(()=>kvCacheAccounting({...base,[key]:0}),RangeError);
const html=performanceReader(s=>'/atlas/'+s);
assert.ok(html.includes('id="cache-payload"'));
assert.ok(html.includes('tabindex="0" role="region" aria-label="Assigned cache comparison:'));
for(const text of ['524288 B','131072 B','16384 B','4 GiB','1 GiB','0.125 GiB','not allocated device memory','does not claim equal model quality'])assert.ok(html.includes(text),text);
assert.equal((html.match(/class="dense-equation typeset-equation"/g)||[]).length,23);
assert.ok(!html.includes('katex-error'));
console.log(`KV logical payload: ${cases} scalar-enumerated cases, zero lengths, invalid dimensions, exact MHA/GQA/MQA values and rendered conditions pass.`);
