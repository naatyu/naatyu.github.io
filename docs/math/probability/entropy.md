---
title: "Entropy"
date: 2026-05-06
lastmod: 2026-05-06
tags:
  - math/probability
  - theory
  - information-theory
draft: false
---

## Summary

Entropy measures the uncertainty or average information content of a probability distribution. High entropy means the distribution is spread out and unpredictable; low entropy means it is concentrated and predictable.
## Concepts
- **Probability Distribution:** A set of probabilities over possible outcomes.
- **Uncertainty:** How hard it is to predict the outcome of a random variable.
- **Information Content:** The amount of information carried by an event.
- **Logarithm Base:** Determines the unit of entropy: bits for base 2, nats for base $e$.

## Content

### Mathematical Definition
For a discrete random variable $X$ with outcomes $x_i$ and probabilities $p_i = P(X=x_i)$, Shannon entropy is:

$$H(X) = -\sum_i p_i \log p_i$$

If the logarithm is base 2, entropy is measured in **bits**. If the logarithm is natural, it is measured in **nats**.

### How to Compute It
1. List all possible outcomes.
2. Assign the probability of each outcome.
3. Compute $p_i \log p_i$ for each outcome.
4. Sum the values and negate the result.

#### Example
For a fair coin:

$$P(H)=0.5,\quad P(T)=0.5$$

$$H(X) = -[0.5\log_2(0.5) + 0.5\log_2(0.5)]$$

$$H(X) = -[-0.5 - 0.5] = 1 \text{ bit}$$

This means a fair coin has maximal uncertainty among binary distributions.

For a biased coin with $P(H)=0.9$ and $P(T)=0.1$:

$$H(X) = -[0.9\log_2(0.9) + 0.1\log_2(0.1)] \approx 0.469 \text{ bits}$$

The entropy is lower because the outcome is easier to predict.

### Interpretation
- **High entropy**: outcomes are spread out, so the variable is hard to predict.
- **Low entropy**: one or a few outcomes dominate, so the variable is more predictable.
- **Zero entropy**: one outcome has probability 1, so there is no uncertainty.

### Useful Intuition
Entropy is the theoretical lower bound on the average number of bits needed to encode samples from a distribution. More uncertainty means more information is needed to describe the outcome.

### Special Cases
- **Uniform distribution**: entropy is maximal for a fixed number of outcomes.
- **Deterministic distribution**: entropy is 0.

### Connection to Other Quantities
Entropy is the foundation for several related concepts:
- **Cross-Entropy** compares a true distribution to a predicted one.
- **KL Divergence** measures the gap between two distributions.
- **Jensen-Shannon Divergence** is built from entropy and [Kullback-Leibler Divergence](/atlas/math/probability/kullback-leibler-divergence).

## Related
- [Prediction, Compression, and Entropy](/atlas/ai/foundations/prediction-compression-and-entropy)
- [Cross-Entropy Loss](/atlas/ai/training/losses/cross-entropy-loss)
- [Kullback-Leibler Divergence](/atlas/math/probability/kullback-leibler-divergence)
- [Jensen-Shannon Divergence](/atlas/math/probability/jensen-shannon-divergence)
- [Binary Cross-Entropy Loss](/atlas/ai/training/losses/binary-cross-entropy-loss)
- [Law of Total Probability](/atlas/math/probability/law-of-total-probability)
