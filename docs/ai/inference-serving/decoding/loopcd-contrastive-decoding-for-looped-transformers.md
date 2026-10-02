---
title: "LoopCD: Contrastive Decoding from Recurrent Transformer States"
date: 2026-10-02
lastmod: 2026-10-02
tags:
  - ai/inference
  - decoding
  - looped-transformers
  - test-time-compute
draft: false
---

## Summary

LoopCD guides a looped transformer's final prediction using an earlier recurrent state, without retraining. Its update is `final + strength × (final − reference)`, applied to logits or hidden states. The paper evaluates Ouro, Huginn, Parcae, and Looped-Qwen3. [Liu et al., paper](https://arxiv.org/pdf/2610.02185)

The useful design question is whether the *direction* of refinement carries information that the final representation alone leaves unused. The explanations and worked examples below develop that idea; they are not additional experimental findings.

## 1. Where the two predictions come from

A recurrent block processes the same token prefix several times with shared weights:

```text
prefix → initial representation → loop 1 → ... → loop R → output layers
                                  reference     final
```

Both states describe the same next-token decision after different amounts of computation. Retaining a reference state therefore provides an internal comparison point without running a separate small model.

For a model with fixed layers after the recurrent block, those layers are called the **coda**. Reference and final representations need the same output interface for a meaningful logit comparison.

## 2. Two guidance spaces

Let `h_ref` and `h_final` be recurrent states, and `decode` include the coda, final normalization, and vocabulary projection.

```text
LoopCD-Logits:
    z_ref   = decode(h_ref)
    z_final = decode(h_final)
    z_guided = z_final + w * (z_final - z_ref)

LoopCD-Hidden:
    h_guided = h_final + w * (h_final - h_ref)
    z_guided = decode(h_guided)
```

Logit guidance requires another output pass. Hidden guidance adds vector operations while retaining one output pass. Huginn's noisy initialization requires a later hidden reference after burn-in. Excessive guidance can damage generation. [Paper, §§3 and 5; Appendix E](https://arxiv.org/pdf/2610.02185)

The adaptive logit variant uses `w = w_max * (1 - (p_top1 - p_top2))`. Computing those unguided probabilities for hidden guidance would require another output pass, losing its cost advantage. [Paper, §3.2](https://arxiv.org/pdf/2610.02185)

### Worked example: amplify a change in preference

Suppose two candidate tokens have these illustrative logits:

| State | Token A | Token B |
| :--- | ---: | ---: |
| Reference | 2.0 | 1.0 |
| Final | 2.1 | 2.0 |
| Change | 0.1 | 1.0 |
| Guided, `w = 0.5` | 2.15 | 2.50 |

The final prediction slightly prefers A, but refinement increased B much more. Extrapolation flips the choice to B. Whether this is useful depends on whether that change tracks correctness.

This also explains why guidance can fail: if refinement favors a wrong answer, extrapolation amplifies the error. It is a heuristic for reading internal computation, not a correctness verifier.

### Why hidden and logit guidance differ

For a purely linear output map `W`, algebra gives:

```text
W * (h_final + w*(h_final-h_ref))
    = W*h_final + w*(W*h_final-W*h_ref)
```

Actual output paths include normalization and sometimes several nonlinear transformer layers. The linear identity then ceases to apply. The variants can produce different rankings even with the same states and guidance strength.

## 3. Reported evidence and its scope

- Ouro-2.6B-Thinking AIME 2024 pass@1: **61.88% → 73.33%**, using logit guidance.
- Huginn HumanEval pass@1: **22.56% → 31.71%**, using hidden guidance.
- Half-depth experiments report **22.5–48.2% fewer forward FLOPs** while recovering full-depth baseline quality on a multiple-choice suite.

The compute accounting uses a 512-token prefill and theoretical arithmetic, rather than measured serving latency. Strengths and references are selected through screening sweeps. [Paper, Table 1; Appendices B and D](https://arxiv.org/pdf/2610.02185)

## 4. Practical implementation considerations

These are engineering implications of the update, not a claim that a production implementation is supplied by the paper.

1. Capture a state at a **completed loop boundary** and identify the exact normalization/coda interface it enters.
2. Keep baseline and guided runs on the same checkpoint, prompt, loop count, and sampling settings for the initial comparison.
3. Begin with a fixed `w`; test `w = 0` to recover the baseline numerically.
4. Preserve unmodified reference/final tensors until guidance is computed. Beware of in-place updates and buffers reused by recurrent execution.
5. Treat coda KV state carefully when evaluating two branches. A reference pass must not overwrite the final branch's cache inadvertently.
6. Measure peak memory, prefill time, time per generated token, and throughput under realistic batches.

An additional output pass can be expensive when the post-loop stack is large. Likewise, retaining a hidden vector has negligible arithmetic cost relative to a transformer block but may still affect memory traffic and execution scheduling. The deployed cost depends on the model layout.

## 5. How to evaluate it for your own model

I would compare fixed-loop baseline, guided fixed-loop execution, and a shorter guided run. Use a held-out set for choosing strength, then lock it before evaluating final benchmarks.

Track quality and token counts as well as execution cost. A decoder that improves answer accuracy but substantially lengthens reasoning can erase savings from fewer loops. Inspect repeated-token failures and sensitivity to temperature, rather than assuming the guidance behaves uniformly across scoring and generation.

For vision, a possible experiment is to apply the same extrapolation to states of a recurrent backbone before its task head. That remains a hypothesis: semantic refinement, state alignment, and task quality would need independent testing.

## Related

- [Looped Language Models: Ouro](/atlas/ai/architectures/transformers/looped-language-models-ouro)
- [Recirculation](/atlas/ai/architectures/transformers/recirculation-inference-time-recurrence)
- [Test-Time Compute](/atlas/ai/inference-serving/performance/test-time-compute)
- [Decoding, Top-k Sampling, and Temperature](/atlas/ai/inference-serving/decoding/llm-decoding-top-k-sampling-and-temperature)

## Source

- Liu et al., [Decoding Looped Transformers Better for (Almost) Free](https://arxiv.org/pdf/2610.02185), October 1, 2026, v1.
