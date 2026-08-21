---
title: "Compression-Based Similarity and Language Trees"
date: 2026-08-21
lastmod: 2026-08-21
tags:
  - ai/foundations
  - information-theory
  - compression
  - nlp
draft: false
---

## Summary

Compression-based similarity uses a general-purpose compressor as an implicit statistical model. If a compressor adapted to text $A$ also compresses a snippet from $B$ well, then $A$ and $B$ probably share reusable patterns. If the snippet compresses poorly, their patterns are more different.

The 2002 paper *Language Trees and Zipping* used this idea for language identification, authorship attribution, and clustering translations into a language-similarity tree. The method requires no tokenizer, dictionary, grammatical rules, or learned embeddings: the compressor discovers repeated byte or character sequences directly.

The central information-theoretic interpretation is **relative coding cost**: how many extra bits are needed when data from source $B$ is encoded by a compressor adapted to source $A$ rather than one adapted to $B$ itself?

## Concepts

- **Compression length $C(X)$:** size of compressed string $X$.
- **Adaptive compressor:** a compressor whose dictionary or state changes while reading a sequence.
- **Cross-compression:** compressing a sample from one source after first exposing the compressor to another.
- **Relative entropy rate:** extra bits per character caused by using the wrong source model.
- **Compression distance:** pairwise dissimilarity derived from compressed lengths.
- **Language tree:** a tree fitted to pairwise language distances; not automatically a historical family tree.

## 1. A Compressor Is an Implicit Model

Algorithms in the Lempel-Ziv family replace repeated substrings with references to earlier occurrences. After reading a long text $A$, the compressor's state reflects patterns found in $A$:

- character and byte sequences,
- common word fragments,
- orthographic conventions,
- recurring phrases,
- punctuation and formatting patterns.

Append a new snippet $b$. If it reuses patterns already present in $A$, the compressor can describe it with short references. If its patterns are unfamiliar, more literal information must be emitted.

Let $C(X)$ denote the compressed size of $X$. The incremental cost is:

$$
\Delta_{Ab}=C(A+b)-C(A).
$$

This is an empirical answer to:

> How expensive is snippet $b$ under a compressor whose current state was shaped by $A$?

## 2. Why Raw Incremental Cost Is Not Enough

The quantity $\Delta_{Ab}$ contains two effects:

1. the intrinsic unpredictability of $b$;
2. the mismatch between the patterns of $A$ and $B$.

To isolate mismatch, compare it with the cost of encoding the same kind of snippet after adapting to its own source. Let $B$ be a long text and $b$ a shorter snippet from that source:

$$
\Delta_{Bb}=C(B+b)-C(B).
$$

The paper estimates directional relative entropy per character as:

$$
S_{AB}
=
\frac{\Delta_{Ab}-\Delta_{Bb}}{|b|}.
$$

Interpretation:

- $\Delta_{Ab}/|b|$ approximates a cross-entropy rate: encode $B$-data using an $A$-adapted code;
- $\Delta_{Bb}/|b|$ approximates the entropy rate of $B$;
- their difference approximates $D_{\mathrm{KL}}(B\|A)$ per character.

The notation $S_{AB}$ follows the paper. In the common modern KL convention, the source generating the snippet appears first, so the conceptual direction is $B\|A$.

## 3. Why the Snippet Must Stay Short

The construction relies on the compressor remaining mostly adapted to $A$ while processing $b$.

If $b$ is too long, the adaptive compressor starts learning $B$ during the measurement. Later parts of the snippet then match earlier parts of $b$ rather than $A$, weakening the intended comparison.

The paper used snippets around 1–15 KB with reference files around 32–64 KB and reported robustness across that range. Appropriate sizes depend on the compressor's history window and update rules.

## 4. Language Recognition

Given an unknown snippet $x$ and reference corpora $A_1,\ldots,A_m$, compute:

$$
C(A_i+x)-C(A_i)
$$

for every reference. Predict the language corresponding to the smallest incremental size.

The assumption is:

$$
\text{same-language patterns}
\Rightarrow
\text{more reusable matches}
\Rightarrow
\text{shorter incremental encoding}.
$$

In the paper's experiment with 100 texts across 10 European Union languages, each test text's nearest reference was written in the same language. This is evidence on that corpus, not a universal benchmark guarantee.

## 5. Authorship Attribution

When all texts use the same language, compression can still capture stylistic regularities:

- vocabulary and recurring phrases,
- character and word-sequence preferences,
- punctuation habits,
- morphology and sentence templates.

For an unknown text $X$, rank known-author texts $A_i$ by the incremental cost of a snippet $x$.

The paper reported correct first-ranked authorship for 84 of 90 texts, or 93.3%, on an Italian literary corpus. The result may also reflect topic, era, genre, and edition-specific formatting, so authorship is not the only possible causal signal.

## 6. From Directional Mismatch to a Language Tree

KL divergence and $S_{AB}$ are asymmetric. To construct a pairwise matrix, the paper combined both directions and normalized them:

$$
D(A,B)
=
\frac{\Delta_{Ab}-\Delta_{Bb}}{\Delta_{Bb}}
+
\frac{\Delta_{Ba}-\Delta_{Aa}}{\Delta_{Aa}},
$$

where $a$ is a snippet from $A$ and $b$ is a snippet from $B$.

This construction:

- includes mismatch in both directions;
- normalizes by each source's self-compression cost;
- reduces sensitivity to absolute coding scale.

The authors computed this matrix for more than 50 translations of the Universal Declaration of Human Rights and fitted a tree using the Fitch-Margoliash method. The resulting unrooted tree grouped many major language families, including Romance, Germanic, Celtic, Slavic, Baltic, and Uralic/Ugro-Finnic languages.

## 7. What the Tree Does and Does Not Mean

The tree shows similarity under a particular corpus, encoding, compressor, and distance construction. It does **not** establish historical descent by itself.

Compression similarity can be caused by:

- common ancestry;
- borrowed vocabulary;
- a shared writing system;
- similar morphology;
- common topic and translation structure;
- character encoding and preprocessing choices.

The paper's tree was unrooted, and the authors emphasized relative placement rather than literal branch lengths. It is safest to call it a compression-derived similarity tree, not a reconstructed genealogy with dated ancestors.

## 8. Connection to Cross-Entropy and KL Divergence

For true source $P_B$ and a code based on source model $Q_A$:

$$
H(P_B,Q_A)
=
H(P_B)
+
D_{\mathrm{KL}}(P_B\|Q_A).
$$

The compression experiment approximates:

$$
\frac{\Delta_{Ab}}{|b|}
\approx
H(P_B,Q_A),
$$

$$
\frac{\Delta_{Bb}}{|b|}
\approx
H(P_B),
$$

and hence:

$$
\frac{\Delta_{Ab}-\Delta_{Bb}}{|b|}
\approx
D_{\mathrm{KL}}(P_B\|Q_A).
$$

This is approximate because a real zipper:

- does not reach the Shannon limit on finite files;
- has finite memory and implementation overhead;
- is not an explicit probability model;
- adapts while reading the appended sample.

Even a biased proxy can preserve enough relative structure for useful classification and clustering.

## 9. Relationship to Learned Representations

A learned embedding maps each object to a vector and compares vectors geometrically. Compression-based similarity skips the explicit representation:

$$
\text{object pair}
\rightarrow
\text{conditional description length}
\rightarrow
\text{dissimilarity}.
$$

It is attractive when:

- no task-specific features are available;
- examples are naturally represented as strings;
- a training-free baseline is useful;
- shared sequential patterns are meaningful.

It is weaker when semantic similarity is not reflected in surface regularity. Two paraphrases can mean the same thing while sharing few byte sequences, whereas unrelated documents can compress well together because they reuse boilerplate.

## 10. Minimal Implementation

For reference texts and a query snippet:

```python
def incremental_cost(reference: bytes, query: bytes, compress) -> int:
    return len(compress(reference + query)) - len(compress(reference))


scores = [incremental_cost(reference, query, compress) for reference in references]
prediction = labels[min(range(len(scores)), key=scores.__getitem__)]
```

For a controlled experiment:

- use several snippets per source;
- subtract self-compression cost;
- evaluate both concatenation directions;
- keep reference and query lengths comparable;
- use identical encoding and preprocessing;
- report sensitivity to compressor choice and settings.

## 11. Important Failure Modes

### Compressor dependence

Different compressors exploit different patterns and history lengths. A result obtained with one zipper is not an intrinsic property of the texts alone.

### Concatenation order

In general:

$$
C(A+B)\neq C(B+A).
$$

Adaptive state and finite windows make order matter.

### Header and small-file overhead

Container metadata and fixed headers can dominate short inputs. Use sufficiently long samples and subtract appropriate baselines.

### Encoding leakage

Unicode encoding, normalization, whitespace, markup, and line endings can become shortcuts. This may help language identification but mislead semantic claims.

### Topic and translation leakage

Translations control topic better than unrelated documents, but common sentence order and named entities may make them unusually comparable.

### No guaranteed metric

Practical compressor-derived dissimilarities may violate symmetry or the triangle inequality. Symmetrization and normalization improve usability but do not make every finite-compressor construction a rigorous metric.

### Task-specific baselines may win

The method's generality is its appeal, not guaranteed optimality. Character n-grams, naive Bayes, or learned classifiers can be faster or more accurate when labeled data and domain knowledge are available.

## 12. Broader Lesson

Compression supplies a form of feature discovery:

> Two objects are similar when knowledge extracted from one makes the other cheaper to describe.

This idea extends beyond natural language to:

- DNA and protein sequences;
- time series;
- source code;
- symbolic music;
- anomaly and change detection.

The compressor is not necessarily understanding these objects semantically. It measures transferable regularity, which sometimes aligns surprisingly well with meaningful structure.

## Main Takeaway

The important quantity is not simply whether $A+B$ compresses well. It is the **additional cost of describing $B$ with patterns learned from $A$, compared with describing $B$ using its own patterns**:

$$
\text{mismatch cost}
\approx
\text{cross-compression cost}
-
\text{self-compression cost}.
$$

This is the compression analogue of:

$$
D_{\mathrm{KL}}(P_B\|Q_A)
=
H(P_B,Q_A)-H(P_B).
$$

## Related

- [Cross-Entropy Loss](/atlas/ai/training/losses/cross-entropy-loss)
- [Kullback-Leibler Divergence](/atlas/math/probability/kullback-leibler-divergence)
- [Prediction, Compression, and Entropy](/atlas/ai/foundations/prediction-compression-and-entropy)
- [Entropy](/atlas/math/probability/entropy)
- [Byte Pair Encoding](/atlas/ai/modalities/nlp/byte-pair-encoding)

## Sources

- Benedetto, Caglioti, Loreto, [Language Trees and Zipping](https://arxiv.org/abs/cond-mat/0108530) (Physical Review Letters, 2002)
- 3Blue1Brown, [But what is Cross-Entropy? | Compression is Intelligence Part 2](https://www.3blue1brown.com/lessons/cross-entropy/)
- Lempel and Ziv, [A Universal Algorithm for Sequential Data Compression](https://ieeexplore.ieee.org/document/1055714) (1977)
