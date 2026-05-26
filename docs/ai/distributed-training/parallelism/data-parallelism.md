---
title: "Data Parallelism (DP)"
date: 2026-04-08
lastmod: 2026-04-08
tags:
  - ai/distributed-training
  - parallelism
draft: false
---

## Summary

A 1D parallelism strategy where each GPU holds a full replica of the model and optimizer states. It focuses on scaling the batch dimension by distributing micro-batches across workers.
## Concepts
- **All-Reduce:** The primary communication primitive in DP. It combines gradients from all GPUs (sum/average) and redistributes the result so every worker has the same updated gradient.
- **Gradient Bucketing:** A performance optimization where small parameter gradients are grouped into larger contiguous buffers (e.g., 25MB) to reduce communication overhead and latency.
- **Comm/Compute Overlap:** The practice of triggering gradient synchronization (All-Reduce) for a layer as soon as its backward pass is finished, while earlier layers are still computing.

## Content

### Implementation & Optimizations
In a naive implementation, GPUs wait for the entire backward pass to finish before syncing. Modern DP (like PyTorch DDP) uses **hooks** to overlap work:
- **Backward Hooks**: `register_post_accumulate_grad_hook` triggers a sync the moment a parameter gradient is ready.
- **`model.no_sync()`**: A critical decorator for **Gradient Accumulation**. It prevents expensive All-Reduce operations during intermediate micro-batches, performing the sync only on the final step.

### Scaling Law (Batch Size)
The "Sweet Spot" for LLM training is generally **4M to 60M tokens per global batch**. 
- **Small Batch**: Better convergence early on but low GPU throughput.
- **Large Batch**: High throughput but can lead to "noisy" gradients and slower convergence per token.

### Limitations
As the number of GPUs increases (512+), DP efficiency drops due to **Ring Latency**. The time required for a signal to propagate around the ring becomes a bottleneck, and communication can no longer be fully hidden behind computation.

## Related
- [Distributed Training MOC](/atlas/ai/distributed-training/distributed-training-moc)
- [ZeRO](/atlas/ai/distributed-training/optimization/zero)
- Gradient Accumulation
