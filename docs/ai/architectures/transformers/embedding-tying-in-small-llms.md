---
title: "Embedding Tying in Small LLMs"
date: 2026-06-02
lastmod: 2026-06-02
tags:
  - ai/deep-learning
  - transformers
  - llm-training
draft: false
---

## Summary

Embedding tying reuses the input embedding matrix as the output projection matrix. In small language models, this can save a substantial fraction of parameters with limited quality loss, making it one of the simplest parameter-efficiency wins available.

## Concepts

- **Input Embedding Matrix:** maps token IDs to hidden vectors.
- **Output Projection / LM Head:** maps hidden states back to vocabulary logits.
- **Tied Embeddings:** use the same matrix for input and output embeddings.
- **Untied Embeddings:** keep the two matrices separate.

## Content

### The Basic Parameter Tradeoff

Without tying, the embedding-related parameter count is roughly:
$$
P_{\text{embed, untied}} \approx 2 V d,
$$
where:
- $V$ is vocabulary size,
- $d$ is hidden size.

With tying:
$$
P_{\text{embed, tied}} \approx V d.
$$

So tying saves approximately:
$$
\Delta P \approx V d.
$$

This saving matters much more in small models, because embeddings can occupy a large share of the total parameter budget.

### Why It Matters More for Small Models

In a large model, the bulk of parameters sit in the transformer blocks, especially FFNs. But in a small model with a large vocabulary, the embedding matrices are comparatively expensive.

That means tying is not just a regularization trick. It is a structural reallocation of parameter budget:

- fewer parameters spent on duplicate token representations,
- more budget preserved for layers, width, or training efficiency.

### The Fair Comparison Problem

The playbook emphasizes an important methodological point: if untied embeddings increase total parameter count, a fair comparison should not blindly compare:

- tied model at $P$ parameters
- untied model at $P + \Delta P$ parameters

because the second model may win partly due to having more total capacity.

A better test is:

- compare tied and untied variants under roughly matched total parameters,
- e.g. reduce layers or width in the untied model.

That isolates whether untied embeddings are intrinsically beneficial enough to justify their budget cost.

### Why Larger Models Often Skip This Trick

As model size grows, embeddings become a smaller fraction of total parameters, so the savings matter less. At that point, teams may prefer untied embeddings if they offer even a small quality gain, because the relative parameter overhead is minor.

So tying is best understood as:

- often highly attractive in small LLMs,
- less important in large LLMs,
- and mainly a parameter-efficiency decision rather than a universal modeling rule.

### Practical Interpretation

If you are training a small or medium model and care about parameter efficiency, tying should be close to the default.

If you are training a larger model and embeddings are a tiny budget fraction, untied embeddings may be worth testing, but only if you can justify the added complexity and cost.

## Related

- [Transformer Scaling Rules](/atlas/ai/training/scaling/transformer-scaling-rules)
- [Smol Training Playbook Foundations](/atlas/ai/training/smol-training-playbook-foundations)
- [LLM Ablation Strategy](/atlas/ai/evaluation-experimentation/llm-ablation-strategy)
- [Smol Training Playbook](https://huggingface.co/spaces/HuggingFaceTB/smol-training-playbook)
