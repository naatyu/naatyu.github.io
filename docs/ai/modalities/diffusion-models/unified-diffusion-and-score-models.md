---
title: "Unified Diffusion and Score Models"
date: 2026-06-11
lastmod: 2026-06-11
tags:
  - ai/diffusion
  - generative-models
draft: false
---

## Summary

Diffusion models, score-based generative models, SDE models, ODE samplers, and some masked/corruption models can be seen as variants of the same idea:

$$
\text{define a corruption process, then learn to reverse it}
$$

The unifying abstraction is not necessarily Gaussian noise. It is a family of transformations from clean data to easier-to-model noise or partial information.

## Concepts

- **Score:** gradient of log-density, $\nabla_x\log p_t(x)$.
- **Score matching:** train a model to predict the score of a distribution.
- **Conditional score matching:** train scores conditioned on noisy observations or time.
- **SDE:** stochastic differential equation; continuous-time noisy dynamics.
- **Probability flow ODE:** deterministic ODE with the same marginal distributions as a diffusion SDE.
- **Corruption process:** any process that maps clean data into noisier or less informative data.

## 1. Score function

For a density $p(x)$, the score is:

$$
s(x)
=
\nabla_x \log p(x)
$$

It points toward directions where probability density increases.

Score-based generation learns:

$$
s_\theta(x,t)
\approx
\nabla_x \log p_t(x)
$$

where $p_t$ is the data distribution after corruption/noising at time $t$.

## 2. Why denoising learns a score

For Gaussian corruption:

$$
x_t = x_0 + \sigma_t \epsilon
$$

with:

$$
\epsilon \sim \mathcal{N}(0,I)
$$

the conditional score is:

$$
\nabla_{x_t}\log q(x_t\mid x_0)
=
-\frac{x_t-x_0}{\sigma_t^2}
$$

Since:

$$
x_t-x_0 = \sigma_t\epsilon
$$

we get:

$$
\nabla_{x_t}\log q(x_t\mid x_0)
=
-\frac{\epsilon}{\sigma_t}
$$

So predicting noise is equivalent to predicting a conditional score up to a scale factor.

This is why DDPM noise prediction and score matching are tightly connected.

## 3. Score matching vs conditional score matching

Pure score matching tries to learn:

$$
\nabla_x \log p_t(x)
$$

directly.

Conditional denoising objectives often learn from:

$$
\nabla_{x_t}\log q(x_t\mid x_0)
$$

The kexue.fm score-matching discussion emphasizes that in diffusion, the training target is more precisely **conditional score matching**.

The useful identity is that averaging conditional scores over the posterior recovers the marginal score:

$$
\nabla_{x_t}\log p_t(x_t)
=
\mathbb{E}_{q(x_0\mid x_t)}
\left[
\nabla_{x_t}\log q(x_t\mid x_0)
\right]
$$

So training on conditional denoising targets can still learn the marginal score needed for generation.

## 4. SDE view

Continuous-time diffusion can be written:

$$
dx = f(x,t)dt + g(t)dw
$$

where:

- $f(x,t)$ is drift
- $g(t)$ is diffusion scale
- $w$ is Brownian motion

The reverse-time SDE is:

$$
dx =
\left[
f(x,t)
-
g(t)^2\nabla_x\log p_t(x)
\right]dt
+
g(t)d\bar w
$$

The learned score:

$$
s_\theta(x,t)
$$

is plugged into this reverse dynamics.

## 5. Probability flow ODE

There is also a deterministic ODE with the same marginals:

$$
dx =
\left[
f(x,t)
-
\frac{1}{2}g(t)^2\nabla_x\log p_t(x)
\right]dt
$$

This is important because ODE solvers can sample without stochastic noise and support likelihood computation under some conditions.

The practical split:

- SDE sampling uses stochastic reverse dynamics
- ODE sampling uses deterministic flow
- both rely on a learned score field

## 6. Unified corruption view

kexue.fm's unified diffusion framing is broader than Gaussian noise.

A generative model can define:

$$
x_0 \rightarrow x_t
$$

using many possible corruptions:

- Gaussian noising
- masking
- blurring
- deletion
- discrete token replacement
- partial observation

Then train a model to reverse:

$$
x_t \rightarrow x_0
$$

or to predict the missing/corrupted part.

This connects diffusion to:

- masked language modeling
- denoising autoencoders
- score models
- autoregressive generation
- discrete diffusion

The key design choice is:

> what corruption process makes reverse prediction easy enough to learn but expressive enough to generate high-quality data?

## 7. Practical implications

- DDPM is one point in a larger family of corruption-reversal generative models.
- Noise prediction, $x_0$ prediction, and score prediction are often equivalent up to reparameterization.
- SDE and ODE views are mainly about continuous-time sampling dynamics.
- Discrete diffusion is natural once corruption is generalized beyond Gaussian noise.
- Sampling acceleration often means finding a better trajectory through the same learned denoising field.

## Related

- [DDPM](/atlas/ai/modalities/diffusion-models/ddpm)
- [Consistency and One-Step Diffusion](/atlas/ai/modalities/diffusion-models/consistency-and-one-step-diffusion)
- [Diffusion Distillation](/atlas/ai/modalities/diffusion-models/diffusion-distillation)

## Sources

- Song et al., [Score-Based Generative Modeling through Stochastic Differential Equations](https://arxiv.org/abs/2011.13456)
- Su Jianlin, [生成扩散模型漫谈（五）：一般框架之SDE篇](https://kexue.fm/archives/9209)
- Su Jianlin, [生成扩散模型漫谈（十）：统一扩散模型（理论篇）](https://kexue.fm/archives/9262)
- Su Jianlin, [生成扩散模型漫谈（十八）：得分匹配 = 条件得分匹配](https://kexue.fm/archives/9509)
