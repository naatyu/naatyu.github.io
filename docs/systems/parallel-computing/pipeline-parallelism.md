---
title: "Pipeline Parallelism (PP)"
date: 2026-04-08
lastmod: 2026-08-05
tags:
  - ai/distributed-training
  - parallelism
draft: false
---

## Summary

Pipeline parallelism assigns consecutive model layers to stages and passes activations and activation gradients between them. Those transfers are usually cheap relative to weight or tensor collectives. Its real costs are bubbles, stage imbalance, in-flight activation memory, and schedule complexity.

## Why Use It

- the model does not fit within one scale-up domain;
- slow links make frequent TP/FSDP collectives unattractive;
- layer boundaries offer much smaller point-to-point messages;
- additional stages reduce per-device parameter and optimizer memory.

PP is primarily a capacity and topology tool. It does not automatically improve single-request latency.

## Schedules

### GPipe / all-forward-all-backward

Run all microbatch forwards, then all backwards. It is simple but retains many activation sets and has high peak memory.

### 1F1B

After warmup, each stage alternates one forward and one backward microbatch. This bounds the number of live activations more tightly.

### Interleaved 1F1B

Assign multiple non-contiguous model chunks to each physical stage. If each rank has $v$ virtual stages, the bubble can fall by roughly $1/v$, at the cost of more point-to-point transfers and a more complex schedule.

### Zero-bubble schedules

Split backward into activation-gradient and weight-gradient work, then schedule the less urgent weight-gradient work into otherwise idle slots. These schedules reduce bubbles but add dependencies, buffers, and implementation constraints; "zero bubble" does not mean zero communication or perfect balance.

## Bubble and Efficiency

For $p$ stages and $m$ microbatches, a simple pipeline's bubble overhead is approximately:

$$\frac{p-1}{m}.$$

The corresponding idealized utilization is:

$$U\approx\frac{m}{m+p-1}.$$

Thus $m\gg p$ is desirable. However, with fixed global batch, more microbatches means fewer tokens per microbatch. Tiny GEMMs lose accelerator efficiency and may make FSDP parameter gathers impossible to hide.

## Stage Balance

Pipeline throughput is set by the slowest stage. Equal layer counts are not necessarily balanced because embedding/output layers, attention variants, MoE layers, and recomputation costs differ.

For stage times $t_i$, steady-state throughput is limited by $\max_i t_i$. Profile stage compute, communication, and memory rather than partitioning only by parameter count.

## Communication

At a boundary, PP moves an activation tensor in forward and its gradient in backward. This is typically proportional to microbatch tokens times model width—not model parameter count. It can therefore be a good way to cross scale-out links.

But point-to-point latency matters when microbatches are small, and interleaving increases message frequency. Transfers should be asynchronous and scheduled against independent stage compute.

## Interaction with Other Dimensions

- **TP:** keep blocking intra-layer collectives within fast scale-up domains; place PP boundaries between domains.
- **FSDP/DP:** replicate or shard pipeline replicas across another mesh axis. Check that each microbatch has enough local tokens to hide gathers/reductions.
- **Sequence parallelism:** boundary layouts must agree or an implicit reshard appears.
- **MoE:** expert imbalance can become stage imbalance; routing traffic may compete with PP transfers.

## Inference Caveat

PP shards weights, but each stage still stores the KV cache for its own layers. Keeping all stages busy requires multiple sequences or microbatches in flight. It helps weight capacity, yet does not make KV-cache cost disappear; latency and cache capacity must be modeled separately.

## Sources

- [GPipe](https://arxiv.org/abs/1811.06965)
- [PipeDream](https://arxiv.org/abs/1806.03377)
- [JAX Scaling Book: Training](https://jax-ml.github.io/scaling-book/training/)

## Related

- [Tensor Parallelism](/atlas/systems/parallel-computing/tensor-parallelism)
- [LLM Training Parallelism Rooflines](/atlas/systems/parallel-computing/llm-training-parallelism-rooflines)
- [Hardware Topology & Parallelism](/atlas/systems/parallel-computing/hardware-topology-and-parallelism)
