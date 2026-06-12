---
title: "On-Policy Distillation"
date: 2026-06-12
lastmod: 2026-06-12
tags:
  - ai/training
  - post-training
  - distillation
  - reinforcement-learning
draft: false
---

## Summary

On-policy distillation trains a student on its own sampled trajectories, but uses a stronger teacher to provide dense per-token supervision. It combines:

- **on-policy relevance** from RL
- **dense supervision** from distillation

The core idea:

$$
\text{sample from student}
\quad+\quad
\text{grade each token with teacher logprobs}
$$

This avoids the two main weaknesses of the standard alternatives:

- off-policy SFT/distillation teaches the student on teacher states, not student states
- RL teaches on student states, but gives sparse sequence-level reward

## Concepts

- **On-policy:** data is sampled from the current student policy.
- **Off-policy distillation:** student imitates teacher-generated trajectories.
- **Reverse KL:** divergence $D_{\mathrm{KL}}(\pi_\theta\|\pi_T)$, expectation under the student.
- **Exposure bias:** mismatch between training on teacher trajectories and inference on student trajectories.
- **Dense reward:** reward or loss available at many token positions, not only at sequence end.
- **Continual learning:** updating a model with new knowledge while preserving prior behavior.

## 1. Why normal distillation is not enough

Standard off-policy distillation trains on teacher trajectories:

$$
x_{1:T} \sim \pi_T
$$

and updates the student toward teacher tokens:

$$
\mathcal{L}_{\text{off-policy}}
=
-
\sum_{t=1}^{T}
\log \pi_\theta(x_t\mid x_{<t})
$$

or toward the teacher distribution:

$$
\mathcal{L}_{\text{KD}}
=
\sum_t
D_{\mathrm{KL}}
\left(
\pi_T(\cdot\mid x_{<t})
\|
\pi_\theta(\cdot\mid x_{<t})
\right)
$$

The issue is that contexts are sampled from:

$$
x_{<t} \sim \pi_T
$$

not from:

$$
x_{<t} \sim \pi_\theta
$$

So the student is trained in states visited by the teacher, but deployed in states visited by itself. If the student makes an early mistake, it may enter regions that were rare or absent in teacher-generated data.

This is exposure bias:

$$
\text{small early error}
\Rightarrow
\text{off-distribution state}
\Rightarrow
\text{larger later errors}
$$

## 2. Why RL is not enough

RL is on-policy:

$$
\tau \sim \pi_\theta
$$

so it trains on states the student actually visits.

But typical LLM RL has sparse feedback. A long reasoning trace may receive one scalar reward:

$$
R(\tau)
$$

The policy-gradient signal is:

$$
\nabla_\theta J
\approx
A(\tau)
\sum_{t=1}^{T}
\nabla_\theta
\log \pi_\theta(x_t\mid x_{<t})
$$

The advantage $A(\tau)$ tells the model whether the whole trajectory was good or bad, but not exactly which token caused the failure.

This is low-bandwidth supervision:

$$
O(1) \text{ useful bits per episode}
$$

even when the trajectory has many tokens.

## 3. On-policy distillation

On-policy distillation samples from the student:

$$
x_{1:T}\sim \pi_\theta
$$

Then it queries the teacher on the same prefix states:

$$
\pi_T(\cdot\mid x_{<t})
$$

For each sampled token $x_t$, compute:

$$
\log \pi_\theta(x_t\mid x_{<t})
-
\log \pi_T(x_t\mid x_{<t})
$$

This is a sampled estimate of reverse KL:

$$
D_{\mathrm{KL}}
\left(
\pi_\theta(\cdot\mid x_{<t})
\|
\pi_T(\cdot\mid x_{<t})
\right)
=
\mathbb{E}_{x_t\sim \pi_\theta}
\left[
\log \pi_\theta(x_t\mid x_{<t})
-
\log \pi_T(x_t\mid x_{<t})
\right]
$$

The loss is:

$$
\mathcal{L}_{\text{OPD}}
=
\sum_{t=1}^{T}
\left(
\log \pi_\theta(x_t\mid x_{<t})
-
\log \pi_T(x_t\mid x_{<t})
\right)
$$

or equivalently, treat:

$$
A_t
=
-
\left(
\log \pi_\theta(x_t\mid x_{<t})
-
\log \pi_T(x_t\mid x_{<t})
\right)
$$

as a per-token advantage in an RL-style objective.

## 4. Reverse KL interpretation

Reverse KL is:

$$
D_{\mathrm{KL}}(\pi_\theta\|\pi_T)
=
\mathbb{E}_{x\sim \pi_\theta}
\left[
\log \pi_\theta(x)-\log \pi_T(x)
\right]
$$

It is **mode-seeking**: it tends to push the student toward high-probability teacher behavior rather than averaging across all possible teacher modes.

This makes sense for post-training:

- we want the student to behave like a strong assistant/reasoner
- we do not want it to spread probability across weak alternatives
- we want to penalize student trajectories where the teacher assigns low probability

Thinking Machines also argues that reverse KL is hard to reward-hack in this setting: low reverse KL means the sampled behavior is high probability under the teacher distribution.

## 5. Implementation recipe

A minimal implementation:

1. Sample rollouts from the student:

$$
\tau = x_{1:T}\sim \pi_\theta
$$

2. Record student logprobs:

$$
\ell_\theta(t)
=
\log \pi_\theta(x_t\mid x_{<t})
$$

3. Query the teacher for logprobs on the same sampled tokens:

$$
\ell_T(t)
=
\log \pi_T(x_t\mid x_{<t})
$$

4. Compute per-token reverse KL sample:

$$
k_t = \ell_\theta(t)-\ell_T(t)
$$

5. Use:

$$
A_t = -k_t
$$

as a token-level advantage in an importance-sampling / policy-gradient training step.

Pseudocode:

```python
trajectories = sample_from_student(student)
student_logprobs = trajectories.logprobs
teacher_logprobs = teacher.compute_logprobs(trajectories)
reverse_kl = student_logprobs - teacher_logprobs
trajectories.advantages = -reverse_kl
train_with_importance_sampling(student, trajectories)
```

This can be implemented as a small change to an RL pipeline with KL regularization: replace the reference/regularizer model with a stronger teacher and use the KL term as the reward signal.

## 6. Why it is compute-efficient

Off-policy distillation can require generating many high-quality teacher trajectories.

RL can require many rollouts because reward is sparse.

On-policy distillation instead uses:

- cheap student sampling
- one teacher forward pass for logprobs
- dense per-token feedback

The teacher does not need to sample a full trajectory. It only needs to score the student trajectory:

$$
\text{teacher compute} \approx \text{logprob forward pass}
$$

not:

$$
\text{teacher compute} \approx \text{expensive autoregressive sampling}
$$

This is why the method can be much cheaper than RL and often cheaper than building a large off-policy teacher dataset.

## 7. Reasoning result

Thinking Machines reports a reasoning setup:

- student: Qwen3-8B-Base
- teacher: Qwen3-32B / Qwen3-family teacher
- initialization: 400k-prompt off-policy SFT checkpoint

They compare ways to move AIME'24 performance from about `60%` toward `70%`.

Reported pattern:

- continuing off-policy SFT would require extrapolating toward about `2M` prompts
- RL is much more expensive and sparse
- on-policy distillation reaches about `70%` AIME'24 in about `150` steps, roughly `77k` prompts with `4` samples per prompt

Their cost estimate:

$$
\text{on-policy distillation}
\approx
9\times\text{ to }30\times
\text{ cheaper than the SFT extrapolation baseline}
$$

depending on whether teacher sampling costs for off-policy data are included.

The exact numbers are setup-dependent, but the core result is robust:

> dense teacher feedback on student states can be far more compute-efficient than sparse RL or more off-policy SFT.

## 8. Why it helps LoRA

In the Thinking Machines experiment, LoRA lagged full fine-tuning more after large-scale SFT than after on-policy distillation.

This fits the information-bandwidth view from [LoRA vs Full Fine-Tuning](/atlas/ai/training/optimization/lora-vs-full-finetuning):

- large off-policy SFT has high information content
- LoRA can become capacity-constrained
- on-policy distillation gives targeted dense feedback on student errors
- the adapter needs to absorb less irrelevant teacher-trajectory information

So on-policy distillation is especially attractive for parameter-efficient post-training.

## 9. Personalization and continual learning

The personalization example is operationally important.

Goal:

- teach a model new private/domain knowledge
- preserve existing assistant behavior

Naive mid-training on internal documents improves knowledge but degrades instruction following.

Mixing in chat background data helps but does not fully preserve behavior.

LoRA reduces update size but still trades off learning and forgetting.

On-policy distillation can recover behavior by using an earlier instruction-tuned model as the teacher:

$$
\pi_T = \text{old assistant model}
$$

Then after domain mid-training, distill on general instruction prompts:

$$
\pi_\theta \rightarrow \pi_T
$$

on student-sampled trajectories.

Thinking Machines reports that after a `70/30` internal-doc/chat midtrain:

| Model | Internal QA | IF-eval |
| --- | ---: | ---: |
| Qwen3-8B | 18% | 85% |
| midtrain 100% docs | 43% | 45% |
| midtrain 70% docs | 36% | 79% |
| midtrain 70% + on-policy distill | 41% | 83% |

The important result:

> on-policy distillation restored most instruction-following behavior without giving up the newly learned domain knowledge.

This makes it useful for continual learning:

1. learn new knowledge by mid-training or SFT
2. restore behavior by on-policy distillation from a prior model
3. repeat

## 10. Why SFT on model samples still degrades behavior

A subtle result from the post: even if a dataset is sampled from the model itself, SFT on finite batches can still degrade behavior.

In expectation, if:

$$
x\sim \pi_T
$$

then the KL to $\pi_T$ is zero for the true distribution.

But each finite batch has sampling noise. Training on that finite sample creates a nonzero gradient:

$$
\nabla_\theta \mathcal{L}_{\text{SFT}} \neq 0
$$

The updated model moves away from the original policy. After the first update, the dataset is now off-policy relative to the updated model.

This can accumulate:

$$
\text{finite-batch noise}
\Rightarrow
\text{policy drift}
\Rightarrow
\text{off-policy training}
\Rightarrow
\text{long-sequence degradation}
$$

On-policy distillation avoids this because it resamples from the current student and keeps the teacher fixed.

## 11. Distillation as shortcut after RL search

The post gives a useful conceptual split:

- RL spends compute searching over semantic strategies.
- Distillation cheaply teaches the final discovered strategy.

RL explores:

$$
\text{policy rollouts}
\rightarrow
\text{reward}
\rightarrow
\text{strategy refinement}
$$

On-policy distillation can then clone the learned strategy with dense supervision.

Thinking Machines reports a matched experiment where distilling an RL-trained policy back into the base model reached the teacher's performance in about `7-10x` fewer gradient steps, corresponding to roughly `50-100x` compute efficiency under their accounting.

This suggests a useful production pattern:

1. use RL when exploration is necessary
2. once a strong policy exists, distill it on-policy into cheaper or cleaner students
3. do not pay the RL search cost again for every student or personalization variant

## 12. When to use on-policy distillation

Use it when:

- the student already has enough support to generate roughly relevant trajectories
- you have a strong teacher that can score logprobs
- RL reward is sparse or expensive
- off-policy teacher data causes exposure bias
- you need to recover behavior after domain adaptation
- you want dense process-like supervision without training a process reward model

Be careful when:

- the student has zero probability of important teacher behaviors
- the teacher is weak or stylistically mismatched
- the task requires new knowledge absent from the student
- teacher logprob inference is too expensive
- privacy constraints prevent teacher queries

Important support condition:

$$
\pi_T \text{ behavior should be inside or near the support of } \pi_\theta
$$

Forward-KL SFT can add support for new tokens and behaviors. Reverse-KL on-policy distillation then mode-seeks within that support.

## Practical Heuristics

- Use off-policy SFT or mid-training first if the student lacks the relevant knowledge or vocabulary.
- Use on-policy distillation after the student can generate plausible trajectories but still makes mistakes.
- Treat teacher logprobs as a dense per-token reward.
- Prefer partial rollouts when full sequences are unnecessary.
- For continual learning, alternate knowledge acquisition and behavior recovery.
- Consider combining sequence-level rewards with per-token teacher KL when task reward and teacher style both matter.

## Related

- [Knowledge Distillation](/atlas/ai/training/losses/knowledge-distillation)
- [LoRA vs Full Fine-Tuning](/atlas/ai/training/optimization/lora-vs-full-finetuning)
- [Group Relative Policy Optimization](/atlas/ai/training/optimization/group-relative-policy-optimization)
- [Reinforcement Learning for LLMs](/atlas/ai/training/optimization/reinforcement-learning-for-llms)
- [Preference Optimization for LLMs](/atlas/ai/training/optimization/preference-optimization-for-llms)
- [Supervised Fine-Tuning for LLMs](/atlas/ai/training/optimization/supervised-fine-tuning-for-llms)

## Sources

- Kevin Lu and Thinking Machines Lab, [On-Policy Distillation](https://thinkingmachines.ai/blog/on-policy-distillation/)
- Ross et al., [A Reduction of Imitation Learning and Structured Prediction to No-Regret Online Learning](https://arxiv.org/abs/1011.0686)
- Agarwal et al., [On-Policy Distillation of Language Models: Learning from Self-Generated Mistakes](https://arxiv.org/abs/2306.13649)
- Gu et al., [MiniLLM: Knowledge Distillation of Large Language Models](https://arxiv.org/abs/2306.08543)
