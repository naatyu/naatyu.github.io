---
title: "Data-Constrained Scaling Laws"
date: 2026-06-26
lastmod: 2026-06-26
tags:
  - ai/training
  - scaling
  - data
draft: false
---

## Summary

Classic scaling laws assume that training tokens are effectively unique. Data-constrained scaling laws relax that assumption: when high-quality unique data is finite, repeated tokens have diminishing value and can introduce an overfitting penalty that depends on model size.

## Concepts

- **Unique tokens ($U_D$):** distinct useful training tokens available before repetition.
- **Repeated tokens ($R_D$):** extra epochs over the unique data, usually measured as repeats beyond the first pass.
- **Effective data ($D'$):** discounted token count after accounting for diminishing returns from repetition.
- **Capacity ratio ($N/U_D$):** model parameters relative to unique data; a proxy for overfitting pressure.
- **Data wall:** the regime where high-quality unique data becomes the bottleneck, not raw compute.

## 1. Why classic Chinchilla is data-infinite

The standard Chinchilla loss model is:

$$
L(N, D) = E + \frac{A}{N^\alpha} + \frac{B}{D^\beta}
$$

This treats $D$ as if every additional token contributes fresh information.

That is a good approximation when:

- the dataset is huge relative to the training horizon
- duplication has been aggressively removed
- the model sees few repeated documents
- the mixture still contains useful novelty at the margin

It becomes weaker when the real constraint is:

$$
\text{finite high-quality unique data}
$$

not:

$$
\text{finite raw tokens}
$$

## 2. Separate raw tokens from unique tokens

In a data-constrained regime, write:

$$
D = U_D(1 + R_D)
$$

where:

- $D$ is total training tokens
- $U_D$ is unique tokens
- $R_D$ is the number of repeats after the first epoch

For example, if a model trains on a 2T-token unique corpus for 3 epochs:

$$
U_D = 2T,
\qquad
R_D = 2,
\qquad
D = 2T(1 + 2) = 6T
$$

The important point is that $6T$ repeated tokens are not equivalent to $6T$ unique tokens.

## 3. Effective data under repetition

Muennighoff et al. model repeated data through an effective token count:

$$
D'
=
U_D
+
U_D r_D
\left(1 - \exp\left(-\frac{R_D}{r_D}\right)\right)
$$

where $r_D$ is a learned repetition-value parameter.

Interpretation:

- if $R_D = 0$, then $D' = U_D$
- if $R_D \ll r_D$, repeated tokens behave roughly like extra data
- as $R_D$ grows, $D'$ saturates

So the value of repeated data decays toward a ceiling:

$$
D' \not\propto D
$$

This is the main correction to naive token counting.

## 4. Repetition vs model size

The same work also defines a notion of excess model size relative to the model that would be compute-optimal for the unique dataset.

Let $U_N$ be the Chinchilla-optimal model size for $U_D$, and define:

$$
R_N = \frac{N}{U_N} - 1
$$

Then repeated-data scaling can replace raw $N$ and $D$ with discounted quantities:

$$
\hat{L}(N,D)
=
\frac{A}{N'^\alpha}
+
\frac{B}{D'^\beta}
+
E
$$

The empirical takeaway is:

> when unique data is limited, adding more epochs can be better than adding more parameters, but repeated tokens still decay in value.

This is not a license to repeat bad data indefinitely. It is a statement about the tradeoff between two bad options:

- too-small model for available compute
- too-large model for available unique data

## 5. Explicit overfitting penalty

Later work models repetition damage more directly with an overfitting penalty:

$$
\hat{L}(N, U_D, R_D)
=
E
+
\frac{A}{N^\alpha}
+
\frac{B}{\left(U_D(1 + R_D)\right)^\beta}
+
P R_D^\delta
\left(\frac{N}{U_D}\right)^\kappa
$$

where:

- $P$ controls the penalty scale
- $\delta$ controls how the penalty grows with repetition
- $\kappa$ controls how the penalty grows with model size relative to unique data

This form makes the intuition explicit:

$$
\text{overfitting pressure}
\uparrow
\quad\text{when}\quad
R_D \uparrow
\quad\text{and}\quad
\frac{N}{U_D} \uparrow
$$

Larger models are more able to memorize repeated data, so repetition is not equally safe at all scales.

## 6. Practical implications

### Count effective data, not just tokens

A pretraining run should track:

- raw tokens
- unique tokens
- source-level epochs
- near-duplicate exposure
- semantic repetition
- validation loss by source family

Otherwise a run can look like it has more data while actually having less novelty.

### Data quality changes scaling

Two corpora with the same $D$ are not equivalent.

A cleaner corpus can shift the curve by improving compute efficiency:

$$
L_{\text{clean}}(N,D) < L_{\text{noisy}}(N,D)
$$

at the same $N$ and $D$.

So "data-constrained" usually means constrained by:

- quality
- diversity
- licensing
- deduplication
- target-domain coverage

not only constrained by byte count.

### Repetition should be source-specific

Some sources survive repetition better than others.

Examples:

- high-quality math proofs may retain value for more epochs
- boilerplate-heavy web text saturates quickly
- code can contain many near-duplicate templates
- benchmark-like examples are dangerous to repeat

So epoch caps should be per-source, not global.

### Weight decay can matter more

If repeated data increases memorization pressure, regularization becomes part of the data-scaling recipe.

Strong weight decay can reduce the overfitting penalty from repetition, but it is not free:

- too little weight decay increases memorization
- too much weight decay can underfit or hurt rare knowledge

So weight decay should be tuned together with repetition and model size, not treated as independent.

## 7. Relation to overtraining

Overtraining and data-constrained scaling are related but not identical.

Overtraining usually means:

$$
D/N \gg 20
$$

relative to the dense Chinchilla reference.

Data-constrained scaling asks:

$$
\text{how much of }D\text{ is truly useful unique data?}
$$

A model can be:

- overtrained on high-quality diverse data, which may be useful for inference efficiency
- overtrained on repeated low-novelty data, which may mostly buy memorization

The distinction matters. High TPP is not automatically good; it depends on effective data.

## 8. Practical takeaway

When high-quality data is finite, the planning variable should not be:

$$
D
$$

alone.

It should be closer to:

$$
(U_D, R_D, \text{data quality}, \text{source epochs}, N/U_D)
$$

The core rule:

> repeated tokens can still help, but they are discounted tokens, and the discount gets worse for larger models and higher repetition.

## Related

- [Scaling Laws](/atlas/ai/training/scaling/scaling-laws)
- [Overtraining and Inference-Aware Scaling](/atlas/ai/training/scaling/overtraining-and-inference-aware-scaling)
- [Data Mixture Optimization](/atlas/ai/training/data/data-mixture-optimization)
- [Deduplication and Memorization Control](/atlas/ai/training/data/deduplication-and-memorization-control)

## Sources

- Lilian Weng, [Scaling Laws, Carefully](https://lilianweng.github.io/posts/2026-06-24-scaling-laws/)
- Muennighoff et al., [Scaling Data-Constrained Language Models](https://arxiv.org/abs/2305.16264)
- Lovelace et al., [Prescriptive Scaling Laws for Data Constrained Training](https://arxiv.org/abs/2605.01640)
- Hernandez et al., [Scaling Laws and Interpretability of Learning from Repeated Data](https://arxiv.org/abs/2205.10487)
