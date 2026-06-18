---
title: "Low-Precision Attention Rounding Bias"
date: 2026-06-11
lastmod: 2026-06-11
tags:
  - ai/training
  - precision
  - attention
draft: false
---

## Summary

Low-precision attention is not only about random quantization noise. Some attention kernels can introduce **biased rounding error**, especially around the probability-value product:

$$
P V
$$

where:

- $P=\operatorname{softmax}(QK^\top)$
- $V$ is the value matrix

The practical lesson is:

> low precision errors can be systematic, not merely zero-mean noise.

## Concepts

- **Rounding bias:** rounding error with nonzero expected value.
- **Accumulator:** higher-precision register used during matmul accumulation.
- **Attention probability matrix:** softmax-normalized weights $P$.
- **PV matmul:** multiplication of attention probabilities by values.
- **BF16/FP16/FP8:** low-precision floating-point formats.

## 1. Attention compute path

Attention is:

$$
O
=
\operatorname{softmax}
\left(
\frac{QK^\top}{\sqrt d}
\right)V
$$

There are two major matrix products:

$$
S = QK^\top
$$

and:

$$
O = PV
$$

where:

$$
P=\operatorname{softmax}(S)
$$

Both can be affected by low precision, but the error behavior is not necessarily the same.

## 2. Why $PV$ is special

The entries of $P$ are nonnegative and sum to one:

$$
P_{ij}\geq 0,\qquad \sum_j P_{ij}=1
$$

So the output is a weighted average:

$$
o_i = \sum_j P_{ij}v_j
$$

If low-precision rounding systematically rounds small probabilities or products in one direction, the result can shift the weighted average.

Unlike ordinary zero-mean noise:

$$
\mathbb{E}[\epsilon]=0
$$

biased rounding has:

$$
\mathbb{E}[\epsilon]\neq 0
$$

This means the model repeatedly sees a distorted attention output, not just a noisy one.

## 3. Why accumulation precision is not the full story

Modern hardware often multiplies low-precision inputs but accumulates into higher precision:

$$
\text{low precision inputs}
\rightarrow
\text{higher precision accumulator}
$$

This helps, but it does not eliminate all low-precision issues because tensors may be quantized:

- before the matmul
- between fused stages
- after accumulation
- before the next operation

So the question is not only:

$$
\text{what precision is the accumulator?}
$$

but also:

$$
\text{where are values rounded, cast, scaled, and stored?}
$$

## 4. Bias vs variance

Quantization error can be decomposed as:

$$
\hat x = x + \epsilon
$$

with:

$$
\mathbb{E}[\epsilon] = b
$$

and:

$$
\operatorname{Var}(\epsilon)=\sigma^2
$$

If:

$$
b=0
$$

then the error is unbiased noise.

If:

$$
b\neq 0
$$

then the operation has systematic drift.

For training, bias is often more dangerous than variance because it changes the expected computation.

## 5. Practical diagnostics

To test whether low-precision attention introduces bias:

- compare low-precision attention output to FP32 reference
- measure mean error, not only max error or RMS error
- separate $QK^\top$ error from $PV$ error
- test different sequence lengths and attention entropy regimes
- inspect errors for small probability values
- compare fused vs unfused kernels
- test deterministic rounding vs stochastic rounding if available

Useful statistics:

$$
\operatorname{mean}(\hat O-O)
$$

$$
\operatorname{RMS}(\hat O-O)
$$

$$
\frac{\|\hat O-O\|}{\|O\|}
$$

and per-channel/per-token error summaries.

## 6. Training implications

Biased low-precision attention can affect:

- long-context stability
- attention entropy
- gradient estimates
- loss spikes
- convergence differences between kernels
- reproducibility across hardware backends

This is especially relevant when comparing:

- BF16 vs FP16
- FP8 attention
- FlashAttention variants
- custom fused kernels
- vendor-specific low-precision kernels

## Related

- [FP8 Training](/atlas/ai/training/precision/fp8-training)
- [Attention Softmax and Scaling](/atlas/ai/architectures/transformers/attention-softmax-and-scaling)
- [Attention Variants](/atlas/ai/architectures/transformers/attention-variants)
- [FlashAttention](/atlas/ai/architectures/transformers/flashattention)
- [Training Loss Patterns](/atlas/ai/training/optimization/training-loss-patterns)

## Sources

- Su Jianlin, [低精度Attention可能存在有偏的舍入误差](https://kexue.fm/archives/11371)
