---
title: "Decomposing Scaling Laws: Optimization, Architecture, and Data"
date: 2026-07-29
lastmod: 2026-08-11
tags:
  - ai/training
  - scaling-laws
  - optimization
  - architecture
  - data
draft: false
---

## Summary

Neural scaling laws are usually presented as isolated empirical relationships:

- loss versus model size
- loss versus training tokens
- learning rate versus compute
- batch size versus compute

Su Jianlin proposes a useful way to connect them. The loss of a trained model can be decomposed into three gaps:

$$
\text{data gap}
+
\text{optimization gap}
+
\text{architecture gap}
+
\text{irreducible floor}
$$

Each gap is then modeled with simple power-law terms. Optimizing those terms under constraints such as fixed tokens, parameters, or compute recovers many familiar scaling patterns.

This is not a first-principles theory or an experimentally established universal law. It is closer to dimensional analysis: use monotonicity and engineering intuition to propose a small number of terms, derive their consequences, and compare them with observed scaling laws.

Its main value is conceptual. It explains why model size, batch size, learning rate, training duration, data repetition, sparsity, and memory capacity cannot be treated as independent scaling problems.

## Concepts

- **Ideal distribution $\mathcal E$:** inaccessible target distribution on which the final model should perform well.
- **Training distribution $\mathcal D$:** finite data actually available for optimization.
- **Optimization gap:** distance between the achieved training loss and the best loss the architecture could reach on the training data.
- **Architecture gap:** distance between the architecture's best achievable training loss and the limit of an unrestricted architecture.
- **Data gap:** difference between performance on the ideal distribution and on the training data.
- **Power-law coefficient:** vertical position of a scaling curve, interpreted here as engineering efficiency.
- **Power-law exponent:** slope of a scaling curve in log-log space, interpreted here as asymptotic problem difficulty.

## 1. The mixed-power optimization pattern

The derivations repeatedly minimize two power terms that move in opposite directions:

$$
f(x)=ax^p+bx^{-q},
\qquad
a,b,p,q,x>0
$$

Weighted AM-GM or ordinary differentiation gives:

$$
f(x)
\geq
(p+q)
\left(
\frac{a^q b^p}{p^p q^q}
\right)^{\frac{1}{p+q}}
$$

with equality at:

$$
x^*
=
\left(
\frac{bq}{ap}
\right)^{\frac{1}{p+q}}
$$

The important property is closure under optimization:

> When competing terms are power laws, the optimal allocation and optimal value are also power laws.

This is why the same algebra can describe learning-rate tuning, batch-size selection, model/data allocation, and repeated-data trade-offs.

## 2. Triple decomposition of loss

Let:

$$
L(\mathcal E\mid\mathcal D,\mathcal A,\mathcal O)
$$

be the loss on the ideal distribution after training on data $\mathcal D$ with architecture $\mathcal A$ and optimizer configuration $\mathcal O$.

Insert progressively stronger idealizations:

$$
\begin{aligned}
L(\mathcal E\mid\mathcal D,\mathcal A,\mathcal O)
&=
\underbrace{
L(\mathcal E\mid\mathcal D,\mathcal A,\mathcal O)
-
L(\mathcal D\mid\mathcal A,\mathcal O)
}_{F_{\text{data}}}
\\
&\quad+
\underbrace{
L(\mathcal D\mid\mathcal A,\mathcal O)
-
L(\mathcal D\mid\mathcal A,\infty)
}_{F_{\text{opt}}}
\\
&\quad+
\underbrace{
L(\mathcal D\mid\mathcal A,\infty)
-
L(\mathcal D\mid\infty,\infty)
}_{F_{\text{arch}}}
\\
&\quad+
L(\mathcal D\mid\infty,\infty)
\end{aligned}
$$

The terms mean:

| Component | Question |
| --- | --- |
| $F_{\text{data}}$ | How much worse is generalization than training performance? |
| $F_{\text{opt}}$ | How far did practical optimization stop from this architecture's training optimum? |
| $F_{\text{arch}}$ | How far is this architecture from unlimited representational capacity? |
| Floor | What loss remains even with ideal architecture and optimization on this data? |

Under the usual assumption that more data, better optimization, and more expressive architectures do not hurt, the gaps are non-negative.

The decomposition is an accounting identity. The modeling assumptions enter only when a functional form is assigned to each gap.

## 3. Optimization gap

Fix the data and architecture. Let:

- $T$ be the number of optimizer steps
- $\eta$ be the learning rate
- $B$ be the batch size

The proposed optimization law is:

$$
F_{\text{opt}}
\sim
\alpha_1(T\eta)^{-\gamma_1}
+
\alpha_2B^{-\gamma_2}
+
\alpha_3\eta^{\gamma_3}
$$

The three terms express:

1. **Insufficient travel:** more steps or a larger learning rate let optimization move farther.
2. **Gradient noise:** larger batches produce a more stable gradient estimate.
3. **Discretization or update noise:** an excessively large learning rate prevents precise convergence.

The first and third terms compete:

$$
\eta \uparrow
\quad\Rightarrow\quad
(T\eta)^{-\gamma_1}\downarrow
\quad\text{but}\quad
\eta^{\gamma_3}\uparrow
$$

This creates a finite optimal learning rate.

## 4. Optimal learning rate

Minimizing the learning-rate-dependent terms gives:

$$
\eta^*
=
\left(
\frac{
\gamma_1\alpha_1T^{-\gamma_1}
}{
\gamma_3\alpha_3
}
\right)^{\frac{1}{\gamma_1+\gamma_3}}
$$

Therefore:

$$
\eta^*
\sim
T^{-\frac{\gamma_1}{\gamma_1+\gamma_3}}
$$

The optimal learning rate decreases as the training horizon grows. A long run can use smaller steps because it has more opportunities to make progress.

After optimizing $\eta$, the law collapses to:

$$
F_{\text{opt}}^*
\sim
\tilde\alpha_1T^{-\tilde\gamma_1}
+
\alpha_2B^{-\gamma_2}
$$

where:

$$
\tilde\gamma_1
=
\frac{\gamma_1\gamma_3}
{\gamma_1+\gamma_3}
$$

This is a general lesson for empirical fitting:

> If each run is already tuned to its optimal learning rate, a lower-dimensional scaling law may describe the frontier better than a model that explicitly retains learning rate.

## 5. Optimal batch size

Define the total number of processed samples:

$$
K=BT
$$

For fixed $K$:

$$
T=\frac{K}{B}
$$

so the optimized loss becomes:

$$
F_{\text{opt}}^*
\sim
\tilde\alpha_1
\left(
\frac{B}{K}
\right)^{\tilde\gamma_1}
+
\alpha_2B^{-\gamma_2}
$$

A larger batch reduces gradient noise but also reduces the number of updates available within the same sample budget.

The optimum scales as:

$$
B^*
\sim
K^{
\frac{\tilde\gamma_1}
{\tilde\gamma_1+\gamma_2}
}
$$

and the optimal gap becomes:

$$
F_{\text{opt}}^*
\sim
K^{
-
\frac{\tilde\gamma_1\gamma_2}
{\tilde\gamma_1+\gamma_2}
}
$$

For the theoretical values discussed in the post:

$$
\gamma_1=\gamma_3=1,
\qquad
\gamma_2=\frac12
$$

we obtain:

$$
\tilde\gamma_1=\frac12
$$

$$
B^*\sim K^{1/2}
$$

$$
\eta^*\sim T^{-1/2}
\sim K^{-1/4}
$$

$$
F_{\text{opt}}^*\sim K^{-1/4}
$$

These are close to several empirical laws, although the agreement should be treated as suggestive rather than confirmatory.

## 6. Architecture gap

The simplest architecture law uses parameter count:

$$
F_{\text{arch}}
\sim
\alpha_4N^{-\gamma_4}
$$

A more detailed model separates width $W$ and depth $H$:

$$
F_{\text{arch}}
\sim
\alpha_WW^{-\gamma_W}
+
\alpha_HH^{-\gamma_H}
$$

For a transformer-like parameter constraint:

$$
N\sim W^2H
$$

the optimal shape scales as:

$$
W^*
\sim
N^{
\frac{\gamma_H}
{\gamma_W+2\gamma_H}
}
$$

$$
H^*
\sim
N^{
\frac{\gamma_W}
{\gamma_W+2\gamma_H}
}
$$

and:

$$
F_{\text{arch}}^*
\sim
N^{
-
\frac{\gamma_W\gamma_H}
{\gamma_W+2\gamma_H}
}
$$

If $\gamma_W=\gamma_H=1$:

$$
W^*\sim N^{1/3},
\qquad
H^*\sim N^{1/3},
\qquad
F_{\text{arch}}^*\sim N^{-1/3}
$$

The result does not prove that all optimal transformers should scale width and depth this way. It shows how a shape rule follows once additive width and depth penalties are assumed.

## 7. Fixed-compute allocation

For a dense model, training compute is approximately:

$$
C\sim NK
$$

Ignoring constants such as the usual factor of six, combine:

$$
F_{\text{opt}}^*+F_{\text{arch}}
\sim
\hat\alpha_1K^{-\hat\gamma_1}
+
\alpha_4N^{-\gamma_4}
$$

Under $K=C/N$:

$$
F
\sim
\hat\alpha_1C^{-\hat\gamma_1}N^{\hat\gamma_1}
+
\alpha_4N^{-\gamma_4}
$$

The compute-optimal allocation is:

$$
N^*
\sim
C^{
\frac{\hat\gamma_1}
{\hat\gamma_1+\gamma_4}
}
$$

$$
K^*
\sim
C^{
\frac{\gamma_4}
{\hat\gamma_1+\gamma_4}
}
$$

$$
F^*
\sim
C^{
-
\frac{\hat\gamma_1\gamma_4}
{\hat\gamma_1+\gamma_4}
}
$$

Using:

$$
\hat\gamma_1=\frac14,
\qquad
\gamma_4=\frac13
$$

gives:

$$
N^*\sim C^{3/7},
\qquad
K^*\sim C^{4/7},
\qquad
F^*\sim C^{-1/7}
$$

The model and data exponents, approximately `0.43` and `0.57`, are close to Chinchilla's empirical near-equal compute allocation.

The derivation explains a recurring structure:

> Compute-optimal scaling balances the marginal loss reduction from more model capacity against that from more optimization or data exposure.

## 8. Sparse architectures

Dense models couple parameter capacity and computation. MoE models separate:

- total parameters $N_{\text{total}}$
- activated parameters $N_{\text{act}}$

A first model is:

$$
F_{\text{arch}}
\sim
\alpha_4
N_{\text{act}}^{-\gamma_{\text{act}}}
N_{\text{total}}^{-\gamma_{\text{total}}}
$$

Define sparsity:

$$
S=\frac{N_{\text{total}}}{N_{\text{act}}}
$$

Then:

$$
F_{\text{arch}}
\sim
\alpha_4
N_{\text{act}}^{
-(\gamma_{\text{act}}+\gamma_{\text{total}})
}
S^{-\gamma_{\text{total}}}
$$

This captures the benefit of increasing stored capacity without activating every parameter.

But the formula has a pathological implication: at fixed effective capacity, active computation could approach zero without harming loss. The post therefore proposes an active-capacity penalty:

$$
F_{\text{arch}}
\sim
\alpha_4
N_{\text{act}}^{-\gamma_{\text{act}}}
N_{\text{total}}^{-\gamma_{\text{total}}}
+
\alpha_8N_{\text{act}}^{-\gamma_8}
$$

The second term prevents the model from replacing all computation with inactive storage.

Real sparsity also has costs outside the loss law:

- routing
- all-to-all communication
- expert imbalance
- memory footprint
- low-utilization matrix multiplications
- inference latency

Any operational scaling law must model these costs separately.

## 9. MoE and memory layers

Sparse memory layers such as PKM, UltraMem, Over-Encoding, and Engram also decouple stored capacity from active computation.

They can be viewed as an extreme MoE:

- each "expert" is a stored vector
- a router, pointer, or hash selects a small subset
- retrieval adds capacity with little arithmetic

If a model contains both MoE experts and memory layers, two budgets matter:

$$
N_{\text{act}}
\quad\text{and}\quad
N_{\text{total}}
$$

For fixed active compute and total memory, allocating everything to either experts or memory is not necessarily optimal. If their error reductions have different power-law slopes, minimizing their sum produces an interior allocation.

This reframes architecture design as resource allocation:

$$
\text{How should a fixed memory budget be divided between computation and retrieval?}
$$

The specific additive law in the post is a hypothesis, but the optimization question is useful independently of that exact formula.

## 10. Data gap and repeated epochs

Let:

- $D$ be the number of unique training samples
- $K$ be the total number of processed samples
- $K/D$ be the average number of epochs

A simple data-gap law is:

$$
F_{\text{data}}
\sim
\alpha_9D^{-\gamma_9}
+
\alpha_{10}
\left(
\frac KD
\right)^{\gamma_{10}}
$$

The first term rewards more unique data. The second penalizes repeated exposure.

Combine the repetition penalty with optimized training:

$$
F_{\text{opt}}^*
+
F_{\text{data}}
\sim
\hat\alpha_1K^{-\hat\gamma_1}
+
\alpha_{10}
\left(
\frac KD
\right)^{\gamma_{10}}
$$

The first term decreases with training duration, while the second increases with repeated epochs. Their balance gives:

$$
K^*
\sim
D^{
\frac{\gamma_{10}}
{\hat\gamma_1+\gamma_{10}}
}
$$

and:

$$
\frac{K^*}{D}
\sim
D^{
-
\frac{\hat\gamma_1}
{\hat\gamma_1+\gamma_{10}}
}
$$

Under this particular model, smaller datasets should be repeated for more epochs, while the optimal epoch count falls as unique data grows.

This conclusion is fragile because it depends on the repetition penalty. The post explicitly notes two weaknesses:

- other empirical work finds the opposite epoch trend
- the penalty diverges as $K\rightarrow\infty$, while real validation loss should eventually saturate rather than grow without bound

The law may still be a useful local approximation over a limited repetition range, but it should not be extrapolated indefinitely.

## 11. Why use power laws?

The post gives four pragmatic reasons.

### Slow diminishing returns

Exponential decay reaches its floor quickly. Power laws have long tails and therefore model continued but diminishing improvement across many scales.

### Scale invariance

A power law satisfies:

$$
f(\lambda x)
=
\lambda^{-\gamma}f(x)
$$

Its shape is unchanged by rescaling the input. This makes it a natural candidate for relationships expected to persist across several orders of magnitude.

### Easy fitting

In log-log coordinates:

$$
\log f(x)
=
\log A-\gamma\log x
$$

so a pure power law becomes a straight line.

### Closure under resource optimization

Sums of competing power laws often produce power-law optimal allocations. This lets multiple scaling laws compose algebraically.

These arguments make power laws good first models, not guaranteed truths. Exponential saturation or other functions may fit better when a characteristic scale exists.

## 12. Coefficients versus exponents

When an optimizer or architecture improves, should it change the scaling coefficient, the exponent, or both?

The post suggests:

$$
\text{exponent}
\approx
\text{problem difficulty}
$$

$$
\text{coefficient}
\approx
\text{engineering efficiency}
$$

Under this interpretation, better engineering shifts the scaling curve downward without changing its asymptotic slope.

There is also an asymptotic argument. Suppose two methods have:

$$
L_1(x)=A_1x^{-\alpha_1},
\qquad
L_2(x)=A_2x^{-\alpha_2}
$$

If $\alpha_1\neq\alpha_2$, their relative advantage grows without bound:

$$
\frac{L_1(x)}{L_2(x)}
=
\frac{A_1}{A_2}
x^{-(\alpha_1-\alpha_2)}
$$

A finite engineering change producing an unbounded relative advantage may be implausible unless it changes the underlying problem or universality class.

This is an appealing hypothesis, not an established law. In practice:

- fitted exponents can change with scale range
- data distributions can change the task
- small models may lie outside the asymptotic regime
- architectural changes may alter which bottleneck dominates

The safest empirical procedure is to test both a shared-slope model and a separate-slope model, then validate extrapolation on held-out larger runs.

## 13. How to use the framework

The framework is most useful for designing experiments.

1. Define the gap being studied: data, optimization, or architecture.
2. List variables with clear monotonic effects.
3. Add the smallest set of competing terms that can create the observed optimum.
4. Fit coefficients and exponents on controlled proxy runs.
5. Derive the optimal allocation under the actual resource constraint.
6. Test the derived optimum with runs not used in the fit.
7. Reject or modify terms that produce impossible limits.

Do not fit the largest combined formula immediately. It will have too many correlated parameters and can match observations without extrapolating correctly.

Instead, use nested experiments:

- tune the optimizer at fixed architecture and data
- study architecture at near-optimal optimization
- study data with architecture and optimization controlled
- combine only the terms supported by those experiments

## 14. Limitations

- The triple decomposition is exact, but its power-law parameterizations are heuristic.
- The components are not fully independent: architecture changes optimization and generalization.
- Infinite optimizer or architecture limits are conceptual devices, not measurable quantities.
- Validation data is only a proxy for the inaccessible ideal distribution.
- Agreement with known exponents does not validate the assumed mechanism.
- Local empirical fits can produce misleading asymptotic conclusions.
- Hardware, communication, memory, and inference constraints require additional cost terms.
- Data quality, domain, and modality are difficult to reduce to scalar variables.

The right interpretation is:

> This framework organizes hypotheses and derives testable consequences; it does not prove that neural scaling laws must take these forms.

## Related

- [Scaling Laws](/atlas/ai/training/scaling/scaling-laws)
- [Skaling: Coupled Model-Data Scaling Laws](/atlas/ai/training/scaling/skaling-coupled-model-data-scaling-laws)
- [Hyperparameter Scaling Laws for LLM Training](/atlas/ai/training/scaling/hyperparameter-scaling-laws-for-llm-training)
- [Data-Constrained Scaling Laws](/atlas/ai/training/scaling/data-constrained-scaling-laws)
- [Overtraining and Inference-Aware Scaling](/atlas/ai/training/scaling/overtraining-and-inference-aware-scaling)
- [Batch Size and Learning Rate](/atlas/ai/training/optimization/batch-size-and-learning-rate)
- [MoE Routing and Load Balancing](/atlas/ai/training/optimization/moe-routing-and-load-balancing)
- [Scaling Ladders and Efficiency Gain](/atlas/ai/training/scaling/scaling-ladders-and-efficiency-gain)

## Sources

- Su Jianlin, [Deconstructing Scaling Laws: An Interplay of Optimization, Architecture, and Data](https://kexue.fm/archives/11833)
- Kaplan et al., [Scaling Laws for Neural Language Models](https://arxiv.org/abs/2001.08361)
- Hoffmann et al., [Training Compute-Optimal Large Language Models](https://arxiv.org/abs/2203.15556)
