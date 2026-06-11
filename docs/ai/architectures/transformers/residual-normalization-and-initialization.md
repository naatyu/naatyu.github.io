---
title: "Residuals, Normalization, and Initialization"
date: 2026-06-11
lastmod: 2026-06-11
tags:
  - ai/llm
  - transformers
  - optimization
draft: false
---

## Summary

Transformer stability is not caused by one trick. Residual connections, normalization placement, initialization scale, warmup, and attention scaling form one coupled system. Changing one part changes the others.

The core question is:

$$
\text{How do we keep forward activations, backward gradients, and residual increments stable across depth?}
$$

## Concepts

- **Residual connection:** skip path that adds the input of a block to its output.
- **Pre-Norm:** normalization before the attention/MLP sublayer.
- **Post-Norm:** normalization after the residual addition.
- **Increment explosion:** residual updates accumulate too much across depth.
- **Signal propagation:** how activation variance changes across layers.
- **Gradient propagation:** how gradient scale changes when backpropagating through depth.
- **Layer usefulness:** whether adding depth creates genuinely new transformations or mostly behaves like widening.

## 1. Why residuals are needed

For a residual transformer block:

$$
x_{\ell+1} = x_\ell + F_\ell(x_\ell)
$$

the identity path gives gradients a direct route:

$$
\frac{\partial x_{\ell+1}}{\partial x_\ell}
=
I + \frac{\partial F_\ell}{\partial x_\ell}
$$

Without the residual path, the backward signal is a product of many Jacobians:

$$
\frac{\partial x_L}{\partial x_0}
=
\prod_{\ell=0}^{L-1}
\frac{\partial F_\ell}{\partial x_\ell}
$$

This product easily explodes or vanishes.

Residuals help with three related problems:

- forward activations stay closer to a stable scale
- gradients have a shorter path
- each layer can learn an increment rather than a full transformation

The subtle part is that residuals also introduce a new problem:

$$
x_L
=
x_0 + \sum_{\ell=0}^{L-1}F_\ell(x_\ell)
$$

If the increments are not controlled, their sum can grow with depth.

## 2. Increment explosion

Assume the residual increments have similar scale:

$$
\mathbb{E}\|F_\ell(x_\ell)\|^2 \approx \sigma_F^2
$$

If increments are roughly independent, then:

$$
\mathbb{E}\|x_L-x_0\|^2
\approx
L\sigma_F^2
$$

So:

$$
\|x_L-x_0\| \sim \sqrt{L}\sigma_F
$$

If increments are correlated, growth can be worse:

$$
\|x_L-x_0\| \sim L\sigma_F
$$

This is why very deep residual networks often need explicit residual scaling:

$$
x_{\ell+1}
=
x_\ell
+
\alpha_\ell F_\ell(x_\ell)
$$

with $\alpha_\ell$ chosen to shrink the per-layer increment.

## 3. Pre-Norm vs Post-Norm

### Pre-Norm

Pre-Norm uses:

$$
x_{\ell+1}
=
x_\ell
+
F_\ell(\operatorname{Norm}(x_\ell))
$$

It is usually easier to train because the residual path is a clean identity path. Gradients can flow through:

$$
x_{\ell+1} \leftarrow x_\ell
$$

without passing through normalization and sublayer transformations.

But kexue.fm gives a useful criticism: deep Pre-Norm can make later layers less "deep" in effect.

Unroll:

$$
x_{t+1}
=
x_0
+
\sum_{\ell=0}^{t}
F_\ell(\operatorname{Norm}(x_\ell))
$$

As $t$ grows, $x_t$ and $x_{t+1}$ may become relatively close compared with the accumulated representation. Then:

$$
F_{t+1}(\operatorname{Norm}(x_{t+1}))
\approx
F_{t+1}(\operatorname{Norm}(x_t))
$$

So adjacent deep layers can behave like parallel transformations applied to a similar normalized state:

$$
F_t(\operatorname{Norm}(x_t))
+
F_{t+1}(\operatorname{Norm}(x_t))
$$

This resembles making the model wider rather than truly deeper.

### Post-Norm

Post-Norm uses:

$$
x_{\ell+1}
=
\operatorname{Norm}
\left(
x_\ell + F_\ell(x_\ell)
\right)
$$

This can make each layer more meaningful because the normalization after the residual addition forces the output back into a controlled scale. But the identity path is no longer clean:

$$
x_\ell \rightarrow \operatorname{Norm}(x_\ell + F_\ell(x_\ell))
$$

so training can be less stable, especially at depth.

Practical summary:

| Variant | Training stability | Depth usefulness |
| --- | --- | --- |
| Pre-Norm | easier | can become shallow/wide in effect |
| Post-Norm | harder | often stronger if trained successfully |

This explains why many modern LLMs choose Pre-Norm/RMSNorm for robustness, while older BERT-style models used Post-Norm with more delicate initialization and warmup.

## 4. Why initialization matters

For a linear layer:

$$
y = xW
$$

with:

$$
x_i \sim (0,1),\qquad W_{ij}\sim \left(0,\frac{1}{d}\right)
$$

we get:

$$
\operatorname{Var}(y_j)
=
\sum_{i=1}^{d}
\operatorname{Var}(x_iW_{ij})
\approx
d\cdot 1\cdot \frac{1}{d}
=
1
$$

This is the basic variance-preservation idea behind common initialization rules.

For attention, if:

$$
q_i,k_i \sim (0,1)
$$

then:

$$
\operatorname{Var}(q^\top k)
=
d
$$

So scaled dot-product attention uses:

$$
\frac{q^\top k}{\sqrt d}
$$

to keep score variance near `1`.

The important point is:

> initialization and attention scaling are part of the same variance-control system.

If a model removes the $1/\sqrt d$ attention scale, it must compensate elsewhere, usually through initialization or normalization.

## 5. Why BERT's `0.02` initialization is not arbitrary

BERT often initializes weights with:

$$
W_{ij}\sim \mathcal{N}(0,0.02^2)
$$

This looks like a magic constant, but it can be interpreted as an approximate scale choice for BERT's hidden size and architecture.

For hidden size:

$$
d = 768
$$

Xavier-like scaling gives a standard deviation on the order of:

$$
\frac{1}{\sqrt d}
\approx
0.036
$$

BERT's `0.02` is more conservative. That helps keep early residual increments and attention logits smaller, which is useful for Post-Norm training with warmup.

The deeper lesson is not that `0.02` is universal. It is:

> initialization scale should be interpreted relative to hidden size, normalization placement, residual scale, and warmup.

## 6. Residual scaling for very deep transformers

DeepNet-style transformers use explicit residual scaling to make extremely deep networks trainable.

A generic pattern is:

$$
x_{\ell+1}
=
x_\ell
+
\alpha F_\ell(x_\ell)
$$

where:

$$
\alpha < 1
$$

When depth $L$ grows, a common goal is to make the accumulated residual magnitude independent of $L$:

$$
\sum_{\ell=1}^{L}\alpha^2 \sigma_F^2
\approx
O(1)
$$

which suggests:

$$
\alpha \sim \frac{1}{\sqrt L}
$$

or other depth-dependent scaling depending on assumptions and architecture.

The engineering lesson:

- shallow models can often rely on default residuals
- deep models need residual scaling, careful initialization, or both
- normalization alone does not solve every depth-scaling issue

## 7. Normalization replacements

Recent normalization-free or normalization-light work tries to replace full LayerNorm/RMSNorm with cheaper elementwise transforms.

The kexue.fm discussion of DyT-style replacements frames normalization through gradients: normalization changes not only activation scale but also the local Jacobian of the network.

LayerNorm:

$$
\operatorname{LN}(x)
=
\frac{x-\mu}{\sqrt{\sigma^2+\epsilon}}\gamma+\beta
$$

is not just rescaling. Its derivative couples coordinates because $\mu$ and $\sigma$ depend on all hidden dimensions.

Elementwise replacements may approximate useful parts of this behavior:

$$
y = \tanh(\alpha x)
$$

or similar dynamic activation forms, but they do not exactly reproduce the same coordinate coupling.

Practical view:

- normalization controls scale
- normalization changes gradients
- normalization affects depth stability
- replacing it should be evaluated as an optimization change, not just a speed trick

## 8. Practical heuristics

- Treat residual scaling, normalization placement, initialization, and warmup as one coupled design.
- Pre-Norm is safer for large LLM pretraining, but may reduce effective depth.
- Post-Norm can be stronger but needs more careful scaling.
- If attention removes or changes $1/\sqrt d$, revisit initialization.
- For very deep transformers, use explicit residual scaling or DeepNet-style rules.
- Monitor activation RMS and gradient RMS by layer, not only loss.
- Do not copy BERT's `0.02` initialization outside its architectural context.

## Related

- [Layer Normalization](/atlas/ai/foundations/layer-normalization)
- [RMSNorm](/atlas/ai/foundations/root-mean-square-layer-normalization)
- [Attention Variants](/atlas/ai/architectures/transformers/attention-variants)
- [Learning Rate Warmup](/atlas/ai/training/optimization/learning-rate-warmup)
- [Gradient Norm and Training Dynamics](/atlas/ai/training/optimization/gradient-norm-and-training-dynamics)

## Sources

- Su Jianlin, [浅谈Transformer的初始化、参数化与标准化](https://kexue.fm/archives/8620)
- Su Jianlin, [模型优化漫谈：BERT的初始标准差为什么是0.02？](https://kexue.fm/archives/8747)
- Su Jianlin, [为什么需要残差？一个来自DeepNet的视角](https://kexue.fm/archives/8994)
- Su Jianlin, [为什么Pre Norm的效果不如Post Norm？](https://kexue.fm/archives/9009)
- Su Jianlin, [通过梯度近似寻找Normalization的替代品](https://kexue.fm/archives/10831)
