---
title: "Reinforcement Learning for LLMs"
date: 2026-06-08
lastmod: 2026-08-17
tags:
  - ai/training
  - reinforcement-learning
  - llm
draft: false
---

## Summary

For LLMs, reinforcement learning is a later-stage training method used after pretraining and often after SFT. Instead of only fitting next-token prediction on fixed text, the model generates responses, receives rewards, and updates itself to make rewarded behaviors more likely.

## Concepts

- **Policy:** the model distribution over next tokens or responses.
- **Rollout:** a generated response or trajectory sampled from the current or stale policy.
- **Reward:** a scalar score measuring response quality.
- **Verifier:** an executable or rule-based procedure that checks whether an outcome is correct.
- **Advantage:** how much better a response is than a baseline or peer group.
- **On-policy / off-policy:** whether training uses very fresh samples from the current policy or somewhat stale samples from earlier policies.

## 1. Where RL fits in the training stack

A simple mental model is:

1. **Pretraining** teaches broad prediction and knowledge.
2. **Mid-training / SFT** biases the model toward desired formats or domains.
3. **RL** teaches the model how to allocate inference-time behavior toward rewarded outcomes.

For LLMs, RL is often used for:

- mathematical reasoning
- coding and tool use
- instruction following
- helpfulness
- safety and refusal behavior

## 2. Why pretraining is not enough

Pretraining optimizes:

$$
\max \log p(x_t \mid x_{<t})
$$

This makes the model a better predictor of text.

But many downstream goals are not simply “be like the next token in a corpus.” We also want:

- longer reasoning traces when needed
- short answers when enough
- successful code execution
- good tool selection
- better adherence to instructions

Those are easier to express through rewards than through pure next-token prediction.

## 3. RL as behavior shaping

In RL for LLMs, the model samples responses and gets rewards:

$$
R(q, y)
$$

for prompt $q$ and response $y$.

The model is then updated to increase the probability of high-reward responses.

That means RL is less about teaching raw knowledge and more about:

- policy shaping
- search allocation
- output preferences
- strategic use of tokens and tools

## 4. Common reward sources

Rewards may come from:

- executable tests
- exact-match answers
- heuristic judges
- reward models
- AI judges
- pairwise comparisons

The strongest RL settings are often those where the reward is closest to ground truth:

- verified math
- code execution
- environment success

### RLHF versus RLVR

Two common reward pipelines are:

| Method | Reward source | Typical use |
| --- | --- | --- |
| **RLHF** | A learned model trained from human preferences | Helpfulness, style, safety |
| **RLVR** | A rule, test, solver, or environment | Math, code, tool use |

[Reinforcement Learning with Verifiable Rewards](/atlas/ai/training/optimization/reinforcement-learning-with-verifiable-rewards) often removes the need for a learned reward model, but it does not prescribe a policy optimizer. PPO, GRPO, or another optimizer can consume verifiable rewards.

This distinction is useful:

- **RLHF / RLVR** describes where reward comes from.
- **PPO / GRPO** describes how reward updates the policy.

## 5. Group-based RL for LLMs

A common pattern is to sample multiple responses for the same prompt and compare them relative to each other.

That is the intuition behind methods like GRPO:

- generate a group of candidate responses
- score them
- compute relative advantages within the group

This avoids needing a full separate critic in the same style as classical actor-critic RL.

## 6. Why RL training is fragile

LLM RL is not just “run PPO on text.”

Major failure modes include:

- entropy collapse
- exploding policy ratios
- reward hacking
- stale rollouts
- inference/training numerics mismatch
- excessive response length
- low-signal groups that are all too easy or too hard

This is why practical RL stacks add many stabilizers on top of the base objective.

## 7. Important practical stabilizers

In large LLM RL systems, common stabilizers include:

- clipping policy ratios
- entropy control
- response-length penalties
- pass-rate filtering
- top-p mask replay
- self-distillation between climbs
- stale-policy limits

These are not theoretical decorations. They are often what makes the training run continue climbing instead of collapsing.

## 8. Why RL is especially relevant for reasoning models

Reasoning models care about more than correctness of the final answer.

They also care about:

- how much thinking to do
- how to use tools
- when to stop
- how to stay within a safe or desired style

This is why RL is especially natural in later-stage reasoning-model training.

Pretraining builds the substrate. RL shapes the search behavior on top of it.

## 9. Useful way to think about it

Pretraining says:

> learn the distribution of text

RL says:

> among plausible continuations, prefer the ones that score well under the target behavior

So RL is often best viewed as:

- behavior optimization on top of pretrained competence
- not a replacement for pretraining

## 10. Production-harness RL is stronger than toy-harness RL

One practical lesson from recent agentic RL systems is that rollouts are more useful when the model interacts with the same basic tool API and orchestration style that it will see in deployment.

This matters because otherwise the policy may optimize for:

- a synthetic action format
- different tool semantics
- different conversation rendering
- or unrealistically clean environment behavior

So for agentic coding and tool-use training, the closer the rollout harness is to the deployed harness, the more likely the learned behavior will transfer cleanly.

## Related

- [Why Sparse-Reward LLM RL Can Work](/atlas/ai/training/optimization/why-sparse-reward-llm-rl-can-work)
- [RL Fine-Tuning for LLMs: Interview Guide](/atlas/ai/training/optimization/rl-fine-tuning-for-llms-interview-guide)
- [On-Policy Distillation](/atlas/ai/training/optimization/on-policy-distillation)
- [Group Relative Policy Optimization](/atlas/ai/training/optimization/group-relative-policy-optimization)
- [Reinforcement Learning with Verifiable Rewards](/atlas/ai/training/optimization/reinforcement-learning-with-verifiable-rewards)
- [Adaptive Entropy Control in RL](/atlas/ai/training/optimization/adaptive-entropy-control-in-rl)
- [Self-Distillation in RL Climbs](/atlas/ai/training/optimization/self-distillation-in-rl-climbs)
- [Asynchronous RL Infrastructure](/atlas/systems/infrastructure/asynchronous-rl-infrastructure)
- [Chat Templates for LLMs](/atlas/ai/inference-serving/chat-templates-for-llms)
- [MAI-Thinking-1: Building a Hill-Climbing Machine](/atlas/ai/architectures/model-reports/mai-thinking-1-building-a-hill-climbing-machine)
