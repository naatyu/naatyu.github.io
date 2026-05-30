---
title: "Byte Latent Transformer (BLT)"
date: 2026-04-08
lastmod: 2026-05-19
tags:
  - ai/llm
  - architecture
draft: false
---

## Summary

A decoder-only architecture that replaces the traditional fixed tokenizer (BPE) with a dynamic, entropy-based patching mechanism.
## Concepts
- **Entropy-Based Patching:** A small "navigator" model computes the next-byte entropy. A patch boundary is created when entropy spikes, signaling the start of a new semantic unit.
- **Bits-Per-Byte (BPB):** The evaluation metric used for BLT, as perplexity is not comparable across different tokenization schemes.
- **Cross-Attention Bottleneck:** The interface where the Global Transformer attends to the compressed byte-representations from the Local Encoder.

## Content

### Why BLT?
Traditional BPE tokenizers are:
1.  **Biased**: English is more compressed than other languages.
2.  **Fragile**: A single typo can completely change the tokenization of a word.
3.  **Static**: They treat "the" and "photosynthesis" as single units regardless of the model's uncertainty.

### The BLT Stack
1.  **Local Encoder**: A small Transformer (e.g., 100M) that processes raw bytes and outputs a single vector per patch.
2.  **Global Transformer**: A large backbone (e.g., 7B) that performs autoregressive prediction on the patch sequence.
3.  **Local Decoder**: Expands the predicted patch representation back into a sequence of raw bytes.

### Scaling Results
BLT models match or outperform Llama 3 (BPE) in bits-per-byte efficiency. Crucially, they become **more efficient as they scale**, because the "overhead" of the local models becomes negligible compared to the global backbone's capacity.

## Related
- AI Papers MOC
- [Byte Pair Encoding](/atlas/ai/modalities/nlp/byte-pair-encoding)
- Self-Supervised Learning
