---
title: "Cross-Entropy Loss"
date: 2026-05-06
lastmod: 2026-06-11
tags:
  - ai/deep-learning
  - theory/loss-functions
draft: false
---

## Summary

Cross-Entropy Loss measures how well a predicted probability distribution matches a target distribution. It is one of the main objectives for classification tasks and is closely related to [Kullback-Leibler Divergence](/atlas/math/probability/kullback-leibler-divergence).
## Concepts
- **Target Distribution:** The true probability distribution we want the model to match.
- **Predicted Distribution:** The model output after applying a probability-normalizing function such as Softmax.
- **Entropy:** A measure of uncertainty in a distribution. See [Entropy](/atlas/math/probability/entropy).
- **Kullback-Leibler Divergence:** A divergence that compares two distributions and is used to derive cross-entropy. See [Kullback-Leibler Divergence](/atlas/math/probability/kullback-leibler-divergence).

## Content

### What It Represents
Cross-entropy represents the **average coding cost** of the true distribution when it is encoded with a model distribution.

In practice, it tells you:
- how surprised the model is by the true outcomes
- how well the predicted probabilities match the target probabilities
- how expensive it is to use the wrong distribution to describe the data

If the model assigns high probability to the correct outcome, cross-entropy is low. If it assigns low probability to the correct outcome, cross-entropy is high.

### Mathematical Definition
For two discrete distributions $P$ and $Q$, the cross-entropy of $P$ relative to $Q$ is:

$$H(P, Q) = -\sum_i P(i)\log Q(i)$$

If $P$ is the true distribution and $Q$ is the model prediction, then minimizing cross-entropy encourages $Q$ to place high probability mass on the outcomes favored by $P$.

### Relationship to Entropy and KL Divergence
Cross-entropy can be decomposed as:

$$H(P, Q) = H(P) + D_{KL}(P\|Q)$$

This is useful because:
- $H(P)$ is fixed for the dataset
- minimizing cross-entropy is equivalent to minimizing [Kullback-Leibler Divergence](/atlas/math/probability/kullback-leibler-divergence) from the target distribution

### Intuition
Cross-entropy penalizes confident wrong predictions very strongly.
- If the model assigns low probability to the true class, the loss becomes large.
- If the model assigns high probability to the true class, the loss becomes small.

### Multi-Class Classification
For single-label multi-class classification, the pipeline is usually:

1. Compute logits
2. Apply Softmax to get a probability distribution
3. Compute cross-entropy against the one-hot target

If the target is one-hot encoded, the loss reduces to:

$$L = -\log q_{y}$$

where $q_y$ is the predicted probability for the correct class.

### Binary Case
Binary Cross-Entropy is the two-class special case of cross-entropy when the target distribution is Bernoulli. See [Binary Cross-Entropy Loss](/atlas/ai/training/losses/binary-cross-entropy-loss).

### Numerical Stability
In practice, cross-entropy is usually computed from logits directly rather than from probabilities, because combining Softmax and log into one operation is more stable. This avoids underflow when probabilities become extremely small.

### Use Cases
- **Classification**: Standard objective for image, text, and tabular classifiers.
- **Language Modeling**: Next-token prediction in decoder-only transformers.
- **Distillation**: Matching student predictions to a teacher distribution.

### Distillation View

When the target is one-hot, cross-entropy reduces to:

$$
L=-\log q_y
$$

When the target is a teacher distribution $p_T$, the loss becomes:

$$
L_{\text{distill}}
=
-
\sum_i p_T(i)\log q_i
$$

This is still cross-entropy, but the target contains more information than a hard label. It can express that several alternatives are plausible, not only which one was annotated as correct.

## Related
- [Prediction, Compression, and Entropy](/atlas/ai/foundations/prediction-compression-and-entropy)
- [Binary Cross-Entropy Loss](/atlas/ai/training/losses/binary-cross-entropy-loss)
- [Knowledge Distillation](/atlas/ai/training/losses/knowledge-distillation)
- [Jensen-Shannon Divergence](/atlas/math/probability/jensen-shannon-divergence)
- [Kullback-Leibler Divergence](/atlas/math/probability/kullback-leibler-divergence)
- Loss Functions MOC
- [Entropy](/atlas/math/probability/entropy)
