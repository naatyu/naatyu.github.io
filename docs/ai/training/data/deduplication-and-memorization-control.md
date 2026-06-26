---
title: "Deduplication and Memorization Control"
date: 2026-06-08
lastmod: 2026-06-26
tags:
  - ai/training
  - data
  - pretraining
draft: false
---

## Summary

Deduplication is not just data hygiene. At large model scale, it is a direct intervention on effective data novelty, memorization risk, and scaling behavior.

## Concepts

- **Exact duplicate:** byte-identical or hash-identical content.
- **Fuzzy duplicate:** near-duplicate content with small lexical or formatting changes.
- **Semantic duplicate:** independently written content that is still extremely similar in meaning or task structure.
- **Drop order:** a priority rule for deciding which dataset keeps duplicated content during cross-dataset deduplication.

## 1. Why dedup matters more at scale

Large models can absorb and replay repeated content much more aggressively than smaller ones.

If a training corpus contains many repeated documents, the model sees:

- less real novelty
- more chances to memorize
- weaker generalization pressure

So a duplicated corpus is not just inefficient. It changes the effective scaling regime by reducing the number of unique useful tokens.

## 2. Different duplicate types need different tools

A practical dedup pipeline usually has multiple layers.

### Boilerplate removal

Remove repeated page furniture:

- headers
- footers
- nav bars
- sidebars
- parser artifacts

This matters especially for web corpora where boilerplate can dominate token count.

### Exact dedup

Remove identical documents or fragments using:

- raw hashes
- normalized hashes
- byte-level identity

This is the simplest and cheapest dedup stage.

### Fuzzy dedup

Remove near-duplicates that differ only slightly:

- mirrored pages
- reformatted copies
- lightly edited reposts

A common approach is MinHash + LSH with a similarity threshold.

### Template dedup

Some web pages differ lexically but are generated from the same template.

Examples:

- low-value calculators
- directory pages
- form-generated stubs

Template-aware dedup targets the repeated page skeleton rather than the raw text surface.

### Semantic dedup

Two documents can be highly redundant even if they are not close lexically.

Examples:

- repeated coding exercises
- standard interview problems
- many copies of the same conceptual explanation

This is where embedding-based clustering helps.

## 3. Cross-dataset dedup is different from within-dataset dedup

Within-dataset dedup removes redundancy inside one source family.

Cross-dataset dedup decides:

> which source gets to keep overlapping content

This requires a **drop order**:

- keep the duplicate in the highest-priority source
- drop it from lower-priority sources

Why this matters:

- changing one dataset can effectively change another dataset's content share
- source-level attribution becomes misleading if overlap is not controlled

So any serious source-ablation program needs to know how cross-source duplicates are resolved.

## 4. Dedup and memorization are linked

Repeated exposure increases the chance that the model:

- predicts content with near-certainty
- memorizes exact strings or structures
- shows local gains that do not transfer to broader capability

This is one reason why duplicated high-quality data can still be harmful if oversampled too aggressively.

## 5. Memorization-aware epoch capping

A useful operational idea is to cap source exposure based not only on source size, but on how memorized the source already appears.

One practical proxy is:

- compare two checkpoints
- measure how much validation-loss improvement comes from tokens with extremely low NLL

If a source gets much of its gain from already-near-certain tokens, that suggests:

- memorization
- repeated structure
- reduced marginal value from further exposure

Then you can assign stricter epoch caps to that source in later training.

## 6. Dedup is also a scaling intervention

This is the key shift in viewpoint:

- at small scale, duplicates may just look wasteful
- at large scale, duplicates can change what the model is able to keep learning

As capacity grows, the model saturates redundant data earlier. So rigorous dedup can improve not just cleanliness, but scaling efficiency and downstream robustness.

In data-constrained scaling terms, dedup increases the gap between:

$$
D = \text{raw training tokens}
$$

and:

$$
U_D = \text{unique useful tokens}
$$

The more duplicated the corpus is, the more raw token count overstates effective data. This matters because repeated tokens can have diminishing value and can create a model-size-dependent overfitting penalty.

## 7. Practical pipeline

A good large-scale dedup and memorization-control loop looks like:

1. Remove boilerplate.
2. Remove exact duplicates.
3. Remove fuzzy duplicates.
4. Detect templated families.
5. Cluster semantic duplicates where it matters.
6. Apply cross-dataset drop order.
7. Track source-level memorization proxies across checkpoints.
8. Tighten epoch caps for sources showing saturated learning.

## 8. What the MAI report adds

The MAI report is especially useful because it connects all of these:

- multiple dedup stages
- semantic dedup in code-heavy corpora
- cross-dataset drop order
- scaling sensitivity to novelty
- memorization-aware epoch caps

That makes deduplication part of training design, not just corpus cleanup.

## Related

- [Data Mixture Optimization](/atlas/ai/training/data/data-mixture-optimization)
- [Data-Constrained Scaling Laws](/atlas/ai/training/scaling/data-constrained-scaling-laws)
- [MAI-Thinking-1: Building a Hill-Climbing Machine](/atlas/ai/architectures/model-reports/mai-thinking-1-building-a-hill-climbing-machine)
