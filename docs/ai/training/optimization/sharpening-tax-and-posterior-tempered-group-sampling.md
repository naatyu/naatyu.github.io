---
title: "Sharpening Tax: Coverage After Post-Training and PTGS"
date: 2026-10-02
lastmod: 2026-10-02
tags:
  - ai/training
  - reinforcement-learning
  - agents
  - evaluation
  - exploration
draft: false
---

## Summary

Sharpening Tax measures lost benefit from repeated sampling after post-training. Across 14 checkpoint pairs and BFCL, WebShop, and ACEBench, the authors find that post-trained agents usually have stronger single-attempt performance, while harness-equipped base models often reach more tasks with many attempts. They also propose PTGS, a sampler that adapts training temperature to estimated task difficulty. [Oh et al., paper](https://arxiv.org/pdf/2610.01509)

For engineering, the question is how much successful behavior remains available at the sampling budget the deployed system can afford. Accuracy, coverage, and the cost of selecting a successful attempt all matter.

## 1. Accuracy and coverage can move in opposite directions

For an illustrative task with independent attempt success probability `p`:

```text
pass@1 = p
pass@K = 1 - (1-p)^K
```

Imagine two equally likely tasks. A policy succeeds with probabilities `[0.4, 0.4]`; another succeeds with `[0.9, 0.0]`:

| Policy | Mean pass@1 | Mean pass@10 |
| :--- | ---: | ---: |
| Broad, moderate success | 40% | 99.4% |
| Concentrated success | 45% | About 50% |

The second policy has better accuracy per attempt but has lost the second task entirely. This constructed example explains why aggregate accuracy cannot identify coverage loss. It is not a result reported for a particular model.

Finite sampling cannot prove that a task is impossible: a success probability of zero and a very small probability can both produce no successes in a limited experiment.

## 2. The metric

The official implementation distinguishes coverage `pass@k` from consistency `pass^k`, the probability that every attempt succeeds. Given `c` successful rollouts out of `n`, its estimators and aggregate metric are:

```text
pass@k = 1 - C(n-c, k)/C(n, k)
pass^k = C(c, k)/C(n, k)

A(K) = sum over k=1,...,K-1 of [pass@K - pass@k]
S(K) = A(K) / [(K-1) * (1-pass@1)]
Tax_X(K) = X_base(K) - X_post(K), for X = A or S
```

`C(a,b)` is a binomial coefficient. Metrics are estimated per task and averaged. A positive tax indicates less sampling scalability after training. `S` normalizes by single-attempt failure headroom. The implementation uses paired task bootstrap intervals. [Official metric documentation](https://github.com/changdaeoh/sharpening-tax/tree/main/sharpening_tax)

Interpret this alongside endpoint accuracy: a policy solving everything in one attempt has little need for sampling scalability. Check how an implementation handles the zero-headroom case `pass@1 = 1` rather than dividing blindly.

## 3. PTGS: adjust exploration per task

The controller keeps discounted successes `s` and failures `f` for each stable task ID. Let `q` be the current target success rate:

```text
alpha = 2*q + s
beta  = 2*(1-q) + f
p_hat ~ Beta(alpha, beta)

h = (q-p_hat)/q       if p_hat <= q
h = (q-p_hat)/(1-q)   otherwise
temperature = T_ref * tau^h

After a group with u successes among n rollouts:
s = gamma*s + u
f = gamma*f + (n-u)
```

`tau` sets the temperature range `[T_ref/tau, T_ref*tau]`; `gamma` discounts old evidence. The Beta draw adds uncertainty to the difficulty estimate. Lower estimated success heats sampling; higher success cools it. [Official controller](https://github.com/changdaeoh/sharpening-tax/blob/main/ptgs/controller.py)

### Worked example

With `q = 0.5`, `tau = 1.5`, and `T_ref = 1`, the rule simplifies to `T = 1.5^(1-2*p_hat)`:

| Drawn success estimate | Temperature |
| :--- | ---: |
| 0.1 | About 1.38 |
| 0.5 | 1.00 |
| 0.9 | About 0.72 |

The target is a pivot for allocating exploration. It does not force the actual task success probability to equal the target.

## 4. Why this can help GRPO

For a binary-reward group of `n` independent rollouts, the probability of observing both successes and failures is:

```text
P(mixed group) = 1 - p^n - (1-p)^n
```

At `p = 0.01` and `n = 16`, about 14.9% of groups are mixed. At `p = 0.1`, about 81.5% are mixed. Improving a hard task's chance of success can therefore produce many more groups with a useful reward contrast.

If all group rewards are identical, reward-centered GRPO advantages are zero; other regularization terms may still apply. Heating a prompt helps only if it makes useful trajectories more likely. Temperature cannot supply missing tools, repair a broken environment, or guarantee exploration discovers success.

## 5. Integration details that matter

The official integration guide requires four hooks: advance the target schedule, assign temperatures before generation, update difficulty estimates from completed groups, and use those temperatures when computing training log probabilities.

- Use a stable task ID, such as an environment seed. The task pool must recur for estimates to accumulate.
- Draw one temperature per group and retain it for every rollout and turn in that group.
- Update the posterior **before filtering groups**. Otherwise all-failure tasks can disappear before contributing difficulty evidence.
- Carry the per-group temperature to the actor: score token probabilities with `softmax(logits/T_group)`.
- Checkpoint the counts, schedule, and RNG state.

The released guide notes that an unchanged RAGEN task stream with nonrepeating seeds would not accumulate per-task histories. [Integration code](https://github.com/changdaeoh/sharpening-tax/blob/main/ptgs/integration.py), [PTGS guide](https://github.com/changdaeoh/sharpening-tax/tree/main/ptgs)

For asynchronous training, my additional recommendation is to store the assigned temperature in trajectory metadata at dispatch. Recomputing it after the posterior or policy has changed would describe a different behavior distribution.

## 6. Evidence and limitations

PTGS training experiments use Qwen2.5-7B-Instruct with PPO/GRPO in Sokoban and FrozenLake. One example: Sokoban PPO pass@1 rises **46.5% → 61.1%**, and pass@128 **55.0% → 69.7%**. The reported comparison averages five runs. [Paper, Table 2](https://arxiv.org/pdf/2610.01509)

The broader checkpoint comparison is observational: exact post-training recipes are unknown, base models use a text harness while post-trained models use native scaffolding, and attempts do not necessarily have equal compute cost. These findings do not establish that RL cannot learn new capabilities. [Paper, limitations and Appendix A](https://arxiv.org/pdf/2610.01509)

The official repository supplies metric and controller examples, rather than a complete benchmark-and-RL reproduction environment. [Repository](https://github.com/changdaeoh/sharpening-tax)

### My evaluation recommendations

Report `pass@1`, coverage curves, and tax together, using fixed sampling settings and matched tasks. Also compare total generated tokens, environment actions, accelerator time, and wall-clock cost.

In production, `pass@K` assumes a successful candidate can be recognized. A reliable executable verifier makes this practical; an ambiguous judge can accept wrong attempts or reject useful ones. Include selection cost and verifier errors in the system evaluation.

Audit SFT, RL, and distillation separately when intermediate checkpoints exist. A base-to-final comparison cannot attribute lost coverage to one stage. For novel tasks that never recur, PTGS needs another way to estimate difficulty; introducing a learned estimator would be an extension requiring validation.

## Related

- [Why Sparse-Reward LLM RL Can Work](/atlas/ai/training/optimization/why-sparse-reward-llm-rl-can-work)
- [Group Relative Policy Optimization](/atlas/ai/training/optimization/group-relative-policy-optimization)
- [Adaptive Entropy Control in RL](/atlas/ai/training/optimization/adaptive-entropy-control-in-rl)
- [Long-Horizon Agentic RL Infrastructure](/atlas/ai/training/optimization/long-horizon-agentic-rl-infrastructure)
- [Test-Time Compute](/atlas/ai/inference-serving/performance/test-time-compute)

## Sources

- Oh et al., [Sharpening Tax in Post-Training](https://arxiv.org/pdf/2610.01509), October 1, 2026, v1.
- [Official repository](https://github.com/changdaeoh/sharpening-tax), particularly the metric, controller, and integration modules.
