---
title: "LLM Inference Economics"
date: 2026-04-20
lastmod: 2026-08-05
tags:
  - ai/serving
  - economics
  - optimization
  - hardware
draft: false
---

## Summary

LLM serving cost is a constrained latency-throughput problem. Decode must load weights and per-request KV state while performing serial token steps; batching amortizes weights but not KV caches. The cheapest topology is therefore not always the smallest one that fits the weights.

## Decode Step Model

Let:

- $B$: active decode sequences;
- $P$: active parameters touched per token;
- $M_w$: stored weight bytes;
- $M_{KV}$: attended KV bytes for one sequence;
- $C$: aggregate achieved FLOPs/s;
- $W_{HBM}$: aggregate achieved HBM bandwidth.

A useful lower-bound model is:

$$T_{step}\gtrsim
\frac{BM_{KV}}{W_{HBM}}
+\max\left(\frac{2BP}{C},\frac{M_w}{W_{HBM}}\right).$$

The first term is separate because every sequence owns different KVs. The max captures overlap between matmul compute and loading weights. Real time also includes collectives, sampling, cache updates, launch overhead, imbalance, and scheduling.

## Critical Batch Size

Ignoring KV traffic, decode becomes compute-bound when:

$$\frac{2BP}{C}>\frac{M_w}{W_{HBM}}.$$

If parameter and activation arithmetic widths differ, define:

$$\beta=\frac{\text{weight bytes per parameter}}
{\text{activation bytes per element}},$$

then the approximate critical batch is:

$$B_{crit}\approx\beta\frac{C}{W_{HBM}}.$$

This replaces fixed heuristics such as "$B\approx300$ times sparsity." $B_{crit}$ changes with hardware, precision, kernels, and quantization. It is a roofline transition, not automatically the economically optimal batch.

Larger batches improve weight reuse but increase queueing, KV memory, and KV bandwidth. Once KV reads dominate, throughput gains diminish even before compute saturation.

## Prefill Versus Decode

Prefill exposes many prompt tokens to large GEMMs and is often compute-bound. Decode exposes one new token per sequence and is often memory-bound. These are tendencies, not guarantees:

- short or batch-1 prefill may have small inefficient GEMMs;
- long-context prefill adds quadratic attention work;
- large-batch decode can make linear layers compute-bound;
- long-context decode can remain KV-bandwidth-bound at every useful batch.

This distinction explains why output tokens often cost more, but a universal multiplier such as 5x should not be treated as a law or inferred from public API prices.

## Sharding for Generation

Generation should keep weights and KV caches stationary and move the smaller activations.

- FSDP-style just-in-time weight gathering is generally disastrous for decode because network bandwidth is far below HBM bandwidth.
- Tensor/model parallelism shards weights permanently and communicates activations.
- KV heads can be sharded across model-parallel ranks; batch or sequence sharding extends this when $H_{kv}$ is small.
- Pipeline parallelism helps weight capacity, but enough concurrent sequences are needed to fill stages.

Always verify the deployed runtime did not inherit a training-oriented FSDP layout.

## Why the Smallest Fitting Topology May Cost More

A minimal device group can fit weights while leaving too little memory for a useful decode batch. A larger group can:

- provide more aggregate HBM bandwidth;
- shard weights and KV caches more finely;
- fit more concurrent sequences;
- move linear layers toward the compute roofline;
- lower latency enough to reduce required replicas.

Compare cost per accepted output token at the target TTFT/TPOT SLO, not devices per replica in isolation.

## Capacity Planning

For each candidate topology:

1. subtract weights, runtime buffers, fragmentation reserve, and graph/workspace memory from HBM;
2. divide remaining capacity by KV bytes per sequence at the workload's context distribution;
3. calculate step time from KV bytes, weight bytes, FLOPs, and collectives;
4. convert to tokens/s and requests/s using output-length distribution;
5. include queueing and tail-latency constraints;
6. price replicas needed at peak load and realistic utilization.

Use distributions, not only means: a small number of long contexts can dominate cache occupancy and tail latency.

## Sources

- [JAX Scaling Book: Inference](https://jax-ml.github.io/scaling-book/inference/)
- [JAX Scaling Book: Applied Inference](https://jax-ml.github.io/scaling-book/applied-inference/)
- [JAX Scaling Book: Roofline](https://jax-ml.github.io/scaling-book/roofline/)

## Related

- [KV Cache](/atlas/ai/inference-serving/caching/kv-cache)
- [Roofline Model](/atlas/systems/performance/roofline-model)
- [Disaggregated Prefill-Decode Serving](/atlas/ai/inference-serving/serving-architectures/disaggregated-prefill-decode-serving)
