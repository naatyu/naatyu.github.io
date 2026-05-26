---
title: "The Llama 3 Herd of Models (Technical Deep Dive)"
date: 2026-04-08
lastmod: 2026-05-19
tags:
  - ai/llm
  - models
draft: false
---

## Summary

The technical report for Llama 3 (8B, 70B, 405B), detailing the scaling laws, massive-scale infrastructure (16k H100s), and the 4D parallelism strategy required to train a 405B parameter model on 15T tokens.
## Concepts
- **4D Parallelism:** The combination of Tensor (TP), Pipeline (PP), Context (CP), and Data (DP) parallelism used to fit the 405B model across 16,384 GPUs.
- **RoCE (RDMA over Converged Ethernet):** The networking protocol used to achieve 400Gbps inter-GPU bandwidth.
- **MFU (Model FLOPs Utilization):** A metric of hardware efficiency. Llama 3 achieved 38-43% MFU on H100s.
- **GQA (Grouped Query Attention):** Used in all Llama 3 sizes to reduce KV-cache size and improve inference speed.

## Content

### 1. Scaling Laws & Data Strategy
Llama 3 was trained on **15 Trillion tokens**. While Chinchilla optimality suggests $\sim 200B$ tokens for an 8B model, Meta found that performance continues to scale log-linearly even at $2000$ tokens per parameter.
- **Data Mix**: $95\%$ English, $5\%$ non-English (supporting 30+ languages). Heavy upsampling of mathematical and reasoning data in later stages.
- **Annealing**: In the final $40M$ tokens, they linearly annealed the learning rate to 0 while upsampling high-quality data sources.

### 2. Infrastructure & Networking (16,384 H100s)
Training the 405B model required one of the largest H100 clusters in the world.
- **RoCE Optimizations**: To prevent "fat network flows" from causing congestion, they split the traffic between two GPUs into **16 sub-flows** to better balance load across ECMP paths.
- **Check-pointing**: At this scale, saving the model is a massive I/O burst. They used **Tectonic** (distributed FS) and optimized the frequency to balance recovery speed vs. system pause time.

### 3. 4D Parallelism Strategy
The models were distributed using a specific hierarchy: `[TP, CP, PP, DP]`.
- **Tensor Parallelism (TP)**: Used within a node (8 GPUs) for lowest latency.
- **Context Parallelism (CP)**: Shards the sequence dimension. Llama 3 uses an `All-Gather` based CP, which is efficient because GQA keeps the communicated KV tensors small.
- **Pipeline Parallelism (PP)**: Used across nodes. To reduce the "bubble," they used an interleaved schedule and manually balanced stages (e.g., removing a layer from the first/last stages to account for embedding/loss overhead).
- **Data Parallelism (DP/FSDP)**: The outermost layer, sharding optimizer states and gradients.

### 4. Context Window Expansion (8k $\to$ 128k)
They did not train on 128k tokens from the start due to $O(N^2)$ attention costs.
- **Expansion Phase**: In the final $800B$ tokens of pretraining, they gradually increased the context from 8k to 128k.
- **RoPE Base**: Increased the RoPE base frequency $\theta$ to **500,000** to handle the long-range positional encoding.

## Related
- [Scaling Laws](/atlas/ai/deep-learning/scaling-laws)
- [RoPE Scaling](/atlas/ai/deep-learning/rope-scaling)
- [Distributed Training MOC](/atlas/ai/distributed-training/distributed-training-moc)
- [Attention Mechanism](/atlas/ai/nlp/attention-mechanism)
