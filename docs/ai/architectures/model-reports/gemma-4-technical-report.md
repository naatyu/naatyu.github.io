---
title: "Gemma 4 Technical Report"
date: 2026-07-23
lastmod: 2026-07-23
tags:
  - ai/llm
  - models
  - multimodal
  - inference
draft: false
---

## Summary

Gemma 4 is a family of open-weight, natively multimodal decoder-only models spanning effective `2.3B` and `4.5B` edge models, dense `12B` and `31B` models, and a `26B` MoE with about `3.8B` active parameters. Its most reusable ideas are not a single new transformer block, but a coordinated efficiency stack:

- periodic local/global attention
- partial RoPE on global layers
- KV sharing and `K = V` global attention
- quantization-aware deployment checkpoints
- a small autoregressive drafter for speculative decoding
- an encoder-free multimodal experiment in the `12B` model

Gemma 4 also adds a thinking mode and materially improves text, vision, audio, and long-context results over Gemma 3. The report is unusually deployment-oriented: parameter memory, KV-cache cost, encoder latency, failure recovery, and conversation formatting are treated as parts of the model recipe.

## Concepts

- **Effective parameters:** parameters used for a token's forward pass, which can be smaller than total stored parameters because of conditional or per-layer parameter selection.
- **p-RoPE:** partial RoPE, where rotary position encoding is applied to only a fraction of each query/key head.
- **Key-as-value attention:** an attention variant that reuses keys as values, eliminating a separate value cache.
- **MTP drafter:** a small model trained to propose multiple future tokens for speculative decoding.
- **Encoder-free multimodality:** projecting raw modality patches directly into the language-model embedding space instead of using a large modality encoder.
- **Slice-Granularity Elasticity:** continuing a distributed TPU job with fewer slices after a localized failure.

## 1. Model family

| Model | Architecture | Parameter interpretation | Vision | Audio |
| :--- | :--- | :--- | :--- | :--- |
| **E2B** | Dense | `2.3B` effective, about `5B` total | `150M` frozen ViT | `305M` frozen encoder |
| **E4B** | Dense | `4.5B` effective, about `8B` total | `150M` frozen ViT | `305M` frozen encoder |
| **12B** | Dense | `12B` | raw-patch projection | raw-chunk projection |
| **26B-A4B** | MoE | `26B` total, about `3.8B` active | `550M` frozen ViT | not reported |
| **31B** | Dense | `31B` | `550M` frozen ViT | not reported |

The `E2B` and `E4B` models inherit Gemma 3n's per-layer embedding design. This is why their total stored parameter count is much larger than the effective parameter count used in one pass.

The backbone remains a decoder-only transformer with:

- pre- and post-RMSNorm
- QK normalization
- dense and MoE variants
- a `262k` SentencePiece vocabulary

The large vocabulary is consequential for both embedding cost and draft-token projection cost. Gemma 4 addresses the latter explicitly in its small-model drafter.

## 2. Long-context architecture

Gemma 4 mixes local sliding-window and global attention layers:

- `4:1` local-to-global ratio for E2B
- `5:1` local-to-global ratio for the other models

Most layers therefore pay local-attention cost, while periodic global layers restore full-context communication.

The position and cache recipe differs by layer type:

| Layer type | Attention | Position encoding | RoPE base |
| :--- | :--- | :--- | :--- |
| Local | sliding window | full RoPE | `10k` |
| Global | full context | p-RoPE with `p = 0.25` | `1M` |

For the global layers of the `12B`, `26B-A4B`, and `31B` models, values are set equal to keys:

$$
V = K
$$

With a conventional full key and value cache, the stored state per head is approximately:

$$
2d
$$

With `V = K`, the unrotated key representation can also serve as the value. The rotary fraction still needs its position-dependent key representation, giving approximately:

$$
d + pd
$$

For `p = 0.25`:

$$
\frac{2d - 1.25d}{2d} = 37.5\%
$$

This matches the report's global KV-cache reduction. The useful general lesson is that long-context efficiency can be composed across several axes:

- make most layers local
- reserve full attention for periodic mixing
- rotate only the dimensions that need positional structure
- remove or share cached tensors when the quality tradeoff is acceptable

The smaller E2B and E4B models instead use explicit KV-cache sharing ratios of `20/35` and `18/42`.

## 3. Vision and audio

### Frozen encoders

E2B and E4B use:

- a `150M` ViT with patch size `16`
- variable-aspect-ratio inputs
- axial 2D-RoPE plus learned 2D absolute position embeddings
- output budgets of `70`, `140`, `280`, `560`, or `1120` vision tokens

The larger encoder-based models use a `550M` ViT. The resizing recipe preserves aspect ratio, rounds dimensions to pooled-patch multiples, and chooses the largest representation under the token budget. This avoids forcing all images into one square resolution.

The E2B and E4B audio path uses a `305M` USM-style encoder:

- Mel filterbank input
- two convolutional downsampling layers
- twelve Conformer layers
- one continuous representation every `40ms`
- frozen encoder weights during pretraining

The encoder is `55%` smaller than Gemma 3n's `680M` audio encoder and does not use vector quantization.

### Encoder-free 12B

The `12B` model is the most architecturally unusual member of the family. It removes both large modality encoders.

For images:

- split RGB input into `48 x 48 x 3` patches
- project patches with one `35M`-parameter matrix multiplication
- add coordinate-derived 2D position embeddings
- apply a final LayerNorm
- feed the resulting sequence directly to the LLM

For audio:

- sample at `16kHz`
- split raw audio into `40ms`, or `640`-sample, chunks
- project each chunk directly into the LLM embedding space

This moves more representation learning into the shared decoder. The engineering attraction is not only fewer parameters: removing separate encoders can also reduce memory fragmentation and simplify a multimodal runtime.

The report's audio results show that competitive transcription and speech-translation quality is possible without a dedicated audio encoder. It does not establish that encoder-free inputs dominate frozen encoders universally; the model is larger, and the report does not provide a controlled equal-compute ablation.

## 4. Quantization-aware deployment

Gemma 4 publishes raw and QAT checkpoints in two broad deployment formats:

- mobile quantization with per-channel mixed `int2`/`int4` weights and `int8` activations
- blockwise `Q4_0` weights for common open-source runtimes

At `32k` text context, the report gives these approximate weight footprints:

| Model | BF16 | Quantized |
| :--- | ---: | ---: |
| E2B | `4.6 GB` | `0.8 GB` |
| E4B | `9.0 GB` | `2.3 GB` |
| 12B | `24.0 GB` | `7.65 GB` |
| 26B-A4B | `52.0 GB` total / `7.6 GB` active | `16.2 GB` total / `2.8 GB` active |
| 31B | `64.0 GB` | `19.2 GB` |

An `int8` KV cache adds between `0.05 GB` for E2B and `1.10 GB` for 31B at that context length. This table makes an important deployment distinction visible:

$$
\text{weight memory} \neq \text{active weight memory} \neq \text{KV-cache memory}
$$

The modality encoders are quantized too:

- vision encoder `W8A8`: forward memory falls from `400 MB` to `200 MB`
- vision latency falls `44%` relative to Gemma 3n on newer on-device hardware
- audio encoder mixed `2/4/8`-bit weights plus `8`-bit activations: disk footprint falls from `390 MB` to `87 MB`

Gemma 4 also adds one scalar scale per transformer block to bound activation ranges for stable FP16 inference. Quantization and FP16 stability are therefore trained deployment properties, not only export-time conversions.

## 5. Autoregressive MTP drafter

Each model includes a separate autoregressive drafter for speculative decoding. The drafter consumes:

- the main model's previous final-layer activation
- token embeddings
- the main model's KV cache through cross-attention

It uses a separate embedder and a four-layer transformer with three local layers and one global layer. This has two practical consequences:

- no separate drafter prefill is required
- draft length is not fixed by a bank of parallel prediction heads

For E2B and E4B, projecting every draft step into a `262k` vocabulary would be expensive. Gemma 4 first chooses among token clusters and reduces the final matrix multiplication from:

$$
d \times 262{,}000
$$

to:

$$
d \times 4{,}096
$$

while reporting similar acceptance rate. This is a useful reminder that a drafter must be optimized for **proposal latency**, not only next-token accuracy.

## 6. Pretraining and infrastructure

The pretraining mixture includes:

- web documents
- code
- images
- audio for E2B, E4B, and 12B

The data cutoff is January 2025. The report states that data is filtered for benchmark decontamination, unsafe or unwanted content, and recitation risk, but does not disclose token counts, mixture weights, optimizer settings, or detailed training curricula.

Training uses TPUv5p and TPUv6e at scales from `4,096` to `12,288` chips. State and computation are partitioned across data, sequence, and replica dimensions, with optimizer state sharded using ZeRO-3. Multi-pod replica reductions use Pathways, with JAX, GSPMD, and XLA underneath.

For large models, Slice-Granularity Elasticity lets a job continue with fewer TPU slices after a localized failure. The report says reconfiguration reduces interruption from minutes to seconds. This is a strong systems lesson:

> at sufficiently large scale, temporarily lower parallel capacity can produce better goodput than waiting to restore the original topology.

## 7. Post-training and interface contract

Gemma 4 instruction tuning broadly follows Gemma 3 but adds a thinking mode that emits a reasoning trace before the final answer.

Post-training data is filtered for:

- personal information
- unsafe or toxic outputs
- mistaken model identity
- duplicates

The team also includes data that teaches:

- in-context attribution
- calibrated hedging
- refusal when evidence is insufficient

They report that this improves factuality without degrading their other metrics. The durable point is that hallucination mitigation can be represented directly in the post-training mixture rather than implemented only as an inference-time safety layer.

Formatting is part of the checkpoint contract:

- pretrained checkpoints terminate with `<eos>`
- instruction-tuned checkpoints terminate turns with `<turn|>`
- thinking is enabled by `<|think|>` in the leading system turn
- reasoning is wrapped in `<|channel>thought ...<channel|>`
- tool declarations and calls use distinct control tokens

Fine-tuning must preserve the correct terminal token for the selected checkpoint family.

## 8. Evaluation signals

The report's strongest evidence is the broad improvement over Gemma 3 rather than any one leaderboard position.

Examples:

- E2B roughly matches Gemma 3 27B on several reported text tasks with about one tenth the effective parameters
- E4B broadly matches or exceeds Gemma 3 27B on the reported vision suite, with a small deficit on InfographicVQA
- 31B reaches `96.4` on RULER at `128k`, versus `66.0` for Gemma 3 27B
- 31B reaches `79.5` Recall@k on LOFT text retrieval at `128k`, versus `8.6`
- E4B improves average speech translation and transcription over the corresponding Gemma 3n models despite the much smaller quantized audio encoder

These numbers should be read with three caveats:

1. Most Gemma 4 static results use thinking mode, while the Gemma 3 comparison is often non-thinking.
2. Vision scores depend materially on the image-token budget; `1120`-token and `280`-token results are not interchangeable.
3. Arena rank is a dated leaderboard snapshot, not a stable architectural metric.

## 9. Durable takeaways

### Efficiency is compositional

Gemma 4 does not rely on one dominant compression trick. It combines local attention, partial positional encoding, shared KV state, QAT, speculative drafting, and modality-specific compression.

### One family can contain different architecture experiments

The `12B` encoder-free model and `26B-A4B` MoE are not merely scaled versions of E2B/E4B. A model family can share a tokenizer and product surface while using substantially different internal designs.

### Report total, effective, active, and auxiliary parameters separately

Gemma 4's per-layer embeddings, MoE routing, modality encoders, and drafters make a single parameter number misleading. Deployment comparisons should distinguish:

- total stored parameters
- parameters active per token
- backbone parameters
- modality-encoder parameters
- drafter parameters

### The serving interface belongs in the technical recipe

Thinking toggles, turn terminators, tool syntax, quantized checkpoints, and drafter compatibility affect whether downstream fine-tuning and serving work correctly. They are not peripheral packaging details.

## Related

- [Attention Variants](/atlas/ai/architectures/transformers/attention-variants)
- [RoPE Scaling](/atlas/ai/architectures/transformers/rope-scaling)
- [Speculative Decoding](/atlas/ai/inference-serving/decoding/speculative-decoding)
- [Quantization-Aware Training](/atlas/ai/training/precision/quantization-aware-training)
- [Chat Templates for LLMs](/atlas/ai/inference-serving/chat-templates-for-llms)
- [Goodput, Determinism, and Fault Tolerance](/atlas/systems/infrastructure/goodput-determinism-and-fault-tolerance)

## Source

- Gemma Team, [Gemma 4 Technical Report](https://arxiv.org/abs/2607.02770)
