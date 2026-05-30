---
title: "Roofline Model"
date: 2026-05-20
lastmod: 2026-05-20
tags:
  - ai/distributed-training
  - ai/hardware
  - optimization
  - performance
draft: false
---

## Summary

The roofline model predicts the maximum achievable performance of a kernel from its arithmetic intensity and the hardware limits for compute throughput and memory bandwidth.
## Concepts
- **Arithmetic intensity:** FLOPs performed per byte moved from memory.
- **Compute-bound:** performance is limited by peak FLOPs.
- **Memory-bound:** performance is limited by memory bandwidth.
- **Roofline:** upper bound on kernel performance: the minimum of the compute roof and memory-bandwidth roof.
- **Ridge point:** arithmetic intensity where a kernel switches from memory-bound to compute-bound.
- **Operational intensity:** another name for arithmetic intensity, often measured as FLOPs/byte.

## Content

### Core formula

The roofline model says:

$$P_{max}(I) = \min(P_{peak},\ B_{mem} \times I)$$

Where:

- $P_{max}$ is the maximum achievable performance in FLOPs/s
- $P_{peak}$ is hardware peak compute throughput
- $B_{mem}$ is memory bandwidth in bytes/s
- $I$ is arithmetic intensity in FLOPs/byte

Arithmetic intensity is:

$$I = \frac{\text{FLOPs}}{\text{Bytes moved}}$$

The ridge point is:

$$I_{ridge} = \frac{P_{peak}}{B_{mem}}$$

Interpretation:

- if $I < I_{ridge}$, the kernel is memory-bound
- if $I > I_{ridge}$, the kernel is compute-bound

### How to build a roofline

1. Choose the hardware and precision.
2. Get peak compute throughput $P_{peak}$.
3. Get memory bandwidth $B_{mem}$.
4. Compute the ridge point:

$$I_{ridge} = \frac{P_{peak}}{B_{mem}}$$

5. For each kernel, estimate:

$$I = \frac{\text{FLOPs}}{\text{Bytes moved}}$$

6. Predict the upper bound:

$$P_{max} = \min(P_{peak}, B_{mem}I)$$

7. Compare actual measured performance with the roofline bound.

### Example hardware roof

Use an A100-like FP32 example:

- peak FP32: $19.5$ TFLOP/s
- memory bandwidth: $1{,}555$ GB/s

Convert bandwidth:

$$1{,}555\ \text{GB/s} \approx 1.555 \times 10^{12}\ \text{bytes/s}$$

Ridge point:

$$I_{ridge} = \frac{19.5 \times 10^{12}}{1.555 \times 10^{12}} \approx 12.5\ \text{FLOPs/byte}$$

So on this FP32 roof:

- below $\sim 12.5$ FLOPs/byte: memory-bound
- above $\sim 12.5$ FLOPs/byte: compute-bound

If using Tensor Cores, $P_{peak}$ is much higher, so the ridge point moves right. That means a kernel needs much higher arithmetic intensity to fully use Tensor Cores.

### Example 1: bad elementwise kernel

Suppose a kernel does:

```text
y[i] = a[i] + b[i]
```

For FP32:

- read `a[i]`: 4 bytes
- read `b[i]`: 4 bytes
- write `y[i]`: 4 bytes
- FLOPs: 1 add

Arithmetic intensity:

$$I = \frac{1}{12} \approx 0.083\ \text{FLOPs/byte}$$

Roofline limit on A100 FP32:

$$P_{max} = 1.555 \times 10^{12} \times 0.083 \approx 0.129 \times 10^{12}$$

$$P_{max} \approx 129\ \text{GFLOP/s}$$

Even though the GPU can do $19.5$ TFLOP/s FP32, this kernel cannot get close because it is limited by memory bandwidth.

Optimization direction:

- fuse more operations per load
- avoid unnecessary writes
- reuse data in registers/cache

### Example 2: naive matmul with poor reuse

Imagine a bad matrix multiplication kernel that repeatedly loads operands from global memory and gets only:

$$I = 0.25\ \text{FLOPs/byte}$$

On A100 FP32:

$$P_{max} = 1.555 \times 10^{12} \times 0.25$$

$$P_{max} \approx 389\ \text{GFLOP/s}$$

This is only:

$$\frac{389}{19{,}500} \approx 2\%$$

of FP32 peak.

The model explains why the kernel is bad: it does too little compute for every byte fetched.

Optimization direction:

- tile the matrix
- load tiles into shared memory
- reuse each loaded value across many multiply-adds
- increase arithmetic intensity

### Example 3: tiled matmul

For square matmul:

$$C = AB$$

With $A,B,C \in \mathbb{R}^{N \times N}$.

FLOPs:

$$2N^3$$

Bytes for idealized one-time reads/writes in FP16:

$$2N^2 \times 2 + N^2 \times 2 = 6N^2\ \text{bytes}$$

Arithmetic intensity:

$$I \approx \frac{2N^3}{6N^2} = \frac{N}{3}\ \text{FLOPs/byte}$$

For $N=4096$:

$$I \approx \frac{4096}{3} \approx 1365\ \text{FLOPs/byte}$$

This is extremely high. A well-tiled large GEMM is compute-bound on most GPUs.

This is why transformer prefill, training, and large-batch GEMMs can achieve high compute utilization.

### Example 4: LLM decode is memory-bound

During decode, the model generates one token at a time.

For a dense model, each output token roughly touches all parameters once.

Approximate FLOPs per token:

$$F \approx 2N$$

Approximate bytes read for BF16 weights:

$$M \approx 2N$$

Arithmetic intensity:

$$I \approx \frac{2N}{2N} = 1\ \text{FLOP/byte}$$

For an A100 FP32 roof with ridge $\sim 12.5$ FLOPs/byte, $I=1$ is memory-bound.

With Tensor Core precision, the ridge point is even higher, so decode is even more clearly memory-bound.

Practical consequence:

- single-user decode wastes compute
- batching improves arithmetic intensity because the same weights are reused across multiple tokens/users
- decode serving is often limited by HBM bandwidth, not FLOPs

### Example 5: batching moves decode toward compute-bound

If batch size is $B$, the same weights can be reused for $B$ tokens.

Approximate FLOPs:

$$F \approx 2BN$$

Approximate weight bytes:

$$M \approx 2N$$

Ignoring activation/KV traffic:

$$I \approx \frac{2BN}{2N} = B\ \text{FLOPs/byte}$$

So:

- batch $1$: $I \approx 1$
- batch $8$: $I \approx 8$
- batch $32$: $I \approx 32$

If the ridge point is $12.5$ FLOPs/byte, then:

- batch 1 is memory-bound
- batch 8 is still near memory-bound
- batch 32 can become compute-bound in this simplified model

This is the roofline reason that LLM serving systems batch requests.

### Example 6: prefill is often compute-bound

In prefill, the model processes many prompt tokens in parallel.

A matrix multiplication like:

$$XW$$

Where:

- $X$ has shape $[T, d]$
- $W$ has shape $[d, 4d]$

As $T$ grows, the same weights are reused across many tokens. This increases arithmetic intensity.

That is why:

- prefill is usually compute-bound
- decode is usually memory-bound
- disaggregated serving separates prefill and decode pools

### How to use roofline in practice

For a kernel or operation:

1. Count FLOPs.
2. Count bytes moved from the slow memory level that matters.
3. Compute arithmetic intensity.
4. Compare with the hardware ridge point.
5. Choose optimization strategy.

If memory-bound:

- reduce memory traffic
- improve locality
- tile into shared memory
- fuse kernels
- use smaller precision
- improve coalescing
- avoid redundant loads/stores

If compute-bound:

- use Tensor Cores
- improve occupancy
- improve instruction mix
- reduce synchronization
- improve tiling for compute utilization
- use better kernels such as cuBLAS, FlashAttention, or fused kernels

### Common mistakes

#### Counting only parameter bytes

For LLMs, bytes include:

- weights
- activations
- KV cache
- optimizer state during training
- gradients
- temporary buffers

Decode can become KV-cache-bound at long context lengths.

#### Using theoretical peak blindly

Peak FLOPs and bandwidth are upper bounds. Real kernels are lower due to:

- non-perfect occupancy
- cache misses
- synchronization
- launch overhead
- poor memory coalescing
- suboptimal tensor shapes

#### Ignoring precision

The roof changes with precision:

- FP32 roof
- TF32 roof
- BF16/FP16 Tensor Core roof
- FP8 Tensor Core roof

The same kernel can be memory-bound under one precision and compute-bound under another.

#### Ignoring the memory hierarchy

There is not just one bandwidth roof.

Possible roofs:

- HBM/global memory
- L2 cache
- shared memory
- registers
- inter-GPU bandwidth

The relevant roof depends on where the data comes from.

### Practical mental model

Roofline answers:

&gt; Am I starved for compute or starved for data?

If the operation has low FLOPs per byte, buy or optimize for bandwidth.

If the operation has high FLOPs per byte, optimize for compute utilization.

For LLMs:

- training large GEMMs: often compute-bound
- prefill: often compute-bound
- decode batch 1: usually memory-bound
- long-context decode: often KV-cache/memory-bound
- elementwise ops: usually memory-bound
- poorly tiled kernels: memory-bound even if the math looks large

## Takeaways

- Arithmetic intensity is FLOPs divided by bytes moved.
- Roofline upper bound is $\min(P_{peak}, B_{mem}I)$.
- The ridge point tells you whether an operation is memory-bound or compute-bound.
- Large tiled GEMMs have high arithmetic intensity and can be compute-bound.
- Elementwise kernels and single-token LLM decode have low arithmetic intensity and are memory-bound.
- Batching increases arithmetic intensity by reusing weights across tokens.
- Roofline tells you which optimization direction matters before writing code.

## Related
- [LLM Inference Economics](/atlas/ai/inference-serving/performance/llm-inference-economics)
- [Disaggregated Prefill-Decode Serving](/atlas/ai/inference-serving/serving-architectures/disaggregated-prefill-decode-serving)
- [FP8 Training](/atlas/ai/training/precision/fp8-training)
- [Hardware Topology](/atlas/systems/parallel-computing/hardware-topology-and-parallelism)
- Distributed Training MOC
