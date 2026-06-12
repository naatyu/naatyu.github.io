---
title: "Supervised Fine-Tuning for LLMs"
date: 2026-06-08
lastmod: 2026-06-12
tags:
  - ai/training
  - llm
  - post-training
draft: false
---

## Summary

Supervised fine-tuning (SFT) is usually the first and highest-leverage stage of post-training. It gives the model its assistant prior, exposes formatting and data bugs early, and creates a strong checkpoint for preference optimization or RL. In most practical pipelines, SFT should be the default starting point unless there is a specific reason to skip it.

## Concepts

- **SFT:** supervised training on prompt-response examples.
- **Baby baseline:** a small initial SFT run used to validate data, templates, and hyperparameters.
- **Assistant-only masking:** computing loss only on assistant spans.
- **Full fine-tuning:** updating all model weights.
- **LoRA:** low-rank adaptation that updates a small parameter subset.

## 1. Why SFT usually comes first

SFT is attractive because it is:

- cheap relative to RL
- stable
- easy to debug
- and good at establishing the model's default assistant behavior

A good SFT checkpoint often delivers most of the basic gains you need:

- instruction following
- role adherence
- basic helpfulness
- early reasoning behavior

It also gives later stages a much better starting distribution.

## 2. What a good first SFT run should answer

The first SFT run is not for chasing state of the art.

It is for answering:

- does the chat template behave correctly?
- are system prompts actually preserved?
- do tool and reasoning formats serialize properly?
- does the model improve in the intended direction at all?

This is why "baby baselines" are useful. They validate the recipe before expensive iteration.

## 3. Choose the base model for the real deployment target

Base-model choice is part of the SFT recipe.

Important axes:

- model size
- dense vs MoE architecture
- prior post-training track record
- deployment budget

In practice, you usually want a base model that is:

- representative of the final use case
- easy enough to train and serve
- and already known to respond well to post-training

## 4. Data quality matters more than dataset prestige

A recurring lesson from the Smol Training Playbook is that SFT datasets should be selected for behavior, not for status.

High-profile or benchmark-heavy datasets can still be poor assistants if they over-index on the wrong style.

This is why direct interaction with checkpoints matters. A model that responds to "How are you?" with equations has revealed a real problem even if some benchmark looks fine.

## 5. Train on assistant tokens, not the whole dialogue

In chat SFT, the target is usually the assistant behavior, not the user turns.

So the loss is often masked to assistant spans only:

$$
\mathcal{L}
=
-
\sum_{t \in \mathcal{A}}
\log p_\theta(x_t \mid x_{<t})
$$

This avoids teaching the model to autocomplete user queries as if they were desirable outputs.

## 6. Full fine-tuning vs LoRA

Both are viable.

### Full fine-tuning

Use when:

- the model is small enough
- the dataset is large enough
- you want the cleanest highest-capacity adaptation

### LoRA

Use when:

- compute or memory is tight
- rapid iteration matters
- you do not need every weight to move

The tradeoff is not only quality. It is also:

- engineering simplicity
- distributed-training requirements
- checkpoint size

For a deeper decision framework, see [LoRA vs Full Fine-Tuning](/atlas/ai/training/optimization/lora-vs-full-finetuning).

## 7. The few hyperparameters that matter first

For many SFT setups, the first-order knobs are:

- learning rate
- effective batch size
- sequence packing
- masking policy

Start with stable defaults, then tune after the formatting and data pipeline are known-good.

## 8. SFT is also a debugging stage

SFT surfaces problems that would be expensive to discover later:

- template bugs
- lost system messages
- broken multi-turn behavior
- malformed reasoning traces
- odd data-style biases

This is why SFT should be paired with:

- direct inspection of rendered samples
- manual conversation tests
- small eval suites

## Practical Heuristics

- Start post-training with SFT unless you have a strong reason not to.
- Use baby baselines to validate the recipe before optimization.
- Choose datasets for behavior, not just benchmark pedigree.
- Mask to assistant tokens by default.
- Use direct chatting to catch bugs that metrics miss.

## Related

- [Chat Templates for LLMs](/atlas/ai/inference-serving/chat-templates-for-llms)
- [Hybrid Reasoning Models](/atlas/ai/architectures/hybrid-reasoning-models)
- [LoRA vs Full Fine-Tuning](/atlas/ai/training/optimization/lora-vs-full-finetuning)
- [The Smol Training Playbook](/atlas/ai/training/smol-training-playbook)
- [The Smol Training Playbook](https://huggingface.co/spaces/HuggingFaceTB/smol-training-playbook)
