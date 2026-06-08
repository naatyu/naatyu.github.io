---
title: "Group Relative Policy Optimization"
date: 2026-04-08
lastmod: 2026-06-08
tags:
  - ai/training
  - reinforcement-learning
  - llm
draft: false
---

## Summary

Group Relative Policy Optimization (GRPO) is an RL objective for LLMs where several responses are sampled for the same prompt, scored, and compared relative to one another. It is attractive because it removes the need for a separate critic while still providing a structured policy-gradient signal.

## Concepts

- **Group:** multiple sampled responses for the same prompt.
- **Reward:** scalar score assigned to each response.
- **Advantage:** normalized score telling how much better or worse one response is than its peers.
- **Importance ratio:** ratio between new-policy and rollout-policy token probabilities.
- **Top-p mask replay:** restricting training to the same nucleus-support used during rollout sampling.

## 1. Core setup

For a prompt $q$, sample a group of responses:

$$
y_{1:G}
$$

Each response $y_i$ gets a reward:

$$
R_i = R(q, y_i)
$$

Instead of evaluating each response in isolation, GRPO builds a relative signal inside the group.

## 2. Response-level advantage

A common normalized advantage is:

$$
A_i=\frac{R_i-\mathrm{mean}(R_{1:G})}{\mathrm{std}(R_{1:G})}
$$

This same response-level advantage is then shared across all tokens in that response.

## 3. Token-level importance ratio

For token position $t$ in response $y_i$:

$$
r_{i,t}(\theta)=\frac{\pi_\theta(y_{i,t}\mid q,y_{i,<t})}{\pi_{\text{old}}(y_{i,t}\mid q,y_{i,<t})}
$$

This compares the current policy to the rollout policy used to generate the sample.

## 4. Clipped GRPO objective

A GRPO-style token-level clipped objective looks like:

$$
J(\theta)=
\mathbb{E}\left[
\frac{1}{\sum_i |y_i|}
\sum_{i=1}^G \sum_{t=1}^{|y_i|}
\min\left(
r_{i,t}(\theta)A_i,\,
\mathrm{clip}(r_{i,t}(\theta),1-\epsilon,1+\epsilon)A_i
\right)
\right]
$$

The clipping plays the same role as in PPO:

- prevent very large policy jumps
- keep updates within a trust region

## 5. Why GRPO is useful for LLMs

It fits the LLM setting well because:

- sampling multiple completions per prompt is natural
- many rewards are sparse or relative
- a separate critic can be expensive or unstable

So GRPO trades value-function complexity for group-based comparison.

## 6. Practical MAI-style modifications

The clean objective is usually not enough for long asynchronous RL climbs. The MAI report adds several practical modifications.

### Adaptive entropy control

They use asymmetric clipping with a dynamically adjusted upper bound:

$$
r^{\mathrm{tr}}_{i,t}(\theta)=\mathrm{clip}\left(r_{i,t}(\theta),\, 1-\epsilon,\,(1-\epsilon)^{-1}+k\right)
$$

where $k$ is updated online to keep policy entropy near a target.

This helps avoid:

- entropy collapse
- entropy explosion

### Outer ratio clip

They also add a hard outer clip:

$$
r^{\mathrm{out}}_{i,t}(\theta)=\mathrm{clip}(r_{i,t}(\theta), r_{\min}, r_{\max})
$$

This is mainly an engineering safeguard against catastrophic gradient spikes from extreme off-policy mismatch.

### Pass-rate filtering

Groups that are too easy or too hard provide weak relative signal.

So a useful trick is:

- discard problems where almost every rollout succeeds
- discard problems where almost every rollout fails

This keeps training focused on informative groups.

### Top-p mask replay

If rollouts were sampled with top-p truncation, training can become unstable if gradients are allowed to flow through tokens that were excluded during sampling.

A practical fix is:

- reuse the rollout-time top-p mask during training
- set excluded logits to $-\infty$ before softmax

This reduces off-policy mismatch.

## 7. Reward decomposition

In practice, LLM RL often uses:

$$
R(q,y)=R_{\text{task}}(q,y)+w_{\text{lang}}R_{\text{lang}}(y)-w_{\text{len}}R_{\text{len}}(y)
$$

So the optimization may shape:

- correctness
- language consistency
- reasoning length / inference cost

## 7.1 Overlong completion penalties

For reasoning models, reward hacking often takes the form:

- longer completions
- more self-correction loops
- higher verifier reward

even when the target mode was supposed to stay concise.

A practical fix is an overlong penalty of the form used in the DAPO line of work:

$$
R_{\text{length}}(y)=
\begin{cases}
0, & |y| \le L_{\max}-L_{\text{cache}} \\
\frac{L_{\max}-L_{\text{cache}}-|y|}{L_{\text{cache}}}, & L_{\max}-L_{\text{cache}} < |y| \le L_{\max} \\
-1, & |y| > L_{\max}
\end{cases}
$$

where:

- $L_{\max}$ is the hard completion-length budget
- $L_{\text{cache}}$ is a soft transition region before the hard cutoff

This lets you trade off:

- more reward through deeper reasoning
- against response-length explosion

The Smol Training Playbook's RLVR experiments are a good example: naive GRPO on the `/no_think` mode caused responses to become much longer, and explicit overlong penalties were needed to keep the concise mode from collapsing toward long chain-of-thought behavior.

## 8. Where GRPO fits

GRPO is best thought of as:

- a practical LLM RL objective
- especially useful for reasoning and multi-sample training

It does not replace:

- reward design
- inference-system engineering
- staleness control
- self-distillation between climbs

Those are separate parts of the RL stack.

## Related

- [Reinforcement Learning for LLMs](/atlas/ai/training/optimization/reinforcement-learning-for-llms)
- [Adaptive Entropy Control in RL](/atlas/ai/training/optimization/adaptive-entropy-control-in-rl)
- [Self-Distillation in RL Climbs](/atlas/ai/training/optimization/self-distillation-in-rl-climbs)
- [Asynchronous RL Infrastructure](/atlas/systems/infrastructure/asynchronous-rl-infrastructure)
- [MAI-Thinking-1: Building a Hill-Climbing Machine](/atlas/ai/architectures/model-reports/mai-thinking-1-building-a-hill-climbing-machine)
