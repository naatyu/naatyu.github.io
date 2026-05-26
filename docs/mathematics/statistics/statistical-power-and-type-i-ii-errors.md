---
title: "Statistical Power and Type I/II Errors"
date: 2026-04-20
lastmod: 2026-04-27
tags:
  - mathematics/statistics
  - theory
  - experimentation
draft: false
---

## Summary

In hypothesis testing, we make decisions under uncertainty. Statistical Power is the probability that a test correctly rejects a false null hypothesis. Understanding the trade-offs between Type I (False Positive) and Type II (False Negative) errors is critical for setting experiment thresholds.
## 1. The Decision Matrix

| Reality \ Decision | Fail to Reject $H_0$ | Reject $H_0$ (Significant) |
| :--- | :--- | :--- |
| **$H_0$ is True** (No effect) | Correct Decision (1 - $\alpha$) | **Type I Error** ($\alpha$) |
| **$H_0$ is False** (Effect exists) | **Type II Error** ($\beta$) | **Statistical Power** (1 - $\beta$) |

---

## 2. Type I Error ($\alpha$): The False Positive
- **Definition**: Rejecting the null hypothesis when it is actually true.
- **Significance Level**: Usually set at $\alpha = 0.05$. This means we accept a 5% risk of saying there is an effect when there isn't.
- **Analogy**: A "False Alarm." Convicting an innocent person.

## 3. Type II Error ($\beta$): The False Negative
- **Definition**: Failing to reject the null hypothesis when it is actually false.
- **Consequence**: Missing a real improvement or discovery.
- **Analogy**: A "Failed Detection." Letting a guilty person go free.

---

## 4. Statistical Power ($1 - \beta$)
Power is the sensitivity of the test. It is the probability of "hitting" a real effect.
- **Standard Target**: 80% (or $\beta = 0.20$).
- **Drivers of Power**:
    1. **Sample Size ($n$)**: More data = higher power.
    2. **Effect Size ($\delta$)**: Larger differences are easier to detect.
    3. **Significance Level ($\alpha$)**: If you make $\alpha$ smaller (more strict), power decreases.
    4. **Variance ($\sigma^2$)**: High noise makes effects harder to see.

## 5. The MLOps Perspective
In A/B testing, an underpowered test is dangerous because it often leads to the conclusion that "the new model didn't work," when in reality, the test simply didn't have enough users to prove that it worked.

## Related
- [A-B Testing](/atlas/ai/machine-learning/experimentation/a-b-testing)
- The P-Value
- Multiple Comparisons Problem
