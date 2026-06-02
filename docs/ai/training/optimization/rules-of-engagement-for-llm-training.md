---
title: "Rules of Engagement for LLM Training"
date: 2026-06-02
lastmod: 2026-06-02
tags:
  - ai/deep-learning
  - optimization
  - llm-training
draft: false
---

## Summary

When training LLMs, the highest-return decisions are often not the most glamorous ones. Time and compute should be allocated toward experiments with large expected leverage, while stable and flexible choices should dominate when gains are small. In practice, a finished strong run beats an endlessly optimized hypothetical one.

## Concepts

- **Exploration:** testing alternatives before locking the final recipe.
- **Execution:** committing to a configuration and actually running the training.
- **Expected Leverage:** the likely downstream value of an experiment relative to its cost.
- **Operational Flexibility:** the ability to extend, resume, or adapt a run without major disruption.

## Content

### 1. Balance Exploration and Execution

The playbook’s meta-advice is unusually strong:

- exploration is necessary,
- but over-exploration is expensive,
- and execution delay is itself a cost.

A useful way to think about it is:

$$
\text{value of more searching} \quad \text{vs} \quad \text{value of starting the real run now}.
$$

If the likely gain from another week of tuning is smaller than the value of launching earlier, the rational move is to stop tuning.

### 2. Spend Effort Where the Gains Are Largest

The playbook argues that architecture enthusiasts often overinvest in small-method gains while underinvesting in higher-leverage decisions such as:

- data quality,
- data mixture,
- robust ablations,
- and stable systems choices.

This is a useful corrective. In many real training programs, the biggest wins do not come from a clever optimizer or one extra architectural trick. They come from better data and better experimental filtering.

### 3. Prefer Flexibility and Stability When Performance Is Close

If two methods perform similarly, prefer the one that is:

- easier to resume,
- easier to extend,
- better understood,
- less sensitive,
- and less likely to fail at scale.

This is why the playbook likes choices such as WSD schedules and stable optimizers even when more aggressive alternatives may show slightly better best-case results.

### 4. Optimize for the Real Objective

The true objective in production pretraining is not:

$$
\max \text{paper-quality result under ideal conditions}
$$

It is closer to:

$$
\max \text{expected final model quality subject to compute, deadlines, and reliability}.
$$

This objective rewards:

- stable decisions,
- broad sweet spots,
- interpretable ablations,
- and methods with low failure cost.

### 5. Know When to Freeze the Recipe

There is always one more thing to test:

- another optimizer,
- another scheduler,
- another batch size,
- another architectural tweak.

A team needs an explicit point where the configuration is frozen and the goal changes from exploration to delivery.

Without that, tuning becomes a local optimization loop detached from the larger program objective.

### 6. “Perfect” Is Often the Wrong Target

The playbook’s underlying principle is:

- robust good decisions compound,
- brittle micro-optimizations often do not.

So “perfect is the enemy of good” is not motivational language here. It is an economic statement about finite compute and engineering bandwidth.

## Practical Heuristics

- Set an exploration deadline before you need it.
- Spend experimental budget where leverage is highest.
- Prefer stable and flexible methods when results are close.
- Freeze the recipe once uncertainty is no longer worth the delay.
- Treat a completed run as a real asset and endless tuning as an opportunity cost.

## Related

- [Smol Training Playbook Foundations](/atlas/ai/training/smol-training-playbook-foundations)
- [LLM Ablation Strategy](/atlas/ai/evaluation-experimentation/llm-ablation-strategy)
- [Warmup-Stable-Decay Learning Rate Schedule](/atlas/ai/training/optimization/warmup-stable-decay-learning-rate-schedule)
- [Smol Training Playbook](https://huggingface.co/spaces/HuggingFaceTB/smol-training-playbook)
