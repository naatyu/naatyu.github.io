---
title: "Attention Residuals (AttnRes)"
date: 2026-07-30
lastmod: 2026-07-30
tags:
  - ai/llm
  - transformers
  - residuals
  - attention
draft: false
---

## Summary

Attention Residuals, or **AttnRes**, replace the fixed additive residual stream with learned softmax attention over depth.

A standard Pre-Norm transformer gives every preceding layer output an implicit weight of `1`. AttnRes instead lets each layer select earlier representations using token-dependent attention weights. Full AttnRes attends to every preceding layer output. Block AttnRes compresses groups of layers into block summaries, preserving most of the gain with practical memory and communication costs.

The Kimi Team reports:

- consistent scaling-law gains over standard residuals
- approximately `1.25x` compute advantage at the largest proxy scale
- less than `4%` measured training overhead with pipeline parallelism
- less than `2%` inference-latency overhead on their typical workloads
- improvements on every reported downstream benchmark in a `48B` total / `3B` active Kimi Linear model trained on `1.4T` tokens

The central idea is:

> token attention selects information across sequence position; AttnRes selects information across network depth.

## Concepts

- **Depth-wise attention:** attention where the sources are earlier-layer outputs rather than earlier tokens.
- **Pseudo-query:** one learned vector per layer that queries earlier representations.
- **Full AttnRes:** softmax attention over every preceding layer output.
- **Block AttnRes:** softmax attention over completed block summaries and the current block's partial residual.
- **Pre-Norm dilution:** the shrinking relative influence of each new layer as an unnormalized residual stream grows with depth.
- **Depth mixing matrix:** the matrix describing how strongly every layer reads every preceding layer.
- **Two-phase computation:** batched inter-block attention followed by sequential intra-block attention and an online-softmax merge.

## 1. The residual stream is already a depth mixer

For layer transformation $f_l$, a standard residual recurrence is:

$$
h_l
=
h_{l-1}
+
f_{l-1}(h_{l-1})
$$

Let:

$$
v_0 = h_1
$$

be the token embedding and:

$$
v_i = f_i(h_i), \qquad i \ge 1
$$

be the output produced by layer $i$. Unrolling the recurrence gives:

$$
h_l
=
\sum_{i=0}^{l-1} v_i
$$

So the ordinary residual stream implicitly aggregates every preceding source with the same coefficient:

$$
M_{i\rightarrow l}=1
$$

where $M$ is a lower-triangular depth mixing matrix.

This is useful for gradient flow, but restrictive as an information-routing rule:

- every earlier output is treated equally
- a layer cannot recover an earlier representation individually
- information is compressed irreversibly into one running sum
- the residual magnitude can grow with depth

Residual connections are therefore doing two jobs:

1. providing an identity path for gradients
2. defining how information is mixed across depth

AttnRes changes the second job.

## 2. Why Pre-Norm dilution is the target

A Pre-Norm block has the form:

$$
x_{l+1}
=
x_l
+
F_l(\operatorname{Norm}(x_l))
$$

The normalized branch receives controlled-scale inputs, but the residual stream itself is not renormalized after each addition.

The paper describes its magnitude as growing approximately:

$$
\lVert x_l \rVert = O(L)
$$

with depth under the observed correlated accumulation regime. As the accumulated state becomes larger, a fixed-size new layer output contributes a smaller relative change:

$$
\frac{\lVert F_l(\operatorname{Norm}(x_l))\rVert}
{\lVert x_l\rVert}
\rightarrow 0
$$

Deeper layers must then produce increasingly large outputs to remain influential. This is the paper's **Pre-Norm dilution** problem.

Post-Norm bounds the forward scale but repeatedly places normalization on the main gradient path. AttnRes attempts another solution: do not accumulate all earlier outputs with unit weight in the first place.

## 3. Full Attention Residuals

Full AttnRes replaces uniform summation with:

$$
h_l
=
\sum_{i=0}^{l-1}
\alpha_{i\rightarrow l}v_i
$$

where:

$$
\sum_{i=0}^{l-1}\alpha_{i\rightarrow l}=1
$$

Each layer has one learned pseudo-query:

$$
q_l = w_l \in \mathbb{R}^d
$$

Keys and values are the earlier layer outputs:

$$
k_i = v_i
$$

The depth-wise attention score is:

$$
s_{i\rightarrow l}
=
w_l^\top \operatorname{RMSNorm}(k_i)
$$

and:

$$
\alpha_{i\rightarrow l}
=
\frac{\exp(s_{i\rightarrow l})}
{\sum_{j=0}^{l-1}\exp(s_{j\rightarrow l})}
$$

The query is fixed for a layer after training, but the keys depend on the current token. The resulting mixture is therefore token-dependent.

RMSNorm on keys is important: without it, sources with larger magnitude can dominate the softmax for scale rather than content.

### Complexity

For $L$ layers and hidden dimension $d$, Full AttnRes requires:

$$
O(L^2d)
$$

arithmetic and:

$$
O(Ld)
$$

stored depth-wise sources per token.

The arithmetic is modest because model depth is far smaller than sequence length. The practical difficulty is preserving and communicating all earlier layer outputs when activation recomputation and pipeline parallelism are used.

## 4. Block Attention Residuals

Block AttnRes partitions the $L$ layers into $N$ blocks, each with approximately:

$$
S = \frac{L}{N}
$$

layers.

Inside completed block $n$, its layer outputs are summed:

$$
b_n
=
\sum_{j\in B_n}f_j(h_j)
$$

Across blocks, each layer attends to:

- the token embedding $b_0$
- every completed block representation
- the evolving partial sum of its current block

This changes storage and communication from:

$$
O(Ld)
$$

to:

$$
O(Nd)
$$

The extremes are:

- $N=L$: Full AttnRes
- $N=1$: close to a standard residual stream, with the embedding isolated as a separate source

The experiments find that approximately `8` blocks recover most of the Full AttnRes gain across model scales.

This is more effective than retaining only a sliding window of recent layer outputs. In the ablation, access to a few distant summaries mattered more than access to many nearby individual layers.

## 5. Why the pseudo-query is deliberately simple

A natural alternative is to derive the query from the current hidden state:

$$
q_l = W_l h_l
$$

This improved proxy validation loss from `1.737` to `1.731`, but requires a $d\times d$ projection at every layer and makes depth-wise reads sequential during decoding.

The default learned pseudo-query:

$$
q_l=w_l
$$

is slightly less expressive but enables all queries within a block to be computed in parallel.

Other ablations support the chosen design:

| Variant | Validation loss |
| --- | ---: |
| Pre-Norm baseline | `1.766` |
| DenseFormer, static cross-layer weights | `1.767` |
| mHC | `1.747` |
| Full AttnRes | `1.737` |
| Input-dependent query | `1.731` |
| Input-independent mixing | `1.749` |
| Sigmoid instead of softmax | `1.741` |
| Full AttnRes without key RMSNorm | `1.743` |
| Block AttnRes, block size `4` | `1.746` |
| Block AttnRes with `16` heads | `1.752` |
| Block AttnRes without key RMSNorm | `1.750` |

The multi-head result suggests that the useful depth mixture is mostly shared across channels: when an earlier layer output matters, it tends to matter as a whole representation.

Softmax also outperforms sigmoid gating. Competition for a fixed probability mass appears to encourage more selective depth routing.

## 6. Systems design

### Training

Under ordinary training without recomputation, the layer outputs are already retained for backpropagation, so Full AttnRes adds little memory.

At scale, pipeline parallelism is the harder problem. A naïve implementation repeatedly transmits the entire block history across stages. The paper caches block representations on each physical pipeline rank and sends only newly completed blocks at later virtual-stage transitions.

For $P$ physical and $V$ virtual stages, this reduces peak per-transition communication from scaling with:

$$
O(PV)
$$

chunks to:

$$
O(P)
$$

The reported end-to-end training overhead for Block AttnRes is:

- negligible without pipeline parallelism
- less than `4%` with pipeline parallelism

### Inference

The layer pseudo-queries are known before the block executes. The implementation uses two phases:

1. **Inter-block phase:** batch all $S$ queries in a block against previous block summaries.
2. **Intra-block phase:** process the current block sequentially and merge its evolving partial sum with the precomputed inter-block result using online softmax.

For a representative configuration with:

$$
L=128,\qquad N=8,\qquad S=16
$$

the paper estimates residual-mechanism memory I/O per token per layer as:

| Mechanism | Typical memory I/O |
| --- | ---: |
| Standard residual | $3d$ |
| Block AttnRes | $5.5d$ |
| Full AttnRes with optimized schedule | $24d$ |
| mHC with four streams | $34d$ |

The reported inference-latency overhead is less than `2%` on typical workloads.

### Long-context prefill

Block summaries add a cache of:

$$
N T d
$$

elements for sequence length $T$. The report gives `15 GB` for `128K` context with `8` blocks before sharding. Sequence sharding across $P$ tensor-parallel devices reduces the per-device footprint to:

$$
N\frac{T}{P}d
$$

The merge is integrated with the normal tensor-parallel reduce-scatter and all-gather path.

## 7. Scaling results

The proxy scaling study covers MoE models with approximately:

- `194M–528M` active parameters
- `38.7B–119B` training tokens
- `12–17` attention layers and the same number of MLP layers
- `8K` context

The fitted curves are:

$$
L_{\text{baseline}}
=
1.891 C^{-0.057}
$$

$$
L_{\text{block}}
=
1.870 C^{-0.058}
$$

$$
L_{\text{full}}
=
1.865 C^{-0.057}
$$

The slopes remain similar, while AttnRes shifts the loss curve downward. At `5.6 PFLOP/s-days`, Block AttnRes reaches validation loss `1.692` versus the baseline's fitted `1.714`, which the paper interprets as a `1.25x` compute advantage.

At the largest proxy scale:

| Model | Baseline | Block AttnRes | Full AttnRes |
| --- | ---: | ---: | ---: |
| `528M` active, `119B` tokens | `1.719` | `1.693` | `1.692` |

Block AttnRes is only `0.001` behind Full AttnRes at that point.

## 8. The 48B Kimi Linear experiment

The large experiment uses:

- `48B` total parameters
- `3B` activated parameters
- `27` transformer blocks, treated as `54` attention/MLP layers
- `8` routed experts out of `256`, plus one shared expert
- `6` layers per AttnRes block
- `9` model blocks plus the token embedding, giving `10` depth-wise sources
- Muon optimizer
- WSD learning-rate schedule
- global batch size of `8M` tokens

Training consists of:

1. `1T` tokens of pretraining at `4K` context
2. approximately `400B` high-quality mid-training tokens
3. progressive context extension to `32K`

The controlled downstream comparison reports:

| Benchmark | Baseline | Block AttnRes | Delta |
| --- | ---: | ---: | ---: |
| MMLU | `73.5` | `74.6` | `+1.1` |
| MMLU-Pro | `52.2` | `52.2` | `0.0` |
| GPQA-Diamond | `36.9` | `44.4` | `+7.5` |
| BBH | `76.3` | `78.0` | `+1.7` |
| MATH | `53.5` | `57.1` | `+3.6` |
| HumanEval | `59.1` | `62.2` | `+3.1` |
| MBPP | `72.0` | `73.9` | `+1.9` |
| CMMLU | `82.0` | `82.9` | `+0.9` |
| C-Eval | `79.6` | `82.5` | `+2.9` |

AttnRes matches or improves the baseline on every reported task. The largest gains occur on multi-step reasoning and code/math tasks, consistent with—but not proving—the idea that compositional problems benefit more from selective cross-layer retrieval.

## 9. What the learned weights reveal

The learned depth attention is mostly local, but not exclusively local:

- layers usually give the most weight to their immediate predecessor
- some layers learn strong long skips to early representations
- the token embedding keeps non-trivial weight even at considerable depth
- attention sublayers use a broader depth receptive field
- MLP sublayers rely more sharply on recent representations
- Block AttnRes produces sharper mixtures while preserving the main Full AttnRes pattern

Block summaries may therefore act as both compression and implicit regularization.

The paper also observes depth-wise attention sinks: some sources receive consistently high weight across inputs, analogous to attention sinks over sequence positions.

## 10. Relation to other residual mechanisms

| Method | Accessible history | Mixing weights |
| --- | --- | --- |
| Standard residual | immediate accumulated state | fixed |
| ReZero / LayerScale | immediate accumulated state | learned static scale |
| Highway | immediate accumulated state | input-dependent gate |
| Hyper-Connections / mHC | multiple recurrent streams | input-dependent mixing |
| DenseFormer | individual earlier outputs | learned static weights |
| Full AttnRes | all individual earlier outputs | input-dependent softmax |
| Block AttnRes | block summaries and current partial block | input-dependent softmax |

From the paper's structured-matrix perspective:

- standard residuals have an all-ones lower-triangular depth mixing matrix
- recurrent multi-stream methods behave like depth-wise linear attention
- Full AttnRes creates a dense token-dependent depth mixing matrix
- Block AttnRes interpolates between recurrent accumulation and full cross-layer access

This makes AttnRes conceptually different from residual scaling. It does not merely control how much the current layer writes; it changes what historical representation the next layer reads.

## 11. Caveats

- The report is authored by the proposing team and provides no independent replication.
- The largest controlled model has only `3B` active parameters despite `48B` total parameters.
- Downstream evaluation is base-model evaluation, not a controlled post-training or agentic comparison.
- The `1.25x` compute figure is derived from fitted proxy scaling curves, not measured as a universal end-to-end cost reduction.
- The overhead numbers depend on custom pipeline caching, online-softmax merging, kernel fusion, and the reported hardware/software stack.
- Full AttnRes remains expensive under activation recomputation and pipeline parallelism.
- Block size is an architecture and systems hyperparameter; approximately `8` blocks is an empirical heuristic, not a law.
- The paper's architecture sweep favors deeper, narrower models under fixed training compute, but deeper models increase serial inference latency.
- The method changes the architecture and therefore cannot be added to a pretrained model as an ordinary fine-tune.

## Practical takeaways

- Treat the residual stream as a depth-routing mechanism, not only a gradient highway.
- Measure hidden-state RMS, layer-output RMS, and gradient RMS across depth.
- If experimenting with AttnRes, start with approximately `8` blocks and keep RMSNorm on depth-attention keys.
- Prefer the learned per-layer pseudo-query when serving efficiency matters.
- Compare against strong residual baselines such as mHC, not only plain Pre-Norm.
- Evaluate real wall-clock efficiency: a lower loss at matched FLOPs may not survive an unoptimized implementation.
- Re-run depth/width allocation studies because AttnRes can change the preferred architecture shape.

## Related

- [Residuals, Normalization, and Initialization](/atlas/ai/architectures/transformers/residual-normalization-and-initialization)
- [Attention Variants](/atlas/ai/architectures/transformers/attention-variants)
- [Linear Attention](/atlas/ai/architectures/transformers/linear-attention)
- [Kimi K3](/atlas/ai/architectures/model-reports/kimi-k3-open-frontier-intelligence)
- [Kimi Linear](https://arxiv.org/abs/2510.26692)
- [Model FLOPs Utilization](/atlas/systems/performance/model-flops-utilization-mfu)
- [Pipeline Parallelism](/atlas/systems/parallel-computing/pipeline-parallelism)

## Sources

- Kimi Team, [Attention Residuals](https://arxiv.org/abs/2603.15031)
- Moonshot AI, [Attention Residuals code](https://github.com/MoonshotAI/Attention-Residuals)
