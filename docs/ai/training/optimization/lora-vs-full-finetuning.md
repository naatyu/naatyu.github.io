---
title: "LoRA vs Full Fine-Tuning"
date: 2026-06-12
lastmod: 2026-06-12
tags:
  - ai/training
  - optimization
  - post-training
draft: false
---

## Summary

LoRA can match full fine-tuning in many post-training regimes, but only when it has enough capacity and is applied to the right parts of the model. The useful framing is not "LoRA is always worse but cheaper." It is:

$$
\text{LoRA trainable capacity}
\gtrsim
\text{information content of the training signal}
$$

When this holds, LoRA can have similar sample efficiency to full fine-tuning while being cheaper and easier to serve. When it does not hold, LoRA becomes capacity-constrained and learning efficiency degrades.

## Concepts

- **Full fine-tuning:** updating all model weights.
- **LoRA:** low-rank adaptation, where a frozen weight matrix is modified by trainable low-rank matrices.
- **Adapter capacity:** number of trainable LoRA parameters available to store the update.
- **Rank:** LoRA bottleneck dimension $r$.
- **Low-regret regime:** regime where LoRA matches full fine-tuning in loss/reward at lower memory or compute cost.
- **FullFT:** shorthand for full fine-tuning.

## 1. LoRA parametrization

For a frozen weight matrix:

$$
W \in \mathbb{R}^{d_{\text{out}}\times d_{\text{in}}}
$$

LoRA replaces it with:

$$
W'
=
W
+
\frac{\alpha}{r}BA
$$

where:

$$
B \in \mathbb{R}^{d_{\text{out}}\times r}
$$

$$
A \in \mathbb{R}^{r\times d_{\text{in}}}
$$

$r$ is the rank and $\alpha$ is a scale factor.

The trainable update is:

$$
\Delta W
=
\frac{\alpha}{r}BA
$$

Instead of learning an arbitrary full matrix update, LoRA learns a low-rank update.

The trainable parameter count is:

$$
r(d_{\text{in}}+d_{\text{out}})
$$

instead of:

$$
d_{\text{in}}d_{\text{out}}
$$

## 2. When LoRA should match full fine-tuning

Thinking Machines' main empirical result is that LoRA can match full fine-tuning for small-to-medium SFT and RL post-training datasets when configured correctly.

The required conditions are:

1. LoRA is applied to the important weight matrices.
2. The LoRA adapter has enough capacity for the training signal.
3. LoRA learning rate and batch size are tuned for LoRA, not copied blindly from FullFT.

The capacity condition is the key:

$$
P_{\text{LoRA}}
\gtrsim
I(\text{training signal})
$$

where:

- $P_{\text{LoRA}}$ is the number of trainable LoRA parameters
- $I(\text{training signal})$ is the amount of information the training process needs to absorb

This is not a precise engineering formula yet, but it is the right mental model.

## 3. Rank controls when LoRA becomes capacity-constrained

As rank increases, LoRA can represent a larger update subspace.

Thinking Machines found:

- high-rank LoRA tracks FullFT learning curves
- medium/low-rank LoRA tracks FullFT early, then falls behind
- the failure is not a clean hard loss floor
- learning efficiency worsens when the adapter capacity becomes insufficient

A useful picture:

$$
\text{small data}
\Rightarrow
\text{low rank may be enough}
$$

$$
\text{larger data}
\Rightarrow
\text{rank must increase}
$$

$$
\text{pretraining-like data}
\Rightarrow
\text{FullFT usually wins}
$$

So LoRA rank should be chosen relative to the dataset and training objective, not as a universal default.

## 4. Apply LoRA to MLP and MoE layers, not only attention

One of the most actionable results is:

> attention-only LoRA underperforms.

Thinking Machines found that LoRA applied to MLP/MoE layers did much better than attention-only LoRA, even when attention-only LoRA used higher rank to match trainable parameter count.

This suggests the problem is not only number of parameters. It is where the trainable subspace lives.

A possible eNTK-style explanation:

$$
K(i,j)
=
g_i^\top g_j
$$

where:

$$
g_i
=
\nabla_\theta \log p_\theta(x_i\mid x_{<i})
$$

The empirical neural tangent kernel is dominated by parameter groups with many influential gradients. In transformers, MLP/MoE weights contain a large fraction of parameters and functional capacity.

So:

$$
\text{LoRA on all major layers}
\approx
\text{FullFT kernel}
$$

but:

$$
\text{attention-only LoRA}
\not\approx
\text{FullFT kernel}
$$

Practical rule:

- do not default to attention-only LoRA for serious post-training
- include MLP projections
- for MoEs, include expert matrices carefully

## 5. Batch size can hurt LoRA more than FullFT

The blog reports that in some supervised fine-tuning settings, LoRA is less tolerant of large batch sizes than FullFT.

The key observation:

- the gap grows at larger batch sizes
- increasing rank does not remove the gap
- the issue appears tied to the $BA$ product parametrization

FullFT directly updates:

$$
W
$$

LoRA updates:

$$
BA
$$

This introduces different optimization dynamics. Even if LoRA has enough representational capacity, the path taken by gradient descent through the factorized parametrization can be less favorable at large batch.

Practical rule:

> tune LoRA batch size separately; do not assume the FullFT batch-size optimum transfers.

This connects to the broader point that large batches reduce gradient noise. For LoRA, some stochasticity may help the factorized adapter explore or optimize better.

## 6. LoRA works especially well for RL

The most interesting conceptual point is the information-theoretic argument for RL.

In supervised fine-tuning, each episode/example contains many supervised token targets:

$$
O(\text{number of tokens})
$$

bits of training signal.

In policy-gradient RL, a long rollout may produce only one scalar reward or advantage:

$$
O(1)
$$

bits of useful signal per episode.

For a trajectory $\tau$ and unknown reward function $R$, the policy-gradient estimator is:

$$
G = S \cdot \operatorname{Adv}
$$

where:

$$
S = \nabla_\theta \log p_\theta(\tau)
$$

Given the policy and history, $S$ is independent of $R$. The reward-dependent information is carried by the scalar advantage.

Using data processing:

$$
I(G;R\mid \text{history})
\leq
I((S,\operatorname{Adv});R\mid \text{history})
$$

and:

$$
I((S,\operatorname{Adv});R\mid \text{history})
=
I(\operatorname{Adv};R\mid S,\text{history})
\leq
H(\operatorname{Adv})
$$

If the advantage is quantized into $B$ bins:

$$
H(\operatorname{Adv}) \lesssim \log B
$$

So the useful information per episode is roughly constant, not proportional to sequence length.

This explains why even rank-1 LoRA can match FullFT in some RL settings: the training signal itself is low-bandwidth.

## 7. Why the $\frac{1}{r}$ scaling matters

LoRA can be written as:

$$
BA
=
\sum_{i=1}^{r} b_i a_i^\top
$$

The scaled update is:

$$
\frac{1}{r}BA
=
\frac{1}{r}
\sum_{i=1}^{r} b_i a_i^\top
$$

At initialization, the expected first update contribution from each rank-1 component is approximately rank-independent.

Therefore:

$$
\mathbb{E}
\left[
\frac{1}{r}
\sum_{i=1}^{r}
\Delta_i
\right]
$$

is roughly independent of $r$.

This explains why, early in training, learning curves and optimal learning rates are approximately rank-invariant under the standard:

$$
\frac{\alpha}{r}
$$

parametrization.

Without this scaling, changing rank changes the effective update scale more directly.

## 8. LoRA hyperparameter invariances

The blog identifies four LoRA-specific hyperparameters:

- $\alpha$
- $LR_A$
- $LR_B$
- $\operatorname{init}_A$

with $B$ initialized to zero.

Under Adam with $\epsilon\approx 0$, some transformations leave training dynamics invariant. For $p,q>0$:

$$
\alpha
\rightarrow
\frac{1}{pq}\alpha
$$

$$
\operatorname{init}_A
\rightarrow
p\,\operatorname{init}_A
$$

$$
LR_A
\rightarrow
p\,LR_A
$$

$$
LR_B
\rightarrow
q\,LR_B
$$

This means the apparent four-dimensional hyperparameter space has only about two meaningful degrees of freedom.

Useful basis:

$$
\alpha \cdot \operatorname{init}_A \cdot LR_B
$$

controls initial update scale.

And:

$$
\frac{\operatorname{init}_A}{LR_A}
$$

controls the timescale on which $A$ moves away from initialization.

This is useful because it explains why many LoRA hyperparameter recipes are equivalent after rescaling.

## 9. LoRA learning rate vs FullFT learning rate

Thinking Machines found that LoRA's optimal learning rate was consistently around:

$$
\eta_{\text{LoRA}}
\approx
10 \eta_{\text{FullFT}}
$$

across their supervised and RL sweeps.

For very short runs, they suggest the multiplier may be closer to:

$$
15\times
$$

because LoRA has an implicit warmup effect:

- $B$ starts at zero
- early updates to $A$ barely affect $BA$
- as $B$ grows, updates to $A$ matter more
- the effective adapter learning rate increases during training

This is not yet theoretically settled, but it is a strong empirical rule.

Practical rule:

> if you know a good FullFT LR, start LoRA around `10x` that value and sweep nearby.

## 10. Compute efficiency

For a square matrix:

$$
W\in\mathbb{R}^{N\times N}
$$

FullFT forward/backward requires roughly:

- forward: $Wx$ gives $N^2$
- backward input gradient: $W^\top \bar y$ gives $N^2$
- weight gradient: $\bar W += \bar y x^\top$ gives $N^2$

Total:

$$
3N^2
$$

LoRA still needs the frozen-weight forward and backward-input terms:

$$
2N^2
$$

but avoids computing the full:

$$
\bar W
$$

It instead computes gradients for:

$$
A\in\mathbb{R}^{r\times N},
\qquad
B\in\mathbb{R}^{N\times r}
$$

which cost about:

$$
6Nr
$$

So total LoRA cost is:

$$
2N^2 + 6Nr
$$

For:

$$
r\ll N
$$

this is slightly above:

$$
\frac{2}{3}
$$

of FullFT compute for that matrix.

So LoRA is not only memory-efficient. It can also be compute-efficient per pass.

## 11. Practical decision table

| Situation | Prefer |
| --- | --- |
| Small/medium SFT dataset | LoRA likely sufficient |
| RL with scalar rewards | LoRA likely sufficient, even low rank |
| Huge dataset / pretraining-like adaptation | FullFT or very high-rank LoRA |
| Need many tenant-specific adapters | LoRA |
| Need maximum capacity with few constraints | FullFT |
| Attention-only adapter recipe | Avoid as default |
| Large-batch SFT | Sweep carefully; LoRA may degrade sooner |
| MoE post-training | LoRA on experts can work, but parallelism/routing details matter |

## Practical Heuristics

- Start with LoRA for most post-training unless you have evidence it is capacity-constrained.
- Apply LoRA to MLP/MoE and attention matrices, not attention only.
- Use rank as a capacity knob, not as a magic quality knob.
- Start LoRA LR around `10x` the FullFT LR and sweep.
- Use smaller batches if LoRA underperforms at high batch size.
- For RL, low-rank LoRA is often enough because the reward signal is low-bandwidth.
- Use FullFT for pretraining-like adaptation or very large supervised datasets.

## Related

- [Supervised Fine-Tuning for LLMs](/atlas/ai/training/optimization/supervised-fine-tuning-for-llms)
- [Preference Optimization for LLMs](/atlas/ai/training/optimization/preference-optimization-for-llms)
- [Group Relative Policy Optimization](/atlas/ai/training/optimization/group-relative-policy-optimization)
- [Reinforcement Learning for LLMs](/atlas/ai/training/optimization/reinforcement-learning-for-llms)
- [Knowledge Distillation](/atlas/ai/training/losses/knowledge-distillation)

## Sources

- John Schulman and Thinking Machines Lab, [LoRA Without Regret](https://thinkingmachines.ai/blog/lora/)
- Hu et al., [LoRA: Low-Rank Adaptation of Large Language Models](https://arxiv.org/abs/2106.09685)
