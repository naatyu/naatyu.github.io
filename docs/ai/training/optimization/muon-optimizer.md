---
title: "Muon Optimizer"
date: 2026-06-11
lastmod: 2026-07-27
tags:
  - ai/training
  - optimization
  - llm
draft: false
---

## Summary

Muon is an optimizer designed specifically for **matrix-valued parameters**. Its central idea is to replace Adam-style elementwise normalization with a **matrix sign** update, computed approximately with Newton-Schulz iterations.

The useful mental model is:

- Adam normalizes gradients **coordinate by coordinate**
- SignSGD normalizes gradients to elementwise signs
- Muon normalizes a matrix update by replacing its singular values with `1`

This makes Muon closer to a **spectral-norm steepest descent** optimizer than a small tweak to AdamW.

## Concepts

- **Matrix sign function:** matrix analogue of `sign`, defined through the SVD.
- **msign:** shorthand for the matrix sign update used by Muon.
- **Spectral norm:** matrix operator norm, equal to the largest singular value.
- **Frobenius norm:** matrix norm equivalent to flattening the matrix into a vector and taking the Euclidean norm.
- **Newton-Schulz iteration:** iterative method used to approximate inverse square roots or matrix sign functions.
- **Singular value entropy:** a statistic measuring how evenly weight energy is spread across singular directions.

## 1. AdamW is elementwise; Muon is matrixwise

AdamW treats each parameter coordinate independently:

$$
m_t = \beta_1 m_{t-1} + (1-\beta_1)g_t
$$

$$
v_t = \beta_2 v_{t-1} + (1-\beta_2)g_t^2
$$

$$
\theta_{t+1}
=
\theta_t
- \eta \frac{\hat m_t}{\sqrt{\hat v_t}+\epsilon}
- \eta\lambda\theta_t
$$

This is powerful, but it ignores the fact that many neural-network parameters are not just arbitrary vectors. They are matrices used in matrix multiplication:

$$
W \in \mathbb{R}^{n \times m}
$$

Muon starts from the idea that matrix parameters should be optimized with a rule that respects matrix geometry.

## 2. Basic Muon update

For a matrix parameter $W$ with gradient $G_t$, Muon keeps a momentum buffer:

$$
M_t = \beta M_{t-1} + G_t
$$

Then it updates:

$$
W_t
=
W_{t-1}
- \eta_t\left(\operatorname{msign}(M_t) + \lambda W_{t-1}\right)
$$

where $\lambda$ is a decoupled weight-decay coefficient.

The important difference from AdamW is the update direction:

$$
\operatorname{msign}(M_t)
$$

instead of:

$$
\frac{\hat m_t}{\sqrt{\hat v_t}+\epsilon}
$$

## 3. Matrix sign through SVD

Let:

$$
M = U\Sigma V^\top
$$

be the singular value decomposition of $M$. If $r=\operatorname{rank}(M)$, then:

$$
\operatorname{msign}(M)
=
U_{[:, :r]} V_{[:, :r]}^\top
$$

So Muon keeps the left and right singular vectors of the momentum matrix, but removes the singular values.

Equivalently:

$$
\operatorname{msign}(M)
=
(MM^\top)^{-1/2}M
=
M(M^\top M)^{-1/2}
$$

using a pseudoinverse when needed.

This is why it is a matrix analogue of scalar sign:

$$
\operatorname{sign}(x)
=
x(x^2)^{-1/2}
$$

For a diagonal matrix:

$$
M = \operatorname{diag}(m)
$$

we recover elementwise sign:

$$
\operatorname{msign}(M)
=
\operatorname{diag}(\operatorname{sign}(m))
$$

So Muon can be viewed as replacing elementwise sign with a matrix-level sign.

## 4. Relationship to SignSGD and Adam

Adam is often approximated theoretically as SignSGD, especially when the denominator mostly normalizes gradient scale:

$$
\Delta \theta \approx -\eta \operatorname{sign}(g)
$$

Muon is analogous, but for matrices:

$$
\Delta W \approx -\eta \operatorname{msign}(G)
$$

The difference is not cosmetic:

- SignSGD constrains each coordinate to have roughly equal update magnitude.
- Muon constrains the matrix update through its singular structure.
- Adam adapts per coordinate.
- Muon adapts per matrix geometry.

This is why Muon is often described as a more structural optimizer than AdamW.

## 5. Steepest descent view

A generic proximal-style update is:

$$
W_{t+1}
=
\arg\min_W
\frac{\|W-W_t\|^2}{2\eta_t}
+
\mathcal{L}(W)
$$

Using a first-order approximation:

$$
\Delta W_{t+1}
=
\arg\min_{\Delta W}
\frac{\|\Delta W\|^2}{2\eta_t}
+
\operatorname{Tr}(G_t^\top \Delta W)
$$

The result depends on which matrix norm is used.

If the norm is the Frobenius norm, this reduces to ordinary SGD:

$$
\Delta W \propto -G_t
$$

If the norm is the spectral norm:

$$
\|\Phi\|_2
=
\max_{\|x\|_2=1}\|\Phi x\|_2
$$

then the steepest descent direction becomes tied to the matrix sign:

$$
\Delta W \propto -\operatorname{msign}(G_t)
$$

This is the core theoretical appeal of Muon:

> For matrix parameters, the spectral norm may be a more natural constraint than treating the matrix as a flattened vector.

The Frobenius norm asks: "how large is the update after flattening?"

The spectral norm asks: "how large can the update act as a linear map?"

For weight matrices, the second question is often more aligned with how the parameter is used.

## 6. Why Newton-Schulz is used

Computing an SVD for every matrix parameter at every training step is too expensive.

Muon therefore approximates:

$$
\operatorname{msign}(M)
=
M(M^\top M)^{-1/2}
$$

with Newton-Schulz-style iterations.

Start with a normalized matrix:

$$
X_0 = \frac{M}{\|M\|_F}
$$

A simple second-order Taylor-derived iteration is:

$$
X_{t+1}
=
\frac{15}{8}X_t
-
\frac{5}{4}X_t(X_t^\top X_t)
+
\frac{3}{8}X_t(X_t^\top X_t)^2
$$

More generally:

$$
X_{t+1}
=
aX_t
+
bX_t(X_t^\top X_t)
+
cX_t(X_t^\top X_t)^2
$$

Because $X_t$ and $M$ share singular vectors, this iteration mainly acts on singular values. If:

$$
X_t = U\Sigma_t V^\top
$$

then:

$$
\Sigma_{t+1}
=
a\Sigma_t + b\Sigma_t^3 + c\Sigma_t^5
$$

The goal is to push singular values toward `1` quickly, so that:

$$
X_t \rightarrow UV^\top
$$

This is exactly the matrix-sign update.

## 7. Why Muon update scale needs care

For a full-rank matrix update:

$$
\Phi_t = \operatorname{msign}(M_t)
$$

with $M_t \in \mathbb{R}^{n \times m}$ and rank $r$, the RMS of $\Phi_t$ is:

$$
\operatorname{RMS}(\Phi_t)
=
\sqrt{\frac{r}{nm}}
$$

In typical full-rank cases:

$$
r = \min(n,m)
$$

so:

$$
\operatorname{RMS}(\Phi_t)
=
\sqrt{\frac{1}{\max(n,m)}}
$$

This means a raw Muon update has shape-dependent RMS. Very rectangular matrices can receive updates with different effective scales than square matrices.

A practical rescaled Moonlight-style update is:

$$
W_t
=
W_{t-1}
-
\eta_t
\left(
0.2\,\Phi_t\sqrt{\max(n,m)}
+
\lambda W_{t-1}
\right)
$$

The factor $\sqrt{\max(n,m)}$ normalizes update RMS across matrix shapes. The constant `0.2` makes the update RMS roughly comparable to observed Adam update RMS in LLM settings.

Practical implication:

> Do not blindly reuse one AdamW learning rate for every Muon parameter group.

Muon is non-elementwise, and matrix shape changes the effective update scale unless the implementation compensates for it.

## 8. Per-head Muon for attention projections

Applying Muon to a complete query, key, or value projection treats all attention heads as one matrix:

$$
W_Q
\in
\mathbb{R}^{d_{\text{model}}\times(hd_h)}
$$

If some heads produce much larger momentum directions, full-matrix orthogonalization lets them influence the shared singular geometry. Smaller-scale heads may receive updates shaped by the dominant heads.

Kimi K3 partitions the momentum by head:

$$
M
=
\left[
M^{(1)},M^{(2)},\ldots,M^{(h)}
\right]
$$

and applies Newton-Schulz orthogonalization independently:

$$
\Delta W
=
\left[
\operatorname{msign}(M^{(1)}),
\ldots,
\operatorname{msign}(M^{(h)})
\right]
$$

This has two intended effects:

- equalize update geometry across attention heads
- prevent a few large heads from dominating the full projection update

The smaller matrices also make the orthogonalization slightly cheaper. This is a useful general rule: optimizer structure should match the functional partition of a parameter, not only its storage layout.

Per-head Muon is not equivalent to using a different learning rate per head. It changes which singular directions are normalized together.

## 9. Which parameters should use Muon?

Muon is intended for dense matrix parameters such as:

- attention projection matrices
- MLP projection matrices
- dense expert matrices
- other large 2D hidden-layer weights

It is usually not the cleanest choice for:

- scalar parameters
- bias vectors
- LayerNorm or RMSNorm scale vectors
- embeddings, especially sparse token embeddings

For vector-like parameters, there are two possible interpretations:

- treat the vector as a diagonal matrix, giving elementwise sign-like behavior
- treat it as an $n \times 1$ matrix, giving $\ell_2$ normalization

Neither is obviously equivalent to the intended matrix optimizer behavior. A pragmatic setup is:

- use Muon for large matrix weights
- use AdamW or SGD-like rules for embeddings, norms, and small/vector parameters

## 10. What Muon seems to change in trained weights

One reported observation from Moonlight-style experiments is that Muon-trained weights can have more uniform singular value spectra.

One way to measure this is normalized singular value entropy:

$$
H(\sigma)
=
-
\frac{1}{\log n}
\sum_{i=1}^n
\frac{\sigma_i^2}{\sum_j \sigma_j^2}
\log
\frac{\sigma_i^2}{\sum_j \sigma_j^2}
$$

where $\sigma_i$ are singular values.

Higher entropy means the matrix energy is spread across more singular directions. The interpretation proposed in the kexue.fm analysis is:

> Muon may use matrix capacity more evenly, making weights less compressible and less dominated by a few singular directions.

This is not yet a complete theory, but it is a useful diagnostic direction.

## 11. Muon and pretraining vs fine-tuning

One important caveat is that an optimizer may shape the geometry of the weights during pretraining.

If a model was pretrained with AdamW, switching to Muon only during SFT may not be optimal, because the pretrained weights may not be in the geometry that Muon prefers.

The reported pattern is not simply:

$$
\text{Muon fine-tuning} > \text{Adam fine-tuning}
$$

Rather, the interaction can depend on the pretraining optimizer:

$$
\text{pretraining optimizer} \times \text{fine-tuning optimizer}
$$

This matters because LLM training is staged. Optimizer choice in pretraining can affect the best optimizer choice later.

## 12. Practical checklist

When testing Muon in a serious LLM run:

- keep AdamW as the baseline
- apply Muon only to large dense matrices first
- separate parameter groups for embeddings, norms, biases, and matrix weights
- verify shape-dependent update scaling
- track update RMS per parameter group
- track singular value spectra for representative matrices
- watch MoE routing stability if using sparse experts
- do not judge only by early training loss
- compare at matched tokens, FLOPs, and wall-clock constraints

The strongest case for Muon is not "it always beats AdamW." The stronger claim is:

> Matrix parameters may deserve matrix-aware optimization, and Muon is a practical implementation of that idea.

## 13. Practical testing recipe

A clean Muon experiment should separate three questions:

1. Does Muon improve the loss curve?
2. Does Muon improve wall-clock efficiency?
3. Does Muon preserve stability under the same distributed and mixed-precision conditions?

The parameter grouping should usually look like:

| Parameter type | Suggested optimizer |
| --- | --- |
| attention projection matrices | Muon |
| MLP projection matrices | Muon |
| MoE expert matrices | Muon, but monitor routing carefully |
| embeddings | AdamW or SGD-like rule |
| RMSNorm / LayerNorm scale | AdamW or no weight decay |
| biases | AdamW or no weight decay |
| router vectors / small matrices | start with AdamW unless tested |

Useful diagnostics:

- update RMS per parameter group
- ratio of update norm to weight norm
- effective weight decay per group
- singular value entropy of major matrices
- MoE expert utilization if applicable
- loss spikes after optimizer-state resume

Muon changes the update geometry, so a fair comparison should not only copy AdamW hyperparameters. At minimum, sweep:

- Muon learning rate
- Muon momentum
- Muon weight decay
- Newton-Schulz iteration count
- matrix-shape update scaling

The main failure mode to avoid is a superficially good early loss curve followed by delayed instability. For large runs, short pilots should include deliberately long enough horizons to expose optimizer-state and routing pathologies.

## Related

- [AdamW](/atlas/ai/training/optimization/adamw)
- [Batch size & Learning rate](/atlas/ai/training/optimization/batch-size-and-learning-rate)
- [Gradient Norm and Training Dynamics](/atlas/ai/training/optimization/gradient-norm-and-training-dynamics)
- [MoE Training Stability](/atlas/ai/training/optimization/moe-training-stability)
- [MoE Routing and Load Balancing](/atlas/ai/training/optimization/moe-routing-and-load-balancing)
- [Kimi K3](/atlas/ai/architectures/model-reports/kimi-k3-open-frontier-intelligence)

## Sources

- Su Jianlin, [Muon优化器赏析：从向量到矩阵的本质跨越](https://kexue.fm/archives/10592)
- Su Jianlin, [Muon续集：为什么我们选择尝试Muon？](https://kexue.fm/archives/10739)
- Su Jianlin, [Muon优化器指南：快速上手与关键细节](https://kexue.fm/archives/11416)
- Kimi Team, [Kimi K3: Open Frontier Intelligence — Technical Report](https://github.com/MoonshotAI/Kimi-K3/blob/main/k3_tech_report.pdf)
