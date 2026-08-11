---
title: "Scaling Laws"
date: 2026-04-08
lastmod: 2026-08-11
tags:
  - ai/theory
  - scaling-laws
draft: false
---

## Summary

Scaling laws are empirical power laws that estimate how language-model loss changes with model parameters ($N$), training tokens ($D$), and training compute ($C$). They are useful because they turn expensive pretraining decisions into extrapolation problems: fit smaller runs, estimate the frontier, then choose how to spend compute.
## Concepts
- **Scaling law:** an empirical relationship, usually a power law, between model loss and scale.
- **Parameters ($N$):** the number of trainable model parameters.
- **Dataset size ($D$):** the number of training tokens seen during pretraining.
- **Compute ($C$):** the training FLOPs budget.
- **IsoFLOP analysis:** compare different model sizes under the same compute budget to find the lowest-loss allocation of $N$ and $D$.
- **Compute-optimal training:** choose $N$ and $D$ that minimize training loss for a fixed compute budget.
- **Over-training:** train on far more tokens than the compute-optimal rule would suggest, usually to reduce inference cost.
- **Irreducible loss ($E$):** the loss floor that remains even if model size and data are very large.
- **Data-infinite regime:** the assumption that every training token is unique enough that repetition does not matter.
- **Data-constrained regime:** the regime where high-quality unique data is finite and repeated tokens need separate modeling.

## Content

### Core intuition

For language models, loss tends to improve predictably as we increase:

- model size: more parameters
- data size: more training tokens
- compute: more total training FLOPs

The useful part is not just "bigger is better." The useful part is estimating the trade-off:

$$C \approx 6ND$$

Where:

- $C$ is total training FLOPs
- $N$ is non-embedding model parameters
- $D$ is training tokens

The factor $6$ comes from a rough transformer training estimate: about $2ND$ FLOPs for the forward pass and about $4ND$ FLOPs for backward pass. It ignores details like attention quadratic cost, embeddings, activation recomputation, optimizer overhead, and hardware utilization, but it is good enough for first-order estimates.

The standard shape is:

$$
L(x) \approx E + A x^{-\alpha}
$$

where $x$ can be data, parameters, or compute depending on the experiment.

The important interpretation is:

- $E$ is the irreducible floor
- $A x^{-\alpha}$ is reducible error
- $\alpha$ is the slope on a log-log plot

So a scaling law is not saying loss decreases linearly. It is saying each multiplicative increase in scale buys a roughly predictable but diminishing reduction in loss.

### Learning-curve regimes

A practical learning curve often has three regions:

| Region | Behavior |
|---|---|
| Too little data or compute | noisy, weakly predictable, not yet in the clean power-law region |
| Power-law region | predictable loss improvement with scale |
| Irreducible or saturated region | improvements slow because of noise, finite data, or limited objective quality |

The power-law region is the useful one for pretraining planning. If the proxy runs are outside that region, extrapolation can be misleading.

### Kaplan scaling laws

Kaplan et al. (2020), *Scaling Laws for Neural Language Models*, found that language-model loss follows smooth power laws with model size, dataset size, and compute over many orders of magnitude.

Important takeaways:

- Bigger models are more sample-efficient: for the same loss, larger models need fewer optimization steps than smaller models.
- Under the Kaplan compute-optimal rule, compute should be spent more aggressively on parameters than data.
- A common summary of Kaplan-style compute-optimal scaling is:

$$N_{opt} \propto C^{0.73}$$

$$D_{opt} \propto C^{0.27}$$

This means if compute increases by $10 \times$:

$$N_{opt} \text{ increases by } 10^{0.73} \approx 5.4 \times$$

$$D_{opt} \text{ increases by } 10^{0.27} \approx 1.9 \times$$

The practical consequence was: train very large models on relatively fewer tokens.

### Chinchilla scaling laws

Hoffmann et al. (2022), *Training Compute-Optimal Large Language Models*, revised the compute-optimal allocation. Their main result was that many earlier large models were undertrained: too many parameters, too few tokens.

They model pretraining loss as:

$$L(N, D) = E + \frac{A}{N^\alpha} + \frac{B}{D^\beta}$$

Where:

- $E$ is irreducible loss
- $\frac{A}{N^\alpha}$ is loss from limited model size
- $\frac{B}{D^\beta}$ is loss from limited data

Under the constraint:

$$C \approx 6ND$$

The compute-optimal solution is approximately:

$$N_{opt} \propto C^{0.5}$$

$$D_{opt} \propto C^{0.5}$$

So when compute increases, parameters and tokens should grow roughly equally.

This gives the common Chinchilla rule:

$$D \approx 20N$$

Meaning a compute-optimal dense model should train on roughly $20$ tokens per parameter.

Examples:

- $1B$ parameters $\rightarrow$ about $20B$ tokens
- $7B$ parameters $\rightarrow$ about $140B$ tokens
- $70B$ parameters $\rightarrow$ about $1.4T$ tokens

### How Chinchilla was fit

The useful methodological detail is that Chinchilla did not rely on a single fitting trick. It used several views of the same frontier.

| Method | Procedure | What it estimates |
|---|---|---|
| Fixed model sizes | train the same $N$ for different token budgets | best loss reachable by each model size at different compute levels |
| IsoFLOP profiles | fix $C$, sweep $N$, derive $D = C/(6N)$ | the best $N$ for each compute budget |
| Parametric fit | fit $L(N,D)=E+A/N^\alpha+B/D^\beta$ | a smooth joint loss model |

The IsoFLOP view is especially important. For a fixed compute budget:

$$
D = \frac{C}{6N}
$$

so making the model larger automatically shortens the training horizon. If $N$ is too small, the model is capacity-limited. If $N$ is too large, it is data-limited. The best point is the bottom of that fixed-compute curve.

The parametric fit also gives a closed-form frontier. Starting from:

$$
\hat{L}(N, D) = E + A N^{-\alpha} + B D^{-\beta}
$$

and using:

$$
D = \frac{C}{6N}
$$

we get:

$$
\hat{L}(N) = E + A N^{-\alpha} + B \left(\frac{C}{6}\right)^{-\beta} N^\beta
$$

Setting the derivative with respect to $N$ to zero gives:

$$
N_{opt}
=
\left(\frac{\alpha A}{\beta B}\right)^{\frac{1}{\alpha+\beta}}
\left(\frac{C}{6}\right)^{\frac{\beta}{\alpha+\beta}}
$$

and:

$$
D_{opt}
=
\left(\frac{\beta B}{\alpha A}\right)^{\frac{1}{\alpha+\beta}}
\left(\frac{C}{6}\right)^{\frac{\alpha}{\alpha+\beta}}
$$

If $\alpha \approx \beta$, then:

$$
N_{opt} \propto C^{1/2},
\qquad
D_{opt} \propto C^{1/2}
$$

This is the mathematical reason the Chinchilla rule says parameters and tokens should grow at roughly the same rate.

### Kaplan vs Chinchilla

| Paper | Main allocation rule | Practical consequence |
|---|---:|---|
| Kaplan et al. 2020 | $N$ grows faster than $D$ | Prefer larger models trained on fewer tokens |
| Hoffmann et al. 2022 / Chinchilla | $N$ and $D$ grow roughly equally | Use smaller models trained on many more tokens |

The difference matters because a fixed compute budget can be spent in two bad ways:

- Too large a model with too few tokens: undertrained.
- Too small a model with too many tokens: data-rich but capacity-limited.

Chinchilla says the optimum for training loss is near the balance point where the marginal value of extra parameters and extra data is similar.

The disagreement is also a warning about extrapolation. Two details matter:

- Kaplan fit mostly smaller models than Chinchilla, and small changes in log-log slope become large differences when extrapolated.
- Kaplan counted non-embedding parameters, while Chinchilla counted total parameters. At small scale, embeddings are not negligible, so the apparent scaling exponent can shift.

So the lesson is not simply "Kaplan was wrong." The lesson is:

> scaling-law exponents are local empirical fits, not constants of nature.

### Data-constrained scaling

Classic Chinchilla assumes a data-infinite regime:

$$
D = \text{unique useful tokens}
$$

Modern pretraining is often not in that regime. High-quality unique tokens are finite, and repeating tokens does not have the same value as adding genuinely new data.

A better decomposition is:

$$
D = U_D(1 + R_D)
$$

where:

- $U_D$ is the number of unique tokens
- $R_D$ is the number of repeats, or epochs minus one

The key practical insight is:

> raw token count is not effective token count.

Repeated data can still help, but its marginal value decays and can eventually create memorization or overfitting. This means the real scaling question is not only:

$$
\text{how many tokens?}
$$

but:

$$
\text{how many unique high-quality tokens, repeated how many times, for what model size?}
$$

For more detail, see [Data-Constrained Scaling Laws](/atlas/ai/training/scaling/data-constrained-scaling-laws).

### Why power laws may appear

There is no single settled explanation for why neural scaling laws are so clean, but two intuitions are useful.

One view is the **data manifold** view. If language data lies near a structured lower-dimensional manifold, then increasing model size lets the model partition that manifold more finely. If the effective resolution improves as a power of capacity, the loss can inherit a power-law shape.

Another view is the **skill-frequency** view. Suppose language modeling requires many small skills or facts, and those skills have a heavy-tailed frequency distribution:

- common skills are learned early
- rare skills are learned late
- each scale increase unlocks a thinner tail of rarer patterns

That naturally produces smooth diminishing returns. This is also why scaling laws feel connected to language statistics such as Zipf-like distributions.

The practical point is not that either theory is complete. The useful point is:

> power laws are plausible when a system repeatedly harvests progressively rarer structure from a heavy-tailed distribution.

### Rough estimates

#### Estimate training FLOPs from model size and tokens

Use:

$$C \approx 6ND$$

Example: train a $7B$ parameter model on $1T$ tokens.

$$C \approx 6 \times 7 \times 10^9 \times 10^{12} = 4.2 \times 10^{22} \text{ FLOPs}$$

#### Estimate tokens from compute and model size

Rearrange:

$$D \approx \frac{C}{6N}$$

Example: $C = 10^{23}$ FLOPs, $N = 10B$.

$$D \approx \frac{10^{23}}{6 \times 10^{10}} = 1.67 \times 10^{12}$$

So the budget allows about $1.67T$ training tokens.

#### Estimate Chinchilla-optimal model size from compute

Combine:

$$D \approx 20N$$

With:

$$C \approx 6ND$$

Then:

$$C \approx 6N(20N) = 120N^2$$

So:

$$N_{chinchilla} \approx \sqrt{\frac{C}{120}}$$

And:

$$D_{chinchilla} \approx 20N_{chinchilla}$$

Example: $C = 10^{23}$ FLOPs.

$$N \approx \sqrt{\frac{10^{23}}{120}} \approx 2.9 \times 10^{10}$$

So a rough Chinchilla-optimal allocation is:

- $N \approx 29B$ parameters
- $D \approx 580B$ tokens

#### Estimate compute from GPUs

Use:

$$C = n_{gpu} \times t_{seconds} \times FLOPs_{gpu} \times u$$

Where $u$ is realized hardware utilization, not theoretical peak.

Example: $64$ GPUs, $30$ days, $989$ TFLOP/s BF16 peak, $u = 0.35$.

$$C = 64 \times (30 \times 24 \times 3600) \times 989 \times 10^{12} \times 0.35$$

$$C \approx 5.75 \times 10^{22} \text{ FLOPs}$$

Chinchilla estimate:

$$N \approx \sqrt{\frac{5.75 \times 10^{22}}{120}} \approx 21.9B$$

$$D \approx 438B \text{ tokens}$$

### Inference-optimized scaling

Chinchilla optimizes training loss for a fixed training compute budget. It does not optimize total lifecycle cost.

Modern models are often over-trained relative to Chinchilla because inference cost matters:

- A smaller model trained on more tokens can be cheaper to serve.
- If the model will serve many inference tokens, extra training compute can be worth it.
- The rough lifecycle heuristic is:

$$\text{training cost} \approx \text{expected inference cost}$$

This is why models such as Llama 3 8B were trained on far more than $20$ tokens per parameter. The target is not only lowest pretraining loss per training FLOP; it is better quality per inference dollar.

For a more detailed treatment of this shift, see [Overtraining and Inference-Aware Scaling](/atlas/ai/training/scaling/overtraining-and-inference-aware-scaling).

### Fitting scaling laws in practice

A scaling law is only as good as the experiment design used to fit it.

Common failure modes:

- fitting on models that are too small or outside the stable power-law region
- mixing runs with different tokenizers, data mixtures, schedulers, or optimizer settings
- counting parameters inconsistently, especially embeddings
- rounding loss values too aggressively
- using too few compute budgets or too narrow a model-size sweep
- fitting downstream benchmarks directly instead of smoother validation loss
- ignoring failed runs whose loss curves rise or flatten because of repetition or instability

This matters because scaling laws are usually extrapolated by orders of magnitude. A small error in the local log-log slope can become a large error at target scale.

The safe workflow is:

1. keep the recipe fixed
2. fit only in the stable scaling region
3. use multiple compute budgets
4. compare several fitting views, such as IsoFLOP and parametric fits
5. validate with at least one larger run before committing the full budget

### Limits and caveats

- $C \approx 6ND$ is a dense-transformer approximation, not an exact accounting formula.
- Long context increases attention and KV-cache costs beyond the simple estimate.
- MoE models need separate accounting for total parameters and active parameters.
- Data quality can dominate token count. One trillion bad tokens is not equivalent to one trillion high-quality tokens.
- Scaling laws predict average loss trends, not exact benchmark behavior or emergent capability thresholds.
- Chinchilla is about compute-optimal pretraining, not necessarily optimal serving, fine-tuning, reasoning, or test-time compute.
- The fit is sensitive to parameter counting, loss precision, fitting region, optimizer settings, scheduler, tokenizer, and data mixture.
- A scaling law assumes scale is the main thing changing. If the architecture, recipe, or data distribution changes, the old law is only a prior.
- Downstream capabilities are usually noisier than validation loss, so loss is the cleaner target for extrapolation.

### Scaling laws are not only about $N$ and $D$

The kexue.fm MuP and hyperparameter-scaling discussions highlight a useful separation:

$$
\text{loss scaling}
\neq
\text{hyperparameter transfer}
$$

Classic scaling laws estimate:

$$
L(N,D,C)
$$

But training a real frontier model also needs laws for:

$$
\eta(C),\quad B(C),\quad \lambda(C),\quad \text{warmup}(C)
$$

and sometimes width-transfer rules from MuP-style parametrization.

So a practical scaling program has at least three layers:

| Layer | Question |
| --- | --- |
| Model/data scaling | How large should $N$ and $D$ be? |
| Hyperparameter scaling | How should LR, batch size, warmup, and decay change? |
| Parametrization scaling | Does a small-model sweep transfer to a larger width? |

This matters because a model can be correctly sized under Chinchilla but poorly trained because its LR, batch size, optimizer grouping, or parametrization did not scale correctly.

### Decompose before fitting

A useful synthesis is to separate final loss into:

$$
L
=
F_{\text{data}}
+
F_{\text{opt}}
+
F_{\text{arch}}
+
L_{\text{floor}}
$$

This prevents several distinct limitations from being hidden inside one fitted curve:

- insufficient unique data or excessive repetition
- incomplete or noisy optimization
- insufficient architectural capacity

Each gap can be modeled with competing power-law terms and optimized under a resource constraint. The resulting optima recover familiar patterns for learning rate, batch size, model/data allocation, and repeated epochs.

The decomposition is exact as an accounting identity, but the chosen power-law forms are hypotheses. See [Decomposing Scaling Laws](/atlas/ai/training/scaling/decomposing-scaling-laws) for the full derivation and its limitations.

## Related
- AI Papers MOC
- [Skaling: Coupled Model-Data Scaling Laws](/atlas/ai/training/scaling/skaling-coupled-model-data-scaling-laws)
- [Data-Constrained Scaling Laws](/atlas/ai/training/scaling/data-constrained-scaling-laws)
- [Transformer Scaling Rules](/atlas/ai/training/scaling/transformer-scaling-rules)
- [Overtraining and Inference-Aware Scaling](/atlas/ai/training/scaling/overtraining-and-inference-aware-scaling)
- [Hyperparameter Scaling Laws for LLM Training](/atlas/ai/training/scaling/hyperparameter-scaling-laws-for-llm-training)
- [Decomposing Scaling Laws](/atlas/ai/training/scaling/decomposing-scaling-laws)
- [Test-Time Compute](/atlas/ai/inference-serving/performance/test-time-compute)
- [The Llama 3 Herd of Models](/atlas/ai/architectures/model-reports/the-llama-3-herd-of-models)
- [Frontier Small Language Models](/atlas/ai/architectures/model-families/frontier-small-language-models)
- [LLM Inference Economics](/atlas/ai/inference-serving/performance/llm-inference-economics)

## Sources

- Lilian Weng, [Scaling Laws, Carefully](https://lilianweng.github.io/posts/2026-06-24-scaling-laws/)
- Kaplan et al., [Scaling Laws for Neural Language Models](https://arxiv.org/abs/2001.08361)
- Hoffmann et al., [Training Compute-Optimal Large Language Models](https://arxiv.org/abs/2203.15556)
- Pearce and Song, [Reconciling Kaplan and Chinchilla Scaling Laws](https://arxiv.org/abs/2406.12907)
- Besiroglu et al., [Chinchilla Scaling: A Replication Attempt](https://arxiv.org/abs/2404.10102)
- Michaud et al., [The Quantization Model of Neural Scaling](https://arxiv.org/abs/2303.13506)
