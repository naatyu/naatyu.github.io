---
title: "Jensen-Shannon Divergence"
date: 2026-05-06
lastmod: 2026-05-06
tags:
  - math/probability
  - theory
  - information-theory
draft: false
---

## Summary

The Jensen-Shannon Divergence (JSD) is a symmetric and always finite measure of similarity between probability distributions. It is built from the [Kullback-Leibler Divergence](/atlas/mathematics/probability/kullback-leibler-divergence) and is widely used when KL is too brittle or asymmetric.
## Concepts
- **Probability Distribution:** A function that assigns probabilities to outcomes or events.
- **Kullback-Leibler Divergence:** An asymmetric divergence that measures how one distribution differs from another. See [Kullback-Leibler Divergence](/atlas/mathematics/probability/kullback-leibler-divergence).
- **Entropy:** A measure of uncertainty in a probability distribution. See [Entropy](/atlas/mathematics/probability/entropy).
- **Mixture Distribution:** The average distribution obtained by combining two or more distributions with weights.
- **Jensen-Shannon Distance:** The square root of JSD, which is a true metric.

## Content

### Motivation
The [KL divergence](/atlas/mathematics/probability/kullback-leibler-divergence) is useful, but it has two major drawbacks:
- **Asymmetry**: $D_{KL}(P\|Q) \neq D_{KL}(Q\|P)$
- **Instability**: if $Q(i)=0$ while $P(i)>0$, then $D_{KL}(P\|Q)=\infty$

JSD fixes both issues by comparing each distribution to their average.

### Definition
For two distributions $P$ and $Q$, define the midpoint distribution:

$$M = \frac{1}{2}(P + Q)$$

Then the Jensen-Shannon Divergence is:

$$JSD(P\|Q) = \frac{1}{2}D_{KL}(P\|M) + \frac{1}{2}D_{KL}(Q\|M)$$

An equivalent entropy-based form is:

$$JSD(P\|Q) = H(M) - \frac{1}{2}H(P) - \frac{1}{2}H(Q)$$

where $H(\cdot)$ is the Shannon entropy, see [Entropy](/atlas/mathematics/probability/entropy).

### Interpretation
JSD measures how far each distribution is from their shared mixture. In practice, it answers:

**How much information is lost when we replace $P$ and $Q$ by their average $M$?**

### Key Properties
1. **Symmetric**
   $$JSD(P\|Q) = JSD(Q\|P)$$

2. **Non-negative**
   $$JSD(P\|Q) \ge 0$$

3. **Zero iff the distributions are equal**
   $$JSD(P\|Q)=0 \iff P=Q$$

4. **Bounded**
   $$0 \le JSD(P\|Q) \le \log(2)$$
   If the logarithm is base 2, the upper bound is $1$ bit. If the natural logarithm is used, the upper bound is $\ln(2)$.

5. **Metric after square root**
   $$d(P,Q) = \sqrt{JSD(P\|Q)}$$
   This is the Jensen-Shannon distance, which satisfies the triangle inequality.

### Mutual Information View
JSD has a clean information-theoretic interpretation. Let $Z$ be a binary variable indicating whether a sample came from $P$ or $Q$, with equal probability:

- $Z=0 \Rightarrow X \sim P$
- $Z=1 \Rightarrow X \sim Q$

Then:

$$JSD(P\|Q) = I(X;Z)$$

So JSD can be seen as the mutual information between the sample and the source distribution.

### Example
Take:

$$P=[0.5, 0.5], \quad Q=[0.4, 0.6]$$

First compute the midpoint:

$$M=\frac{1}{2}(P+Q)=[0.45, 0.55]$$

Then:

$$D_{KL}(P\|M)=0.5\log\left(\frac{0.5}{0.45}\right)+0.5\log\left(\frac{0.5}{0.55}\right) \approx 0.0050$$

$$D_{KL}(Q\|M)=0.4\log\left(\frac{0.4}{0.45}\right)+0.6\log\left(\frac{0.6}{0.55}\right) \approx 0.0051$$

Finally:

$$JSD(P\|Q)=\frac{1}{2}(0.0050+0.0051)\approx 0.0051$$

The value is small, which matches the intuition that these distributions are very close.

### Practical Considerations
- **Numerical stability**: clip probabilities with a small epsilon before taking logs.
- **Normalization**: ensure both inputs are valid probability distributions and sum to 1.
- **Complexity**: computing JSD is linear in the number of bins or outcomes, so the time and memory cost is $O(n)$.

### Applications
- **Machine Learning**: comparing predicted probability distributions with target distributions.
- **Generative Models**: evaluating how close generated samples are to real data.
- **Natural Language Processing**: comparing topic or document-term distributions.
- **Clustering**: using $\sqrt{JSD}$ as a proper distance between distributions.
- **Model Monitoring**: detecting distribution shift between training and production data.

## Related
- [Binary Cross-Entropy Loss](/atlas/ai/deep-learning/loss-functions/binary-cross-entropy-loss)
- [Kullback-Leibler Divergence](/atlas/mathematics/probability/kullback-leibler-divergence)
- [Group Relative Policy Optimization](/atlas/ai/deep-learning/loss-functions/group-relative-policy-optimization)
- [Law of Total Probability](/atlas/mathematics/probability/law-of-total-probability)
- [Sketched Isotropic Gaussian Regularization](/atlas/ai/deep-learning/loss-functions/sketched-isotropic-gaussian-regularization)
- [Entropy](/atlas/mathematics/probability/entropy)
