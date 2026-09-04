---
title: "Group-Theoretic Positional Encodings"
date: 2026-09-04
lastmod: 2026-09-04
tags:
  - ai/transformers
  - positional-encoding
  - attention
  - group-theory
draft: false
---

## Summary

Positional encoding can be framed as a representation of **translations**. Moving by $s$ and then by $t$ must have the same effect as moving by $s+t$:

$$
A(s+t)=A(s)A(t),
\qquad A(0)=I.
$$

If the positional transformation is linear, depends only on relative position, and varies continuously with position, then $A$ is a **one-parameter matrix group**. Every such continuous family has the form

$$
\boxed{A(t)=\exp(tX)},
$$

where the fixed matrix $X$ is its **generator**. The eigenstructure of $X$ determines the qualitative behavior of the encoding:

| Structure of the generator | Position-dependent behavior | Familiar mechanism |
|---|---|---|
| zero eigenvalue | constant | NoPE |
| negative real eigenvalue | exponential decay | retention / gated linear attention |
| imaginary conjugate pair | rotation | RoPE |
| complex pair with negative real part | damped rotation | RetNet-style retention |
| non-diagonalizable Jordan block | exponential times a polynomial | linear biases such as ALiBi after feature augmentation |

This does **not** prove that these are all conceivable positional encodings. It classifies the encodings inside a particular but useful design space. The important insight is that compositional relative position imposes much more structure than it first appears to.

## 1. Position as a transformation of attention scores

Let $q_s,k_t\in\mathbb{R}^d$ be a query at position $s$ and a key at position $t$. Without an explicit positional mechanism, their compatibility score is

$$
q_s^\top k_t.
$$

Introduce position-dependent linear maps $F(s)$ and $G(t)$:

$$
Q_s=F(s)q_s,
\qquad
K_t=G(t)k_t.
$$

The score becomes

$$
Q_s^\top K_t
=
q_s^\top F(s)^\top G(t)k_t.
$$

The matrix between $q_s$ and $k_t$ contains the entire positional effect. If absolute location should not matter, this matrix must depend only on the displacement

$$
\Delta=t-s.
$$

Therefore, after absorbing any constant change of basis into the query and key projections, we can write

$$
Q_s^\top K_t
=
q_s^\top A(\Delta)k_t,
\qquad A(0)=I.
$$

In the resulting score matrix, every diagonal uses the same positional operator:

```text
                 key position t
                 0       1       2
query s = 0    A(0)    A(1)    A(2)
query s = 1   A(-1)    A(0)    A(1)
query s = 2   A(-2)   A(-1)    A(0)

Each diagonal has constant t - s.
```

This Toeplitz-like structure is the algebraic meaning of relative position.

## 2. Why translations imply a group representation

Relative shifts compose. Shifting a representation by $s$, then by $t$, should be equivalent to shifting it once by $s+t$:

$$
A(s+t)=A(s)A(t).
$$

Together with

$$
A(0)=I,
\qquad
A(-t)=A(t)^{-1},
$$

this says that $A$ is a homomorphism from the additive group of positions into the group of invertible matrices:

$$
(\mathbb{R},+)
\longrightarrow
GL(d,\mathbb{R}).
$$

The terminology sounds abstract, but the constraint is concrete:

```text
position shifts                 feature transformations

      s                             A(s)
      t                             A(t)
      s + t                         A(s + t)

composition in position  <=>  matrix multiplication
      s then t                    A(s)A(t)
```

If $A(t)$ is continuous, standard results for one-parameter matrix groups give

$$
A(t)=\exp(tX),
$$

with

$$
X=\left.\frac{dA(t)}{dt}\right|_{t=0}.
$$

$X$ is an infinitesimal rule: it says how the representation begins changing for a tiny positional shift. The matrix exponential integrates that local rule over an arbitrary distance.

For integer-only positions, the analogous statement is

$$
A(n)=A(1)^n.
$$

The continuous formulation is stronger and naturally supports real timestamps and irregularly sampled sequences.

## 3. The generator classifies the encoding

To understand $A(t)=\exp(tX)$, inspect the real canonical form of $X$. After a position-independent change of basis, the generator decomposes into nearly independent blocks.

### 3.1 Real one-dimensional blocks: decay, growth, or NoPE

For a scalar generator $u$,

$$
A(t)=e^{ut}.
$$

There are three regimes:

- $u=0$: $A(t)=1$, so position has no effect. This is **NoPE**.
- $u<0$: influence decays exponentially with distance.
- $u>0$: influence grows exponentially and is normally undesirable.

For a causal model, define the age of a key relative to a query as

$$
a=i-j\ge 0.
$$

A decaying channel has

$$
A(a)=e^{-\lambda a},
\qquad \lambda>0.
$$

This is the geometry behind exponential retention and many gated linear-attention mechanisms. A data-dependent gate can be interpreted as learning how quickly effective time advances.

### 3.2 Complex conjugate pairs: rotations

A real matrix can have eigenvalues

$$
u\pm i\omega.
$$

The corresponding real two-dimensional block exponentiates to

$$
A(t)
=
e^{ut}
\begin{bmatrix}
\cos(\omega t) & -\sin(\omega t)\\
\sin(\omega t) & \cos(\omega t)
\end{bmatrix}.
$$

This combines two effects:

- $e^{ut}$ changes the magnitude;
- $R(\omega t)$ changes the phase.

When $u=0$, the norm is preserved and the block is a pure rotation:

$$
A(t)=R(\omega t).
$$

This recovers the essential structure of **RoPE**. A Transformer head uses several two-dimensional blocks with different frequencies $\omega_i$:

$$
A(t)
=
R(\omega_0t)
\oplus
R(\omega_1t)
\oplus\cdots.
$$

RoPE is therefore not an isolated trick. It is the norm-preserving oscillatory member of the family of continuous linear representations of translation.

When $u<0$, the block is a **damped rotation**:

$$
A(a)=e^{-\lambda a}R(\omega a).
$$

It combines RoPE-like phase with an explicit recency bias. RetNet's retention mechanism is a practical example of this mixture.

### 3.3 Defective generators: polynomial factors

Not every matrix is diagonalizable. Consider the nilpotent Jordan generator

$$
N=
\begin{bmatrix}
0&1\\
0&0
\end{bmatrix},
\qquad N^2=0.
$$

Its exponential terminates after the linear term:

$$
\exp(tN)
=I+tN
=
\begin{bmatrix}
1&t\\
0&1
\end{bmatrix}.
$$

Applied to a state $(x,v)$, this produces

$$
(x,v)\mapsto(x+tv,v).
$$

It resembles constant-velocity dynamics: position changes linearly while velocity stays fixed.

More generally, if a Jordan block is $X=uI+N$ and $N^r=0$, then

$$
e^{tX}
=
e^{ut}
\left(
I+tN+\frac{t^2N^2}{2!}+\cdots+
\frac{t^{r-1}N^{r-1}}{(r-1)!}
\right).
$$

Diagonalizable generators produce exponentials and rotations. Defective generators additionally produce **polynomials in distance**. These polynomial mechanisms are less explored, but ALiBi supplies one meaningful connection.

## 4. Recovering familiar positional mechanisms

### 4.1 NoPE

Set

$$
X=0.
$$

Then

$$
A(t)=e^{tX}=I.
$$

The query-key interaction receives no explicit positional transformation. A causal mask can still provide implicit order information, but that lies outside $A(t)$ itself.

### 4.2 RoPE

Choose a skew-symmetric generator for each feature pair:

$$
X_i=
\begin{bmatrix}
0&-\omega_i\\
\omega_i&0
\end{bmatrix}.
$$

Then

$$
e^{tX_i}=R(\omega_i t).
$$

Because rotations are orthogonal,

$$
R(s)^\top R(t)=R(t-s),
$$

so rotating a query and key according to their absolute positions makes their dot product depend on relative displacement.

### 4.3 Exponential retention

Choose a negative real component:

$$
X=-\lambda I,
\qquad
A(a)=e^{-\lambda a}I.
$$

The positional kernel discounts older keys exponentially. Combining this with skew-symmetric rotation blocks yields decaying oscillations.

### 4.4 ALiBi through augmented coordinates

ALiBi directly adds a distance-dependent bias to an attention logit. For causal attention,

$$
\ell_{ij}=q_i^\top k_j-m(i-j),
\qquad j\le i.
$$

The bias $-ma$ is independent of the content vectors, so it is not directly covered by a same-dimensional linear transform of arbitrary $q$ and $k$. It can nevertheless be represented by adding constant auxiliary coordinates.

Using the nilpotent generator above,

$$
\bar q=
\begin{bmatrix}1\\0\end{bmatrix},
\qquad
\bar k=
\begin{bmatrix}0\\-m\end{bmatrix},
$$

gives

$$
\bar q^\top e^{aN}\bar k=-ma.
$$

Concatenating this auxiliary channel with the ordinary content channel reproduces the ALiBi logit. This connects additive linear bias with a unipotent group action generated by a defective matrix.

## 5. What the classification does and does not establish

The taxonomy follows only after imposing several assumptions:

1. **Linearity in query and key features.** The positional mechanism acts through matrices.
2. **Translation invariance.** Only relative displacement $t-s$ is observable.
3. **Composition.** Consecutive shifts combine consistently.
4. **Continuity.** Nearby real-valued positions induce nearby transformations.
5. **Invertibility.** A shift belongs to $GL(d)$ and can be undone mathematically.

Relaxing these assumptions opens a larger design space:

- learned absolute embeddings are not translation invariant;
- arbitrary relative-logit bias tables are not necessarily query/key transformations;
- nonlinear positional functions are excluded;
- content-dependent position mechanisms need not form one fixed one-parameter group;
- causal masks supply order information outside the positional transform;
- integer-only representations need not extend cleanly to continuous time.

The conclusion should therefore be read as:

> Under natural compositional and linearity constraints, the space collapses to matrix exponentials—not that all positional encodings in machine learning have been enumerated.

## 6. Stability and direction matter

The group law implies

$$
A(-t)=A(t)^{-1}.
$$

Consequently, a component that decays forward in time grows backward in time. Pure rotations avoid this because both directions preserve norms.

This distinction explains why exponential decay is especially natural for **causal** models: only non-negative key ages $a=i-j$ are used. In unrestricted bidirectional attention, a naive signed exponential would suppress one temporal direction and amplify the other.

There are useful stability regimes:

| Generator spectrum | Long-distance behavior |
|---|---|
| $\operatorname{Re}(\lambda)>0$ | exponential growth |
| $\operatorname{Re}(\lambda)<0$ | decay in one direction, growth in the inverse direction |
| purely imaginary and diagonalizable | bounded oscillations / rotations |
| zero eigenvalue with a nontrivial Jordan block | polynomial growth |

Thus algebraic validity is not enough. A useful encoding must also behave numerically over the intended context length.

## 7. Design lessons

### 7.1 Parameterize structure instead of a dense generator

An arbitrary learned $X\in\mathbb{R}^{d\times d}$ would require a costly matrix exponential and may create unstable growing modes. Efficient designs parameterize known blocks directly:

```text
zero block              -> pass features through
negative scalar block   -> multiply by exp(-lambda * age)
rotation block          -> apply sin/cos rotation
damped rotation block   -> rotate, then multiply by decay
small Jordan block      -> evaluate a low-degree polynomial
```

This preserves the exact composition law while keeping cost linear in the head dimension.

### 7.2 RoPE frequencies are generator eigenfrequencies

In this view, selecting the RoPE spectrum means selecting the imaginary eigenvalues of $X$:

$$
\operatorname{eig}(X_i)=\{+i\omega_i,-i\omega_i\}.
$$

RoPE scaling changes those frequencies. Partial RoPE mixes rotation blocks with zero blocks. Damped RoPE adds negative real parts. These variants become modifications of one generator rather than unrelated recipes.

### 7.3 Multiple behaviors can coexist

A block-diagonal generator can allocate different subspaces to different temporal behaviors:

$$
X
=
X_{\text{NoPE}}
\oplus
X_{\text{rotation}}
\oplus
X_{\text{decay}}
\oplus
X_{\text{Jordan}}.
$$

One head could therefore preserve some content independent of position, rotate another part, and decay another part. The engineering question is not merely “which encoding?” but “which positional dynamics should each subspace carry?”

### 7.4 Group Representational Position Encoding

GRAPE develops a closely related framework based on group actions. It treats RoPE as a multiplicative, norm-preserving representation and obtains ALiBi-like additive biases from unipotent actions. It also explores learned subspaces beyond RoPE's fixed coordinate pairs.

The conceptual progression is:

$$
\boxed{
\text{relative position}
\rightarrow
\text{composition law}
\rightarrow
\text{group representation}
\rightarrow
\text{matrix generator}
\rightarrow
\text{decay, rotation, or polynomial dynamics}
}.
$$

## 8. Practical checklist for a new positional mechanism

When evaluating or designing a positional encoding, ask:

1. Does it depend on absolute position or only on relative displacement?
2. Do shifts compose exactly: $A(s+t)=A(s)A(t)$?
3. Is the mechanism linear, additive at the logit level, or nonlinear?
4. Is it defined for integer indices, continuous time, or both?
5. What are the eigenvalues of its generator or transition matrix?
6. Does it rotate, decay, grow, or introduce polynomial terms?
7. Is it stable in every temporal direction the attention mask exposes?
8. Can it be applied in $O(d)$ time without a dense matrix exponential?
9. Is it compatible with KV caching and streaming inference?
10. How does it extrapolate beyond the positions observed in training?

## Related

- [Positional Encoding: From Sinusoidal Features to RoPE](/atlas/ai/architectures/transformers/positional-encoding-sinusoidal-to-rope)
- [RoPE Scaling](/atlas/ai/architectures/transformers/rope-scaling)
- [No Positional Embeddings (NoPE)](/atlas/ai/architectures/transformers/no-positional-embeddings-nope)
- [Attention Variants](/atlas/ai/architectures/transformers/attention-variants)
- [Linear Attention](/atlas/ai/architectures/transformers/linear-attention)

## Sources

- Alok Puranik, [Using group theory to explore the space of positional encodings for attention](https://blog.janestreet.com/using-group-theory-to-explore-positional-encodings-attention/), Jane Street, 2026.
- Zhang et al., [Group Representational Position Encoding](https://arxiv.org/abs/2512.07805), ICLR 2026.
- Su et al., [RoFormer: Enhanced Transformer with Rotary Position Embedding](https://arxiv.org/abs/2104.09864), 2021.
- Press et al., [Train Short, Test Long: Attention with Linear Biases Enables Input Length Extrapolation](https://arxiv.org/abs/2108.12409), 2021.
- Sun et al., [Retentive Network: A Successor to Transformer for Large Language Models](https://arxiv.org/abs/2307.08621), 2023.
