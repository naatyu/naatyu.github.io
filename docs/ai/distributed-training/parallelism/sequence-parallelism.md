---
title: "Sequence Parallelism (SP)"
date: 2026-04-08
lastmod: 2026-04-08
tags:
  - ai/distributed-training
  - parallelism
draft: false
---

## Summary

A specific form of parallelism that shards activations along the sequence dimension for modules not covered by Tensor Parallelism, such as LayerNorm and Dropout.
## Concepts
- **Sequence Dimension:** The dimension representing the number of tokens ($S$) in a batch.
- **Reduce-Scatter / All-Gather:** The communication primitives used when transitioning between SP (sharded sequence) and TP (sharded hidden dimension).

## Content

### Why SP is needed
Tensor Parallelism (TP) shards the MLP and Attention blocks, but standard implementations still gather the full activations before **LayerNorm** or **Dropout** to compute statistics across the hidden dimension. For long sequences, these full activations can cause OOM.

### SP Workflow
SP shards the activations $X$ along the sequence dimension ($s/tp$):
1.  **Before Attention/MLP**: An `All-Gather` is performed to get the full hidden dimension for the column-parallel linear layer.
2.  **After Attention/MLP**: A `Reduce-Scatter` is performed along the sequence dimension instead of a standard `All-Reduce`.
3.  **LayerNorm/Dropout**: Computed locally on the sharded sequence dimension.

### Memory & Comm Trade-offs
- **Memory**: Drastically reduces activation memory for non-linear layers from $B \times S \times H$ to $(B \times S \times H) / TP$.
- **Communication**: SP performs two communication ops (`all-gather` and `reduce-scatter`) instead of one `all-reduce`. While the volume is technically identical, the extra synchronization points can introduce latency.

## Related
- Distributed Training MOC
- [Tensor Parallelism](/atlas/ai/distributed-training/parallelism/tensor-parallelism)
- [Context Parallelism](/atlas/ai/distributed-training/parallelism/context-parallelism)
