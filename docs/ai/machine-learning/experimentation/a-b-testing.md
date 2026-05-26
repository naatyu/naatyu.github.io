---
title: "A/B Testing in MLOps"
date: 2026-04-20
lastmod: 2026-04-27
tags:
  - ai/machine-learning
  - mlops
  - statistics
  - experimentation
draft: false
---

## Summary

A/B testing is a controlled experimentation process used to compare two versions of a model (Control vs. Treatment) by routing live traffic to both and measuring performance. In MLOps, statistical rigor is essential to ensure that observed improvements are not due to random noise but represent true model performance gains.
## 1. Statistical Framework: Two-Proportion Z-Test
When comparing binary outcomes (e.g., Click-Through Rate, Conversion Rate) between two groups, we use the two-proportion z-test.

### Success Rates
For each group, compute the observed success rate ($p$):
$$\hat{p}_c = \frac{\sum X_{i,c}}{n_c}, \quad \hat{p}_t = \frac{\sum X_{i,t}}{n_t}$$

### Pooled Proportion
Under the null hypothesis ($H_0: p_c = p_t$), we assume both groups come from the same distribution:
$$\hat{p}_{pool} = \frac{n_c\hat{p}_c + n_t\hat{p}_t}{n_c + n_t}$$

### Z-Statistic
The test statistic measures how many standard deviations the difference in proportions is from zero:
$$z = \frac{\hat{p}_t - \hat{p}_c}{\sqrt{\hat{p}_{pool}(1 - \hat{p}_{pool})(\frac{1}{n_c} + \frac{1}{n_t})}}$$

---

## 2. Confidence Intervals
For the confidence interval, we use the **unpooled standard error** to estimate the range of the true difference:
$$SE_{unpooled} = \sqrt{\frac{\hat{p}_c(1 - \hat{p}_c)}{n_c} + \frac{\hat{p}_t(1 - \hat{p}_t)}{n_t}}$$

The $(1 - \alpha)$ confidence interval is:
$$(\hat{p}_t - \hat{p}_c) \pm z_{\alpha/2} \cdot SE_{unpooled}$$

---

## 3. Power and Sample Size Calculation
To avoid "underpowered" experiments (failing to detect a real effect), you must calculate the required sample size ($n$) **before** starting the test.
For 80% power ($\beta=0.2$) with significance level $\alpha$:
$$n \ge 2 \cdot \left( \frac{z_{\alpha/2} + z_\beta}{\delta} \right)^2 \cdot \bar{p}(1 - \bar{p})$$
- $\delta$: Minimum Detectable Effect (MDE).
- $z_\beta \approx 0.84$ (for 80% power).
- $\bar{p}$: Baseline average success rate.

---

## 4. Significance vs. Practical Impact

| Stat. Sig. | Pract. Sig. | Direction | Recommendation |
| :--- | :--- | :--- | :--- |
| **Yes** | **Yes** | Positive | **Launch Treatment** (Significant gain) |
| **Yes** | **Yes** | Negative | **Keep Control** (Significant regression) |
| **Yes** | **No** | Positive | **Keep Control** (Not worth the operational cost) |
| **No** | - | - | **Continue Testing** or iterate on the model. |

### Practical Significance

A model might be 0.01% better with statistical significance, but if it requires 10x more GPU memory to serve, the "Practical Significance" is negative.
---

## 5. Common Pitfalls in MLOps Experimentation

- **The Peeking Problem**: Checking results repeatedly before the sample size is reached increases the False Positive rate. If you must peek, use **Sequential Testing** (e.g., SPRT).
- **Multiple Comparisons Problem**: If you test 20 different metrics, at least one will likely look "significant" purely by chance ($p < 0.05$). Use **Bonferroni Correction** if tracking multiple KPIs.
- **Selection Bias**: Ensure that the hashing mechanism for user assignment is deterministic (the same user always sees the same model) and independent of user features.
- **Network Effects**: In marketplace models (e.g., Uber, Airbnb), treatment effects can "leak" to the control group (e.g., a better model for one driver reduces the supply for control group drivers).

## Related
- Throughput vs Latency
- Model Drift and Monitoring
- Shadow Deployment vs Canary Release
- Multi-Armed Bandits
