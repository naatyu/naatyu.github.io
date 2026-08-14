---
title: "The Softmax Bottleneck"
date: 2026-08-14
lastmod: 2026-08-14
tags:
  - ai/foundations
  - llm
  - softmax
  - representation-learning
draft: false
---

## Summary

The **softmax bottleneck** is a representational limitation of the standard language-model output head. Even if the Transformer producing the hidden state is extremely expressive, a single linear projection followed by softmax can express only a low-rank family of context-dependent next-token distributions.

For hidden dimension $d$, the matrix of logits over many contexts has rank at most $d$. Softmax normalization changes this bound by at most a small rank-one term. If the true matrix of log-probabilities has substantially higher rank, no choice of model parameters can represent it exactly.

This is not a numerical issue, a gradient problem, or the cost of computing a large-vocabulary softmax. It is an **expressivity bottleneck caused by the factorization through the output dimension**.

## Concepts

- **LM head:** the linear projection from a hidden state to vocabulary logits.
- **Logit matrix:** logits produced for many contexts, arranged as one row per context and one column per token.
- **Matrix rank:** the number of independent directions needed to describe a matrix.
- **Row-shift invariance:** adding the same scalar to every logit in one row does not change its softmax distribution.
- **Mixture of Softmaxes (MoS):** a weighted mixture of several separately normalized softmax distributions.
- **Mixture of Contexts (MoC):** combining several context vectors before one softmax; this does not remove the rank bottleneck.

## 1. Standard language-model output layer

Let:

- $c$ be a context,
- $h_c\in\mathbb{R}^d$ be its final hidden state,
- $w_x\in\mathbb{R}^d$ be the output embedding for token $x$,
- $V$ be the vocabulary size.

The logit for token $x$ is:

$$
z(c,x)=h_c^\top w_x.
$$

The next-token probability is:

$$
p_\theta(x\mid c)
=
\frac{\exp(h_c^\top w_x)}
{\sum_{x'}\exp(h_c^\top w_{x'})}.
$$

This looks expressive because $h_c$ may be produced by a deep Transformer. The limitation becomes visible only when predictions from many contexts are considered together.

## 2. Language modeling as matrix factorization

Take $N$ contexts and arrange their hidden states into:

$$
H\in\mathbb{R}^{N\times d}.
$$

Arrange the output token embeddings into:

$$
W\in\mathbb{R}^{V\times d}.
$$

The complete logit matrix is:

$$
Z=HW^\top,
$$

where $Z\in\mathbb{R}^{N\times V}$. Therefore:

$$
\operatorname{rank}(Z)
\leq
\min\left(\operatorname{rank}(H),\operatorname{rank}(W)\right)
\leq d.
$$

This bound holds regardless of how powerful the network that computed $H$ is. Once every context is compressed into a $d$-dimensional vector and passed through one shared linear output matrix, the resulting logit matrix is low-rank.

## 3. Does softmax remove the rank limitation?

For context $c$, the log-probability is:

$$
\log p_\theta(x\mid c)
=
Z_{c,x}
-
\log\sum_j \exp(Z_{c,j}).
$$

Define:

$$
s_c=\log\sum_j\exp(Z_{c,j}).
$$

Across all contexts:

$$
\log P_\theta
=
Z-s\mathbf{1}^\top.
$$

The normalization term $s\mathbf{1}^\top$ has rank at most one, so:

$$
\operatorname{rank}(\log P_\theta)
\leq d+1.
$$

Softmax is nonlinear, but its log-normalization only subtracts one scalar from every entry in a row. It cannot manufacture an arbitrary high-rank log-probability matrix from low-rank logits.

## 4. The precise row-shift argument

Softmax is invariant to adding a constant to every logit in one context:

$$
\operatorname{softmax}(z)
=
\operatorname{softmax}(z+\lambda\mathbf{1}).
$$

Let the true log-probability matrix be:

$$
A_{c,x}=\log p^*(x\mid c).
$$

Every logit matrix that produces exactly $P^*$ must belong to the row-shift family:

$$
F(A)
=
\left\{
A+\lambda\mathbf{1}^\top
:\lambda\in\mathbb{R}^N
\right\}.
$$

The model can represent the true distribution exactly only if at least one matrix in $F(A)$ can be factorized through dimension $d$:

$$
d
\geq
\min_{A'\in F(A)}\operatorname{rank}(A').
$$

A row-wise shift changes rank by at most one. Consequently, a useful sufficient condition for the bottleneck is:

$$
d < \operatorname{rank}(A)-1.
$$

In that case, even an ideal optimizer and an arbitrarily expressive context network cannot make the standard linear-softmax head reproduce the target distribution exactly.

## 5. Log-odds intuition

The same limitation can be understood without constructing the full matrix.

For two candidate tokens $x$ and $y$:

$$
\log\frac{p_\theta(x\mid c)}{p_\theta(y\mid c)}
=
h_c^\top(w_x-w_y).
$$

The softmax denominator cancels. Every pairwise log-odds function is therefore a linear projection of the same $d$-dimensional context state.

Across all contexts, the model must express every distinction such as:

- singular versus plural continuation,
- code versus natural-language continuation,
- a person's name versus a location,
- a mathematical symbol versus explanatory text,
- one long-range topic versus another,

using combinations of the same limited set of output directions.

Natural language can require many independently varying conditional distinctions. The softmax bottleneck says that one $d$-dimensional factorization may not contain enough independent directions to express all of them exactly.

## 6. Why a deeper Transformer does not automatically fix it

Suppose the Transformer is replaced by a more expressive context function:

$$
h_c=f_\theta(c).
$$

It may learn much better context representations, but after collecting those representations into $H$, the output remains:

$$
Z=HW^\top.
$$

The rank is still bounded by the width of $H$.

Similarly, adding an MLP before the LM head does not fundamentally break the bottleneck if its final output is still a $d$-dimensional vector passed through one shared linear-softmax layer. It changes how $H$ is computed, not the rank bound of the final factorization.

To break the bound, the output parameterization itself must change, or the factorization dimension must increase.

## 7. Mixture of Softmaxes

The original proposed solution is **Mixture of Softmaxes (MoS)**. For each context, produce $K$ component states and mixture weights:

$$
\pi_{c,k}\geq 0,
\qquad
\sum_{k=1}^{K}\pi_{c,k}=1.
$$

Each component defines its own distribution:

$$
p_k(x\mid c)
=
\operatorname{softmax}
\left(h_{c,k}^\top w_x\right).
$$

The final distribution is mixed **after** normalization:

$$
p(x\mid c)
=
\sum_{k=1}^{K}
\pi_{c,k}p_k(x\mid c).
$$

The logarithm of this probability contains a nonlinear log-sum structure. It can no longer generally be written as one matrix product $HW^\top$ plus a row-wise constant. The resulting log-probability matrix can therefore have rank much larger than $d$.

Intuitively, different components can specialize in different possible modes of the next-token distribution.

## 8. Why mixing hidden states is not enough

Consider mixing component states first:

$$
h'_c
=
\sum_{k=1}^{K}\pi_{c,k}h_{c,k}.
$$

Then apply a single softmax:

$$
p(x\mid c)
=
\operatorname{softmax}
\left({h'_c}^\top w_x\right).
$$

This is called a **Mixture of Contexts**. It collapses back to the ordinary form because $h'_c$ is just another $d$-dimensional vector:

$$
Z=H'W^\top.
$$

Its rank remains bounded by $d$.

The ordering is therefore essential:

$$
\text{mix then softmax}
\neq
\text{softmax then mix}.
$$

Only the second construction breaks the original linear-softmax factorization.

## 9. What else changes the bound?

| Modification | Breaks the original bottleneck? | Reason |
| --- | --- | --- |
| Larger output dimension | Partially | Raises the maximum factorization rank |
| More Transformer layers | No | Still produces one fixed-width state before the LM head |
| MLP before one linear softmax | No, unless it expands the final factorization dimension | The final logit matrix remains a low-rank product |
| Untied output embeddings | No | The output matrix is less constrained but still has width $d$ |
| Output bias | Not fundamentally | Adds only a rank-one vocabulary-dependent term |
| Mixture of Contexts | No | Mixture occurs before the single softmax |
| Mixture of Softmaxes | Yes | Separately normalized distributions are mixed afterward |
| Suitable nonlinear transformation of logits | Potentially | Can destroy the linear low-rank factorization |
| Sampled softmax | No | Changes how the objective is computed, not the represented distribution |
| Hierarchical softmax | Not automatically | Primarily changes computational factorization rather than guaranteeing higher rank |

## 10. Relationship with embedding tying

With embedding tying, the input embedding and output matrix share parameters:

$$
W_{\text{out}}=W_{\text{in}}.
$$

Untying them may give the output representation more freedom, but it does not remove the softmax bottleneck:

$$
W_{\text{out}}\in\mathbb{R}^{V\times d}
$$

still has only $d$ columns. Tying may introduce additional constraints, but the core rank bound exists with both tied and untied embeddings.

## 11. Evidence from the original paper

Yang et al. evaluated the theory using RNN language models. On Penn Treebank with a vocabulary of $10{,}000$ tokens, they reported the following empirical ranks:

| Output model | Embedding dimension | Empirical rank |
| --- | ---: | ---: |
| Standard softmax | 400 | 400 |
| Mixture of Contexts | 280 | 280 |
| Mixture of Softmaxes | 280 | 9,981 |

Increasing the number of softmax components initially increased both empirical rank and language-model performance. After the matrix became nearly full-rank, adding more components no longer helped and could overfit.

These experiments support two different claims:

1. the standard softmax and Mixture of Contexts obey the predicted rank bound;
2. MoS can escape that bound and improve likelihood on the evaluated datasets.

## 12. Important qualifications

### High exact rank does not imply that every singular direction matters equally

A true log-probability matrix may be full-rank while still being well approximated by a much lower-rank matrix. Exact algebraic rank treats an extremely small singular value as nonzero, even if it barely affects cross-entropy.

The practical question is therefore not only:

$$
\operatorname{rank}(A)>d?
$$

It is also:

> How much probability-modeling error lies in the singular directions that the output head cannot represent?

### The theorem does not prove the true language distribution's rank

The rank bound on the model is exact. The claim that natural language requires a very high-rank log-probability matrix is a hypothesis supported by context dependence and empirical results, not a directly observable theorem about the unknown true distribution of language.

### More expressivity is not free

MoS computes several vocabulary distributions. This increases training and inference cost, especially when the vocabulary is large. The original paper reported a two-to-three-times slowdown with up to 15 mixture components in many of its settings.

### This is different from a computational softmax bottleneck

Sometimes “softmax bottleneck” informally refers to the cost of calculating logits and normalization over a large vocabulary. That is a separate problem.

- **Representational bottleneck:** insufficient rank of the conditional log-probability family.
- **Computational bottleneck:** time and memory required for the vocabulary projection and normalization.

Techniques that accelerate the vocabulary softmax do not necessarily improve its representational rank.

## 13. Practical diagnostic

To inspect the phenomenon empirically:

1. sample a diverse collection of contexts,
2. run the model and collect log-probabilities over a fixed token subset,
3. construct a context-by-token matrix,
4. subtract one reference-token column or otherwise account for row-shift invariance,
5. compute its singular-value spectrum,
6. compare the spectrum across output-head variants.

Use care when reporting a numerical rank:

- the result depends on the singular-value threshold,
- floating-point noise creates tiny nonzero singular values,
- too few contexts or tokens caps the measurable rank,
- a high empirical rank alone does not guarantee lower cross-entropy.

The singular-value spectrum is generally more informative than one hard rank number.

## Main takeaway

The standard LM head forces all context-dependent next-token distributions through one shared low-dimensional factorization:

$$
\text{contexts}
\xrightarrow{f_\theta}
H
\xrightarrow{W^\top}
Z
\xrightarrow{\text{softmax}}
P.
$$

No matter how expressive $f_\theta$ is:

$$
\operatorname{rank}(Z)\leq d.
$$

The bottleneck is therefore located at the interface between the hidden representation and the vocabulary distribution. Mixture of Softmaxes breaks it by constructing multiple probability distributions and mixing them after normalization, preventing the final log-probabilities from collapsing into one low-rank matrix product.

## Related

- [Embedding Tying in Small LLMs](/atlas/ai/architectures/transformers/embedding-tying-in-small-llms)
- [Cross-Entropy Loss](/atlas/ai/training/losses/cross-entropy-loss)
- [Prediction, Compression, and Entropy](/atlas/ai/foundations/prediction-compression-and-entropy)
- [Attention Softmax and Scaling](/atlas/ai/architectures/transformers/attention-softmax-and-scaling)

## Sources

- Yang et al., [Breaking the Softmax Bottleneck: A High-Rank RNN Language Model](https://arxiv.org/abs/1711.03953) (ICLR 2018)
- Ganea et al., [Breaking the Softmax Bottleneck via Learnable Monotonic Pointwise Non-linearities](https://arxiv.org/abs/1902.08077) (ICML 2019)
- Kanai et al., [Sigsoftmax: Reanalysis of the Softmax Bottleneck](https://arxiv.org/abs/1805.10829) (NeurIPS 2018 Workshop)
