---
title: "FP8 Training"
date: 2026-05-20
lastmod: 2026-06-08
tags:
  - ai/deep-learning
  - training
  - quantization
draft: false
---

## Summary

FP8 training uses 8-bit floating-point formats for selected matrix multiplications to reduce memory bandwidth and increase Tensor Core throughput while keeping sensitive operations in BF16/FP32.
## Concepts
- **FP8:** 8-bit floating-point arithmetic, usually using E4M3 or E5M2 formats.
- **E4M3:** FP8 format with 4 exponent bits and 3 mantissa bits; higher precision, lower dynamic range.
- **E5M2:** FP8 format with 5 exponent bits and 2 mantissa bits; lower precision, higher dynamic range.
- **Scaling factor:** multiplier used to map real tensor values into the representable FP8 range.
- **Delayed scaling:** uses amax history from previous iterations to choose the next scale.
- **Current scaling:** computes the scale from the current tensor before quantization.
- **Per-tensor scaling:** one scale for the whole tensor.
- **Per-row scaling:** one scale per row.
- **Per-column scaling:** one scale per column.
- **Block scaling:** one scale per small block of values.
- **MXFP8:** microscaling FP8 format using block-level scales.
- **NVFP4:** NVIDIA 4-bit floating-point format using fine-grained block scaling, mainly relevant to Blackwell-era low-precision inference/training research.

## Content

### Why FP8 training exists

Training large transformers is dominated by large matrix multiplications:

- attention projections
- MLP / FFN projections
- output projections
- MoE expert matmuls

BF16 is already much cheaper than FP32, but FP8 can reduce:

- activation memory
- weight/activation bandwidth
- communication volume
- Tensor Core compute cost

The basic idea:

```text
store/master weights in higher precision
cast selected tensors to FP8 for matmul
accumulate in higher precision
keep numerically sensitive operations in BF16/FP32
```

FP8 training is not usually "everything in FP8". Optimizer states, master weights, reductions, normalization, softmax, and loss computation usually stay in BF16/FP32.

### FP8 formats

The two common FP8 formats are:

| Format | Bits | Strength | Typical use |
|---|---:|---|---|
| E4M3 | 1 sign, 4 exponent, 3 mantissa | better precision | forward activations and weights |
| E5M2 | 1 sign, 5 exponent, 2 mantissa | larger dynamic range | gradients / backward tensors |

E4M3 has more mantissa precision but less range. E5M2 has more range but less precision.

A common recipe is:

```text
forward:  E4M3
backward: E5M2 or mixed depending on framework/hardware
```

The exact choice depends on the framework, architecture, and stability requirements.

### Why scaling is needed

FP8 has a tiny representable range compared to BF16/FP32. If we directly cast a tensor to FP8, many values can underflow or overflow.

So we quantize with a scale:

$$x_{fp8} = quantize(x / s)$$

Then dequantize approximately with:

$$\hat{x} = x_{fp8} \times s$$

The scale should map the tensor's important values into the usable FP8 range.

### Per-tensor scaling

Per-tensor scaling uses one scale for the entire tensor.

```text
scale = max_abs(tensor) / fp8_max
```

Pros:

- simple
- cheap
- low metadata overhead
- easy for hardware/software

Cons:

- one outlier can dominate the scale
- small values can lose precision
- bad when tensor distributions differ across rows/columns

This is often the simplest FP8 training setup.

### Per-row scaling

Per-row scaling uses one scale per row.

For a matrix:

```text
X shape = [rows, columns]
scale shape = [rows]
```

Each row gets its own scale.

This helps when different rows have different magnitudes. In LLMs, this can matter because token activations can vary significantly across batch/sequence positions.

Pros:

- better precision than per-tensor scaling
- handles row-wise variation
- useful for activation matrices

Cons:

- more scale metadata
- more complex kernels
- scale layout matters for performance

### Per-column scaling

Per-column scaling uses one scale per column.

For a matrix:

```text
X shape = [rows, columns]
scale shape = [columns]
```

This helps when different hidden dimensions or output channels have different magnitudes.

Pros:

- handles channel-wise / feature-wise variation
- useful for weights or weight gradients in some layouts
- can reduce outlier damage compared to per-tensor scaling

Cons:

- metadata overhead
- kernel/layout complexity
- may not match every matmul layout efficiently

### Row vs column intuition

For a matmul:

$$Y = XW$$

You can think of:

- rows of $X$ as tokens/examples
- columns of $X$ as hidden features
- columns of $W$ as output channels

So:

```text
per-row activation scaling    -> each token gets its own scale
per-column activation scaling -> each feature gets its own scale
per-column weight scaling     -> each output/input channel gets its own scale depending on layout
```

The right axis depends on the tensor layout and kernel convention.

### Block scaling

Block scaling uses one scale for a small group of values.

Example:

```text
one scale per 32 values
```

This is a compromise:

- more precise than per-tensor scaling
- less metadata than per-element scaling
- hardware-friendly if block sizes match Tensor Core layouts

Block scaling is important for MXFP8 and NVFP4-style formats.

### MXFP8

MXFP8 means microscaling FP8.

Instead of one scale for a whole tensor, MXFP8 uses small blocks of values that share a scale. This reduces quantization error because each block only needs to cover a local value range.

Conceptually:

```text
tensor -> split into blocks -> each block gets its own scale -> values stored as FP8
```

Why it helps:

- better handles outliers
- preserves more local precision
- improves stability at low precision
- maps well to Blackwell-era hardware support

The trade-off is extra scale metadata and stricter layout requirements.

### NVFP4

NVFP4 is a 4-bit floating-point format introduced for NVIDIA Blackwell-era low-precision workflows.

It is not the same thing as FP8 training, but it belongs in the same family of low-precision formats.

Conceptually, NVFP4 uses:

- 4-bit floating-point values
- fine-grained block scaling
- FP8 scale factors for small blocks
- an additional higher-level scale in some recipes

Why it matters:

- much lower memory bandwidth than FP8/BF16
- useful for inference and emerging low-precision training/distillation workflows
- more quantization noise than FP8, so it needs better scaling and often calibration/QAT/distillation

Practical view:

```text
BF16 -> robust training baseline
FP8  -> mature low-precision training target
MXFP8 -> better FP8 scaling with block-level scales
NVFP4 -> more aggressive 4-bit format, mostly inference / advanced quantized training workflows
```

### What usually stays high precision

Even in FP8 training, not everything should be FP8.

Usually keep these in BF16/FP32:
- optimizer states
- master weights
- residual streams
- normalization paths
- softmax / pre-softmax logits
- loss computation
- global reductions

### A concrete production-style recipe

A practical frontier-style recipe is:

- **BF16** as the default weight and activation type
- **FP8 E4M3** for forward GEMMs
- **FP8 E5M2** for data-gradient GEMMs
- **BF16** compute for weight gradients
- **FP32** gradient accumulation

This gives:

- E4M3 where forward precision matters more
- E5M2 where backward range matters more
- BF16/FP32 where instability compounds

### Delayed scaling in practice

One concrete implementation detail that matters is delayed scaling with a long amax history.

Example:

```text
1024-step amax history
```

This is a good reminder that FP8 stability is not only about the format. It is also about the scale-update policy.

### Operations commonly kept in FP32

Recent large-scale recipes often keep the following in FP32:

- the full residual stream
- attention scores before softmax
- MoE router logits
- final output logits
- router weights
- embedding weights
- optimizer state and AdamW math
- data-parallel all-reduce / reduce-scatter paths

So “FP8 training” should really be read as selective FP8 use inside a larger mixed-precision system.

- optimizer states
- master weights
- loss computation
- softmax
- normalization layers
- residual accumulation
- gradient reductions
- small or numerically sensitive ops

FP8 is mostly for large GEMMs where Tensor Cores provide speedup.

### Training stability tricks

Common FP8 stability tricks:

- keep master weights in BF16/FP32
- use FP8 only for matmul inputs
- accumulate matmuls in higher precision
- use loss scaling if needed
- track amax history for scale selection
- avoid FP8 for LayerNorm/RMSNorm and softmax
- monitor overflow/saturation rate
- use per-channel or block scaling when per-tensor scaling is unstable

### Delayed scaling vs current scaling

Delayed scaling:

```text
scale_t = function(amax history from previous steps)
```

Pros:

- avoids computing current amax on critical path
- historically common in FP8 training
- stable if tensor statistics change slowly

Cons:

- scale can lag behind sudden distribution changes
- may overflow if activations spike

Current scaling:

```text
scale_t = function(current tensor amax)
```

Pros:

- scale matches current tensor
- can reduce overflow from sudden spikes

Cons:

- requires current amax before quantization
- can add synchronization or kernel overhead

### FP8 and distributed training

FP8 can reduce communication if gradients or activations are communicated in lower precision, but this is delicate.

Things to watch:

- all-reduce precision
- tensor-parallel communication precision
- activation checkpointing interactions
- scale synchronization across parallel ranks
- reproducibility when amax differs between shards

In tensor parallelism, scaling granularity can interact with how tensors are sharded. A per-column scale before sharding may become a per-local-column scale after sharding.

### Practical mental model

FP8 training is not just "cast to FP8".

It is:

```text
choose FP8 format
choose scaling granularity
choose scale update rule
choose which ops stay high precision
use kernels that understand the scale layout
monitor saturation and loss stability
```

The scaling strategy is as important as the 8-bit format itself.

## Takeaways

- FP8 training reduces memory bandwidth and increases matmul throughput.
- E4M3 gives better precision; E5M2 gives better range.
- Scaling is required because FP8 has limited range.
- Per-tensor scaling is simple but outlier-sensitive.
- Per-row and per-column scaling reduce quantization error along specific axes.
- Block scaling is a strong compromise and is central to MXFP8.
- MXFP8 is block-scaled FP8, designed for better low-precision accuracy.
- NVFP4 is a more aggressive 4-bit format, useful to know but not a drop-in replacement for FP8 training.
- Most stable FP8 recipes still keep sensitive operations and optimizer state in BF16/FP32.

## Related
- [Transformer Scaling Rules](/atlas/ai/training/scaling/transformer-scaling-rules)
- Distributed Training MOC
- [LLM Inference Economics](/atlas/ai/inference-serving/performance/llm-inference-economics)
- [Scaling Laws](/atlas/ai/training/scaling/scaling-laws)
