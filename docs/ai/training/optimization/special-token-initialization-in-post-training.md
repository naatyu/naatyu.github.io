---
title: "Special Token Initialization in Post-Training"
date: 2026-06-08
lastmod: 2026-06-08
tags:
  - ai/training
  - post-training
  - llm
draft: false
---

## Summary

Adding new special tokens after pretraining, such as reasoning or tool-call tags, is not a trivial formatting step. Poorly initialized special tokens can cause gradient spikes, formatting failures, or broader instability during mid-training and SFT. A practical fix is to initialize them from their constituent subtokens and let them adapt in a short controlled warmup.

## Concepts

- **Special token:** a token with explicit structural meaning, such as `<think>` or `<tool_call>`.
- **Subtoken averaging:** initializing a new token embedding as the mean of the embeddings of its existing tokenizer pieces.
- **Warmup adaptation:** a short training phase that lets the new token embeddings settle before full post-training.

## 1. Why this matters

When you introduce new structure tokens after pretraining, the model has never seen them as atomic symbols.

If they are randomly initialized, they may sit far off the embedding manifold learned during pretraining. That can create:

- unstable gradients
- malformed structured outputs
- mode-switching failures
- and in MoE models, even dead experts or broader routing issues

## 2. Subtoken averaging is a good default

A strong initialization trick is:

$$
e_{\text{new}} = \frac{1}{m}\sum_{i=1}^{m} e_{\text{subtoken}_i}
$$

For example, a token like `<think>` can be initialized from the average of its existing subpieces.

This gives the new token:

- a semantically related starting point
- a scale closer to the pretrained embedding space
- better early training behavior than random init

## 3. Short frozen warmup helps

The Laguna report describes a useful follow-up step:

- freeze the whole network except the input embeddings and LM head
- run a short warmup
- then start the main post-training stage

This lets the new token embeddings adapt without immediately disturbing the entire policy.

The deeper idea is:

> first teach the model what the new markers are, then ask the whole model to use them fluently.

## 4. Where this matters most

This is especially relevant when adding:

- reasoning tags like `<think>`
- tool-call tags
- XML-like structure markers
- any format-critical tokens that control downstream parsing

## Practical Heuristics

- Do not randomly initialize important new structure tokens unless you have to.
- Use subtoken averaging as the default initialization.
- Give new tokens a short isolated warmup before full post-training.
- Watch early formatting error rates and gradient spikes after introduction.

## Related

- [Chat Templates for LLMs](/atlas/ai/inference-serving/chat-templates-for-llms)
- [Supervised Fine-Tuning for LLMs](/atlas/ai/training/optimization/supervised-fine-tuning-for-llms)
- [MoE Training Stability](/atlas/ai/training/optimization/moe-training-stability)
- [Laguna M.1 / XS.2 Technical Report](https://poolside.ai/assets/laguna/laguna-m1-xs2-technical-report.pdf)
