---
title: "BytePiece and Stochastic Tokenization"
date: 2026-06-11
lastmod: 2026-06-11
tags:
  - ai/nlp
  - ai/llm
  - tokenization
draft: false
---

## Summary

BytePiece is a byte-level tokenizer idea that aims for higher compression and cleaner tokenization by training a unigram-like byte n-gram language model. Stochastic tokenization extends deterministic tokenization by sampling segmentations rather than always choosing the single best segmentation.

The core motivation:

$$
\text{tokenization is compression}
$$

and a better tokenizer reduces sequence length without losing robustness.

## Concepts

- **BytePiece:** byte-level tokenizer based on byte n-gram language modeling.
- **Unigram tokenizer:** tokenizer that assigns probabilities to tokens and chooses segmentations by likelihood.
- **Viterbi decoding:** dynamic program for the most likely segmentation.
- **Viterbi sampling:** sampling segmentations according to their probabilities.
- **Subword regularization:** training with randomized segmentations to improve robustness.

## 1. Tokenizer training as compression

A tokenizer maps text into token sequences:

$$
x \rightarrow z_{1:n}
$$

A good tokenizer should make $n$ small while preserving full reversibility.

Byte-level tokenizers start from bytes, so they can represent any input:

$$
\text{any string} \rightarrow \text{bytes} \rightarrow \text{tokens}
$$

The compression goal is:

$$
\min \mathbb{E}[\text{tokens per byte}]
$$

subject to:

- reversibility
- manageable vocabulary size
- good multilingual/code behavior
- robust rare-character handling

## 2. BytePiece idea

BPE learns deterministic merge rules.

BytePiece is closer to a unigram model over byte n-grams. It assigns a probability to each candidate token and scores a segmentation:

$$
z_{1:n}
$$

by:

$$
P(z_{1:n})
=
\prod_{i=1}^{n}P(z_i)
$$

or:

$$
\log P(z_{1:n})
=
\sum_{i=1}^{n}\log P(z_i)
$$

The best segmentation is:

$$
z^*
=
\arg\max_z
\sum_i \log P(z_i)
$$

This can be solved with Viterbi decoding.

## 3. Viterbi decoding for tokenization

Let:

$$
dp[t]
$$

be the best log-probability for segmenting the prefix ending at byte position $t$.

Then:

$$
dp[t]
=
\max_{s<t}
\left(
dp[s]
+
\log P(x_{s:t})
\right)
$$

where $x_{s:t}$ must be a vocabulary token.

This gives the single best segmentation.

## 4. Why stochastic tokenization

Deterministic tokenization always maps one string to one token sequence:

$$
x \mapsto z^*
$$

But many segmentations may be plausible.

Stochastic tokenization samples:

$$
z \sim P(z\mid x)
$$

where:

$$
P(z\mid x)
\propto
\prod_i P(z_i)
$$

This acts as data augmentation:

- the model sees multiple segmentations
- it becomes less brittle to token boundaries
- rare words can be decomposed differently across training
- spelling/noise robustness can improve

This is the same broad idea as SentencePiece subword regularization.

## 5. Viterbi sampling

Instead of taking the max in Viterbi, we compute a partition function:

$$
Z[t]
=
\sum_{s<t}
Z[s]P(x_{s:t})
$$

Then sample a previous boundary $s$ with probability:

$$
P(s\mid t)
=
\frac{Z[s]P(x_{s:t})}{Z[t]}
$$

Walking backward from the end samples a segmentation according to its probability.

This replaces:

$$
\arg\max
$$

with:

$$
\text{sample}
$$

## 6. Why this matters for LLMs

Tokenization affects:

- effective context length
- training FLOPs
- multilingual fairness
- code modeling
- number handling
- robustness to typos and Unicode

A higher-compression tokenizer can reduce training and inference cost because transformer cost depends on token count.

But too much compression can hurt:

- compositionality
- rare-word handling
- arithmetic
- copy behavior
- token-level alignment with downstream tools

So tokenizer quality is not just bytes per token. It is a multi-objective architecture choice.

## 7. Practical tokenizer evaluation

Track:

- bytes per token
- tokens per word
- tokens per line of code
- per-language fertility
- digit segmentation behavior
- reversibility
- rare Unicode behavior
- compression on markdown, JSON, code, math
- downstream evals after training

## Related

- [Byte Pair Encoding](/atlas/ai/modalities/nlp/byte-pair-encoding)
- [Prediction, Compression, and Entropy](/atlas/ai/foundations/prediction-compression-and-entropy)
- [Entropy](/atlas/math/probability/entropy)

## Sources

- Su Jianlin, [BytePiece：更纯粹、更高压缩率的Tokenizer](https://kexue.fm/archives/9752)
- Su Jianlin, [随机分词浅探：从Viterbi Decoding到Viterbi Sampling](https://kexue.fm/archives/9768)
