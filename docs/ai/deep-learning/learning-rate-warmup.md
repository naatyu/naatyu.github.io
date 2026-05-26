---
title: "Learning Rate Warmup"
date: 2026-04-10
lastmod: 2026-04-10
tags:
  - ai/deep-learning
  - theory
  - optimization
draft: false
---

## Summary

Learning Rate Warmup is a training technique where the learning rate starts at a very small value and gradually increases to the target peak value over a set number of initial steps. This stabilizes early training, especially for deep architectures and large batch sizes.
## Concepts
- **Peak Learning Rate:** The maximum value the learning rate reaches before starting its decay schedule (e.g., Cosine or Linear decay).
- **Warmup Steps/Duration:** The number of initial iterations (or percentage of total training) spent increasing the learning rate.
- **Early Divergence:** A common failure mode where high initial gradients cause weights to update so aggressively that the loss becomes `NaN` or explodes.
- **Second-Order Information:** Techniques like Adam estimate curvature; warmup allows these estimates to stabilize before large steps are taken.

## Content

### Why use Warmup?

#### 1. Preventing Gradient Explosion
At the start of training, weights are randomly initialized. The initial gradients can be massive and erratic. Without warmup, a high learning rate might push the weights into a region of the loss landscape from which the model cannot recover.

#### 2. Adaptive Optimizer Stability
Optimizers like **Adam** or **AdamW** maintain moving averages of gradients ($m_t$) and squared gradients ($v_t$). In the first few steps, these estimates are highly biased and noisy. Warmup prevents the model from taking large steps based on these unreliable early statistics.

#### 3. Layer Normalization & Weight Initialization
In architectures like Transformers, the interaction between LayerNorm and initial weights can lead to large activations. Warmup allows the model to "settle" into a more stable numerical regime before entering the high-learning-rate phase.

### How it Works
The most common implementation is **Linear Warmup**. If $\eta_{\text{peak}}$ is your target learning rate and $T_{\text{warmup}}$ is the number of warmup steps, the learning rate at step $t$ is:

$$\eta_t = \eta_{\text{peak}} \times \frac{t}{T_{\text{warmup}}}$$

### Determining Warmup Duration ($T_{\text{warmup}}$)

There is no "one-size-fits-all" rule, but several heuristics are industry standards:

#### 1. The 1-5% Rule (Pre-training)
For training a model from scratch (e.g., BERT, GPT-3), it is common to set the warmup period to **1% to 5%** of the total training steps. 
- *Example*: 1M total steps $\implies$ 10k to 50k warmup steps.

#### 2. Large Batch Heuristic
As the **Batch Size** increases, the gradient estimates become more accurate, but the magnitude of updates can also increase. Larger batches generally require a **longer** warmup period to ensure the adaptive optimizer remains stable.

#### 3. Fine-tuning (Short & Sharp)
When fine-tuning a pre-trained model (like Llama 3 or BERT), the weights are already in a "good" region. Warmup is still used but is much shorter—often fixed at **50 to 500 steps**, or roughly **0.1% to 1%** of the fine-tuning run.

#### 4. The "Inverse Square Root" Schedule
Popularized by the original Transformer (Vaswani et al., 2017), this schedule increases linearly for $T_{\text{warmup}}$ and then decays proportionally to the inverse square root of the step number.

### Visualizing the Schedule
A typical training run follows this pattern:
1. **Warmup Phase**: $0 \to \eta_{\text{peak}}$ (Linear increase).
2. **Peak Phase**: Brief period at $\eta_{\text{peak}}$ (optional).
3. **Decay Phase**: $\eta_{\text{peak}} \to \eta_{\text{min}}$ (usually Cosine Decay).

### Common Issues
- **Too short**: Model might diverge early (Loss = `NaN`).
- **Too long**: Training is unnecessarily slow, and the model might get stuck in a poor local minimum early on due to insufficient step size.

## Related
- [Batch size & Learning rate](/atlas/ai/deep-learning/batch-size-and-learning-rate)
- Optimization with PyTorch
- [The Llama 3 Herd of Models](/atlas/ai/nlp/models/the-llama-3-herd-of-models)
- [Attention Mechanism](/atlas/ai/nlp/attention-mechanism)
- [Gradient Direction and Magnitude](/atlas/mathematics/calculus/gradient-direction-and-magnitude)
