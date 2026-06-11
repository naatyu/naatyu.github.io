---
title: "Diffusion Distillation"
date: 2026-06-11
lastmod: 2026-06-11
tags:
  - ai/diffusion
  - generative-models
  - distillation
draft: false
---

## Summary

Diffusion distillation compresses a slow multi-step generator into a faster student. The usual goal is few-step or one-step generation with minimal quality loss.

The difficulty is that a strong teacher may require many solver steps, so generating teacher targets can itself be expensive.

## Concepts

- **Teacher diffusion model:** pretrained multi-step generator.
- **Student model:** faster generator trained to imitate or match teacher behavior.
- **Trajectory distillation:** student learns to skip parts of teacher trajectory.
- **Score identity distillation:** constructs a distillation objective using score identities rather than direct teacher sampling.
- **One-step student:** model that maps noise to data in one evaluation.

## 1. Classical distillation setup

The naive approach:

1. sample noise $x_T$
2. run the teacher for many steps to get $x_0$
3. train a student:

$$
G_\theta(x_T) \approx x_0
$$

with:

$$
\mathcal{L}
=
\|G_\theta(x_T)-x_0^{\text{teacher}}\|^2
$$

Problem:

- teacher sampling is expensive
- student may average modes
- one-step mapping is much harder than local denoising

## 2. Progressive distillation

A more structured approach halves the number of sampling steps repeatedly.

If the teacher maps:

$$
x_t \rightarrow x_{t-1} \rightarrow x_{t-2}
$$

the student learns:

$$
x_t \rightarrow x_{t-2}
$$

After repeated rounds:

$$
N \rightarrow N/2 \rightarrow N/4 \rightarrow \cdots
$$

This is more stable than jumping directly to one step, but it requires multiple distillation stages.

## 3. Score Identity Distillation

kexue.fm's SiD discussion focuses on a more theoretical question:

> can we construct a useful distillation objective from score identities rather than generating huge teacher datasets?

Let:

- $p_\theta$ be the student distribution
- $p_T$ be the teacher/data-like target distribution
- $s_\theta(x)$ and $s_T(x)$ be their scores

Score identity methods try to build losses where matching score-related quantities moves the student distribution toward the teacher distribution.

A generic score-matching-like form is:

$$
\mathcal{L}
=
\mathbb{E}_{x\sim p_\theta}
\left[
\|s_\theta(x)-s_T(x)\|^2
\right]
$$

But because samples come from the student and the student score depends on the model, the exact gradients are subtle.

The important idea:

> distillation can be formulated as matching distributional vector fields, not only matching teacher samples.

## 4. Why identity-based objectives matter

If a distillation objective can avoid repeatedly sampling from the slow teacher, it can reduce the cost of training a fast generator.

The potential advantages:

- fewer teacher calls
- more direct distribution matching
- possible one-step generation
- less dependence on stored teacher trajectories

The risks:

- more complex objective
- stability issues
- adversarial/GAN-like training dynamics in some variants
- sensitivity to weighting constants

## 5. Relation to flow generator matching

Later work such as Flow Generator Matching reframes the problem through vector fields and gradients. The practical idea is to train a generator whose induced flow matches a target flow.

For a generator:

$$
x = G_\theta(z)
$$

the model distribution changes when $\theta$ changes. Distillation can be viewed as choosing parameter updates so this distribution moves toward the teacher/data distribution.

This connects diffusion distillation to:

- score matching
- flow matching
- distribution matching
- GAN-like generator training

## 6. Practical hierarchy

Sampling-speed methods roughly form a spectrum:

| Method | Training complexity | Sampling speed | Notes |
| --- | --- | --- | --- |
| Better ODE/SDE solver | low | moderate | no retraining, limited acceleration |
| Progressive distillation | medium | fast | staged teacher-student compression |
| Consistency model | medium/high | fast | learns trajectory consistency |
| Score identity distillation | high | very fast | deeper objective, more subtle stability |
| Shortcut model | medium/high | fast | conditions on step size |

## Related

- [DDPM](/atlas/ai/modalities/diffusion-models/ddpm)
- [Unified Diffusion and Score Models](/atlas/ai/modalities/diffusion-models/unified-diffusion-and-score-models)
- [Consistency and One-Step Diffusion](/atlas/ai/modalities/diffusion-models/consistency-and-one-step-diffusion)
- [Knowledge Distillation](/atlas/ai/training/losses/knowledge-distillation)

## Sources

- Salimans, Ho, [Progressive Distillation for Fast Sampling of Diffusion Models](https://arxiv.org/abs/2202.00512)
- Su Jianlin, [生成扩散模型漫谈（二十五）：基于恒等式的蒸馏（上）](https://kexue.fm/archives/10085)
- Su Jianlin, [生成扩散模型漫谈（二十六）：基于恒等式的蒸馏（下）](https://kexue.fm/archives/10567)
