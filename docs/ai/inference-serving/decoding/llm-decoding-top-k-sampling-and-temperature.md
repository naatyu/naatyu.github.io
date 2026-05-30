---
title: "LLM Decoding: Top-k Sampling and Temperature"
date: 2026-05-29
lastmod: 2026-05-29
tags:
  - ai/serving
  - ai/llm
  - decoding
  - sampling
draft: false
---

## Summary

Top-k sampling and temperature are inference-time decoding controls. Top-k restricts which tokens are eligible for sampling, while temperature reshapes how strongly the model prefers high-logit tokens.

## 1. Overview

At each decoding step, an LLM produces a vector of logits
$$
\mathbf{z} = (z_1, z_2, \dots, z_V),
$$
where $V$ is the vocabulary size and $z_i$ is the logit for token $i$.

These logits are converted into probabilities with the softmax:
$$
p_i = \frac{e^{z_i}}{\sum_{j=1}^{V} e^{z_j}}.
$$

Decoding controls such as top-k sampling and temperature modify how the next token is chosen from this distribution. They do not change the model's parameters or knowledge; they only affect inference-time sampling behavior.

## 2. Top-k Sampling

Top-k sampling keeps only the $k$ most likely tokens and discards the rest.

Let $S_k$ be the set of indices corresponding to the $k$ highest probabilities. The top-k distribution is
$$
\tilde{p}_i =
\begin{cases}
\dfrac{p_i}{\sum_{j \in S_k} p_j} & \text{if } i \in S_k, \\
0 & \text{otherwise.}
\end{cases}
$$

The model then samples the next token from $\tilde{p}$.

### Example

Suppose the model predicts:

| Token | Probability |
| --- | ---: |
| `the` | 0.30 |
| `a` | 0.20 |
| `this` | 0.12 |
| `my` | 0.08 |
| `banana` | 0.01 |

With $k = 3$, we keep only `the`, `a`, and `this`. Their probability mass is
$$
0.30 + 0.20 + 0.12 = 0.62.
$$

After renormalization:
$$
\tilde{p}(\texttt{the}) = \frac{0.30}{0.62} \approx 0.484,
\qquad
\tilde{p}(\texttt{a}) = \frac{0.20}{0.62} \approx 0.323,
\qquad
\tilde{p}(\texttt{this}) = \frac{0.12}{0.62} \approx 0.194.
$$

### Intuition

Top-k is a candidate filter:
- Small $k$: more focused and predictable generation.
- Large $k$: more diversity.
- $k = 1$: greedy decoding.
- Disabled top-k: sample from the full vocabulary.

Its main purpose is to prevent sampling from the low-probability tail of the vocabulary.

## 3. Temperature

Temperature rescales the logits before applying softmax:
$$
p_i^{(T)} = \frac{\exp(z_i / T)}{\sum_{j=1}^{V} \exp(z_j / T)},
\qquad T > 0.
$$

Equivalently,
$$
\mathbf{p}^{(T)} = \operatorname{softmax}\left(\frac{\mathbf{z}}{T}\right).
$$

### Behavior

- $T < 1$: sharper distribution, more deterministic output.
- $T = 1$: original model distribution.
- $T > 1$: flatter distribution, more random output.
- $T \to 0^+$: approaches greedy decoding.

Lower temperature amplifies logit differences, while higher temperature compresses them.

### Example

Suppose two tokens have logits
$$
z_A = 10, \qquad z_B = 8.
$$

At $T = 0.5$:
$$
\frac{z_A}{T} = \frac{10}{0.5} = 20,
\qquad
\frac{z_B}{T} = \frac{8}{0.5} = 16.
$$

At $T = 2$:
$$
\frac{z_A}{T} = \frac{10}{2} = 5,
\qquad
\frac{z_B}{T} = \frac{8}{2} = 4.
$$

So decreasing $T$ increases the effective separation between logits, and increasing $T$ reduces it.

## 4. Top-k vs Temperature

These controls affect randomness in different ways:

| Parameter | Role |
| --- | --- |
| `top_k` | Restricts the set of allowed tokens |
| `temperature` | Reshapes probabilities before sampling |

Top-k controls the support of the sampling distribution. Temperature controls its sharpness.

In practice, decoding often proceeds as follows:
1. Rescale logits with temperature.
2. Convert logits into probabilities.
3. Keep only the top $k$ tokens.
4. Renormalize.
5. Sample the next token.

## 5. Top-k vs Top-p

Top-p, also called nucleus sampling, is another common decoding rule.

- Top-k keeps a fixed number of tokens.
- Top-p keeps the smallest set of tokens whose cumulative probability exceeds a threshold $p$.

If the sorted token probabilities satisfy
$$
p_{(1)} \ge p_{(2)} \ge \dots \ge p_{(V)},
$$
then top-p keeps the smallest integer $m$ such that
$$
\sum_{i=1}^{m} p_{(i)} \ge p.
$$

This makes top-p adaptive:
- When the model is confident, only a few tokens are kept.
- When the model is uncertain, more tokens are retained.

## 6. Practical Rules of Thumb

- Coding, math, extraction, classification, factual generation: $T \in [0, 0.3]$.
- General chat, rewriting, summarization: $T \in [0.5, 0.8]$.
- Brainstorming, storytelling, creative writing: $T \in [0.9, 1.2]$.

For top-k:
- $k = 1$: greedy decoding.
- $k \approx 10$: focused with limited variation.
- $k \approx 40$ to $50$: common creative range.

These are heuristics, not universal rules. The best setting depends on the task, model family, and any other decoding constraints.

## 7. Key Takeaway

Top-k and temperature are inference-time controls:
- Top-k decides which tokens remain eligible.
- Temperature decides how concentrated the distribution is over those tokens.

Together, they set the tradeoff between deterministic output and diversity.

## Related

- [LLM Inference Economics](/atlas/ai/inference-serving/performance/llm-inference-economics)
- [Roofline Model](/atlas/systems/performance/roofline-model)
