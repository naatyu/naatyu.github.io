---
title: "Sampling Distribution of the Mean"
date: 2026-04-20
lastmod: 2026-04-30
tags:
  - mathematics/statistics
  - probability
  - theory
  - central-limit-theorem
draft: false
---

## Summary

The sampling distribution of the mean is the probability distribution of the means of all possible samples of a fixed size $n$ from a population. It demonstrates the **Central Limit Theorem (CLT)**, showing that sample means converge to the population mean and follow a normal distribution regardless of the underlying data's shape.
## 1. Key Concept
When you draw many independent samples from a population and compute their means, those means themselves form a distribution. 

- **Expected Value**: The mean of the sample means is equal to the population mean $\mu$.
- **Standard Error**: The standard deviation of the sampling distribution (Standard Error) is $\frac{\sigma}{\sqrt{n}}$, where $\sigma$ is the population standard deviation.

---

## 2. Central Limit Theorem (CLT)
The CLT states that for a sufficiently large sample size $n$ (usually $n \ge 30$), the sampling distribution of the mean will be approximately normal, even if the population distribution is not normal (e.g., Uniform, Exponential, or skewed).

$$\bar{X} \sim \mathcal{N}\left(\mu, \frac{\sigma^2}{n}\right)$$

### Theoretical Means for Common Distributions:
| Distribution | Parameters | Theoretical Mean ($\mu$) |
| :--- | :--- | :--- |
| **Uniform** | $(0, 1)$ | $0.5$ |
| **Exponential** | $\text{scale} = 1$ | $1.0$ |

---

## 3. Python Simulation
This function demonstrates how sample means converge toward the theoretical mean of the underlying distribution.

```python
import numpy as np

def simulate_clt(num_samples=1000, sample_size=30, distribution='uniform'):
    """
    Demonstrates the sampling distribution of the mean.
    
    Args:
        num_samples: Number of independent samples to draw.
        sample_size: The size of each individual sample.
        distribution: 'uniform' or 'exponential'.
    """
    sample_means = []
    
    for _ in range(num_samples):
        if distribution == 'uniform':
            # Draw from Uniform(0, 1)
            sample = np.random.uniform(0, 1, sample_size)
        elif distribution == 'exponential':
            # Draw from Exponential(scale=1)
            sample = np.random.exponential(1, sample_size)
        else:
            raise ValueError("Distribution must be 'uniform' or 'exponential'")
            
        sample_means.append(np.mean(sample))
    
    # Return the mean of all sample means
    return np.mean(sample_means)

# Example Usage
avg_uniform = simulate_clt(num_samples=10000, sample_size=50, distribution='uniform')
print(f"Mean of Uniform sample means: {avg_uniform:.4f}") # Expect ~0.5

avg_exp = simulate_clt(num_samples=10000, sample_size=50, distribution='exponential')
print(f"Mean of Exponential sample means: {avg_exp:.4f}") # Expect ~1.0
```

---

## 4. Why It Matters
- **Inferential Statistics**: It allows us to make predictions about a population even when we only have access to a small sample.
- **Quality Control**: Used to determine if a batch of products deviates significantly from the expected mean.
- **Confidence Intervals**: The CLT provides the mathematical basis for calculating confidence intervals and performing hypothesis tests (like Z-tests).

## Related
- [A-B Testing](/atlas/ai/machine-learning/experimentation/a-b-testing)
- [Statistical Power and Type I-II Errors](/atlas/mathematics/statistics/statistical-power-and-type-i-ii-errors)
- The P-Value
- Normal Distribution
