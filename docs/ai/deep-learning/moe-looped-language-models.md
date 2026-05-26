---
title: "Sparse Layers in Looped Language Models"
date: 2026-05-19
lastmod: 2026-05-19
tags:
  - ai/deep-learning
  - ai/llm
  - architecture
  - moe
  - scaling-laws
draft: false
---

## Summary

Dense looped transformers save stored parameters but lose expressivity; replacing dense FFNs with sparse MoE FFNs lets looped models scale better and makes early exits more useful.
## Concepts
- **Looped transformer:** a transformer that reuses the same physical layers multiple times, e.g. $8$ layers run for $2$ loops to create $16$ effective layers.
- **Looped-MoE:** a looped transformer where dense FFNs are replaced by sparse MoE FFNs.
- **Active parameters:** parameters used for one token's forward pass.
- **Unique parameters:** parameters physically stored in memory.
- **Top-k token-choice routing:** MoE routing where each token selects the top $k$ experts.
- **Early exit:** stopping computation before full depth when the model is confident enough.
- **Logit lens:** projecting intermediate hidden states through the final LM head to inspect token distributions.

## Content

### Core claim

Looping by itself is not enough. Dense looped transformers often underperform standard transformers at matched training compute because the same dense FFN is reused at multiple depths.

The paper's central claim:

- dense looping saves memory but hurts expressivity
- sparse MoE FFNs restore expressivity
- loop boundaries are naturally strong early-exit points

In short:

&gt; sparsity makes looping scalable, and looping makes early exit effective

### Why dense looping underperforms

A looped model might replace $16$ unique layers with $8$ physical layers run twice:

$$8 \text{ physical layers} \times 2 \text{ loops} = 16 \text{ effective layers}$$

This reduces stored parameters, but it forces tokens through the same dense FFN transformation repeatedly. The authors argue that this is the main expressivity bottleneck.

The attention layers can still mix information, but the FFN is where much of the per-token nonlinear transformation happens. If the same dense FFN is reused, the model has fewer distinct transformations across depth.

### Why MoE helps

Looped-MoE replaces each dense FFN with a sparse MoE FFN.

The physical layer is still reused, but the router can send the same token to different experts on different loop passes. This means the reused layer is not simply repeating the same computation.

The paper uses a Mixtral-style setup:

- $E=8$ total experts
- $k=2$ active experts per token
- top-k token-choice routing
- load-balancing auxiliary loss
- router z-loss for stability

The key mechanism:

$$\text{same physical layer} + \text{different expert route} = \text{different computation}$$

### Architectures compared

| Architecture | FFN type | Layer structure |
|---|---:|---:|
| Base | Dense | 16 unique layers |
| Looped | Dense | 8 layers $\times$ 2 loops |
| MoE | Sparse | 16 unique layers |
| Looped-MoE | Sparse | 8 layers $\times$ 2 loops |

All models use a controlled decoder-only transformer backbone:

- multi-head self-attention
- RoPE
- SwiGLU FFNs
- pre-RMSNorm
- residual connections

The isolated variables are:

- dense vs sparse FFN
- looped vs non-looped depth

### Compute accounting

The paper separates active and unique parameters.

Looping reduces unique parameters:

- fewer stored layers
- same layers reused through depth

MoE increases unique parameters:

- inactive experts must still be stored
- only selected experts are active per token

For compute, the paper uses the standard approximation:

$$C \approx 6ND$$

Where:

- $C$ is training FLOPs
- $N$ is active parameters
- $D$ is training tokens

The important detail is that $N$ means active parameters, not stored parameters. This is necessary for fair comparison between dense, looped, and MoE models.

### Scaling study

The authors run an isoFLOP scaling study across compute budgets:

$$5 \times 10^{16},\ 2 \times 10^{17},\ 5 \times 10^{17},\ 10^{18}$$

Training setup:

- 10B-token sample of FineWeb-Edu
- GPT-2 tokenizer
- AdamW
- Warmup-Stable-Decay learning-rate schedule
- Maximal Update Parameterization ($\mu P$) for learning-rate transfer

They validate $\mu P$ transfer from $d_{model}=128$ to $1024$. The best learning rate at the smallest width remains near-optimal at larger widths, with less than $1\%$ loss difference across architectures.

### Main scaling result

Overall scaling order:

1. MoE
2. Looped-MoE
3. Base
4. dense Looped

The thesis-relevant result is that Looped-MoE beats the dense Base model while storing fewer unique parameters.

Fitted scaling exponents:

| Model | Scaling exponent |
|---|---:|
| Base | 0.076 |
| Looped-MoE | 0.077 |

The slopes are nearly identical, but the Looped-MoE curve is shifted downward. It reaches lower loss at matched active parameter count and compute.

### Downstream results

At $10^{18}$ FLOPs, they evaluate compute-optimal models on AI2 OLMES Core 9.

| Model | Stored params | Core 9 average |
|---|---:|---:|
| Looped | 168M | 37.4 |
| Base | 246M | 38.7 |
| Looped-MoE | 216M | 39.6 |
| MoE | 366M | 36.4 |

Looped-MoE gets the best Core 9 average while storing fewer parameters than Base.

The full MoE model has the best test-loss scaling but the lowest Core 9 score. The authors suggest Looped-MoE may give tokens broader expert coverage because tokens can see different experts across loop passes.

### Expert routing analysis

The key mechanistic test compares expert assignments between loop pass 1 and loop pass 2.

Because each token uses 2 of 8 experts, the expert sets can be:

- identical
- partially overlapping
- disjoint

Observed behavior:

- only $4\%$-$14\%$ of tokens receive identical expert assignments across most layers
- $25\%$-$53\%$ receive entirely non-overlapping assignments
- most tokens share one expert and change one expert

This supports the central mechanism: Looped-MoE is not just repeating the same computation. Sparse routing gives the reused layer different expert sub-networks at different loop depths.

Layer 7 is an exception with much higher routing consistency. The authors speculate that it may stabilize representations before the vocabulary projection at the loop boundary.

### Early-exit method

The paper studies training-free early exit.

At candidate exit points:

- project the hidden state to vocabulary logits
- compute output entropy
- exit if entropy is below a threshold

Lower entropy means higher confidence.

Exit placement:

- non-looped models can exit at any intermediate layer
- looped models exit only at loop boundaries

This gives looped models fewer exit points, but they still show better compute-quality trade-offs.

### Early-exit results

At $10\%$ FLOPs saved:

| Model | Full-depth perplexity | Perplexity at 10% FLOPs saved |
|---|---:|---:|
| Base | 34.8 | 55.4 |
| MoE | 34.8 | 75.7 |
| Looped | 36.2 | 50.2 |
| Looped-MoE | 35.9 | 51.0 |
| Looped-MoE 4x4 | 35.4 | 44.3 |
| Looped-MoE 2x8 | 37.3 | 42.0 |

The lesson is that looping, not sparsity alone, improves early-exit behavior. MoE alone degrades fastest.

More loops help because they create more loop-boundary exit points:

- $8 \times 2$ has fewer boundaries
- $4 \times 4$ has more
- $2 \times 8$ has even more

The $2 \times 8$ Looped-MoE model has worse full-depth perplexity than some alternatives, but much better perplexity under compute savings.

### Why loop boundaries are good exits

Loop boundaries are high-quality exit points because each loop ends with the same physical layers that are also used before final output. Those layers are repeatedly trained to produce output-ready representations.

The authors test this with a logit-lens-style analysis:

- project intermediate hidden states through final norm and LM head
- compare intermediate output distribution to final output distribution
- use Jensen-Shannon divergence

Looped models show sharp convergence jumps at loop boundaries. By the end of the first loop, many tokens are already close to the final output distribution.

Non-looped models do not show this as strongly because their intermediate layers are not trained to be output-facing.

### Limitations

- Models are still small: largest active count is about 305M, with stored MoE parameters up to 711M.
- Effective depth is fixed and scaling mostly happens through width.
- $\mu P$ does not transfer cleanly when depth changes.
- Early-exit savings are theoretical FLOP savings, not measured end-to-end serving speedups.
- Real speedups depend on batching, routing overhead, KV-cache behavior, hardware utilization, and serving implementation.

## Takeaways

- Dense looped transformers save stored weights but lose expressivity.
- Sparse MoE FFNs let reused layers perform different computations across loops.
- Use active parameters, not stored parameters, for fair FLOP accounting.
- Looped-MoE can beat dense Base models at matched compute while storing fewer parameters.
- Looping is the main reason early exits work well; MoE alone is not enough.
- More loop boundaries can improve the early-exit trade-off.

## Related
- [Looped Language Models (Ouro)](/atlas/ai/deep-learning/looped-language-models-ouro)
- [Transformer Scaling Rules](/atlas/ai/deep-learning/transformer-scaling-rules)
- [Scaling Laws](/atlas/ai/deep-learning/scaling-laws)
- [Test-Time Compute](/atlas/ai/deep-learning/test-time-compute)
- [LLM Inference Economics](/atlas/ai/deep-learning/serving/llm-inference-economics)
