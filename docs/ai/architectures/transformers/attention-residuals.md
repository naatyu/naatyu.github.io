---
title: "Attention Residuals"
date: 2026-07-27
lastmod: 2026-07-27
tags:
  - ai/llm
  - transformers
  - residual-connections
  - attention
draft: false
---

## Summary

Standard residual connections compress the entire history of a deep network into one running sum. Attention Residuals preserve several earlier representations and let each layer learn which depths to retrieve.

The method turns residual aggregation from:

$$
\text{uniform accumulation}
$$

into:

$$
\text{content-dependent depth selection}
$$

Kimi K3 makes the idea practical by attending over blocks of layers rather than every individual layer. This reduces memory and communication while retaining selective access to intermediate representations.

## Concepts

- **Residual stream:** the running hidden state carried through transformer layers.
- **Depth attention:** attention whose sources are representations from different layers rather than different token positions.
- **Pseudo-query:** a learned query associated with the destination layer, independent of the current token content.
- **Block Attention Residual:** memory-efficient variant that aggregates layer outputs within blocks before attention.
- **Online softmax merge:** incremental combination of attention statistics without materializing every score at once.

## 1. Limitation of ordinary residual accumulation

For residual blocks:

$$
x_{\ell+1}
=
x_\ell + F_\ell(x_\ell)
$$

unrolling gives:

$$
x_\ell
=
x_0+\sum_{i<\ell}F_i(x_i)
$$

Every previous layer contributes through the same addition. A later layer receives the total but loses direct control over the mixture.

This creates an information bottleneck across depth:

$$
\{x_0,F_0,\ldots,F_{\ell-1}\}
\rightarrow
\text{one accumulated vector}
$$

Even if the useful feature was clearest at an intermediate layer, later computation must recover it from the merged residual stream.

## 2. Attend over depth

Attention Residuals keep previous layer outputs as sources. Destination layer $\ell$ has a learned pseudo-query $q_\ell$ and each source has a learned key:

$$
a_{\ell i}
=
\operatorname{softmax}_i
\left(
\frac{q_\ell^\top k_i}{\sqrt{d_k}}
\right)
$$

The input to the layer is:

$$
r_\ell
=
\sum_{i<\ell} a_{\ell i}v_i
$$

This resembles token attention, but the attended axis is depth:

| Token attention | Attention Residual |
| --- | --- |
| sources are token positions | sources are earlier layers or blocks |
| query varies by token content | pseudo-query is learned per destination layer |
| retrieves from sequence history | retrieves from representation history |

Because the weights sum to one, the method produces a normalized mixture instead of an ever-growing residual sum.

## 3. Why a learned pseudo-query is enough

The query does not need to depend on the current token for the basic method to be useful. Different destination layers have different computational roles and can learn stable preferences:

- early layers may favor embeddings and local features
- middle layers may combine several depths
- late layers may retrieve both high-level and lower-level representations

This resembles learned skip-connection topology. The network discovers which earlier depths should feed each later depth rather than fixing every skip weight to one.

## 4. Full Attention Residual

With $L$ layers and hidden width $d$, keeping every layer output requires:

$$
O(Ld)
$$

activation storage per token. Each new layer also has more sources, yielding:

$$
O(L^2d)
$$

total mixing work across depth.

For fewer than roughly one hundred layers, the arithmetic may be affordable. The harder problem is moving and storing all source representations under tensor, pipeline, and context parallelism.

## 5. Block Attention Residual

Block Attention Residual groups consecutive layer outputs:

$$
B_j
=
\sum_{i\in\mathcal{B}_j}
F_i(x_i)
$$

Later layers attend over the block summaries:

$$
r_\ell
=
\sum_{j< b(\ell)}
a_{\ell j}B_j
$$

If there are $N$ blocks, source storage becomes:

$$
O(Nd)
$$

instead of:

$$
O(Ld)
$$

Kimi K3 uses blocks of twelve layers, eight blocks in total, and treats the embedding as an additional source. Layers inside a block still share a locally accumulated path; attention is used to select among the coarser depth stages.

This is a deliberate approximation:

- smaller blocks give finer depth selection
- larger blocks save more memory and communication

## 6. Efficient inference

Autoregressive inference processes layers sequentially. Attention over residual sources can use the same online-softmax identity used in tiled attention kernels.

For groups of scores, keep:

- the running maximum
- the running exponential sum
- the running weighted value sum

When a new source block arrives, rescale the old statistics and merge the new contribution. This avoids storing the full attention vector and supports block-wise distributed execution.

## 7. Relationship to ordinary residual design

Attention Residuals do not remove the need for normalization or stable layer transformations. They change how information crosses depth.

Ordinary residuals provide:

- a simple identity gradient path
- cheap accumulation
- no extra source storage

Attention Residuals provide:

- selective retrieval from earlier depths
- normalized mixing
- interpretable depth-routing weights

The cost is:

- more activations
- additional projection and softmax work
- more complicated distributed communication

Blockwise aggregation is what makes the trade-off plausible at large scale.

## 8. What to measure

Useful ablations should compare:

- standard residuals
- full Attention Residuals
- block variants at several block sizes
- parameter- and compute-matched deeper or wider baselines

Diagnostics should include:

- attention mass by source depth
- whether patterns vary across layer type
- gradient norm across depth
- activation memory and communication
- effect on exact retrieval and long-context tasks

One should not assume that learned depth weights prove a human-interpretable hierarchy. They show which sources the optimization uses, not why a semantic computation occurs there.

## Related

- [Residuals, Normalization, and Initialization](/atlas/ai/architectures/transformers/residual-normalization-and-initialization)
- [Attention Mechanism](/atlas/ai/foundations/attention-mechanism)
- [Kimi K3](/atlas/ai/architectures/model-reports/kimi-k3-open-frontier-intelligence)

## Sources

- Kimi Team, [Kimi K3: Open Frontier Intelligence — Technical Report](https://github.com/MoonshotAI/Kimi-K3/blob/main/k3_tech_report.pdf)
