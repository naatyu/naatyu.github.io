---
title: "Kullback-Leibler Divergence"
date: 2026-05-06
lastmod: 2026-08-21
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

### Coding Interpretation: Wasted Bits

An optimal code for $P$ assigns ideal length:

$$
\ell_P(i)=-\log_2P(i),
$$

whereas a code based on $Q$ assigns:

$$
\ell_Q(i)=-\log_2Q(i).
$$

The expected extra length under the real distribution $P$ is:

$$
\mathbb{E}_{i\sim P}[\ell_Q(i)-\ell_P(i)]
=
\sum_iP(i)\log_2\frac{P(i)}{Q(i)}
=
D_{\mathrm{KL},2}(P\|Q).
$$

So KL divergence answers:

> How many bits per symbol are wasted because the code uses $Q$ while reality follows $P$?

This is also called coding regret or redundancy.

For example, let:

$$
P=(1/8,1/8,1/4,1/2)
$$

and:

$$
Q=(1/2,1/4,1/8,1/8).
$$

Then:

$$
H_2(P)=1.75\text{ bits/symbol},
$$

$$
H_2(P,Q)=2.625\text{ bits/symbol},
$$

and therefore:

$$
D_{\mathrm{KL},2}(P\|Q)=0.875\text{ bits/symbol}.
$$

### Why It Is Not a Metric
KL divergence is not symmetric:

$$D_{KL}(P\|Q) \neq D_{KL}(Q\|P)$$

It also does not satisfy the triangle inequality, so it is a divergence rather than a distance.

The asymmetry follows naturally from compression. A code optimized for $Q$ used on data from $P$ is a different experiment from a code optimized for $P$ used on data from $Q$.

### Forward Versus Reverse KL

Forward KL is:

$$
D_{\mathrm{KL}}(P\|Q).
$$

It averages errors over samples from $P$. Missing a mode where $P$ has probability is heavily penalized, especially when $Q$ assigns it zero probability. Under a restricted approximation family, this often encourages **mode covering**.

Reverse KL is:

$$
D_{\mathrm{KL}}(Q\|P).
$$

It averages errors over samples from $Q$. It strongly penalizes placing model mass where $P$ is tiny but does not directly average over modes that $Q$ avoids. Under a restricted approximation family, this often encourages **mode seeking**.

These are useful tendencies, not universal behavior independent of the approximation family and optimization setup.

### Why KL Can Be Infinite

If:

$$
P(i)>0
\quad\text{but}\quad
Q(i)=0,
$$

then:

$$
D_{\mathrm{KL}}(P\|Q)=\infty.
$$

The $Q$-based code has no finite codeword for an event that occurs under $P$.

### Cross-Entropy and Forward KL Have the Same Model Gradient

If $P$ is fixed and only $Q_\theta$ is trained:

$$
D_{\mathrm{KL}}(P\|Q_\theta)
=
H(P,Q_\theta)-H(P).
$$

Since $H(P)$ is constant with respect to $\theta$:

$$
\nabla_\theta D_{\mathrm{KL}}(P\|Q_\theta)
=
\nabla_\theta H(P,Q_\theta).
$$

This is why fixed-teacher distillation can be described either as minimizing teacher-to-student cross-entropy or forward KL. They have the same student optimum and gradients; their reported scalar values differ by the teacher entropy. Reverse KL is not equivalent.

### Units

The logarithm base determines the unit:

- $\log_2$ gives bits;
- $\ln$ gives nats.

Conversion is:

$$
D_{\mathrm{KL},2}(P\|Q)
=
\frac{D_{\mathrm{KL},e}(P\|Q)}{\ln2}.
$$

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

It is also one of the two terms used to define [Jensen-Shannon Divergence](/atlas/math/probability/jensen-shannon-divergence).

### Use Cases
- **Classification**: Deriving the standard cross-entropy objective
- **Variational Inference**: Matching approximate posteriors to target distributions
- **Reinforcement Learning**: Penalizing policy updates that move too far from a reference policy
- **Distribution Comparison**: Measuring how much one model distribution departs from another

## Related
- [Entropy](/atlas/math/probability/entropy)
- [Cross-Entropy Loss](/atlas/ai/training/losses/cross-entropy-loss)
- [Jensen-Shannon Divergence](/atlas/math/probability/jensen-shannon-divergence)
- [Binary Cross-Entropy Loss](/atlas/ai/training/losses/binary-cross-entropy-loss)
- [Prediction, Compression, and Entropy](/atlas/ai/foundations/prediction-compression-and-entropy)
- [Compression-Based Similarity and Language Trees](/atlas/ai/foundations/compression-based-similarity-and-language-trees)
- [Knowledge Distillation](/atlas/ai/training/losses/knowledge-distillation)

## Sources

- Kullback and Leibler, [On Information and Sufficiency](https://projecteuclid.org/journals/annals-of-mathematical-statistics/volume-22/issue-1/On-Information-and-Sufficiency/10.1214/aoms/1177729694.full) (1951)
- 3Blue1Brown, [But what is Cross-Entropy? | Compression is Intelligence Part 2](https://www.3blue1brown.com/lessons/cross-entropy/)
