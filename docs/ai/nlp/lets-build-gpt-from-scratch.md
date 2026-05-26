---
title: "Let's build GPT from scratch (Andrej Karpathy)"
date: 2024-09-27
lastmod: 2026-04-08
tags:
  - ai/llm
  - implementation
draft: false
---

## Summary

A step-by-step implementation of a decoder-only Transformer (GPT) in PyTorch, starting from a simple Bigram model to a full scaled-up architecture with Attention and Feed-Forward layers.
## Concepts
- **Bigram Language Model:** A simple model where each token only predicts the next token based on its current value (no context).
- **Self-Attention:** A mechanism allowing tokens to communicate and aggregate information from other tokens in a sequence.
- **Positional Encoding:** Adding information about the token's position in the sequence, as Transformers are inherently permutation-invariant.

## Content

### 1. The Bigram Baseline
The implementation starts with a simple lookup table. While it can produce text, it lacks any understanding of grammar or long-range dependencies because the "context window" is effectively 1 token.

### 2. Implementing Self-Attention
Karpathy explains attention as a **weighted sum** of values:
- **Queries ($Q$)**: What am I looking for?
- **Keys ($K$)**: What do I contain?
- **Values ($V$)**: What information do I share if matched?
The core operation is `softmax(Q @ K.T / sqrt(dk)) @ V`.

### 3. Scaling to a Transformer
To move from a single attention head to a full GPT:
- **Multi-Head Attention**: Running multiple attention operations in parallel to capture different types of relationships.
- **Feed-Forward Network (FFN)**: A simple linear-ReLU-linear stack applied to each token independently to "think" about the gathered information.
- **Residual Connections & LayerNorm**: Essential for training deep networks (preventing vanishing gradients).

### 4. Generation
Generation is **Auto-regressive**: The model predicts the next token, appends it to the input, and repeats the process.

## Related
- [Attention Mechanism](/atlas/ai/nlp/attention-mechanism)
- [Transformers MOC](/atlas/ai/transformers-moc)
