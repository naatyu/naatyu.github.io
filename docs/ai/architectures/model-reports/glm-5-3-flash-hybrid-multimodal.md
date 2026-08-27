---
title: "GLM-5.3-Flash: Hybrid Attention at Flash Cost"
date: 2026-08-26
lastmod: 2026-08-26
tags:
  - ai/llm
  - models
  - multimodal
  - mixture-of-experts
  - linear-attention
  - sparse-attention
  - inference
draft: false
---

## Summary

GLM-5.3-Flash is a newly pretrained, native image/video/text Mixture-of-Experts model with `320B` total parameters and `18B` activated parameters. It is not a compressed GLM-5.2 checkpoint. Its released architecture is a new `45`-block backbone combining:

- `34` Kimi Delta Attention linear-attention blocks
- `11` NoPE MLA + DeepSeek Sparse Attention blocks
- IndexPool, which scores groups of four indexer keys instead of every token independently
- four-stream Manifold-Constrained Hyper-Connections instead of ordinary residual addition
- `288` routed experts, with eight selected per token and one shared expert
- a `24`-block vision transformer for images and video
- a `1,048,576`-token configured context window

The release is worth a note because several recent architecture trends appear together in a production open-weight model: hybrid recurrent/global attention, NoPE, mHC, highly sparse MoE, indexer compression, native multimodality, and disaggregated multimodal serving.

The evidence is less complete than for GLM-5. Z.ai has released weights, configuration, model code, a model card, and a detailed blog post, but no dedicated GLM-5.3-Flash technical report. The model card cites the older GLM-5 report, which does not describe this architecture or training run.

## 1. Model at a glance

| Property | GLM-5.3-Flash |
| :--- | ---: |
| Model type | Native image/video/text causal MoE |
| Total parameters | `320B` reported |
| Activated parameters | `18B` reported per token |
| Text decoder blocks | `45` |
| Hidden dimension | `4,096` |
| Attention pattern | `3` KDA + `1` DSA, repeated, then final KDA |
| KDA blocks | `34` |
| DSA/MLA blocks | `11` |
| Dense FFN blocks | first `3` |
| MoE FFN blocks | remaining `42` |
| Routed experts | `288` |
| Active routed experts | `8` per token |
| Shared experts | `1` always active |
| Dense FFN dimension | `12,288` |
| Expert FFN dimension | `2,048` |
| Residual mechanism | four-stream mHC |
| Text position mechanism | NoPE in DSA; recurrent KDA state and short convolution |
| DSA selected tokens | top `2,048`, plus up to three incomplete-tail tokens |
| IndexPool group size | `4` tokens |
| Maximum positions | `1,048,576` |
| Vocabulary | `154,880` |
| MTP modules | `1` |
| Vision blocks | `24` |
| Vision width | `1,024` |
| Vision patch tubelet | `2 x 14 x 14` |
| License | MIT |

The checkpoint is BF16, has untied input and output embeddings, uses no attention bias in the text decoder, and sets attention dropout to zero.

## 2. Complete text architecture

The `45` blocks follow this exact attention sequence:

```text
block  0: KDA       + dense FFN
block  1: KDA       + dense FFN
block  2: KDA       + dense FFN
block  3: DSA/MLA   + MoE

block  4: KDA       + MoE
block  5: KDA       + MoE
block  6: KDA       + MoE
block  7: DSA/MLA   + MoE

... repeat three KDA then one DSA ...

block 43: DSA/MLA   + MoE
block 44: KDA       + MoE
```

Every attention and FFN sublayer is wrapped in its own mHC module:

```text
four residual streams: [B, S, 4, 4096]
    |
    +-> mHC collapses streams into one sublayer input
    +-> RMSNorm
    +-> KDA or DSA/MLA
    +-> mHC redistributes output across four streams
    |
    +-> mHC collapses streams into one FFN input
    +-> RMSNorm
    +-> dense SwiGLU or sparse MoE
    +-> mHC redistributes output across four streams
    |
next block keeps four streams
```

At the end of the decoder, the four streams are averaged, followed by final RMSNorm and the vocabulary projection.

This is a genuine multi-stream residual architecture. The text embedding is initially copied into four streams; it is not simply made four times wider and immediately collapsed permanently.

## 3. Hybrid attention

The architecture separates two different memory operations:

```text
KDA:
    compress sequence history into recurrent matrix state
    fixed-size state during decoding

DSA/MLA:
    retrieve specific earlier tokens
    sparse but exact attention over selected KV entries
```

KDA is cheap at long sequence lengths but compresses the past. Periodic DSA blocks restore precise content-addressable retrieval.

The three-to-one rhythm means only about one quarter of blocks maintain a token-growing MLA KV cache:

$$
\frac{11}{45}\approx24.4\%
$$

The remaining blocks maintain fixed-size recurrent state plus a short convolution state. This is the main reason the KV footprint grows more slowly than in an all-softmax model.

The blog says linear attention captures “local dependencies.” The implementation is more nuanced: a depthwise convolution captures short local structure, while KDA's recurrent matrix can carry compressed information over the full prefix. Its limitation is not strictly locality, but loss of exact token-level retrieval.

## 4. Kimi Delta Attention blocks

GLM-5.3-Flash uses the same general delta-rule family as Kimi Linear and Kimi K3.

Each KDA block has:

| Component | Value |
| :--- | ---: |
| Heads | `64` |
| Head dimension | `128` |
| Total Q/K/V projection width | `8,192` each |
| QKV short convolution | depthwise, kernel size `4` |
| Forget-gate lower bound | `-5` in log space |
| Input/write gate | one scalar per head and token |
| Output gate | one value per head dimension |

The input width is `4,096`, but Q, K, and V each expand to:

$$
64\times128=8,192
$$

After the causal depthwise convolution and SiLU, the delta-rule recurrence reads the current prediction for a key, computes the residual between predicted and new value, and writes that correction into the recurrent state.

A simplified update is:

$$
v'_t = v_t-S_{t-1}^{\top}k_t
$$

$$
S_t
=
\text{decay}_t\odot S_{t-1}
+
\beta_t k_t {v'_t}^{\top}
$$

The exact chunked implementation distributes decay across positions, but the mental model is:

```text
forget selected old memory
write what the memory failed to predict
```

Q and K are L2-normalized inside the KDA kernel. The output is RMS-normalized, sigmoid-gated per feature, flattened from `64 x 128`, and projected back to width `4,096`.

## 5. NoPE MLA and DSA blocks

The eleven global-retrieval blocks combine Multi-head Latent Attention with DeepSeek Sparse Attention.

### MLA dimensions

| Component | Value |
| :--- | ---: |
| Query heads | `64` |
| Query latent rank | `1,536` |
| KV latent rank | `512` |
| Query/key dimension per head | `256` |
| Value dimension per head | `256` |
| RoPE dimensions | `0` |

The query path is:

```text
hidden [4096]
    -> query latent [1536]
    -> RMSNorm
    -> 64 query heads x 256
```

The KV path is:

```text
hidden [4096]
    -> KV latent [512]
    -> RMSNorm
    -> expand into 64 x (256 key + 256 value)
```

Unlike GLM-5, the entire query/key head is NoPE:

```text
qk_nope_head_dim = 256
qk_rope_head_dim = 0
```

No rotary position is applied in the text decoder. Sequence order in KDA blocks comes from recurrent updates and the causal convolution. DSA remains causal but has no explicit absolute or rotary positional phase.

## 6. IndexPool

Original DSA reduces main attention cost but retains a quadratic lightweight indexer: every query scores every earlier indexer key. At a million tokens, this supposedly cheap stage becomes material.

IndexPool compresses consecutive groups of four indexer keys before scoring:

```text
raw indexer keys:
    [k0, k1, k2, k3] [k4, k5, k6, k7] ...

learned weighted pooling:
    p0                p1              ...

query scores pooled keys:
    q dot p0, q dot p1, ...
```

### Pool construction

Each token produces:

- one `128`-dimensional indexer key
- a `128`-dimensional vector of pooling-gate logits

For every four-token pool, the gate logits are combined with a learned four-position embedding. A softmax across the four tokens is computed independently for every key dimension, producing a weighted pooled key:

$$
p_j
=
\sum_{r=0}^{3}
w_{j,r}\odot k_{4j+r}
$$

This is richer than one scalar weight per token: different dimensions of the pooled key can emphasize different members of the group.

### Retrieval

The DSA indexer still uses:

- `32` query heads
- `128` dimensions per head
- ReLU query-key scores
- a learned mixture across indexer heads

But it ranks pools rather than raw positions. With top-`2,048` raw tokens and pool size four, it selects up to:

$$
\frac{2,048}{4}=512
$$

pooled candidates. Selected pools are then expanded back into their four original token indices. Main MLA attention therefore still sees raw KV entries; it does not attend to averaged values.

The current incomplete pool cannot yet form a valid four-token candidate. Its visible raw tokens are appended directly, adding at most three positions. Thus an internal query may attend to up to `2,051` indices.

IndexPool reduces the number of candidates scored by the indexer by roughly the pool factor. The launch post also claims lower indexer memory overhead, but the generic Transformers implementation caches raw keys and pooling gates and reconstructs pools; realizing a fourfold cache reduction therefore depends on the optimized serving representation. It does **not** reduce main MLA's top-`2,048` attention work by four.

This differs from GLM-5.2 IndexShare:

```text
IndexShare:
    reuse selected positions across neighboring DSA layers

IndexPool:
    compress neighboring indexer candidates inside one DSA layer
```

GLM-5.3-Flash's released configuration runs a full indexer in every DSA block. Because DSA blocks are separated by three KDA blocks, it does not use the regular four-layer IndexShare pattern of GLM-5.2.

## 7. Manifold-Constrained Hyper-Connections

Ordinary residual blocks maintain one stream:

$$
x_{l+1}=x_l+F_l(x_l)
$$

GLM-5.3-Flash maintains four streams and learns three token-dependent operations at every attention and FFN site:

1. **Pre:** collapse four streams into the input consumed by the sublayer.
2. **Post:** decide how strongly the sublayer output is written into each stream.
3. **Combine:** mix the four existing streams through a `4 x 4` matrix.

Conceptually:

$$
u_l=H_l^{pre}x_l
$$

$$
x_{l+1}
=
H_l^{comb}x_l
+
{H_l^{post}}^{\top}F_l(u_l)
$$

The combine matrix is projected toward the doubly stochastic manifold using `20` alternating row/column Sinkhorn normalizations with epsilon `1e-6`. Approximately:

```text
every row sums to one
every column sums to one
all entries are non-negative
```

This constrains signal mixing so that learned residual routing does not destroy the identity-like path required for stable deep training.

The released configuration uses:

```text
hc_mult = 4
hc_sinkhorn_iters = 20
```

mHC increases residual-stream memory traffic. The benefit is learned depth topology and improved scaling efficiency; it should not be described as an inference optimization by itself.

## 8. MoE structure and parameter accounting

Blocks `0–2` use dense clamped SwiGLU FFNs:

```text
4096 -> 12288 -> 4096
```

Blocks `3–44` use sparse MoE FFNs. Each has:

- `288` routed experts
- top-`8` routed experts per token
- one always-active shared expert
- expert intermediate width `2,048`

Each expert contains gate, up, and down matrices:

$$
3\times4096\times2048
=
25.17\text{M parameters}
$$

One MoE block stores approximately:

$$
(288+1)\times25.17\text{M}
\approx7.27\text{B expert parameters}
$$

Across `42` MoE blocks:

$$
42\times7.27\text{B}
\approx305.5\text{B}
$$

This explains most of the reported `320B` total. A token executes eight routed plus one shared expert:

$$
42\times9\times25.17\text{M}
\approx9.51\text{B active expert parameters}
$$

Dense FFNs add about `0.45B` active parameters; attention, mHC, embeddings, vision, norms, routers, and MTP account for the rest of the reported `18B` active total.

The router computes logits in FP32, applies sigmoid scores, adds a loss-free correction bias for selection, normalizes the eight selected weights, and multiplies them by `2.5`. Expert SwiGLU activations are clamped:

```text
gate upper bound:  10
up branch range:  -10 to 10
```

The clamp is a training-stability measure against extreme expert activations.

## 9. Native vision architecture

The vision encoder accepts images and videos.

| Component | Value |
| :--- | ---: |
| Blocks | `24` |
| Hidden width | `1,024` |
| Attention heads | `16` |
| Head dimension | `64` |
| FFN dimension | `4,096` |
| Spatial patch | `14 x 14` |
| Temporal patch | `2` frames |
| Spatial merge | `2 x 2` |
| Projected language width | `4,096` |
| Merger intermediate dimension | `10,240` |

Input pixels are embedded with a 3D convolution whose kernel and stride are:

```text
temporal x height x width = 2 x 14 x 14
```

The vision blocks use non-causal full self-attention, QK normalization, spatial-temporal position IDs, rotary embeddings, pre-RMSNorm, and clamped SwiGLU.

After the final vision block:

1. apply RMSNorm
2. merge each `2 x 2` spatial group with a strided convolution
3. expand width from `1,024` to `4,096`
4. process through a gated projection with intermediate width `10,240`
5. replace image/video placeholder embeddings in the text stream

For a nominal `448 x 448` image, the initial `14 x 14` patches form a `32 x 32` grid. The `2 x 2` merge reduces this to `16 x 16 = 256` language-side visual tokens per temporal tubelet, before accounting for processor-specific resizing or packing.

## 10. Multimodal training and visual agents

The release reports a `30T`-token multimodal pretraining corpus, but does not publish its composition, modality ratio, deduplication recipe, optimizer, schedule, or compute budget.

The most reusable post-training idea is **visual coding in the loop**. Their synthetic trajectories require the agent to:

```text
write or edit code
    -> render or run the artifact
    -> inspect the visual result
    -> judge its own output
    -> revise code
    -> repeat
```

For frontend coding, Z.ai also reports reinforcement learning with environment feedback and agent-based verification grounded in real user flows. This evaluates more than whether code compiles:

- actual rendered layout
- interaction behavior
- GUI judgment
- visual quality
- success along a user workflow

The post is conceptually useful but underspecified. It gives no dataset size, number of environments, rollout volume, reward formula, verifier accuracy, or controlled ablation.

## 11. Serving architecture

Z.ai reports several co-designed serving techniques:

- intra-node tensor parallelism for KDA and the LM head
- ReplaySSM for recurrent-state decoding
- W8A8 quantization
- mixed INT8/FP8/BF16 cache quantization
- Layer Split
- Encode–Prefill–Decode disaggregation

EPD places three workloads in independently scalable worker pools:

```text
vision encode
    -> text/multimodal prefill
    -> autoregressive decode
```

This matters because vision encoding is dense and parallel, prefill is compute-heavy, and decoding is memory/communication-heavy. One fixed replica composition is unlikely to serve all three efficiently.

The blog reports deployment across tens of thousands of Chinese accelerators and a `3x` end-to-end serving improvement relative to its initial implementation on the same hardware. This is an optimization-over-baseline claim, not evidence that the model is universally three times faster than another model or GPU stack.

The provider also claims that, relative to GLM-5.3, GLM-5.3-Flash reduces average per-head/per-layer attention compute by `3.0x` and BF16 KV-cache size by `4.4x`. These are analytical architecture comparisons; the release does not provide the underlying formula table or independently reproducible end-to-end measurements.

## 12. Reported results

### Base model

The base checkpoint is competitive with, but does not uniformly exceed, GLM-5-Base:

| Benchmark | GLM-5-Base | GLM-5.3-Flash-Base |
| :--- | ---: | ---: |
| MMLU | `88.3` | `88.1` |
| BBH | `87.4` | `86.6` |
| HellaSwag | `88.1` | `87.1` |
| LiveCodeBench-Base | `34.4` | `37.6` |
| SimpleQA | `36.0` | `33.5` |

This is the more informative architectural comparison: the smaller active model retains much of GLM-5's base capability and improves the reported coding base score, but pays quality on several general benchmarks.

### Post-trained coding, agents, and vision

Selected release results:

| Benchmark | GLM-5.3-Flash | GLM-5.2 | Claude Opus 4.8 |
| :--- | ---: | ---: | ---: |
| Terminal-Bench 2.1 | `84.3` | `81.0` | `85.0` |
| DeepSWE v1.1 | `63.4` | `46.2` | `58.0` |
| NL2Repo | `56.3` | `48.9` | `69.7` |
| Toolathlon Verified | `78.4` | `59.9` | `76.2` |
| AutomationBench v1.0.6 | `48.8` | `26.2` | `41.0` |
| Agents' Last Exam | `26.3` | `20.4` | `27.0` |
| HLE with tools | `55.3` | `54.7` | `57.9` |

Selected multimodal scores include `62.4` on OfficeQA Pro, `89.4` on CharXiv Reasoning with tools, `78.0` on Chartography with tools, and `77.8` on MVBench.

These comparisons use different harnesses, context limits, sampling settings, judges, and sometimes tool access. Examples include Claude Code for Terminal-Bench, mini-swe-agent for DeepSWE, a `1M` context for NL2Repo, context management for HLE, and model judging. They demonstrate the complete deployed system, not a controlled isolation of architecture quality.

## 13. Critical interpretation

### What is well supported

- The released checkpoint really implements a 34-KDA/11-DSA hybrid.
- IndexPool scores learned four-token pooled index keys and expands selected pools back to raw tokens.
- Text attention uses NoPE throughout.
- Four-stream mHC wraps both attention and FFN sublayers.
- The architecture stores roughly `305B` parameters in its expert matrices while executing only nine experts per MoE block.
- The vision encoder and multimodal token injection are present in the open implementation.

### What remains a vendor claim

- causal attribution of benchmark gains to any one architectural component
- the full `30T` data recipe
- “one-tenth the price” as a stable or hardware-independent property
- end-to-end attention/KV savings outside Z.ai's accounting assumptions
- visual-RL effectiveness without dataset and ablation details
- serving parity across hardware ecosystems

The discounted task price is a product snapshot, not an invariant of the model. Provider utilization, batching, quantization, subsidy, cache-hit rate, and hardware all affect it.

### Important architectural costs

- mHC carries four residual streams and increases memory traffic.
- KDA requires specialized recurrent and chunkwise kernels.
- DSA requires a custom per-query sparse-attention kernel; generic eager masking loses much of its benefit.
- IndexPool trades index precision for fourfold candidate compression.
- The model remains `320B`; low active compute does not remove storage and expert-parallel communication requirements.
- Native multimodal serving introduces a separate encoder workload and large visual-token prefills.

## 14. Main takeaways

1. Hybrid attention is moving from research models into practical open-weight serving stacks.
2. Linear attention is most convincing when periodic exact retrieval compensates for compressed state.
3. The selector for sparse attention can itself require compression at million-token context.
4. IndexPool and IndexShare optimize different axes and can conceptually be combined.
5. NoPE avoids rotary extrapolation but transfers the burden of usable order information to causal recurrence, convolutions, and learned content representations.
6. mHC treats residual routing as an architecture dimension, though its memory cost must be justified by scaling gains.
7. Active parameters determine much of token compute; total parameters still determine storage and expert distribution.
8. Native visual coding requires render–inspect–revise trajectories and environment-grounded verification, not merely image caption data.
9. Multimodal encode, prefill, and decode are sufficiently different that independent serving pools are a natural systems design.
10. A released config and implementation can reveal much more than a launch post, but they cannot replace training ablations and data documentation.

## Related

- [GLM-5: From Vibe Coding to Agentic Engineering](/atlas/ai/architectures/model-reports/glm-5-agentic-engineering)
- [Kimi K3: Open Frontier Intelligence](/atlas/ai/architectures/model-reports/kimi-k3-open-frontier-intelligence)
- [Linear Attention](/atlas/ai/architectures/transformers/linear-attention)
- [Attention Residuals](/atlas/ai/architectures/transformers/attention-residuals)
- [No Positional Embeddings (NoPE)](/atlas/ai/architectures/transformers/no-positional-embeddings-nope)
- [Attention Variants](/atlas/ai/architectures/transformers/attention-variants)
- [MoE Routing and Load Balancing](/atlas/ai/training/optimization/moe-routing-and-load-balancing)
- [Quantization-Aware Training](/atlas/ai/training/precision/quantization-aware-training)

## Sources

- Z.ai, [GLM-5.3-Flash: Frontier Intelligence, Flash Cost](https://z.ai/blog/glm-5.3-flash)
- Z.ai, [GLM-5.3-Flash model card and weights](https://huggingface.co/zai-org/GLM-5.3-Flash)
- Z.ai, [GLM-5.3-Flash released configuration](https://huggingface.co/zai-org/GLM-5.3-Flash/blob/main/config.json)
- Hugging Face Transformers, [GLM5-Next reference implementation](https://github.com/huggingface/transformers/blob/main/src/transformers/models/glm5_next/modeling_glm5_next.py)
- Zhenda Xie et al., [mHC: Manifold-Constrained Hyper-Connections](https://arxiv.org/abs/2512.24880)
- Kimi Team, [Kimi Linear: An Expressive, Efficient Attention Architecture](https://arxiv.org/abs/2510.26692)
- GLM-5 Team, [GLM-5: From Vibe Coding to Agentic Engineering](https://arxiv.org/abs/2602.15763)
- Tri Dao, [ReplaySSM: Cache SSM Inputs, Not State](https://tridao.me/blog/2026/replayssm/)
