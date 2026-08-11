---
title: "RoPE Scaling"
date: 2026-04-08
lastmod: 2026-08-11
tags:
  - ai/llm
  - theory
draft: false
---

## Summary

RoPE scaling covers the family of techniques used to extend a model's context window beyond its original training length by changing how rotary frequencies are applied. The main practical tools are **adjusted base frequency (ABF)** during continued training and **YaRN-style extrapolation** at inference or during a short adaptation stage.

## Concepts
- **Rotary Positional Embeddings (RoPE):** Encodes position by rotating the Query and Key vectors in the complex plane.
- **ABF:** adjusted base frequency, where the RoPE base $\theta$ is increased as context grows.
- **YaRN:** a non-uniform RoPE scaling method that supports train-short, test-long extrapolation.
- **LongRoPE:** A method that uses non-uniform scaling of frequencies to preserve performance across different context lengths.
- **Base Frequency ($\theta$):** The fundamental constant in RoPE. Increasing $\theta$ (e.g., from 10k to 500k) effectively "stretches" the rotation, allowing the model to distinguish positions over much longer sequences.
- **Base-$\beta$ view:** interpretation of RoPE dimensions as digits of a mixed/base-$\beta$ positional code.
- **Position interpolation:** compressing long positions into the range seen during training.
- **Position extrapolation:** using positions beyond the training range without compressing them.
- **ReRoPE:** a hybrid approach that preserves local positions while compressing distant positions.
- **p-RoPE:** partial RoPE, where only a fraction of each query/key head receives rotary position encoding.

## Content

### 1. RoPE mechanism

For each two-dimensional pair in the query/key vector, RoPE applies a rotation whose angle depends on position:

$$
\operatorname{RoPE}(x_m, m)
=
\mathcal{R}_m x_m
$$

with:

$$
\mathcal{R}_m
=
\begin{bmatrix}
\cos(m\theta_i) & -\sin(m\theta_i) \\
\sin(m\theta_i) & \cos(m\theta_i)
\end{bmatrix}
$$

For dimension pair $i$:

$$
\theta_i = b^{-2i/d}
$$

where:

- $b$ is the RoPE base
- $d$ is the head dimension
- lower $i$ means higher frequency
- higher $i$ means lower frequency

The useful property is that attention scores become functions of relative position:

$$
\left(\mathcal{R}_m q\right)^\top
\left(\mathcal{R}_n k\right)
=
q^\top \mathcal{R}_{n-m} k
$$

This is why RoPE gives a relative-position inductive bias while staying compatible with standard attention kernels.

### 2. Scaling in Llama 3

Llama 3 used a base frequency of **500,000** (compared to 10,000 for Llama 2). This change allows the model to handle contexts up to 128k tokens. 

### 3. Why scale $\theta$?
When sequence length $L$ exceeds the training length $L_{train}$, the "rotation" of the embedding for tokens at $L$ becomes "out of distribution" for the model. 
- By increasing the base $\theta$, the rotation per token is **decreased**, keeping the total rotation within the range the model learned during pretraining.

### 4. RoPE as base-$\beta$ encoding

The kexue.fm series gives a useful mental model:

> RoPE behaves like a positional number system.

Since:

$$
\theta_i = b^{-2i/d}
$$

define:

$$
\beta = b^{2/d}
$$

Then each frequency dimension acts like a digit position in a base-$\beta$ representation. With $d/2$ rotary pairs, the largest representable range is loosely analogous to:

$$
\beta^{d/2} - 1 = b - 1
$$

So if we want to represent positions:

$$
0,1,\ldots,L-1
$$

the crude requirement becomes:

$$
b \gtrsim L
$$

This is not a rigorous theorem about model quality, but it gives the right engineering intuition:

> Longer context usually needs a larger RoPE base.

It also explains why simply keeping the original base while extending context can fail: the model is forced to reuse or over-rotate positional phases outside the range it learned.

### 5. Nuance: High vs. Low Frequencies
Scaling RoPE is not uniform:
- **Low-frequency dimensions**: Carry coarse-grained positional information. These are often "stretched" or interpolated.
- **High-frequency dimensions**: Carry fine-grained local information. These are often left untouched to maintain local precision.

In the base-$\beta$ view:

- high-frequency dimensions behave like low-order digits
- low-frequency dimensions behave like high-order digits

Changing all dimensions uniformly is like changing every digit scale at once. That can preserve long-range uniqueness while hurting short-range precision.

This is why many practical methods use **non-uniform scaling**:

- preserve local/high-frequency behavior
- stretch only the lower-frequency dimensions that encode long-range position

### 6. Direct extrapolation vs interpolation

There are two broad strategies.

**Direct extrapolation** keeps the original position index:

$$
m \mapsto m
$$

This preserves local distances exactly, but positions beyond training length may produce unfamiliar rotations.

**Position interpolation** maps a longer context back into the training range:

$$
m \mapsto \frac{m}{s}
$$

where:

$$
s = \frac{L_{\text{target}}}{L_{\text{train}}}
$$

This avoids out-of-distribution absolute angles, but it compresses all distances. Local neighbors no longer look as local as they did during training.

The tradeoff is:

- direct extrapolation preserves local geometry but risks OOD long positions
- interpolation keeps positions in range but distorts local distances

### 7. ReRoPE intuition

ReRoPE tries to combine the good parts of extrapolation and interpolation.

For a relative distance:

$$
r = |m-n|
$$

use something like:

$$
r' =
\begin{cases}
r, & r \leq w \\
w + \frac{r-w}{s}, & r > w
\end{cases}
$$

where:

- $w$ is a local window preserved exactly
- $s$ is a compression factor for longer distances

The idea:

- nearby tokens keep the exact positional geometry learned during training
- faraway tokens are compressed so their effective distances remain manageable

This aligns with the practical observation that local syntax and short-range dependency modeling are very sensitive to positional distortion, while far-range retrieval can tolerate coarser position resolution.

### 8. ABF in practice

ABF is the simplest practical recipe:

- pretrain mostly at short context
- increase $\theta$ when extending context
- retune if short-context quality regresses

The Smol Training Playbook gives a concrete example:

- `4k -> 32k`: increase $\theta$ to about `2M`
- `32k -> 64k`: increase $\theta$ to about `5M`

They also found that pushing higher, like `10M`, slightly improved long-context scores but hurt some short-context tasks. That is a good reminder that “bigger theta” is not automatically better.

### 9. YaRN extrapolation

`YaRN` is a more flexible strategy that scales RoPE dimensions non-uniformly. It is useful when you want to extrapolate beyond the length seen in training.

The practical pattern is:

- adapt the model to a moderately long context
- then use `YaRN` to stretch somewhat further at inference

This supports a:

$$
\text{train shorter, test somewhat longer}
$$

workflow, but the extrapolation budget is finite. SmolLM3 could extrapolate from `64k` to `128k` reasonably, but not cleanly to `256k`.

### 10. Practical design rules

- Choose the RoPE base with the intended maximum context in mind, not only the initial training length.
- Do not increase $b$ blindly; too large a base can underuse high-frequency variation and hurt short-context quality.
- Preserve high-frequency/local dimensions when extending context.
- Use continued training when the target length is far beyond the original distribution.
- Treat `train short, infer very long` as a limited extrapolation trick, not a free context extension.
- Evaluate both retrieval-style long-context tasks and normal short-context tasks after changing RoPE.

### 10.1 Partial RoPE as a cache and representation tradeoff

Not every query/key dimension must be rotary. With p-RoPE, split a head into:

$$
q = [q_{\text{rope}}, q_{\text{nope}}],
\qquad
k = [k_{\text{rope}}, k_{\text{nope}}]
$$

and rotate only a fraction $p$:

$$
\dim(q_{\text{rope}}) = p d
$$

This gives the model:

- position-sensitive dimensions for relative location
- position-independent dimensions for content matching

Gemma 4 uses:

- `p = 0.25` in global attention layers
- full RoPE in local layers
- base `1M` globally and `10k` locally

This division matches the jobs of the two layer types. Local layers need precise nearby geometry; global layers need broad content retrieval without spending every dimension on positional rotation.

Partial RoPE alone does not automatically shrink a conventional full `K + V` cache. In Gemma 4, the reported `37.5%` global-cache reduction comes from combining `p = 0.25` with key-as-value attention. The mechanisms should not be credited interchangeably.

## Related
- [Positional Encoding: From Sinusoidal Features to RoPE](/atlas/ai/architectures/transformers/positional-encoding-sinusoidal-to-rope)
- [Attention Mechanism](/atlas/ai/foundations/attention-mechanism)
- [No Positional Embeddings (NoPE)](/atlas/ai/architectures/transformers/no-positional-embeddings-nope)
- [Progressive Context Extension](/atlas/ai/training/scaling/progressive-context-extension)
- [The Smol Training Playbook](/atlas/ai/training/smol-training-playbook)
- [The Llama 3 Herd of Models](/atlas/ai/architectures/model-reports/the-llama-3-herd-of-models)
- [Context Parallelism](/atlas/systems/parallel-computing/context-parallelism)
- [Gemma 4 Technical Report](/atlas/ai/architectures/model-reports/gemma-4-technical-report)

## Sources

- Su Jianlin, [Transformer升级之路：10、RoPE是一种β进制编码](https://kexue.fm/archives/9675)
- Su Jianlin, [Transformer升级之路：11、将β进制位置进行到底](https://kexue.fm/archives/9706)
- Su Jianlin, [Transformer升级之路：12、无限外推的ReRoPE？](https://kexue.fm/archives/9708)
- Su Jianlin, [Transformer升级之路：16、“复盘”长度外推技术](https://kexue.fm/archives/9948)
- Su Jianlin, [Transformer升级之路：18、RoPE的底数选择原则](https://kexue.fm/archives/10122)
- Gemma Team, [Gemma 4 Technical Report](https://arxiv.org/abs/2607.02770)
