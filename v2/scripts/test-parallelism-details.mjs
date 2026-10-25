import assert from 'node:assert/strict';
import {causalOwnership} from '../prototypes/readers/parallelism-model.js';
import {parallelismReader} from '../prototypes/readers/parallelism.js';
import {onlineAttention} from '../prototypes/readers/attention-model.js';

// Independent full-row reference, then masked blocks in both arrival orders.
let softmaxCases=0;
for(const a of [-1000,0,1000])for(const b of [-1000,Math.log(3),1000])for(const c of [-1000,1,1000]){
  const scores=[a,b,c],values=[[8,-2],[0,5],[-3,1]];
  for(let mask=1;mask<8;mask++){
    const visible=scores.map((_,i)=>i).filter(i=>mask&(1<<i));
    const maximum=Math.max(...visible.map(i=>scores[i]));
    const weights=visible.map(i=>Math.exp(scores[i]-maximum)),denominator=weights.reduce((x,y)=>x+y,0);
    const reference=[0,1].map(d=>visible.reduce((sum,i,j)=>sum+weights[j]*values[i][d],0)/denominator);
    for(const order of [[0,1,2],[2,1,0],[1,2,0]]){
      const blocks=order.map(i=>mask&(1<<i)?{scores:[scores[i]],values:[values[i]]}:{scores:[],values:[]});
      const result=onlineAttention(blocks);
      result.forEach((value,d)=>assert(Math.abs(value-reference[d])<1e-12));softmaxCases++;
    }
  }
}
for(const order of [[0,1],[1,0]]){
  const scores=[Math.log(3),0],values=[[8],[0]];
  assert(Math.abs(onlineAttention(order.map(i=>({scores:[scores[i]],values:[values[i]]})))[0]-6)<1e-12);
}
assert.throws(()=>onlineAttention([{scores:[],values:[]}]),RangeError);

let assignments=0;
for(let ranks=1;ranks<=128;ranks++){
  const rows=causalOwnership(ranks),positions=2*ranks;
  for(const layout of ['contiguous','zigzag']){
    assert.deepEqual(rows.flatMap(r=>r[layout]).sort((a,b)=>a-b),Array.from({length:positions},(_,i)=>i+1));
    let validPairs=0;
    for(const row of rows){
      // Independently enumerate the causal mask, rather than using q as the answer.
      const work=row[layout].flatMap(q=>Array.from({length:positions},(_,k)=>k+1).filter(k=>k<=q)).length;
      assert.equal(row[layout+'Work'],work);
      if(layout==='zigzag')assert.equal(work,positions+1);
      validPairs+=work;assignments++;
    }
    assert.equal(validPairs,positions*(positions+1)/2);
  }
}
assert.deepEqual(causalOwnership(8).map(r=>r.contiguousWork),[3,7,11,15,19,23,27,31]);
assert(causalOwnership(8).every(r=>r.zigzagWork===17));
for(const bad of [0,-1,1.5,NaN,Infinity,1025])assert.throws(()=>causalOwnership(bad),RangeError);
for(let ranks=2;ranks<=128;ranks++){
  const tensor=123456,onePass=(ranks-1)*tensor/ranks;
  assert(Math.abs((3*onePass)/(2*onePass)-1.5)<1e-12);
}
// Positive continuous candidates minimize max(aX,b/X) by balancing both terms.
let meshes=0;
for(const B of [256,4096,48000])for(const F of [1024,8192,32768])for(const N of [8,64,512])for(const MX of [1,2,3])for(const MY of [1,2,3]){
  const a=F/(N*MX),b=B/MY,x=Math.sqrt(B/F*MX/MY*N),cost=Math.max(a*x,b/x);
  assert(Math.abs(a*x-b/x)<1e-8);
  for(const factor of [.5,.9,1.1,2])assert(Math.max(a*x*factor,b/(x*factor))>=cost-1e-8);
  const alpha=2550,ratio=Math.sqrt(B*F)*Math.sqrt(MX*MY)/(alpha*Math.sqrt(N));
  assert.equal(ratio>1,B/N>alpha**2/(MX*MY*F));meshes++;
}
const html=parallelismReader(s=>s);
assert.equal((html.match(/class="katex-display"/g)||[]).length,11);
assert(!html.includes('katex-error'));
assert.equal((html.match(/class="inline-math"/g)||[]).length,10);
assert.equal((html.match(/class="dense-table-wrap"/g)||[]).length,(html.match(/class="dense-table-wrap" tabindex="0" role="region" aria-label="[^"]+"/g)||[]).length);
assert.equal((html.match(/<table /g)||[]).length,(html.match(/<table style="min-width:640px">/g)||[]).length);
for(const text of ['Averaging the block outputs gives 4','vector u','output remains 6','no attention dropout'])assert(html.includes(text),text);
for(const id of ['state-traffic','causal-balance','pipeline-payload','mixed-mesh-intensity'])assert(html.includes('id="'+id+'"'));
for(const claim of ['50% more bytes','not elapsed times','same 136 valid pairs','not measured latency','not a hardware-independent batch prescription','Node network egress'])assert(html.includes(claim),claim);
console.log(`Parallelism detail pass: ${assignments} causal ownership checks, ${meshes} continuous meshes, ${softmaxCases} masked/order/extreme-score softmax cases, traffic ratios and eleven displays plus ten inline formulas. GPU timing remains separate.`);
