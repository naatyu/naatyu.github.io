---
title: "Attention Softmax and Scaling"
date: 2026-06-11
lastmod: 2026-06-11
tags:
  - ai/llm
  - transformers
  - attention
draft: false
---

## Summary

The $1/\sqrt d$ factor in attention is not just a harmless implementation detail. It controls attention-logit scale, softmax entropy, gradient flow, and length extrapolation behavior.

The standard formula is:

$$
\operatorname{Attention}(Q,K,V)
=
\operatorname{softmax}
\left(
\frac{QK^\top}{\sqrt d}
\right)V
$$

The deeper question is:

$$
\text{what logit scale keeps attention neither uniform nor saturated?}
$$

## Concepts

- **Attention logit:** dot product $q^\top k$ before softmax.
- **Softmax entropy:** uncertainty of the attention distribution.
- **Entropy invariance:** desire for attention entropy to stay stable as sequence length changes.
- **Gradient saturation:** softmax gradients vanish when probabilities become too close to one-hot or too uniform.
- **KeyNorm:** L2 normalization of keys before attention.
- **QueryNorm:** L2 normalization of queries before attention.

## 1. Standard variance argument

Assume:

$$
q_i,k_i \sim (0,1)
$$

independently for $i=1,\ldots,d$.

Then:

$$
q^\top k = \sum_{i=1}^{d}q_i k_i
$$

and:

$$
\operatorname{Var}(q^\top k)
=
d
$$

So the scaled logit:

$$
\frac{q^\top k}{\sqrt d}
$$

has variance:

$$
\operatorname{Var}\left(\frac{q^\top k}{\sqrt d}\right)
\approx
1
$$

This avoids logits growing with hidden dimension.

## 2. Why variance is not the whole story

Softmax is sensitive to relative logit scale.

Given logits $z_i$, softmax gives:

$$
p_i
=
\frac{e^{z_i}}{\sum_j e^{z_j}}
$$

If logits are too small:

$$
p_i \approx \frac{1}{n}
$$

attention becomes nearly uniform.

If logits are too large:

$$
p_i \approx 1
$$

for one position, and attention saturates.

Both extremes can hurt learning:

- uniform attention cannot select information
- saturated attention has poor gradients

So the right scale is not only about logit variance. It is about keeping softmax in a useful entropy and gradient regime.

## 3. Entropy-invariance view

Attention length changes the softmax distribution.

For sequence length $n$, even if the logit distribution is fixed, the maximum over $n$ logits grows with $n$:

$$
\max_{1\leq i\leq n} z_i
$$

increases as $n$ increases.

That means attention entropy can change with length even if the per-logit variance is unchanged.

kexue.fm's entropy-invariance view asks for a scale that keeps attention entropy more stable across length. A simplified form is:

$$
\operatorname{softmax}
\left(
\kappa \frac{\log n}{d} QK^\top
\right)
$$

instead of:

$$
\operatorname{softmax}
\left(
\frac{1}{\sqrt d} QK^\top
\right)
$$

The exact constant $\kappa$ is implementation-dependent. The key idea is:

> attention scale may need to depend on sequence length if we want stable entropy across lengths.

This helps explain why length extrapolation can fail even when RoPE is handled correctly. Attention normalization itself can be length-sensitive.

## 4. Gradient-maximization view

The softmax Jacobian is:

$$
\frac{\partial p_i}{\partial z_j}
=
p_i(\delta_{ij}-p_j)
$$

If attention is nearly uniform:

$$
p_i \approx \frac{1}{n}
$$

gradients are small per coordinate.

If attention is nearly one-hot:

$$
p_i \approx 1
$$

then:

$$
p_i(1-p_i)\approx 0
$$

again giving small gradients.

So there is an intermediate logit scale where softmax gradients are largest. This gives another path to the same conclusion:

> attention scaling should keep softmax away from both uniformity and saturation.

## 5. Why softmax often beats unnormalized attention

Some efficient attention variants remove softmax normalization or replace it with simpler normalization.

The risk is length dependence.

If attention output is a sum:

$$
o_i = \sum_{j\leq i} a_{ij}v_j
$$

then changing the number of available tokens changes the magnitude and behavior of the sum unless $a_{ij}$ is normalized appropriately.

Softmax enforces:

$$
\sum_j a_{ij}=1
$$

so the output is a weighted average rather than a length-growing accumulation.

This is one reason softmax attention generalizes better across lengths than some unnormalized alternatives.

## 6. KeyNorm and QueryNorm

Instead of scaling by $\sqrt d$, one can normalize queries or keys:

$$
\tilde q_i = \frac{q_i}{\|q_i\|}
$$

$$
\tilde k_j = \frac{k_j}{\|k_j\|}
$$

Then attention uses cosine-like scores.

**QueryNorm:**

$$
o_i
=
\frac{
\sum_{j\leq i}
\exp(\tilde q_i^\top k_j)v_j
}{
\sum_{j\leq i}
\exp(\tilde q_i^\top k_j)
}
$$

**KeyNorm:**

$$
o_i
=
\frac{
\sum_{j\leq i}
\exp(q_i^\top \tilde k_j)v_j
}{
\sum_{j\leq i}
\exp(q_i^\top \tilde k_j)
}
$$

kexue.fm reports KeyNorm as a surprisingly useful length-extrapolation modification. A plausible intuition:

- key norms can grow or drift with position/distribution
- normalizing keys controls the retrieval database
- queries can still express confidence through their norm

So KeyNorm preserves some adaptive sharpness while stabilizing the stored keys.

## 7. Practical implications

- Do not treat $1/\sqrt d$ as sacred; treat it as a variance-control default.
- Check attention entropy across context lengths.
- Length extrapolation can fail because of attention-scale behavior, not only positional encoding.
- Softmax helps because it gives length-normalized weighted averages.
- KeyNorm is a low-intrusion architectural modification worth testing in long-context experiments.
- Linear attention and other softmax alternatives should be evaluated on length generalization, not only throughput.

## Related

- [Attention Variants](/atlas/ai/architectures/transformers/attention-variants)
- [Linear Attention](/atlas/ai/architectures/transformers/linear-attention)
- [RoPE Scaling](/atlas/ai/architectures/transformers/rope-scaling)
- [Residuals, Normalization, and Initialization](/atlas/ai/architectures/transformers/residual-normalization-and-initialization)

## Sources

- Su Jianlin, [从熵不变性看Attention的Scale操作](https://kexue.fm/archives/8823)
- Su Jianlin, [熵不变性Softmax的一个快速推导](https://kexue.fm/archives/9034)
- Su Jianlin, [从梯度最大化看Attention的Scale操作](https://kexue.fm/archives/9812)
- Su Jianlin, [听说Attention与Softmax更配哦～](https://kexue.fm/archives/9019)
- Su Jianlin, [Transformer升级之路：15、Key归一化助力长度外推](https://kexue.fm/archives/9859)
- Su Jianlin, [通向概率分布之路：盘点Softmax及其替代品](https://kexue.fm/archives/10145)
