---
title: "Choosing an LLM Training Framework"
date: 2026-06-02
lastmod: 2026-06-11
tags:
  - systems
  - llm-training
  - infrastructure
draft: false
---

## Summary

Choosing a training framework for LLM pretraining is a tradeoff between feature support, implementation simplicity, operational maturity, and throughput. There is no universally best framework; the right choice depends on how much instability and internal development you can absorb.

## Concepts

- **Feature Support:** whether the framework supports the architecture, optimizer, and parallelism features you need.
- **Operational Maturity:** how battle-tested the framework is in long real-world runs.
- **Throughput:** realized tokens/sec or FLOPs utilization on your hardware.
- **Modifiability:** how easily the codebase can be extended or debugged.

## Content

### The Four-Way Tradeoff

The playbook frames framework choice as a tension between:

- feature coverage,
- production robustness,
- throughput,
- and ease of modification.

These do not usually maximize together.

Older frameworks like Megatron-LM or DeepSpeed tend to be:

- mature,
- highly optimized,
- and feature-rich,

but often harder to modify.

Lighter frameworks tend to be:

- easier to understand,
- faster to prototype in,
- and friendlier for custom experimentation,

but may be less battle-tested.

### Why Modifiability Matters

A framework is not only an execution engine. It is also the place where you will:

- add experimental features,
- debug distributed bugs,
- trace throughput drops,
- inspect optimizer state behavior,
- and recover from surprising failures.

So codebase clarity has real training value. A framework that is theoretically strong but practically opaque can slow iteration more than expected.

Another useful criterion is whether the abstractions remain understandable once you add:

- MoE,
- context parallelism,
- custom numerics,
- distributed checkpointing,
- and restart logic.

### Throughput Is Not Enough

A common mistake is to optimize only for benchmark throughput.

But the true objective is closer to:

$$ 
\text{useful progress} = \text{throughput} \times \text{correctness} \times \text{stability} \times \text{recoverability}.
$$

If a faster framework causes:

- more broken runs,
- harder debugging,
- or reduced experimental velocity,

then its effective value may be lower.

### Internal vs External Frameworks

The playbook also highlights a real organizational advantage of internal frameworks: the people who built them are available to debug and evolve them.

That does not mean internal is always better. It means:

- if you own the framework, you own the support burden but also the adaptation speed;
- if you adopt an external framework, you inherit maturity and community, but also its abstractions and limitations.

### Descriptive sharding is often better than magical sharding

One strong design choice is to make tensor sharding annotations **descriptive**:

- they state how tensors are partitioned or replicated,
- but they do not automatically inject communication into the graph.

Why this helps:

- avoids accidental synchronization points
- makes communication structure visible
- gives more control over mixed parallelism layouts

### Practical Selection Rule

If multiple frameworks support the required features, compare them on your actual setup:

- target model family,
- target sequence length,
- target parallelism,
- target hardware.

The best framework is the one that minimizes the total cost of:

- implementation,
- debugging,
- instability,
- and runtime inefficiency.

Not just the one with the highest benchmark tokens/sec.

### Determinism and restart correctness are framework features

For long expensive runs, a framework should be judged on whether it supports:

- deterministic or at least stable numerics
- reproducible dataloading order
- full-state checkpointing
- restart correctness
- distributed checkpoint efficiency

## Practical Heuristics

- Prefer battle-tested frameworks for long, expensive runs.
- Prefer simpler frameworks for rapid experimental cycles.
- Do not ignore the cost of debugging distributed behavior.
- Benchmark throughput on your actual stack, not someone else’s headline number.
- If a framework is missing critical features you will need soon, treat that as a real scaling risk.

## Related

- [Smol Training Playbook Foundations](/atlas/ai/training/smol-training-playbook-foundations)
- [LLM Ablation Strategy](/atlas/ai/evaluation-experimentation/llm-ablation-strategy)
- [High-Density GPU Infrastructure](/atlas/systems/infrastructure/high-density-gpu-infrastructure)
- [Goodput, Determinism, and Fault Tolerance](/atlas/systems/infrastructure/goodput-determinism-and-fault-tolerance)
- [Training Loss Patterns](/atlas/ai/training/optimization/training-loss-patterns)
- [Smol Training Playbook](https://huggingface.co/spaces/HuggingFaceTB/smol-training-playbook)
