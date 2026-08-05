---
title: "Tensor Parallelism (TP)"
date: 2026-04-08
lastmod: 2026-08-05
tags:
  - ai/distributed-training
  - parallelism
draft: false
---

## Summary

Tensor parallelism shards individual transformer matmuls across devices. The standard Megatron pattern deliberately keeps the intermediate activation sharded between paired projections: the column-parallel projection does **not** immediately require an AllGather. Communication occurs at the block boundary through AllReduce, or through AllGather + ReduceScatter when combined with sequence parallelism.

## Column and Row Parallel Linear Layers

For $Y=XW$:

### Column-parallel projection

Shard the output dimension of $W$:

$$W=[W_1,\ldots,W_p], \qquad Y_i=XW_i.$$

Each rank produces a shard $Y_i$. An AllGather is required only if the next operation needs the complete $Y$. In a transformer, the following activation and row-parallel projection operate directly on the shard, so gathering here would waste bandwidth and memory.

### Row-parallel projection

Shard the input dimension:

$$X=[X_1,\ldots,X_p], \qquad
W=\begin{bmatrix}W_1\\ \vdots\\ W_p\end{bmatrix}.$$

Each rank forms a partial result $Z_i=X_iW_i$ and the full result is:

$$Z=\sum_i Z_i.$$

This requires AllReduce if $Z$ is replicated, or ReduceScatter if the following operations can consume sequence-sharded activations.

## Transformer Block Sharding

### MLP

1. shard the gate/up projection on FFN outputs;
2. apply SwiGLU or the nonlinearity locally;
3. shard the down projection on FFN inputs;
4. reduce partial outputs before the residual path.

This fuses two large matmuls into one communication region rather than gathering after the first projection.

### Attention

Shard Q, K, and V projections by heads and the output projection by input rows. Each rank computes its local heads independently, then reduces the output-projection partials. GQA can limit head-wise TP because there may be fewer KV heads than ranks; implementations may replicate KV heads or introduce another sharding dimension.

## Sequence Parallelism

Classic TP replicates block-boundary activations. Sequence parallelism instead shards those activations over tokens and uses:

1. AllGather before the first projection;
2. local column-parallel and row-parallel matmuls;
3. ReduceScatter after the second projection.

Elementwise operations such as normalization, dropout, and residual work then run on sequence shards, reducing activation memory. AllGather and ReduceScatter together have roughly the bandwidth cost of one AllReduce, although latency, overlap, and implementation details still matter.

## The TP Roofline

TP performs frequent, often blocking, activation collectives. Let $F$ be FFN width, $W$ achieved interconnect bandwidth, $C$ achieved device FLOPs/s, and $p$ TP degree. A useful approximate compute-bound condition is:

$$p<\frac{FW}{C}.$$

There is no universal eight-GPU limit. TP is commonly kept within an NVLink/NVSwitch domain because its $W$ is much higher than scale-out bandwidth, but the valid degree depends on width, dtype, topology, collective kernels, and overlap. Measure neighboring degrees; more TP can lower latency or solve memory capacity even after it stops improving throughput.

## Failure Modes

- gathering the column-parallel output immediately;
- mapping TP across oversubscribed links while a less frequent parallel dimension occupies NVLink;
- using tiny local GEMMs that fall off the compute roofline;
- assuming advertised link bandwidth equals collective bandwidth;
- ignoring GQA/MQA constraints when sharding attention heads;
- allowing hidden reshard operations between compiler regions.

## Sources

- [Megatron-LM: Training Multi-Billion Parameter Language Models Using Model Parallelism](https://arxiv.org/abs/1909.08053)
- [Reducing Activation Recomputation in Large Transformer Models](https://arxiv.org/abs/2205.05198)
- [JAX Scaling Book: Training](https://jax-ml.github.io/scaling-book/training/)
- [JAX Scaling Book: Sharding](https://jax-ml.github.io/scaling-book/sharding/)

## Related

- [Sequence Parallelism](/atlas/systems/parallel-computing/sequence-parallelism)
- [Pipeline Parallelism](/atlas/systems/parallel-computing/pipeline-parallelism)
- [LLM Training Parallelism Rooflines](/atlas/systems/parallel-computing/llm-training-parallelism-rooflines)
- [Sharded Matrix Multiplication and Collectives](/atlas/systems/parallel-computing/sharded-matrix-multiplication-and-collectives)
