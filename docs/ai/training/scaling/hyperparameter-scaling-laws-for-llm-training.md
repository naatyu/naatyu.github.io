---
title: "Hyperparameter Scaling Laws for LLM Training"
date: 2026-06-02
lastmod: 2026-06-02
tags:
  - ai/deep-learning
  - scaling-laws
  - optimization
  - llm-training
draft: false
---

## Summary

Scaling laws are not only about choosing model size and token count. They can also be used to predict near-optimal learning rates and batch sizes as training compute grows, turning hyperparameter search from blind sweeps into structured extrapolation.

## Concepts

- **Compute Budget ($C$):** total training FLOPs.
- **Model Parameters ($N$):** total trainable model parameters.
- **Training Tokens ($D$):** number of tokens processed during pretraining.
- **Near-Optimal Region:** a broad range of hyperparameters that achieve nearly the best loss.
- **Power-Law Fit:** a relationship of the form $y = a C^b$.

## Content

### Compute as the Scaling Variable

The playbook adopts the usual approximation:
$$
C \approx 6ND,
$$
where:
- $N$ is model parameters,
- $D$ is training tokens.

This is useful because learning rate and batch size should not really be treated as functions of model size alone. They depend on the full training scale, which includes both capacity and duration.

### Why This Matters

A fixed learning rate that works for a small short run may be too aggressive for:

- a larger model,
- a longer run,
- or a larger total compute budget.

Likewise, batch size should scale with training scale because larger runs benefit more from efficient gradient estimation and stability.

So the practical question becomes:

$$
\eta_{\text{opt}} = f(C), \qquad B_{\text{opt}} = g(C).
$$

### How the Playbook Uses Scaling Laws

The workflow is:

1. choose a scheduler, ideally one that is easy to extend such as WSD;
2. train across several compute budgets;
3. sweep learning rate and batch size at each budget;
4. identify the near-optimal region;
5. fit power laws across budgets.

This yields relationships such as:
$$
\eta_{\text{opt}} \propto C^{-\alpha},
\qquad
B_{\text{opt}} \propto C^{\beta},
$$
with $\alpha > 0$ and $\beta > 0$ in typical large-scale settings.

The playbook cites DeepSeek-style fits of the form:
$$
\eta_{\text{opt}} = 0.3118 \cdot C^{-0.1250}
$$
and
$$
B_{\text{opt}} = 0.2920 \cdot C^{0.3271}.
$$

The exact coefficients are setup-dependent, but the qualitative trend is the important part:

- larger compute budgets prefer smaller peak learning rates,
- and larger batch sizes.

### The Broad Sweet Spot Insight

One particularly useful observation is that the optimum is often broad.

That means the target is not:

$$
\text{find the exact best hyperparameter}
$$

but rather:

$$
\text{find a robust near-optimal region}.
$$

This changes practice in a major way:

- hyperparameter fitting becomes cheaper,
- exact local optima matter less,
- and scaling laws become more valuable because approximate extrapolation is often enough.

### Why Distribution Matters

These laws are not universal constants.

They can be fairly stable **within** a fixed data distribution, but may shift when:

- the language mix changes,
- data quality changes,
- domain balance changes,
- or the tokenizer/distribution changes materially.

So a useful mental model is:

$$
\eta_{\text{opt}} = f(C \mid \text{data distribution}),
\qquad
B_{\text{opt}} = g(C \mid \text{data distribution}).
$$

This is why imported laws from another training stack should be treated as priors, not truths.

### Operational Implication

The real gain is not theoretical elegance. It is reducing the cost of repeated sweeps as scale increases.

Once fitted on your setup, these laws can become default generators for:

- new model sizes,
- new token budgets,
- and new compute plans,

as long as the training distribution stays similar enough.

## Practical Heuristics

- Use compute, not just model size, as the main scaling variable.
- Fit broad near-optimal regions rather than narrow best points.
- Expect optimal learning rate to decrease with scale.
- Expect optimal batch size to increase with scale.
- Refit if the data distribution changes materially.

## Related

- [Scaling Laws](/atlas/ai/training/scaling/scaling-laws)
- [Batch size & Learning rate](/atlas/ai/training/optimization/batch-size-and-learning-rate)
- [Warmup-Stable-Decay Learning Rate Schedule](/atlas/ai/training/optimization/warmup-stable-decay-learning-rate-schedule)
- [Smol Training Playbook Foundations](/atlas/ai/training/smol-training-playbook-foundations)
- [Smol Training Playbook](https://huggingface.co/spaces/HuggingFaceTB/smol-training-playbook)
