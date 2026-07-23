---
title: "Speculative Decoding"
date: 2026-07-23
lastmod: 2026-07-23
tags:
  - ai/inference
  - decoding
  - performance
draft: false
---

## Summary

Speculative decoding accelerates autoregressive generation by letting a cheap **drafter** propose several tokens and asking the target model to verify them in parallel. When implemented with exact acceptance sampling, it preserves the target model's output distribution; the speedup comes from reducing the number of expensive sequential target-model calls.

The central systems tradeoff is:

$$
\text{drafter overhead}
\quad \text{vs.} \quad
\text{accepted tokens per target step}
$$

A more accurate drafter is not automatically better if it is too slow.

## Concepts

- **Target model:** the model whose output distribution must be preserved.
- **Drafter:** a smaller model or head that proposes future tokens cheaply.
- **Acceptance rate:** fraction of proposed tokens accepted by the verifier.
- **Draft length:** number of tokens proposed before verification.
- **Verification:** one target-model pass that scores multiple proposed positions.
- **Feature-level drafter:** a drafter conditioned on target-model hidden states, not only previous token IDs.

## 1. Why normal decoding is sequential

Autoregressive generation factorizes:

$$
p(x_{1:T})
=
\prod_{t=1}^{T} p(x_t \mid x_{<t})
$$

The next token is normally sampled before the model can compute the following position. This creates a latency-bound loop:

```text
target forward -> sample one token -> target forward -> ...
```

Modern accelerators can score multiple positions efficiently, but ordinary decoding exposes only one new position at a time.

## 2. Speculate, then verify

Speculative decoding changes the loop:

1. the drafter proposes $k$ future tokens
2. the target model scores those $k$ positions together
3. an acceptance rule keeps a valid prefix
4. generation resumes at the first rejected position

If most proposals are accepted, one expensive target pass advances several output tokens.

The rough performance condition is:

$$
\frac{\text{accepted tokens}}
{\text{target verification cost} + \text{drafting cost}}
>
\frac{1}
{\text{ordinary target step cost}}
$$

This is why acceptance rate alone is insufficient. Drafter latency, synchronization, memory bandwidth, and verification kernels all matter.

## 3. Main drafter designs

### Separate draft model

Use a smaller language model with the same tokenizer.

Advantages:

- conceptually simple
- draft model can be trained independently
- target architecture need not change

Costs:

- separate weights and KV cache
- separate prefill
- hidden-state knowledge from the target is unavailable

### Parallel prediction heads

Attach heads that predict several offsets from one target hidden state.

Advantages:

- small additional parameter cost
- proposals can be produced in parallel

Costs:

- later proposals are not naturally conditioned on sampled earlier draft tokens
- fixed prediction horizon
- feature uncertainty grows with offset

### Autoregressive feature-level drafter

Condition a small autoregressive transformer on target-model activations and cached features.

Advantages:

- each proposal conditions on previous draft tokens
- target features provide a stronger starting point
- draft length can remain flexible

Costs:

- tighter coupling to the target architecture
- cross-attention and cache plumbing add implementation complexity

## 4. Gemma 4's MTP drafter

Gemma 4 ships an autoregressive multi-token-prediction drafter with each target model.

The drafter receives:

- the target's previous final-layer activation
- token embeddings
- the target model's KV cache through cross-attention

Its core is a four-layer transformer:

- three local-attention layers
- one global-attention layer

Because it reuses target features and cache, it avoids a separate drafter prefill. Unlike a fixed set of offset heads, the autoregressive design can support arbitrary draft lengths.

The released drafters range from about `76M` parameters for E2B to `500M` for the 31B model. Their size is small relative to the target but still large enough that output projection cost matters.

## 5. Vocabulary projection can dominate a small drafter

Gemma 4 uses a `262k` vocabulary. A naive draft-token projection costs:

$$
O(dV)
$$

per step, where $d$ is drafter width and $V$ is vocabulary size.

For E2B and E4B, Gemma 4 clusters tokens and first performs a top-k cluster selection. This reduces the final projection from:

$$
d \times 262{,}000
$$

to:

$$
d \times 4{,}096
$$

while preserving a similar reported acceptance rate.

This yields a broader design rule:

> optimize the drafter's entire critical path, including its output layer; parameter count alone does not determine drafting latency.

## 6. What determines speedup

Important variables are:

- target-model size
- drafter latency
- draft length
- acceptance rate
- batch size
- prompt vs. decode workload
- memory cost of extra weights and caches
- verification-kernel efficiency

Speculative decoding is usually most attractive when:

- target decoding is expensive
- batch size is small enough to be latency-bound
- output tokens are predictable enough for high acceptance
- the drafter remains much cheaper than the target

It may help less when:

- large batches already saturate the accelerator
- sampling temperature is high
- the domain differs from drafter training
- proposals frequently diverge
- serving complexity or memory is the binding constraint

## 7. Implementation checks

- Measure accepted tokens per target call, not only acceptance percentage.
- Include drafter time in end-to-end latency.
- Test across temperatures and real prompt domains.
- Verify that the sampler preserves the intended target distribution.
- Account for drafter weights and KV state in concurrency estimates.
- Test streaming parsers with multi-token output chunks.
- Treat the target, drafter, tokenizer, and chat template as a compatible bundle.

## Related

- [LLM Decoding: Top-k Sampling and Temperature](/atlas/ai/inference-serving/decoding/llm-decoding-top-k-sampling-and-temperature)
- [KV Cache](/atlas/ai/inference-serving/caching/kv-cache)
- [Chat Templates for LLMs](/atlas/ai/inference-serving/chat-templates-for-llms)
- [Gemma 4 Technical Report](/atlas/ai/architectures/model-reports/gemma-4-technical-report)

## Sources

- Yaniv Leviathan, Matan Kalman, Yossi Matias, [Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192)
- Gemma Team, [Gemma 4 Technical Report](https://arxiv.org/abs/2607.02770)
