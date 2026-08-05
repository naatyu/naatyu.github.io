---
title: "KV Cache"
date: 2026-04-20
lastmod: 2026-08-05
tags:
  - ai/llm
  - nlp
  - optimization
  - serving
draft: false
---

## Summary

The KV cache stores each previous token's key and value projections at every attention layer. It removes repeated projection work during autoregressive generation, but introduces a memory-capacity and HBM-bandwidth cost that grows with batch, context, layers, KV heads, and head dimension.

## Prefill and Decode

During **prefill**, the model processes prompt tokens in parallel and writes their keys and values. During each **decode** step:

1. compute Q, K, and V for the new token;
2. append its K and V to the cache;
3. read cached keys and values for the attended context;
4. compute attention and generate the next-token distribution.

Caching makes the MLP/projection work for generating $n$ tokens linear rather than repeatedly processing the entire prefix. Attention still reads a growing history, so full-attention generation performs quadratic total attention work and traffic over sequence length.

## Exact Memory Formula

Let:

- $B$: number of cached sequences;
- $L$: transformer layers;
- $S$: allocated or resident tokens per sequence;
- $H_{kv}$: **KV heads**, not query heads;
- $K$: head dimension;
- $q$: bytes per cache element.

Then:

$$M_{KV}=2BL S H_{kv}Kq.$$

The factor two is for keys and values. Per token, per sequence:

$$M_{KV/token}=2L H_{kv}Kq.$$

### Correct Llama 3 8B example

Llama 3 8B has 32 layers, 32 query heads, **8 KV heads**, and head dimension 128. At 8,192 tokens with BF16 cache elements:

$$2\cdot32\cdot8\cdot128\cdot8192\cdot2
=1{,}073{,}741{,}824\text{ bytes}=1\text{ GiB}.$$

That is per sequence. Using all 32 query heads in the formula gives 4 GiB and is incorrect for this GQA model.

## Capacity Is Only Half the Problem

During full-attention decode, every sequence has its own cache, so batching does not amortize KV reads the way it amortizes weight reads. For resident cache size $M_{KV}$ and aggregate HBM bandwidth $W_{HBM}$:

$$T_{KV/read}\gtrsim\frac{M_{KV,attended}}{W_{HBM}}.$$

At long contexts, KV traffic can dominate both weight loading and FLOPs. A cache that fits in HBM can still make decode slow.

## Architectural Optimizations

### GQA and MQA

Grouped-query attention reduces cache size in proportion to $H_q/H_{kv}$. Multi-query attention uses one KV head. This changes model architecture and usually must be decided before training or adapted carefully.

### Local and global attention

For a local-attention layer with window $w$, only about $w$ tokens per sequence need remain active rather than the entire $S$. Interleaving local layers with occasional global layers reduces total cache while preserving some long-range mixing.

### Cross-layer KV sharing

Sharing K/V representations across layers reduces stored capacity and can improve prefix-cache density. It does **not necessarily reduce decode latency**: the shared cache may still be read once for every consuming layer unless it remains in a faster cache or the kernels fuse reuse.

### Quantization

INT8, FP8, or lower-bit KV storage reduces capacity and bandwidth, but requires calibration and kernels that avoid expensive dequantization or accuracy loss. The gain should be measured end to end.

## Runtime Optimizations

### Paged and ragged attention

PagedAttention stores blocks through a page table, reducing fragmentation and enabling prefix block sharing. Ragged kernels avoid reading padding up to a batch-wide maximum length.

### Prefix caching

Autoregressive prefixes have identical KVs when the token sequence and model state are identical. Store blocks in a trie/radix tree and evict them with an LRU-like policy. Multi-turn chat and repeated system prompts benefit strongly.

Prefix caches introduce placement constraints: affinity routing improves hits but can worsen load balance. Host DRAM or local SSD can serve as slower tiers when transfer is cheaper than recomputation.

### Cache sharding

Shard KV heads across tensor-parallel ranks first. With few KV heads, additionally shard batch or sequence. Sequence sharding requires distributed attention reductions; batch sharding can require layout-changing AllToAlls. Avoid replicating a large cache merely because the weights fit.

## Operational Checklist

- distinguish logical context limit, allocated blocks, and tokens actually read;
- calculate with $H_{kv}$ and the cache dtype;
- budget fragmentation and temporary attention buffers;
- model HBM bandwidth as well as capacity;
- record prefix-cache hit rate and transfer time;
- inspect how speculative decoding and beam search multiply cache state;
- verify whether sliding-window layers evict old blocks in the runtime.

## Sources

- [JAX Scaling Book: Inference](https://jax-ml.github.io/scaling-book/inference/)
- [Llama 3 model card and architecture](https://github.com/meta-llama/llama3/blob/main/MODEL_CARD.md)
- [PagedAttention](https://arxiv.org/abs/2309.06180)

## Related

- [Disaggregated Prefill-Decode Serving](/atlas/ai/inference-serving/serving-architectures/disaggregated-prefill-decode-serving)
- [LLM Inference Economics](/atlas/ai/inference-serving/performance/llm-inference-economics)
- [Transformer Performance Accounting](/atlas/ai/training/scaling/transformer-performance-accounting)
