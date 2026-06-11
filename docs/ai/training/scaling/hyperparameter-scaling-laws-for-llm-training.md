---
title: "Hyperparameter Scaling Laws for LLM Training"
date: 2026-06-02
lastmod: 2026-06-11
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
- **MuP:** maximal update parametrization, a parameter-scaling scheme designed to transfer hyperparameters across model widths.
- **SP:** standard parametrization, the usual naive scaling where some hyperparameters do not transfer cleanly across width.
- **Spectral condition:** requirement that layer Jacobians and update scales remain well-behaved as width changes.

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

### MuP: hyperparameter transfer across width

Power-law hyperparameter fits are empirical. MuP attacks a related problem from a parametrization angle:

> choose the model parametrization so that good hyperparameters transfer from small width to large width.

For a linear layer:

$$
y = xW
$$

standard parametrization typically initializes:

$$
W_{ij} \sim \mathcal{N}\left(0, \frac{1}{d_{\text{in}}}\right)
$$

or an equivalent fan-in-scaled form.

This keeps activations stable at initialization, but it does not automatically make **updates** comparable across widths.

MuP asks for both:

$$
\text{activation scale stable}
$$

and:

$$
\text{parameter update effect stable}
$$

as width grows.

The key practical consequence is that some parameter groups need different learning-rate scaling rules. In broad terms:

- hidden matrix learning rates often stay width-stable
- embedding and output-head learning rates can require width-dependent scaling
- initialization and optimizer parametrization must be matched

The point is not that one magic LR works for every model. The point is:

> if the parametrization is correct, small-model sweeps become more predictive for large models.

### Why standard parametrization can fail to transfer

Suppose a weight matrix has width $d$. A parameter update:

$$
\Delta W = -\eta G
$$

does not matter by itself. What matters is its effect on the next activation:

$$
\Delta y = x \Delta W
$$

If $\|\Delta y\|$ grows or shrinks systematically with width, then the same learning rate means different functional changes at different scales.

So the right scaling target is not:

$$
\|\Delta W\| \text{ constant}
$$

but closer to:

$$
\|x\Delta W\| \text{ constant}
$$

This is why MuP is often described as preserving **maximal feature learning**: updates remain large enough to learn nontrivial features, but not so large that wider models become unstable.

### Spectral scaling intuition

The kexue.fm high-order MuP discussion frames the issue through spectral behavior.

For a layer map:

$$
h_{\ell+1} = \phi(h_\ell W_\ell)
$$

we want forward activations, backward gradients, and update-induced functional changes to remain controlled.

That means avoiding both:

$$
\|J_\ell\| \rightarrow 0
$$

and:

$$
\|J_\ell\| \rightarrow \infty
$$

where $J_\ell$ is the layer Jacobian or a related input-output sensitivity operator.

In practice, the spectral view says:

- initialization should keep signal propagation stable
- learning-rate scaling should keep update propagation stable
- output layers and embeddings need special care because their shapes scale differently from hidden layers

This connects MuP to optimizer scaling: a hyperparameter is transferable only if the underlying parametrization makes its functional effect comparable.

### Practical MuP workflow

A useful MuP-style workflow is:

1. define model family with width multiplier
2. choose parametrization and per-parameter LR scaling
3. sweep LR, batch size, and weight decay on small proxy models
4. transfer the best region to larger widths
5. verify with a small number of larger-scale checkpoints

This complements empirical scaling laws:

- MuP improves cross-width hyperparameter transfer
- power-law fits improve cross-compute extrapolation

They solve different parts of the same problem:

$$
\text{make small experiments predictive of expensive runs}
$$

## Practical Heuristics

- Use compute, not just model size, as the main scaling variable.
- Fit broad near-optimal regions rather than narrow best points.
- Expect optimal learning rate to decrease with scale.
- Expect optimal batch size to increase with scale.
- Refit if the data distribution changes materially.
- Use MuP-style parametrization when you want small-width sweeps to transfer to larger widths.
- Treat embeddings and output heads as special parameter groups in scaling experiments.

## Related

- [Scaling Laws](/atlas/ai/training/scaling/scaling-laws)
- [Batch size & Learning rate](/atlas/ai/training/optimization/batch-size-and-learning-rate)
- [Warmup-Stable-Decay Learning Rate Schedule](/atlas/ai/training/optimization/warmup-stable-decay-learning-rate-schedule)
- [Smol Training Playbook Foundations](/atlas/ai/training/smol-training-playbook-foundations)
- [Smol Training Playbook](https://huggingface.co/spaces/HuggingFaceTB/smol-training-playbook)

## Sources

- Su Jianlin, [初探MuP：超参数的跨模型尺度迁移规律](https://kexue.fm/archives/10766)
- Su Jianlin, [高阶MuP：更简明但更高明的谱条件缩放](https://kexue.fm/archives/10795)
- Su Jianlin, [MuP之上：好模型都有的三个特征](https://kexue.fm/archives/11304)
- Su Jianlin, [重新思考学习率与Batch Size（一）：现状](https://kexue.fm/archives/11260)
