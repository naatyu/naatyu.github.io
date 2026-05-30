---
title: "Cumulative Distribution Function"
date: 2026-05-20
lastmod: 2026-05-20
tags:
  - math/probability
  - statistics
  - theory
draft: false
---

## Summary

A cumulative distribution function (CDF) gives the probability that a random variable is less than or equal to a value.
## Concepts
- **Random Variable:** A function that maps outcomes to numerical values.
- **CDF:** The function $F_X(x)=P(X \le x)$.
- **PDF:** Probability density function for continuous variables.
- **PMF:** Probability mass function for discrete variables.
- **Quantile:** A value $x$ such that the CDF reaches a given probability level.

## Content

### Definition

For a random variable $X$, the cumulative distribution function is:

$$F_X(x) = P(X \le x)$$

It answers:

&gt; What is the probability that $X$ is at most $x$?

Example:

$$F_X(3) = 0.8$$

means:

$$P(X \le 3) = 0.8$$

So 80% of the probability mass lies at or below 3.

### Intuition

The CDF accumulates probability from left to right.

For small $x$, the CDF is near 0.
For large $x$, the CDF is near 1.

It is called cumulative because it keeps adding probability as $x$ increases.

### Properties

Every CDF satisfies:

- $0 \le F_X(x) \le 1$
- $F_X(x)$ is non-decreasing
- $\lim_{x \to -\infty} F_X(x)=0$
- $\lim_{x \to \infty} F_X(x)=1$
- $P(a < X \le b)=F_X(b)-F_X(a)$

The last property is one of the most useful:

$$P(a < X \le b) = F_X(b) - F_X(a)$$

### Discrete example

Let $X$ be the result of a fair six-sided die.

Then:

$$P(X=1)=P(X=2)=...=P(X=6)=\frac{1}{6}$$

The CDF is:

| $x$ | $F_X(x)=P(X \le x)$ |
|---:|---:|
| $x<1$ | 0 |
| $1 \le x < 2$ | $1/6$ |
| $2 \le x < 3$ | $2/6$ |
| $3 \le x < 4$ | $3/6$ |
| $4 \le x < 5$ | $4/6$ |
| $5 \le x < 6$ | $5/6$ |
| $x \ge 6$ | 1 |

For discrete variables, the CDF is a step function.

### Continuous example

Let:

$$X \sim Uniform(0,1)$$

Then:

$$F_X(x)=
\begin{cases}
0 & x < 0 \\
x & 0 \le x \le 1 \\
1 & x > 1
\end{cases}
$$

So:

$$P(0.2 < X \le 0.7)=F_X(0.7)-F_X(0.2)=0.7-0.2=0.5$$

### Link with PDF

For a continuous random variable with density $f_X(x)$:

$$F_X(x)=\int_{-\infty}^{x} f_X(t)\,dt$$

So the CDF is the area under the PDF up to $x$.

If the CDF is differentiable:

$$f_X(x)=\frac{d}{dx}F_X(x)$$

So:

- PDF gives local density
- CDF gives accumulated probability

### Link with PMF

For a discrete random variable:

$$F_X(x)=\sum_{t \le x} P(X=t)$$

So the CDF is the sum of all probability masses up to $x$.

### Empirical CDF

Given data:

$$X_1, X_2, ..., X_n$$

The empirical CDF is:

$$F_n(x)=\frac{1}{n}\sum_{i=1}^{n}\mathbf{1}(X_i \le x)$$

It counts the fraction of observations less than or equal to $x$.

Example:

```text
data = [1, 2, 2, 5]
```

Then:

$$F_n(2)=\frac{3}{4}$$

because 3 out of 4 observations are $\le 2$.

### Quantiles

A quantile is the inverse idea of the CDF.

If:

$$F_X(x)=0.95$$

then $x$ is the 95th percentile.

Interpretation:

&gt; 95% of the distribution lies at or below $x$.

For simulation, if $U \sim Uniform(0,1)$, then:

$$X = F_X^{-1}(U)$$

has distribution $F_X$. This is inverse transform sampling.

### Why CDFs are useful

CDFs are useful because they work for both discrete and continuous variables.

They are used in:

- probability interval calculations
- quantiles and percentiles
- Kolmogorov-Smirnov tests
- inverse transform sampling
- comparing empirical data to a theoretical distribution

## Takeaways

- The CDF is $F_X(x)=P(X \le x)$.
- It accumulates probability from left to right.
- For continuous variables, it is the integral of the PDF.
- For discrete variables, it is the cumulative sum of the PMF.
- Probability over an interval is computed by subtracting CDF values.
- The empirical CDF estimates the true CDF from data.

## Related
- [Law of Total Probability](/atlas/math/probability/law-of-total-probability)
- [Covariance from Joint PMF](/atlas/math/probability/covariance-from-joint-pmf)
- [Characteristic Function](/atlas/math/probability/characteristic-function)
