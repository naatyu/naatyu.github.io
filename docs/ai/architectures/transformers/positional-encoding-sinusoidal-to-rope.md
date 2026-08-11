---
title: "Positional Encoding: From Sinusoidal Features to RoPE"
date: 2026-08-11
lastmod: 2026-08-11
tags:
  - ai/transformers
  - positional-encoding
  - attention
  - rope
draft: false
---

## Summary

Sinusoidal positional encoding and Rotary Positional Embeddings (RoPE) use the same basic geometry: pairs of sine and cosine values behave like two-dimensional clocks rotating at different speeds.

They inject that geometry differently:

- classic sinusoidal encoding **adds** a position-dependent vector to each token representation;
- RoPE **rotates** pairs of query and key features by position-dependent angles.

The rotation identity

$$
R(m\omega)^\top R(n\omega)=R((n-m)\omega)
$$

makes RoPE attention scores depend naturally on relative displacement. This note develops the intuition from sinusoidal features to that identity.

## 1. Why positional information is needed

Unmasked self-attention without positional signals is permutation-equivariant: permuting the input tokens permutes the outputs in the same way. It has no intrinsic way to distinguish the same content arranged in different orders.

The original Transformer adds a positional vector to the token embedding:

$$
h_p=E(x_p)+PE(p),
$$

where:

- $E(x_p)$ is the embedding of the token at position $p$;
- $PE(p)$ is its positional encoding.

There is an important decoder-only nuance. Even without explicit positional embeddings, a causal mask gives different positions access to different prefix lengths. That asymmetry can let a sufficiently deep causal Transformer infer some positional information. Explicit positional methods nevertheless provide a much more direct positional inductive bias. See [No Positional Embeddings (NoPE)](/atlas/ai/architectures/transformers/no-positional-embeddings-nope).

## 2. Sinusoidal positional encoding

The original Transformer defines

$$
PE_{p,2i}
=
\sin\left(\frac{p}{10000^{2i/d}}\right),
$$

$$
PE_{p,2i+1}
=
\cos\left(\frac{p}{10000^{2i/d}}\right),
$$

where:

- $p$ is the token position;
- $d=d_{\text{model}}$ is the embedding width;
- $i$ indexes pairs of embedding dimensions.

Define the angular frequency

$$
\omega_i=10000^{-2i/d}.
$$

Each pair is then

$$
\left[
\sin(p\omega_i),
\cos(p\omega_i)
\right].
$$

The complete positional vector concatenates many such pairs:

$$
PE(p)
=
\left[
\sin(p\omega_0),\cos(p\omega_0),
\sin(p\omega_1),\cos(p\omega_1),
\ldots
\right].
$$

## 3. Mental model: many clocks

Each sine/cosine pair is one clock. A high-frequency pair changes rapidly with position:

$$
\left[\sin(p),\cos(p)\right],
$$

while a lower-frequency pair changes more slowly:

$$
\left[\sin(p/100),\cos(p/100)\right].
$$

Conceptually:

```text
dimensions 0,1  -> fast clock
dimensions 2,3  -> slightly slower clock
dimensions 4,5  -> slower clock
...
```

The position is represented by the combined state of all the clocks. The model does not need to decode this state into an explicit integer such as “position 37.” It can learn linear and attention operations that exploit the structured changes between positions.

## 4. Why both sine and cosine are needed

One sinusoid is ambiguous. For example,

$$
\sin(30^\circ)=\sin(150^\circ).
$$

The pair $(\cos\theta,\sin\theta)$ identifies a complete point on the unit circle:

$$
(\cos30^\circ,\sin30^\circ)=(0.866,0.5),
$$

$$
(\cos150^\circ,\sin150^\circ)=(-0.866,0.5).
$$

Thus one frequency naturally occupies a two-dimensional plane:

$$
\boxed{
\text{one frequency}
\longleftrightarrow
\text{one pair of dimensions}
}.
$$

Sine-first versus cosine-first is only a convention. The important constraint is that each pair contains both quadrature components for the same angle and that all later operations use the same convention.

## 5. The rotation interpretation

A two-dimensional rotation matrix is

$$
R(\theta)
=
\begin{bmatrix}
\cos\theta & -\sin\theta\\
\sin\theta & \cos\theta
\end{bmatrix}.
$$

Rotating the unit vector gives

$$
R(\theta)
\begin{bmatrix}1\\0\end{bmatrix}
=
\begin{bmatrix}
\cos\theta\\
\sin\theta
\end{bmatrix}.
$$

Therefore $(\cos\theta,\sin\theta)$ is literally the coordinate of a rotating unit vector. At position $p$, the angle of pair $i$ is

$$
\theta_{p,i}=p\omega_i.
$$

Each pair rotates at its own angular speed. This is the geometric basis of the clock analogy.

Classic sinusoidal encoding does **not** need to construct or apply a rotation matrix. It directly computes sine and cosine values and adds them to the token representation. The rotation is an interpretation of its geometry. RoPE later turns this interpretation into an actual operation on query and key features.

## 6. Why every pair normally gets a different frequency

If multiple pairs used exactly the same frequency,

$$
\left[
\sin(p\omega),\cos(p\omega),
\sin(p\omega),\cos(p\omega)
\right],
$$

the second pair would duplicate the positional signal of the first. Giving each pair a distinct frequency provides more positional scales for the same dimensional budget.

For eight positional dimensions:

```text
(0,1) -> omega_0
(2,3) -> omega_1
(4,5) -> omega_2
(6,7) -> omega_3
```

Frequency sharing is not mathematically forbidden. It trades frequency diversity for extra representational capacity or redundancy at a particular scale.

## 7. Why many frequencies are necessary

One clock is periodic. The pair

$$
[\sin(p\omega),\cos(p\omega)]
$$

repeats after a displacement of $2\pi/\omega$.

Many different clocks make the combined state distinguish positions over a much larger useful range. The analogy is a physical clock:

```text
seconds hand -> fine changes, repeats quickly
minutes hand -> medium changes
hours hand   -> coarse changes, repeats slowly
```

High-frequency dimensions resolve nearby changes. Low-frequency dimensions retain slowly varying information over long distances.

The mapping is still periodic in each pair, and uniqueness over arbitrary sequence lengths is not guaranteed as a formal integer code. What matters is that the combined feature map supplies diverse, structured position-dependent phases over the working context range.

## 8. Why the exponent is $2i/d$

Every frequency consumes two dimensions, so

$$
i=0,\ldots,\frac{d}{2}-1.
$$

The ratio

$$
\frac{2i}{d}
$$

is a normalized pair index running approximately from zero to one.

For $d=8$, the pair indices $i=0,1,2,3$ produce

$$
\frac{2i}{8}
=
0,\frac14,\frac12,\frac34.
$$

With base 10000, the denominators become

$$
1,10,100,1000,
$$

and the frequencies are

$$
1,\frac{1}{10},\frac{1}{100},\frac{1}{1000}.
$$

Putting the normalized index in an exponent creates **logarithmically spaced frequencies**. Using $2i$ without normalization would instead produce denominators such as $1,10^8,10^{16},\ldots$, causing almost every clock to vary negligibly over ordinary context lengths.

## 9. Why logarithmic frequency spacing is useful

Positional relationships span multiple orders of magnitude. A model may need to distinguish:

- adjacent tokens;
- words within a phrase;
- statements across a function;
- references separated by thousands of tokens.

Logarithmic spacing distributes a fixed number of dimensions across fine, medium, and coarse positional scales. Linear frequency spacing would concentrate resolution in a narrower range of wavelengths.

This resembles a multiscale signal representation: several wavelengths expose structure at different distances.

## 10. What the base 10000 controls

There is nothing fundamental about 10000. It is a design choice from the original Transformer.

For

$$
\omega_i=b^{-2i/d},
$$

the base $b$ controls the spread of the frequency spectrum. With a sufficiently large $d$ and $b=10000$, frequencies range approximately from $1$ to $10^{-4}$, corresponding to wavelengths from roughly $2\pi$ to $2\pi\times10000$.

A larger base makes the low-frequency clocks rotate more slowly. Modern RoPE models may use bases much larger than 10000 or modify individual frequencies for long-context extension. The base is therefore a frequency-spectrum hyperparameter, not a mathematical constant.

Increasing it is not free: a very large base can make some dimensions change too slowly to be useful over the training lengths. See [RoPE Scaling](/atlas/ai/architectures/transformers/rope-scaling) for adjusted bases, interpolation, YaRN, ReRoPE, and partial RoPE.

## 11. Why the structure is useful to a neural network

For one frequency, use the cosine-first convention

$$
u_\omega(p)
=
\begin{bmatrix}
\cos(p\omega)\\
\sin(p\omega)
\end{bmatrix}.
$$

Moving from $p$ to $p+r$ is a fixed linear transformation:

$$
u_\omega(p+r)=R(r\omega)u_\omega(p).
$$

The transformation depends only on displacement $r$, not on the starting position $p$. Thus the change from 10 to 11 has the same form as the change from 500 to 501 for a given frequency.

The dot product also exposes relative displacement:

$$
u_\omega(p)^\top u_\omega(q)
=
\cos((p-q)\omega).
$$

Across all pairs, the positional dot product is a sum of cosine terms at different frequencies. These identities make relative relationships accessible to the Transformer's linear projections and dot-product attention.

## 12. From additive sinusoidal encoding to RoPE

Classic sinusoidal encoding adds a position-specific feature vector:

$$
x_p'=x_p+PE(p).
$$

RoPE instead rotates existing pairs inside queries and keys. For one query pair

$$
q=
\begin{bmatrix}q_0\\q_1\end{bmatrix},
$$

RoPE at position $p$ computes

$$
q_p'=R(p\omega)q.
$$

Explicitly,

$$
q_0'
=
q_0\cos(p\omega)-q_1\sin(p\omega),
$$

$$
q_1'
=
q_0\sin(p\omega)+q_1\cos(p\omega).
$$

The same operation is applied to key pairs. Standard RoPE does not rotate values.

```text
Sinusoidal PE

position -> sine/cosine vector -> add to token representation

RoPE

position -> rotation angles -> rotate Q and K feature pairs
```

Unlike the original sinusoidal formula, whose width is $d_{\text{model}}$, RoPE frequencies are normally defined across the rotary part of each attention head, often using $d_{\text{head}}$ or a chosen rotary subdimension.

A rotation preserves the norm of each pair and is invertible. It changes the orientation of the learned content features without replacing them with positional features.

## 13. Why RoPE exposes relative position in attention

Let a query at position $m$ and a key at position $n$ be rotated by the same frequency:

$$
q_m'=R(m\omega)q_m,
$$

$$
k_n'=R(n\omega)k_n.
$$

Their contribution to the attention score is

$$
(q_m')^\top k_n'
=
q_m^\top R(m\omega)^\top R(n\omega)k_n.
$$

Because

$$
R(\theta)^\top=R(-\theta)
$$

and rotations compose by adding their angles,

$$
R(-m\omega)R(n\omega)=R((n-m)\omega).
$$

Therefore,

$$
\boxed{
(q_m')^\top k_n'
=
q_m^\top R((n-m)\omega)k_n
}.
$$

The positional part of the interaction depends on relative displacement $n-m$, even though each query and key was rotated using its absolute position. This is the central algebraic property of RoPE.

RoPE does not make attention scores functions **only** of distance: $q_m$ and $k_n$ still contain content. It makes the positional transformation between them depend on relative distance.

## 14. Minimal PyTorch implementation

The interleaved-pair version can be written directly:

```python
import torch


def apply_rope(
    x: torch.Tensor,
    cos: torch.Tensor,
    sin: torch.Tensor,
) -> torch.Tensor:
    """
    x:   [..., sequence, head_dim]
    cos: broadcastable to [..., sequence, head_dim // 2]
    sin: broadcastable to [..., sequence, head_dim // 2]
    """
    x_even = x[..., 0::2]
    x_odd = x[..., 1::2]

    rotated_even = x_even * cos - x_odd * sin
    rotated_odd = x_even * sin + x_odd * cos

    return torch.stack(
        (rotated_even, rotated_odd),
        dim=-1,
    ).flatten(start_dim=-2)
```

Build the angles for sequence positions and rotary pairs:

```python
def rope_frequencies(
    sequence_length: int,
    head_dim: int,
    base: float = 10_000.0,
    device: torch.device | None = None,
):
    assert head_dim % 2 == 0

    pair_index = torch.arange(
        0,
        head_dim,
        2,
        device=device,
        dtype=torch.float32,
    )
    inverse_frequency = base ** (-pair_index / head_dim)

    positions = torch.arange(
        sequence_length,
        device=device,
        dtype=torch.float32,
    )
    angles = positions[:, None] * inverse_frequency[None, :]
    return angles.cos(), angles.sin()
```

For tensors shaped `[batch, heads, sequence, head_dim]`, reshape the tables to `[1, 1, sequence, head_dim // 2]` and apply the same tables to queries and keys:

```python
cos, sin = rope_frequencies(seq_len, head_dim, device=q.device)
cos = cos[None, None, :, :]
sin = sin[None, None, :, :]

q = apply_rope(q.float(), cos, sin).to(q.dtype)
k = apply_rope(k.float(), cos, sin).to(k.dtype)
```

Production implementations often use fused kernels, cache tables, support offsets during autoregressive decoding, and may use a split-half layout rather than adjacent pairs. The pairing convention and frequency-table layout must match.

## 15. Final mental model

### Sinusoidal positional encoding

A position is represented by many clocks:

$$
\left[
\sin(p\omega_0),\cos(p\omega_0),
\sin(p\omega_1),\cos(p\omega_1),
\ldots
\right].
$$

- one pair is one clock;
- phase is naturally two-dimensional;
- logarithmically spaced frequencies cover multiple distance scales;
- the complete vector is added to the token representation.

### RoPE

Use the same clock phases to rotate each two-dimensional pair of queries and keys:

$$
\boxed{
\text{rotate each Q/K pair by its position-dependent phase}
}.
$$

The conceptual progression is

$$
\boxed{
\text{sine and cosine}
\rightarrow
\text{2D clocks}
\rightarrow
\text{multiple frequency scales}
\rightarrow
\text{rotations}
\rightarrow
\text{relative-position attention}
}.
$$

## Related

- [RoPE Scaling](/atlas/ai/architectures/transformers/rope-scaling)
- [No Positional Embeddings (NoPE)](/atlas/ai/architectures/transformers/no-positional-embeddings-nope)
- [Attention Mechanism](/atlas/ai/foundations/attention-mechanism)
- [Attention Variants](/atlas/ai/architectures/transformers/attention-variants)
- [Progressive Context Extension](/atlas/ai/training/scaling/progressive-context-extension)

## Sources

- Vaswani et al., [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
- Su et al., [RoFormer: Enhanced Transformer with Rotary Position Embedding](https://arxiv.org/abs/2104.09864)
- Haviv et al., [Transformer Language Models without Positional Encodings Still Learn Positional Information](https://aclanthology.org/2022.findings-emnlp.99/)
