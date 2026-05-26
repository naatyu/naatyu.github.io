---
title: "Large Concept Models (LCM)"
date: 2026-04-08
lastmod: 2026-04-08
tags:
  - ai/llm
  - architecture
draft: false
---

## Summary

A new paradigm in language modeling that moves beyond word-level tokens to reason in a high-level, language-agnostic "concept" space. It uses sentence embeddings (SONAR) as the fundamental unit of processing.
## Concepts
- **Concept:** An abstract, atomic unit of meaning, represented as a high-dimensional sentence embedding.
- **SONAR:** Meta's multilingual sentence embedding model used as the encoder/decoder for LCMs.
- **SONAR Quantization:** Using Residual Vector Quantization (RVQ) to turn continuous embeddings into discrete codes for standard transformer training.
- **Diffusion-based LCM:** An alternative architecture that generates continuous sentence embeddings one at a time using a diffusion process.

## Content

### Hierarchical Reasoning
Most LLMs generate text token-by-token, which lacks global planning. LCMs mimic human reasoning by:
1.  **Encoding**: Segmenting input text into sentences and encoding each into a "concept" vector via SONAR.
2.  **Reasoning**: A global transformer (LCM) predicts the *next concept* vector based on the sequence of preceding concepts.
3.  **Decoding**: The predicted concept vector is decoded into any target language or modality.

### Language Agnosticism
Because the LCM backbone operates entirely in the SONAR embedding space, it has no inherent concept of "English" or "French."
- **Zero-shot Translation**: A concept sequence generated from an English prompt can be decoded directly into French without explicit translation steps.
- **Efficiency**: For long documents, reasoning on sentences (concepts) is significantly more computationally efficient than reasoning on thousands of subword tokens.

### Training & Segmentation
LCMs require robust sentence boundary detection. The paper uses **SaT (Sentence at Tokens)** models and **SpaCy** to ensure high-quality segmentation. If a sentence is too long, it is broken down into smaller semantic units to maintain the "atomic" nature of the concept.

## Related
- [AI Papers MOC](/atlas/ai/ai-papers-moc)
- Scaling Test-Time Compute
- [Byte Latent Transformer](/atlas/ai/deep-learning/byte-latent-transformer)
