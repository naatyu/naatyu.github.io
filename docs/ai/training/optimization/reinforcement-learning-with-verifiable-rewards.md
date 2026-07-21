---
title: "Reinforcement Learning with Verifiable Rewards"
date: 2026-07-21
lastmod: 2026-07-21
tags:
  - ai/training
  - reinforcement-learning
  - reasoning
  - rlvr
draft: false
---

## Summary

Reinforcement Learning with Verifiable Rewards (RLVR) trains an LLM using outcomes that can be checked automatically. A symbolic solver can verify math, unit tests can verify code, and an environment can verify whether a tool-using agent completed its task.

RLVR describes **where the reward comes from**, not how the policy is updated. PPO, GRPO, or another policy optimizer can all consume verifiable rewards. This distinction matters because RLVR and GRPO are often incorrectly treated as synonyms.

## Concepts

- **Verifier:** a deterministic or sufficiently reliable procedure that scores a response or trajectory.
- **Outcome reward:** a reward assigned from the final result rather than every intermediate reasoning step.
- **Process reward:** supervision applied to intermediate reasoning steps.
- **Rollout:** a response or trajectory sampled from the policy.
- **Sparse reward:** a reward that provides little information beyond success or failure.
- **Reward hacking:** exploiting the verifier without accomplishing the intended task.
- **Support:** behaviors the current policy can already generate with non-negligible probability.

## 1. Reward source and policy optimizer are separate axes

An LLM RL system makes at least two independent choices:

1. How responses receive rewards.
2. How those rewards update the policy.

| Axis | Common choices |
| --- | --- |
| **Reward source** | Human preference model, AI judge, symbolic checker, unit tests, environment success |
| **Policy optimizer** | PPO, GRPO, REINFORCE-style objectives, other policy-gradient variants |

RLVR refers to the first row. GRPO refers to the second.

This means:

- RLVR can use PPO without GRPO.
- GRPO can optimize rewards from a learned judge without RLVR.
- RLVR with GRPO is one useful combination, not the definition of either method.

## 2. RLHF versus RLVR

Both methods optimize generated behavior, but they use different reward pipelines.

| Dimension | RLHF | RLVR |
| --- | --- | --- |
| Reward source | Learned human-preference model | Rule, test, solver, or environment |
| Typical signal | Subjective quality or preference | Correctness or task success |
| Separate reward model | Usually required | Often unnecessary |
| Strong domains | Helpfulness, style, safety | Math, code, games, tool use |
| Main risk | Reward-model misspecification | Verifier exploitation or narrowness |

Classic RLHF with PPO often involves four large models:

- policy
- rollout or old policy
- reference policy
- critic

It also uses a learned reward model.

GRPO removes the critic by estimating relative advantages from multiple responses to the same prompt. RLVR can remove the learned reward model by replacing it with an executable verifier. The combination substantially reduces the model memory required by the conceptual RLHF pipeline, although practical training still needs rollout workers, inference replicas, and policy-version management.

## 3. Basic RLVR loop

For a prompt $q$, sample one or more responses:

$$
y_i \sim \pi_\theta(\cdot \mid q)
$$

Run the verifier:

$$
R_i = V(q, y_i)
$$

For a binary verifier:

$$
R_i \in \{0,1\}
$$

The optimizer converts rewards into a learning signal and increases the probability of successful trajectories. A group-based method may compute:

$$
A_i = \frac{R_i - \operatorname{mean}(R_{1:G})}
{\operatorname{std}(R_{1:G})}
$$

but group-relative normalization is not required by RLVR itself.

A practical loop is:

1. Select prompts near the policy's learning frontier.
2. Sample fresh rollouts from the current or recent policy.
3. Extract answers, code, or environment actions.
4. Execute the verifier.
5. Compute advantages and update the policy.
6. Re-evaluate pass rates, length, entropy, and verifier failures.

## 4. What outcome rewards teach

An outcome verifier says whether the result succeeded. It does not prescribe the reasoning trace that must produce that result.

This leaves the policy free to discover behaviors such as:

- decomposing a problem
- backtracking after a failed approach
- checking intermediate results
- writing tests for its own code
- allocating more tokens to difficult prompts
- stopping early on easy prompts

These behaviors can appear during RL without direct labels for each reasoning step.

However, RL should not automatically be credited with creating reasoning from nothing. Pretraining and SFT may already place reflection, chain-of-thought, and self-correction inside the policy's support. RL can then select, amplify, and combine behaviors that were already possible.

A useful mental model is:

$$
\text{pretraining builds behavioral support}
$$

$$
\text{RLVR searches and reallocates probability within that support}
$$

## 5. Training-pipeline variants

### Pure RL from a base model

DeepSeek-R1-Zero demonstrated that a base model can develop stronger reasoning behavior using rule-based rewards without a preceding reasoning SFT stage.

This is scientifically useful because it isolates what RL can produce through exploration. It is not necessarily the strongest production recipe: pure-RL models can have readability, language-mixing, and formatting problems.

### SFT followed by RLVR

SFT first establishes useful response formats and reasoning patterns. RLVR then optimizes exploration and correctness.

This usually gives the policy a better starting support and reduces the number of completely unsuccessful rollouts early in training.

### Distillation followed by RLVR

A smaller model can first imitate reasoning traces from a stronger teacher and then receive additional RLVR training on its own rollouts.

Distillation transfers strategies cheaply. RLVR then corrects student-specific mistakes and adapts those strategies to trajectories the student actually generates.

### Multi-stage post-training

Practical reasoning models often alternate among:

- reasoning SFT
- RLVR on verifiable domains
- rejection sampling and distillation
- general instruction or preference RL
- tool-use and agentic RL

The strongest recipe is therefore usually a pipeline, not a contest between SFT and RL.

## 6. Reward design

### Accuracy rewards

The verifier checks the intended result:

- exact or equivalent mathematical answer
- successful compilation and tests
- correct game state
- completed environment objective

Accuracy verification should canonicalize harmless differences without accepting semantically incorrect outputs.

### Format rewards

Format rewards encourage parsable outputs, such as separating a reasoning span from a final answer.

They improve training reliability but do not create reasoning ability. If overweighted, they teach the model to optimize syntax instead of correctness.

### Length and cost rewards

Correctness-only rewards can indirectly favor long responses because additional tokens provide more opportunities to search, revise, and verify.

A reward may therefore include a cost term:

$$
R(q,y)
=
R_{\text{correct}}(q,y)
- \lambda R_{\text{length}}(y)
$$

Length control must be calibrated carefully. Penalizing tokens before the policy can solve a problem may suppress exploration and teach shallow shortcuts.

### Outcome versus process rewards

Outcome rewards are simple and hard to manipulate when the final result is truly verifiable. Their weakness is credit assignment: a long response receives one final signal.

Process rewards provide denser feedback, but intermediate reasoning is harder to label reliably and learned process reward models can themselves be hacked.

## 7. Sparse rewards and the learning frontier

Binary verification is useful only when sampled groups contain informative variation.

- If every rollout fails, the policy gets little evidence about what to reinforce.
- If every rollout succeeds, the prompt no longer distinguishes better behavior.

This motivates pass-rate filtering and curricula that keep prompts near the policy's frontier.

Useful interventions include:

- sampling more rollouts for difficult prompts
- starting from SFT or distilled checkpoints
- mixing easier and harder problems
- increasing context or completion budgets gradually
- retaining prompts with mixed group outcomes

The objective is not to maximize dataset difficulty. It is to maximize useful learning signal per rollout.

## 8. Failure modes

### Verifier exploitation

The policy may satisfy the literal checker while violating the intended task.

Examples include:

- hard-coding visible test cases
- exploiting parser ambiguities
- producing malformed answers that receive a default success score
- manipulating an environment without completing the intended objective

Private tests, adversarial verifier audits, and multiple independent checks reduce this risk.

### Long incorrect answers

PPO- and GRPO-style objectives can contain normalization choices that under-penalize tokens in long responses. Correctness rewards also make extended search attractive even when the final answer remains wrong.

Mitigations include:

- token-level rather than sample-level loss normalization
- overlong completion penalties
- removing problematic length normalization
- training explicit reasoning-effort modes

### Difficulty bias

Normalizing rewards by each group's standard deviation can overweight prompts with very small reward variance. Dr. GRPO removes this question-level standard-deviation normalization along with response-length normalization to produce a cleaner signal.

### Narrow-domain optimization

Math and code are convenient because they are easy to verify, not because they cover all useful reasoning. A policy trained too narrowly can improve benchmark reasoning without preserving knowledge, instruction following, or open-domain usefulness.

## 9. Beyond exact verification

Many valuable tasks do not have a binary checker:

- medical explanation
- research synthesis
- ambiguous planning
- creative generation
- subjective helpfulness

Possible extensions include:

- reference-answer comparison
- rubric-based AI judges
- multiple independent judges
- environment or user feedback
- calibrated soft scores

As verification becomes softer, RLVR inherits more of the misspecification and reward-hacking risks associated with learned reward models. The boundary between RLVR and general reward-model-based RL is therefore a spectrum rather than a perfect division.

## Practical Heuristics

- Keep reward source and policy optimizer conceptually separate.
- Start with tasks whose success criteria can be audited independently.
- Verify the verifier before scaling rollout volume.
- Track pass-rate distributions, not only mean reward.
- Filter groups where all rollouts have the same outcome.
- Measure response length, entropy, and correctness together.
- Do not penalize exploration before the policy can reliably solve the task.
- Use private and adversarial tests for code and agent environments.
- Combine RLVR with SFT or distillation when base-model success is too sparse.
- Re-evaluate general capabilities after specialized RLVR stages.

## Related

- [Reinforcement Learning for LLMs](/atlas/ai/training/optimization/reinforcement-learning-for-llms)
- [Group Relative Policy Optimization](/atlas/ai/training/optimization/group-relative-policy-optimization)
- [Reasoning Effort Control](/atlas/ai/inference-serving/performance/reasoning-effort-control)
- [On-Policy Distillation](/atlas/ai/training/optimization/on-policy-distillation)
- [Self-Distillation in RL Climbs](/atlas/ai/training/optimization/self-distillation-in-rl-climbs)
- [Adaptive Entropy Control in RL](/atlas/ai/training/optimization/adaptive-entropy-control-in-rl)

## Sources

- [Sebastian Raschka - The State of Reinforcement Learning for LLM Reasoning](https://magazine.sebastianraschka.com/p/the-state-of-llm-reasoning-model-training)
- [DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning](https://arxiv.org/abs/2501.12948)
- [DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models](https://arxiv.org/abs/2402.03300)
- [Kimi k1.5: Scaling Reinforcement Learning with LLMs](https://arxiv.org/abs/2501.12599)
- [Understanding R1-Zero-Like Training: A Critical Perspective](https://arxiv.org/abs/2503.20783)
- [DAPO: An Open-Source LLM Reinforcement Learning System at Scale](https://arxiv.org/abs/2503.14476)
- [Open-Reasoner-Zero: An Open Source Approach to Scaling Up Reinforcement Learning on the Base Model](https://arxiv.org/abs/2503.24290)
