---
title: "RL Fine-Tuning for LLMs: Interview Guide"
date: 2026-08-05
lastmod: 2026-08-05
tags:
  - ai/training
  - reinforcement-learning
  - llm
  - post-training
  - interview-prep
draft: false
---

## Summary

Modern LLM capability development is increasingly driven by **RL-based post-training**, not RL-based pretraining. Pretraining still provides most knowledge, representations, and behavioral support. RL changes which behaviors the model selects, how much computation it spends, how it uses tools, and which trajectories become probable.

A useful interview summary is:

> Pretraining creates a broad behavioral distribution. SFT makes useful behaviors accessible. RL reallocates probability toward trajectories that maximize a reward.

Current production recipes combine supervised fine-tuning, preference optimization, reinforcement learning with verifiable rewards, general RLHF or RLAIF, rejection sampling, and distillation. DeepSeek-R1-Zero demonstrated direct RL on a base model, but production-oriented DeepSeek-R1 used cold-start data and several RL/SFT stages because pure RL produced readability and language-mixing problems.

This note is an interview-oriented map of the field as of August 2026. It distinguishes established concepts from newer, still-contested optimizer variants.

## 1. Basic formulation

For prompt $x$, the LLM policy generates a completion:

$$
y \sim \pi_\theta(\cdot\mid x)
$$

A common regularized objective is:

$$
J(\theta)
=
\mathbb{E}_{x,y\sim\pi_\theta}
\left[
R(x,y)
-
\beta D_{\mathrm{KL}}
\left(
\pi_\theta(\cdot\mid x)
\|\
\pi_{\mathrm{ref}}(\cdot\mid x)
\right)
\right]
$$

The reward encourages desired behavior. The reference-policy KL limits destructive drift.

For an autoregressive LLM:

- **state $s_t$:** prompt plus generated prefix;
- **action $a_t$:** next token;
- **trajectory $\tau$:** complete response or agent interaction;
- **policy:** next-token distribution;
- **terminal reward:** score after the response or task finishes.

The policy-gradient identity is:

$$
\nabla_\theta J
=
\mathbb{E}_{\tau\sim\pi_\theta}
\left[
(R(\tau)-b)
\sum_t
\nabla_\theta\log\pi_\theta(a_t\mid s_t)
\right]
$$

The baseline $b$ reduces variance without changing the expected gradient, provided it is independent of the sampled action in the required way. This is the core behind REINFORCE, RLOO, PPO, and GRPO.

## 2. Three independent design axes

A common interview mistake is to compare terms that describe different axes.

| Axis | Examples | Question answered |
| --- | --- | --- |
| Reward source | human RM, AI judge, verifier, tests, environment | What is good? |
| Advantage estimator | critic, group mean, leave-one-out baseline | How much better was this rollout? |
| Policy objective | PPO, GRPO, GSPO, CISPO, REINFORCE | How should reward update the policy? |

Therefore:

- RLHF is not an optimizer.
- RLVR is not GRPO.
- GRPO can optimize a learned reward model.
- PPO can optimize verifiable rewards.
- DPO is preference optimization, not online rollout RL.

## 3. Classic RLHF

The canonical InstructGPT pipeline was:

1. SFT on demonstrations.
2. Collect human comparisons.
3. Train a reward model.
4. Optimize the policy against that reward model using PPO.

### Reward-model training

Given a preferred response $y_w$ and rejected response $y_l$, a Bradley-Terry reward model commonly uses:

$$
P(y_w\succ y_l\mid x)
=
\sigma
\left(
r_\phi(x,y_w)-r_\phi(x,y_l)
\right)
$$

with loss:

$$
\mathcal{L}_{RM}
=
-\log\sigma
\left(
r_\phi(x,y_w)-r_\phi(x,y_l)
\right)
$$

A reward model learns relative preferences. Its raw scalar scores are not necessarily calibrated utilities.

### The conceptual PPO models

Traditional PPO-RLHF may involve:

- policy or actor;
- old/rollout policy;
- reference policy;
- reward model;
- critic or value model.

Two easily confused policies are:

- $\pi_{\mathrm{old}}$: generated the rollout and appears in the importance ratio;
- $\pi_{\mathrm{ref}}$: anchors behavior through a KL penalty.

They can initially share weights, but they have different roles.

## 4. PPO

The token-level importance ratio is:

$$
r_t(\theta)
=
\frac{
\pi_\theta(a_t\mid s_t)
}{
\pi_{\mathrm{old}}(a_t\mid s_t)
}
$$

The clipped objective is:

$$
L^{\mathrm{PPO}}
=
\mathbb{E}_t
\left[
\min
\left(
r_tA_t,
\operatorname{clip}(r_t,1-\epsilon,1+\epsilon)A_t
\right)
\right]
$$

Intuition:

- if the new policy has not moved far, use the ordinary policy-gradient term;
- if it moved too far in a reward-improving direction, cap the benefit;
- prevent a few samples from producing extreme updates.

PPO clipping is a heuristic surrogate. It does not mathematically guarantee that the full policy stays inside a fixed KL trust region.

PPO remains relevant because a learned critic can provide token/state-level credit estimates. It is expensive and sensitive, but critic-free methods have not universally replaced it. Open-Reasoner-Zero showed that relatively plain PPO with terminal returns can scale reasoning, while VAPO revisited value-based PPO for long chain-of-thought reasoning.

## 5. DPO and offline preference optimization

DPO avoids online rollout RL and a separately deployed reward model during optimization.

Its loss is:

$$
\mathcal{L}_{DPO}
=
-\mathbb{E}
\log\sigma
\left(
\beta
\left[
\log
\frac{\pi_\theta(y_w\mid x)}{\pi_{\mathrm{ref}}(y_w\mid x)}
-
\log
\frac{\pi_\theta(y_l\mid x)}{\pi_{\mathrm{ref}}(y_l\mid x)}
\right]
\right)
$$

DPO is:

- cheap and stable;
- trained from fixed preference pairs;
- sensitive to preference-data quality and coverage;
- unable to explore arbitrary new trajectories unless data is refreshed.

Online or iterative DPO regenerates candidates from the evolving policy and relabels them. This reduces distribution drift but operationally approaches an online RL loop.

In the conventional objective:

$$
\mathbb{E}[R]-\beta D_{\mathrm{KL}}(\pi\|\pi_{\mathrm{ref}}),
$$

a **larger** $\beta$ means stronger reference anchoring. A smaller $\beta$ permits more movement. Always state the convention because libraries may expose temperature or regularization using different parameterizations.

Removing an explicit reward model does not eliminate overoptimization. Direct alignment algorithms can deteriorate at excessive KL budgets or even before finishing one epoch.

## 6. RLOO and REINFORCE-style optimization

For $G$ completions from one prompt, RLOO uses the other completions as a baseline:

$$
A_i
=
R_i
-
\frac{1}{G-1}
\sum_{j\ne i}R_j
$$

Advantages:

- no learned critic;
- simple implementation;
- unbiased leave-one-out baseline;
- whole completion can be treated as one action.

RLOO is a serious baseline. Carefully implemented REINFORCE-style methods can match or outperform more complicated PPO pipelines in some RLHF settings.

## 7. GRPO

GRPO samples several responses per prompt and computes group-relative advantages:

$$
A_i
=
\frac{
R_i-\operatorname{mean}(R_{1:G})
}{
\operatorname{std}(R_{1:G})
}
$$

It then commonly uses a PPO-like clipped token objective.

Why it became popular:

- no separate value model;
- natural fit for several math/code attempts per problem;
- relative rewards reduce variance;
- simpler memory architecture than PPO-RLHF.

### Length bias

If each response's token loss is divided by its own length, every incorrect token in a long response contributes less than one in a short response. The model can learn to produce long incorrect answers.

### Difficulty bias

Dividing by within-group reward standard deviation can amplify low-variance prompts disproportionately.

### Dr. GRPO

Dr. GRPO removes problematic per-response length normalization and group-standard-deviation normalization. It was motivated by evidence that "aha" behaviors often already exist in base models and that some response-length growth came from the objective itself.

## 8. DAPO

DAPO is a practical GRPO-derived recipe with four important changes:

- **Clip-Higher:** asymmetric clipping leaves more upward room for low-probability good tokens.
- **Dynamic sampling:** discard or replace prompts whose group is entirely correct or entirely wrong.
- **Token-level loss normalization:** avoid response-length bias.
- **Soft overlong punishment:** penalize responses smoothly as they approach the hard context limit.

The dynamic-sampling insight is fundamental:

> The best RL prompts are not the hardest prompts. They are prompts for which the current policy produces mixed outcomes.

All-fail groups have no positive evidence; all-pass groups have little discriminative signal.

## 9. Current importance-ratio research

These methods are active research, not settled replacements.

### GSPO

GRPO uses token-level ratios. GSPO computes a length-normalized sequence ratio:

$$
s_i(\theta)
=
\exp
\left(
\frac{1}{T_i}
\sum_t
\log
\frac{\pi_\theta(a_{i,t}\mid s_{i,t})}
{\pi_{\mathrm{old}}(a_{i,t}\mid s_{i,t})}
\right)
$$

Clipping and optimization occur at sequence level.

Motivation:

- reward is normally sequence-level;
- isolated token-ratio outliers can destabilize GRPO;
- sequence-level ratios are friendlier to MoE policies when routing or numerical differences perturb a few tokens.

Qwen reports better stability and efficiency than GRPO, particularly for MoE RL.

### CISPO

CISPO clips the importance-sampling **weight**, applies stop-gradient to that weight, and keeps the log-policy gradient active. Unlike PPO clipping, samples outside the interval can continue contributing, but with a bounded coefficient.

It was introduced with MiniMax-M1 and targets repeated or somewhat off-policy updates.

### CTPO

Token ratios ignore prefix-state-distribution mismatch. Full trajectory products provide exact correction but have enormous variance. GSPO stabilizes sequence ratios through length normalization but is not exact trajectory correction.

CTPO uses the cumulative ratio up to token $t$:

$$
\rho_{1:t}
=
\prod_{j=1}^{t}
\frac{
\pi_\theta(a_j\mid s_j)
}{
\pi_{\mathrm{old}}(a_j\mid s_j)
}
$$

with position-dependent log-space clipping. Its central question matters more than the acronym:

> What probability ratio correctly accounts for an autoregressive trajectory while remaining numerically usable?

## 10. RLVR

RLVR means reward comes from an auditable mechanism:

- mathematical equivalence checker;
- code compilation and private tests;
- theorem prover;
- game or environment terminal state;
- successful tool execution.

It does not specify PPO, GRPO, or another optimizer.

RLVR scales because verifier labels are cheap once the environment exists. But "verifiable" does not mean safe:

- tests may be incomplete;
- answer parsers may accept malformed output;
- visible tests may be hard-coded;
- agents may alter the grader;
- environment state may leak hidden checks;
- success may measure a proxy rather than user intent.

For code and agents, the verifier is part of the security boundary.

## 11. Outcome and process rewards

An outcome reward scores the completed trajectory:

$$
R(\tau)=R_{\mathrm{final}}
$$

A process reward supplies intermediate scores:

$$
R(\tau)
=
R_{\mathrm{final}}
+
\lambda\sum_t r_{\mathrm{process}}(s_t,a_t)
$$

Outcome rewards:

- are cheap and objective when verification is exact;
- permit unconventional strategies;
- have poor credit assignment.

Process rewards:

- provide denser credit assignment;
- require step labels or a process reward model;
- may discourage valid unfamiliar reasoning;
- can themselves be hacked.

PRM800K found process supervision better than outcome-only supervision for selecting mathematical solutions in its studied setting.

For agents, process signals might score:

- valid tool-call syntax;
- useful information gain;
- progress in environment state;
- avoidance of loops;
- recovery after an error.

Process reward must not overpower final success. A strange successful strategy should generally beat a polished failure.

## 12. General preference RL and RLAIF

Many tasks cannot be exactly verified:

- helpfulness;
- writing quality;
- research synthesis;
- safety;
- ambiguous planning.

Possible rewards include:

- human preference models;
- rubric-based LLM judges;
- constitutional AI feedback;
- judge ensembles;
- self-critique;
- reference-answer comparison.

RLAIF replaces some human comparisons with AI-generated preferences. Constitutional AI used critiques, revisions, and AI preferences followed by RL.

As reward becomes softer, expect more:

- annotator or judge bias;
- verbosity preference;
- style homogenization;
- reward-model overoptimization;
- distribution shift;
- correlated errors between policy and judge.

Production pipelines often combine exact rewards where possible and learned rubric rewards elsewhere.

## 13. Does RL create new reasoning?

A careful answer is:

> RL clearly improves pass@1 behavior and search allocation, but current evidence does not establish that it routinely creates reasoning strategies absent from the base model's support.

At large $k$, base models can sometimes recover trajectories found by RL models. RL then appears to concentrate probability on successful strategies, improving sampling efficiency while possibly narrowing diversity.

Some Qwen math models even improved under random, format-only, or incorrect-label rewards. This did not transfer consistently to Llama or OLMo, suggesting strong base-model and optimizer inductive biases.

This does not mean RL is useless:

- base-model support matters enormously;
- pass@1 improvement is economically valuable;
- reward quality should be tested against spurious baselines;
- one math-trained base model does not establish generality;
- distillation or continued training is better suited to adding missing knowledge.

## 14. Production-style post-training pipeline

A modern pipeline resembles:

1. Start from a strong base or mid-trained checkpoint.
2. Cold-start SFT for formats, tools, reasoning modes, and basic support.
3. Select prompts near the current learning frontier.
4. Generate multiple fresh rollouts.
5. Execute verifiers, reward models, or environments.
6. Compute advantages and policy ratios.
7. Apply a conservative policy update.
8. Synchronize learner weights to rollout workers.
9. Monitor reward, entropy, length, KL, and general capability.
10. Periodically distill or consolidate successful policies.
11. Run general-preference and safety stages after specialized reasoning RL.

Qwen3 publicly described four stages: long-CoT cold start, reasoning RL, thinking/non-thinking mode fusion, and general-domain RL. Kimi K2 extended RL into real and synthetic agent environments, combining verifiable outcomes with self-critique or rubric rewards.

## 15. On-policy distillation

The student generates:

$$
a_t\sim\pi_\theta(\cdot\mid s_t)
$$

A stronger teacher scores the same token:

$$
r_t
=
\log\pi_T(a_t\mid s_t)
-
\log\pi_\theta(a_t\mid s_t)
$$

This approximates reverse-KL optimization on states actually visited by the student. It combines:

- on-policy state coverage;
- dense token-level teacher feedback;
- no sparse terminal reward requirement;
- cheaper teacher scoring than autoregressive teacher generation.

It is useful for:

- consolidating RL specialists;
- teaching smaller students;
- correcting student-specific mistakes;
- recovering assistant behavior after domain adaptation;
- distilling an expensive RL search result without repeating RL.

## 16. Systems architecture

At useful scale, rollout generation often costs more than policy updates.

A real system contains:

- task scheduler;
- rollout inference workers;
- environments and verifier workers;
- reward or teacher models;
- learner;
- reference policy;
- weight-transfer service;
- policy-version and rollout metadata.

### Long-tail generation

A synchronous batch finishes when its longest rollout finishes:

$$
T_{\mathrm{batch}}
\approx
\max_i T_i
$$

Long reasoning and tool calls create severe stragglers.

### Staleness

Asynchronous generation produces trajectories from older policies. Retain:

- rollout-policy version;
- rollout log probabilities;
- sampling masks;
- age in learner updates.

AReaL reported up to $2.57\times$ speedup with bounded staleness and an adapted PPO objective. DORA's later multi-version design keeps trajectories internally policy-consistent while overlapping rollout and training.

### Training-inference mismatch

Learner and rollout engines may differ in:

- dtype;
- kernels;
- quantization;
- top-p support;
- MoE routing;
- chat-template rendering.

This changes recorded probabilities and can destabilize importance sampling.

### Weight synchronization

Learner and inference engines may use different sharding and precision layouts. Refreshing rollout workers can require:

- resharding;
- dtype conversion;
- re-quantization;
- cache invalidation;
- coordinated version switching.

### Agent environments

Long-horizon RL also needs:

- sandboxed execution;
- hidden-verifier isolation;
- environment snapshot, fork, and restore;
- KV-cache eviction for paused trajectories;
- retry and failure accounting;
- exact production tool-call formatting.

## 17. Metrics to monitor

Never report only training reward.

Track:

- held-out pass@1;
- pass@$k$ and sampling diversity;
- reward and verifier pass rate;
- response length and truncation rate;
- entropy;
- KL to reference and rollout policy;
- importance-ratio percentiles;
- clip fraction;
- gradient norm;
- all-pass/all-fail group fractions;
- invalid-format and verifier-error rates;
- reward by prompt difficulty;
- general capability and safety regressions;
- rollout tokens per second;
- useful samples per accelerator-hour;
- policy staleness;
- environment and tool failure rates.

Reward rising while held-out quality falls is classic reward hacking or overoptimization.

## 18. Interview questions and compact answers

### What is the difference between SFT, DPO, and RL?

SFT imitates target tokens. DPO learns from fixed preference pairs relative to a reference model. Online RL samples from the evolving policy, scores those trajectories, and directly optimizes expected reward.

### Why use RL if DPO is easier?

RL explores the current policy distribution, interacts with environments, continuously generates data, optimizes arbitrary scalar objectives, and learns from outcomes rather than fixed comparisons. It costs more and is less stable.

### Why does PPO need a critic?

The critic estimates expected future return and gives lower-variance advantages. It improves credit assignment but adds another large model and another source of bias.

### Why does GRPO not need a critic?

It compares several completions for one prompt and uses group-relative rewards as a baseline. It trades critic complexity for rollout sampling.

### What is the difference between old and reference policy?

The old policy generated the rollout and appears in importance ratios. The reference policy is a behavioral anchor used for KL regularization.

### Why clip policy ratios?

To prevent a few trajectories from producing excessive updates when training reuses data after the policy has changed.

### Why are all-correct and all-wrong groups bad?

Their relative advantages contain little useful information. Mixed groups reveal which sampled behavior should become more or less probable.

### What causes length explosion?

Correctness rewards make additional search potentially useful, while some loss normalizations under-penalize long failures. Truncation may also hide negative outcomes.

### Does a verifiable reward eliminate reward hacking?

No. Incomplete tests, parser bugs, visible checks, environment manipulation, and goal misspecification remain exploitable.

### Is GRPO on-policy?

Only when rollouts are fresh and updates are limited. Multiple epochs, asynchronous generation, delayed synchronization, and inference/learner mismatch make it increasingly off-policy.

### Why can inference numerics matter to RL?

Importance ratios assume recorded rollout probabilities correspond to the behavior policy. Different kernels, quantization, sampling masks, or MoE routes can create large errors.

### Does RL teach knowledge?

Usually not efficiently. RL is better at eliciting and reallocating behavior. Continued pretraining, SFT, retrieval, or distillation is better for adding missing knowledge.

### Why can pass@1 rise while pass@100 falls?

RL concentrates probability on known successful modes, improving normal sampling while reducing rare alternative solutions.

### How would you design RL for a coding agent?

Use realistic repositories and tools, private fail-to-pass and regression tests, isolated environments, multiple trajectories per task, execution-based outcome rewards, optional process rewards, hidden-test isolation, difficulty filtering, and deployment-identical chat/tool templates.

## 19. Interview study priorities

Know these first:

1. Policy-gradient identity and baselines.
2. PPO clipping, old policy, reference policy, and critic.
3. Bradley-Terry reward modeling.
4. DPO objective and offline/online distinction.
5. GRPO versus RLOO versus PPO.
6. RLHF versus RLVR.
7. DAPO's four practical fixes.
8. Reward hacking, length bias, and entropy collapse.
9. On-policy versus stale rollouts.
10. Learner/rollout architecture and weight synchronization.
11. Why RL may improve sampling rather than create new support.
12. Agent environments and verifier security.

Treat GSPO, CISPO, VAPO, and CTPO as valuable follow-up knowledge. A correct explanation of importance sampling and credit assignment is worth more than a list of recent acronyms.

## Sources

- [Training Language Models to Follow Instructions with Human Feedback](https://arxiv.org/abs/2203.02155)
- [Direct Preference Optimization](https://arxiv.org/abs/2305.18290)
- [Back to Basics: REINFORCE-Style Optimization for RLHF](https://arxiv.org/abs/2402.14740)
- [DeepSeekMath and GRPO](https://arxiv.org/abs/2402.03300)
- [DeepSeek-R1](https://arxiv.org/abs/2501.12948)
- [Kimi k1.5](https://arxiv.org/abs/2501.12599)
- [Understanding R1-Zero-Like Training and Dr. GRPO](https://arxiv.org/abs/2503.20783)
- [DAPO](https://arxiv.org/abs/2503.14476)
- [Open-Reasoner-Zero](https://arxiv.org/abs/2503.24290)
- [VAPO](https://arxiv.org/abs/2504.05118)
- [Group Sequence Policy Optimization](https://arxiv.org/abs/2507.18071)
- [MiniMax-M1 and CISPO](https://arxiv.org/abs/2506.13585)
- [Cumulative Token Policy Optimization](https://arxiv.org/abs/2605.07331)
- [Let's Verify Step by Step](https://arxiv.org/abs/2305.20050)
- [Constitutional AI](https://arxiv.org/abs/2212.08073)
- [Does RL Incentivize Reasoning Beyond the Base Model?](https://arxiv.org/abs/2504.13837)
- [Spurious Rewards: Rethinking Training Signals in RLVR](https://arxiv.org/abs/2506.10947)
- [HybridFlow / verl](https://arxiv.org/abs/2409.19256)
- [AReaL](https://arxiv.org/abs/2505.24298)
- [DORA](https://arxiv.org/abs/2604.26256)
- [Qwen3 Post-Training](https://qwenlm.github.io/blog/qwen3/)
- [Kimi K2](https://arxiv.org/abs/2507.20534)

## Related

- [Reinforcement Learning for LLMs](/atlas/ai/training/optimization/reinforcement-learning-for-llms)
- [Preference Optimization for LLMs](/atlas/ai/training/optimization/preference-optimization-for-llms)
- [Group Relative Policy Optimization](/atlas/ai/training/optimization/group-relative-policy-optimization)
- [Reinforcement Learning with Verifiable Rewards](/atlas/ai/training/optimization/reinforcement-learning-with-verifiable-rewards)
- [On-Policy Distillation](/atlas/ai/training/optimization/on-policy-distillation)
- [Adaptive Entropy Control in RL](/atlas/ai/training/optimization/adaptive-entropy-control-in-rl)
- [Self-Distillation in RL Climbs](/atlas/ai/training/optimization/self-distillation-in-rl-climbs)
- [Asynchronous RL Infrastructure](/atlas/systems/infrastructure/asynchronous-rl-infrastructure)
- [Long-Horizon Agentic RL Infrastructure](/atlas/ai/training/optimization/long-horizon-agentic-rl-infrastructure)
- [Agentic Training Data and Environment Synthesis](/atlas/ai/training/data/agentic-training-data-and-environment-synthesis)
