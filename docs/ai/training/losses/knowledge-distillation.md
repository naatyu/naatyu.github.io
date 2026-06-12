---
title: "Knowledge Distillation"
date: 2026-06-11
lastmod: 2026-06-12
tags:
  - ai/training
  - losses
  - distillation
draft: false
---

## Summary

Knowledge distillation trains a student model from a teacher's outputs instead of, or in addition to, hard labels. The core benefit is that teacher probabilities carry information about uncertainty and class similarity that one-hot labels discard.

In modern LLM work, distillation appears in many forms:

- logit distillation
- preference distillation
- self-distillation
- synthetic-data generation
- label repair
- reasoning trace distillation

## Concepts

- **Teacher:** stronger model or ensemble that produces targets.
- **Student:** model trained to imitate or improve from teacher outputs.
- **Soft target:** probability distribution over labels/tokens.
- **Temperature:** softening parameter applied to logits.
- **Label repair:** using model predictions to correct noisy or incomplete labels.
- **Self-distillation:** using a model or later checkpoint to improve another checkpoint in the same family.

## 1. Hard labels throw away information

For a classification problem with one-hot target $y$, cross-entropy is:

$$
\mathcal{L}_{\text{CE}}
=
-\log p_\theta(y\mid x)
$$

This says only:

$$
\text{class } y \text{ is correct}
$$

It does not say whether the other classes were:

- almost correct
- semantically related
- obviously impossible
- ambiguous under the input

Teacher probabilities preserve some of this structure.

## 2. Logit distillation

Let teacher logits be:

$$
z_T
$$

and student logits be:

$$
z_S
$$

Apply temperature $\tau$:

$$
p_T^{(\tau)}
=
\operatorname{softmax}\left(\frac{z_T}{\tau}\right)
$$

$$
p_S^{(\tau)}
=
\operatorname{softmax}\left(\frac{z_S}{\tau}\right)
$$

Distillation minimizes:

$$
\mathcal{L}_{\text{KD}}
=
\tau^2
D_{\mathrm{KL}}
\left(
p_T^{(\tau)}
\|
p_S^{(\tau)}
\right)
$$

or equivalently:

$$
\mathcal{L}_{\text{KD}}
=
-
\tau^2
\sum_i
p_T^{(\tau)}(i)
\log p_S^{(\tau)}(i)
$$

up to teacher entropy, which does not depend on the student.

The $\tau^2$ factor is often included to keep gradient magnitudes comparable when temperature changes.

## 3. Why temperature helps

If $\tau=1$, a strong teacher may be extremely confident:

$$
p_T(y) \approx 1
$$

Then the target is almost one-hot, and distillation loses much of its extra signal.

With $\tau>1$, the distribution becomes softer:

$$
p_T^{(\tau)}(i)
=
\frac{\exp(z_i/\tau)}
{\sum_j \exp(z_j/\tau)}
$$

This reveals relative preferences among non-target classes.

Example:

$$
\text{cat} > \text{dog} \gg \text{car}
$$

is more informative than:

$$
\text{cat}=1,\quad \text{everything else}=0
$$

## 4. Combining hard and soft targets

A common objective is:

$$
\mathcal{L}
=
(1-\alpha)\mathcal{L}_{\text{CE}}
+
\alpha \mathcal{L}_{\text{KD}}
$$

where:

- CE anchors the student to ground-truth labels
- KD transfers teacher structure

If labels are noisy or incomplete, $\alpha$ may need to be larger. If teacher outputs are unreliable, $\alpha$ should be smaller.

## 5. Distillation as label repair

kexue.fm gives a practical example from information extraction: use multiple trained models to correct incomplete labels.

Suppose an ensemble of $M$ models predicts structured labels.

If a candidate label is:

$$
\text{predicted by all }M\text{ models}
$$

but missing from the dataset, add it.

If an annotated label is:

$$
\text{predicted by none of the }M\text{ models}
$$

then it may be noisy and can be removed or downweighted.

This is not classical logit distillation, but it uses the same idea:

> a teacher system can produce better training targets than the original labels.

For large-model training, the same pattern appears as:

- teacher-generated SFT data
- rejection-sampled completions
- verifier-filtered reasoning traces
- self-distilled high-quality solutions
- synthetic preference pairs

## 6. Distillation in LLMs

For decoder-only language models, token-level distillation can use:

$$
\mathcal{L}_{\text{KD}}
=
-
\sum_{t=1}^{T}
\sum_{v\in V}
p_T(v\mid x_{<t})
\log p_S(v\mid x_{<t})
$$

This is expensive if the vocabulary is large and full teacher logits are stored.

Practical approximations:

- store top-$k$ teacher logits
- store teacher samples instead of distributions
- distill only selected tokens
- distill reasoning traces through SFT
- use teacher-generated data without logit matching

## 6.1 On-policy distillation

Standard distillation trains on teacher trajectories. On-policy distillation instead samples trajectories from the student and asks the teacher to score them. This preserves dense token-level supervision while reducing exposure bias.

See [On-Policy Distillation](/atlas/ai/training/optimization/on-policy-distillation).

## 7. Distillation and compression

Distillation is not only model compression.

It can transfer:

- task knowledge
- style
- reasoning strategies
- calibration
- tool-use behavior
- data-cleaning decisions

But compression is the classical motivation:

$$
\text{large teacher} \rightarrow \text{small student}
$$

The student may outperform a same-size model trained only on hard labels because it receives a smoother target distribution.

## 8. Failure modes

- A weak teacher transfers weak behavior.
- Overconfident teacher logits can erase uncertainty.
- A student can inherit teacher biases and hallucination patterns.
- Logit distillation can be expensive at LLM vocabulary scale.
- Synthetic data can reduce diversity if the teacher has narrow style.
- Distillation can hide data leakage if teacher outputs were trained on evaluation-like data.

## Practical Heuristics

- Use temperature when teacher logits are too sharp.
- Combine hard-label CE and KD unless labels are known to be very noisy.
- Prefer ensembles or verifier-filtered teachers for label repair.
- For LLMs, decide whether you need full-logit distillation or whether sampled teacher traces are enough.
- Treat synthetic data quality as the main bottleneck, not just quantity.

## Related

- [Cross-Entropy Loss](/atlas/ai/training/losses/cross-entropy-loss)
- [Kullback-Leibler Divergence](/atlas/math/probability/kullback-leibler-divergence)
- [Self-Distillation in RL Climbs](/atlas/ai/training/optimization/self-distillation-in-rl-climbs)
- [On-Policy Distillation](/atlas/ai/training/optimization/on-policy-distillation)
- [Supervised Fine-Tuning for LLMs](/atlas/ai/training/optimization/supervised-fine-tuning-for-llms)

## Sources

- Hinton, Vinyals, Dean, [Distilling the Knowledge in a Neural Network](https://arxiv.org/abs/1503.02531)
- Su Jianlin, [基于DGCNN和概率图的轻量级信息抽取模型](https://kexue.fm/archives/6671)
