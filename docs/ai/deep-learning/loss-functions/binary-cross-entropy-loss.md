---
title: "Binary Cross-Entropy Loss"
date: 2026-04-29
lastmod: 2026-04-29
tags:
  - ai/deep-learning
  - theory/loss-functions
draft: false
---

## Summary

Binary Cross-Entropy (BCE), also known as Log Loss, is the standard loss function for binary classification problems, measuring the performance of a classification model whose output is a probability value between 0 and 1.
## Mathematical Definition
For a single sample with true label $y \in \{0,1\}$ and predicted probability $p \in (0,1)$, the binary cross-entropy is:

$$BCE(y,p)=-[y \cdot \log(p)+(1-y) \cdot \log(1-p)]$$

For a dataset with $N$ samples, we compute the mean:

$$BCE=-\frac{1}{N}\sum_{i=1}^N[y_i \cdot \log(p_i)+(1-y_i) \cdot \log(1-p_i)]$$

## Intuition
The loss function penalizes confident wrong predictions exponentially while rewarding correct ones:
- **When $y=1$**: The loss is $-\log(p)$. As $p \to 1$, loss $\to 0$. As $p \to 0$, loss $\to \infty$.
- **When $y=0$**: The loss is $-\log(1-p)$. As $p \to 0$, loss $\to 0$. As $p \to 1$, loss $\to \infty$.

## Numerical Stability
Since $\log(0) = -\infty$, predictions of exactly 0 or 1 cause numerical instability. Implementation usually involves **clipping** predictions to a small range $[\epsilon, 1-\epsilon]$ (where $\epsilon \approx 10^{-15}$):

$$p_{clipped} = \text{clip}(p, \epsilon, 1-\epsilon)$$

## Connection to Information Theory
BCE originates from information theory. It measures the average number of bits needed to encode data from the true distribution $y$ when using a code optimized for the predicted distribution $p$. The minimum possible value (0) is achieved when predictions perfectly match true labels.

## Use Cases
- **Binary Classification**: Spam detection, fraud detection, medical diagnosis.
- **Multi-label Classification**: Each label is treated as an independent binary classification task (often combined with a Sigmoid output).
- **GANs**: Used in the original Generative Adversarial Networks objective.

## Related
- Sigmoid Activation
- Softmax (for multi-class generalization)
- [L2 Norm and Loss](/atlas/ai/deep-learning/loss-functions/l2-norm-and-loss)
