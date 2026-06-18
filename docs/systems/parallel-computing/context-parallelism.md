---
title: "Context Parallelism (CP)"
date: 2026-04-08
lastmod: 2026-06-18
tags:
  - ai/distributed-training
  - parallelism
draft: false
---

## Summary

A strategy that shards the input sequence across multiple GPUs. It is essential for training models with ultra-long context lengths (e.g., 100k+ tokens).
## Concepts
- **Ring Attention:** A communication technique where GPUs exchange K and V values in a ring-like fashion to compute full self-attention without gathering the entire sequence on one GPU.
- **Zig-Zag Ring Attention:** An optimization that reorders sequence chunks across GPUs to better balance the computational load in causal attention.
- **Asynchronous Send/Recv:** Used in Ring Attention to overlap the transmission of KV chunks with the local attention computation.

## Content

### Ring Attention Mechanism
Because every token in self-attention needs to "see" every other token, splitting the sequence normally creates a communication bottleneck. Ring Attention solves this:
1.  GPU $i$ computes attention using its local $Q$ and its local $K, V$.
2.  GPU $i$ sends its $K, V$ to GPU $i+1$ and receives $K, V$ from GPU $i-1$.
3.  The process repeats until every GPU has seen the $K, V$ from all other GPUs.

### Load Balancing (Zig-Zag)
In **Causal Attention** (standard for LLMs), the attention matrix is lower-triangular. This means GPU1 (first tokens) has less work than GPU8 (last tokens). 
- **Zig-Zag** reorders the blocks (e.g., GPU1 gets block 1 and block 16) so that the total number of attention computations is roughly equal across all GPUs in the CP group.

### Memory Benefits
Unlike Tensor Parallelism, CP scales well to many nodes because it only involves exchanging KV chunks rather than weight gradients. It is the primary tool for breaking the memory wall for long sequences.

## Related
- Distributed Training MOC
- [Sequence Parallelism](/atlas/systems/parallel-computing/sequence-parallelism)
- [FlashAttention](/atlas/ai/architectures/transformers/flashattention)
