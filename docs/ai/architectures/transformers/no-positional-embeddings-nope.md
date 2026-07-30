---
title: "No Positional Embeddings (NoPE)"
date: 2026-07-30
lastmod: 2026-07-30
tags:
  - ai/llm
  - theory
draft: false
---

## Summary

**NoPE** means using self-attention without learned, sinusoidal, rotary, relative, or linear positional encodings. In a causal decoder, this does not necessarily make the model position-blind: the causal mask gives different tokens different visible prefixes, and the network can learn implicit absolute and relative position information from that asymmetry.

Pure NoPE is a useful baseline and can generalize well beyond the training lengths on some tasks. The more compelling practical design is often **layer-wise hybrid attention**:

- local or sliding-window layers use RoPE to model order, locality, and recency
- global full-attention layers use NoPE for position-independent retrieval

NoPE removes positional operations and RoPE-specific extrapolation machinery, but it does **not** reduce the quadratic cost of full attention or the KV-cache size by itself.

## 1. What NoPE changes

Ordinary causal self-attention without an explicit positional mechanism is:

$$
A
=
\operatorname{softmax}
\left(
\frac{QK^\top}{\sqrt{d_h}} + M_{\text{causal}}
\right)
$$

$$
Y = AV
$$

where:

$$
Q=XW_Q,\qquad K=XW_K,\qquad V=XW_V
$$

There is no:

- position embedding added to $X$
- rotation applied to $Q$ or $K$
- learned relative-position bias added to the logits
- distance-dependent slope such as ALiBi

For a RoPE implementation, a NoPE layer is therefore not a new attention algorithm. It is the same attention path with the `apply_rotary_pos_emb` step omitted.

## 2. Why a causal NoPE model can still know position

Without positional encoding and without a mask, self-attention is permutation equivariant. A causal decoder is different because token $i$ can attend only to:

$$
\{0,\ldots,i\}
$$

The number and content of visible predecessors vary with $i$. This creates an asymmetric computational graph from which later layers can infer position.

Haviv et al. found that decoder-only language models without explicit positional encodings remained competitive across their tested datasets, model sizes, and sequence lengths. Linear probes recovered absolute position increasingly well through the network. Their proposed explanation is that the causal mask lets a token infer information about the number of predecessors it can attend to.

This should not be generalized to every Transformer:

- a bidirectional encoder does not receive the same prefix-length signal
- padding and document masks change the available positional cues
- packed sequences must prevent attention across document boundaries
- implicit position learning consumes model capacity and depends on optimization
- recognizing order is not the same as extrapolating reliably at arbitrary lengths

## 3. What the evidence establishes

### 3.1 Pure NoPE can be competitive

Haviv et al. (2022) compared causal language models using no explicit position encoding with learned absolute embeddings, sinusoidal embeddings, and ALiBi. Their NoPE models learned implicit position information and were competitive in language modeling.

This establishes that explicit position embeddings are not strictly necessary for causal language modeling. It does not establish that NoPE is always better than RoPE in large production LLMs.

### 3.2 NoPE can improve length generalization

Kazemnejad et al. (2023) compared NoPE, absolute embeddings, T5 relative bias, ALiBi, and RoPE in decoder-only Transformers on reasoning and mathematical length-generalization tasks. In that setting:

- NoPE outperformed the explicit positional methods
- it added no positional computation
- it could theoretically represent absolute and relative positional functions
- models trained with SGD tended to learn attention patterns resembling T5-style relative bias

The scope matters: these were controlled downstream tasks, not a demonstration that a general-purpose pretrained LLM with pure NoPE dominates RoPE.

### 3.3 Hybrid layers create a useful division of labor

Yang et al. (2025) compared 8B RoPE, NoPE, and QK-Norm variants. Pure NoPE showed stronger retrieval-like attention but worse validation loss and short-context benchmarks than pure RoPE. They then interleaved the mechanisms and observed an emergent specialization:

- RoPE layers concentrated on recent and local information
- NoPE layers became long-range retrieval layers with weaker recency bias

Their final **RNoPE-SWA** layout repeated:

1. three RoPE sliding-window attention layers
2. one global full-attention NoPE layer

The RoPE window was `4,096`, giving a `1:3` global-to-local ratio. The reported 8B models were pretrained on `5T` tokens, then progressively extended from `8k` to `32k` and `128k`. The hybrid model extrapolated much better than the RoPE baseline on their retrieval tests while remaining competitive on short-context benchmarks.

This result supports a practical hypothesis:

> positional layers are good local sequence mixers; global NoPE layers are good content-addressed retrievers.

The result is architectural and training-dependent. The ratio, window, and layer placement should be ablated rather than copied blindly.

### 3.4 New hybrid models use related patterns

Recent model reports reinforce the layer-wise design:

- **MAI-Thinking-1** uses five local RoPE sliding-window layers followed by one global layer without positional encoding.
- **Kimi K3** reports no positional embeddings: KDA decay supplies recency information, while global NoPE layers avoid RoPE interpolation during context extension.
- Qiao et al. (2026) report that, in efficient/full-attention hybrids, long-range retrieval is primarily carried by full-attention layers; applying NoPE only to those layers improves long-context performance with little short-context degradation in their experiments.

These systems should not be treated as identical. NoPE inside an SWA/full-attention Transformer and NoPE combined with a recurrent decay mechanism have different sources of order and recency information.

## 4. Pure NoPE, hybrid NoPE, and partial RoPE are different

| Design | Where position enters | Primary purpose |
|---|---|---|
| Pure NoPE | Only indirectly through the causal/masking structure | Remove explicit positional bias |
| RoPE/NoPE hybrid | RoPE in some layers; none in other layers | Separate local ordering from global retrieval |
| Partial RoPE (`p-RoPE`) | Only a subset of each head is rotated | Preserve both positional and content-only subspaces within one layer |
| MLA `d_nope + d_rope` | A small RoPE subspace plus an unrotated latent-cache-compatible subspace | Keep positional signal while enabling compressed KV caching |
| Decay + NoPE | Recency comes from recurrent/decay dynamics; attention has no explicit PE | Combine stateful ordering with global retrieval |

An unrotated `d_nope` subspace inside an MLA or p-RoPE layer is not a full NoPE layer. The remaining rotated dimensions still make that layer explicitly position-aware.

## 5. Minimal implementation

For a model that already supports RoPE, make positional treatment a per-layer choice:

```python
def attention(q, k, v, *, cos=None, sin=None, use_rope=True, attn_mask=None):
    if use_rope:
        if cos is None or sin is None:
            raise ValueError("RoPE layers require cos and sin")
        q, k = apply_rotary_pos_emb(q, k, cos, sin)

    return torch.nn.functional.scaled_dot_product_attention(
        q,
        k,
        v,
        attn_mask=attn_mask,
        is_causal=attn_mask is None,
    )
```

A `3:1` local/global schedule can be selected at construction time:

```python
for layer_idx in range(num_layers):
    is_global_nope = (layer_idx + 1) % 4 == 0
    blocks.append(
        TransformerBlock(
            use_rope=not is_global_nope,
            sliding_window=None if is_global_nope else 4096,
        )
    )
```

Important implementation details:

- Keep the causal mask in NoPE layers.
- During packed training, apply a block-diagonal document mask; causal masking alone would leak across documents.
- Store and propagate absolute cache positions only where RoPE layers need them. NoPE layers still need correct causal-cache masking.
- Do not apply RoPE and then call the result NoPE because the rotation is later ignored elsewhere; the query/key vectors entering the dot product must be unrotated.
- Verify that fused attention kernels do not apply RoPE implicitly.
- Keep all non-positional variables identical in the ablation: initialization, data order, tokens, optimizer, schedule, and attention span.

Removing RoPE from an already pretrained model is an architectural intervention, not a zero-cost inference switch. The attention distributions were learned with rotated queries and keys, so continued training is normally required.

## 6. Benefits and costs

### Benefits

- no position-embedding parameters or rotary computation
- no RoPE base, interpolation factor, or frequency schedule to tune in NoPE layers
- no RoPE phase extrapolation when context exceeds the training length
- content similarity is not modulated directly by relative rotation
- global NoPE layers can complement recency-biased local layers

### Costs and risks

- full NoPE attention is still $O(L^2)$
- KV-cache memory is unchanged for the same attention projection
- pure NoPE may underperform RoPE on ordinary short-context quality
- exact order, distance, and recency must be learned indirectly
- strong retrieval results on synthetic needles do not guarantee reasoning over long contexts
- extrapolation can fail through attention dilution even when no RoPE phase goes out of distribution
- evidence at one scale or data mixture may not transfer to another

## 7. Recommended experiment

When designing a new causal LLM, compare at least:

1. full RoPE baseline
2. pure NoPE
3. alternating RoPE/NoPE
4. RoPE-SWA plus global NoPE, testing ratios such as `1:1`, `1:3`, and `1:5`

Evaluate both within and beyond the trained context:

- validation loss and short-context downstream tasks
- passkey and multi-needle retrieval at multiple depths
- long-document QA with distractors
- order-sensitive and relative-distance tasks
- code tasks where declaration order and distant symbol retrieval both matter
- attention mass, entropy, sinks, and recency bias by layer type
- prefill throughput and memory at the target serving lengths

The central ablation is not only “RoPE versus NoPE.” It is:

> Which layers need explicit order, which layers need unrestricted retrieval, and what other mechanism supplies locality or recency?

## Related

- [RoPE Scaling](/atlas/ai/architectures/transformers/rope-scaling)
- [Attention Variants](/atlas/ai/architectures/transformers/attention-variants)
- [Kimi K3: Open Frontier Intelligence](/atlas/ai/architectures/model-reports/kimi-k3-open-frontier-intelligence)
- [MAI-Thinking-1: Building a Hill-Climbing Machine](/atlas/ai/architectures/model-reports/mai-thinking-1-building-a-hill-climbing-machine)
- [Progressive Context Extension](/atlas/ai/training/scaling/progressive-context-extension)
- [KV Cache](/atlas/ai/inference-serving/caching/kv-cache)

## Sources

- Haviv et al., [Transformer Language Models without Positional Encodings Still Learn Positional Information](https://aclanthology.org/2022.findings-emnlp.99/) (Findings of EMNLP 2022)
- Kazemnejad et al., [The Impact of Positional Encoding on Length Generalization in Transformers](https://proceedings.neurips.cc/paper_files/paper/2023/hash/4e85362c02172c0c6567ce593122d31c-Abstract-Conference.html) (NeurIPS 2023)
- Yang et al., [Rope to Nope and Back Again: A New Hybrid Attention Strategy](https://arxiv.org/abs/2501.18795) (2025)
- Qiao et al., [Rethinking the Role of Efficient Attention in Hybrid Architectures](https://arxiv.org/abs/2606.15378) (2026)
- Kimi Team, [Kimi K3: Open Frontier Intelligence — Technical Report](https://github.com/MoonshotAI/Kimi-K3/blob/main/k3_tech_report.pdf) (2026)
- Microsoft AI, [MAI-Thinking-1: Building a Hill-Climbing Machine](https://microsoft.ai/wp-content/uploads/2026/06/main_20260602_2.pdf) (2026)
