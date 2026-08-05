---
title: "Sharded Matrix Multiplication and Collectives"
date: 2026-08-05
lastmod: 2026-08-05
tags:
  - distributed-training
  - parallelism
  - collectives
  - sharding
draft: false
---

## Summary

Distributed transformer performance becomes much easier to reason about when every tensor has both a **global shape** and a **layout over a named device mesh**. For a matrix multiplication, communication is determined by whether mesh axes shard batching, contracting, or non-contracting dimensions. The operation name—data, tensor, sequence, or expert parallelism—is secondary.

## Notation

For

$$C[I,K] = A[I,J]B[J,K],$$

$J$ is the **contracting** dimension and $I,K$ are **non-contracting** dimensions. A shared dimension retained in the output would be a **batching** dimension.

Use a subscript to show sharding over a named mesh axis $X$:

- $A[I_X,J]$: $I$ is partitioned over $X$;
- $A[I,J_X]$: $J$ is partitioned over $X$;
- no subscript: replicated over $X$.

The global shape does not change. On an $X$-device axis, $A[I_X,J]$ has local shape $[I/X,J]$.

An intermediate such as $C[I,K]\{U_X\}$ is an **unreduced partial sum**: each device holds a contribution, but the values still need to be summed over $X$.

## The Four Matmul Cases

### 1. No contracting dimension is sharded

$$A[I_X,J]B[J,K_Y] \rightarrow C[I_X,K_Y]$$

Each device owns the inputs needed for its output tile. No collective is required.

### 2. Only one input is sharded on the contracting dimension

$$A[I,J_X]B[J,K]$$

The direct implementation gathers $A$ first:

$$A[I,J_X] \xrightarrow{\operatorname{AllGather}_X} A[I,J],$$

then performs the local matmul. An alternative is to slice the replicated input consistently, compute partial outputs, and reduce them. Choose by comparing the gathered-input bytes with the reduced-output bytes—not by memorizing a parallelism label.

### 3. Both contracting dimensions are identically sharded

$$A[I,J_X]B[J_X,K] \rightarrow C[I,K]\{U_X\}.$$

Each device computes its local contribution with $1/X$ of the full matmul FLOPs. The output then needs:

- an **AllReduce** if every device needs the full result; or
- a **ReduceScatter** if the next operation can consume a sharded result.

Deferring replication is usually preferable. A ReduceScatter both resolves the partial sum and introduces useful output sharding.

### 4. The same mesh axis shards both non-contracting dimensions

$$A[I_X,J]B[J,K_X]$$

This layout is not directly computable: device $x$ owns only the $(x,x)$ output tile, while the complete output needs every $(i,k)$ pairing. Gather one input, or change one layout with an AllToAll, before multiplying.

## Collectives as Layout Transformations

| Collective | Layout effect | Typical use |
| --- | --- | --- |
| AllGather | $[A_X,B]\rightarrow[A,B]$ | remove sharding by replicating shards |
| ReduceScatter | $[A,B]\{U_X\}\rightarrow[A_X,B]$ | sum partial values and leave the result sharded |
| AllReduce | $[A,B]\{U_X\}\rightarrow[A,B]$ | sum partial values and replicate the result |
| AllToAll | $[A,B_X]\rightarrow[A_X,B]$ | move a mesh axis from one tensor dimension to another |

An AllReduce is commonly implemented as ReduceScatter followed by AllGather. This is why retaining the ReduceScatter output can avoid needless replication.

In reverse-mode autodiff, AllGather and ReduceScatter are transposes:

$$\operatorname{AllGather}^{T}=\operatorname{ReduceScatter}, \qquad
\operatorname{ReduceScatter}^{T}=\operatorname{AllGather}.$$

This predicts many backward-pass collectives directly from the forward layout.

## Communication Cost

For payload $V$, $p$ devices, and effective unidirectional ring bandwidth $W$:

$$T_{AG} \approx T_{RS} \approx \frac{V}{W}\frac{p-1}{p},$$

$$T_{AR} \approx 2T_{AG}.$$

These are bandwidth-regime approximations. A more complete model is:

$$T_{collective} \approx n_{phases}\alpha + \frac{V_{link}}{W_{achieved}},$$

where $\alpha$ is per-phase latency. Small tensors can therefore be latency-bound, and large tensors bandwidth-bound. Use achieved collective bandwidth for the actual topology; advertised link bandwidth is not enough.

On a bidirectional ring, an ideal AllToAll can move fewer link-bytes than an AllGather, but the exact ratio is topology- and implementation-dependent. Do not carry the book's idealized $1/4$ ratio over to arbitrary GPU clusters without measurement.

## Collective Matmul Overlap

A collective need not be a monolithic barrier. Partition an operand into tiles, begin the matmul as each tile arrives, and pipeline communication with computation. This **collective matmul** approach matters when:

- the collective and GEMM use independent resources;
- tiles are large enough for efficient GEMMs;
- there is enough compute per arriving byte to hide the link;
- dependencies and buffer lifetimes permit double buffering.

The roofline question is not merely "how many bytes move?" but "how much of that movement remains on the critical path?"

## Practical Design Procedure

1. Write every important activation and weight with its global dimensions.
2. Assign named mesh axes to dimensions and derive local shapes.
3. Mark contracting, batching, and non-contracting dimensions for each einsum.
4. Apply the four cases above to predict required collectives.
5. Keep partial or sharded outputs when the next operator accepts them.
6. Estimate both bandwidth time and collective latency.
7. Map frequent blocking collectives to the fastest physical links.
8. Validate the compiler/runtime result in a communication trace; an innocent reshard can introduce a hidden collective.

## Sources

- [JAX Scaling Book: Sharding](https://jax-ml.github.io/scaling-book/sharding/)
- [JAX Scaling Book: Training](https://jax-ml.github.io/scaling-book/training/)
- [JAX Scaling Book: GPUs](https://jax-ml.github.io/scaling-book/gpus/)

## Related

- [Tensor Parallelism](/atlas/systems/parallel-computing/tensor-parallelism)
- [Data Parallelism](/atlas/systems/parallel-computing/data-parallelism)
- [Low-Latency GPU Collectives](/atlas/systems/parallel-computing/low-latency-gpu-collectives)
- [Roofline Model](/atlas/systems/performance/roofline-model)
