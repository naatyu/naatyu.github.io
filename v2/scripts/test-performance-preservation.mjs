import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import GithubSlugger from 'github-slugger';
import {performanceReader,performanceMeta} from '../site/readers/performance.js';
import {reviewedNavigation,reviewedFragments,resolveReviewedNote} from '../site/reviewed-navigation.js';
import {rooflineAccounting,layerAccounting,matmulAccounting,perRowMatmulAccounting} from '../site/readers/performance-model.js';
const html=performanceReader(s=>'/atlas/'+s),ids=new Set([...html.matchAll(/ id="([^"]+)"/g)].map(x=>x[1]));
let headings=0;
for(const [slug,count]of [
 ['ai/training/scaling/llm-training-capacity-planning',35],
 ['systems/performance/model-flops-utilization-mfu',14],
 ['systems/performance/roofline-model',21]
]){
 const source=readFileSync(new URL('../../docs/'+slug+'.md',import.meta.url),'utf8'),g=new GithubSlugger(),actual=[];let fenced=false;
 for(const line of source.split('\n')){if(line.startsWith('```')){fenced=!fenced;continue;}if(!fenced&&/^#{2,6} /.test(line))actual.push(g.slug(line.replace(/^#+ /,'')));}
 assert.equal(actual.length,count);assert.deepEqual(Object.keys(reviewedFragments[slug]),actual);
 assert.equal(reviewedNavigation[slug].slug,performanceMeta.slug);
 for(const h of actual){const target=resolveReviewedNote(slug+'#'+h);assert.equal(target.slug,performanceMeta.slug);assert.ok(ids.has(target.anchor));headings++;}
}
const fp32=rooflineAccounting({flops:32,bytes:1,peak:19.5e12,bandwidth:1555e9});
const bf16=rooflineAccounting({flops:32,bytes:1,peak:312e12,bandwidth:1555e9});
assert.equal(fp32.regime,'compute ceiling');assert.equal(bf16.regime,'bandwidth ceiling');
assert.equal(fp32.ridge.toFixed(2),'12.54');assert.equal(bf16.ridge.toFixed(2),'200.64');
assert.equal(bf16.throughput,49.76e12);
const usefulRate=256*989e12*0.4,nominal=usefulRate*90*86400,main=nominal*0.75;
assert.equal(usefulRate,1.012736e17);
assert.ok(Math.abs(nominal/7.875e23-1)<0.00001);
assert.ok(Math.abs(main/5.906e23-1)<0.0001);
assert.equal(1*8192*16*32,4194304);
assert.equal(3.28e12/4e6,820000);
assert.ok(Math.abs((usefulRate/(6*30e9))/563000-1)<0.001);
assert.ok(Math.abs((820000*(4e6/(usefulRate/(6*30e9)))/86400)-67.5)<0.2);
for(const [parameters,tokens]of [[7e9,14.1e12],[13e9,7.6e12],[30e9,3.28e12],[70e9,1.41e12]])assert.ok(Math.abs(6*parameters*tokens/main-1)<0.005);
assert.equal(16*30e9,480e9);assert.equal(480e9/20e9,24);
assert.equal(256*24*90,552960);
assert.deepEqual([3,6,10].map(price=>552960*price),[1658880,3317760,5529600]);
assert.ok(Math.abs((3.28e12*4/(67*86400)/1e6)-2.27)<0.01);
assert.equal((html.match(/class="inline-math"/g)||[]).length,33);
assert.equal((html.match(/<math /g)||[]).length,56);
assert(!html.includes('${'));
const escapeTex=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
for(const tex of [String.raw`Y=XW`,String.raw`dX=dY\,W^\top`,String.raw`dW=X^\top dY`,String.raw`6MKN`,String.raw`D=H_qK`,String.raw`3DF`,String.raw`F=4D`,String.raw`P_{\rm layer}\approx16D^2`,String.raw`\frac S{8D}`,String.raw`\frac{S(S+1)}2`,String.raw`\frac{S^2}2`,String.raw`2BP`,String.raw`2P`,String.raw`I\approx B`,String.raw`\frac{16P}D`,String.raw`B_{\rm micro}SLW`,String.raw`\frac{60}{1860}\approx3.23\%`,String.raw`\sqrt{720}\approx26.8`,String.raw`\frac I2`])assert(html.includes(`<annotation encoding="application/x-tex">${escapeTex(tex)}</annotation>`),tex);
let gradientCases=0,pairCases=0;
for(const tex of [String.raw`B_{\rm micro}=1`,String.raw`S=8192`,String.raw`G=16`,String.raw`D_{\rm dp}=32`,String.raw`I=0.25`])assert(html.includes(`<annotation encoding="application/x-tex">${escapeTex(tex)}</annotation>`),tex);
for(let M=1;M<=3;M++)for(let K=1;K<=3;K++)for(let N=1;N<=3;N++){
  const X=Array.from({length:M*K},(_,i)=>(i*7%11-5)/3),W=Array.from({length:K*N},(_,i)=>(i*5%13-6)/4),G=Array.from({length:M*N},(_,i)=>(i%7-3)/5);
  const loss=()=>{let out=0;for(let i=0;i<M;i++)for(let j=0;j<N;j++){let y=0;for(let k=0;k<K;k++)y+=X[i*K+k]*W[k*N+j];out+=y*G[i*N+j];}return out;};
  for(const [operand,isX]of [[X,true],[W,false]])for(let index=0;index<operand.length;index++){
    const original=operand[index],epsilon=1e-5;operand[index]=original+epsilon;const up=loss();operand[index]=original-epsilon;const down=loss();operand[index]=original;
    let derivative=0;if(isX){const i=Math.floor(index/K),k=index%K;for(let j=0;j<N;j++)derivative+=G[i*N+j]*W[k*N+j];}
    else {const k=Math.floor(index/N),j=index%N;for(let i=0;i<M;i++)derivative+=X[i*K+k]*G[i*N+j];}
    assert(Math.abs((up-down)/(2*epsilon)-derivative)<1e-8);gradientCases++;
  }
}
for(let S=1;S<=32;S++)for(const D of [1,2,3,8]){
  const settings={sequences:1,sequence:S,width:D,intermediate:4*D,queryHeads:1,kvHeads:1,headWidth:D};
  const full=layerAccounting(settings),causal=layerAccounting({...settings,causal:true});
  let pairs=0;for(let i=0;i<S;i++)for(let j=0;j<S;j++)if(j<=i)pairs++;
  assert.equal(causal.pairs,pairs);assert.equal(full.pairs,S*S);assert.equal(full.activeParameters,16*D*D);
  assert(Math.abs(full.attentionRatio-S/(8*D))<1e-12);assert(Math.abs(causal.attentionRatio-(S+1)/(16*D))<1e-12);pairCases++;
}
console.log(`Performance notation: ${gradientCases} finite-difference operand gradients and ${pairCases} exact full/causal pair-ratio cases pass.`);
for(const text of ['June 2021','40 GB PCIe and SXM','624 value requires sparsity','cuBLAS','injected-failure','collective frequency','allocated and reserved','not measured training runs','375%','37.5%','46.9%'])assert.ok(html.includes(text),text);
assert.ok(html.indexOf('inconsistent original input')<html.indexOf('Small matrices, launch cost'));
const snippets=[...html.matchAll(/<pre[^>]*><code>([\s\S]*?)<\/code><\/pre>/g)].map(m=>m[1].replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&'));
assert.equal(snippets.length,1);
const python=String.raw`
import json,sys,itertools
scope={};exec(json.loads(sys.argv[1]),scope);f=scope['matmul_work'];cases=0
for m,k,n in itertools.product(range(1,5),repeat=3):
 for qx,qw,qy in itertools.product([1,2,4],repeat=3):
  flops=sum(2 for i in range(m) for j in range(n) for z in range(k))
  traffic=sum(qx for i in range(m) for z in range(k))+sum(qw for z in range(k) for j in range(n))+sum(qy for i in range(m) for j in range(n))
  assert f(m,k,n,qx,qw,qy)==(flops,traffic,flops/traffic)
  cases+=1
print(cases)
`;
assert.equal(execFileSync('/usr/bin/python3',['-c',python,JSON.stringify(snippets[0])],{encoding:'utf8'}).trim(),'1728');
assert.ok(html.includes('tabindex="0" role="region" aria-label="Matrix accounting Python"'));
let ownershipCases=0;
for(const rows of [1,2,8,32])for(let inner=1;inner<=4;inner++)for(let cols=1;cols<=4;cols++)for(const inputBytes of [1,2,4])for(const weightBytes of [1,2,4])for(const outputBytes of [1,2,4]){
 const settings={rows,inner,cols,inputBytes,weightBytes,outputBytes},shared=matmulAccounting(settings),separate=perRowMatmulAccounting(settings);
 let f=0,qx=0,qw=0,qy=0;for(let b=0;b<rows;b++){for(let d=0;d<inner;d++)qx+=inputBytes;for(let j=0;j<cols;j++){qy+=outputBytes;for(let d=0;d<inner;d++){f+=2;qw+=weightBytes;}}}
 assert.equal(separate.flops,f);assert.equal(separate.bytes,qx+qw+qy);assert.equal(separate.weightTraffic,qw);assert.equal(separate.intensity,f/(qx+qw+qy));
 assert.equal(shared.flops,separate.flops);assert.equal(shared.weightTraffic*rows,separate.weightTraffic);assert(shared.intensity>=separate.intensity);
 assert.equal(separate.intensity,perRowMatmulAccounting({...settings,rows:1}).intensity);ownershipCases++;
}
for(const rows of [0,-1,NaN,Infinity,1.5])assert.throws(()=>perRowMatmulAccounting({rows,inner:64,cols:128}),RangeError);
assert.throws(()=>perRowMatmulAccounting({rows:Number.MAX_SAFE_INTEGER,inner:Number.MAX_SAFE_INTEGER,cols:1,weightBytes:1e300}),RangeError);
const example=perRowMatmulAccounting({rows:128,inner:64,cols:128});assert.equal(example.weightTraffic,2097152);assert.equal(example.intensity.toFixed(3),'0.977');
for(const text of ['Batching needs shared weights','each row has its own matrix','batch factor cancels','rows routed to the same expert','2097152','32.000','0.977'])assert(html.includes(text),text);
for(const tex of [String.raw`X[B,D]W[D,F]\to Y[B,F]`,String.raw`X[B,D]W[B,D,F]\to Y[B,F]`,String.raw`I_{\rm shared}\approx B`,String.raw`I_{\rm per\ row}\approx1`])assert(html.includes(`<annotation encoding="application/x-tex">${escapeTex(tex)}</annotation>`),tex);
assert(html.includes('id="weight-ownership"'));assert(html.includes('tabindex="0" role="region" aria-label="Assigned two-byte weight ownership comparison"'));
const ownershipTex=String.raw`\begin{aligned}I_{\rm shared}&=\frac{2BDF}{2BD+2DF+2BF}\\I_{\rm per\ row}&=\frac{2BDF}{2BD+2BDF+2BF}=\frac{DF}{D+DF+F}\end{aligned}`;
assert(html.includes(`<annotation encoding="application/x-tex">${escapeTex(ownershipTex)}</annotation>`));
console.log(`Performance weight ownership: ${ownershipCases} scalar-enumerated shared/distinct matrix cases and exact table/formula checks pass.`);
console.log(`Performance preservation: ${headings} exact old headings, precision-specific ridge arithmetic,33 inline formulas and 1,728 actual rendered Python cases pass.`);
