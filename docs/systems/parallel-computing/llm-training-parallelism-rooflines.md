---
title: "LLM Training Parallelism Rooflines"
date: 2026-08-05
lastmod: 2026-08-05
tags:
  - distributed-training
  - parallelism
  - performance
  - roofline
draft: false
---

## Summary

Parallelism choices should be derived from what crosses the network and how much local computation can hide it. Data parallelism and FSDP move quantities proportional to **weights**; tensor parallelism moves quantities proportional to **activations**. Combining them balances those costs and often scales farther than either strategy alone.

## Variables

- $B$: global tokens processed per step (batch times sequence)
- $D$: model width
- $F$: FFN width
- $N$: total devices
- $X$: data/FSDP mesh size
- $Y$: tensor-parallel mesh size, with $N=XY$
- $C$: achieved device compute throughput in FLOPs/s
- $W$: achieved bandwidth for the relevant collective
- $M_X,M_Y$: effective numbers of independent physical links available to the $X$ and $Y$ collectives

These equations are order-of-magnitude rooflines. Constants depend on dtype, topology, collective algorithm, overlap, and whether attention/MLP details are retained.

## Data Parallelism and FSDP

Per-device compute falls with the local token count $B/X$, while gradient or parameter communication is proportional to model dimensions and does not shrink with batch. The compute-bound condition reduces to:

$$\frac{B}{X}>\frac{C}{W}.$$

Interpretation: local tokens per device must exceed the network's compute-to-bandwidth ratio. Adding DP ranks while keeping global batch fixed eventually exposes communication.

For FSDP/ZeRO-3, parameter AllGathers can be prefetched and gradient ReduceScatters can overlap backward compute. This gives a similar **phase roofline** to DP even though full-step byte accounting differs: a common implementation gathers parameters for forward and backward and reduce-scatters gradients, about $3M$ communicated per step versus about $2M$ for a ring AllReduce in replicated DP.

The statistical critical batch size is a separate limit. Increasing global batch may preserve systems efficiency while reducing optimization efficiency per token.

## Tensor Parallelism

Tensor parallelism shards the large matmuls but communicates activations at block boundaries. Its compute-bound condition is approximately:

$$Y<\frac{FW}{C}.$$

Unlike DP, the useful compute-to-communication ratio is controlled primarily by $F$, not batch. Larger FFNs permit a wider TP group; slower cross-node links reduce it.

The practical TP limit is therefore a roofline, not "one node" or "eight GPUs." Keeping TP inside a high-bandwidth scale-up domain is common because the bound is much more favorable there, but fast fabrics and sufficiently wide models can support cross-node TP.

## Mixed FSDP and Tensor Parallelism

Let $X$ shard batch/weights and $Y=N/X$ shard model dimensions. Increasing $X$:

- reduces per-device batch and worsens FSDP communication hiding;
- reduces TP activation volume because activations are already batch-sharded.

Increasing $Y$:

- shrinks FSDP weight-gather payloads because weights are tensor-sharded;
- widens the blocking TP collective group.

Balancing the two communication terms gives:

$$X_{opt}=\sqrt{\frac{B}{F}\frac{M_X}{M_Y}N},$$

with $Y_{opt}=N/X_{opt}$. Round to topology-compatible factors and benchmark neighboring layouts.

At this balance, the compute/communication ratio scales approximately as:

$$\frac{T_{math}}{T_{comm}}
\propto
\frac{\sqrt{BF}\sqrt{M_XM_Y}}{(C/W)\sqrt{N}}.$$

Mixed parallelism therefore improves only as $\sqrt{B}$ with batch and eventually becomes communication-bound as $\sqrt{N}$, but it covers an important regime where pure FSDP and pure TP each fail.

## Pipeline Parallelism

Pipeline parallelism sends activations between adjacent stages, usually much fewer bytes than frequent FSDP or TP collectives. Its dominant costs are instead:

- fill/drain bubbles;
- stage imbalance;
- activation memory from in-flight microbatches;
- scheduling complexity and communication latency;
- interaction between microbatch size and other parallel dimensions.

With $p$ stages and $m$ microbatches, a basic schedule has bubble fraction on the order of $(p-1)/m$. Pipeline parallelism is useful for spanning slow network boundaries, but only when $m$ is large enough and layers can be balanced.

FSDP complicates this: it wants enough tokens in each microbatch to hide parameter gathers, while PP often splits a fixed global batch into many small microbatches to suppress bubbles.

## Expert Parallelism

MoE expert parallelism routes activations with AllToAll. Relative to a dense FFN, total stored expert parameters grow with $E$, active compute grows with top-$k$, and communication remains activation-like. The compute available to hide routing grows roughly with $E/k$ for fixed per-expert width, but real efficiency depends on:

- token balance and capacity factor;
- dispatch/combine kernel efficiency;
- cross-node AllToAll bandwidth and contention;
- whether TP, DP, and EP share physical links.

Map EP to a topology with strong bisection bandwidth. A single-link bandwidth number does not describe an AllToAll fabric.

## Topology-Aware Recipe

1. Fix the global batch from optimization evidence, not device count.
2. Determine the minimum sharding needed for parameters, optimizer states, activations, and temporary buffers.
3. Put blocking TP collectives on the fastest scale-up links.
4. Use FSDP/DP across the largest axis that still satisfies $B/X>C/W$.
5. Use PP to cross slower boundaries when activation transfers are cheaper than collectives and bubbles are controlled.
6. Place EP where AllToAll bisection bandwidth and routing balance are acceptable.
7. Recompute with achieved bandwidth, utilization, topology factors, and overlap from traces.

## Sources

- [JAX Scaling Book: Training](https://jax-ml.github.io/scaling-book/training/)
- [JAX Scaling Book: Sharding](https://jax-ml.github.io/scaling-book/sharding/)
- [JAX Scaling Book: Transformers](https://jax-ml.github.io/scaling-book/transformers/)

## Related

- [Data Parallelism](/atlas/systems/parallel-computing/data-parallelism)
- [Tensor Parallelism](/atlas/systems/parallel-computing/tensor-parallelism)
- [Pipeline Parallelism](/atlas/systems/parallel-computing/pipeline-parallelism)
- [Hardware Topology & Parallelism](/atlas/systems/parallel-computing/hardware-topology-and-parallelism)
- [Sharded Matrix Multiplication and Collectives](/atlas/systems/parallel-computing/sharded-matrix-multiplication-and-collectives)
