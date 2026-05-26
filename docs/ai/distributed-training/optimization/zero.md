---
title: "ZeRO (Zero Redundancy Optimizer)"
date: 2026-04-08
lastmod: 2026-04-08
tags:
  - ai/distributed-training
  - optimization
draft: false
---

## Summary

A memory optimization suite that eliminates the redundancy of vanilla Data Parallelism by sharding the "OSG" (Optimizer states, Gradients, and Parameters) across the DP group.
## Concepts
- **Reduce-Scatter:** Used in ZeRO-2 to sync gradients. Instead of every GPU getting the full averaged gradient, each GPU only receives the part it is responsible for updating.
- **All-Gather:** Used in ZeRO-3 (FSDP) to retrieve sharded parameters from other GPUs just-in-time for forward or backward computation.
- **FSDP (Fully Sharded Data Parallel):** The PyTorch implementation of ZeRO-3.

## Content

### ZeRO Stages
1.  **ZeRO-1 (Optimizer State Sharding)**: Only shards the Adam optimizer states (moments). Since these take up the most memory (12 bytes per parameter in FP32 Adam), this provides significant savings.
2.  **ZeRO-2 (Gradient Sharding)**: Adds gradient sharding. During backward, a `reduce-scatter` is performed instead of `all-reduce`. Each rank only keeps $1/N$ of the gradients. Total communication volume remains the same as vanilla DP.
3.  **ZeRO-3 (Parameter Sharding)**: Shards the actual model weights. This is the most aggressive stage. Weights are gathered via `all-gather` before a layer's computation and discarded immediately after.

### Communication Trade-offs
- **ZeRO-1/2**: Communication overhead is identical to vanilla Data Parallelism ($2 \times$ model size).
- **ZeRO-3**: Increases communication volume by $50\%$ ($3 \times$ model size) because parameters must be gathered twice (forward and backward).

### Prefetching
To hide the latency of ZeRO-3, systems use **Prefetching**: while Layer $N$ is computing, the system is already performing an `all-gather` for the weights of Layer $N+1$.

## Related
- [Distributed Training MOC](/atlas/ai/distributed-training/distributed-training-moc)
- [Data Parallelism](/atlas/ai/distributed-training/parallelism/data-parallelism)
- PyTorch FSDP
