---
title: "AdamW"
date: 2026-06-08
lastmod: 2026-06-08
tags:
  - ai/training
  - optimization
  - llm
draft: false
---

## Summary

AdamW is the default optimizer for much of modern LLM training because it combines two useful ideas:

- **adaptive per-parameter step sizes** from Adam
- **decoupled weight decay** from AdamW

The core mechanism is built around two exponential moving averages (EMAs):

- an EMA of the gradient itself
- an EMA of the squared gradient

These let AdamW estimate both the **direction** of the update and a rough notion of the **scale/noise** of recent gradients.

## Concepts

- **EMA:** exponential moving average, a running statistic that gives more weight to recent values.
- **First moment:** moving average of gradients.
- **Second moment:** moving average of squared gradients.
- **Bias correction:** correcting the early-step underestimation of EMAs initialized at zero.
- **Weight decay:** shrinking parameters toward zero as a form of regularization.
- **Decoupled weight decay:** applying weight decay outside the gradient-based Adam update instead of mixing it into the gradient.

## 1. Why AdamW exists

Plain SGD uses one global learning rate:

$$
\theta_{t+1} = \theta_t - \eta g_t
$$

where:

- $\theta_t$ is the parameter vector
- $\eta$ is the learning rate
- $g_t$ is the gradient at step $t$

This can work very well, but it treats every coordinate the same. Adam was introduced to make the update **adaptive** per parameter.

The intuition is:

- if one coordinate sees consistently large gradients, be more conservative there
- if another coordinate sees small or infrequent gradients, allow relatively larger steps there

AdamW keeps that idea, but fixes how weight decay is handled.

## 2. The core Adam mechanism

Adam keeps two running statistics of the gradient.

Let the gradient at step $t$ be:

$$
g_t = \nabla_\theta \mathcal{L}_t
$$

### First EMA: gradient direction

The first moment estimate is:

$$
m_t = \beta_1 m_{t-1} + (1-\beta_1) g_t
$$

This is an EMA of the gradient.

Interpretation:

- it smooths noisy mini-batch gradients
- it behaves like momentum
- it gives a more stable update direction than using $g_t$ directly

If gradients keep pointing in similar directions, $m_t$ builds up. If they fluctuate, the average dampens the noise.

### Second EMA: gradient magnitude

The second moment estimate is:

$$
v_t = \beta_2 v_{t-1} + (1-\beta_2) g_t^2
$$

where the square is elementwise.

Interpretation:

- this tracks how large recent gradients have been in each coordinate
- coordinates with consistently large gradients get larger $v_t$
- coordinates with smaller gradients get smaller $v_t$

Adam then rescales the update by:

$$
\frac{1}{\sqrt{v_t} + \epsilon}
$$

So the effective step for a coordinate becomes smaller when its recent gradients are large.

## 3. Why EMAs are useful here

The EMA is the key mechanism.

Without it:

- using just the current gradient would be too noisy
- using just the current squared gradient would make the denominator very unstable

The EMA gives a smoothed estimate:

$$
\text{EMA}_t = \beta \,\text{EMA}_{t-1} + (1-\beta) x_t
$$

This means:

- recent values matter more
- old values decay exponentially
- the optimizer adapts over time without reacting too violently to one batch

So in Adam:

- $m_t$ is a smoothed estimate of **direction**
- $v_t$ is a smoothed estimate of **scale**

## 4. Bias correction

At initialization:

$$
m_0 = 0, \qquad v_0 = 0
$$

This means early EMAs are biased toward zero, especially in the first few steps.

So Adam uses bias-corrected estimates:

$$
\hat m_t = \frac{m_t}{1-\beta_1^t}
$$

$$
\hat v_t = \frac{v_t}{1-\beta_2^t}
$$

These are what actually go into the update.

## 5. Adam update rule

Ignoring weight decay for a moment, the Adam update is:

$$
\theta_{t+1}
=
\theta_t
- \eta \frac{\hat m_t}{\sqrt{\hat v_t} + \epsilon}
$$

This is the core adaptive rule.

Read it as:

- move in the momentum-smoothed direction $\hat m_t$
- normalize coordinatewise by recent gradient scale $\sqrt{\hat v_t}$

## 6. Why Adam is not AdamW

The subtle but important issue is weight decay.

In older formulations, people often added L2 regularization directly into the loss, which effectively adds a term like:

$$
\lambda \theta
$$

to the gradient.

That is fine in SGD, where every coordinate uses the same learning-rate logic.

But in Adam, if you mix this term into the gradient, it also gets rescaled by the adaptive denominator:

$$
\sqrt{\hat v_t} + \epsilon
$$

So the regularization strength becomes entangled with Adam's adaptive statistics.

That is not really the clean “shrink weights by a fixed amount” behavior we usually want.

## 7. Decoupled weight decay in AdamW

AdamW fixes this by **decoupling** weight decay from the gradient-based Adam step.

Instead of injecting weight decay into the gradient, we apply it separately:

$$
\theta_{t+1}
=
\theta_t
- \eta \frac{\hat m_t}{\sqrt{\hat v_t} + \epsilon}
- \eta \lambda \theta_t
$$

This can also be viewed as:

$$
\theta_{t+1}
=
(1-\eta\lambda)\theta_t
- \eta \frac{\hat m_t}{\sqrt{\hat v_t} + \epsilon}
$$

The important point is:

- the Adam step does optimization
- the weight-decay term does regularization

and they are no longer mixed together.

That is why AdamW is generally preferred over “Adam with L2 regularization”.

## 8. Main hyperparameters

### Learning rate $\eta$

Controls the overall update scale.

Typical LLM pretraining values are often in the rough range:

$$
10^{-4} \text{ to } 5 \times 10^{-4}
$$

depending on scale, scheduler, and batch size.

### $\beta_1$

Controls the timescale of the first-moment EMA.

Common default:

$$
\beta_1 = 0.9
$$

Lower values mean:

- less smoothing
- faster reaction to new gradients

Higher values mean:

- more momentum
- slower adaptation

### $\beta_2$

Controls the timescale of the second-moment EMA.

Common LLM default:

$$
\beta_2 = 0.95
$$

Historically, many smaller-scale Adam settings used `0.999`, but large-model training often prefers lower $\beta_2$ because it reacts faster to changing gradient scales.

### $\epsilon$

A small constant for numerical stability:

$$
\epsilon \approx 10^{-8}
$$

It prevents division by zero and stabilizes very small denominators.

### Weight decay $\lambda$

Controls parameter shrinkage.

Common LLM defaults are often around:

$$
0.1
$$

but some recipes use smaller values like `0.01`.

## 9. Why AdamW remains the default in LLM training

AdamW is popular not because it is theoretically perfect, but because it is:

- robust
- well-understood
- easy to tune relative to more exotic optimizers
- supported everywhere

It works especially well in regimes where:

- gradients are noisy
- parameter scales differ across the network
- long stable training runs matter more than optimizer novelty

Many newer optimizers can outperform it in some settings, but AdamW remains the standard baseline that strong training programs must beat fairly.

## 10. Practical intuition

A useful mental model is:

- **$m_t$** says where the optimizer has been trying to go recently
- **$v_t$** says how volatile or large the recent gradients have been
- **bias correction** fixes the early-step startup distortion
- **weight decay** keeps parameters from drifting too freely

So AdamW is basically:

> momentum + adaptive coordinate scaling + clean weight shrinkage

## 11. Common practical defaults for LLMs

A common modern pretraining baseline is something like:

$$
\beta_1 = 0.9,\qquad \beta_2 = 0.95,\qquad \lambda = 0.1
$$

with:

- gradient clipping around `1.0`
- BF16 training
- LR schedule such as cosine or WSD

These are not universal laws, but they are strong defaults.

## Related

- [Batch size & Learning rate](/atlas/ai/training/optimization/batch-size-and-learning-rate)
- [Gradient Clipping](/atlas/ai/training/optimization/gradient-clipping)
- [Warmup-Stable-Decay Learning Rate Schedule](/atlas/ai/training/optimization/warmup-stable-decay-learning-rate-schedule)
- [Hyperparameter Scaling Laws for LLM Training](/atlas/ai/training/scaling/hyperparameter-scaling-laws-for-llm-training)
