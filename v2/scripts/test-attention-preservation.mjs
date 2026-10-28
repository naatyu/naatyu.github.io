import assert from 'node:assert/strict';
import {attentionReader,attentionSections,attentionMeta} from '../site/readers/attention.js';
import {softmaxRow,featureStateRead} from '../site/readers/attention-model.js';
let cases=0;
// Exhaustive independent zero-mean unit-variance +/-1 query/key components.
for(let d=1;d<=6;d++){
  let sum=0,squares=0,count=0;
  for(let q=0;q<2**d;q++)for(let k=0;k<2**d;k++){
    let dot=0;for(let i=0;i<d;i++)dot+=((q>>i)&1?1:-1)*((k>>i)&1?1:-1);
    sum+=dot;squares+=dot*dot;count++;cases++;
  }
  assert.equal(sum,0);assert.equal(squares/count,d);
  assert(Math.abs(squares/count/d-1)<1e-12);
}
// Concatenation then projection equals the sum of row-block contributions.
for(let a=-5;a<=5;a++)for(let b=-5;b<=5;b++){
  const projected=[a*2+b*3,a*(-1)+b*4];
  const h1=[a*2,-a],h2=[b*3,b*4];
  assert.deepEqual(projected,h1.map((x,i)=>x+h2[i]));cases++;
}
assert.deepEqual([1+2,-1-3],[3,-4]);
for(let n=1;n<=100;n++){
  const p=softmaxRow(Array(n).fill(3));
  assert(p.every(x=>x===1/n));
  const diag=p[0]*(1-p[0]);
  assert(Math.abs(diag-(n-1)/n**2)<1e-12);cases++;
}
for(const T of [.01,.1,1,10,100])assert.deepEqual(softmaxRow([2/T,2/T]),[.5,.5]);
const html=attentionReader(s=>'/atlas/'+s);
assert.equal(attentionMeta.updated,'2026-10-28');
assert(html.indexOf('id="mechanism"')<html.indexOf('id="residual-write"'));
assert(html.indexOf('id="residual-write"')<html.indexOf('id="scaling"'));
assert(html.indexOf('id="scaling"')<html.indexOf('id="scale-assumptions"'));
assert(html.indexOf('id="scale-assumptions"')<html.indexOf('id="worked-row"'));
assert(html.indexOf('id="linear"')<html.indexOf('id="linear-cost"'));
assert(html.indexOf('id="linear-cost"')<html.indexOf('id="delta"'));
for(const [id]of attentionSections)assert(html.includes('id="'+id+'"'));
for(const text of ['entire block is not one fixed','[3,-4]','Correlations add covariance','padded batch length','Zero-length vectors','rd<sub>v</sub>','depthwise'])assert(html.includes(text),text);
console.log(`Attention preservation: ${cases} exact variance, projection and uniform-gradient cases; meaningful section order and numerical conditions pass.`);

// Independent direct weights versus compressed prefix state, signed values.
let kernelCases=0;
const options=[[0,1],[1,0],[1,1],[2,1]];
for(const q of options)for(let code=0;code<64;code++)for(let valueCode=0;valueCode<8;valueCode++){
  const keys=Array.from({length:3},(_,i)=>options[(code>>(2*i))&3]);
  const values=Array.from({length:3},(_,i)=>[valueCode&(1<<i)?1:-1,i-1]);
  for(let n=1;n<=3;n++){
    const weights=keys.slice(0,n).map(k=>q[0]*k[0]+q[1]*k[1]);
    const denominator=weights.reduce((a,b)=>a+b,0);
    if(!denominator){assert.throws(()=>featureStateRead(q,keys.slice(0,n),values.slice(0,n)),RangeError);continue;}
    const expected=[0,1].map(d=>weights.reduce((s,w,i)=>s+w*values[i][d],0)/denominator);
    const actual=featureStateRead(q,keys.slice(0,n),values.slice(0,n));
    assert.equal(actual.denominator,denominator);
    actual.output.forEach((x,d)=>assert(Math.abs(x-expected[d])<1e-12));kernelCases++;
  }
}
const example=featureStateRead([2,1],[[1,0],[0,1],[1,1]],[[1,0],[0,1],[1,1]]);
assert.deepEqual(example.state,[[2,1],[1,2]]);assert.deepEqual(example.normalizer,[2,2]);
assert.deepEqual(example.output,[5/6,2/3]);
for(const args of [[[],[],[]],[[1],[[1]],[[Infinity]]],[[1],[[-1]],[[0]]],[[0],[[1]],[[0]]],[[1],[[1,2]],[[0]]]])assert.throws(()=>featureStateRead(...args),RangeError);
for(const s of ['kernel-rearrangement','strict past-only','sequence boundaries','naive backward','not a measured softmax approximation'])assert(html.includes(s),s);
console.log(`Kernel-state preservation: ${kernelCases} direct-versus-recurrent prefix cases, invalid/zero denominator guards and exact worked table pass.`);

const multiply=(a,b)=>a.map(row=>b[0].map((_,j)=>row.reduce((s,x,k)=>s+x*b[k][j],0)));
let latentCases=0;
// Independent token-space path and fused latent-space path; unequal head widths.
for(let r=1;r<=4;r++)for(let dv=1;dv<=4;dv++)for(let dm=1;dm<=4;dm++)for(let n=1;n<=5;n++)for(let seed=0;seed<9;seed++){
  const c=Array.from({length:n},(_,i)=>Array.from({length:r},(_,j)=>(i+2*j+seed)%7-3));
  const wv=Array.from({length:r},(_,i)=>Array.from({length:dv},(_,j)=>(2*i-j+seed)%5-2));
  const wo=Array.from({length:dv},(_,i)=>Array.from({length:dm},(_,j)=>(i+3*j+seed)%7-3));
  const raw=Array.from({length:n},(_,i)=>i+1),total=raw.reduce((a,b)=>a+b,0);
  const expanded=multiply(c,wv);
  const read=[expanded[0].map((_,j)=>expanded.reduce((s,v,i)=>s+raw[i]/total*v[j],0))];
  const expected=multiply(read,wo)[0];
  const latent=[c[0].map((_,j)=>c.reduce((s,v,i)=>s+raw[i]/total*v[j],0))];
  const actual=multiply(latent,multiply(wv,wo))[0];
  actual.forEach((x,j)=>assert(Math.abs(x-expected[j])<1e-10));latentCases++;
}
assert.deepEqual(multiply([[.25,1.5]],multiply([[1,2],[3,0]],[[1,0],[0,2]])),[[4.75,1]]);
for(const s of ['mla-value-absorption','[4.75,1]','Head-specific weights','nonlinear operation','not constant-size recurrent memory','37.5%'])assert(html.includes(s),s);
console.log(`MLA preservation: ${latentCases} expanded-versus-fused value/output cases plus exact worked example pass; finite precision is not claimed bitwise identical.`);

// Scalar reference for the two displayed normalization operators.
const dot=(a,b)=>a.reduce((s,x,j)=>s+x*b[j],0);
const norm=a=>{const length=Math.sqrt(dot(a,a));if(!length)throw new RangeError('zero norm');return a.map(x=>x/length);};
let normalizedCases=0;
for(let d=1;d<=4;d++)for(let n=1;n<=6;n++)for(let seed=0;seed<9;seed++){
  const q=Array.from({length:d},(_,j)=>1+(seed+j)%3);
  const keys=Array.from({length:n},(_,i)=>Array.from({length:d},(_,j)=>(i+j+seed)%4+1));
  const values=Array.from({length:n},(_,i)=>[i-2,seed-i]);
  for(const mode of ['query','key']){
    const nq=mode==='query'?norm(q):q,nk=mode==='key'?keys.map(norm):keys;
    const logits=nk.map(k=>dot(nq,k)),p=softmaxRow(logits);
    const e=logits.map(Math.exp),z=e.reduce((s,x)=>s+x,0);
    for(let j=0;j<2;j++){
      const actual=p.reduce((s,w,i)=>s+w*values[i][j],0);
      const expected=e.reduce((s,w,i)=>s+w*values[i][j],0)/z;
      assert(Math.abs(actual-expected)<1e-10);
    }
    normalizedCases++;
  }
  const queryWeights=softmaxRow(keys.map(k=>dot(norm(q),k)));
  const scaledQueryWeights=softmaxRow(keys.map(k=>dot(norm(q.map(x=>3*x)),k)));
  queryWeights.forEach((x,i)=>assert(Math.abs(x-scaledQueryWeights[i])<1e-12));
}
assert.throws(()=>norm([0,0]),RangeError);
assert.notDeepEqual(softmaxRow([2,1]),softmaxRow([2/Math.sqrt(5),1/Math.sqrt(5)]));
for(let n=1;n<=10;n++)for(let d=1;d<=4;d++)for(const kappa of [.25,1,2]){
  const p=softmaxRow(Array.from({length:n},(_,i)=>kappa*Math.log(n)/d*(i-2)));
  assert(Math.abs(p.reduce((s,x)=>s+x,0)-1)<1e-12);
  if(n===1)assert.deepEqual(p,[1]);normalizedCases++;
}
for(const s of ['o_t^{\\mathrm{QueryNorm}}','o_t^{\\mathrm{KeyNorm}}','\\kappa\\frac{\\log n_t}','nonzero norms'])assert(html.includes(s),s);
console.log(`Attention normalization: ${normalizedCases} scalar operator/scale cases, query-rescaling invariance, distinct one-sided scores and zero-norm guard pass. No trained-model length-generalization claim.`);
