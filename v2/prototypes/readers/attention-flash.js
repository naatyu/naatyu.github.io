import {rangePlayback,section,table,cite} from './topic-tools.js';
export const flashInputs={rising:[0,3,-1,4],falling:[4,-1,3,0]};
export const flashValues=[[1,0],[0,1],[1,1],[-1,0]];
export function flashSteps(scores){
  if(!Array.isArray(scores)||scores.length!==4||scores.some(x=>!Number.isFinite(x)))throw new RangeError('Four finite scores required');
  let m=-Infinity,l=0,u=[0,0];const steps=[{m,l,u:[...u],scale:0,weight:0,output:null}];
  for(let i=0;i<4;i++){
    const next=Math.max(m,scores[i]),scale=l?Math.exp(m-next):0,weight=Math.exp(scores[i]-next);
    l=scale*l+weight;u=u.map((x,d)=>scale*x+weight*flashValues[i][d]);m=next;
    steps.push({m,l,u:[...u],scale,weight,output:u.map(x=>x/l)});
  }
  return steps;
}
const fmt=x=>Number.isFinite(x)?x.toFixed(4):'−∞';
export function flashState(scenario,stage){
  if(!Object.hasOwn(flashInputs,scenario)||!Number.isInteger(stage)||stage<0||stage>4)throw new RangeError('Invalid tile stage');
  const f=flashSteps(flashInputs[scenario])[stage];
  return table('Stopped online-softmax state',['Quantity','Value','Meaning'],[['Visible scores',stage?flashInputs[scenario].slice(0,stage).join(', '):'none','One-key tiles in this synthetic example'],['Running maximum m',fmt(f.m),'Reference for exponentials'],['Old-state rescale',fmt(f.scale),stage?'exp(old maximum − new maximum)':'No previous state'],['Exponential sum ℓ',fmt(f.l),'Unnormalized probability mass'],['Weighted accumulator u','['+f.u.map(fmt).join(', ')+']','Not yet divided by ℓ'],['Output u/ℓ',f.output?'['+f.output.map(fmt).join(', ')+']':'not defined','Weighted mean over the processed prefix']])+
  `<p data-flash-result>Scenario=${scenario}; tiles=${stage}; m=${fmt(f.m)}; l=${fmt(f.l)}; u=[${f.u.map(fmt)}]. ${stage===0?'No key has been processed.':f.scale<1&&stage>1?'A larger maximum rescales the previous sums before the new value is added.':'The old reference maximum remains valid; add the new exponential contribution.'}</p>`;
}
export const flashSections=[['flash-worked','Watch the normalization reference change'],['flash-kernels','Hardware paths and kernel contracts']];
export function flashBody(link){return section('flash-worked',flashSections[0][1],`
<p>The accumulator is easiest to inspect when the reference maximum changes. Use four scores [0,3,−1,4] and values [1,0], [0,1], [1,1], [−1,0]. Each tile contains one key. This is a numerical demonstration, not a GPU schedule or performance trace.</p>
${table('First two tiles, in real arithmetic',['After tile','m','ℓ','u'],[['1: score0, value[1,0]','0','1','[1,0]'],['2: score3, value[0,1]','3','exp(−3)+1','[exp(−3),1]']])}
<p>Tile2 changes the maximum from0 to3. Multiplying the old sums by exp(−3) expresses both tiles relative to the new maximum. Without that rescaling, the algorithm incorrectly treats the two scores as equally weighted.</p>
<div class="dense-lab" data-flash-lab><label>Score order<select aria-label="FlashAttention score order" data-flash-order><option value="rising">Later tiles raise the maximum</option><option value="falling">Maximum is present in the first tile</option></select></label><label>Processed tiles<input aria-label="FlashAttention processed tiles" data-flash-stage type="range" min="0" max="4" step="1" value="0"></label><div class="dense-actions"><button data-play>Play</button><button data-reset>Replay</button></div><div data-flash-state>${flashState('rising',0)}</div></div>
<p>Every stopped state remains readable. After all four keys, u/ℓ equals direct softmax followed by value aggregation. Reordering score/value pairs preserves the result in real arithmetic; this control changes only score order while values stay fixed, so its final answer can differ.</p>
`)+section('flash-kernels',flashSections[1][1],`
<p>After avoiding quadratic intermediates, kernel performance still depends on how threads share work. FlashAttention-2 reduces non-matmul overhead and improves block/warp partitioning. More parallel work is useful only when register and shared-memory demand allow enough resident execution.</p>
<p>FlashAttention-3 uses Hopper's Warpgroup Matrix Multiply-Accumulate (WGMMA) and Tensor Memory Accelerator (TMA). Producer warps move tiles while consumer warps compute. Pingpong scheduling overlaps one warpgroup's softmax with another's matrix multiplication; further overlap within a warpgroup costs registers.</p>
<p>Its FP8 path uses a random-sign Hadamard transform to distribute activation outliers before quantization. An orthogonal transform applied consistently to Q and K preserves their dot products before rounding. Low-precision rounding still introduces error. These mechanisms do not imply an end-to-end speedup for every workload. ${cite('https://tridao.me/blog/2024/flash3/','FA3 design and scoped benchmarks')}</p>
<p>Installation facts below were checked against the official repository on6 October2026. They are implementation requirements, not permanent properties of the algorithm.</p>
${table('Official NVIDIA implementation snapshot',['Path','Recorded scope'],[['FA2','Ampere/Ada/Hopper, CUDA12+, FP16/BF16; head dimensions up to256 with backward/dropout caveats'],['FA3','Hopper H100/H800, CUDA12.3+; FP16/BF16 forward/backward and FP8 forward in the documented beta'],['FA4','CuTeDSL line for Hopper/Blackwell; separate flash-attn-4 package']])}
<pre><code># Official FA4 interface; requires a supported installed GPU stack.
# q: [batch, nq, query_heads, head_dim]
# k, v: [batch, nk, kv_heads, head_dim]
from flash_attn.cute import flash_attn_func
out = flash_attn_func(q, k, v, causal=True)
# Interface illustration, not executed by this website.</code></pre>
<p>Check the selected API's causal alignment when query and key lengths differ. Confirm packed-sequence boundaries, head grouping, dropout, backward determinism and cache updates. Passing fewer KV heads requires compatible grouping; do not silently expand the cache.</p>
<p>The official repository also documents ROCm paths; NVIDIA requirements above do not describe every backend. Pin the package and benchmark the actual supported path. ${cite('https://github.com/Dao-AILab/flash-attention','Official installation and API reference')}</p>
<p>A framework call can choose a different kernel or fall back. Inspect the trace in <a href="${link('execution/profiling')}">Profiling and Kernel Optimization</a>. Compare against a higher-precision reference with the same mask and scale. Measure prefill, decode, memory and end-to-end latency separately. Kernel improvements cannot remove an unrelated bottleneck.</p>
<p>Source builds and packaging can fail outside supported GPU/software stacks. During single-token decode, reading the growing KV cache can dominate even when score intermediates are no longer stored. <a href="${link('execution/performance')}">Memory and compute limits →</a> · <a href="${link('training/numerics#attention')}">Low-precision attention errors →</a> · <a href="${link('training/parallelism#context-ring')}">Distributed context ownership →</a></p>
`);}
export function mountFlash(article){const lab=article.querySelector('[data-flash-lab]');if(!lab)return;
  const order=lab.querySelector('[data-flash-order]'),slider=lab.querySelector('[data-flash-stage]');
  const draw=n=>{lab.querySelector('[data-flash-state]').innerHTML=flashState(order.value,Math.round(n));};
  const playback=rangePlayback(article,lab,draw,10000,slider);
  order.addEventListener('change',()=>{playback.stop();playback.render();});
}
