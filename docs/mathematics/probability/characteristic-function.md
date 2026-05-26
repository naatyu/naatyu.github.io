---
title: "Characteristic Function"
date: 2026-05-20
lastmod: 2026-05-20
tags:
  - math/probability
  - statistics
  - theory
draft: false
---

## Summary

A characteristic function represents a probability distribution in frequency space and uniquely determines the distribution.
## Concepts
- **Characteristic Function:** The function $\varphi_X(t)=\mathbb{E}[e^{itX}]$.
- **Empirical Characteristic Function:** A sample estimate of the characteristic function.
- **Fourier Transform:** A transformation that represents a function in frequency space.
- **Normality Test:** A statistical test for whether data could come from a normal distribution.
- **Moment:** A quantity like mean, variance, skewness, or kurtosis derived from powers of a random variable.

## Content

### Definition

For a random variable $X$, the characteristic function is:

$$\varphi_X(t)=\mathbb{E}[e^{itX}]$$

Using Euler's formula:

$$e^{itX}=\cos(tX)+i\sin(tX)$$

So:

$$\varphi_X(t)=\mathbb{E}[\cos(tX)] + i\mathbb{E}[\sin(tX)]$$

The characteristic function is usually complex-valued.

### Intuition

A [Cumulative Distribution Function](/atlas/mathematics/probability/cumulative-distribution-function) describes a distribution in probability space:

$$F_X(x)=P(X \le x)$$

A characteristic function describes the same distribution in frequency space.

You can think of $t$ as a frequency:

- small $t$ captures broad/global distribution shape
- large $t$ captures finer/local structure

Important fact:

&gt; The characteristic function uniquely determines the distribution.

So if two random variables have the same characteristic function, they have the same distribution.

### Examples

#### Constant random variable

If $X=c$, then:

$$\varphi_X(t)=\mathbb{E}[e^{itc}]=e^{itc}$$

#### Bernoulli random variable

If:

$$X \sim Bernoulli(p)$$

Then:

$$P(X=1)=p,\quad P(X=0)=1-p$$

So:

$$\varphi_X(t)=(1-p)e^{it0}+pe^{it1}$$

$$\varphi_X(t)=1-p+pe^{it}$$

#### Standard normal

If:

$$Z \sim \mathcal{N}(0,1)$$

Then:

$$\varphi_Z(t)=e^{-t^2/2}$$

For:

$$X \sim \mathcal{N}(\mu,\sigma^2)$$

The characteristic function is:

$$\varphi_X(t)=e^{it\mu-\frac{1}{2}\sigma^2t^2}$$

### Empirical characteristic function

Given data:

$$X_1, X_2, ..., X_n$$

The empirical characteristic function is:

$$\varphi_n(t)=\frac{1}{n}\sum_{j=1}^{n}e^{itX_j}$$

Equivalently:

$$\varphi_n(t)=
\frac{1}{n}\sum_{j=1}^{n}\cos(tX_j)
+
i\frac{1}{n}\sum_{j=1}^{n}\sin(tX_j)
$$

This is the sample version of:

$$\varphi_X(t)=\mathbb{E}[e^{itX}]$$

The expectation is replaced by an average.

### Why it is useful

Characteristic functions are useful because:

- they always exist for any probability distribution
- they uniquely determine the distribution
- sums of independent variables become products
- moments can be recovered by derivatives when they exist
- they are useful for goodness-of-fit tests

### Sums of independent variables

If $X$ and $Y$ are independent, then:

$$\varphi_{X+Y}(t)=\varphi_X(t)\varphi_Y(t)$$

This is one reason characteristic functions are useful in probability theory.

Convolution in probability space becomes multiplication in frequency space.

### Link with moments

If moments exist, they can be recovered from derivatives of the characteristic function at $t=0$.

For example:

$$\mathbb{E}[X]=\frac{1}{i}\varphi_X'(0)$$

And:

$$\mathbb{E}[X^k]=\frac{1}{i^k}\varphi_X^{(k)}(0)$$

This is similar to a moment generating function, but characteristic functions always exist because $|e^{itX}|=1$.

### Use in normality tests

The Epps-Pulley test uses characteristic functions to test normality.

The idea:

1. Standardize the data:

$$Y_j=\frac{X_j-\bar{X}}{S}$$

2. Compute the empirical characteristic function:

$$\varphi_n(t)=\frac{1}{n}\sum_{j=1}^{n}e^{itY_j}$$

3. Compare it with the standard normal characteristic function:

$$e^{-t^2/2}$$

4. Add up the squared difference over all frequencies:

$$T_n=n\int_{-\infty}^{\infty}
|\varphi_n(t)-e^{-t^2/2}|^2w(t)\,dt
$$

Large values mean the sample distribution is far from normal.

### Understanding the integral

For each frequency $t$, compute:

$$|\varphi_n(t)-e^{-t^2/2}|^2$$

This is the squared distance between:

- the empirical characteristic function
- the normal characteristic function

The integral:

$$\int_{-\infty}^{\infty}
|\varphi_n(t)-e^{-t^2/2}|^2w(t)\,dt
$$

means:

&gt; add up the weighted mismatch across all frequencies

The weight $w(t)$ is usually chosen to downweight very large $|t|$, because high-frequency estimates are noisy.

With a Gaussian weight, the integral has a closed form. This is why the Epps-Pulley statistic can be computed from finite sums instead of doing numerical integration.

### Relation to CDF

Both the CDF and the characteristic function fully describe a distribution.

| Object | Domain | Output | Intuition |
|---|---|---|---|
| CDF | value $x$ | probability $P(X \le x)$ | accumulated probability |
| Characteristic function | frequency $t$ | complex number | frequency representation |

CDFs are usually more intuitive.
Characteristic functions are often better for algebra, sums, and some statistical tests.

## Takeaways

- A characteristic function is $\varphi_X(t)=\mathbb{E}[e^{itX}]$.
- It is a frequency-space representation of a distribution.
- It uniquely determines the distribution.
- The empirical characteristic function replaces the expectation with a sample average.
- The standard normal characteristic function is $e^{-t^2/2}$.
- Tests like Epps-Pulley compare empirical and theoretical characteristic functions across frequencies.

## Related
- [Cumulative Distribution Function](/atlas/mathematics/probability/cumulative-distribution-function)
- [Law of Total Probability](/atlas/mathematics/probability/law-of-total-probability)
- [Entropy](/atlas/mathematics/probability/entropy)
- [Jensen-Shannon Divergence](/atlas/mathematics/probability/jensen-shannon-divergence)
