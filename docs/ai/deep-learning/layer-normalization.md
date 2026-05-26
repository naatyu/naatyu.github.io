---
title: "Layer Normalization"
date: 2024-10-01
lastmod: 2026-04-08
tags:
  - ai/deep-learning
  - normalization
draft: false
---

## Summary

A normalization technique that computes statistics across the hidden dimension for each sample independently. It is the standard normalization for Transformers, as it is invariant to sequence length and batch size.
## Concepts
- **Hidden Dimension:** The features ($H$) of a single token or sample.
- **Invariance:** The property of being unaffected by changes in specific dimensions (e.g., batch size).
- **Internal Covariate Shift:** The change in the distribution of network activations due to parameter updates during training.

## Content

### Why LayerNorm over BatchNorm?
In NLP and Transformers, **Batch Normalization** fails because:
1.  **Sequence Length**: Batches often have variable sequence lengths, making batch statistics unstable.
2.  **Small Batches**: Large models are often trained with very small micro-batches (e.g., 1 or 2), where batch statistics are noisy and unreliable.

### Mathematical Formulation
For a hidden vector $h$ of dimension $H$:
$$\mu = \frac{1}{H} \sum_{i=1}^{H} h_i$$
$$\sigma^2 = \frac{1}{H} \sum_{i=1}^{H} (h_i - \mu)^2$$
$$\hat{h} = \frac{h - \mu}{\sqrt{\sigma^2 + \epsilon}} \times \gamma + \beta$$
Where $\gamma$ (gain) and $\beta$ (bias) are learnable parameters.

### Impact
LayerNorm stabilizes the hidden state dynamics and allows for much higher learning rates and faster convergence in deep Transformer architectures.

## Related
- [Batch Normalization](/atlas/ai/deep-learning/batch-normalization-accelerating-deep-network-training-by-reducing-internal-covariate-shift)
- [RMSNorm](/atlas/ai/deep-learning/root-mean-square-layer-normalization)
- [Transformers MOC](/atlas/ai/transformers-moc)
