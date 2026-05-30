---
title: "Qwen 2.5 (Technical Deep Dive)"
date: 2026-04-08
lastmod: 2026-04-08
tags:
  - ai/llm
  - models
draft: false
---

## Summary

Alibaba's Qwen 2.5 series (0.5B to 72B), trained on 18T tokens. It features significant improvements in data quality, math/coding specialized pretraining, and a two-phase context extension strategy (up to 1M tokens).
## Concepts
- **GRPO (Group Relative Policy Optimization):** A reinforcement learning algorithm that uses relative performance within a group of samples to optimize the policy, removing the need for a separate reward model.
- **ABF (Adjusted Base Frequency):** A technique for RoPE scaling that modifies the base frequency $\theta$ from 10k up to 10M to support ultra-long context.
- **YARN / DCA (Dual Chunk Attention):** Inference-time optimizations used to maintain performance on long sequences (up to 1M tokens).

## Content

### 1. Data Strategy & Pretraining
Qwen 2.5's jump in performance is largely attributed to its **18 Trillion token** dataset:
- **Data Filtering**: Used Qwen2-72B-Instruct to score and filter web data, removing low-quality "noise" and oversampled e-commerce/social media content.
- **Specialized Mixtures**: Integrated massive amounts of data from **Qwen2.5-Math** and **Qwen2.5-Coder** into the base model's pretraining mix.
- **Staged Pretraining**:
    - **Phase 1**: Initial training on 4k context length.
    - **Phase 2**: Extension to 32k context, mixing $40\%$ long-context data with $60\%$ short-context data.

### 2. Architecture
Qwen 2.5 maintains a standard decoder-only transformer architecture with:
- **Dense Models**: 0.5B, 1.5B, 3B, 7B, 14B, 32B, 72B.
- **Features**: GQA (Grouped Query Attention), SwiGLU, RoPE, and RMSNorm with pre-normalization.
- **Tokenizer**: Byte-level BPE (BBPE) with a large 151k vocabulary.

### 3. Post-Training & RL
The post-training pipeline is highly sophisticated:
- **SFT**: Millions of examples covering 40+ programming languages and complex logical reasoning.
- **RL (Two Stages)**:
    1. **Offline RL**: Focuses on reasoning and factuality using a "Online Merging Optimizer."
    2. **Online RL**: Uses **GRPO** for instruction following and helpfulness, with the Qwen-Math-RM-72B providing precise rewards for mathematical steps.

## Related
- [The Llama 3 Herd of Models](/atlas/ai/architectures/model-reports/the-llama-3-herd-of-models)
- [RoPE Scaling](/atlas/ai/architectures/transformers/rope-scaling)
- Distributed Training MOC
