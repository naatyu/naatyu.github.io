---
title: "FlashAttention"
date: 2026-06-18
lastmod: 2026-06-18
tags:
  - ai/llm
  - transformers
  - attention
  - performance
draft: false
---

## Summary

FlashAttention is an **exact attention algorithm** that makes standard attention faster and more memory-efficient by changing how the computation is scheduled on the GPU. It does not approximate attention and does not change the mathematical output, up to floating-point differences.

The core idea is:

$$
\text{avoid materializing the } n\times n \text{ attention matrix in HBM}
$$

Instead, FlashAttention tiles the computation, streams blocks through fast on-chip memory, and recomputes cheap intermediates during backward rather than storing them.

## Concepts

- **HBM:** high-bandwidth GPU memory; large but much slower than on-chip memory.
- **SRAM / shared memory:** small fast on-chip memory used inside GPU kernels.
- **IO-aware algorithm:** algorithm designed around memory reads/writes, not only FLOP count.
- **Tiling:** split matrices into blocks that fit in fast memory.
- **Online softmax:** compute softmax block by block while maintaining exact normalization.
- **Recomputation:** save memory by recomputing intermediate values in backward.
- **Exact attention:** same attention result as standard softmax attention, not a low-rank or sparse approximation.

## 1. Standard attention bottleneck

Self-attention computes:

$$
O
=
\operatorname{softmax}
\left(
\frac{QK^\top}{\sqrt{d}}
\right)V
$$

where:

- $Q,K,V\in\mathbb{R}^{n\times d}$
- $n$ is sequence length
- $d$ is head dimension

The naive implementation forms the score matrix:

$$
S = QK^\top
$$

with:

$$
S\in\mathbb{R}^{n\times n}
$$

Then it forms:

$$
P=\operatorname{softmax}(S)
$$

and finally:

$$
O=PV
$$

The issue is not only arithmetic. It is memory traffic:

- write $S$ to HBM
- read $S$ for softmax
- write $P$ to HBM
- read $P$ for $PV$

For long sequences, storing $S$ and $P$ is expensive:

$$
O(n^2)
\text{ memory}
$$

This is often the bottleneck even when the GPU has enough FLOPs.

## 2. What FlashAttention changes

FlashAttention computes the same result, but tiles over blocks of queries and keys/values.

Instead of:

$$
QK^\top
\rightarrow
P
\rightarrow
PV
$$

as separate large tensors, it computes:

1. load a block of $Q$
2. load a block of $K,V$
3. compute local scores
4. update softmax statistics
5. update output
6. move to the next block

The large $n\times n$ matrices are never written to HBM.

Memory changes from roughly:

$$
O(n^2)
$$

for attention probabilities to:

$$
O(n)
$$

for per-row softmax statistics and outputs.

The compute remains quadratic:

$$
O(n^2d)
$$

So FlashAttention is not a linear-attention method. It is still full attention, but with much lower memory traffic.

## 3. Online softmax

The main trick that makes tiling exact is online softmax.

For a row of scores $s_1,\ldots,s_n$, softmax needs:

$$
p_i
=
\frac{\exp(s_i)}
{\sum_j \exp(s_j)}
$$

For numerical stability, use:

$$
m = \max_j s_j
$$

and:

$$
\ell = \sum_j \exp(s_j-m)
$$

Then:

$$
p_i
=
\frac{\exp(s_i-m)}{\ell}
$$

FlashAttention processes the row in blocks. For each block $b$, compute:

$$
m_b = \max_{j\in b}s_j
$$

$$
\ell_b = \sum_{j\in b}\exp(s_j-m_b)
$$

When combining a previous state $(m_{\text{old}},\ell_{\text{old}})$ with a new block $(m_b,\ell_b)$:

$$
m_{\text{new}}
=
\max(m_{\text{old}},m_b)
$$

$$
\ell_{\text{new}}
=
e^{m_{\text{old}}-m_{\text{new}}}\ell_{\text{old}}
+
e^{m_b-m_{\text{new}}}\ell_b
$$

The output accumulator is rescaled similarly:

$$
o_{\text{new}}
=
e^{m_{\text{old}}-m_{\text{new}}}o_{\text{old}}
+
\sum_{j\in b}
e^{s_j-m_{\text{new}}}v_j
$$

After all blocks:

$$
O = \frac{o}{\ell}
$$

This gives the exact softmax result without storing the whole attention row.

## 4. Backward pass and recomputation

During training, the backward pass needs attention probabilities or scores.

Naively, one might store:

$$
S,\quad P
$$

from the forward pass.

FlashAttention instead stores compact per-row statistics such as:

$$
m_i,\quad \ell_i
$$

and recomputes score blocks during backward:

$$
S_{ij}=q_i^\top k_j
$$

This trades extra compute for much lower memory.

That tradeoff is good on modern GPUs because attention is often memory-traffic limited:

$$
\text{extra matmul work}
\ll
\text{cost of writing and reading } n^2 \text{ intermediates}
$$

## 5. Why it speeds up real training

The normal attention formula has the same asymptotic FLOPs whether implemented naively or with FlashAttention.

The speedup comes from the memory hierarchy:

| Memory level | Size | Speed |
| --- | ---: | --- |
| HBM | large | slower |
| SRAM / shared memory | small | much faster |
| registers | tiny | fastest |

FlashAttention reduces HBM reads/writes by keeping blocks in on-chip memory.

This is why it is called **IO-aware**:

> it optimizes the movement of data between memory levels, not just the number of arithmetic operations.

Practical benefits:

- faster attention kernels
- lower activation memory
- longer feasible sequence lengths
- larger batch/sequence combinations
- better end-to-end training throughput

## 6. FlashAttention vs efficient attention variants

FlashAttention is easy to confuse with approximate attention variants.

It is not:

- linear attention
- sparse attention
- sliding-window attention
- low-rank attention
- MLA

Those change the attention pattern or representation.

FlashAttention changes the **kernel implementation** of standard attention:

$$
\operatorname{softmax}(QK^\top)V
$$

The model architecture can stay the same.

## 7. Version history

### FlashAttention-1

FlashAttention-1 introduced the central IO-aware algorithm:

- tile $Q,K,V$
- keep blocks in SRAM/shared memory
- use online softmax
- avoid materializing $S$ and $P$
- recompute attention blocks in backward

Main contribution:

$$
\text{exact attention with } O(n) \text{ memory instead of } O(n^2)
$$

It showed that many approximate attention methods were solving the wrong bottleneck: wall-clock speed often depended more on memory movement than theoretical FLOP count.

### FlashAttention-2

FlashAttention-2 improved GPU utilization.

The first version saved memory and was fast, but it still left performance on the table because of:

- suboptimal work partitioning
- low occupancy in some regimes
- unnecessary shared-memory communication
- too much non-matmul overhead

FlashAttention-2 changed:

- parallelism across thread blocks
- work partitioning within each block
- warp-level scheduling
- reduction of non-matmul FLOPs

Main contribution:

$$
\text{same algorithmic idea}
\quad+\quad
\text{better GPU parallelism}
$$

This made FlashAttention closer to optimized GEMM efficiency.

### FlashAttention-3

FlashAttention-3 targets NVIDIA Hopper GPUs such as H100/H800.

It uses Hopper-specific hardware features:

- **WGMMA:** warpgroup matrix multiply-accumulate
- **TMA:** Tensor Memory Accelerator for global/shared memory transfer
- **FP8 Tensor Cores**

The main new ideas:

1. overlap data movement and computation using warp specialization
2. overlap matmul and softmax
3. use FP8 with techniques such as incoherent processing to reduce quantization error

Why overlap matters:

- attention has fast matmuls
- softmax uses exponentials, which run on different hardware units
- if scheduled naively, softmax can become exposed latency

FlashAttention-3 tries to hide softmax under matrix multiply work.

Main contribution:

$$
\text{hardware-aware attention for Hopper}
$$

### FlashAttention-4

FlashAttention-4 is the newer CuTeDSL line, optimized for Hopper and Blackwell GPUs.

It is designed around newer hardware behavior such as:

- Blackwell tensor memory
- improved pipelining of MMA and softmax
- reducing shared-memory bottlenecks in backward
- 2-CTA cooperation for backward kernels

The important shift is that FlashAttention is now not just one algorithm; it is a family of hardware-specialized kernels.

Main contribution:

$$
\text{algorithm-kernel co-design for Hopper/Blackwell}
$$

As of the current official repository, FlashAttention-4 is installable separately as:

```bash
pip install flash-attn-4
```

while FlashAttention-1/2 and FlashAttention-3 live in the main FlashAttention ecosystem with different paths and hardware requirements.

## 8. Practical version selection

| Version | Main target | Main idea |
| --- | --- | --- |
| FlashAttention-1 | general CUDA GPUs | IO-aware tiling and online softmax |
| FlashAttention-2 | Ampere/Ada/Hopper | better parallelism and work partitioning |
| FlashAttention-3 | Hopper | WGMMA/TMA, async overlap, FP8 path |
| FlashAttention-4 | Hopper/Blackwell | CuTeDSL, deeper kernel pipelining, Blackwell-aware design |

Practical default:

- use framework-provided scaled-dot-product attention when it dispatches to FlashAttention correctly
- use FlashAttention-2 for broad CUDA compatibility
- use FlashAttention-3/4 only when the target hardware and software stack justify it
- benchmark on the actual sequence length, head dimension, precision, masking, and dropout mode

## 9. Limitations and caveats

FlashAttention does not remove the quadratic compute cost:

$$
O(n^2d)
$$

It reduces memory traffic and activation memory.

Other caveats:

- kernel support depends on GPU architecture
- head dimension and dtype support vary by version
- dropout, deterministic backward, causal masks, sliding windows, GQA/MQA, and variable lengths may dispatch to different kernels
- low precision can introduce numerical differences
- build and packaging can be painful outside common CUDA/Linux stacks
- for autoregressive decode, KV-cache bandwidth may dominate more than attention-score materialization

## 10. Practical mental model

FlashAttention is best understood as:

$$
\text{same attention math}
\quad+\quad
\text{less HBM traffic}
\quad+\quad
\text{better GPU scheduling}
$$

It is a major reason long-context transformers became practical, but it is not a replacement for architectural methods like GQA, MLA, sliding-window attention, or context parallelism. Those change what is computed; FlashAttention changes how standard attention is computed efficiently.

## Related

- [PyTorch Profiler and GPU Trace Reading](/atlas/tooling/profiling/pytorch-profiler-and-gpu-trace-reading)
- [Attention Variants](/atlas/ai/architectures/transformers/attention-variants)
- [Attention Softmax and Scaling](/atlas/ai/architectures/transformers/attention-softmax-and-scaling)
- [Linear Attention](/atlas/ai/architectures/transformers/linear-attention)
- [Context Parallelism](/atlas/systems/parallel-computing/context-parallelism)
- [Roofline Model](/atlas/systems/performance/roofline-model)
- [Low-Precision Attention Rounding Bias](/atlas/ai/training/precision/low-precision-attention-rounding-bias)

## Sources

- Dao et al., [FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness](https://arxiv.org/abs/2205.14135)
- Dao, [FlashAttention-2: Faster Attention with Better Parallelism and Work Partitioning](https://arxiv.org/abs/2307.08691)
- Shah et al., [FlashAttention-3: Fast and Accurate Attention with Asynchrony and Low-precision](https://arxiv.org/abs/2407.08608)
- Tri Dao, [FlashAttention-3 blog post](https://tridao.me/blog/2024/flash3/)
- Tri Dao, [FlashAttention-4: Algorithm and Kernel Pipelining Co-Design for Asymmetric Hardware Scaling](https://tridao.me/blog/2026/flash4/)
- Dao-AILab, [flash-attention GitHub repository](https://github.com/Dao-AILab/flash-attention)
