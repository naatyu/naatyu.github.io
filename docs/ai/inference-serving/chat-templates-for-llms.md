---
title: "Chat Templates for LLMs"
date: 2026-06-08
lastmod: 2026-06-08
tags:
  - ai/inference
  - llm
  - post-training
draft: false
---

## Summary

A chat template is the serialization contract between structured dialogue data and a causal language model. It affects not only inference formatting, but also SFT behavior, tool use, reasoning-mode control, loss masking, and compatibility with serving engines. Small template mistakes can create large downstream behavior bugs.

## Concepts

- **Chat template:** rules for converting role-structured messages into a single token sequence.
- **System role:** a high-priority instruction channel that sets assistant behavior.
- **Assistant-only loss masking:** training only on assistant tokens rather than all dialogue tokens.
- **Reasoning mode:** explicit formatting that tells the model whether to produce hidden or extended reasoning.
- **Inference compatibility:** whether a template is easy for runtimes like vLLM or SGLang to parse for tools or reasoning sections.

## 1. Why chat templates matter

At a glance, a chat template looks like formatting glue. In practice, it is part of the model interface.

It decides:

- how roles are represented
- whether users can override the system prompt
- how tools are serialized
- where reasoning content lives
- which tokens count toward the training loss

So the template influences both:

- **how the model is trained**
- **how the model is used**

## 2. A template is a contract

A good mental model is:

$$
\text{messages} \xrightarrow{\text{template}} \text{token sequence}
$$

If training, evaluation, and inference do not all agree on this contract, the model can silently degrade.

Typical failure modes:

- system prompts being dropped or misplaced
- assistant outputs being trained under the wrong delimiter
- tool calls being formatted incompatibly with inference parsers
- reasoning sections being discarded or retained incorrectly across turns

## 3. Main design questions

When choosing or designing a template, the most useful questions are:

### A. Can users customize the system role?

Some use cases need a stable fixed system prompt.
Others need full user control over assistant behavior.

The template should make that policy explicit.

### B. Does the model need tools?

If the model must call tools, the template must define:

- tool-call syntax
- tool-response syntax
- how tool messages are interleaved with assistant messages

### C. Is it a reasoning model?

Reasoning models often need explicit markers such as:

```text
<think> ... </think>
```

or system-level switches like:

```text
/think
/no_think
```

Without a clear template rule, the model may mix concise and extended styles unpredictably.

### D. Will inference engines understand it?

A template that is elegant for training but awkward for serving can create downstream friction. Compatibility with common parsers matters.

## 4. Training implications

### Assistant-only loss masking

In SFT, it is often undesirable to train the model to predict user tokens. The actual target is usually the assistant behavior.

So the effective loss is often:

$$
\mathcal{L}
=
-
\sum_{t \in \mathcal{A}}
\log p_\theta(x_t \mid x_{<t})
$$

where $\mathcal{A}$ is the set of assistant tokens.

This makes the template part of the masking logic, because it must expose which spans belong to the assistant.

### Multi-turn reasoning

Some reasoning templates discard earlier reasoning traces during inference to avoid context blow-up. That can be sensible at runtime but undesirable during training if it removes conditioning information the model should learn from.

So training and inference may intentionally use slightly different rules about what is retained.

## 5. Good defaults

The Smol Training Playbook's practical view is sound:

- `ChatML` is a good simple starting point
- `Qwen`-style templates are good starting points for hybrid reasoning and tools

The important part is not the brand name of the template. It is whether the template matches your requirements cleanly.

## 6. Why this deserves explicit iteration

Template bugs are hard to detect with aggregate metrics alone.

Examples of template-related failures:

- the model ignores persona or system instructions
- tool outputs are malformed
- reasoning mode does not switch reliably
- multi-turn formatting breaks after the first turn

This is why template design should be validated with:

- small SFT baselines
- direct inspection of rendered examples
- manual conversation tests

## Practical Heuristics

- Treat the chat template as part of the model recipe.
- Make system-role and tool behavior explicit.
- Use assistant-only masking by default for SFT unless you have a reason not to.
- Validate reasoning retention rules separately for training and inference.
- Test rendered examples before large runs.

## Related

- [Supervised Fine-Tuning for LLMs](/atlas/ai/training/optimization/supervised-fine-tuning-for-llms)
- [Hybrid Reasoning Models](/atlas/ai/architectures/hybrid-reasoning-models)
- [The Smol Training Playbook](/atlas/ai/training/smol-training-playbook)
- [The Smol Training Playbook](https://huggingface.co/spaces/HuggingFaceTB/smol-training-playbook)
