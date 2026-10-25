import {matmulAccounting,perRowMatmulAccounting} from './performance-model.js';
import {texEq,inlineMath} from './math.js';
import {table,cite} from './topic-tools.js';

export function weightOwnershipNote(){
 const examples=[1,8,32,128].map(rows=>{
  const settings={rows,inner:64,cols:128};
  const shared=matmulAccounting(settings),separate=perRowMatmulAccounting(settings);
  return [String(rows),String(shared.weightTraffic),String(separate.weightTraffic),shared.intensity.toFixed(3),separate.intensity.toFixed(3)];
 });
 return `<p>Batching helps because several rows reuse one matrix. Merely grouping independent operations does not create that reuse.</p>`+
 `<p>Compare ${inlineMath(String.raw`X[B,D]W[D,F]\to Y[B,F]`)} with ${inlineMath(String.raw`X[B,D]W[B,D,F]\to Y[B,F]`)}. In the second contraction, each row has its own matrix. Both perform the same leading arithmetic, but their weight traffic differs.</p>`+
 texEq(String.raw`\begin{aligned}I_{\rm shared}&=\frac{2BDF}{2BD+2DF+2BF}\\I_{\rm per\ row}&=\frac{2BDF}{2BD+2BDF+2BF}=\frac{DF}{D+DF+F}\end{aligned}`,'B,D,F are positive integer row count, input width and output width. Every stored element uses two bytes. Count two leading FLOPs per multiply-add, one read of each input/weight and one output write; beta=0. Intensities are FLOP/byte.')+
 `<p>For a weight-dominated shared matrix, ${inlineMath(String.raw`I_{\rm shared}\approx B`)}. With distinct matrices and large widths, ${inlineMath(String.raw`I_{\rm per\ row}\approx1`)}. The batch factor cancels in the second ratio.</p>`+
 table('Assigned two-byte comparison: D=64, F=128',['Rows','Shared weight bytes','Distinct weight bytes','Shared FLOP/byte','Distinct FLOP/byte'],examples).replace('<table','<table style="min-width:720px"').replace('class="dense-table-wrap"','class="dense-table-wrap" tabindex="0" role="region" aria-label="Assigned two-byte weight ownership comparison"')+
 `<p>The table is ideal accounting, not a benchmark. Cache residency, tiling and conversion can change actual traffic. In MoE, reuse depends on rows routed to the same expert, not the total input batch.</p>`+
 `<p>${cite('https://jax-ml.github.io/scaling-book/roofline/#a-few-problems-to-work','How to Scale Your Model, Rooflines: independent per-row matrices')} gives the one-byte variant. This comparison uses two-byte storage consistently.</p>`;
}
