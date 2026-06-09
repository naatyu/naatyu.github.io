---
title: "Scaling Ladders and Efficiency Gain"
date: 2026-06-08
lastmod: 2026-06-08
tags:
  - ai/training
  - scaling
  - experimentation
draft: false
---

## Summary

Scaling ladders are a way to test whether an architectural or data decision still helps as model size and compute increase. Efficiency gain is the metric that turns those ladder results into a compute-normalized comparison against a baseline scaling law.

## Concepts

- **Scaling ladder:** a family of models at multiple sizes trained under a matched experimental regime.
- **TPP:** tokens per active parameter, used to define a comparable training density.
- **Efficiency gain (EG):** how much more compute a baseline would need to match a candidate's quality.
- **EG_FLOPs:** efficiency measured against theoretical training compute.
- **EG_Time:** efficiency measured against real wall-clock cost.

## 1. Why single-scale ablations are weak

A design change can look good at one proxy scale and fail later.

That can happen because:

- optimization changes with width/depth
- data saturation changes with scale
- systems overhead changes with architecture
- overtraining or undertraining regimes interact differently with the same choice

So a serious ablation should ask:

> does this improvement persist along a scaling curve?

## 2. What a scaling ladder is

A scaling ladder is a sequence of model sizes trained under a controlled rule set.

Usually you keep fixed:

- architecture family
- optimizer family
- data objective
- training density regime

and vary only model size.

One useful control variable is tokens per parameter:

$$
\mathrm{TPP} = \frac{\text{training tokens}}{\text{active parameters}}
$$

This keeps comparisons within the same rough training regime.

## 3. Why TPP matters

Not every experiment should use the same TPP.

Examples:

- architecture ablations often live near Chinchilla-like regions
- production runs may intentionally overtrain smaller active models for inference efficiency

So a ladder should match the regime that answers the question you actually care about.

## 4. Efficiency gain

Suppose the baseline ladder is fit with:

$$
L = f(C) = AC^{-\alpha} + E
$$

where:

- $C$ is cost
- $L$ is loss or some aggregate evaluation quantity
- $E$ is irreducible loss

Now suppose a candidate model achieves loss $L'$ at cost $C'$.

Define:

$$
EG = \frac{f^{-1}(L')}{C'}
$$

Interpretation:

- $f^{-1}(L')$ is the baseline compute needed to reach the candidate's quality
- dividing by $C'$ tells you how much more efficient the candidate is

If:

$$
EG = 1.3
$$

then the baseline would need 30% more compute to match the candidate.

## 5. Why use both FLOPs and time

Two different questions matter:

### EG_FLOPs

This asks:

> is the model intrinsically more compute-efficient?

This is useful when implementation maturity differs across candidates.

### EG_Time

This asks:

> which model gets to the target quality faster on the actual stack?

This matters when:

- communication changes
- kernel quality differs
- MoE dispatch or routing adds overhead
- long-context or memory pressure changes MFU

It is common for:

- a candidate to win on `EG_FLOPs`
- but lose on `EG_Time`

That is not a contradiction. It means the idea is good in principle but expensive on the current system.

## 6. What a good ladder experiment tells you

A good ladder experiment should let you answer:

- does the improvement persist as scale increases?
- does the gain shrink or grow?
- is the win theoretical, operational, or both?
- does the architecture create new system bottlenecks?

This is much stronger than a single proxy win.

## 7. Practical ladder rules

- Compare within a matched TPP regime.
- Fit a baseline scaling curve rather than eyeballing raw points.
- Track both `EG_FLOPs` and `EG_Time`.
- Promote only ideas whose gains persist at larger cost budgets.
- Treat ladder experiments as a filter for scalable decisions, not just point improvements.

## 8. What the MAI report adds

The MAI report is useful because it operationalizes this methodology for:

- architecture design
- sparsity allocation
- data-mixture search
- long-context tradeoffs

The main lesson is that scaling discipline is not optional. Without it, you are selecting for proxy winners rather than scalable winners.

## Related

- [LLM Ablation Strategy](/atlas/ai/evaluation-experimentation/llm-ablation-strategy)
- [Data Mixture Optimization](/atlas/ai/training/data/data-mixture-optimization)
- [Overtraining and Inference-Aware Scaling](/atlas/ai/training/scaling/overtraining-and-inference-aware-scaling)
- [MAI-Thinking-1: Building a Hill-Climbing Machine](/atlas/ai/architectures/model-reports/mai-thinking-1-building-a-hill-climbing-machine)
