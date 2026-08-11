---
title: "Skaling: Coupled Model-Data Scaling Laws"
date: 2026-08-11
lastmod: 2026-08-11
tags:
  - ai/training
  - scaling-laws
  - pretraining
  - compute-optimal-training
  - experimentation
draft: false
---

## Summary

The standard Chinchilla scaling law represents model capacity and training data as two independent additive contributions to loss. This implies that the marginal value of adding parameters does not depend on the amount of data, and vice versa.

Videau et al. find that this independence assumption produces a systematic saddle-shaped prediction error near imbalanced boundaries of model-size and token-count grids. They propose **Skaling**, which adds one outer exponent to couple the two contributions:

$$
L(N,D)
=
\left(
\frac{A}{N^\alpha}
+
\frac{B}{D^\beta}
\right)^k
+E.
$$

At $k=1$, this is exactly the additive Chinchilla law. For $0<k<1$, it represents the negative model-data interaction observed in their main experiments. The coupled form improves boundary extrapolation and supports an inexpensive L-shaped profiling grid, but it does not establish a new universal tokens-per-parameter ratio.

This is a method for **predicting and allocating pretraining compute**, not a new model architecture or training objective.

## Concepts

- **Model-data coupling:** the marginal loss reduction from increasing model size depends on how much data the model sees, and conversely.
- **Mixed derivative:** $\partial^2L/(\partial N\partial D)$; an additive model forces it to zero.
- **Skaling exponent ($k$):** the outer exponent controlling coupling strength.
- **Boundary bias:** systematic prediction error where $N$ and $D$ are strongly imbalanced.
- **L-shaped grid:** a sparse experiment design that sweeps $D$ at small $N$ and sweeps $N$ at small $D$.
- **Far extrapolation:** prediction beyond the observed ranges of both $N$ and $D$.
- **Iso-ratio slice:** a sequence of runs holding $D/N$ constant while compute increases.

## 1. The independence assumption inside Chinchilla

The standard Chinchilla loss model is

$$
L_{\text{Chinchilla}}(N,D)
=
\frac{A}{N^\alpha}
+
\frac{B}{D^\beta}
+E,
$$

where:

- $N$ is the number of model parameters;
- $D$ is the number of training tokens;
- $A$ and $B$ are fitted amplitudes;
- $\alpha$ and $\beta$ are scaling exponents;
- $E$ is an estimated irreducible loss floor.

The model-size term depends only on $N$, and the data term depends only on $D$. Consequently,

$$
\frac{\partial^2L_{\text{Chinchilla}}}{\partial N\partial D}=0.
$$

This is a strong structural claim, not merely a convenient notation. It says that changing the data budget cannot change the marginal value of model capacity.

Chinchilla can still fit the interior of an empirical grid extremely well. The failure identified by the paper is concentrated near boundaries:

- small models trained on many tokens;
- large models trained on few tokens;
- configurations beyond the observed range of both variables.

High interpolation $R^2$ is therefore insufficient evidence that the functional form extrapolates correctly.

## 2. Measuring whether parameters and data interact

Before selecting a new parametric law, the authors estimate local derivatives of the measured loss surface with two mesh-free methods:

- moving least squares, using local polynomial fits;
- a Gaussian-process surrogate with differentiable posterior mean.

Their first-order diagnostic is approximately

$$
\log\left|\frac{\partial L}{\partial N}\right|
=
\alpha_N\log N+\gamma_N\log D+c_N,
$$

$$
\log\left|\frac{\partial L}{\partial D}\right|
=
\gamma_D\log N+\alpha_D\log D+c_D.
$$

The cross-slopes $\gamma_N$ and $\gamma_D$ are small, so the surface appears nearly separable at first order. The decisive diagnostic is instead the mixed derivative:

$$
\frac{\partial^2L}{\partial N\partial D}.
$$

It is estimated as non-zero across their primary grid and is predominantly negative. A negative mixed derivative means that increasing $D$ makes the size gradient more negative: additional parameters become more valuable when supplied with more data. The same interpretation holds symmetrically for additional data.

The authors call this a model-data **synergy**. It is an empirical property of the measured loss surface, not proof of a universal mechanism.

## 3. The Skaling functional form

Skaling keeps Chinchilla's independent inner exponents while adding an outer coupling exponent:

$$
L_{\text{Skaling}}(N,D)
=
\left(
AN^{-\alpha}+BD^{-\beta}
\right)^k
+E.
$$

Define

$$
u=AN^{-\alpha}+BD^{-\beta}.
$$

The mixed derivative is

$$
\frac{\partial^2L}{\partial N\partial D}
=
k(k-1)u^{k-2}
\alpha A N^{-\alpha-1}
\beta B D^{-\beta-1}.
$$

Therefore:

- $k=1$ recovers Chinchilla and forces zero coupling;
- $0<k<1$ produces a negative mixed derivative;
- $k>1$ produces a positive mixed derivative.

For any $k>0$, loss remains strictly decreasing with both variables:

$$
\frac{\partial L}{\partial N}
=
-k\alpha A N^{-\alpha-1}u^{k-1}<0,
$$

with an analogous expression for $D$.

This monotonicity is useful. A naive additive interaction term such as

$$
GN^{-\mu}D^{-\nu}
$$

needs $G<0$ to produce a negative mixed derivative, but that term can eventually make the model predict that increasing $N$ raises loss. The multiplicative coupling avoids this sign conflict.

### Relation to Kaplan and Chinchilla

- Chinchilla uses independent inner exponents but no coupling.
- Kaplan uses an outer coupling but ties the inner exponents together.
- Skaling uses an outer coupling while leaving $\alpha$ and $\beta$ independent.

The form is not completely unprecedented: related untied outer-exponent forms appeared in work on distillation scaling. This paper's contribution is the direct study of the $N$-$D$ interaction, its derivative structure, boundary bias, and sparse profiling strategy.

## 4. L-shaped profiling grids

A dense log-spaced grid over $N$ and $D$ is expensive because its top-right corner contains large models trained for long horizons. Those few configurations dominate profiling compute.

The proposed alternative samples two inexpensive bands:

1. **D-band:** vary token count across the smallest models;
2. **N-band:** vary model size at the shortest training horizons.

The resulting layout is approximately:

```text
D
│ ×
│ ×
│ ×
│ ×
│ × × × × ×
└──────────── N
```

The two bands identify the per-axis decay rates, while the shared coupled form reconstructs the interior and expensive corner.

On the Farseer grid, the fitting compute is approximately:

| Strategy | Fitting compute |
|---|---:|
| Full grid | $5.0\times10^{22}$ FLOPs |
| L-shaped grid | $5.1\times10^{21}$ FLOPs |

This is close to a $10\times$ reduction. On SK-Grid, the reported reduction is closer to $5\times$, from $3.1\times10^{21}$ to $6.5\times10^{20}$ FLOPs.

The practical claim is not that any two boundary sweeps are sufficient. The bands still need enough range to identify the slopes, and the fitted law must be checked on deliberately withheld expensive points.

## 5. Experimental evidence

The paper evaluates four collections of runs:

- **Farseer:** 404 configurations, mainly 100M--6.4B parameters and 1B--512B tokens, plus far-extrapolation runs up to 25B parameters;
- **SK-Grid:** Meta's own grid, with models in the appendix ranging from 134M to 4.9B and separate far-extrapolation runs up to 10.8B;
- **Farseer-code:** 117 code-domain runs;
- **Chinchilla measurements:** 245 scattered configurations from a replication dataset.

The two primary full-grid comparisons are:

| Dataset and regime | Chinchilla MAPE | Skaling MAPE |
|---|---:|---:|
| Farseer, interpolation | 0.77% | **0.41%** |
| Farseer, larger $N$ | 1.48% | **0.47%** |
| Farseer, larger $D$ | 1.98% | **0.88%** |
| Farseer, far extrapolation | 2.46% | **2.31%** |
| SK-Grid, interpolation | 0.81% | **0.33%** |
| SK-Grid, larger $N$ | 0.83% | **0.39%** |
| SK-Grid, larger $D$ | 1.44% | **0.58%** |
| SK-Grid, far extrapolation | 5.17% | **0.70%** |

Across the residual comparison in Figure 1, Skaling has lower error on 76% of configurations, with a median advantage of $2.2\times$. The strongest gains occur at imbalanced boundaries rather than the grid interior.

### Sparse-grid results

With only the L-shaped fitting points, Skaling remains close to or better than full-grid Chinchilla for many interpolation and single-axis extrapolation tests. Chinchilla degrades considerably when fitted to the same sparse geometry.

For example, on SK-Grid far extrapolation:

| Fit | MAPE |
|---|---:|
| Full-grid Chinchilla | 5.17% |
| L-shape Chinchilla | 14.63% |
| Full-grid Skaling | 0.70% |
| L-shape Skaling | 1.15% |

### Compute extrapolation along fixed $D/N$

The authors also group Farseer runs into 14 fixed token-to-parameter ratios. They fit only the cheaper points on each ray and predict the eight highest-compute points per ratio, for 112 held-out runs.

Overall MAPE is:

| Law | MAPE |
|---|---:|
| Chinchilla | 2.34% |
| Farseer | 0.80% |
| Independent power law fitted per ratio | 0.99% |
| Skaling | **0.60%** |

Skaling is the strongest global law in this test. A separate one-dimensional power law is slightly better only in the near-optimal-ratio subset, where it is specially fitted to each recipe and cannot answer joint $N$-$D$ allocation questions.

## 6. What happens to compute-optimal allocation

Use the conventional dense-transformer constraint

$$
C=6ND.
$$

Substitute $D=C/(6N)$ into the inner term:

$$
Z(N)
=
AN^{-\alpha}
+
B\left(\frac{6N}{C}\right)^\beta.
$$

Because $x\mapsto x^k+E$ is monotonic for $k>0$, minimizing $Z(N)^k+E$ is equivalent to minimizing $Z(N)$. The outer exponent cancels from the stationarity condition. This yields

$$
N_*
=
\left(\frac{\alpha A}{\beta B}\right)^{\frac{1}{\alpha+\beta}}
\left(\frac{C}{6}\right)^{\frac{\beta}{\alpha+\beta}},
$$

$$
D_*
=
\left(\frac{\beta B}{\alpha A}\right)^{\frac{1}{\alpha+\beta}}
\left(\frac{C}{6}\right)^{\frac{\alpha}{\alpha+\beta}}.
$$

Consequently,

$$
\frac{D_*}{N_*}
\propto
C^{\frac{\alpha-\beta}{\alpha+\beta}}.
$$

This creates an important subtlety:

> The exponent $k$ does not move the optimum if $A$, $B$, $\alpha$, and $\beta$ are held fixed. Skaling changes the predicted optimum because fitting a different surface changes those inner fitted parameters.

On Farseer, numerical derivatives give

$$
\frac{D_*}{N_*}\propto C^{-0.14}
\quad\text{or}\quad
C^{-0.15},
$$

depending on the gradient estimator. Skaling predicts approximately $C^{-0.11}$, while Chinchilla predicts approximately $C^{+0.03}$.

However, SK-Grid fits $\alpha>\beta$, implying an **increasing** optimal token-to-parameter ratio. The direction is therefore dataset-, architecture-, and recipe-dependent. This paper does not provide a new universal replacement for the rough Chinchilla ratio.

## 7. Fitting the law in practice

Scaling-law fitting is non-convex and poorly conditioned. The amplitudes and fractional exponents live on different numerical scales, and $E$ can trade off against the reducible terms.

The paper's fitting procedure uses:

- Huber loss between predicted and measured loss in log space;
- $A$ and $B$ optimized in log coordinates;
- bounded L-BFGS-B with analytic gradients;
- basin hopping with Sobol initializations and 2,000 restarts;
- CMA-ES as a cross-check that reaches similar solutions.

The fitted bounds for Skaling are:

| Parameter | Bound |
|---|---:|
| $A,B$ | $[10^{-6},10^7]$ |
| $\alpha,\beta,k$ | $[0.01,2]$ |
| $E$ | $[0,3]$ |

A minimum credible comparison should:

1. fit Chinchilla and Skaling with the same optimizer and objective;
2. use many initializations rather than trusting one local optimum;
3. report parameter variation across resampled folds;
4. withhold larger-$N$, larger-$D$, and far-corner runs separately;
5. compare signed residuals, not only average interpolation error;
6. test fixed-$D/N$ compute extrapolation for the actual intended recipe;
7. confirm the predicted optimum with runs not used for fitting.

## 8. The irreducible floor is weakly identified

On the Farseer grid, Skaling drives the fitted floor from approximately $0.45$ to $0.03$. This must not be interpreted as evidence that the true irreducible loss is almost zero.

When $k<1$, the concave outer mapping makes the reducible component decay differently at large scale. The exponent $k$ and the floor $E$ can compensate for each other over the observed range. Since the runs do not reach genuine saturation, the data constrain their sum much better than the decomposition into reducible loss and a constant floor.

Appendix F tests a dominated-pair objective. For pairs where one configuration has more parameters, more data, and lower loss, subtracting the two loss values eliminates $E$. This alternative fitting method substantially improves Chinchilla in some boundary regimes.

On Farseer far extrapolation:

| Fit | MAPE |
|---|---:|
| Standard Chinchilla | 2.46% |
| Chinchilla without $E$ in the fitting objective | **0.79%** |
| Standard Skaling | 2.32% |
| Skaling without $E$ in the fitting objective | 1.55% |

On SK-Grid, Skaling retains a much larger advantage. The appendix nevertheless shows that part of Chinchilla's apparent boundary failure can come from weak floor identification rather than only its zero-coupling structure.

## 9. Limitations and open questions

### Frontier extrapolation remains uncertain

The directly measured models and compute budgets are far below current frontier training runs. The paper extrapolates some allocation curves to $2\times10^{25}$ FLOPs from data topping out around $10^{22}$ FLOPs. A better fit inside the measured region does not guarantee that the same exponents survive several additional orders of magnitude.

### Coupling is recipe-dependent

For SK-Grid, learning rate and global batch size are themselves functions of per-token compute and token budget. The authors acknowledge that hyperparameter policy can change the measured $N$-$D$ interaction. Data mixture, tokenizer, context length, architecture, and optimization policy are all part of the fitted law's scope.

### More parameters do not automatically make a better baseline

The nine-parameter Farseer law is usually less accurate than the six-parameter Skaling law in these tests. The authors also report difficulty fitting it with a common optimizer. This supports Skaling's inductive bias, but it means that comparison is partly entangled with optimization difficulty.

### Additional datasets show weaker coupling

Farseer-code and the replicated Chinchilla measurements fit $k\approx0.77$--$0.90$ and produce more mixed accuracy gains. The strong $k\approx0.31$--$0.45$ coupling in the two primary grids is not universal across the evaluated datasets.

### Version-one reporting inconsistency

Section 4.1 describes SK-Grid as 134 configurations across 15 model sizes, while Appendix E describes 125 runs across 14 model sizes and lists 14 configurations. This does not negate the functional comparison, but the exact run accounting should be clarified in a revision.

### Sparse profiling still needs expensive validation

An L-shaped grid is an efficient fitting design, not proof that the predicted corner is correct. At least a few held-out, high-compute configurations are needed before committing a much larger training budget.

## 10. Practical interpretation

The paper should not be summarized as:

> Chinchilla is obsolete, or optimal tokens per parameter must decrease with scale.

The defensible conclusion is:

> Do not assume that model size and data quantity affect loss independently. Fit a coupled alternative, evaluate boundary extrapolation instead of relying on interpolation $R^2$, and use sparse profiling only with held-out high-compute checks.

For a real scaling study, fit at least:

1. the additive Chinchilla law;
2. the coupled Skaling law;
3. one-dimensional compute laws along the intended operational $D/N$ ratios;
4. floor-free or dominated-pair variants as a sensitivity test.

Choose the planning law using held-out extrapolation error and stability across folds, not the in-sample fit or the most attractive tokens-per-parameter prediction.

## Related

- [Scaling Laws](/atlas/ai/training/scaling/scaling-laws)
- [Decomposing Scaling Laws](/atlas/ai/training/scaling/decomposing-scaling-laws)
- [Data-Constrained Scaling Laws](/atlas/ai/training/scaling/data-constrained-scaling-laws)
- [Scaling Ladders and Efficiency Gain](/atlas/ai/training/scaling/scaling-ladders-and-efficiency-gain)
- [Hyperparameter Scaling Laws for LLM Training](/atlas/ai/training/scaling/hyperparameter-scaling-laws-for-llm-training)
- [LLM Training Capacity Planning](/atlas/ai/training/scaling/llm-training-capacity-planning)
- [Overtraining and Inference-Aware Scaling](/atlas/ai/training/scaling/overtraining-and-inference-aware-scaling)

## Sources

- Videau et al., [Skaling: Chinchilla's Exponents Meet Kaplan's Coupling](https://arxiv.org/abs/2608.07222)
- Hoffmann et al., [Training Compute-Optimal Large Language Models](https://arxiv.org/abs/2203.15556)
- Kaplan et al., [Scaling Laws for Neural Language Models](https://arxiv.org/abs/2001.08361)
- Li et al., [Farseer: A Refined Scaling Law in Large Language Models](https://arxiv.org/abs/2506.10972)
- Busbridge et al., [Distillation Scaling Laws](https://arxiv.org/abs/2502.08606)
- Besiroglu et al., [Chinchilla Scaling: A Replication Attempt](https://arxiv.org/abs/2404.10102)
