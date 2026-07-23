---
title: "Chat Templates for LLMs"
date: 2026-06-08
lastmod: 2026-07-23
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

## 7. Rollout and deployment templates must agree exactly

The Laguna report adds a useful RL-specific lesson:

> rollout-time rendering and deployment-time rendering should be treated as an invariant, not merely as “similar enough.”

In multi-turn and tool-use RL, tiny differences such as:

- a missing newline
- an extra trailing space
- a slightly different assistant-message wrapper

can create a real train/deploy mismatch.

A robust approach is:

- store the raw rollout tokens
- re-render the same history through the production template
- assert exact equality with the rollout prefix

This is especially valuable when the inference stack and the RL harness evolve independently.

## 8. Streaming parsers must handle multi-token deltas

Reasoning and tool-call parsers are often written with an implicit assumption:

> one streaming delta equals one token

That assumption can fail under:

- speculative decoding
- merged deltas
- fast producer / slow consumer pipelines

Then block-boundary logic breaks, for example:

- reasoning end tags are misdetected
- trailing content after a boundary token is dropped
- tool-call blocks become malformed

So for reasoning/tool templates, parser robustness is part of the interface design.

## 9. Gemma 4: checkpoint type changes the terminal token

Gemma 4 documents a small but critical distinction:

- pretrained checkpoints terminate generation with `<eos>`
- instruction-tuned checkpoints terminate a turn with `<turn|>`

Fine-tuning data must use the terminal token expected by the selected checkpoint type. Treating them as interchangeable creates a direct train/inference mismatch.

Gemma 4 also exposes separate control structures for:

- thinking activation: `<|think|>` in the leading system turn
- reasoning traces: `<|channel>thought ...<channel|>`
- tool declarations
- tool calls
- system, user, and model turns

The tokenizer requires a real BOS token to be added through tokenization rather than tokenizing the literal string `"[BOS]"`. This is exactly the kind of detail that should be tested on rendered token IDs before an SFT run.

## Practical Heuristics

- Treat the chat template as part of the model recipe.
- Make system-role and tool behavior explicit.
- Use assistant-only masking by default for SFT unless you have a reason not to.
- Validate reasoning retention rules separately for training and inference.
- Test rendered examples before large runs.
- Treat rollout-template and deployment-template equality as a hard requirement for RL systems.

## Related

- [Supervised Fine-Tuning for LLMs](/atlas/ai/training/optimization/supervised-fine-tuning-for-llms)
- [Hybrid Reasoning Models](/atlas/ai/architectures/hybrid-reasoning-models)
- [The Smol Training Playbook](/atlas/ai/training/smol-training-playbook)
- [The Smol Training Playbook](https://huggingface.co/spaces/HuggingFaceTB/smol-training-playbook)
- [Gemma 4 Technical Report](/atlas/ai/architectures/model-reports/gemma-4-technical-report)
