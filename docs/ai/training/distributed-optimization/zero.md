---
title: "ZeRO (Zero Redundancy Optimizer)"
date: 2026-04-08
lastmod: 2026-08-05
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

The second statement is **full-step byte accounting** for the common schedule: one parameter AllGather for forward, one for backward, and one gradient ReduceScatter. Replicated DP uses a gradient AllReduce, approximately $2\times$ the gradient payload on a ring.

You may also see the claim that FSDP has the "same communication cost" as DP. In roofline analysis this means that, within a corresponding forward or backward phase, an AllGather plus ReduceScatter has the same communication-to-compute ratio as an AllReduce. It does not make the extra forward parameter gather disappear from total bytes. Both statements can be correct if their accounting boundary is explicit.

### Prefetching
To hide the latency of ZeRO-3, systems use **Prefetching**: while Layer $N$ is computing, the system is already performing an `all-gather` for the weights of Layer $N+1$.

The approximate compute-bound condition is:

$$\frac{B}{X}>\frac{C}{W},$$

where $B/X$ is local tokens per FSDP rank, $C$ is achieved device FLOPs/s, and $W$ is achieved collective bandwidth. Prefetching changes how much communication lies on the critical path, but cannot rescue a layout with too little local work or insufficient buffer memory.

## Sources

- [ZeRO](https://arxiv.org/abs/1910.02054)
- [JAX Scaling Book: Training](https://jax-ml.github.io/scaling-book/training/)

## Related
- Distributed Training MOC
- [Data Parallelism](/atlas/systems/parallel-computing/data-parallelism)
- [LLM Training Parallelism Rooflines](/atlas/systems/parallel-computing/llm-training-parallelism-rooflines)
- PyTorch FSDP
