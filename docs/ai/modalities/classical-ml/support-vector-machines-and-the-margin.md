---
title: "Support Vector Machines and the Margin"
date: 2026-04-25
lastmod: 2026-04-25
tags:
  - ai/machine-learning
  - classification
  - optimization
  - geometry
draft: false
---

## Summary

A linear Support Vector Machine (SVM) separates classes with a hyperplane chosen to maximize the margin, which is the distance between the two closest class boundaries. A larger margin usually improves generalization and makes the classifier more robust.
## Concepts
- **Hyperplane**: A linear decision boundary of the form $\mathbf{w} \cdot \mathbf{x} + b = 0$.
- **Margin**: The distance between the positive and negative class boundary hyperplanes.
- **Support Vectors**: The training points that lie on the margin boundaries and fully determine the optimal separator.
- **L2 Norm**: The Euclidean norm $\|\mathbf{w}\|_2$, which controls the size of the margin.
- **Structural Risk Minimization**: A learning principle that balances fitting the training data with controlling model complexity.

## Content

### 1. Decision Hyperplane
For a linear SVM, the decision boundary is:

$$\mathbf{w} \cdot \mathbf{x} + b = 0$$

where:
- $\mathbf{w}$ is the weight vector, normal to the hyperplane
- $\mathbf{x}$ is a data point
- $b$ is the bias term

The prediction rule is based on the sign:

$$
\hat{y} =
\begin{cases}
+1 & \text{if } \mathbf{w} \cdot \mathbf{x} + b > 0 \\
-1 & \text{if } \mathbf{w} \cdot \mathbf{x} + b < 0
\end{cases}
$$

### 2. Margin Region
The SVM does not only search for any separating hyperplane. It looks for the one with the largest margin.

The margin is bounded by two parallel hyperplanes:

$$\mathbf{w} \cdot \mathbf{x} + b = +1$$

$$\mathbf{w} \cdot \mathbf{x} + b = -1$$

The points that lie exactly on those boundaries are the **support vectors**. These are the most critical training examples because moving them changes the optimal separator.

### 3. Distance to a Hyperplane
The perpendicular distance from a point $\mathbf{x}_0$ to the hyperplane $\mathbf{w} \cdot \mathbf{x} + b = 0$ is:

$$d = \frac{|\mathbf{w} \cdot \mathbf{x}_0 + b|}{\|\mathbf{w}\|}$$

If $\mathbf{x}_0$ lies on the positive boundary, then:

$$\mathbf{w} \cdot \mathbf{x}_0 + b = 1$$

so the distance to the decision hyperplane is:

$$\frac{1}{\|\mathbf{w}\|}$$

Likewise, for a point on the negative boundary:

$$\mathbf{w} \cdot \mathbf{x}_0 + b = -1$$

the distance is also:

$$\frac{1}{\|\mathbf{w}\|}$$

### 4. Margin Width
Since the decision hyperplane sits exactly in the middle of the two boundary hyperplanes, the full margin width is:

$$\text{Margin Width} = \frac{2}{\|\mathbf{w}\|}$$

with:

$$\|\mathbf{w}\| = \sqrt{\sum_{i=1}^{n} w_i^2}$$

This shows the central geometric fact behind SVMs:
- large $\|\mathbf{w}\|$ means a small margin
- small $\|\mathbf{w}\|$ means a large margin

So maximizing the margin is equivalent to minimizing $\|\mathbf{w}\|$, or more commonly minimizing $\frac{1}{2}\|\mathbf{w}\|^2$ for mathematical convenience.

### 5. Why Maximizing the Margin Matters
The SVM objective is not just about separating the training points. It also prefers the separator with the strongest geometric buffer between classes.

This usually gives:
- **Better generalization** on unseen data
- **Higher robustness** to small perturbations or noise
- **A unique optimum** for the hard-margin linear problem because the optimization is convex

This idea comes from **statistical learning theory** and is closely tied to **structural risk minimization**: choose a model that fits while keeping complexity under control.

### 6. Optimization View
For a linearly separable dataset, the hard-margin SVM problem can be written as:

$$\min_{\mathbf{w}, b} \frac{1}{2}\|\mathbf{w}\|^2$$

subject to:

$$y_i(\mathbf{w} \cdot \mathbf{x}_i + b) \geq 1 \quad \forall i$$

where $y_i \in \{-1, +1\}$.

These constraints enforce that every sample is on the correct side of the margin, not just on the correct side of the decision boundary.

### 7. Hard Margin vs Soft Margin
The hard-margin formulation only works well when the classes are perfectly linearly separable. In practice, data is often noisy or overlapping.

The **soft-margin SVM** introduces slack variables so some points may violate the margin:
- this makes the model usable on realistic datasets
- the regularization parameter $C$ controls the tradeoff between maximizing the margin and penalizing classification errors

Large $C$ pushes the model toward fitting the training set more aggressively. Small $C$ allows a wider margin with more tolerance for violations.

## Related
- [L2 Norm, Normalization, and Loss](/atlas/ai/training/losses/l2-norm-and-loss)
- [Cross Product](/atlas/math/linear-algebra/cross-product)
- [Batch size & Learning rate](/atlas/ai/training/optimization/batch-size-and-learning-rate)
