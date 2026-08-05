---
title: "Transformer Performance Accounting"
date: 2026-08-05
lastmod: 2026-08-05
tags:
  - ai/deep-learning
  - transformers
  - performance
  - scaling
draft: false
---

## Summary

Before estimating training time, memory, or utilization, reduce the transformer to tensor contractions. A dense model costs roughly $2P$ FLOPs per token in the forward pass and $6P$ for forward plus backward; the familiar $6PT$ training estimate follows. This shortcut is useful, but exact architecture accounting matters for attention, GQA, gated MLPs, MoE, and rematerialization.

## General Einsum Rule

For a contraction, multiply the sizes of all distinct dimensions and count shared batching and contracting dimensions once. Multiply by two for a multiply-add.

For example:

$$A[B,D]W[D,F]\rightarrow Y[B,F]$$

costs:

$$2BDF \text{ FLOPs}.$$

For a linear layer containing $DF$ parameters, the forward cost is therefore two FLOPs per parameter per token.

## Why Training Is Approximately $6PT$

For one linear operation:

- forward: $2BDF$;
- activation gradient: $2BDF$;
- weight gradient: $2BDF$.

Thus forward + backward is $6BDF$. Summed over parameterized projections:

$$F_{train} \approx 6PT,$$

where $P$ is the number of **active, non-embedding parameters** and $T$ is the number of training tokens.

This estimate excludes optimizer work, embeddings, normalization, nonlinearities, communication, and the quadratic attention products. It is generally a good first approximation for conventional dense transformers when sequence length is moderate relative to width.

### Rematerialization

Activation checkpointing recomputes some or all of the forward pass during backward. With full-block rematerialization, the rough accounting becomes:

$$F_{train,remat} \approx 8PT,$$

because an additional forward-equivalent $2PT$ is executed. Selective checkpointing falls between $6PT$ and $8PT$.

## Exact Per-Layer Parameter Accounting

Let:

- $D$: model width;
- $F$: intermediate MLP width;
- $H_q$: number of query heads;
- $H_{kv}$: number of key/value heads;
- $K$: head dimension;
- $S$: sequence length;
- $L$: layer count.

Usually $D=H_qK$.

### Attention projections

Query and output projections each contain $D^2$ parameters. Key and value each contain $D(H_{kv}K)$. Therefore:

$$P_{attn}=2D^2+2D H_{kv}K
=2D^2\left(1+\frac{H_{kv}}{H_q}\right).$$

For MHA, $H_{kv}=H_q$ and $P_{attn}=4D^2$. GQA reduces K/V projection parameters and KV-cache size, but not Q/O parameters.

### MLP

A standard two-projection MLP has:

$$P_{MLP}=2DF.$$

A gated MLP such as SwiGLU has gate, up, and down projections:

$$P_{SwiGLU}=3DF.$$

Using the shortcut with an outdated two-matrix FFN undercounts modern gated models.

## Quadratic Attention FLOPs

Per layer, forming attention scores and multiplying probabilities by values costs approximately:

$$F_{quad,fwd}\approx 4BS^2D.$$

The projection and gated-MLP forward FLOPs are approximately:

$$F_{linear,fwd}\approx 2BS\left(P_{attn}+3DF\right).$$

For the common approximation $F\approx4D$ and MHA, linear parameters per layer are about $16D^2$, so:

$$\frac{F_{quad}}{F_{linear}}\approx\frac{S}{8D}.$$

This explains why parameter-only FLOP estimates work when $S\ll8D$, and increasingly undercount long-context training.

For causal attention, only half of the $S\times S$ matrix is semantically useful. A causal-aware kernel can exploit this; a dense implementation that computes masked entries still pays close to the full work. State which convention a FLOP count uses.

## MoE Accounting

MoE requires two parameter counts:

- **total parameters** determine checkpoint and often memory/network capacity;
- **active parameters per token** determine most token-level matmul FLOPs.

If an MoE layer has $E$ experts and top-$k$ routing, its expert matmul FLOPs scale with $k$, not $E$, while stored expert weights scale with $E$. Router FLOPs, load imbalance, padding/dropped tokens, and AllToAll communication are separate costs.

Do not quote a single "model size" for MoE performance planning. Record total parameters, active parameters, experts, top-$k$, and achieved routing balance.

## Memory Accounting

Training memory has distinct terms:

$$M \approx M_{params}+M_{grads}+M_{optimizer}+M_{activations}+M_{temporary}.$$

With mixed-precision Adam, the bytes per parameter depend on whether master weights and optimizer moments are FP32 and whether each state is sharded. Activations depend on batch, sequence, width, layer count, attention implementation, and checkpointing policy; they cannot be inferred from $P$ alone.

For inference, KV bytes per token are:

$$M_{KV/token}=2L H_{kv}Kq,$$

where $q$ is bytes per cache element. This uses **KV heads**, not query heads.

## From FLOPs to Step Time

If hardware peak is $C$ FLOPs/s per device, device count is $N$, and model FLOPs utilization is $u$:

$$T_{step}\approx\frac{F_{step}}{NCu}.$$

This is an achieved-performance estimate, not a guarantee. Communication, input stalls, bubbles, imbalance, memory traffic, and tiny kernels lower $u$.

Sanity-check reported MFU by using the same FLOP convention as the report. A system using $6PT$ useful FLOPs can show a different MFU from one counting rematerialized or masked FLOPs even at identical wall time.

## Sources

- [JAX Scaling Book: Transformers](https://jax-ml.github.io/scaling-book/transformers/)
- [JAX Scaling Book: Training](https://jax-ml.github.io/scaling-book/training/)
- [JAX Scaling Book: Inference](https://jax-ml.github.io/scaling-book/inference/)

## Related

- [LLM Training Capacity Planning](/atlas/ai/training/scaling/llm-training-capacity-planning)
- [LLM Pretraining System Design: Interview Guide](/atlas/ai/training/pretraining-system-design-interview-guide)
- [Transformer Scaling Rules](/atlas/ai/training/scaling/transformer-scaling-rules)
- [Model FLOPs Utilization](/atlas/systems/performance/model-flops-utilization-mfu)
- [KV Cache](/atlas/ai/inference-serving/caching/kv-cache)
- [Roofline Model](/atlas/systems/performance/roofline-model)
