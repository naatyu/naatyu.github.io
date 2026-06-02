---
title: "Warmup-Stable-Decay Learning Rate Schedule"
date: 2026-06-02
lastmod: 2026-06-02
tags:
  - ai/deep-learning
  - optimization
  - llm-training
draft: false
---

## Summary

Warmup-Stable-Decay (WSD) is a learning-rate schedule with three phases: warm up to a peak rate, hold that rate for most of training, then decay sharply near the end. Its main advantage is not just quality, but operational flexibility: it is easy to extend, resume, and reuse in scaling-law experiments.

## Concepts

- **Warmup Phase:** gradual increase from a small learning rate to the peak learning rate.
- **Stable Phase:** a long constant-learning-rate plateau.
- **Decay Phase:** one or more late-stage drops in learning rate.
- **WSD:** Warmup-Stable-Decay.
- **Multi-Step Decay:** a WSD variant using discrete late drops rather than a smooth function.

## Content

### Schedule Shape

A WSD schedule has the form:

1. **Warmup:** $0 \to \eta_{\max}$
2. **Stable phase:** hold $\eta_t = \eta_{\max}$
3. **Decay:** reduce learning rate late in training

One simple piecewise view is:
$$
\eta_t =
\begin{cases}
\eta_{\max}\frac{t}{T_w} & 0 \le t < T_w, \\\\
\eta_{\max} & T_w \le t < T_s, \\\\
\text{decay}(t) & T_s \le t \le T_{\text{end}}.
\end{cases}
$$

The key distinction from classic cosine schedules is the explicit long plateau.

### Why Teams Like It

The playbook’s main argument is operational:

- if training length changes,
- if you want to extend a run,
- if you want to compare different token budgets,
- or if you want to decide decay timing later,

WSD is easier to manage than a schedule whose shape is tied tightly to total training length from the start.

This is especially useful in scaling-law experiments, where the same base run may need to be interpreted at several token counts.

### Why the Stable Phase Matters

In cosine decay, the learning rate starts shrinking immediately after warmup. In WSD, the optimizer spends most of training at a constant high rate.

That gives two benefits:

1. **Simpler operational control**
   - the run is easier to extend;
   - you do not need to redesign the whole schedule if training duration changes.

2. **Late specialization**
   - most progress happens under a strong constant update regime;
   - late decay is then used for consolidation and refinement.

### Multi-Step WSD

A common version uses discrete late drops. For example:

- warm up for the first few thousand steps,
- hold the peak learning rate through most of training,
- then drop once around $80\%$ of tokens,
- then drop again around $90\%$ of tokens.

This preserves most of the benefits of WSD while making the decay structure easy to reason about and easy to modify during long runs.

### Why It Can Beat Cleaner-Looking Schedules in Practice

Even when several schedules have similar final quality, WSD may still be preferable because it optimizes the real objective:

$$
\text{training usefulness} = \text{quality} + \text{flexibility} + \text{operational simplicity}.
$$

This is one of the deeper lessons from the playbook: for long expensive runs, the easiest good schedule can be more valuable than the theoretically prettiest one.

## Practical Heuristics

- Use WSD when training length may change.
- Use it for scaling-law experiments where you want comparable runs at different token counts.
- Use late decay primarily for consolidation, not as the main driver of optimization.
- Prefer schedule flexibility when performance differences are small.

## Related

- [Learning Rate Warmup](/atlas/ai/training/optimization/learning-rate-warmup)
- [Batch size & Learning rate](/atlas/ai/training/optimization/batch-size-and-learning-rate)
- [Hyperparameter Scaling Laws for LLM Training](/atlas/ai/training/scaling/hyperparameter-scaling-laws-for-llm-training)
- [Rules of Engagement for LLM Training](/atlas/ai/training/optimization/rules-of-engagement-for-llm-training)
- [Smol Training Playbook](https://huggingface.co/spaces/HuggingFaceTB/smol-training-playbook)
