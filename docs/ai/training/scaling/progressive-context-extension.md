---
title: "Progressive Context Extension"
date: 2026-06-08
lastmod: 2026-06-08
tags:
  - ai/training
  - scaling
  - long-context
draft: false
---

## Summary

Progressive context extension is the strategy of training most of the model at shorter, cheaper context lengths, then extending to the final long context in a later focused phase. The main idea is that long-context adaptation is often fast and does not need to be paid for during the whole run.

## Concepts

- **Mid-training:** a later supervised training stage after main pretraining, often used for domain emphasis or context extension.
- **Repacking:** rebuilding training sequences at a longer context length without changing the underlying data mixture.
- **Context extension:** adapting a model from one maximum sequence length to a longer one.
- **Distribution shift:** mismatch between the positions or lengths seen during training and those seen during evaluation.

## 1. Why not train max context from the start

Long context is expensive.

Attention, communication, activation memory, and checkpointing costs all rise sharply with sequence length. So if the only goal is to end up with a long-context model, paying that cost from token zero is often wasteful.

The better question is:

> when does the model actually need long-context exposure?

## 2. The staged recipe

A common recipe is:

1. pretrain at a short or moderate context
2. mid-train at a somewhat longer context
3. extend late to the final target context

The key trick is that the extension phase can be much shorter than the main run.

## 3. Repack the same data mixture

One robust strategy is to keep the same mixture weights and simply repack the data at longer sequence lengths.

Why this helps:

- reduces distribution shift in source composition
- preserves the same overall curriculum
- exposes more of the naturally long documents without inventing a new dataset

This is especially useful for:

- code repositories
- academic PDFs
- instructional documents
- books

## 4. What the model is learning during extension

The long-context phase is often less about learning new content and more about calibrating mechanisms:

- positional behavior
- attention patterns
- retrieval over distant positions
- stability on out-of-distribution token indices

This is why extension can adapt surprisingly fast.

## 5. Fast adaptation

A strong empirical pattern is:

> most of the long-context gain happens early in the extension phase

In the MAI report, the majority of the long-context NLL improvement happened in roughly the first `1-10%` of long-context training.

This suggests:

- the model already has much of the needed representation
- the extension phase mainly aligns it to longer positions

## 6. Why this does not usually hurt short-context quality

A natural concern is that long-context training could degrade short-context performance.

In many staged setups, that degradation is small or negligible if:

- the extension is not too distribution-shifting
- the training remains on the same broad corpus
- the model is not forced into a radically different objective

That means you can often get long-context behavior “for cheap” relative to full-run long-context training.

## 7. Practical recipe

A practical recipe looks like:

- choose an MFU-friendly context for most of the run
- use that length for the expensive bulk of training
- introduce long-context NLL tasks in the validation suite
- repack the same corpus at the target length
- run a much shorter final extension phase

This is usually a better compute tradeoff than training at the maximum context from the beginning.

## 7.1 Fresh extension stages can beat “attach it at the end”

The Smol Training Playbook adds a useful nuance: when extending from `4k -> 32k -> 64k`, they found that starting a **fresh learning-rate schedule** for each long-context stage over about `50B` tokens worked better than simply adding long-context training onto the tail of the main decay phase.

That suggests the extension phase is not just a tiny epilogue. It may deserve its own short controlled adaptation stage.

## 7.2 You may not need a special long-document mixture

It is tempting to assume that long-context extension must rely on aggressively upsampled long documents or synthetic retrieval data.

The SmolLM3 long-context ablations are a useful counterexample:

- books, articles, and synthetic long-context examples did not outperform the baseline late-stage mixture
- the likely reason was that the baseline already contained enough naturally long web and code documents

So before curating a special extension corpus, ask whether your existing mixture already has enough long-form structure.

## 7.3 Train somewhat short, extrapolate somewhat longer

Another useful pattern is:

- train to a strong but still affordable context length
- extrapolate somewhat beyond it at inference

SmolLM3 trained to `64k` and extrapolated to `128k` with `YaRN`, which worked better than extrapolating from a `32k` checkpoint. But the next jump to `256k` degraded.

So the safe rule is:

- extrapolate beyond training length
- but not arbitrarily far

## 8. What the MAI report adds

The MAI report supports three useful claims:

- short-context mid-training plus a short extension phase can match much more expensive always-long training
- the adaptation curve is very front-loaded
- there is no strong reason to pay full long-context cost if a final extension phase is enough

That makes progressive context extension one of the highest-leverage long-context tricks in modern pretraining.

## 9. What the Smol Training Playbook adds

The Smol Training Playbook adds several useful details:

- extension can be staged with fresh short schedules
- a baseline mixture may already be sufficient for long-context adaptation
- `ABF` and `YaRN` should be tuned jointly with the extension target
- training closer to the intended inference length improves extrapolation quality

## Related

- [RoPE Scaling](/atlas/ai/architectures/transformers/rope-scaling)
- [Attention Variants](/atlas/ai/architectures/transformers/attention-variants)
- [MAI-Thinking-1: Building a Hill-Climbing Machine](/atlas/ai/architectures/model-reports/mai-thinking-1-building-a-hill-climbing-machine)
