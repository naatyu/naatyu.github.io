---
title: "Kullback-Leibler Divergence"
date: 2026-05-06
lastmod: 2026-05-06
tags:
  - math/probability
  - theory
  - information-theory
draft: false
---

## Summary

The Kullback-Leibler Divergence (KL divergence) measures how one probability distribution differs from another. It is not a true distance because it is asymmetric and can be infinite, but it is central to information theory and machine learning.
## Concepts
- **Probability Distribution:** A set of probabilities over possible outcomes.
- **Reference Distribution:** The distribution you are comparing against.
- **Expected Log Likelihood Ratio:** The average log factor by which one distribution differs from another.
- **Entropy:** The uncertainty of a distribution.
- **Cross-Entropy:** A closely related quantity that adds the entropy of the true distribution.

## Content

### Mathematical Definition
For two discrete distributions $P$ and $Q$:

$$D_{KL}(P\|Q) = \sum_i P(i)\log\frac{P(i)}{Q(i)}$$

This can also be written as:

$$D_{KL}(P\|Q) = \sum_i P(i)\log P(i) - \sum_i P(i)\log Q(i)$$

which gives the identity:

$$D_{KL}(P\|Q) = H(P, Q) - H(P)$$

or equivalently:

$$H(P, Q) = H(P) + D_{KL}(P\|Q)$$

### Interpretation
KL divergence measures the penalty for using distribution $Q$ when the true distribution is $P$.

- If $Q$ matches $P$ exactly, then $D_{KL}(P\|Q)=0$
- If $Q(i)=0$ while $P(i)>0$, then the divergence is infinite
- Because the true distribution appears in the weight $P(i)$, it is an expectation under $P$

### Why It Is Not a Metric
KL divergence is not symmetric:

$$D_{KL}(P\|Q) \neq D_{KL}(Q\|P)$$

It also does not satisfy the triangle inequality, so it is a divergence rather than a distance.

### Example
Consider:

$$P=[0.5, 0.5], \quad Q=[0.4, 0.6]$$

Then:

$$D_{KL}(P\|Q)=0.5\log\left(\frac{0.5}{0.4}\right)+0.5\log\left(\frac{0.5}{0.6}\right)$$

This is positive but small because the distributions are close.

### Connection to Other Quantities
KL divergence sits between entropy and cross-entropy:
- **Entropy** measures the uncertainty of one distribution
- **Cross-Entropy** measures the coding cost of one distribution under another
- **KL Divergence** measures the gap between them

It is also one of the two terms used to define [Jensen-Shannon Divergence](/atlas/mathematics/probability/jensen-shannon-divergence).

### Use Cases
- **Classification**: Deriving the standard cross-entropy objective
- **Variational Inference**: Matching approximate posteriors to target distributions
- **Reinforcement Learning**: Penalizing policy updates that move too far from a reference policy
- **Distribution Comparison**: Measuring how much one model distribution departs from another

## Related
- [Entropy](/atlas/mathematics/probability/entropy)
- [Cross-Entropy Loss](/atlas/ai/deep-learning/loss-functions/cross-entropy-loss)
- [Jensen-Shannon Divergence](/atlas/mathematics/probability/jensen-shannon-divergence)
- [Binary Cross-Entropy Loss](/atlas/ai/deep-learning/loss-functions/binary-cross-entropy-loss)
