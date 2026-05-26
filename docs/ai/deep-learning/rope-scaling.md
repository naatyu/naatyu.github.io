---
title: "RoPE Scaling"
date: 2026-04-08
lastmod: 2026-04-08
tags:
  - ai/llm
  - theory
draft: false
---

## Summary

Techniques for extending the context window of a model beyond its initial training length by modifying the base frequency of Rotary Positional Embeddings.
## Concepts
- **Rotary Positional Embeddings (RoPE):** Encodes position by rotating the Query and Key vectors in the complex plane.
- **LongRoPE:** A method that uses non-uniform scaling of frequencies to preserve performance across different context lengths.
- **Base Frequency ($\theta$):** The fundamental constant in RoPE. Increasing $\theta$ (e.g., from 10k to 500k) effectively "stretches" the rotation, allowing the model to distinguish positions over much longer sequences.

## Content

### Scaling in Llama 3
Llama 3 used a base frequency of **500,000** (compared to 10,000 for Llama 2). This change allows the model to handle contexts up to 128k tokens. 

### Why Scale $\theta$?
When sequence length $L$ exceeds the training length $L_{train}$, the "rotation" of the embedding for tokens at $L$ becomes "out of distribution" for the model. 
- By increasing the base $\theta$, the rotation per token is **decreased**, keeping the total rotation within the range the model learned during pretraining.

### Nuance: High vs. Low Frequencies
Scaling RoPE is not uniform:
- **Low-frequency dimensions**: Carry coarse-grained positional information. These are often "stretched" or interpolated.
- **High-frequency dimensions**: Carry fine-grained local information. These are often left untouched to maintain local precision.

## Related
- [Attention Mechanism](/atlas/ai/nlp/attention-mechanism)
- [The Llama 3 Herd of Models](/atlas/ai/nlp/models/the-llama-3-herd-of-models)
- [Context Parallelism](/atlas/ai/distributed-training/parallelism/context-parallelism)
