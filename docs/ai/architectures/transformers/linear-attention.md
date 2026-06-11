---
title: "Linear Attention"
date: 2026-06-11
lastmod: 2026-06-11
tags:
  - ai/llm
  - transformers
  - attention
draft: false
---

## Summary

Linear attention replaces the quadratic attention matrix with a computation that can be rearranged into linear time in sequence length. The promise is long-context efficiency; the difficulty is matching softmax attention's ability to sharply focus on specific tokens.

The core tradeoff is:

$$
O(n^2) \text{ expressivity}
\quad \text{vs.} \quad
O(n) \text{ scalable state updates}
$$

## Concepts

- **Linear attention:** attention variant whose cost scales linearly with sequence length after algebraic rearrangement.
- **Kernelized attention:** rewrites softmax attention with feature maps so associativity can be used.
- **Causal recurrent form:** linear attention can be implemented as a running state.
- **Concentration ability:** ability to place most attention mass on a small number of tokens.
- **Short convolution:** small local convolution added to $Q,K,V$ or hidden states to recover local token mixing.
- **Delta rule:** update rule used in DeltaNet-style linear attention to make the memory state more adaptive.

## 1. Standard attention bottleneck

Softmax attention computes:

$$
O
=
\operatorname{softmax}
\left(
\frac{QK^\top}{\sqrt{d}}
\right)V
$$

For sequence length $n$:

$$
QK^\top \in \mathbb{R}^{n \times n}
$$

so the score matrix is quadratic:

$$
O(n^2)
$$

This is expensive for long-context pretraining and inference.

## 2. Simplest linear attention

If we remove softmax and causal masking for the moment:

$$
O = QK^\top V
$$

Associativity gives:

$$
O = Q(K^\top V)
$$

Now:

$$
K^\top V \in \mathbb{R}^{d \times d_v}
$$

so we avoid materializing the full $n \times n$ attention matrix.

Cost becomes roughly:

$$
O(nd^2)
$$

instead of:

$$
O(n^2d)
$$

For long sequences where $n \gg d$, this is much cheaper.

## 3. Kernelized softmax approximation

Softmax attention can be written:

$$
\operatorname{softmax}(QK^\top)V
$$

If:

$$
\exp(q^\top k)
\approx
\phi(q)^\top \phi(k)
$$

then:

$$
O_i
=
\frac{
\sum_{j \leq i}\phi(q_i)^\top \phi(k_j)v_j
}{
\sum_{j \leq i}\phi(q_i)^\top \phi(k_j)
}
$$

Rearrange:

$$
O_i
=
\frac{
\phi(q_i)^\top
\left(
\sum_{j \leq i}\phi(k_j)v_j^\top
\right)
}{
\phi(q_i)^\top
\left(
\sum_{j \leq i}\phi(k_j)
\right)
}
$$

Define recurrent states:

$$
S_i = S_{i-1} + \phi(k_i)v_i^\top
$$

$$
z_i = z_{i-1} + \phi(k_i)
$$

Then:

$$
O_i
=
\frac{\phi(q_i)^\top S_i}
{\phi(q_i)^\top z_i}
$$

This is the key linear-attention trick: the past is summarized into fixed-size states.

## 4. Why linear attention can underperform

The kexue.fm discussion emphasizes that "low rank" is not the only problem.

In causal attention, the lower-triangular attention matrix can be full-rank, so the usual "linear attention is low-rank" explanation is incomplete.

A better failure mode is **weaker concentration**.

Softmax can make one token dominate:

$$
\alpha_j
=
\frac{\exp(q^\top k_j)}
{\sum_l \exp(q^\top k_l)}
$$

If one score is much larger:

$$
q^\top k_j \gg q^\top k_l
$$

then:

$$
\alpha_j \approx 1
$$

Linearized variants often have a harder time producing this kind of sharp retrieval. They summarize history into state variables, which is efficient, but the summary can blur token-level selection.

So the practical weakness is:

> linear attention is often worse at "pointing" to a precise past token.

This matters for:

- copying
- retrieval
- induction heads
- code dependencies
- long-range exact references

## 5. Why short convolution helps

Many modern linear-attention models add short convolution to $Q,K,V$ or to the hidden states.

A generic local convolution is:

$$
\tilde x_t
=
\sum_{\tau=0}^{w-1}
a_\tau x_{t-\tau}
$$

where $w$ is a small window.

The superficial explanation is:

> it adds local token mixing.

The deeper intuition is that linear attention's global state is good at carrying compressed long-range information but weaker at local precise interactions. Short convolution gives the model a cheap local path:

- nearby tokens can interact before entering the global linear-attention state
- local n-gram structure does not need to be encoded only through the recurrent memory
- the attention module can spend capacity on longer-range accumulation

In other words:

$$
\text{short conv handles local precision}
\quad+\quad
\text{linear attention handles long-range state}
$$

This is similar in spirit to architectures that combine sliding-window attention with occasional global attention.

## 6. Delta-rule intuition

DeltaNet-style models modify the memory update so the state is not just an additive accumulation.

Simple additive memory:

$$
S_t = S_{t-1} + k_t v_t^\top
$$

can accumulate stale or conflicting associations.

A delta-style update uses prediction error:

$$
S_t
=
S_{t-1}
+
\eta_t k_t
\left(
v_t - S_{t-1}^\top k_t
\right)^\top
$$

The term:

$$
v_t - S_{t-1}^\top k_t
$$

is the value information not already predicted by the current state.

This turns the memory update into something closer to online learning:

- write new information
- reduce redundant writes
- correct the state when it predicts badly

That is why DeltaNet-like mechanisms are a major branch of modern linear attention.

## 7. L2 normalization in DeltaNet-like models

Some linear-attention variants normalize $Q$ and $K$:

$$
\hat q = \frac{q}{\|q\|_2}
$$

$$
\hat k = \frac{k}{\|k\|_2}
$$

This controls the scale of state reads and writes.

Without normalization, large-norm keys can dominate memory updates:

$$
k_t v_t^\top
$$

and large-norm queries can produce unstable retrieval from the state:

$$
q_t^\top S_t
$$

L2 normalization makes the operation depend more on direction than magnitude, which stabilizes the recurrent memory dynamics.

## 8. When linear attention is attractive

Linear attention is most attractive when:

- context length is very large
- exact token retrieval is not the main bottleneck
- recurrent/stateful inference is valuable
- training/inference memory is dominated by attention
- the architecture includes local paths such as short convolution

It is risky when:

- exact copying matters
- long-context retrieval benchmarks matter
- the model must compete with strong softmax-attention baselines at the same scale
- kernel support and implementation maturity are weak

## 9. Practical mental model

Softmax attention stores a flexible interaction graph:

$$
\text{token} \leftrightarrow \text{token}
$$

Linear attention stores a compressed state:

$$
\text{past tokens} \rightarrow \text{state}
$$

This is the architectural tradeoff.

The central question is not:

> can linear attention approximate softmax attention?

The better question is:

> is the task better served by explicit token retrieval or by a compact recurrent memory?

## Related

- [Attention Variants](/atlas/ai/architectures/transformers/attention-variants)
- [KV Cache](/atlas/ai/inference-serving/caching/kv-cache)
- [Progressive Context Extension](/atlas/ai/training/scaling/progressive-context-extension)
- [Transformer Scaling Rules](/atlas/ai/training/scaling/transformer-scaling-rules)

## Sources

- Su Jianlin, [线性Attention的探索：Attention必须有个Softmax吗？](https://kexue.fm/archives/7546)
- Su Jianlin, [Transformer升级之路：3、从Performer到线性Attention](https://kexue.fm/archives/8338)
- Su Jianlin, [Transformer升级之路：5、作为无限维的线性Attention](https://kexue.fm/archives/8601)
- Su Jianlin, [注意力机制真的可以“集中注意力”吗？](https://kexue.fm/archives/9889)
- Su Jianlin, [线性注意力简史：从模仿、创新到反哺](https://kexue.fm/archives/11033)
- Su Jianlin, [为什么线性注意力要加Short Conv？](https://kexue.fm/archives/11320)
- Su Jianlin, [为什么DeltaNet要加L2 Normalize？](https://kexue.fm/archives/11486)
