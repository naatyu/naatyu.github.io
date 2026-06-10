---
title: "Third-Generation Apple Foundation Models"
date: 2026-06-10
lastmod: 2026-06-10
tags:
  - ai/llm
  - apple
  - multimodal
  - models
draft: false
---

## Summary

Apple's third-generation foundation-model stack, announced on **June 8, 2026**, is a family of **five** models spanning on-device and Private Cloud Compute deployment. The most interesting technical novelty is **AFM 3 Core Advanced**, a `20B` sparse on-device model that stores most weights in flash and activates only `1B-4B` parameters at a time using **Instruction-Following Pruning (IFP)** and prompt-level expert selection. The server side also expands into a clearer multi-model stack, including a stronger reasoning model on NVIDIA GPUs in Google Cloud.

The main caveat is that Apple has **not yet published the full 2026 technical report**. So this note should be read as a synthesis of the official June 2026 research post, Apple developer materials, and the 2025 AFM report for context, not as a complete architecture report in the style of Llama, Qwen, or MAI.

## Concepts

- **AFM:** Apple Foundation Models, the model family behind Apple Intelligence.
- **Private Cloud Compute (PCC):** Apple's server-side inference environment with privacy guarantees and OS-level integration.
- **IFP (Instruction-Following Pruning):** Apple's sparse-activation technique used in AFM 3 Core Advanced to select a subset of experts per request.
- **Prompt-level routing:** selecting active expert weights at the request level rather than token-by-token, reducing memory movement during inference.
- **Inference-time elasticity:** varying the number of active parameters depending on request difficulty.

## 1. What AFM3 actually is

Apple's June 2026 announcement reframes AFM as a family of five models:

### On-device

- **AFM 3 Core**
  - next generation of the `~3B` dense on-device model
- **AFM 3 Core Advanced**
  - `20B` sparse on-device model
  - activates only `1B-4B` parameters at a time depending on the request
  - natively multimodal

### Server-side / Private Cloud Compute

- **AFM 3 Cloud**
  - general server-side workhorse
- **ADM 3 Cloud (Image)**
  - image generation and editing model
- **AFM 3 Cloud Pro**
  - most capable server model
  - used for more difficult reasoning and agentic tool use

This is useful because the architecture is no longer “one on-device model plus one server model.” Apple is now presenting a more explicit **tiered inference stack**:

- small local model
- stronger local sparse model
- standard cloud model
- specialized image cloud model
- high-end cloud reasoning model

## 2. The most interesting part: AFM 3 Core Advanced

The headline technical idea is Apple's attempt to push a much larger model onto consumer devices without requiring all weights to reside in DRAM.

The problem they identify is:

- dense models need all weights in active memory
- standard MoE-style token routing would require too much bandwidth if experts had to be swapped token-by-token from flash

Apple's solution is a sparse architecture built around **IFP**:

- the full model lives in flash (`NAND`)
- a lightweight dense block selects a subset of experts for the request
- those experts are loaded into DRAM
- the model periodically reselects experts during generation
- a large fraction of the network remains in always-active shared experts

This yields two important properties:

### A. Prompt-level rather than token-level expert selection

This is the biggest conceptual difference from a standard MoE mental model.

Instead of:

$$
\text{route each token to experts at every layer}
$$

Apple is much closer to:

$$
\text{choose a request-conditioned sparse subnetwork and run it for a while}
$$

That is not identical to standard MoE routing, and it is tailored to storage bandwidth constraints on local hardware.

### B. Inference-time elasticity

Apple says AFM 3 Core Advanced can use a predetermined number of active parameters depending on task difficulty.

So the real design objective is not just:

$$
\text{fit a larger model on-device}
$$

It is:

$$
\text{fit a larger model on-device while adapting active compute to latency/quality needs}
$$

That is a very Apple-style systems goal: scalable quality under aggressive memory and responsiveness constraints.

## 3. Why this matters architecturally

AFM 3 Core Advanced is interesting because it attacks a constraint that most frontier open-model reports do not care about directly:

- **flash-to-DRAM bandwidth on consumer devices**

Most open LLM architecture reports optimize:

- training efficiency
- server inference throughput
- KV-cache size
- cluster utilization

Apple is optimizing:

- whether a larger sparse model can be made practical on a phone or laptop class device
- with strict latency and power expectations

That makes AFM3 notable even though Apple reveals fewer raw training details than labs like Meta, Microsoft, or DeepSeek.

## 4. The server-side story

Apple's cloud stack also changes in an important way.

### AFM 3 Cloud

Apple describes AFM 3 Cloud as:

- faster
- more efficient
- better at multimodal reasoning

and says it builds on their 2025 **PT-MoE** foundation with architectural refinements that improve:

- training stability
- reasoning
- context recall

However, the June 2026 post does not yet provide the same technical detail that the 2025 AFM report provided for the previous generation, so we do not yet know the full 2026 cloud architecture recipe.

### AFM 3 Cloud Pro

This is the most interesting deployment change:

- AFM 3 Cloud Pro runs on **NVIDIA GPUs in Google Cloud**
- Apple still serves it through **Private Cloud Compute**
- Apple positions it as the model for:
  - more difficult reasoning
  - agentic tool use

This matters because it shows Apple is no longer trying to keep the entire cloud stack inside one pure Apple-silicon story. They are willing to mix:

- Apple silicon for some cloud models
- NVIDIA GPUs for the frontier cloud tier

when the capability target justifies it.

## 5. Training recipe: what Apple has said so far

The June 2026 overview is high level, but it does reveal a few important points:

- Apple significantly scaled pretraining on the latest generation of **cloud TPUs**
- all models start from a **shared initial foundation**
- they then specialize toward:
  - multimodality
  - audio
  - image understanding
  - long-context reasoning
  - image generation
- post-training combines:
  - supervised fine-tuning
  - multi-stage reinforcement learning
- Apple uses **quantization-aware training** to compress the deployed models

This is enough to infer the broad recipe:

- shared base model(s)
- specialization by architecture/use case
- hardware-specific optimization
- modality expansion
- RL in the post-training stack

But it is not enough yet to reconstruct:

- token counts
- optimizer choices
- context lengths used during training
- exact MoE or PT-MoE layer layouts
- scaling-law regime

So this note should remain explicit about what is still unknown.

## 6. Developer-facing consequences

The WWDC26 developer material gives a few practical details that matter for how the models are meant to be used:

- the on-device model exposed through the Foundation Models framework now supports **image input**
- PCC exposes a stronger server model through the **same unified API**
- developer guidance contrasts the two with:
  - on-device: offline, no request limits, smaller context
  - PCC: online, daily limits, larger context, reasoning support

Apple's WWDC26 session states:

- on-device context: `4K`
- PCC context: `32K`

So from a product perspective, AFM3 is not just a model family; it is a **routing architecture for apps**:

- use local inference when speed, privacy, and offline behavior dominate
- escalate to PCC when larger context or more reasoning is needed

## 7. Evaluation: useful signal, but not a full technical benchmark picture

Apple's public 2026 post mostly reports:

- side-by-side human preference
- feature-specific evaluations
- relative improvements over the 2025 generation

Examples they disclose:

- AFM 3 Core improves over the 2025 on-device baseline in human preference for general text
- AFM 3 Cloud shows a large preference gain over the 2025 AFM Server model
- AFM 3 Cloud Pro improves further over AFM 3 Cloud on text and image understanding
- AFM 3 Core Advanced shows strong gains for:
  - expressive TTS
  - dictation

This is useful product evidence, but it is not the same as a complete technical benchmark suite. Until Apple publishes the promised summer 2026 technical report, the evaluation story remains:

- good enough to see the direction
- not detailed enough for a full model-for-model research comparison

## 8. How AFM3 differs from the 2024/2025 AFM story

Compared with the 2025 AFM report, the third generation appears to add three important shifts:

### A. Much clearer multimodal and audio integration

AFM 3 Core Advanced is explicitly positioned as:

- multimodal
- better for dictation
- better for expressive voice generation

### B. A stronger sparse on-device story

The earlier Apple foundation-model work already focused heavily on efficiency. AFM3 pushes that into a more ambitious form:

- larger local parameter budget
- flash-backed sparse activation
- request-dependent active size

### C. More explicit server-tier stratification

Apple is now cleanly separating:

- ordinary cloud intelligence
- image generation / editing
- high-end cloud reasoning and agent use

This is a more mature systems architecture than the earlier simpler local/server split.

## 9. Main takeaways

- AFM3 is best understood as a **systems architecture**, not just one model.
- The standout technical novelty is **AFM 3 Core Advanced**:
  - `20B` total
  - `1B-4B` active
  - prompt-level expert selection
  - flash-to-DRAM-aware sparse execution
- Apple is increasingly willing to mix:
  - on-device inference
  - Apple-silicon cloud inference
  - NVIDIA cloud inference
  inside one privacy-preserving product stack.
- The public June 2026 material is informative but still incomplete; the full 2026 technical report will matter much more for:
  - training details
  - scaling choices
  - exact architecture
  - benchmark comparisons

## Related

- [Attention Variants](/atlas/ai/architectures/transformers/attention-variants)
- [MoE Training Stability](/atlas/ai/training/optimization/moe-training-stability)
- [Overtraining and Inference-Aware Scaling](/atlas/ai/training/scaling/overtraining-and-inference-aware-scaling)
- [The Llama 3 Herd of Models](/atlas/ai/architectures/model-reports/the-llama-3-herd-of-models)
- [Qwen2.5 Technical Report](/atlas/ai/architectures/model-reports/qwen2-5-technical-report)

## Sources

- Apple, [Introducing the Third Generation of Apple’s Foundation Models](https://machinelearning.apple.com/research/introducing-third-generation-of-apple-foundation-models)
- Apple, [Apple Intelligence Foundation Language Models Tech Report 2025](https://machinelearning.apple.com/research/apple-foundation-models-tech-report-2025)
- Apple Developer, [Build with the new Apple Foundation Model on Private Cloud Compute (WWDC26)](https://developer.apple.com/videos/play/wwdc2026/319/)
