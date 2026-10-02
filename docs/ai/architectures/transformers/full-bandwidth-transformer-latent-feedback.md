---
title: "Full-Bandwidth Transformer: Latent Feedback Across Tokens"
date: 2026-09-07
lastmod: 2026-09-07
tags:
  - ai/llm
  - transformers
  - recurrence
  - latent-reasoning
  - pretraining
  - inference
draft: false
---

## Summary

The full-bandwidth transformer adds a continuous recurrent channel to autoregressive decoding. After producing token $x_t$, it retains the top-layer hidden state that produced that token, combines the state with the embedding of $x_t$, and uses the result as the next position's layer-0 input.

```text
standard decoding:

top state at t-1 -> sampled token x_t -> embedding e_t -> transformer

full-bandwidth decoding:

top state at t-1 ----┐
                     ├-> gated fusion -> transformer
token embedding e_t -┘
```

The mechanism does not add information beyond the token history. It changes **computational accessibility**: a representation produced at the top of the stack can return to the bottom at the next decoding step and receive a new full depth budget.

The paper's most reusable contributions are:

- a two-projection gated feedback path with less than `1%` estimated per-token decoding compute
- a multi-pass approximation that trains the recurrence while preserving parallel teacher forcing within each pass
- a progressive mixture of one-, two-, and three-pass batches
- the finding that a small fraction of deeper recurrent batches can stabilize much longer self-composition
- a clean separation between recurrent generation and optional recurrent prompt refinement

The results are promising but preliminary. Every trained model is approximately `1B` parameters, the main recurrent runs use at most `400B` pretraining tokens, no weights or official implementation were released with version 1, and the paper does not report production latency, memory, or throughput measurements.

## Concepts

- **Latent feedback:** passing a continuous hidden state from one autoregressive step into the next.
- **Vertical feedback channel:** the path by which deep computation from an earlier position becomes available to shallow layers at a later position.
- **Depth-frozen state:** a cached representation that later positions can read only at the same or a higher layer, not at a lower layer.
- **Temporal parallelism:** approximating a recurrence with several sequence-parallel forward passes.
- **Feedback pass:** an additional full-sequence pass whose inputs use shifted hidden states from the preceding pass.
- **Prefix mixin:** keeping a random prefix as ordinary token embeddings and applying feedback only to the suffix during training.
- **SOFT decoding:** ordinary prompt prefill followed by latent-feedback generation.
- **FUSED decoding:** an extra latent-feedback pass over the prompt followed by latent-feedback generation.

## 1. The vertical bandwidth problem

Let a decoder-only transformer contain $L$ layers and hidden width $D$. For token position $t$, write the residual state at layer $\ell$ as:

$$
h_t^{\ell}\in\mathbb{R}^D.
$$

During ordinary cached decoding, a new state at layer $\ell$ can attend to keys and values previously produced by layers below or corresponding to that point in the computation. It cannot send information from a previous token's top layer backward into the new token's bottom layer.

The consequence is asymmetric information flow:

```text
across positions:
    broad access through attention and the KV cache

backward through depth:
    no direct path
```

The token sampled from the language-model head is the only ordinary route by which the result of the complete stack returns to layer 0 on the following step:

$$
h_{t-1}^{L}
\rightarrow
p(x_t\mid x_{<t})
\rightarrow
x_t
\rightarrow
e_t.
$$

This route compresses the continuous state into one vocabulary symbol. Chain-of-thought compensates by externalizing partial results across many symbols, but that consumes decoding time and context length.

The phrase **full bandwidth** should not be interpreted as the creation of new information. Since $h_{t-1}^{L}$ is a deterministic function of the preceding context, the token history already determines it. The claimed benefit is that the result of deep computation becomes cheaply accessible at the bottom of the next forward pass instead of having to be reconstructed from the token sequence and layer-wise KV states.

## 2. Latent-feedback decoding

For an ordinary transformer, the input at position $t$ is the embedding $e_t$ of the sampled token $x_t$:

$$
h_t^L=f_\theta(e_t;C_t),
$$

where $C_t$ denotes the cached context.

The full-bandwidth transformer instead computes:

$$
u_t
=
e_t\otimes h_{t-1}^L
=
W_Uh_{t-1}^L
\odot
\sigma(W_Ge_t),
$$

followed by:

$$
h_t^L=f_\theta(u_t;C_t).
$$

Here:

- $e_t,h_{t-1}^L,u_t\in\mathbb{R}^D$
- $W_U,W_G\in\mathbb{R}^{D\times D}$
- $\sigma$ is the sigmoid
- $\odot$ is elementwise multiplication

The hidden state occupies the value path:

$$
v_t=W_Uh_{t-1}^L,
$$

while the token embedding produces a feature-wise gate:

$$
g_t=\sigma(W_Ge_t).
$$

Then:

$$
u_t=v_t\odot g_t.
$$

### Why the token is only the gate

An apparently simpler alternative would be:

$$
u_t=e_t+Wh_{t-1}^L.
$$

This leaves an easy optimization shortcut. A model initialized from an ordinary checkpoint can suppress $Wh_{t-1}^L$, retain the familiar embedding input, and recover its previous loss without learning to use feedback.

In the proposed asymmetric fusion, removing the hidden-state path removes the input value itself. The token identity still controls the $D$-dimensional gating pattern, but the model must learn to transform and use the carried state.

### Parameter cost

The feedback path adds:

$$
2D^2
$$

weights. For the paper's $D=1{,}536$ model, this is approximately:

$$
2(1{,}536)^2
\approx 4.72\text{M parameters}.
$$

This is small relative to a `1B`-parameter transformer, though not literally zero.

## 3. Causal timing and the KV cache

The feedback does not peek at a future state. The order at decoding time is:

1. process the current position and produce $h_{t-1}^L$
2. use the language-model head to sample $x_t$
3. embed the sampled token as $e_t$
4. fuse $e_t$ with the already-computed $h_{t-1}^L$
5. process the fused vector to predict the following token

Only the latest top-layer state needs to be carried separately. Earlier fused inputs have already contributed to the layer-wise KV cache.

```text
per request:

KV cache:       ordinary history for every attention layer
feedback state: one latest D-dimensional top-layer vector
```

The attention implementation and cache layout do not need to change. Serving must nevertheless retain one feedback vector per live request and ensure that batching, request reordering, beam expansion, speculative decoding, and request termination update the correct state.

The paper sketches a vLLM implementation modeled after EAGLE and multi-token-prediction state handling: store the latest trunk hidden state by request ID, copy it into a fixed-address buffer, and capture the feedback projections inside the CUDA graph.

## 4. Three inference modes

The trained model can be used in three ways.

| Mode | Prompt | Generated tokens | Main cost |
| :--- | :--- | :--- | :--- |
| `STANDARD` | One ordinary prefill | Plain embeddings | Ordinary transformer cost |
| `SOFT` | One ordinary prefill | Latent-feedback inputs | Two $D\times D$ projections per decoded token |
| `FUSED` | Ordinary prefill plus one feedback pass | Latent-feedback inputs | Approximately double prefill plus SOFT decode |

### STANDARD

This disables feedback entirely. Retaining a first-pass language-model loss during training preserves this fallback mode and makes it possible to measure whether recurrent training damages ordinary decoding.

### SOFT

The prompt is processed normally. The first sampled token begins the transition to fused inputs, and feedback is then used throughout autoregressive generation.

This mode tests whether the recurrent channel helps generation without paying for an additional prompt pass.

### FUSED

After ordinary prefill, the prompt is processed through another sequence-parallel feedback pass before generation. This exposes prompt states to extra effective depth.

The paper finds that SOFT is often strongest for mathematics, while FUSED is often strongest for coding. This suggests—but does not prove—that mathematics benefits more from state carried during generation, whereas code generation benefits from refining the prompt representation before decoding.

## 5. Why exact training would be expensive

At inference, feedback forms a causal recurrence:

$$
u_t=e_t\otimes h_{t-1}^L,
\qquad
h_t^L=f_\theta(u_t;C_t).
$$

Computing position $t$ therefore requires the completed top state at $t-1$. Training this exact recurrence over a sequence of length $T$ would serialize teacher forcing across the token dimension and discard one of the transformer's largest training advantages.

The paper instead serializes over a small number of full-sequence passes while keeping every token within a pass parallel.

## 6. Multi-pass temporal parallelism

The first pass is an ordinary teacher-forced forward pass:

$$
h_t^{(1)}
=
f_\theta(e_t;C_t^{(1)}).
$$

For the second pass, shift the previous pass's top states one position to the right and fuse them with the current token embeddings:

$$
u_t^{(2)}
=
e_t\otimes h_{t-1}^{(1)},
$$

$$
h_t^{(2)}
=
f_\theta(u_t^{(2)};C_t^{(2)}).
$$

The third pass repeats the operation using the second-pass states:

$$
u_t^{(3)}
=
e_t\otimes h_{t-1}^{(2)}.
$$

Each pass is parallel over $T$ positions because every dependency comes from a completed earlier pass:

```python
e = embed(tokens)                  # [B, T, D]
h = model(inputs_embeds=e)         # ordinary pass
loss = next_token_loss(h, tokens)

for _ in range(num_passes - 1):
    previous = shift_right(h)
    x = (previous @ W_u) * sigmoid(e @ W_g)
    x = prefix_mixin(x, e)
    h = model(inputs_embeds=x)
    loss += next_token_loss(h, tokens)
```

The paper does not detach `h`. Losses from later passes backpropagate through preceding passes, teaching an earlier hidden state to become a useful future input. This also increases activation-memory pressure, which the paper does not quantify.

### Receptive horizon across passes

One additional pass propagates the feedback dependency one position farther. After $k$ total passes, a state from position $t$ can affect positions through approximately:

$$
t+k-1.
$$

The model is therefore trained only on a short explicit recurrent horizon, even though the same local transition is composed hundreds or thousands of times during decoding.

## 7. Training objective

The standard first-pass loss is retained, and feedback-pass losses are averaged with coefficient $\lambda$:

$$
\mathcal{L}_K(\theta)
=
\mathcal{L}_{\mathrm{NTP}}^{(1)}
+
\lambda\frac{1}{K-1}
\sum_{k=2}^{K}
\mathcal{L}_{\mathrm{NTP}}^{(k)}.
$$

The authors set:

$$
\lambda=1
$$

without tuning it.

The later objectives provide more than duplicate next-token supervision. A hidden state at position $t$ becomes an input to later positions, so their losses can train it to be reusable state rather than merely a vector sufficient for the immediately following vocabulary prediction.

## 8. Feedback-pass scheduling

Running several passes for the entire pretraining run would multiply compute. The authors therefore begin with ordinary pretraining and introduce feedback later.

Their main stable mixture is:

```text
75% one-pass batches
22% two-pass batches
 3% three-pass batches
```

The average number of passes is:

$$
0.75(1)+0.22(2)+0.03(3)=1.28.
$$

Thus `200B` training tokens correspond to approximately `256B` token-equivalent forward-pass compute, and `400B` tokens correspond to approximately `512B`.

### Why the three-pass fraction matters

A `200B`-token experiment trained with `75%` one-pass and `25%` two-pass batches works around the trained recurrence depth but becomes unstable when repeatedly composed: validation loss rises and hidden-state updates oscillate.

Replacing only three percentage points with three-pass batches produces:

```text
75% one pass / 22% two passes / 3% three passes
```

and keeps validation loss stable through much deeper feedback-pass tests. The norm of successive hidden-state changes decays toward a small plateau, which is consistent with—but does not formally prove—that training has made the update approximately contractive around the encountered state distribution.

The broader lesson is useful for recurrent models:

> Training a one-step transition is not enough; include at least some deeper unrolls and explicitly test stability under much longer self-composition.

## 9. Matching prompt and generation distributions

Without intervention, multi-pass training produces fused inputs throughout almost the whole sequence. SOFT inference instead has a boundary:

```text
plain prompt inputs | fused generated-token inputs
```

The paper uses a **prefix mixin** to expose the model to this structure. For every pass beyond the first:

1. sample a random prefix length $p$
2. use ordinary embeddings for positions $t\leq p$
3. use recurrently fused inputs for positions $t>p$

Conceptually:

```python
x_fused = fuse(shift_right(h), embeddings)
x = where(position <= random_prefix, embeddings, x_fused)
```

This reduces the distribution shift at the prompt-generation boundary and enables SOFT decoding without a recurrent prompt pass.

## 10. Stability mechanisms

Long autoregressive rollouts compose the feedback map much more often than training does. The full recipe includes several stabilizers.

### Stationary hidden-state scale

Depth scaling keeps the top-layer residual magnitude closer to $O(1)$ instead of allowing it to grow with $L$. RMSNorm is also applied around the fused input.

Without scale control, repeated feedback could progressively amplify the recurrent state or place layer 0 far outside its training distribution.

### Tied embedding and readout weights

The same model must consume both token embeddings and transformed top-layer states. Tying the input embedding and language-model head encourages the embedding and final hidden-state spaces to remain in a compatible basis.

### Noise regularization

Uniform jitter is added to the carried state during training:

$$
\epsilon\sim\operatorname{Uniform}[-\sigma,\sigma]^D,
\qquad
\sigma=0.02.
$$

The feedback input becomes:

$$
u_t=e_t\otimes(h_{t-1}^L+\epsilon).
$$

This trains the update on a neighborhood around each state so that small errors do not necessarily accumulate catastrophically under long self-composition.

## 11. Experimental setup

The experimental backbone is a roughly `1B`-parameter causal transformer:

| Property | Value |
| :--- | ---: |
| Vocabulary | `100,352` |
| Layers | `24` |
| Hidden width | `1,536` |
| SiLU-GLU intermediate width | `6,656` |
| Query heads | `16` |
| KV heads | `8` |
| Context during main pretraining | `8,192` |
| Local attention window | `2,048` |
| Full-attention frequency | Every sixth layer |

The model also uses:

- gated grouped-query attention
- headwise attention gates
- QK RMSNorm
- RoPE
- RMSNorm around residual blocks and before output
- tied embeddings and output head

Training uses the Phi-4 data mixture. Matrix parameters use NorMuon with learning rate `1e-2` and weight decay `0.01`; other parameters use Adam with learning rate `5e-4` and no weight decay. The schedule is WSD with `200` warm-up steps and a `25%` cooldown. A z-loss of `1e-5` is introduced during cooldown, and weight decay is decayed with the learning rate following AdamC.

The global batch is normally about `300K` tokens. The separate `1T`-token standard baseline uses `1.2M`, which is a confound when interpreting comparisons against that run.

For selected models, the authors subsequently perform:

- `12B` tokens of context extension from `8K` to `32K`
- `6B` tokens of instruction tuning
- three passes throughout both shorter stages

## 12. Results

### Base-model generation

SOFT improves over STANDARD for every reported task and both evaluated recurrent-training scales. Selected `200B`-token base-model results include:

| Task | STANDARD | Feedback mode | Result |
| :--- | ---: | :--- | ---: |
| MATH-500 Pass@1 | `0.27` | SOFT | `0.37` |
| HumanEval Pass@3 | `0.31` | FUSED | `0.34` |
| MBPP Pass@3 | `0.38` | FUSED | `0.40` |

For code, Pass@3 is estimated from ten rollouts, and temperature is selected independently for each method from `{0.3, 0.5, 0.7}`. This gives each decoding regime its own tuned setting and makes the comparison less clean than one fixed decoding configuration.

### After context extension and instruction tuning

| Task | 200B STANDARD | 200B best feedback | 400B STANDARD | 400B best feedback | 1T standard baseline |
| :--- | ---: | ---: | ---: | ---: | ---: |
| GSM8K Pass@1 | `64.52` | `67.93` | `67.90` | `71.80` | `70.13` |
| MATH-500 Pass@1 | `43.80` | `45.60` | `46.00` | `48.40` | `47.40` |
| HumanEval Pass@3 | `42.54` | `45.92` | `46.50` | `47.60` | `50.01` |
| MBPP Pass@3 | `38.39` | `41.22` | `40.50` | `41.70` | `41.93` |

The feedback modes consistently improve the same checkpoint, which is the cleanest result. Comparisons against baselines trained on more tokens are suggestive rather than definitive because:

- recurrent training itself uses more compute per token
- the `1T` baseline uses a different batch size
- FUSED inference pays for an extra prompt pass
- hardware time and memory are not matched

### Prefill-time recurrence

Additional fused prompt passes improve validation loss and average five-shot accuracy. Most of the gain occurs on the first feedback pass, with diminishing returns afterward.

The paper reports that a `100B`-token full-bandwidth model with recurrent prefill reaches the `200B` standard baseline, and the `200B` recurrent model reaches the `400B` standard baseline on these evaluations. This is evidence that spending extra compute on the same tokens can improve data efficiency; it should not be simplified to “twice the performance per FLOP.”

## 13. Does the hidden state actually carry useful information?

The authors construct controlled state-tracking tasks:

- **completion tracking:** decide whether a completed counter equals a required counter
- **delayed memory:** recover a bit specified before many irrelevant operations
- **multi-register latest-write:** return the latest value assigned to one queried register

They train linear probes at different residual depths on the final input position.

Under ordinary prefill, layer 0 mostly represents the shared final token and is near chance. Several transformer layers are needed to reconstruct the relevant global state.

With one recurrent prefill step, the previous top-layer state is exposed directly at the final position's input. Layer-0 probe accuracy reaches `99.6%` on completion tracking and `100%` on delayed memory.

This verifies the proposed routing mechanism: information aggregated by the complete stack becomes accessible to shallow layers. It does not alone show that the language-model head uses that information correctly, so the downstream generation results remain necessary.

## 14. Concise reasoning claim

On base models, SOFT decoding often produces shorter mathematical traces at equal or better accuracy. The interpretation is that some intermediate bookkeeping can travel through the continuous recurrent state rather than being verbalized token by token.

However, the effect disappears after instruction tuning. The authors attribute this to off-policy supervision: the target solutions were generated by conventional models and teach their verbose, fully verbalized style.

This is an important negative result. Exploiting a latent channel may require post-training data generated under that same channel, or on-policy RL that rewards correctness and efficiency without forcing imitation of conventional reasoning traces. The paper leaves this untested.

## 15. Comparison with other recurrence mechanisms

| Method | Recurrent object | Where compute is repeated | Decode-time cost | Training requirement |
| :--- | :--- | :--- | :--- | :--- |
| Chain of thought | Vocabulary tokens | Across generated positions | Full decode per reasoning token | Usually post-training |
| Looped transformer | Current token's latent state | Repeated transformer layers before emission | One block/stack execution per loop | Normally pretrained with loops |
| Recirculation | Deep state of an earlier/current input token | Re-execution from a shallow destination | Additional layer execution, possibly pipelined | Basic method can modify a frozen model |
| T²MLR | Previous-token middle-layer state | Middle-to-earlier-middle feedback | Lightweight fusion plus ordinary decode | Pretraining or retrofit fine-tuning |
| Latent Recurrent Transformer | Previous-token source-layer state | Cross-position injection through attention/residual paths | Lightweight recurrence | Recurrent training |
| Full-bandwidth transformer | Previous top-layer state | Top-to-input gated feedback | Two projections plus ordinary decode | Recurrent training |

### Versus looped transformers

A looped transformer gives one position additional effective depth before emitting its token:

```text
position t: stack -> stack again -> token
```

Full-bandwidth feedback instead reuses the forward pass that autoregressive decoding already performs for the following position:

```text
position t top state -> position t+1 bottom input
```

It does not increase the asymptotic depth per generated position. It increases the width of the cross-position path and allows computation to accumulate across the existing sequence of decoding steps.

### Versus Recirculation

Recirculation was designed as an inference-time intervention for an ordinary pretrained model. It mixes a normalized deep residual into a shallower residual and reprocesses part of the stack. Its exact prompt processing is sequential and its usefulness depends on selecting source and destination layers.

Full-bandwidth feedback is trained into the model, always uses the final hidden state as its source, and changes only the next position's input. This makes its decode path cheaper, but removes the ability to retrofit the mechanism without further training.

### Versus T²MLR and LRT

T²MLR and the Latent Recurrent Transformer independently explore the same broad idea: carry a previous token's higher-level continuous state into the computation for the current token.

The unresolved architectural question is where the recurrent connection should begin and end:

```text
top layer -> input          full-bandwidth transformer
middle layer -> middle     T²MLR
source layer -> attention/residual pathways   LRT
```

The full-bandwidth paper provides larger token-scale experiments than those early studies, but all remain far below frontier-model scale. There is not yet enough controlled evidence to claim that top-to-input feedback is the optimal placement.

## 16. Systems implications

### Decode overhead is small, not free

The extra work per generated token is approximately two dense $D\times D$ projections, a sigmoid, an elementwise product, and normalization. This is independent of context length and much smaller than executing $L$ transformer blocks.

Nevertheless, practical overhead also includes:

- reading and writing a per-request hidden-state buffer
- integrating the gate into CUDA graphs
- handling dynamic batching and request movement
- copying or reindexing states for beams and parallel samples
- interaction with tensor parallelism
- compatibility with speculative decoding

The paper's `<1%` statement is a FLOP estimate. It does not substitute for measured time-to-first-token, inter-token latency, throughput, communication, and memory-bandwidth results.

### FUSED prefill is expensive for long prompts

FUSED performs another full transformer pass over the prompt. Although positions within the pass remain parallel, the extra FLOPs and KV/state handling can roughly double prefill cost.

For long-context systems, this trade-off may be much more important than the cheap decode recurrence. SOFT is operationally more attractive because it keeps ordinary prefill.

### Training overhead is material

The main schedule uses `1.28×` forward-pass-equivalent compute, and gradients flow through the pass chain. Peak memory, recomputation requirements, pipeline utilization, optimizer throughput, and distributed communication are not reported.

The method is therefore data-efficient in the sense of extracting more learning signal per unique token, but it has not yet been shown to reduce real pretraining cost at larger scale.

## 17. Limitations and open questions

1. **Scale:** only `1B`-parameter models are trained.
2. **No released artifact:** version 1 provides neither weights nor an official end-to-end implementation.
3. **Heuristic schedule:** the point at which recurrence begins and the pass mixture are not systematically derived.
4. **Limited ablations:** fusion form, feedback location, loss weights, schedule duration, and stabilization components are not exhaustively isolated.
5. **No large-scale systems evidence:** decode overhead is estimated rather than benchmarked in production.
6. **Training cost:** multi-pass backpropagation memory and wall-clock costs are missing.
7. **Long-horizon evidence:** stability under repeated prefill iterations is not equivalent to successful long agentic generation.
8. **Post-training mismatch:** conventional instruction traces remove the reported conciseness advantage.
9. **No on-policy feedback training:** RL or self-generated SFT under SOFT/FUSED decoding remains future work.
10. **Evaluation breadth:** free-form tests are limited to GSM8K, MATH-500, HumanEval, and MBPP.
11. **Decoding selection:** code temperatures are tuned separately by method.
12. **Compute accounting anomaly:** the table assigns `40B` token-equivalent compute to a `10B`, “100% three-pass” run, although three total passes would imply `30B`; the text does not reconcile this row.

## 18. Main takeaways

1. Hidden information can be present in a transformer yet inconveniently located in its computation graph.
2. Autoregressive decoding already supplies a serial axis along which lightweight continuous recurrence can operate.
3. Feeding a previous top-layer state into the next position can renew its effective depth budget without another stack evaluation per token.
4. The asymmetric gate forces the model to use the latent path instead of falling back to a plain embedding shortcut.
5. A few parallel feedback passes can train the local recurrent transition without serializing over the full sequence.
6. Occasional deeper unrolls, state-scale control, and noise are important when a learned transition will be composed far beyond its training horizon.
7. Unique-token efficiency, FLOP efficiency, memory efficiency, and wall-clock efficiency are different claims.
8. The same inference mechanism must be represented in post-training data if its behavioral benefits are to survive instruction tuning.
9. The architecture is credible enough to track and reproduce, but not mature enough to treat as a frontier-scale default.

## Related

- [Looped Language Models (Ouro)](/atlas/ai/architectures/transformers/looped-language-models-ouro)
- [DeepLoop: Residual Scaling for Looped Transformers](/atlas/ai/architectures/transformers/deeploop-residual-scaling-for-looped-transformers)
- [Recirculation: Inference-Time Recurrence for Transformers](/atlas/ai/architectures/transformers/recirculation-inference-time-recurrence)
- [Sparse Layers in Looped Language Models](/atlas/ai/architectures/transformers/moe-looped-language-models)
- [Test-Time Compute](/atlas/ai/inference-serving/performance/test-time-compute)
- [Transformer Scaling Rules](/atlas/ai/training/scaling/transformer-scaling-rules)

## Sources

- Xi Wang et al., [Full-bandwidth transformer](https://arxiv.org/abs/2608.08888), arXiv:2608.08888v1, 2026.
- Microsoft Research, [Full-bandwidth transformer publication page](https://www.microsoft.com/en-us/research/publication/full-bandwidth-transformer/), 2026.
- Ziyang Cai et al., [T²MLR: Transformer with Temporal Middle-Layer Recurrence](https://arxiv.org/abs/2607.15178), 2026.
- Zeyi Huang et al., [Latent Recurrent Transformer: Architecture Exploration, Training Strategies, and Scaling Behavior](https://arxiv.org/abs/2605.26797), 2026.
