---
title: "Stop Gradients"
date: 2026-04-10
lastmod: 2026-04-15
tags:
  - ai/deep-learning
  - theory
  - optimization
draft: false
---

## Summary

A stop gradient is a computational operation that prevents gradients from flowing backward through specific branches of a neural network. In Self-Supervised Learning (SSL), it serves as a critical heuristic to prevent representation collapse.
## Concepts
- **Representation Collapse:** A failure mode where a model learns to output a constant, uninformative vector for all inputs to perfectly minimize a contrastive or predictive loss.
- **Teacher-Student Architecture:** A framework where two networks (often identical) process different views of the same data.
- **Exponential Moving Average (EMA):** A method for updating the "teacher" weights as a slow-moving average of the "student" weights, rather than through direct backpropagation.
- **Symmetry Breaking:** Techniques used to ensure the two branches of a Siamese network do not converge to the same trivial solution.

## Content

### How it Works
In frameworks like **DINO**, **BYOL**, or **SimSiam**, the architecture consists of two branches. The stop gradient ($\text{sg}[\cdot]$) is applied to one branch (typically the "teacher" or "target" branch):

$$\mathcal{L} = \| \text{student}(x_1) - \text{sg}[\text{teacher}(x_2)] \|_2^2$$

During the backward pass, the partial derivatives with respect to the teacher's parameters are set to zero. The teacher is updated via EMA:
$$\theta_{\text{teacher}} \leftarrow \alpha \theta_{\text{teacher}} + (1 - \alpha) \theta_{\text{student}}$$

### Purpose: Preventing Collapse
Without a stop gradient, both networks would quickly learn to produce a constant vector (e.g., all zeros). This perfectly minimizes the distance between embeddings but provides zero information about the data. 

By "freezing" the teacher during a gradient step, the student is forced to "chase" a moving target. This breaks the mathematical symmetry that leads to trivial solutions, acting as an implicit regularizer.

### Limitations
1. **Heuristic Nature**: While effective, stop gradients are often described as a "trick" rather than a mathematically derived necessity.
2. **Complexity**: Requires maintaining two sets of weights and managing the EMA hyperparameter $\alpha$.
3. **Scale**: In some implementations, additional layers like "predictors" or "centering" are required alongside stop gradients to maintain stability.

## Related
- [LeJEPA](/atlas/ai/deep-learning/loss-functions/lejepa)
- [Sketched Isotropic Gaussian Regularization](/atlas/ai/deep-learning/loss-functions/sketched-isotropic-gaussian-regularization)
- [DINOv2](/atlas/ai/deep-learning/dinov2)
- [Batch Normalization, Accelerating Deep Network Training by Reducing Internal Covariate Shift](/atlas/ai/deep-learning/batch-normalization-accelerating-deep-network-training-by-reducing-internal-covariate-shift)
