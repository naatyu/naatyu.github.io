---
title: "LLM Inference Economics"
date: 2026-04-20
lastmod: 2026-05-20
tags:
  - ai/serving
  - economics
  - optimization
  - hardware
draft: false
---

## Summary

LLM serving costs and performance are governed by a **Roofline Analysis**, where the time per step is the maximum of compute time and memory fetch time. The critical optimization lever is **Batch Size**, which amortizes the "cost" of reading weights across multiple users.
## 1. The [Roofline Model](/atlas/ai/deep-learning/roofline-model)
The time required for a single inference step ($T$) is bounded by the tighter of two constraints:
$$T \ge \max(T_{compute}, T_{memory})$$

### Compute Time ($T_{compute}$)
The time spent on matrix multiplications.
$$T_{compute} \approx \frac{\text{Batch} \times \text{Active Parameters}}{\text{Hardware FLOPs}}$$

### Memory Time ($T_{memory}$)
The time spent fetching weights and the [KV Cache](/atlas/ai/nlp/kv-cache) from memory.
$$T_{memory} \approx \frac{\text{Total Parameters} + (\text{Batch} \times \text{Context} \times \text{BytesPerToken})}{\text{Memory Bandwidth}}$$

## 2. The Batch Size "Train"
Serving a single user ($B=1$) is economically disastrous (up to 1000x more expensive) because you must fetch the **Total Parameters** from memory for just one token of compute.
- **Optimal Batch Size**: Occurs when $T_{compute} \approx T_{memory}$.
- **Heuristic**: $B \approx 300 \times \text{Sparsity Ratio}$.
- **Latency Schedule**: Modern servers act like a "train" that departs every ~20ms. If you arrive just after a train, you wait for the next, setting a floor on latency regardless of compute power.

## 3. Pricing Insights
- **Input vs. Output**: Output tokens (Decode) are ~5x more expensive because they are **Memory-Bandwidth Bound** (serial). Input tokens (Prefill) are cheaper because they are **Compute Bound** (parallel).
- **Context Length Tiers**: Large price jumps (e.g., at 200k tokens) often align with the transition where the **KV Cache fetch time** starts dominating the **Weight fetch time**.
