---
title: "Distributed Training MOC"
date: 2026-05-20
lastmod: 2026-05-20
tags:
  - ai/distributed-training
  - type/moc
draft: false
---

## Summary

A central hub for strategies used to scale LLM training across multiple GPUs and nodes.
## Parallelism Strategies
- [Data Parallelism](/atlas/ai/distributed-training/parallelism/data-parallelism)
- [Tensor Parallelism](/atlas/ai/distributed-training/parallelism/tensor-parallelism)
- Pipeline Parallelism
- Context Parallelism

## Memory Optimizations
- [ZeRO](/atlas/ai/distributed-training/optimization/zero)
- Activation Recomputation
- Gradient Accumulation

## Hardware & Efficiency
- Compute Efficiency
- Communication Overhead
- [Roofline Model](/atlas/ai/deep-learning/roofline-model)
- [FP8 Training](/atlas/ai/deep-learning/fp8-training)

## Related
- [Transformers MOC](/atlas/ai/transformers-moc)
- AI MOC
