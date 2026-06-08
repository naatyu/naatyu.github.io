---
title: "RoPE Scaling"
date: 2026-04-08
lastmod: 2026-06-08
tags:
  - ai/llm
  - theory
draft: false
---

## Summary

RoPE scaling covers the family of techniques used to extend a model's context window beyond its original training length by changing how rotary frequencies are applied. The main practical tools are **adjusted base frequency (ABF)** during continued training and **YaRN-style extrapolation** at inference or during a short adaptation stage.

## Concepts
- **Rotary Positional Embeddings (RoPE):** Encodes position by rotating the Query and Key vectors in the complex plane.
- **ABF:** adjusted base frequency, where the RoPE base $\theta$ is increased as context grows.
- **YaRN:** a non-uniform RoPE scaling method that supports train-short, test-long extrapolation.
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

### ABF in practice

ABF is the simplest practical recipe:

- pretrain mostly at short context
- increase $\theta$ when extending context
- retune if short-context quality regresses

The Smol Training Playbook gives a concrete example:

- `4k -> 32k`: increase $\theta$ to about `2M`
- `32k -> 64k`: increase $\theta$ to about `5M`

They also found that pushing higher, like `10M`, slightly improved long-context scores but hurt some short-context tasks. That is a good reminder that “bigger theta” is not automatically better.

### YaRN extrapolation

`YaRN` is a more flexible strategy that scales RoPE dimensions non-uniformly. It is useful when you want to extrapolate beyond the length seen in training.

The practical pattern is:

- adapt the model to a moderately long context
- then use `YaRN` to stretch somewhat further at inference

This supports a:

$$
\text{train shorter, test somewhat longer}
$$

workflow, but the extrapolation budget is finite. SmolLM3 could extrapolate from `64k` to `128k` reasonably, but not cleanly to `256k`.

## Related
- [Attention Mechanism](/atlas/ai/foundations/attention-mechanism)
- [Progressive Context Extension](/atlas/ai/training/scaling/progressive-context-extension)
- [The Smol Training Playbook](/atlas/ai/training/smol-training-playbook)
- [The Llama 3 Herd of Models](/atlas/ai/architectures/model-reports/the-llama-3-herd-of-models)
- [Context Parallelism](/atlas/systems/parallel-computing/context-parallelism)
