---
title: "Frontier Small Language Models (Liquid AI)"
date: 2026-04-20
lastmod: 2026-04-30
tags:
  - ai/deep-learning
  - llm
  - edge-computing
  - training
  - liquid-ai
draft: false
---

## Summary

Insights from Maxim Labon (Head of Pre-training at Liquid AI) on training "Frontier" small models (350M - 24B parameters). The core thesis is that **small models are not just scaled-down versions of large models**; they require unique architectural choices, massive over-training (28T tokens), and specific strategies to combat "Doom Looping."
## 1. The Small Model Philosophy
Small models (designed for edge deployment in cars, phones, etc.) are defined by three constraints:
1.  **Memory Bound**: Low knowledge capacity due to physical hardware limits.
2.  **Task Specific**: Narrower focus (tool use, summarization) rather than general-purpose "chat."
3.  **Latency Sensitive**: High throughput is mandatory.

## 2. Architectural Breakthroughs

### The "Embedding Tax"
In most small models (Gemma 270M, Qwen 0.8B), the **Embedding Layer** consumes a disproportionate amount of parameters (up to 63%).
- **Why?**: They reuse the massive vocabularies of their "teacher" models to facilitate distillation.
- **Problem**: Parameters in the embedding layer don't contribute to reasoning.
- **Solution (LFM2)**: Liquid AI uses smaller, more efficient embedding layers (90% of parameters are "effective" reasoning parameters) and **Gated Short Convolutions**, which are significantly faster than sliding window attention or GQA on edge CPUs/GPUs.

## 3. Training & Scaling Laws
Traditional [Scaling Laws](/atlas/ai/deep-learning/scaling-laws) (Chinchilla) suggest compute optimality at ~20 tokens per parameter. For a 350M model, this would be ~7B tokens.
- **Liquid AI approach**: Trained the 350M model on **28 Trillion tokens**.
- **Observation**: Performance continues to scale far beyond Chinchilla limits for small models. Since these models are cheap to train, the goal is to minimize **inference cost/latency** rather than training compute.
- **Benchmark Strategy**: Focus on "Knowledge" (GPQA) and "Tool Use" (T2Bench) rather than being average at everything.

## 4. Post-Training & The "Doom Loop" Problem
"Doom Looping" is a failure mode where a small model (especially reasoning models) repeats a sequence of words infinitely.

### How to solve Doom Looping:
1.  **On-Policy DPO**:
    - Generate 5 rollouts with temperature sampling (diversity).
    - Generate 1 rollout with temperature 0 (likely to loop).
    - Use an LLM judge to score them; the looping rollout is the **Rejected** sample in [DPO](/atlas/ai/deep-learning/loss-functions/cross-entropy-loss).
2.  **Verifiable Rewards (RL)**:
    - Use RL with environments (Math/Code) where the reward is based on the correct answer.
    - If a model loops, it fails to provide the answer $\rightarrow$ zero reward.
    - Add an **N-gram repetition penalty** during RL.

## 5. Agency as a Memory Proxy
Because small models are memory-bound, they have low knowledge capacity (hallucinate facts).
- **Solution**: Don't try to make them "know" everything. Make them **Reasoning Agents**.
- **Tool Use**: If a 350M model can use Web Search reliably, its "effective knowledge" exceeds that of a much larger static model.
- **Long Context Trick**: If the context is too large for the model's KV cache, use a Python tool to summarize or process the data recursively.

## Related
- [Disaggregated Prefill-Decode Serving](/atlas/ai/deep-learning/serving/disaggregated-prefill-decode-serving)
- [Batch size & Learning rate](/atlas/ai/deep-learning/batch-size-and-learning-rate)
- [Statistical Power and Type I-II Errors](/atlas/mathematics/statistics/statistical-power-and-type-i-ii-errors)
- [Scaling Laws](/atlas/ai/deep-learning/scaling-laws)
