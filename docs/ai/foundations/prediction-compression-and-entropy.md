---
title: "Prediction, Compression, and Entropy"
date: 2026-06-08
lastmod: 2026-06-08
tags:
  - ai/foundations
  - information-theory
  - llm
draft: false
---

## Summary

Prediction and compression are two views of the same underlying problem.

If a model can assign accurate probabilities to future symbols, it can compress data efficiently. If a code compresses data close to the theoretical limit, it must implicitly capture the same predictive structure. This is why information theory sits directly underneath language modeling, cross-entropy loss, and the notion of entropy as a compression limit.

## Concepts

- **Information content:** surprisal of an event, measured as $-\log_2 p$.
- **Entropy:** average information content under a distribution.
- **Entropy rate:** average information per symbol for a stochastic process such as language.
- **Prefix-free code:** a variable-length code where no codeword is the prefix of another.
- **Cross-entropy:** average code length when the true data is encoded using a model distribution.

## 1. Why compression leads to probability

Suppose a symbol $x$ occurs with probability $p(x)$. If a code is optimal, rare symbols should use more bits and common symbols should use fewer bits.

The ideal code length is:

$$
\ell(x) = -\log_2 p(x)
$$

This is the fundamental information-theoretic quantity.

Interpretation:

- if $p(x)=1/2$, then $\ell(x)=1$ bit
- if $p(x)=1/4$, then $\ell(x)=2$ bits
- if $p(x)=1/8$, then $\ell(x)=3$ bits

So the number of bits is exactly the number of times you need to halve the possibility space to isolate the event.

This motivates the definition of **information content**:

$$
I(x) = -\log_2 p(x)
$$

Less likely events carry more information because they rule out more alternatives.

## 2. Prefix-free coding and why common events get shorter codes

In practical variable-length coding, the code must remain decodable. A standard sufficient condition is **prefix-freeness**:

> No codeword can be the prefix of another codeword.

Example:

- `0` for a very common symbol
- `10` for a less common symbol
- `110` and `111` for rare symbols

This works because once the decoder has read a complete codeword, it knows exactly where that symbol ends.

The important intuition is that assigning a short codeword consumes a large part of the available code space. So only common events can justify occupying that much space. This is why code length and probability are tightly coupled.

## 3. Perfect compression should look like random noise

One of the central intuitions behind Shannon's theory is:

> If a message has been compressed as much as possible, the resulting bitstream should look like random noise.

Why?

- if the compressed stream still has obvious patterns, then those patterns could be exploited for further compression
- a maximally compressed stream should therefore be patternless, with bits that look close to independent fair coin flips

This is not just an aesthetic idea. It explains why equally likely encoded messages should use equal-length bitstrings, and it leads directly to the formula $-\log_2 p$.

## 4. From information to entropy

If a random variable $X$ takes values $x_i$ with probabilities $p_i$, then the **average** information per sample is:

$$
H(X) = \mathbb{E}[I(X)] = \sum_i p_i \left(-\log_2 p_i\right)
$$

Equivalently:

$$
H(X) = -\sum_i p_i \log_2 p_i
$$

This is **Shannon entropy**.

Interpretation:

- entropy is the average number of bits needed per symbol under an optimal code
- high entropy means the source is hard to predict and hard to compress
- low entropy means the source is predictable and easier to compress

This is the core content of Shannon's **noiseless coding theorem**:

- no lossless code can beat the entropy in average bits per symbol
- there exist coding schemes that can get arbitrarily close to it

So entropy is not just “uncertainty” in a vague sense. It is the compression limit.

## 5. Information adds across a message

For a sequence $x_{1:n} = (x_1,\dots,x_n)$:

$$
p(x_{1:n}) = \prod_{t=1}^n p(x_t \mid x_{<t})
$$

Taking negative log base 2 turns products into sums:

$$
I(x_{1:n})
= -\log_2 p(x_{1:n})
= -\sum_{t=1}^n \log_2 p(x_t \mid x_{<t})
$$

This matters a lot for language.

Language is not i.i.d. The next character, token, or word depends heavily on context. But information still adds cleanly across the sequence once you use conditional probabilities.

This is the mathematical reason prediction and compression line up so well.

## 6. Entropy rate for language

Natural language does not have one fixed per-symbol distribution. The next symbol depends on previous symbols, often over long ranges.

So the right object is not just entropy of a single random variable, but the **entropy rate** of a stochastic process:

$$
h = \lim_{n\to\infty}\frac{1}{n}H(X_{1:n})
$$

Equivalently, when the limit exists:

$$
h = \lim_{n\to\infty} H(X_n \mid X_{<n})
$$

Interpretation:

- $h$ is the average information per symbol once context is taken into account
- it is the true asymptotic compression limit of the source

For language, this is what people informally mean by “the entropy of English,” though in practice it is only estimated, not exactly computed.

## 7. Why Shannon needed an implicit model of intelligence

A key point from Shannon's language experiments is that raw counts are not enough.

Short-range statistics such as character n-grams help, but they break down for long contexts:

- many long contexts are rare or unseen
- yet humans still know what is plausible after them

So if you want a realistic estimate of the compressibility of language, you need some system that can make context-sensitive predictions. In Shannon's time, that “model” was a human subject. Today, it can be a language model.

This is the deep connection:

> To estimate how compressible language is, you need a predictive model of language.

That is already a weak form of the claim that compression requires intelligence.

## 8. Why this matters for LLM pretraining

LLM pretraining is usually framed as next-token prediction. But mathematically it can also be framed as **learning the best possible compressor of text**.

If the true next-token distribution is $P$ and the model distribution is $Q$, then the cross-entropy is:

$$
H(P,Q) = \mathbb{E}_{x\sim P}[-\log_2 Q(x)]
$$

For a token sequence, this becomes:

$$
\frac{1}{n}\sum_{t=1}^n -\log_2 Q(x_t \mid x_{<t})
$$

This is the average number of bits per token you would need if you encoded text using the model's predicted probabilities.

So minimizing language-model cross-entropy means:

- assign higher probability to the true continuation
- reduce surprisal on real text
- reduce the number of bits needed to encode the corpus using the model

That is why next-token prediction and compression are mathematically equivalent objectives.

## 9. Cross-entropy decomposes into irreducible uncertainty plus modeling error

Cross-entropy can be decomposed as:

$$
H(P,Q) = H(P) + D_{KL}(P\|Q)
$$

Interpretation:

- $H(P)$ is the true entropy rate or intrinsic uncertainty of the data source
- $D_{KL}(P\|Q)$ is the extra inefficiency from using the wrong model

So when you improve an LLM and lower cross-entropy:

- part of the code length is unavoidable
- the rest is model misspecification

This is a clean way to think about pretraining progress: the model is reducing wasted bits.

## 10. What “compression is intelligence” gets right and wrong

The slogan is too strong if taken literally. Not every compressor is intelligent, and intelligence involves more than static predictability.

But it points at something real:

- good compression requires discovering structure
- good prediction requires discovering structure
- structure in language is semantic, syntactic, world-based, and contextual

So the better a model gets at compression, the more it must internalize regularities of the world reflected in text.

Safer version:

> Compression is not identical to intelligence, but the mathematics of compression is deeply aligned with the predictive core of intelligence.

## 11. Practical mental model

A useful way to think about modern language models:

1. A token with high model probability is cheap to encode.
2. A token with low model probability is expensive to encode.
3. The total negative log-likelihood of a sequence is its code length under the model.
4. Training reduces expected code length on real text.

So:

- **better prediction** means **shorter code**
- **shorter code** means **better compression**
- **better compression** means the model captured more of the structure in the data

## Related

- [Entropy](/atlas/math/probability/entropy)
- [Cross-Entropy Loss](/atlas/ai/training/losses/cross-entropy-loss)
- [Kullback-Leibler Divergence](/atlas/math/probability/kullback-leibler-divergence)
- [Byte Pair Encoding](/atlas/ai/modalities/nlp/byte-pair-encoding)

## Sources

- 3Blue1Brown, *Reinventing Entropy | Compression & Intelligence Part 1*: https://www.youtube.com/watch?v=l6DKRf-fAAM
- Claude Shannon, *A Mathematical Theory of Communication*: https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf
- Claude Shannon, *Prediction and Entropy of Printed English*: https://www.princeton.edu/~wbialek/rome/refs/shannon_51.pdf
- Chris Olah, *Visual Information Theory*: https://colah.github.io/posts/2015-09-Visual-Information/
