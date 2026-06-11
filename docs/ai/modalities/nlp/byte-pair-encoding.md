---
title: "Byte Pair Encoding"
date: 2026-05-19
lastmod: 2026-06-11
tags:
  - ai/nlp
  - ai/llm
  - tokenization
draft: false
---

## Summary

Byte Pair Encoding (BPE) is a tokenizer training algorithm that builds a vocabulary by repeatedly merging the most frequent adjacent symbols; byte-level BPE starts from raw bytes so every possible input is representable.
## Concepts
- **Tokenizer:** maps raw text to discrete token IDs and back.
- **Vocabulary:** the set of tokens the model can emit.
- **Merge rule:** a learned rule that combines two adjacent symbols into a larger token.
- **Pre-tokenization:** a first pass that splits raw text into chunks before BPE merges are learned or applied.
- **Byte-level BPE (BBPE):** BPE where the base alphabet is bytes, not Unicode characters or words.
- **Fertility:** average number of tokens needed to represent a word or text span.
- **Special token:** a reserved token with semantic meaning, e.g. BOS, EOS, padding, tool-call delimiters.

## Content

### Why tokenization exists

Transformers do not directly operate on strings. They operate on token IDs:

$$text \rightarrow tokens \rightarrow embeddings$$

The tokenizer decides the model's atomic units. This matters because tokenization affects:

- sequence length
- training and inference FLOPs
- multilingual fairness
- robustness to typos
- arithmetic and code behavior
- how expensive long context is

Bad tokenization can make simple text expensive. For example, a tokenizer trained mostly on English may compress English well but split low-resource languages into many more tokens.

### Standard BPE

BPE starts from a base vocabulary and repeatedly merges the most frequent adjacent pair.

Toy corpus:

```text
low lower lowest
```

Initial symbols might be characters:

```text
l o w
l o w e r
l o w e s t
```

If `l o` is the most frequent pair, merge it:

```text
lo w
lo w e r
lo w e s t
```

Then maybe merge `lo w`:

```text
low
low e r
low e s t
```

After enough merges, frequent substrings become single tokens.

The training loop is conceptually:

```python
vocab = initial_symbols(corpus)
merges = []

while len(vocab) < target_vocab_size:
    pair = most_frequent_adjacent_pair(corpus_symbols)
    merge(pair)
    merges.append(pair)
```

At inference, the tokenizer applies the learned merges in priority order.

### Byte-level BPE

Classic BPE can start from characters or word fragments. Byte-level BPE starts from the 256 possible byte values.

This gives a strong guarantee:

&gt; any valid byte sequence can be represented

So the tokenizer does not need an unknown token for arbitrary Unicode text, emojis, weird whitespace, corrupted text, or code bytes.

The trade-off is that bytes are not human characters. A Unicode character can take multiple bytes:

```text
é -> c3 a9
🙂 -> f0 9f 99 82
```

Byte-level BPE can later learn merges that combine these byte sequences into useful tokens, but rare scripts or rare characters may still be split into many tokens.

### Why GPT-style tokenizers use regex pre-tokenization

If BPE is trained directly over raw text, it can learn ugly merges across categories:

- end of one word + start of next word
- letters + punctuation
- digits + letters
- whitespace + arbitrary symbols

GPT-style BPE first splits text into regex chunks, then learns BPE merges inside those chunks. This constrains what merges are possible.

The GPT-2 regex pattern is commonly written as:

```python
pat = r"""'s|'t|'re|'ve|'m|'ll|'d| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+"""
```

What each part does:

| Pattern | Meaning |
|---|---|
| `'s|'t|'re|'ve|'m|'ll|'d` | common English contractions |
| ` ?\p\{L\}+` | optional leading space + letters |
| ` ?\p\{N\}+` | optional leading space + numbers |
| ` ?[^\s\p\{L\}\p\{N\}]+` | optional leading space + punctuation/symbols |
| `\s+(?!\S)` | trailing whitespace at end of text or before no non-space |
| `\s+` | other whitespace |

The leading optional space is important. It lets tokens encode word starts:

```text
" hello" can become one token-like unit
"hello" is different from " hello"
```

This is why GPT-style tokenizers often have tokens that visually start with a space.

### Newer GPT-style regex

Newer OpenAI tokenizers use more refined regexes. A common `cl100k_base`-style pattern is:

```python
pat = r"""(?i:'s|'t|'re|'ve|'m|'ll|'d)|[^\r\n\p{L}\p{N}]?\p{L}+|\p{N}{1,3}| ?[^\s\p{L}\p{N}]+[\r\n]*|\s*[\r\n]+|\s+(?!\S)|\s+"""
```

Important differences:

- contractions are case-insensitive with `(?i:...)`
- numbers are split into groups of 1-3 digits with `\p\{N\}\{1,3\}`
- newline handling is more explicit
- punctuation/symbol chunks may absorb trailing newlines

The number split is useful because large number tokens can hurt arithmetic. Splitting numbers into smaller chunks, often 1-3 digits or even single digits, can make numerical patterns easier to learn.

### Training vs encoding

BPE training:

- choose pre-tokenization regex
- split corpus into chunks
- count adjacent pairs inside chunks
- repeatedly merge frequent pairs
- save merge ranks and vocabulary

BPE encoding:

- split input with the same regex
- map chunks to bytes or base symbols
- apply merge ranks greedily
- output token IDs

The training regex and inference regex must match. If they differ, the learned merges no longer correspond to the same chunks.

### Special tokens

Special tokens are usually not learned by BPE merges. They are reserved explicitly.

Examples:

- `&lt;|endoftext|&gt;`
- `&lt;bos&gt;`
- `&lt;eos&gt;`
- `&lt;pad&gt;`
- `&lt;|user|&gt;`
- `&lt;|assistant|&gt;`
- tool-call delimiters
- fill-in-the-middle tokens for code models

Important rule:

&gt; never let normal text accidentally encode as a special token unless you explicitly allow it

Most tokenizer libraries distinguish:

- ordinary text encoding
- special-token-aware encoding

This prevents prompt injection bugs where raw text accidentally becomes a control token.

### Vocabulary size trade-offs

Small vocabulary:

- more tokens per document
- longer context usage
- smaller embedding and LM-head matrices
- often better for rare scripts and byte-level robustness

Large vocabulary:

- fewer tokens per document
- cheaper attention for the same raw text
- larger embedding and LM-head matrices
- can overfit frequent strings or languages

Modern LLM tokenizers often use large vocabularies, e.g. 100k+ tokens, because reducing sequence length matters a lot for training and inference.

### Useful metrics

Use tokenizer evaluation metrics before training a model:

- fertility: tokens per word or per byte
- compression ratio: bytes per token
- proportion of continued words: how often words are split into multiple pieces
- unknown-token rate: should be zero for byte-level BPE
- per-language fertility: important for multilingual models
- code fertility: important for code models
- digit handling: are numbers split reasonably?
- whitespace/newline behavior: important for code and markdown

For byte-level unigram-style tokenization and randomized segmentations, see [BytePiece and Stochastic Tokenization](/atlas/ai/modalities/nlp/bytepiece-and-stochastic-tokenization).

For comparing models with different tokenizers, perplexity is not directly comparable. Use tokenizer-independent metrics like [bits-per-byte (BPB)](/atlas/ai/architectures/transformers/byte-latent-transformer).

### Common tricks

#### Preserve leading spaces

GPT-style tokenizers encode leading spaces as part of tokens. This helps distinguish:

```text
"hello"
" hello"
```

This is important because word boundaries are meaningful.

#### Handle whitespace carefully

Whitespace matters in:

- code
- markdown
- YAML/JSON
- Python indentation
- chat templates

Bad whitespace tokenization can make code expensive or fragile.

#### Split numbers deliberately

Do not blindly let BPE merge every frequent number. Large number tokens can make arithmetic brittle.

Common strategies:

- split numbers into individual digits
- split numbers into groups of 1-3 digits
- avoid very long numeric tokens

#### Train on the real data mixture

Tokenizer quality depends heavily on the corpus.

If the model will handle code, include code.
If it will handle multilingual text, include the target languages.
If it will handle math, include math notation.

Otherwise, the tokenizer may compress the wrong distribution.

#### Freeze the tokenizer before pretraining

Changing the tokenizer after pretraining changes token IDs and invalidates the embedding/LM-head semantics.

You can add new special tokens later, but that requires careful initialization and usually some continued training.

#### Beware normalization

Some tokenizers normalize text before tokenization; byte-level GPT-style BPE usually avoids aggressive normalization.

Normalization choices affect reversibility:

- lowercasing loses information
- Unicode normalization can change byte sequences
- stripping spaces can break code

For LLMs, reversible tokenization is usually preferred.

#### Avoid accidental special-token collisions

If `&lt;|assistant|&gt;` is a special token, raw user text containing that string should not automatically become the control token unless explicitly allowed.

This matters for chat models and tool calling.

### BPE vs WordPiece vs Unigram

| Method | Used by | Basic idea |
|---|---|---|
| BPE | GPT-style tokenizers | greedily learn frequent pair merges |
| WordPiece | BERT-style tokenizers | choose pieces that improve likelihood, often with `##` continuation markers |
| Unigram | SentencePiece | start with many pieces and prune by likelihood |

BPE is simple and fast, which is why it is common in decoder-only LLMs.

## Takeaways

- BPE learns frequent substrings by repeated pair merging.
- Byte-level BPE starts from bytes, so every input is representable.
- Regex pre-tokenization controls what merges are allowed.
- GPT-style tokenizers often include leading spaces in tokens.
- Number splitting, whitespace handling, and special-token policy matter a lot.
- Tokenizer quality should be measured across the actual target data mixture.
- Perplexity is not comparable across tokenizers; use BPB for tokenizer-independent comparisons.

## Related
- [Attention Mechanism](/atlas/ai/foundations/attention-mechanism)
- [Byte Latent Transformer](/atlas/ai/architectures/transformers/byte-latent-transformer)
- [Qwen2.5 technical report](/atlas/ai/architectures/model-reports/qwen2-5-technical-report)
- [Transformer Scaling Rules](/atlas/ai/training/scaling/transformer-scaling-rules)
