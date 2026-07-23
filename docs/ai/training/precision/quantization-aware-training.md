---
title: "Quantization-Aware Training"
date: 2026-07-23
lastmod: 2026-07-23
tags:
  - ai/training
  - quantization
  - inference
draft: false
---

## Summary

Quantization-aware training (QAT) exposes a model to simulated low-precision numerics during training or fine-tuning. Unlike post-training quantization, which converts a completed checkpoint, QAT lets the weights adapt to clipping, rounding, and restricted representable values before deployment.

Use QAT when the target format is aggressive enough that calibration alone causes an unacceptable quality loss, especially with `int4`, mixed `int2/int4`, or quantized activations.

## Concepts

- **Fake quantization:** simulate quantize/dequantize operations during floating-point training.
- **Quantization scale:** maps real values to integer or low-bit bins.
- **Zero point:** integer value representing real zero in asymmetric quantization.
- **Per-channel quantization:** use a separate scale for each output channel.
- **Blockwise quantization:** share scales within small blocks of values.
- **W8A8:** 8-bit weights and 8-bit activations.
- **Q4_0:** a common blockwise 4-bit weight representation.

## 1. Post-training quantization vs. QAT

Post-training quantization follows:

```text
train floating-point model -> calibrate/quantize -> deploy
```

QAT follows:

```text
train or fine-tune with simulated quantization -> export real quantized kernels -> deploy
```

Post-training quantization is cheaper and should usually be tried first. QAT is useful when low-bit error is too structured or too large for calibration to absorb.

## 2. Fake quantization

For scale $s$, a symmetric quantizer can be written approximately as:

$$
q
=
\operatorname{clip}
\left(
\operatorname{round}\left(\frac{x}{s}\right),
q_{\min},
q_{\max}
\right)
$$

and the simulated dequantized value is:

$$
\hat{x} = s q
$$

The forward pass uses $\hat{x}$ so the model experiences quantization error. Since rounding has zero derivative almost everywhere, training commonly uses a straight-through estimator for the backward pass.

## 3. Granularity matters

### Per-tensor

One scale for the full tensor.

- least metadata
- simplest kernels
- most vulnerable to outliers

### Per-channel

One scale per output channel.

- better adapts to channel magnitude differences
- common for low-bit weights
- more scale metadata

### Blockwise

One scale per small block.

- handles local outliers better
- maps to formats such as Q4_0 and microscaling
- introduces layout and kernel constraints

The best format is hardware-dependent. A theoretically accurate scheme may lose in practice if the runtime lacks efficient kernels.

## 4. Weight and activation quantization are different

Weights are fixed at inference, so their scales can be prepared offline. Activations depend on the input and can contain rare dynamic outliers.

This is why:

- weight-only quantization is usually easier
- activation quantization often needs calibration or learned range control
- normalization, residual streams, softmax, and logits may remain at higher precision

QAT can teach the model to keep activations in quantization-friendly ranges, but it does not remove the need to inspect saturation and outliers.

## 5. Gemma 4 case study

Gemma 4 uses two deployment families:

- mobile: per-channel mixed `int2/int4` weights with `int8` activations
- open-source runtimes: blockwise `Q4_0` weights

The report applies QAT to the language model and modality encoders.

Reported encoder effects include:

- `W8A8` vision encoder: memory from `400 MB` to `200 MB`
- `44%` lower on-device vision latency relative to Gemma 3n on newer hardware
- mixed `2/4/8`-bit audio weights plus `8`-bit activations: disk footprint from `390 MB` to `87 MB`

For stable FP16 inference, Gemma 4 also introduces a scalar scale at each transformer block to bound activation ranges. This is adjacent to QAT but conceptually distinct: the objective is to prevent FP16 overflow rather than map values into integer bins.

The deployment lesson is:

> choose the numerical format, training recipe, and target kernels together.

## 6. Practical workflow

1. Define the exact runtime and supported quantized kernels.
2. Establish a BF16 or FP16 quality baseline.
3. Try post-training quantization first.
4. Measure quality by task and layer sensitivity.
5. Introduce QAT only where PTQ misses the target.
6. Keep sensitive operations at higher precision.
7. Evaluate end-to-end latency and memory, not checkpoint size alone.
8. Validate on the actual deployment hardware.

## 7. Failure modes

- **Range collapse:** learned or calibrated scales become too narrow and clip useful values.
- **Outlier domination:** a few values force a coarse scale for most of a tensor.
- **Train/deploy mismatch:** fake-quant operators do not match runtime rounding, grouping, or saturation.
- **Late instability:** enabling aggressive QAT abruptly can perturb an already-trained model.
- **Misleading compression:** small weights may be offset by unquantized KV cache or runtime buffers.

## Related

- [FP8 Training](/atlas/ai/training/precision/fp8-training)
- [Low-Precision Attention Rounding Bias](/atlas/ai/training/precision/low-precision-attention-rounding-bias)
- [KV Cache](/atlas/ai/inference-serving/caching/kv-cache)
- [Gemma 4 Technical Report](/atlas/ai/architectures/model-reports/gemma-4-technical-report)

## Sources

- Benoit Jacob et al., [Quantization and Training of Neural Networks for Efficient Integer-Arithmetic-Only Inference](https://arxiv.org/abs/1712.05877)
- Gemma Team, [Gemma 4 Technical Report](https://arxiv.org/abs/2607.02770)
