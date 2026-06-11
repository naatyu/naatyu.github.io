---
title: "DDPM"
date: 2026-06-11
lastmod: 2026-06-11
tags:
  - ai/diffusion
  - generative-models
draft: false
---

## Summary

DDPMs generate data by learning to reverse a gradual noising process. The forward process destroys structure step by step; the learned reverse process reconstructs structure step by step.

The kexue.fm intuition is:

$$
\text{DDPM} = \text{拆楼} + \text{建楼}
$$

meaning:

- forward diffusion demolishes the data into noise
- reverse diffusion rebuilds the data from noise

## Concepts

- **Forward process:** fixed Markov chain that adds noise to data.
- **Reverse process:** learned Markov chain that denoises.
- **Noise prediction:** training target where the model predicts the injected Gaussian noise.
- **Denoising score matching:** related view where the model learns the score of noisy data.
- **ELBO:** variational lower bound used to justify the training objective.

## 1. Forward noising process

Start with real data:

$$
x_0 \sim q(x_0)
$$

Define a Markov forward process:

$$
q(x_t\mid x_{t-1})
=
\mathcal{N}
\left(
\sqrt{1-\beta_t}x_{t-1},
\beta_t I
\right)
$$

where $\beta_t$ is a small noise schedule.

After many steps:

$$
x_T \approx \mathcal{N}(0,I)
$$

The forward process is fixed. No learning is needed to add noise.

## 2. Closed-form sampling at time $t$

Define:

$$
\alpha_t = 1-\beta_t
$$

and:

$$
\bar \alpha_t = \prod_{s=1}^{t}\alpha_s
$$

Then:

$$
q(x_t\mid x_0)
=
\mathcal{N}
\left(
\sqrt{\bar\alpha_t}x_0,
(1-\bar\alpha_t)I
\right)
$$

So we can sample noisy data directly:

$$
x_t
=
\sqrt{\bar\alpha_t}x_0
+
\sqrt{1-\bar\alpha_t}\epsilon
$$

where:

$$
\epsilon \sim \mathcal{N}(0,I)
$$

This is what makes training efficient: we do not need to simulate every previous noising step.

## 3. Reverse denoising process

The model learns:

$$
p_\theta(x_{t-1}\mid x_t)
$$

usually parameterized as a Gaussian:

$$
p_\theta(x_{t-1}\mid x_t)
=
\mathcal{N}
\left(
\mu_\theta(x_t,t),
\Sigma_\theta(x_t,t)
\right)
$$

Generation starts from:

$$
x_T \sim \mathcal{N}(0,I)
$$

then repeatedly samples:

$$
x_{T-1},x_{T-2},\ldots,x_0
$$

## 4. Noise prediction objective

Instead of predicting $x_{t-1}$ directly, DDPMs often predict the noise $\epsilon$ used to create $x_t$:

$$
\epsilon_\theta(x_t,t)
\approx
\epsilon
$$

The simplified training loss is:

$$
\mathcal{L}
=
\mathbb{E}_{x_0,t,\epsilon}
\left[
\left\|
\epsilon
-
\epsilon_\theta
\left(
\sqrt{\bar\alpha_t}x_0
+
\sqrt{1-\bar\alpha_t}\epsilon,
t
\right)
\right\|^2
\right]
$$

This is the practical heart of DDPM training.

## 5. DDPM as autoregressive VAE

kexue.fm gives another useful interpretation:

> DDPM is like an autoregressive VAE over noise levels.

The latent variables are:

$$
x_1,x_2,\ldots,x_T
$$

and the model defines:

$$
p_\theta(x_{0:T})
=
p(x_T)
\prod_{t=1}^{T}
p_\theta(x_{t-1}\mid x_t)
$$

This resembles a VAE with many latent layers, where each layer corresponds to a noise level.

The difference from a standard VAE is that:

- the encoder/noising process is fixed
- the latent chain is structured by noise scale
- generation is a learned reverse Markov chain

This view helps connect diffusion to variational inference rather than treating it as a completely separate model family.

## 6. Why diffusion works well

The reverse process is hard globally:

$$
\mathcal{N}(0,I) \rightarrow \text{data}
$$

but each small denoising step is easier:

$$
x_t \rightarrow x_{t-1}
$$

So DDPM decomposes a hard generation problem into many easier local prediction problems.

Tradeoff:

- many steps make training target easier
- many steps make sampling slow

This is why later diffusion research focuses heavily on ODE solvers, distillation, consistency models, and one-step generation.

## Related

- [Unified Diffusion and Score Models](/atlas/ai/modalities/diffusion-models/unified-diffusion-and-score-models)
- [Consistency and One-Step Diffusion](/atlas/ai/modalities/diffusion-models/consistency-and-one-step-diffusion)
- [Diffusion Distillation](/atlas/ai/modalities/diffusion-models/diffusion-distillation)

## Sources

- Ho et al., [Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239)
- Su Jianlin, [生成扩散模型漫谈（一）：DDPM = 拆楼 + 建楼](https://kexue.fm/archives/9119)
- Su Jianlin, [生成扩散模型漫谈（二）：DDPM = 自回归式VAE](https://kexue.fm/archives/9152)
