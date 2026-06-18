---
title: "Attention Variants"
date: 2026-06-08
lastmod: 2026-06-18
tags:
  - ai/llm
  - transformers
  - attention
draft: false
---

## Summary

Modern transformers do not all use the same attention pattern. The main variants differ in **who can attend to whom**, **how many KV heads are stored**, and **whether attention is computed in the original token space or through a compressed latent representation**.

The core tradeoff is:

- **more expressive attention** usually means more compute and a larger KV cache
- **more shared or compressed attention** usually means cheaper inference, but can hurt quality if pushed too far

## Concepts

- **MHA:** multi-head attention, where each query head has its own key and value head.
- **MQA:** multi-query attention, where all query heads share a single KV head.
- **GQA:** grouped-query attention, where several query heads share one KV head.
- **MLA:** multi-head latent attention, where keys and values are compressed into a low-dimensional latent cache.
- **Sliding-window attention:** local attention where each token attends only to a fixed neighborhood.
- **Linear attention:** attention family that avoids materializing the full $n \times n$ attention matrix by summarizing history into fixed-size states.
- **FlashAttention:** exact attention kernel that reduces memory traffic by tiling attention and avoiding materialized $n\times n$ attention matrices.
- **Cross-attention:** queries come from one sequence, while keys and values come from another.
- **Local attention:** attention restricted to a window or local region.
- **Global attention:** unrestricted full-sequence attention, or in some architectures, attention involving globally visible tokens.

## 1. Why attention has so many variants

Standard self-attention is powerful, but expensive:

$$
\mathrm{Attn}(Q,K,V) = \mathrm{softmax}\left(\frac{QK^\top}{\sqrt{d_k}}\right)V
$$

For a sequence of length $n$, the attention matrix is $n \times n$, so the score computation scales quadratically in sequence length.

During autoregressive decoding, the more immediate bottleneck is often not the attention score matrix itself, but the **KV cache**. Each layer must store previous keys and values for all processed tokens.

Approximate per-token, per-layer KV cache size in elements:

$$
C_{\mathrm{kv}} \approx 2 \, h_{\mathrm{kv}} \, d_{\mathrm{head}}
$$

where:

- $h_{\mathrm{kv}}$ is the number of KV heads
- $d_{\mathrm{head}}$ is the head dimension
- the factor $2$ is for keys and values

This is why attention variants often target one of two bottlenecks:

- **reduce KV cache size**
- **reduce long-context attention cost**

## 2. Multi-Head Attention: the baseline

In standard **multi-head attention** (MHA):

- each head has its own query projection
- each head has its own key projection
- each head has its own value projection

If there are $h$ attention heads, then:

$$
h_{\mathrm{kv}} = h
$$

This is the most flexible baseline because each head can build its own retrieval pattern and store its own keys and values.

Advantages:

- strongest quality baseline
- most expressive head specialization
- conceptually simplest transformer attention

Disadvantages:

- largest KV cache
- expensive at long context and large batch decoding

Approximate per-token, per-layer cache:

$$
C_{\mathrm{MHA}} \approx 2 h d_{\mathrm{head}}
$$

## 3. Multi-Query Attention: minimum KV sharing

In **multi-query attention** (MQA):

- queries are still multi-head
- all heads share the same key head
- all heads share the same value head

So:

$$
h_{\mathrm{kv}} = 1
$$

and the cache becomes:

$$
C_{\mathrm{MQA}} \approx 2 d_{\mathrm{head}}
$$

This gives a major inference win because KV memory drops by about a factor of $h$ relative to MHA.

Advantages:

- minimal KV cache among standard head-sharing schemes
- better decode throughput and larger feasible batch/context

Disadvantages:

- all query heads read from the same KV representation
- can reduce model quality if the sharing is too aggressive

MQA is attractive when serving is heavily KV-bound, but it is often a more aggressive quality tradeoff than modern LLMs want.

## 4. Grouped-Query Attention: the middle ground

In **grouped-query attention** (GQA):

- query heads are still numerous
- key/value heads are fewer
- multiple query heads share one KV head

If the model has $h$ query heads and $h_{\mathrm{kv}}$ KV heads:

$$
1 < h_{\mathrm{kv}} < h
$$

and cache size becomes:

$$
C_{\mathrm{GQA}} \approx 2 h_{\mathrm{kv}} d_{\mathrm{head}}
$$

This makes GQA a compromise between MHA and MQA.

Advantages:

- much smaller KV cache than MHA
- usually better quality than MQA
- now a common default in modern LLMs

Disadvantages:

- still a quality-memory tradeoff
- very aggressive grouping can start to behave like MQA

Practical view:

- **MHA** is the quality reference
- **GQA** is often the best default tradeoff
- **MQA** is the extreme memory-saving version

## 5. Latent attention and MLA

### A. Latent attention as a general idea

`Latent attention` is not one single canonical architecture in the way that `MHA` or `GQA` are. In practice, the term usually refers to attention mechanisms that introduce a **compressed latent bottleneck** instead of storing or manipulating full per-head token-space keys and values.

The main reason to do this is to reduce memory and bandwidth costs, especially at inference time.

### B. Multi-Head Latent Attention

The most important current example is **Multi-head Latent Attention (MLA)** from DeepSeek-V2/V3.

The main idea is:

- project the token state down into a lower-dimensional latent representation
- derive attention behavior from that compressed representation
- cache the latent representation instead of full keys and values

In DeepSeek-V2, the keys and values are jointly compressed into a latent vector:

$$
c_t^{KV} = W^{DKV} h_t
$$

where:

- $h_t$ is the token hidden state
- $c_t^{KV}$ is a compressed latent KV state
- $W^{DKV}$ is a down-projection

Conceptually, instead of caching full per-head $K_t$ and $V_t$, the model caches the latent state and reconstructs or uses it through learned projections.

Why this matters:

- standard MHA reduces quality risk but stores a large cache
- GQA and MQA shrink the cache by sharing KV heads
- MLA shrinks the cache by **compressing the stored representation itself**

This is a different idea than GQA/MQA. GQA and MQA share heads. MLA compresses the state.

Advantages:

- much smaller KV cache
- potentially much better decode throughput
- can retain strong model quality if designed well

Disadvantages:

- architecturally more complex
- less standard than GQA
- efficiency depends on implementation details, positional encoding design, and kernel support

Important nuance:

- **GQA/MQA** reduce cache by reducing the number of KV heads
- **MLA** reduces cache by reducing the dimensionality of what is cached

So MLA is closer to a **low-rank cache compression scheme** than a simple head-sharing scheme.

### C. GQA is already partly low-rank

A useful kexue.fm observation is that "MLA is low-rank" is not the full explanation.

If we concatenate all GQA keys and values for token $i$:

$$
c_i
=
\left[
k_i^{(1)},\ldots,k_i^{(g)},
v_i^{(1)},\ldots,v_i^{(g)}
\right]
\in
\mathbb{R}^{g(d_k+d_v)}
$$

then:

$$
c_i
=
x_i
\left[
W_k^{(1)},\ldots,W_k^{(g)},
W_v^{(1)},\ldots,W_v^{(g)}
\right]
=
x_i W_c
$$

In many LLM settings:

$$
g(d_k+d_v) < d
$$

so GQA itself can already be interpreted as projecting the hidden state into a lower-dimensional KV representation.

The sharper distinction is:

- GQA projects, then splits and repeats KV groups
- MLA projects into a latent state, then uses learned projections from that latent state
- MLA can use an identity transform at inference so the cache stores the latent state rather than expanded per-head keys and values

### D. MLA identity transform

Ignoring positional encoding, MLA can define:

$$
c_i = x_i W_c
$$

and then per head:

$$
q_t^{(s)} = x_t W_q^{(s)}
$$

$$
k_i^{(s)} = c_i W_k^{(s)}
$$

$$
v_i^{(s)} = c_i W_v^{(s)}
$$

The attention score is:

$$
q_t^{(s)} {k_i^{(s)}}^\top
=
\left(x_t W_q^{(s)}\right)
\left(c_i W_k^{(s)}\right)^\top
$$

which can be rewritten as:

$$
q_t^{(s)} {k_i^{(s)}}^\top
=
x_t
\left(W_q^{(s)} {W_k^{(s)}}^\top\right)
c_i^\top
$$

This is the key trick. At inference time, the model can absorb:

$$
W_q^{(s)} {W_k^{(s)}}^\top
$$

into the query-side projection, and cache only:

$$
c_i
$$

instead of caching every expanded:

$$
k_i^{(s)}, v_i^{(s)}
$$

Similarly, the value projection can be moved into the output-side projection. So, in the no-position-encoding case, MLA can behave like a high-capacity training form that is algebraically transformed into a much cheaper latent-cache inference form.

### E. Why RoPE complicates MLA

The identity transform above assumes that:

$$
W_q^{(s)} {W_k^{(s)}}^\top
$$

is position-independent.

With RoPE, queries and keys are multiplied by position-dependent rotation matrices:

$$
q_i^{(s)} = x_i W_q^{(s)} \mathcal{R}_i
$$

$$
k_i^{(s)} = c_i W_k^{(s)} \mathcal{R}_i
$$

Then:

$$
q_t^{(s)} {k_i^{(s)}}^\top
=
x_t
\left(
W_q^{(s)}
\mathcal{R}_{t-i}
{W_k^{(s)}}^\top
\right)
c_i^\top
$$

The middle matrix now depends on the relative position $t-i$:

$$
W_q^{(s)}\mathcal{R}_{t-i}{W_k^{(s)}}^\top
$$

so it cannot be merged into one fixed query projection.

This is the core MLA/RoPE conflict:

> MLA can use RoPE, but full RoPE breaks the clean identity transform that makes latent KV caching cheap.

The practical workaround is **Partial RoPE**:

- keep part of the key/query dimensions unrotated so they can use latent-cache factorization
- reserve a smaller part for RoPE so the model still gets relative position information

This explains why modern MLA designs often split head dimensions into:

$$
d_{\text{head}}
=
d_{\text{nope}} + d_{\text{rope}}
$$

where $d_{\text{nope}}$ participates in the latent-cache trick and $d_{\text{rope}}$ carries rotary position information.

### F. Why head dimension can matter more than number of KV groups

The kexue.fm MLA analysis argues that some of MLA's strength comes not only from cache compression, but from allowing larger effective head dimensions under a fixed KV-cache budget.

Under a cache budget, increasing the number of KV groups $g$ is not always the best use of memory. A larger per-head representation can be more valuable than more KV groups.

Practical heuristic:

- if the model is quality-limited, very small KV representations can bottleneck retrieval
- if the model is bandwidth-limited, full MHA may be impossible
- MLA and KV-shared variants try to spend cache budget on richer per-head dimensions rather than many independent KV groups

This helps explain why MLA can be competitive with or better than GQA even when both are designed around KV-cache reduction.

## 6. Sliding-window attention

In **sliding-window attention**, each token attends only to nearby tokens inside a fixed window of width $w$.

Instead of attending to all previous positions, token $t$ attends only to something like:

$$
\{t-w+1, \dots, t\}
$$

for causal local attention.

This changes the cost profile:

- full attention: roughly quadratic in sequence length
- sliding-window attention: roughly linear in sequence length for fixed window size

Advantages:

- much cheaper for long contexts
- easier to scale context length
- often a good fit when most useful dependencies are local

Disadvantages:

- weak at very long-range interactions if used everywhere
- information may need many layers to propagate across distant positions

Sliding-window attention is often paired with:

- occasional full/global attention layers
- special global tokens
- retrieval or recurrence mechanisms

## 7. Local attention and global attention

These terms are overloaded, so it is important to distinguish two meanings.

### A. Local vs global by connectivity pattern

In the generic sense:

- **local attention** means a token attends only to a limited neighborhood
- **global attention** means attention is not restricted to a local window

This is the broad meaning used in many long-context architectures.

### B. Local vs global in Longformer-style designs

In Longformer-style architectures:

- most tokens use local windowed attention
- a small set of designated positions can use **global attention**
- those global positions can attend broadly and can also be attended to broadly

So here `global attention` may mean **special globally connected tokens**, not necessarily a whole full-attention layer.

### C. Local vs global in MAI-Thinking-1

In the MAI-Thinking-1 report, the wording refers to a **periodic layer pattern**:

- several **local attention layers** using a sliding window
- then one **global attention layer** with unrestricted sequence-wide attention

This is different from the Longformer token-level usage. In MAI-Thinking-1, `global attention` means a **full-attention layer**, not just a handful of global tokens.

That design is useful because it gets most of the efficiency of local attention while still allowing periodic full-sequence information mixing.

Good mental model:

- local layers do the cheap dense work nearby
- global layers periodically resynchronize the full context

## 8. Cross-attention

In **self-attention**, queries, keys, and values all come from the same sequence.

In **cross-attention**, queries come from one sequence, while keys and values come from another:

$$
Q = X_Q W_Q,\qquad K = X_K W_K,\qquad V = X_K W_V
$$

where $X_Q$ and $X_K$ are different sources.

The classic transformer encoder-decoder uses this pattern:

- encoder produces a source representation
- decoder produces queries for the next output token
- decoder cross-attends to the encoder output

Cross-attention is useful whenever one representation must retrieve information from another:

- machine translation
- image-text models
- speech-text models
- retrieval-augmented architectures
- latent bottleneck models

Advantages:

- clean way to fuse two information sources
- natural for encoder-decoder and multimodal models

Disadvantages:

- adds compute and memory
- requires a second representation to attend over

## 9. How these variants differ

| Variant | Main idea | Main benefit | Main cost / risk |
| :--- | :--- | :--- | :--- |
| **MHA** | Separate Q/K/V heads for each head | strongest baseline expressivity | largest KV cache |
| **MQA** | all heads share one KV head | minimal KV cache | can hurt quality |
| **GQA** | groups of query heads share KV heads | good cache-quality tradeoff | still some quality loss vs MHA |
| **MLA** | compress KV state into a latent bottleneck | very strong cache reduction | more architectural complexity |
| **Linear attention** | summarize history into recurrent/kernel states | linear long-context scaling | weaker exact token retrieval |
| **Sliding-window** | each token attends locally | long-context efficiency | weaker long-range access |
| **Global attention** | unrestricted attention | full-context interaction | expensive |
| **Cross-attention** | query one sequence with another | multimodal / encoder-decoder fusion | extra compute path |

## 10. Practical design heuristics

### When to use MHA

- use it as the conceptual baseline
- use it when serving constraints are mild and quality is the priority

### When to use GQA

- use it as the default modern LLM choice
- especially good when KV cache matters but you do not want the full quality hit of MQA

### When to use MQA

- use it when decode memory or bandwidth is the dominant bottleneck
- expect more quality risk than GQA

### When to use MLA

- use it when inference efficiency and KV compression are central architectural goals
- especially relevant in systems designed around long context, high throughput, or strict memory budgets

### When to use sliding-window attention

- use it when context length is large and most dependencies are local
- pair it with occasional global mixing if long-range reasoning still matters

### When to use linear attention

- use it when the main constraint is long-context memory/compute
- pair it with local mechanisms such as short convolution if precise nearby interactions matter
- be careful on tasks that require exact retrieval or copying

### When to use cross-attention

- use it when the model must fuse different streams of information
- most relevant for encoder-decoder and multimodal systems

## 11. The important unifying idea

All of these attention variants are ways of deciding **where to spend capacity**:

- MHA spends capacity on per-head flexibility
- GQA and MQA spend less memory by sharing retrieval structure
- MLA spends less memory by compressing the cached state
- sliding-window attention spends less compute by restricting who can talk to whom
- global attention selectively restores full-context communication
- cross-attention lets one representation query another instead of mixing everything in one stream

So the real question is not "which attention is best?"

The real question is:

> Where is the bottleneck: quality, KV memory, bandwidth, latency, or long-context compute?

## Related

- [Attention Mechanism](/atlas/ai/foundations/attention-mechanism)
- [KV Cache](/atlas/ai/inference-serving/caching/kv-cache)
- [Transformer Scaling Rules](/atlas/ai/training/scaling/transformer-scaling-rules)
- [RoPE scaling](/atlas/ai/architectures/transformers/rope-scaling)
- [Attention Softmax and Scaling](/atlas/ai/architectures/transformers/attention-softmax-and-scaling)
- [FlashAttention](/atlas/ai/architectures/transformers/flashattention)
- [Linear Attention](/atlas/ai/architectures/transformers/linear-attention)
- [Context Parallelism](/atlas/systems/parallel-computing/context-parallelism)
- [Disaggregated Prefill-Decode Serving](/atlas/ai/inference-serving/serving-architectures/disaggregated-prefill-decode-serving)

## Sources

- DeepSeek-V2: A Strong, Economical, and Efficient Mixture-of-Experts Language Model: https://arxiv.org/abs/2405.04434
- Attention Is All You Need: https://papers.neurips.cc/paper/7181-attention-is-all-you-need.pdf
- Longformer: The Long-Document Transformer: https://arxiv.org/abs/2004.05150
- MAI-Thinking-1: Building a Hill-Climbing Machine: https://microsoft.ai/pdf/mai-thinking-1.pdf
- Su Jianlin, [缓存与效果的极限拉扯：从MHA、MQA、GQA到MLA](https://kexue.fm/archives/10091)
- Su Jianlin, [Transformer升级之路：20、MLA好在哪里?（上）](https://kexue.fm/archives/10907)
- Su Jianlin, [Transformer升级之路：21、MLA好在哪里?（下）](https://kexue.fm/archives/11111)
- Su Jianlin, [Transformer升级之路：19、第二类旋转位置编码](https://kexue.fm/archives/10862)
