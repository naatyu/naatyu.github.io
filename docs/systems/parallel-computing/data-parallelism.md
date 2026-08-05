---
title: "Data Parallelism (DP)"
date: 2026-04-08
lastmod: 2026-08-05
tags:
  - ai/distributed-training
  - parallelism
draft: false
---

## Summary

Data parallelism replicates the model on every worker, partitions the token batch, and synchronizes gradients. It is the simplest way to scale throughput while the model and optimizer fit per device. Its limit is set by local tokens per device, collective bandwidth/latency, memory duplication, and the statistically useful global batch—not by a universal GPU-count threshold.

## One Training Step

For $X$ workers and global token batch $B$:

1. every worker runs forward and backward on $B/X$ tokens;
2. gradients are summed or averaged with AllReduce;
3. each worker applies the same optimizer update to its replica.

If each rank starts from identical states and processes disjoint examples, the synchronized update is mathematically equivalent to single-device training on the global batch, apart from floating-point order and stochastic details.

## Communication

A ring AllReduce can be decomposed into ReduceScatter followed by AllGather. For gradient payload $M$ bytes, $X$ ranks, and achieved ring bandwidth $W$:

$$T_{AR}\approx \frac{2M}{W}\frac{X-1}{X}.$$

For large messages, this approaches $2M/W$ rather than growing linearly with $X$. The common claim that DP necessarily collapses beyond a fixed count such as 512 because a signal travels around the ring is therefore misleading. Real degradation comes from some combination of:

- less compute per rank at fixed global batch;
- collective startup latency for many small buckets;
- oversubscribed or hierarchical network topology;
- reduced achieved bandwidth and contention;
- communication that cannot overlap useful backward compute;
- stragglers.

### Communication roofline

Let $C$ be achieved device FLOPs/s and $W$ achieved collective bandwidth. Up to architecture-dependent constants, DP remains compute-bound when:

$$\frac{B}{X}>\frac{C}{W}.$$

The left side is local tokens per device. Strong-scaling a fixed batch eventually violates this condition; increasing global batch restores systems efficiency but may hurt sample efficiency.

## Implementation Optimizations

### Gradient bucketing

Group many small gradients into large contiguous buffers. Larger buckets amortize collective latency; smaller buckets become ready sooner and offer more overlap. The best size is empirical.

### Backward overlap

Launch a bucket's AllReduce as soon as all gradients in it are ready while autograd computes earlier layers. PyTorch DDP uses autograd hooks for this. A trace should show collective work running concurrently with backward kernels rather than after them.

### Gradient accumulation

With $a$ local microbatches before an optimizer step, synchronize only the last backward pass. In PyTorch DDP, wrap intermediate passes with `model.no_sync()`. Otherwise the same effective batch pays $a$ AllReduces.

### Hierarchical collectives

On multi-node GPU systems, reduce within each NVLink/NVSwitch domain, exchange across nodes, then broadcast locally. The library often selects this automatically, but topology and environment configuration determine whether it is effective.

## Batch Size: Two Different Constraints

Do not use a universal "4M–60M tokens" sweet spot. The useful batch depends on model scale, data distribution, optimizer, learning-rate schedule, training phase, and objective.

- **Systems minimum:** enough local work to hide communication and run efficient kernels.
- **Optimization maximum:** beyond the critical batch, additional examples provide diminishing reduction in gradient noise, and can reduce progress per token or destabilize training.

Choose the global batch from optimization experiments or scaling-law evidence, then choose DP degree subject to the communication roofline. Do not increase batch solely to occupy more hardware without pricing the extra tokens.

## When to Move Beyond Replicated DP

Use ZeRO/FSDP when optimizer, gradient, or parameter replication dominates memory. Add tensor parallelism when local matmuls or memory still do not fit, or the fixed global batch leaves too little work per DP rank. Add pipeline parallelism when layer placement across slower network domains is preferable to frequent collectives.

## Sources

- [JAX Scaling Book: Training](https://jax-ml.github.io/scaling-book/training/)
- [PyTorch DistributedDataParallel documentation](https://docs.pytorch.org/docs/stable/generated/torch.nn.parallel.DistributedDataParallel.html)

## Related

- [ZeRO](/atlas/ai/training/distributed-optimization/zero)
- [LLM Training Parallelism Rooflines](/atlas/systems/parallel-computing/llm-training-parallelism-rooflines)
- [Sharded Matrix Multiplication and Collectives](/atlas/systems/parallel-computing/sharded-matrix-multiplication-and-collectives)
