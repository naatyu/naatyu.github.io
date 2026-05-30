---
title: "Covariance from Joint PMF"
date: 2026-04-10
lastmod: 2026-04-15
tags:
  - math/probability
  - theory
draft: false
---

## Summary

Covariance is a measure of the joint variability of two random variables. For discrete variables, it is calculated using their Joint Probability Mass Function (PMF) to determine how much the variables change together.
## Concepts
- **Joint PMF:** A function $P(X=x, Y=y)$ that gives the probability that $X$ takes value $x$ and $Y$ takes value $y$ simultaneously.
- **Marginal Probability:** The probability distribution of a subset of variables calculated by summing out (marginalizing) the other variables.
- **Expected Value:** The long-run average value of a random variable.
- **Uncorrelated:** Two variables with zero covariance. Note that independence implies uncorrelation, but uncorrelation does not necessarily imply independence.

## Content

### Mathematical Definition
For two discrete random variables $X$ and $Y$, the covariance is defined as the expected product of their deviations from their individual means:

$$Cov(X,Y) = E[(X - E[X])(Y - E[Y])]$$

The most computationally efficient form (the shortcut formula) is:
$$Cov(X,Y) = E[XY] - E[X]E[Y]$$

### Computing from Joint PMF
To compute the covariance from a Joint PMF table, follow these steps:

#### 1. Marginal Probabilities
Sum across rows or columns to find the individual distributions:
$$P(X=x_i) = \sum_{j} P(X=x_i, Y=y_j)$$
$$P(Y=y_j) = \sum_{i} P(X=x_i, Y=y_j)$$

#### 2. Expected Values
Calculate the mean for each variable:
$$E[X] = \sum_{i} x_i \cdot P(X=x_i)$$
$$E[Y] = \sum_{j} y_j \cdot P(Y=y_j)$$

#### 3. Expected Value of the Product
Calculate the joint expectation by summing over all possible pairs $(x_i, y_j)$:
$$E[XY] = \sum_{i} \sum_{j} x_i \cdot y_j \cdot P(X=x_i, Y=y_j)$$

### Interpretation
- **$Cov(X, Y) > 0$**: Positive relationship; variables tend to increase or decrease together.
- **$Cov(X, Y) < 0$**: Inverse relationship; one variable tends to increase when the other decreases.
- **$Cov(X, Y) = 0$**: No linear relationship (uncorrelated).

### Special Case: Independence
If $X$ and $Y$ are independent, then $P(X, Y) = P(X)P(Y)$, which implies $E[XY] = E[X]E[Y]$. Consequently:
$$\text{If } X, Y \text{ are independent} \implies Cov(X, Y) = 0$$

### Example Calculation
Given the following Joint PMF table for $X, Y \in \{0, 1\}$:

| | $Y=0$ | $Y=1$ | Marginal $P(X)$ |
| :--- | :--- | :--- | :--- |
| **$X=0$** | 0.4 | 0.1 | **0.5** |
| **$X=1$** | 0.1 | 0.4 | **0.5** |
| **Marginal $P(Y)$** | **0.5** | **0.5** | **1.0** |

1. **Expected Values**:
   - $E[X] = (0 \times 0.5) + (1 \times 0.5) = 0.5$
   - $E[Y] = (0 \times 0.5) + (1 \times 0.5) = 0.5$
2. **Joint Expectation**:
   - $E[XY] = (0\times0\times0.4) + (0\times1\times0.1) + (1\times0\times0.1) + (1\times1\times0.4) = 0.4$
3. **Covariance**:
   - $Cov(X, Y) = 0.4 - (0.5 \times 0.5) = 0.4 - 0.25 = \mathbf{0.15}$

### Related ML Application
In Deep Learning, the **Covariance Matrix** $\Sigma$ generalizes this to $n$ variables. A key goal in methods like [Sketched Isotropic Gaussian Regularization](/atlas/ai/training/losses/regularization/sketched-isotropic-gaussian-regularization) (SIGReg) is to force the covariance matrix of embeddings to be an identity matrix ($I$), ensuring features are uncorrelated and have unit variance.

## Related
- Mathematics MOC
- [Law of Total Probability](/atlas/math/probability/law-of-total-probability)
- [Sketched Isotropic Gaussian Regularization](/atlas/ai/training/losses/regularization/sketched-isotropic-gaussian-regularization)
- Isotropic vs Anisotropic Embeddings
