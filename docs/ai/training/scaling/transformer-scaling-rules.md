---
title: "Transformer Scaling Rules"
date: 2026-05-05
lastmod: 2026-06-08
tags:
  - ai/deep-learning
  - transformers
  - scaling-rules
draft: false
---

## Summary

Practical rules for choosing transformer width, depth, attention type, FFN size, and when to use dense, sparse, or MoE models.
## Concepts
- **Dense model:** every token uses the full network.
- **MoE model:** only a subset of experts is active per token.
- **GQA:** grouped-query attention, a middle ground between MHA and MQA.
- **KV cache:** stored key/value tensors used during autoregressive decoding.
- **Head dim:** per-head attention width.
- **FFN ratio:** usually $d_{ff} / d_{model}$.

## Core Formulas

Let:

- $d = d_{model}$
- $h = n_{heads}$
- $h_{kv} = n_{kv\_heads}$
- $p = d_{head}$
- $r = d_{ff} / d$

Then:

$$d = h \times p$$

This is the dimension identity for multi-head attention. If your hidden size is 4096 and you choose 32 heads, then each head is 128 wide. If you choose 64 heads, each head is 64 wide. This formula is the first sanity check for any config.

Approximate parameter counts:

$$P_{attn} \approx 2d^2 \left(1 + \frac{h_{kv}}{h}\right)$$

Why this matters:

- The factor $d^2$ tells you attention cost grows quickly with width.
- The term $h_{kv} / h$ captures the effect of KV sharing.
- If $h_{kv} = h$, this becomes roughly $4d^2$, which corresponds to standard MHA.
- If $h_{kv} = 1$, this becomes roughly $2d^2$, which corresponds to MQA.
- GQA sits between those two extremes.

$$P_{ffn} \approx 2d \times d_{ff}$$

This is the dense FFN cost. A classic MLP has an up projection and a down projection, so you get two large matrix multiplies per token. If you set $d_{ff} = 4d$, then the FFN alone is roughly $8d^2$ parameters per layer, which is why the FFN is often the biggest contributor.

For gated FFNs like SwiGLU:

$$P_{ffn} \approx 3d \times d_{ff}$$

This is larger because gated FFNs have an extra projection for the gate. The tradeoff is that the added expressivity often improves quality enough to justify the extra parameters.

KV cache per layer:

$$C_{kv} \approx 2 \times batch \times seq \times h_{kv} \times p \times bytes$$

This is the most important serving formula.

- It scales linearly with batch size.
- It scales linearly with sequence length.
- It scales linearly with the number of KV heads.
- It scales linearly with head dimension.
- It scales linearly with the number of layers once you multiply by layer count.

So if context length doubles, KV memory roughly doubles. If you halve $h_{kv}$, cache cost roughly halves.

### What the formulas tell you

You can combine the layer formulas into a rough model-size estimate:

$$P_{total} \approx n_{layers} \times (P_{attn} + P_{ffn}) + P_{embeddings}$$

This is only an approximation, but it is good enough for design work.

- Increasing $d$ grows almost everything quadratically.
- Increasing $n_{layers}$ grows total size linearly.
- Increasing $d_{ff}$ grows the FFN linearly and often dominates the layer budget.
- Reducing $h_{kv}$ lowers serving cost much more than it changes total training parameters.
- Gated FFNs add expressivity, but they also raise the layer cost.

So the usual design logic is:

1. Pick the deployment constraint.
2. Pick context length.
3. Pick width and depth together.
4. Set KV sharing based on cache budget.
5. Tune FFN ratio last.

## Rules

### 1. Choose dense by default

- Start dense unless MoE gives a clear benefit in active FLOPs or specialization.
- Dense is simpler to train, debug, quantize, and serve.
- Use MoE only when the deployment stack can handle routing and expert balancing.

### 2. Use GQA before MQA

- MHA is the quality baseline.
- GQA is usually the best tradeoff for modern LLMs.
- MQA is attractive when KV cache is the main bottleneck.
- Very high GQA ratios can hurt quality.

Rule of thumb:

- low ratios like 2, 4, or 8 are usually the safe region for GQA
- if the ratio gets too high, the model starts to behave more like MQA and quality can drop

### 2.1 Use periodic global attention when long context matters

A useful long-context architecture pattern is:

- several local sliding-window attention layers
- followed by one full global layer

Example cadence:

```text
5 local layers : 1 global layer
```

Why it helps:

- most layers stay cheap
- KV and training costs stay lower
- periodic global layers still let the model mix information across the full sequence

## 3. Translate formulas into design choices

When you want to choose a config, read the formulas in this order:

1. Pick context length first, because it drives cache cost.
2. Pick hidden size next, because it controls most parameter growth.
3. Pick head count and head dim together, because they must match $d = h \times p$.
4. Pick KV head count based on memory budget.
5. Pick FFN ratio last, because it is the easiest place to over-allocate parameters.

### 4. Keep head dim in a hardware-friendly band

- Prefer $64$ or $128$.
- Avoid odd dimensions unless you have a strong architecture reason.
- Use widths and FFN sizes that are multiples of $64$ or $128$ when possible.

### 5. Add depth before extreme width

- Small models often benefit more from one extra layer than from a large width jump.
- If a model is already reasonably wide, extra depth often gives better reasoning/composition gains.
- Layer-wise scaling is valid: not every layer needs the same width.

### 6. Tune FFN ratio last

- Dense FFN default: $d_{ff} \approx 4d$
- Gated FFNs can use a smaller ratio for similar quality.
- If quality is lagging, increase FFN capacity before making attention wider.

### 6.1 Interleave dense and sparse feed-forward blocks

A strong MoE design point is:

- alternate dense FFN layers and high-sparsity MoE layers

rather than using medium-sparsity MoE in every layer.

This can work well because:

- dense layers provide stable always-on transformation
- sparse layers provide large conditional capacity
- the wall-clock efficiency can be better than more uniformly sparse layouts

### 7. Long context is a cache problem

- Context length is not just RoPE.
- Use RoPE scaling, partial RoPE, sliding-window attention, or chunked attention.
- Reduce $h_{kv}$ before shrinking the whole model if KV memory is the bottleneck.

### 8. Batch size saturates

- Bigger batches help only up to the critical batch regime.
- After that, spend compute on more data, more steps, or a better architecture.

### 9. Tie embeddings when the model is small

- Tied input/output embeddings save parameters.
- Untying is usually only worth it when the model is large enough that the cost is negligible.

## Practical Templates

### Small dense baseline

- $d=2048$ to $3072$
- $h=16$ to $24$
- $p=64$
- $d_{ff}\approx 4d$
- GQA with low KV count

### Mid-size dense baseline

- $d=4096$
- $h=32$
- $p=128$ or $64$
- gated FFN
- GQA

Example interpretation:

- if $h=32$ and $p=128$, then $d=4096$
- if $h_{kv}=8$, the GQA ratio is $32/8=4$, which is a common sweet spot
- if $d_{ff}=14336$, then $d_{ff}/d \approx 3.5$, which is a strong gated-FFN ratio

This is a good dense mid-size shape because it keeps the head dimension clean and the FFN large enough to carry capacity.

### Long-context agent baseline

- moderate width
- deeper stack
- GQA or MQA
- sliding-window attention
- RoPE scaling / partial RoPE

### MoE frontier baseline

- use MoE only if total capacity matters more than deployment simplicity
- keep active experts small
- use sparse routing with monitoring and load balancing

Additional practical lessons:

- very high-sparsity MoE can work well when paired with dense interleaving
- shared experts are not always necessary in interleaved layouts
- dropless routing changes both stability and what load-balancing conclusions remain valid

Interpretation:

- MoE changes the meaning of model size
- total parameters can be huge, but only a fraction is active per token
- that is why MoE is attractive when inference cost matters more than raw parameter count

### Looped-MoE baseline

- looped dense layers save stored parameters but can lose expressivity
- sparse MoE FFNs can recover that expressivity because routing changes across loop passes
- compare architectures by active parameters for compute and unique parameters for storage
- loop boundaries are natural early-exit points because they are repeatedly trained to be output-facing

Interpretation:

- looping reduces stored weights
- MoE increases stored experts but keeps active compute sparse
- combining them can improve parameter efficiency and early-exit behavior

## Model Examples

- 30 - Atlas/AI/Deep Learning/Frontier Small Language Models - dense small-model scaling patterns.
- 30 - Atlas/AI/Deep Learning/Byte Latent Transformer - latent compression as an alternative to standard dense scaling.
- [FP8 Training](/atlas/ai/training/precision/fp8-training) - low-precision training formats and scaling strategies.
- [Moe Looped Language Models](/atlas/ai/architectures/transformers/moe-looped-language-models) - sparse MoE FFNs for scalable looped transformers.
- 30 - Atlas/AI/Deep Learning/Root Mean Square Layer Normalization - normalization choice for stable scaling.
- 30 - Atlas/AI/Deep Learning/RoPE scaling - long-context positional extrapolation.

## Recent Architectures To Know

- DeepSeek-V3 - MoE + MLA + multi-token prediction.
- Llama 4 - MoE multimodal family with very long context.
- Mistral 3 - dense family with long-context and multimodal variants.
- OpenELM - layer-wise non-uniform scaling.
- Mamba 2 - useful comparison point for attention-free sequence modeling.

## Related

- 30 - Atlas/AI/AI Papers MOC
- 30 - Atlas/AI/Transformers MOC
- [Attention Variants](/atlas/ai/architectures/transformers/attention-variants)
- [Scaling Laws](/atlas/ai/training/scaling/scaling-laws)
- [Scaling Ladders and Efficiency Gain](/atlas/ai/training/scaling/scaling-ladders-and-efficiency-gain)
- [FP8 Training](/atlas/ai/training/precision/fp8-training)
