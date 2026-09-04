---
title: "DeepLoop: Residual Scaling for Looped Transformers"
date: 2026-09-04
lastmod: 2026-09-04
tags:
  - ai/transformers
  - looped-transformers
  - residual-connections
  - initialization
  - training-stability
draft: false
---

## Summary

Looped Transformers reuse a small stack of physical blocks several times. If there are $K$ stored blocks and $R$ recurrent rounds, the model has

$$
N=KR
$$

blocks after unrolling, while storing only $K$ sets of block parameters.

**DeepLoop** argues that residual scaling cannot depend only on the unrolled depth $N$. Weight tying introduces an additional effect: one physical parameter receives gradient contributions from all of its visits, and the resulting shared update is then read through all of those visits. If visit-wise gradients and sensitivities align, this creates an extra factor proportional to the loop count.

The loop-aware first-order stability condition is

$$
\boxed{
M\kappa_R
\left(\frac{\beta}{\alpha}\right)^2
=O(1)
},
$$

where:

- $M=2N$ is the number of attention and MLP residual-sublayer visits;
- $\alpha$ scales the skip path inside a Post-LN block;
- $\beta$ is an initialization gain applied to selected residual-branch matrices;
- $\kappa_R$ measures how coherently visits of the same physical sublayer align.

Ordinary DeepNorm uses an exponent of $1/4$. DeepLoop selects the conservative aligned-visit exponent $1/2$:

$$
\boxed{
\alpha=(2N)^{1/2},
\qquad
\beta=(8N)^{-1/2}
}.
$$

The key lesson is broader than this particular formula:

> When parameters are reused through depth, count not only how many computations occur, but also how many times the same update is written and subsequently read.

## 1. Physical depth and unrolled depth

A standard depth-$N$ Transformer has $N$ distinct blocks:

```text
B1 -> B2 -> B3 -> ... -> BN
```

A looped Transformer stores $K$ blocks and applies the same stack for $R$ rounds:

```text
round 1: B1 -> B2 -> ... -> BK
round 2: B1 -> B2 -> ... -> BK
...
round R: B1 -> B2 -> ... -> BK
```

Its effective or unrolled depth is

$$
N=KR.
$$

This separates three quantities that are identical in an ordinary Transformer:

| Quantity | Looped Transformer |
|---|---:|
| Stored physical blocks | $K$ |
| Visits to each physical block | $R$ |
| Unrolled block depth | $N=KR$ |

Looping reduces stored parameters, but it does not reduce the computation of a full $R$-round forward pass. It trades parameter memory for sequential depth.

## 2. Why ordinary depth scaling misses parameter reuse

Consider one physical residual sublayer $j$ reused across rounds. At visit $r$, define:

- $G_{r,j}$: the effective parameter update contributed by that visit;
- $U_{r,j}$: the sensitivity of the final output to an update applied at that visit.

### Untied depth

If every unrolled visit has its own parameter, the first-order output perturbation is schematically

$$
\Delta F_{\text{untied}}
\sim
\sum_{r=1}^{R}U_{r,j}G_{r,j}.
$$

Each visit writes its own update and that update is read at the corresponding location. There are $R$ paired terms.

### Tied depth

When the visits share one parameter, their gradients first accumulate into one update:

$$
\Delta\phi_j
\sim
\sum_{t=1}^{R}G_{t,j}.
$$

That same shared update affects every visit during the perturbed forward pass:

$$
\Delta F_{\text{tied}}
\sim
\left(\sum_{r=1}^{R}U_{r,j}\right)
\left(\sum_{t=1}^{R}G_{t,j}\right).
$$

Expanding the product gives

$$
\sum_{r=1}^{R}\sum_{t=1}^{R}U_{r,j}G_{t,j}.
$$

The diagonal terms $r=t$ resemble untied depth. The cross-visit terms $r\ne t$ are new:

```text
             update-producing visit t
              1      2      3
read visit 1  ✓      +      +
read visit 2  +      ✓      +
read visit 3  +      +      ✓

✓ : term also present in the untied intuition
+ : cross-visit term created by sharing
```

Whether these extra terms cancel or reinforce one another depends on alignment across rounds.

## 3. The visit-alignment coefficient

The paper summarizes cross-round coherence with $\kappa_R$. Under its local sensitivity assumptions,

$$
0\le \kappa_R\le R.
$$

The two important regimes are:

### Decorrelated visits

If visit-wise updates and sensitivities are independent or nearly orthogonal, their vector sums grow like root-sums-of-squares rather than direct sums. Then

$$
\kappa_R=O(1).
$$

The loop behaves like ordinary untied depth up to constants, and the familiar DeepNorm exponent is sufficient.

### Aligned visits

If repeated visits perform similar computations and produce coherently oriented updates and sensitivities, their sums reinforce:

$$
\kappa_R=\Theta(R).
$$

This is the conservative case. It is plausible for tied blocks precisely because every round uses the same parameters, although the hidden states need not be identical.

The coefficient is not merely “gradient correlation.” It summarizes alignment on both sides of the perturbation:

```text
all visits write one shared update
                 x
all visits read that shared update
```

This is why the stability bound contains an extra multiplicative factor rather than only a larger gradient norm.

## 4. From DeepNorm to DeepLoop

### 4.1 The Post-LN DeepNorm block

DeepLoop uses a Post-LN sandwich block:

$$
x_{i+1}
=
\operatorname{Norm}
\left(
\alpha x_i
+
f_j(\operatorname{Norm}(x_i);\phi_j)
\right).
$$

The inner normalization supplies a unit-scale input to the residual branch. The outer normalization restores the residual-stream scale after every visit.

The two scaling parameters have different roles:

- $\alpha$ is a runtime multiplier on the skip path;
- $\beta$ scales the initialization of the residual-branch matrices prescribed by DeepNorm.

$\beta$ is **not** multiplied into the branch output again on every forward pass.

For an ordinary untied decoder with $N$ blocks and $M=2N$ residual sublayers, the DeepNorm stability condition is

$$
M\left(\frac{\beta}{\alpha}\right)^2=O(1).
$$

Its standard choice is

$$
\alpha_{\text{DN}}=(2N)^{1/4},
\qquad
\beta_{\text{DN}}=(8N)^{-1/4}.
$$

Therefore,

$$
\frac{\beta_{\text{DN}}}{\alpha_{\text{DN}}}
=
\frac{1}{2\sqrt N},
$$

and

$$
2N
\left(\frac{1}{2\sqrt N}\right)^2
=
\frac12.
$$

### 4.2 The loop-aware condition

With tied depth, the paper obtains

$$
\left\|\Delta F\right\|
\lesssim
M\kappa_R
\left(\frac{\beta}{\alpha}\right)^2.
$$

Thus a sufficient first-order condition is

$$
M\kappa_R
\left(\frac{\beta}{\alpha}\right)^2
=O(1).
$$

Consider the scaling family

$$
\alpha=(cN)^p,
\qquad
\beta=(dN)^{-p}.
$$

Then

$$
\frac{\beta}{\alpha}
=(cd)^{-p}N^{-2p}.
$$

Suppose

$$
\kappa_R=\Theta(R^\gamma),
\qquad \gamma\in[0,1],
$$

and increase loop count while keeping the physical depth $K$ fixed. Because $N=KR$, the stability threshold becomes

$$
\boxed{
p\ge\frac{1+\gamma}{4}
}.
$$

This interpolates between two cases:

| Visit behavior | $\gamma$ | Required exponent |
|---|---:|---:|
| decorrelated | $0$ | $p\ge 1/4$ |
| partially aligned | between $0$ and $1$ | between $1/4$ and $1/2$ |
| fully aligned | $1$ | $p\ge 1/2$ |

DeepLoop chooses the safe endpoint:

$$
\alpha_{\text{DL}}=(2N)^{1/2},
\qquad
\beta_{\text{DL}}=(8N)^{-1/2}.
$$

Its update-to-residual ratio is

$$
\frac{\beta_{\text{DL}}}{\alpha_{\text{DL}}}
=
\frac{1}{4N}.
$$

In the worst-case aligned regime,

$$
MR
\left(\frac{\beta}{\alpha}\right)^2
=
2NR\frac{1}{16N^2}
=
\frac{1}{8K},
$$

which stays bounded as $R$ grows at fixed physical depth $K$.

By contrast, inserting the DeepNorm exponent leaves a factor that grows as $\Theta(R)$ in this conservative bound.

## 5. Minimal implementation recipe

For a decoder block containing attention and an MLP:

```python
unrolled_depth = physical_blocks * loop_rounds

alpha = (2 * unrolled_depth) ** 0.5
beta = (8 * unrolled_depth) ** -0.5
```

Initialize the same residual-branch matrices selected by DeepNorm using gain $\beta$:

```python
for matrix in deepnorm_scaled_matrices:
    initialize_with_base_rule(matrix)
    matrix.data.mul_(beta)
```

Use the shared physical block on every round:

```python
def residual_sublayer(x, branch, alpha):
    branch_input = rms_norm(x)
    return rms_norm(alpha * x + branch(branch_input))
```

Important implementation points:

- Compute $N$ from **unrolled** depth, not stored physical depth.
- Count attention and MLP as separate residual-sublayer visits, so $M=2N$.
- Apply $\beta$ once through initialization; do not treat it as a runtime residual multiplier.
- Share the intended block parameters across rounds rather than cloning them.
- Keep optimizer parameter groups deduplicated: the shared tensor should appear once.
- Log activation RMS, branch RMS, gradient RMS, and update-to-weight ratio by both physical block and round.
- Sweep the exponent $p$ if the architecture, optimizer, normalization, or recurrence schedule differs materially from the paper.

## 6. Why stronger scaling can also hurt

Increasing $p$ makes

$$
\frac{\beta}{\alpha}\propto N^{-2p}
$$

smaller. This stabilizes the network but also weakens the effective learning signal through each residual branch.

The paper's short $p$-sweep at $R=3$ finds the expected trade-off:

- smaller exponents sometimes train faster when they successfully escape the initial loss floor;
- failures are concentrated below the predicted $p=1/2$ boundary;
- larger exponents are safer but give slightly worse loss among runs that converge.

DeepLoop is therefore a conservative default, not a claim that maximal shrinkage is always optimal.

## 7. Language-model experiments

The authors compare:

- a standard Pre-LN looped Transformer baseline;
- the complete DeepLoop Post-LN sandwich architecture and scaling rule.

They train GPT-2-small- and GPT-2-medium-style models on FineWeb-Edu for `50B` tokens, using context length `1,024`, and vary

$$
R\in\{1,3,5,7\}.
$$

Final validation cross-entropy:

| Backbone | Method | $R=1$ | $R=3$ | $R=5$ | $R=7$ |
|---|---|---:|---:|---:|---:|
| GPT-2 small | Pre-LN baseline | 2.8627 | 2.8077 | 2.7910 | 2.7700 |
| GPT-2 small | DeepLoop | 2.8631 | 2.7917 | 2.7679 | 2.7514 |
| GPT-2 medium | Pre-LN baseline | 2.6253 | 2.5779 | 2.5640 | 2.5558 |
| GPT-2 medium | DeepLoop | 2.6264 | 2.5627 | 2.5444 | 2.5280 |

The pattern is more important than the absolute scale:

- at $R=1$, where no physical block is revisited, the methods are effectively tied;
- DeepLoop improves validation loss at every activated loop count;
- the advantage generally becomes clearer as recurrent depth grows.

On eight downstream tasks with the GPT-2 medium backbone, DeepLoop at $R=7$ beats the corresponding baseline on seven of eight tasks in both zero- and one-shot evaluation. However, the language-model comparisons are single-seed runs, so small differences should not be overinterpreted.

## 8. Application to hierarchical recurrent reasoning

The analysis also covers architectures with multiple recurrent modules and truncated gradients, such as the Hierarchical Reasoning Model.

The important distinction is between:

- **forward-visible visits:** every recurrence executed during inference;
- **gradient-visible visits:** only the recurrence steps included in the training graph.

If training detaches earlier outer cycles and backpropagates through only the last cycle, the initialization rule should use the gradient-visible count $M_g$ for the first-order update bound, not blindly use the full forward count.

For the evaluated HRM configuration,

$$
M_g=24,
\qquad
N_g=M_g/2=12.
$$

Replacing only the residual parameterization with DeepLoop improves ARC-AGI-1 voted accuracy across all reported voting budgets:

| Voting budget | Vanilla HRM | DeepLoop | Difference |
|---:|---:|---:|---:|
| 1 | 31.50 | 35.50 | +4.00 pp |
| 2 | 36.50 | 39.75 | +3.25 pp |
| 10 | 41.50 | 44.25 | +2.75 pp |
| 100 | 47.50 | 49.75 | +2.25 pp |
| 1000 | 50.75 | 51.50 | +0.75 pp |

A four-seed control at voting budget `2` reports a per-seed standard deviation of about `0.5` percentage points, smaller than the reported gain.

This part is especially useful conceptually: the relevant depth for optimization can differ from both stored depth and inference-time forward depth when gradients are truncated.

## 9. What the evidence does not yet establish

### The main baseline changes several things

The primary language-model comparison is not only

```text
p = 1/4  versus  p = 1/2
```

It compares a standard Pre-LN baseline against the complete DeepLoop setup: Post-LN sandwich normalization plus loop-aware scaling. The appendix $p$-sweep isolates the exponent within the sandwich architecture, but only for a small model, one loop count, and a short training horizon.

### The theory is local

The bound is a first-order perturbation analysis around initialization. It assumes visit-wise sensitivities scale as $O(\beta/\alpha)$ and hides optimizer-, width-, and architecture-dependent constants. It does not prove global convergence or optimal downstream quality.

### Alignment is modeled, not measured directly

$\kappa_R$ explains a continuum between decorrelated and aligned visits, but the experiments do not directly measure it. The default $p=1/2$ protects against the worst-case scaling regime.

### Scale remains limited

The language-model evidence uses GPT-2-small- and GPT-2-medium-scale backbones. It remains unclear whether the same conservative rule is optimal for multi-billion-parameter LLMs, MoE blocks, very large loop counts, or alternative parameterizations such as $\mu$P.

### Looping still costs compute

DeepLoop stabilizes recurrent depth; it does not make repeated computation free. More rounds increase training FLOPs and inference latency unless the system uses adaptive exits or another conditional-compute mechanism.

## 10. Practical takeaways

- Looped depth is not equivalent to untied depth, even when the unrolled computation graph has the same number of blocks.
- Shared parameters create cross-visit write/read terms in the first-order update.
- The strength of the correction depends on visit alignment through $\kappa_R$.
- DeepNorm's $p=1/4$ is recovered when visits decorrelate.
- DeepLoop's $p=1/2$ is the conservative threshold when visits align and loop count grows at fixed physical depth.
- Use unrolled depth for an ordinary full-backprop loop, but use gradient-visible depth when recurrence is detached or truncated.
- $\beta$ is an initialization gain, not an extra multiplier applied on every forward pass.
- Stronger stabilization trades against update size, so monitor optimization rather than assuming a theoretically safe exponent is empirically optimal everywhere.

## Related

- [Looped Language Models (Ouro)](/atlas/ai/architectures/transformers/looped-language-models-ouro)
- [Sparse Layers in Looped Language Models](/atlas/ai/architectures/transformers/moe-looped-language-models)
- [Residuals, Normalization, and Initialization](/atlas/ai/architectures/transformers/residual-normalization-and-initialization)
- [Recirculation: Inference-Time Recurrence for Transformers](/atlas/ai/architectures/transformers/recirculation-inference-time-recurrence)
- [Nanbeige4.2-3B](/atlas/ai/architectures/model-reports/nanbeige4-2-3b-unlocking-agentic-capabilities)
- [Gradient Norm and Training Dynamics](/atlas/ai/training/optimization/gradient-norm-and-training-dynamics)

## Sources

- Li et al., [DeepLoop: Depth Scaling for Looped Transformers](https://arxiv.org/abs/2607.13491), 2026.
- Wang et al., [DeepNet: Scaling Transformers to 1,000 Layers](https://arxiv.org/abs/2203.00555), 2022.
- Dehghani et al., [Universal Transformers](https://arxiv.org/abs/1807.03819), 2018.
