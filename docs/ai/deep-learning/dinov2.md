---
title: "DINOv2"
date: 2026-04-08
lastmod: 2026-04-08
tags:
  - ai/cv
  - self-supervised-learning
draft: false
---

## Summary

A discriminative SSL framework for Vision Transformers that produces high-performance frozen features. It scales DINO and iBOT to massive datasets using stabilized training techniques.
## Concepts
- **Sinkhorn-Knopp Centering:** A method used to normalize teacher outputs and prevent "mode collapse" (where the model predicts the same prototype for all inputs).
- **KoLeo Regularizer:** Differential entropy estimator that maximizes the distance between features in a batch: $\mathcal{L}_{KoLeo} = -\frac{1}{n}\sum \log(\rho_i)$.
- **Sequence Packing:** Concatenating patches from different image crops into a single sequence to improve GPU utilization.

## Content

### Architecture & Objectives
DINOv2 utilizes a Student-Teacher architecture with two complementary heads:
1.  **DINO Head (Global)**: Cross-entropy on the `[CLS]` token features.
2.  **iBOT Head (Local)**: Masked Image Modeling (MIM) on patch tokens.
$$\mathcal{L}_{total} = \lambda_{dino}\mathcal{L}_{DINO} + \lambda_{ibot}\mathcal{L}_{iBOT} + \lambda_{koleo}\mathcal{L}_{KoLeo}$$

### Technical Stabilizations
Scaling DINO to $1B+$ parameters required several "tricks":
- **Stochastic Depth**: Randomly skipping blocks during forward/backward, but with an optimized implementation that skips the actual residual computation (saving $40\%$ FLOPs at high drop rates).
- **SwAV-style centering**: Replacing standard DINO centering with 3 iterations of Sinkhorn-Knopp normalization.
- **LayerScale**: Initializing residual connections with small diagonal values to improve convergence in very deep ViTs.

### Emerging Properties
A notable result of DINOv2 is that its **frozen** features (without finetuning) naturally contain:
- **Semantic Segmentation**: The first PCA component of the features perfectly masks the main object.
- **Part-of-Object Layout**: Successive components identify eyes, wings, or wheels across different categories.

## Related
- AI Papers MOC
- Self-Supervised Learning
