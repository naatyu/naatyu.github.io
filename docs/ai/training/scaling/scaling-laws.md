---
title: "Scaling Laws"
date: 2026-04-08
lastmod: 2026-06-11
tags:
  - ai/theory
  - scaling-laws
draft: false
---

## Summary

Scaling laws are empirical power laws that estimate how language-model loss changes with model parameters ($N$), training tokens ($D$), and training compute ($C$).
## Concepts
- **Scaling law:** an empirical relationship, usually a power law, between model loss and scale.
- **Parameters ($N$):** the number of trainable model parameters.
- **Dataset size ($D$):** the number of training tokens seen during pretraining.
- **Compute ($C$):** the training FLOPs budget.
- **IsoFLOP analysis:** compare different model sizes under the same compute budget to find the lowest-loss allocation of $N$ and $D$.
- **Compute-optimal training:** choose $N$ and $D$ that minimize training loss for a fixed compute budget.
- **Over-training:** train on far more tokens than the compute-optimal rule would suggest, usually to reduce inference cost.

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

### Kaplan vs Chinchilla

| Paper | Main allocation rule | Practical consequence |
|---|---:|---|
| Kaplan et al. 2020 | $N$ grows faster than $D$ | Prefer larger models trained on fewer tokens |
| Hoffmann et al. 2022 / Chinchilla | $N$ and $D$ grow roughly equally | Use smaller models trained on many more tokens |

The difference matters because a fixed compute budget can be spent in two bad ways:

- Too large a model with too few tokens: undertrained.
- Too small a model with too many tokens: data-rich but capacity-limited.

Chinchilla says the optimum for training loss is near the balance point where the marginal value of extra parameters and extra data is similar.

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

### Limits and caveats

- $C \approx 6ND$ is a dense-transformer approximation, not an exact accounting formula.
- Long context increases attention and KV-cache costs beyond the simple estimate.
- MoE models need separate accounting for total parameters and active parameters.
- Data quality can dominate token count. One trillion bad tokens is not equivalent to one trillion high-quality tokens.
- Scaling laws predict average loss trends, not exact benchmark behavior or emergent capability thresholds.
- Chinchilla is about compute-optimal pretraining, not necessarily optimal serving, fine-tuning, reasoning, or test-time compute.

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

## Related
- AI Papers MOC
- [Transformer Scaling Rules](/atlas/ai/training/scaling/transformer-scaling-rules)
- [Overtraining and Inference-Aware Scaling](/atlas/ai/training/scaling/overtraining-and-inference-aware-scaling)
- [Hyperparameter Scaling Laws for LLM Training](/atlas/ai/training/scaling/hyperparameter-scaling-laws-for-llm-training)
- [Test-Time Compute](/atlas/ai/inference-serving/performance/test-time-compute)
- [The Llama 3 Herd of Models](/atlas/ai/architectures/model-reports/the-llama-3-herd-of-models)
- [Frontier Small Language Models](/atlas/ai/architectures/model-families/frontier-small-language-models)
- [LLM Inference Economics](/atlas/ai/inference-serving/performance/llm-inference-economics)
