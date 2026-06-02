---
title: "Batch size & Learning rate"
date: 2026-05-11
lastmod: 2026-06-02
draft: false
---

## Summary

This note analyzes the relationship between batch size, learning rate, and the Signal-to-Noise Ratio (SNR) in Stochastic Gradient Descent.
## Concepts
- **SGD (Stochastic Gradient Descent):** an optimization algorithm that estimates gradients using mini-batches of data.
- **SNR (Signal-to-Noise Ratio):** in optimization, the ratio of the true gradient signal to the sampling noise introduced by mini-batches.
- **Regularization:** techniques that improve model generalization, often by introducing noise or constraints during training.
- **Learning Rate:** a hyperparameter that controls the step size taken during each iteration of optimization.

The central idea is that **Stochastic Gradient Descent (SGD)** is best understood as a **Signal-to-Noise Ratio (SNR)** problem when calculating the gradient.

|**Term**|**Symbol/Concept**|**Explanation**|
|---|---|---|
|**Gradient Descent (GD)**|$\nabla L(\theta)$|The "true" or **ideal signal** (gradient) calculated using **all** the data.|
|**Stochastic Gradient Descent (SGD)**|$\hat{g} \approx \nabla L(\theta)$|An **approximation** of the true gradient, $\nabla L(\theta)$, calculated using a small **subset** (batch) of the data.|
|**Noise**|$\sigma^2(\hat{g})$|The **variance** in the estimated gradient $\hat{g}$ due to sampling only a small batch of data. This variance is the "noise."|

### 1. Batch Size ($B$) and Gradient Accuracy

The **Batch Size ($B$)** directly controls the noise level of the gradient estimate ($\hat{g}$).

- **Larger $B$ (e.g., Mini-Batch GD):**
    - **$\hat{g} \rightarrow \nabla L(\theta)$** (Approaches the true gradient)
    - **$\sigma^2(\hat{g}) \downarrow$** (Noise **decreases**)
    - **SNR $\uparrow$** (Signal-to-Noise Ratio **improves**)
    - _Analogy:_ Getting a better average by surveying more people.
- **Smaller $B$ (e.g., true SGD):**
    - $\hat{g}$ is a **noisier** approximation.
    - **$\sigma^2(\hat{g}) \uparrow$** (Noise **increases**)
    - **SNR $\downarrow$** (Signal-to-Noise Ratio **worsens**)
    - _Conclusion:_ A bigger batch size is **always** a better approximation of the true, instantaneous gradient.

---

## 2. Learning Rate ($\eta$) and Gradient Effect

The **Learning Rate ($\eta$)** scales the gradient, determining the size of the step in parameter space ($\Delta \theta$).

$$\Delta \theta = -\eta \cdot \hat{g}$$

In the context of SNR:
- **$\eta$ is like an amplifier for the gradient $\hat{g}$.**
- **Smaller $\eta$:** Each step is so small that the parameters ($\theta$) barely change. Consequently, the next calculated gradient ($\hat{g}_{t+1}$) is almost identical to the current one ($\hat{g}_t$). The noise from a single step is minimal.
- **Larger $B$ and Smaller $\eta$ both** contribute to a **higher SNR** during the optimization process.

_(Self-Correction: This analysis holds true because first-order optimizers (like SGD and Adam) must use small enough step sizes to navigate the curvature of the loss surface. If the step size were too large, the first-order approximation would break down anyway.)_

---

## 3. Balancing Signal and Noise: Regularization vs. Efficiency

Now that we know both $B \uparrow$ and $\eta \downarrow$ increase the SNR, the critical question is: **Do we want more noise (lower SNR) or less?**

### The Benefits of Noise (Lower SNR)

|**Effect**|**Noise (Low SNR) ↑**|
|---|---|
|**Source**|Small $B$ (high $\sigma^2(\hat{g})$) or large $\eta$.|
|**Action**|**Noisy Gradients** act as a **regularizer** 🛡️.|
|**Mechanism**|They prevent the model from getting stuck in a sharp, specific minimum on the training loss surface (which leads to poor generalization). The "random step" effect destroys some of the loss reduction from the previous step.|
|**Use Case**|**Small Datasets** where overfitting is a major risk (multiple passes over the same data). Computation cost isn't a primary concern.|

### The Benefits of Signal (High SNR)

|**Effect**|**Signal (High SNR) ↑**|
|---|---|
|**Source**|Large $B$ (low $\sigma^2(\hat{g})$) or small $\eta$.|
|**Action**|Enables **faster training speed** 🚀 per iteration.|
|**Mechanism**|**Noiseless Gradients** allow for larger effective steps without running into high-curvature problems, maximizing progress per unit of computation (FLOPs).|
|**Use Case**|**Massive Datasets** (e.g., training a large language model) where overfitting is not an issue (often $<1$ pass through the data). **Efficiency** is the primary concern.|

---

## 4. Optimal Scaling: Linear vs. Square Root

When increasing the batch size $B$, we must adjust the learning rate $\eta$ to maintain the training dynamics. Two main theories exist for this scaling: **Linear Scaling** and **Square Root Scaling**.

### A. The Mathematical Basis for Square Root Scaling
To maintain a consistent "signal-to-noise" ratio in weight updates, we look at the variance of the stochastic gradient:

$$\text{Grad}_{batch} = \frac{1}{B} \sum_{i=1}^{B} \nabla L_i$$

From statistics, the variance of an average of $B$ independent variables is $\text{Var}(\nabla L_i) / B$. Thus, **larger batches have lower variance**.

The total "noise" or covariance of the weight update $\Delta w$ is:
$$\text{Cov}(\Delta w) \approx \eta^2 \text{Var}(\text{Grad}_{batch}) = \frac{\eta^2}{B} \text{Var}(\nabla L_i)$$

To keep the **magnitude of update noise** constant (maintaining the "random walk" that helps models escape local minima), the ratio $\frac{\eta^2}{B}$ must remain constant.
- If $B$ increases by $k$, then $\eta^2$ must increase by $k$.
- This implies $\eta$ should increase by $\sqrt{k}$.

### B. Comparison: Linear vs. Square Root

| Feature | Linear Scaling ($\eta \propto B$) | Square Root Scaling ($\eta \propto \sqrt{B}$) |
| :--- | :--- | :--- |
| **Logic** | Keeps the "drift" (total distance moved) constant over the same number of epochs. | Keeps the "fluctuation" (noise/variance) of the updates constant. |
| **Use Case** | Common in Large Scale CV (e.g., ImageNet with ResNet-50). | Common in Adaptive Optimizers (Adam) or GAN training. |
| **Pros/Cons** | Faster convergence but risky at very high $B$. | More stable and theoretically grounded for noise preservation. |

### C. Practical Rule for AdamW

For **AdamW**, the square-root rule is usually the better default heuristic when increasing batch size:

$$
\eta_1 = \eta_0 \sqrt{\frac{B_1}{B_0}}
$$

where:

- $B_0$ is the original batch size
- $B_1$ is the new batch size
- $\eta_0$ is the original learning rate
- $\eta_1$ is the new learning rate

Example:

$$
B_0 = 256,\quad B_1 = 1024
$$

Then:

$$
\eta_1 = \eta_0 \sqrt{\frac{1024}{256}} = 2\eta_0
$$

So if:

$$
\eta_0 = 10^{-4}
$$

then:

$$
\eta_1 = 2 \cdot 10^{-4}
$$

This is a good AdamW default because the optimizer is adaptive: it rescales coordinates using estimated second moments, so in practice it is often more useful to preserve the **stochastic regime of the updates** than to enforce a purely linear learning-rate increase.

The square-root rule should still be treated as a **starting point**, not a law:

- keep the same scheduler shape unless there is a reason to change it
- keep or re-tune warmup for large jumps in batch size
- validate the new learning rate empirically, especially when changing sequence length, data mix, or gradient accumulation

In short:

- **SGD-style linear scaling** tries to preserve drift per unit of data
- **AdamW square-root scaling** tries to preserve update noise
- for AdamW, the second heuristic is often the more stable default

---

## Conclusion: The Contingency of Optimal Hyperparameters

The optimal settings for $B$ and $\eta$ are **context-dependent**. There is no universal "best" combination.

|**Study Scenario**|**Typical Finding**|**Reason**|
|---|---|---|
|**Small Dataset / Many Epochs**|**Small $B$ is better.**|Overfitting is high $\rightarrow$ Need **regularization** $\rightarrow$ Noisy gradients (low SNR) are beneficial.|
|**Massive Dataset / $\leq 1$ Epoch**|**Large $B$ is better.**|Overfitting is low $\rightarrow$ Need **efficiency** $\rightarrow$ High SNR minimizes compute/loss reduction ratio.|

Most real-world projects fall in between, requiring a **balance** between regularization (generalization) and efficiency (training speed).

---

## Further Insights & Optimization Folklore

- **SGD Noise Worsens at Convergence:** The SNR naturally **gets worse** as the loss decreases. Later in training, the true gradient $\nabla L(\theta)$ (the signal) becomes very small, making the noise $\sigma^2(\hat{g})$ a proportionally larger factor.
    - _Practical Application:_ You can improve training speed late in the process by **decreasing $\eta$** or **increasing $B$** (as they both increase the SNR).
- **Optimizers:** Studies show that when hyperparameters are well-tuned, there is **no single "best" optimizer**. Simple SGD (without momentum or fancy features) can be competitive.
- **Momentum:** Momentum is essentially another mechanism that influences the **effective learning rate**, making it a subtle way to manage the step size.
- **Gradient Clipping:** If gradients occasionally spike, clipping can cap the update size without changing the overall optimization direction. See [Gradient Clipping](/atlas/ai/training/optimization/gradient-clipping).
