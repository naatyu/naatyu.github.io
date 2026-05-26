---
title: "Batch Normalization"
date: 2024-10-01
lastmod: 2026-04-08
tags:
  - ai/deep-learning
  - normalization
draft: false
---

## Summary

A normalization technique that computes statistics across the batch dimension. While transformative for Computer Vision (ResNets), it is less effective for NLP due to its dependence on batch size and sequence length.
## Concepts
- **Internal Covariate Shift:** The phenomenon where the distribution of each layer's inputs changes during training, forcing later layers to continuously adapt.
- **Running Mean/Variance:** Statistics tracked during training to be used for normalization during inference.
- **Smoothing the Landscape:** An emerging theory that BatchNorm's primary benefit is making the optimization landscape smoother rather than just reducing covariate shift.

## Content

### Mathematical Formulation
For a batch of activations $x$ over dimension $B$:
$$\mu_B = \frac{1}{B} \sum_{i=1}^B x_i, \quad \sigma^2_B = \frac{1}{B} \sum_{i=1}^B (x_i - \mu_B)^2$$
$$\hat{x}_i = \frac{x_i - \mu_B}{\sqrt{\sigma^2_B + \epsilon}}$$
$$y_i = \gamma \hat{x}_i + \beta$$

### Pros & Cons
- **Pros**: Allows for much higher learning rates, provides a slight regularization effect, and is extremely effective for CNNs.
- **Cons**: Requires a sufficiently large batch size to produce stable statistics. It introduces a dependency between samples in a batch, which can be problematic for distributed training (requiring SyncBatchNorm).

## Related
- [Layer Normalization](/atlas/ai/deep-learning/layer-normalization)
- Deep Learning MOC
