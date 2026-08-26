---
title: "Recirculation: Inference-Time Recurrence for Transformers"
date: 2026-08-26
lastmod: 2026-08-26
tags:
  - ai/llm
  - transformers
  - recurrence
  - inference-time-compute
  - state-tracking
draft: false
---

## Summary

Recirculation is an inference-time modification that feeds a small amount of a token's deep residual-stream representation back into a shallower layer and processes that token again. It introduces recurrence into an already-trained transformer without changing the backbone weights.

The motivation is **state tracking**. A token may remain ambiguous in shallow layers and become correctly contextualized only in deeper layers. Later tokens still interact with that earlier token through layer-specific cached representations, including the poorly contextualized shallow ones. Recirculation lets the model write its deeper interpretation back into a shallower point so that it can influence future processing.

The most striking reported results are on Gemma models:

- fixed, training-free recirculation reduces perplexity across most tested corpora
- a small token-conditional mixing network reduces mean perplexity by `23.0%` on nine datasets while the Gemma3 backbone remains frozen
- on Gemma3 4B, adaptive recirculation raises GSM8k pass@1 from `29.3%` to `35.5%`
- the method can be pipelined during autoregressive generation, but requires sequential prefill

The paper is valuable as a research direction, not yet as a production recipe. The strongest gains are concentrated in the Gemma family, source/destination layers require tuning, experiments use models no larger than `12B`, and the authors provide no long-context serving measurements.

## Concepts

- **State tracking:** maintaining and updating an internal interpretation as new information arrives.
- **Contextualization error:** answering from an earlier ambiguous representation after the model had already computed a better interpretation in deeper layers.
- **Source layer:** deeper layer whose contextualized activation is sent backward in depth.
- **Destination layer:** shallower layer where source and destination residual representations are mixed.
- **Recirculation:** reprocessing a token from the destination layer after injecting information from a deeper source layer.
- **Adaptive recirculation:** a small learned network chooses feature-wise source and destination mixture coefficients for every token while the original transformer remains frozen.

## 1. The depth-limited state problem

Consider this conversation:

```text
Fred takes his fishing pole and drives to the bank.
Should he wear boots or flip-flops?
```

The context strongly suggests that `bank` means the edge of a river. However, the token initially enters the transformer through an embedding that represents several possible meanings:

```text
shallow representation of "bank":
    river bank + financial bank

deep representation of "bank":
    mostly river bank
```

The difficulty is that a feed-forward transformer moves only upward through its layers. Once a token's shallow-layer state has been computed, the deeper interpretation cannot go backward and correct it.

Later, if the user asks:

```text
Will Fred find an ATM at this bank?
```

the model may respond using an earlier representation in which the financial meaning is still active, even though a deep layer previously resolved the word correctly.

The paper builds on an activation-patching result: copying the critical token's deep representation into a shallower layer reduced this type of contextualization error by `60%`. Recirculation generalizes the intervention so that it does not require knowing in advance which token is critical.

## 2. Basic recirculation

Choose:

- a deep source layer `s`
- a shallower destination layer `d`, with `s > d`
- source mixing coefficient `alpha`
- destination mixing coefficient `beta`

For token `t`, let:

```text
h[t,d] = residual-stream output at destination layer d
h[t,s] = residual-stream output at source layer s
```

Recirculation constructs a new destination representation:

$$
\tilde h_{t,d}
=
\alpha f(h_{t,s})
+
\beta h_{t,d}
$$

and processes the token again through the downstream transformer blocks.

The default source normalization rescales the deep activation to the destination activation's L2 norm:

$$
f(h_{t,s})
=
\frac{\lVert h_{t,d}\rVert_2}
{\lVert h_{t,s}\rVert_2}
h_{t,s}
$$

This matters because residual-stream norms commonly grow with depth. Adding an unscaled deep vector to a shallow representation can overwhelm the destination and push the model out of distribution.

### Convex and non-convex mixing

The initial formulation uses:

$$
\beta = 1-\alpha
$$

which makes the operation a convex mixture. This works best for Gemma3 1B.

For Gemma3 4B and 12B, the authors find that retaining the full destination and adding a small normalized source contribution is better:

$$
\tilde h_{t,d}
=
\alpha f(h_{t,s})
+
h_{t,d}
$$

That is a non-convex residual addition with `beta = 1`. The paper recommends testing both forms rather than assuming one universal normalization rule.

### Early-token ramp

For Gemma3 1B, recirculating the first few tokens can be harmful because little useful state exists yet. The authors ramp the coefficient over the first ten positions:

$$
\alpha_t
=
\min\left(\frac{t}{10},1\right)\alpha
$$

They do not observe the same early-token harm in Gemma3 4B and 12B.

## 3. Execution schedule

A useful conceptual schedule is:

```text
ordinary token pass:
    shallow layers -> destination d -> source s -> final layer -> logits

recirculation pass:
    saved destination state
        + normalized source state
        -> mixed destination state
        -> downstream layers again
        -> refined state for future tokens
```

The authors use one extra recirculation iteration. Every token is therefore processed by its ordinary pass and recirculated once.

During autoregressive decoding, two streams can be pipelined:

```text
current token:  ordinary first pass -> read logits
earlier token:  recirculation pass  -> refine cached state
```

The first-pass readout remains responsible for generating the next token. Recirculation enriches state that later tokens can use. On parallel hardware, these two stack computations may overlap sufficiently that token latency changes little.

During prefill, however, the recurrence creates a sequential dependency across token positions. A normal transformer processes an entire prompt in parallel; exact recirculation processes the prompt step by step. This is the method's main systems limitation.

### More iterations

With `r` recirculation iterations, the system needs `r+1` stack computations per input step. The paper evaluates only:

```text
r = 1
```

Larger `r`, multiple simultaneous source/destination paths, and blockwise recurrence are proposed as future work.

## 4. Why residual representations can be mixed directly

The method assumes that residual-stream features remain sufficiently aligned across depth. If one coordinate represents a semantic direction such as moisture, both shallow and deep blocks communicate through that shared coordinate system.

Consequently, recirculation does not introduce:

- cross-attention between layers
- a full-rank projection adapter
- a second transformer
- changes to the base weights

It simply rescales and mixes two same-width residual vectors.

This alignment is plausible because residual additions form a shared communication channel through the network. It is not a guarantee: layer normalization and depth-specific feature roles can change how the same direction is interpreted. The empirical layer sweep determines where direct mixing happens to work.

## 5. Recirculation is not ordinary looping

Both methods reuse transformer computation, but they create different recurrence.

### Looped transformer

A looped transformer passes the current token through a repeated layer range:

```text
token t:
    layers 1..L
    -> repeat selected layers
    -> logits
```

Its recurrence is in **depth**. Repeating the stack gives more effective feed-forward depth, possibly with shared weights.

### Recirculation

Recirculation feeds a deep interpretation backward in depth and forward across input steps:

```text
deep state of an earlier token
    -> shallower destination
    -> refined state available to future processing
```

Its recurrence is in **depth and sequence step**. A state update can remain associated with the same architectural layer across arbitrarily many input steps, making the architecture closer to a recurrent dynamical system.

| Property | Looped transformer | Recirculation |
| :--- | :--- | :--- |
| Main goal | Extra latent computation | Persistent state tracking |
| Recurrence | Depth | Depth plus sequence step |
| Readout | After repeated depth passes | After the ordinary first pass |
| State injected | Replaces repeated block input | Mixed with destination residual state |
| Prefill | Usually parallel over tokens | Sequential over tokens |
| Training | Often trained with loops | Basic method modifies frozen models |

In a matched training-free comparison, recirculation gives robust beneficial layer regions across Gemma3 sizes. Adding repeated layers to the pretrained models does not show the same robust pattern and helps only the larger models in some configurations.

## 6. Relation to chain of thought

Chain of thought also creates recurrence:

```text
deep model output
    -> vocabulary token
    -> input embedding
    -> model again
```

But it spends generated tokens and context length to perform state updates. The paper argues that explicit reasoning tokens are better reserved for complex inference, not routine maintenance of contextual state.

Recirculation instead communicates in the continuous residual space:

```text
deep residual state
    -> shallow residual state
```

The methods are complementary. Recirculation may improve the contextual substrate on top of which visible or latent reasoning operates.

## 7. Selecting source and destination layers

The basic method has three important hyperparameters:

```text
source layer s
destination layer d
mixing coefficient alpha
```

The authors sweep source/destination pairs using about `1.5M` tokens from arXiv, C4, and PG19. Their selected Gemma3 pairs are:

| Model | Source | Destination |
| :--- | ---: | ---: |
| Gemma3 1B | `11` | `4` |
| Gemma3 4B | `18` | `9` |
| Gemma3 12B | `35` | `16` |

The useful paths generally originate several layers above a destination in the middle of the network. Sending activation all the way to layer `0` performs poorly: the earliest representation apparently has not been contextualized enough to interpret the deep signal.

The perplexity evaluation uses `alpha = 0.15`, but the best value varies with model, normalization, and downstream task. “Training-free” therefore means **no learned parameter updates**, not zero calibration data or zero hyperparameter search.

## 8. Perplexity results

Fixed recirculation is evaluated on ten datasets with `1,024`-token windows.

Selected reductions relative to the ordinary Gemma3 models are:

| Dataset | Gemma3 1B | Gemma3 4B | Gemma3 12B |
| :--- | ---: | ---: | ---: |
| arXiv | `14.0%` | `11.3%` | `25.2%` |
| BookSum | `16.0%` | `16.0%` | `32.9%` |
| PG19 | `14.4%` | `15.7%` | `35.4%` |
| PubMed | `11.1%` | `9.2%` | `24.5%` |
| C4/WebText-like | `3.9%` | `4.4%` | `13.0%` |
| LAMBADA | `-0.7%` | `0.5%` | `-2.8%` |

Nine of ten datasets generally improve across model scales. LAMBADA is the exception; the authors attribute this partly to its short sequences and tokenization artifacts. The token-level analysis supports a length effect: benefits are largest at short forward lags but remain measurable hundreds of tokens later.

Recirculation and softmax-temperature tuning are not the same effect. On one Gemma3 1B experiment:

```text
temperature tuning alone:       8.48% perplexity reduction
recirculation alone:           14.21%
both together:                 19.55%
```

## 9. Which tokens benefit?

The paper recirculates individual tokens and measures their effect on later positions.

Observed patterns include:

- the largest likelihood improvement occurs at short lags
- a smaller benefit persists to at least lag `256`
- positions approximately `20–200` have particularly persistent effects in a `1,024`-token window
- the earliest roughly ten tokens hurt Gemma3 1B
- adverbs, adjectives, and verbs benefit most
- numerals, determiners, and pronouns benefit least
- plural nouns benefit more reliably than singular nouns

These content- and position-dependent effects argue against recirculation acting only as a global logit-temperature adjustment. They are consistent with the state-tracking interpretation, although they do not prove it uniquely.

## 10. Downstream results

### Instruction following

On a small rule-following task:

| Model | Baseline | Fixed recirculation | Task-specific layer tuning |
| :--- | ---: | ---: | ---: |
| Gemma3 4B IT | `82.3%` | `87.3%` | `90.8%` |
| Gemma3 12B IT | `93.0%` | `98.4%` | `99.4%` |

The task-specific result is an upper-bound demonstration, not a general configuration: its layer pair was selected on the target task.

### Contextualization

On generated questions involving polysemy, counterfactual facts, and gender-role cues:

- Gemma3 1B and 4B generally improve on two of three categories
- Gemma3 12B becomes worse on two categories and is already at ceiling on the third
- tuning source and destination on the instruction-tuned model can improve the result

This mixed result is important because contextualization is the proposed mechanism. Recirculation is not automatically beneficial even on the failure class it was designed to address.

### Standard single-token tasks

Fixed recirculation improves six of eight evaluated tasks on Gemma3 4B, but most differences are small. Examples:

```text
MMLU:          57.90 -> 58.28
ARC Easy:      81.78 -> 82.07
ARC Challenge: 54.44 -> 54.86
PiQA:          79.98 -> 80.52
```

WinoGrande and HellaSwag decrease slightly.

### GSM8k

On zero-shot chain-of-thought GSM8k with Gemma3 4B PT:

| Method | pass@1 | pass@128 |
| :--- | ---: | ---: |
| Baseline | `29.3%` | `94.9%` |
| Fixed recirculation | `30.6%` | `95.4%` |
| Adaptive recirculation | `35.5%` | `96.0%` |

The adaptive pass@1 gain is a `21%` relative increase in accuracy, or an `8.8%` reduction in error. Pass@128 error falls by `20.9%`. Improving both suggests some combination of sharpening existing correct solutions and expanding the set of sampled solutions.

## 11. Adaptive recirculation

Fixed coefficients assume every token and residual feature needs the same amount of feedback. Adaptive recirculation learns feature-wise coefficients conditioned on the current source and destination states:

$$
\tilde h_{t,d}
=
\boldsymbol{\alpha}_t \odot f(h_{t,s})
+
\boldsymbol{\beta}_t \odot h_{t,d}
$$

where both vectors have the model hidden dimension.

### Mixing network

The adapter receives the concatenated source and destination representations:

```text
[h_source | h_destination]: 2 x hidden_size
    -> LayerNorm
    -> GELU MLP hidden layer, width hidden_size
    -> GELU MLP hidden layer, width hidden_size
    -> 2 x hidden_size outputs
    -> sigmoid
    -> alpha vector, beta vector
```

The sigmoid constrains each coefficient to `[0,1]`. The network is initialized to output approximately:

```text
alpha = 0.1
beta  = 0.9
```

The Gemma backbone remains frozen. Only the mixing MLP is trained through the recirculation computation with backpropagation through time.

### Training recipe

For the language-modeling experiment:

- `250` documents each from arXiv, C4, and PG19
- complete `1,024`-token windows
- `100` optimizer steps
- batch size `32`
- AdamW
- learning rate `3e-4`
- weight decay `1e-4`
- fixed source and destination layers from the earlier sweep

This is light adaptation relative to model fine-tuning, but it is not parameter-free. For hidden width `D`, the `2D -> D`, `D -> D`, and `D -> 2D` linear maps contain roughly `5D^2` weights unless implemented with a bottleneck. The paper uses full hidden-width layers and does not report adapter parameter counts or serving overhead.

### Ablation result

The paper compares:

1. fixed scalar coefficients
2. learned constant scalars
3. token-conditional scalars
4. learned constant vectors
5. token-conditional vectors
6. full model fine-tuning

Both ingredients matter:

```text
feature-wise vectors > scalars
token-conditioned coefficients > constant coefficients
```

The conditional-vector version reduces mean perplexity by `23.0%` across nine datasets, compared with `8.5%` for fixed recirculation and `21.6%` for full-model fine-tuning in this experiment.

However, downstream transfer is sensitive to adapter training data. Training on part of MMLU gives broad improvements, while adapting on the much smaller ARC Easy or ARC Challenge sets can cause substantial regressions.

## 12. Model-family dependence

The authors find beneficial source/destination regions in approximately billion-scale:

- Ministral3
- Pythia
- Qwen3
- Phi-2
- Gemma2, Gemma3, and Gemma4

But with the same limited sweep, non-Gemma families improve by less than about `0.5%`, compared with roughly `5%` for Gemma3 1B on the tuning comparison. The authors did not retune normalization and coefficient values extensively for those families, so this result shows qualitative compatibility—not architecture-independent effect size.

Gemma's Peri-LN design or training recipe may make its residual representations unusually suitable for cross-depth mixing.

## 13. Implementation sketch

The core fixed mixing operation is simple:

```python
def mix_for_recirculation(h_dst, h_src, alpha, beta):
    # h_dst, h_src: [..., hidden_size]
    eps = 1e-6
    dst_norm = h_dst.float().norm(dim=-1, keepdim=True)
    src_norm = h_src.float().norm(dim=-1, keepdim=True)
    scaled_src = h_src * (dst_norm / src_norm.clamp_min(eps)).to(h_src.dtype)
    return beta * h_dst + alpha * scaled_src
```

For adaptive mixing:

```python
class AdaptiveMixer(torch.nn.Module):
    def __init__(self, hidden_size):
        super().__init__()
        self.net = torch.nn.Sequential(
            torch.nn.LayerNorm(2 * hidden_size),
            torch.nn.Linear(2 * hidden_size, hidden_size),
            torch.nn.GELU(),
            torch.nn.Linear(hidden_size, hidden_size),
            torch.nn.GELU(),
            torch.nn.Linear(hidden_size, 2 * hidden_size),
        )

    def forward(self, h_dst, h_src):
        alpha_logits, beta_logits = self.net(
            torch.cat([h_src, h_dst], dim=-1)
        ).chunk(2, dim=-1)
        alpha = alpha_logits.sigmoid()
        beta = beta_logits.sigmoid()
        return mix_for_recirculation(h_dst, h_src, alpha, beta)
```

This is only the representation-mixing component. A complete implementation must additionally:

- capture residual outputs at source and destination layers
- rerun the appropriate downstream blocks from the mixed destination
- update or replace the relevant per-layer KV-cache entries
- preserve causality across the pipelined first and recirculation passes
- serialize prefill or implement an approximate blockwise schedule
- use the ordinary first-pass logits for readout

The paper does not release a production serving implementation, so cache replacement and parallel scheduling require careful validation against its unrolled computation graph.

## 14. Cost interpretation

The phrase “essentially no additional latency during generation” requires qualification.

Recirculation is not compute-free:

- it performs an additional stack-like computation for each token
- it needs more activation and cache handling
- adaptive recirculation adds an MLP
- parallel execution can consume hardware capacity that could otherwise serve another request

What the authors claim is that ordinary and recirculation passes can run concurrently enough that **single-request decode latency** remains similar on modern accelerators.

That does not establish equal:

- total FLOPs
- energy
- batch throughput
- serving cost
- accelerator memory
- throughput under high utilization

The prefill tradeoff is more severe. Exact token-by-token prefill gives up one of the transformer's main advantages. For long prompts, prompt processing may dominate total latency.

The paper proposes processing blocks of `K` tokens in parallel and recirculating one block alongside the next. This would interpolate between:

```text
K = 1: exact tokenwise recurrence, slow prefill
K = prompt length: ordinary parallel prefill, weak recurrence
```

The quality/throughput curve is not evaluated.

## 15. Limitations

- The largest evaluated model is Gemma3 `12B`; no frontier-scale or MoE model is tested.
- Most detailed experiments use only `1,024`-token windows.
- Sequential prefill may be impractical for long-context applications.
- Source, destination, normalization, alpha, and beta are model- and task-dependent.
- Strong cross-family effect sizes are not established; non-Gemma gains are small in the reported sweep.
- Contextualization results are mixed and sometimes degrade at `12B`.
- Single-token benchmark gains are mostly small.
- Adaptive recirculation depends strongly on the adapter's training distribution.
- Full throughput, FLOP, memory, energy, and latency measurements are absent.
- Only one recirculation path and one additional iteration are evaluated.
- There is no released end-to-end implementation at publication time.

## 16. Main takeaways

1. Deep residual representations can sometimes be mixed directly into shallower layers of a frozen model.
2. Feed-forward depth and recurrent state evolution are different capabilities; ordinary latent looping does not reproduce the same behavior.
3. A small feedback coefficient is important because the model was not trained for recurrence.
4. Source normalization makes the layer-pair landscape much more robust.
5. Token-conditioned, feature-wise feedback is substantially better than one global coefficient.
6. “No generation latency” should be read as pipelined latency, not free compute.
7. Sequential prefill is the decisive obstacle to practical long-context adoption.
8. The broader research idea is compelling: probe a trained model for architectural modifications it already tolerates before paying for full retraining.

## Related

- [Looped Language Models (Ouro)](/atlas/ai/architectures/transformers/looped-language-models-ouro)
- [Sparse Layers in Looped Language Models](/atlas/ai/architectures/transformers/moe-looped-language-models)
- [Attention Residuals](/atlas/ai/architectures/transformers/attention-residuals)
- [Residual Connections, Normalization, and Initialization](/atlas/ai/architectures/transformers/residual-normalization-and-initialization)
- [Test-Time Compute](/atlas/ai/inference-serving/performance/test-time-compute)

## Sources

- Michael C. Mozer, Shoaib Ahmed Siddiqui, Danny Sawyer, Sunny Sanyal, and Rosanne Liu, [Recirculation](https://arxiv.org/abs/2608.17981), arXiv:2608.17981v1, 2026.
