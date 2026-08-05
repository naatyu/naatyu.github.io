---
title: "Disaggregated Prefill-Decode Serving"
date: 2026-04-20
lastmod: 2026-08-05
tags:
  - ai/deep-learning
  - cs/system-design
  - llm
  - serving
  - optimization
draft: false
---

## Summary

Disaggregated serving places prefill and decode on separate worker pools. It isolates their different latency and hardware requirements and allows independent scaling, but pays queueing and a KV-cache transfer before decode. It is valuable when interference or specialization gains exceed that handoff cost—not a universal replacement for colocated serving.

## Two Workloads

| Property | Prefill | Decode |
| --- | --- | --- |
| Unit of work | prompt tokens, processed in parallel | one new token per active sequence |
| Common bottleneck | compute and long-context attention | weight and KV memory bandwidth |
| Primary SLO effect | time to first token (TTFT) | time per output token (TPOT) |
| State produced/consumed | creates KV cache | reads and extends KV cache |

Short or batch-1 prefill can be underutilized rather than cleanly compute-bound. Large-batch decode can make its linear layers compute-bound, while attention remains KV-bandwidth-heavy. Size pools from traces, not labels alone.

## Deployment Patterns

### Colocated continuous batching

The same replicas perform both phases. This avoids network KV transfer and duplicates only one set of weights, but large prefills can interrupt decode cadence unless scheduling carefully chunks them.

### Interleaved serving

One engine alternates prefill work with decode steps, often admitting a new prefill when a decode slot opens. It preserves locality and can give high bulk throughput. Chunked prefill bounds how long decoding is delayed.

### Disaggregated serving

Prefill workers create a cache, transfer it to a decode worker, and decode workers insert it into a continuous batch. Benefits include:

- isolation of prefill bursts from TPOT;
- different parallelism degrees or hardware for each phase;
- independent pool scaling;
- more prefill-side memory available for history/prefix caching;
- steadier decode batches.

Costs include a second weight replica, network transfer, orchestration, failure handling, and an extra queue.

## KV Transfer

If the produced cache has $M_{KV,prompt}$ bytes and achieved transfer bandwidth is $W_{net}$:

$$T_{transfer}\gtrsim\frac{M_{KV,prompt}}{W_{net}}+T_{setup}.$$

TTFT becomes:

$$TTFT=T_{queue,p}+T_{prefill}+T_{transfer}+T_{queue,d}+T_{first\ decode}.$$

Mitigations:

- stream each layer's cache while later layers are still computing;
- use direct device-to-device transfer and topology-aware placement;
- reduce cache through GQA, local attention, or quantization;
- reserve decode insertion capacity to avoid a second long queue;
- colocate when prompts are too short for specialization to repay transfer.

## Pool-Ratio Estimate

Let:

- $N_p,N_d$: prefill and decode workers;
- $T_p$: mean service time per prefill request on one prefill worker;
- $T_d$: decode step time;
- $B_d$: active decode batch;
- $L_d$: mean generated tokens per request.

Prefill completion capacity is $N_p/T_p$. Decode completes approximately $B_dN_d/(T_dL_d)$ requests/s. Balanced saturation requires:

$$\frac{N_p}{T_p}\approx\frac{B_dN_d}{T_dL_d}.$$

This is only a starting point. Production sizing must include prompt/output distributions, prefix hits, admission policy, transfer overlap, failures, and tail SLO headroom.

## Prefix and History Caching

Repeated prefixes can avoid most prefill compute. A practical design stores KV blocks in a trie/radix tree, shares common prefixes, and evicts with an LRU-like policy.

- **Affinity routing** sends follow-up turns to a worker holding their cache, improving hit rate but constraining load balancing.
- **Host-memory tiering** keeps more histories than HBM allows; it helps only when host-to-device load is faster or cheaper than recomputation.
- **Global cache movement** may erase the benefit if KVs are large and reuse is unlikely.

Prefix caching changes pool sizing: measure hit rate and saved prefill tokens, not request hit rate alone.

## Scheduling Metrics

- **TTFT:** arrival to first output token, including both queues and transfer.
- **TPOT:** inter-token latency during decode; report percentiles, not just mean.
- **Goodput:** requests or tokens meeting both TTFT and TPOT SLOs.
- **KV transfer overlap:** fraction of transfer hidden behind prefill.
- **Decode occupancy:** active slots versus configured batch capacity.
- **Prefix reuse:** cached prompt tokens divided by eligible prompt tokens.

Optimizing raw tokens/s while missing TPOT is not an improvement for interactive traffic.

## Decision Rule

Prefer disaggregation when measured prefill/decode interference, independent scaling, and specialized layouts save more capacity or latency than KV transfer and duplicated weights cost. Prefer colocated or interleaved serving when traffic is small, prompts are short, cache transfer dominates, or operational simplicity matters more.

## Sources

- [JAX Scaling Book: Inference](https://jax-ml.github.io/scaling-book/inference/)
- [JAX Scaling Book: Applied Inference](https://jax-ml.github.io/scaling-book/applied-inference/)
- [DistServe](https://arxiv.org/abs/2401.09670)
- [Splitwise](https://arxiv.org/abs/2311.18677)

## Related

- [KV Cache](/atlas/ai/inference-serving/caching/kv-cache)
- [LLM Inference Economics](/atlas/ai/inference-serving/performance/llm-inference-economics)
- [Roofline Model](/atlas/systems/performance/roofline-model)
