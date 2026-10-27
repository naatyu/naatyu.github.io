import {inlineMath} from './math.js';

// Original conceptual schedule: full sharding, reshard after forward, no overlap.
export function fsdpTimeline(){return `<figure class="fsdp-figure" aria-labelledby="fsdp-timeline-title">
<figcaption id="fsdp-timeline-title"><strong>One layer, two ranks · time flows downward ↓</strong><span>Synthetic schedule · equal local batch sizes and local mean losses</span></figcaption>
<p>Rank 0 processes batch A and owns W00. Rank 1 processes batch B and owns W01. W00 and W01 are two shards of the same layer. gA0 names batch A’s gradient contribution for W00.</p>
<div class="fsdp-legend"><span><i class="fsdp-weight-key" aria-hidden="true"></i>Weights: AllGather</span><span><i class="fsdp-gradient-key" aria-hidden="true"></i>Gradients: ReduceScatter</span></div>
<div class="fsdp-scroll" tabindex="0" role="region" aria-label="FSDP two-rank timeline; scroll horizontally on narrow screens">
<div class="fsdp-timeline">
<div class="fsdp-rank-head"><div><strong>Rank 0</strong><small>Local batch A · owns W00</small></div><div><strong>Rank 1</strong><small>Local batch B · owns W01</small></div></div>
<div class="fsdp-phase"><span>1</span>Start: sharded storage</div>
<div class="fsdp-pair"><div role="group" aria-label="Rank 0" class="fsdp-state"><strong>W00</strong>Optimizer state for W00</div><div role="group" aria-label="Rank 1" class="fsdp-state"><strong>W01</strong>Optimizer state for W01</div></div>
<div class="fsdp-phase"><span>2</span>Forward: AllGather weights</div>
<div class="fsdp-transfer"><div class="fsdp-endpoint"><b>Rank 0</b>Sender</div><div class="fsdp-route">W00 · weight shard<div class="fsdp-arrow" aria-hidden="true"></div></div><div class="fsdp-endpoint"><b>Rank 1</b>Receiver</div></div>
<div class="fsdp-transfer fsdp-left"><div class="fsdp-endpoint"><b>Rank 0</b>Receiver</div><div class="fsdp-route">W01 · weight shard<div class="fsdp-arrow" aria-hidden="true"></div></div><div class="fsdp-endpoint"><b>Rank 1</b>Sender</div></div>
<div class="fsdp-pair"><div role="group" aria-label="Rank 0" class="fsdp-state"><strong>Full weights [W00, W01]</strong>Run forward on batch A<small>Save activations, or recompute them later</small></div><div role="group" aria-label="Rank 1" class="fsdp-state"><strong>Full weights [W00, W01]</strong>Run forward on batch B<small>Save activations, or recompute them later</small></div></div>
<div class="fsdp-pair"><div role="group" aria-label="Rank 0" class="fsdp-state"><strong>Reshard → keep W00</strong><small>Release temporary full-weight storage</small></div><div role="group" aria-label="Rank 1" class="fsdp-state"><strong>Reshard → keep W01</strong><small>Release temporary full-weight storage</small></div></div>
<div class="fsdp-phase"><span>3</span>Backward: AllGather weights again</div>
<div class="fsdp-transfer"><div class="fsdp-endpoint"><b>Rank 0</b>Sender</div><div class="fsdp-route">W00 · weight shard<div class="fsdp-arrow" aria-hidden="true"></div></div><div class="fsdp-endpoint"><b>Rank 1</b>Receiver</div></div>
<div class="fsdp-transfer fsdp-left"><div class="fsdp-endpoint"><b>Rank 0</b>Receiver</div><div class="fsdp-route">W01 · weight shard<div class="fsdp-arrow" aria-hidden="true"></div></div><div class="fsdp-endpoint"><b>Rank 1</b>Sender</div></div>
<div class="fsdp-pair"><div role="group" aria-label="Rank 0" class="fsdp-state"><strong>Backward on batch A</strong>Uses full weights [W00, W01]<small>Produces [gA0, gA1]</small></div><div role="group" aria-label="Rank 1" class="fsdp-state"><strong>Backward on batch B</strong>Uses full weights [W00, W01]<small>Produces [gB0, gB1]</small></div></div>
<div class="fsdp-phase"><span>4</span>ReduceScatter gradients to their owners</div>
<div class="fsdp-transfer fsdp-gradient"><div class="fsdp-endpoint"><b>Rank 0</b>Sender</div><div class="fsdp-route">gA1 · gradient from batch A for W01<div class="fsdp-arrow" aria-hidden="true"></div></div><div class="fsdp-endpoint"><b>Rank 1</b>Receiver</div></div>
<div class="fsdp-transfer fsdp-gradient fsdp-left"><div class="fsdp-endpoint"><b>Rank 0</b>Receiver</div><div class="fsdp-route">gB0 · gradient from batch B for W00<div class="fsdp-arrow" aria-hidden="true"></div></div><div class="fsdp-endpoint"><b>Rank 1</b>Sender</div></div>
<div class="fsdp-pair"><div role="group" aria-label="Rank 0" class="fsdp-state fsdp-sum"><strong>Own gA0 + received gB0</strong>Mean: ${inlineMath(String.raw`\dfrac{g_{A,0}+g_{B,0}}{2}`)}<small>Synchronized gradient for W00 only</small></div><div role="group" aria-label="Rank 1" class="fsdp-state fsdp-sum"><strong>Received gA1 + own gB1</strong>Mean: ${inlineMath(String.raw`\dfrac{g_{A,1}+g_{B,1}}{2}`)}<small>Synchronized gradient for W01 only</small></div></div>
<div class="fsdp-phase"><span>5</span>Local optimizer update</div>
<div class="fsdp-pair"><div role="group" aria-label="Rank 0" class="fsdp-state"><strong>Update W00 locally</strong>Use its mean gradient and optimizer state<small>Release temporary full weights; retain updated W00</small></div><div role="group" aria-label="Rank 1" class="fsdp-state"><strong>Update W01 locally</strong>Use its mean gradient and optimizer state<small>Release temporary full weights; retain updated W01</small></div></div>
<div class="fsdp-foot"><strong>Next forward:</strong> AllGather reconstructs the layer from the <strong>updated weight shards</strong>. It does not gather gradients.</div>
</div>
</div>
<p class="dense-caption">The arrows name the sender, payload and receiver. Transfers within a collective can run concurrently; this diagram separates them for readability. A larger model completes backward before the optimizer step. Averaging can occur before, during or after ReduceScatter. Global gradient-norm clipping can require an additional small reduction. Scroll horizontally on narrow screens.</p>
</figure>`;}
