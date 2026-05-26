---
title: "Pipeline Parallelism (PP)"
date: 2026-04-08
lastmod: 2026-04-08
tags:
  - ai/distributed-training
  - parallelism
draft: false
---

## Summary

A strategy that shards a model's layers across multiple GPUs. It is used to scale model size when a model's parameters exceed the memory capacity of a single GPU.
## Concepts
- **1F1B (One Forward, One Backward):** A scheduling strategy that starts backward passes as soon as possible to minimize the peak memory needed for activations.
- **Interleaved Pipeline:** Splitting a model into smaller chunks and assigning multiple non-contiguous stages to each GPU (e.g., GPU1 handles layers 1-2 and 9-10).
- **Bubble:** The idle time at the beginning and end of a pipeline step where GPUs are waiting for data from other stages.

## Content

### Scheduling & The Bubble
The efficiency of PP is determined by the size of the "Bubble" ($t_{bubble}$).
- **AFAB (All Forward, All Backward)**: A naive approach where all forward passes are finished before starting backward passes. This results in high peak activation memory.
- **1F1B**: Once the pipeline is "full," every GPU performs one forward pass followed by one backward pass. This keeps memory constant.
- **Bubble Ratio**: The bubble time is approximately $(p-1)/m$, where $p$ is the number of pipeline stages and $m$ is the number of micro-batches. To reduce the bubble, $m$ must be significantly larger than $p$.

### Interleaved Stages
By using **interleaved stages**, the pipeline can be shortened conceptually, reducing the bubble size by roughly $1/v$ (where $v$ is the number of interleaved chunks). However, this increases communication frequency between nodes.

### Zero-Bubble Strategies (DualPipe)
Advanced pipelines, like **DeepSeek's DualPipe**, further reduce idle time by overlapping the backward pass for activations with the backward pass for weights, effectively hiding the weight gradient computation.

## Related
- Distributed Training MOC
- [Tensor Parallelism](/atlas/ai/distributed-training/parallelism/tensor-parallelism)
- Activation Recomputation
