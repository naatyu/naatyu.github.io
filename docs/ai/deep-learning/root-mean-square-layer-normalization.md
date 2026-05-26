---
title: "RMSNorm (Root Mean Square Layer Normalization)"
date: 2024-10-01
lastmod: 2026-04-08
tags:
  - ai/deep-learning
  - normalization
draft: false
---

## Summary

A simplified version of Layer Normalization that only performs re-scaling (using the root mean square) without re-centering. It is computationally more efficient and is the standard in Llama and Gopher.
## Concepts
- **Re-scaling:** Multiplying by a factor to control the variance of the activations.
- **Re-centering:** Subtracting the mean to ensure activations are zero-centered (omitted in RMSNorm).
- **Computational Efficiency:** RMSNorm reduces overhead by approximately 10-40% compared to standard LayerNorm.

## Content

### The Simplification
Standard LayerNorm performs both re-centering (subtracting the mean) and re-scaling. The RMSNorm paper found that the **re-scaling** is the most critical part for stabilization. By removing the mean subtraction, we save computation without losing performance.

### Mathematical Formulation
$$\text{RMS}(h) = \sqrt{\frac{1}{H} \sum_{i=1}^{H} h_i^2 + \epsilon}$$
$$\bar{h} = \frac{h}{\text{RMS}(h)} \times \gamma$$
Where $\gamma$ is a learnable scaling parameter.

### Usage
RMSNorm is used in **Llama 2**, **Llama 3**, and **Gemma**. It is typically applied as **Pre-Normalization** (before the Attention or MLP block) to improve training stability in very deep models.

## Related
- [Layer Normalization](/atlas/ai/deep-learning/layer-normalization)
- [The Llama 3 Herd of Models](/atlas/ai/nlp/models/the-llama-3-herd-of-models)
- Transformers MOC
