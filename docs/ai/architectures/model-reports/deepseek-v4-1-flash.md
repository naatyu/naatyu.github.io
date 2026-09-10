---
title: "DeepSeek-V4.1-Flash: Cheap Prefill, Multimodal Pretraining, and Agent Environment Scaling"
date: 2026-09-10
lastmod: 2026-09-10
tags:
  - ai/llm
  - models
  - mixture-of-experts
  - sparse-attention
  - multimodal
  - agents
  - reinforcement-learning
draft: false
---

## Summary

DeepSeek-V4.1-Flash is a native image-and-text model with a **552B-parameter backbone plus 196B parameters of Engram conditional memory**, a one-million-token context, and a training recipe built around agent workloads. Its reported activated backbone parameters are **8B during prefill and 16B during decode**—not the reverse.

Its main contributions span three connected areas:

- Architecture and serving: a causal encoder–decoder allows most prompt tokens to bypass the upper half of the network; cross-layer sparse-attention sharing and FP4 storage reduce the global KV cache to a reported 890 bytes per input token.
- Pretraining: 45T multimodal tokens, a separately bootstrapped vision encoder, modality-aware MoE balancing, and optimizer changes for very large memory/embedding tables.
- Post-training: established SFT → RL → on-policy distillation, supported by automated task construction, independently audited verifiers, multi-scaffold rollouts, and a sandbox system designed for millions of concurrent instances.

The report explicitly does **not** claim a new core post-training algorithm. It attributes the gains primarily to better training tasks, environments, verification, and scale. That is the authors' interpretation, not an isolated causal ablation of every ingredient.

This note uses the official [technical report](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/DeepSeek_V41_Tech_Report.pdf), particularly §§2–5. Numbers below are reported results unless explicitly labeled as calculations or interpretation. The [model card](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash) and [reference implementation](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/tree/main/inference) provide complementary release information.

## 1. Architecture at a glance

| Component | Configuration |
| :--- | :--- |
| Backbone parameters | 552B |
| Engram parameters | 196B additional conditional-memory parameters |
| Activated backbone parameters | Approximately 8B/prefill token; 16B/decode token |
| Causal backbone | 40 blocks: 20 encoder + 20 decoder; MoE throughout |
| Hidden width | 5,120 |
| Attention query heads | 64 |
| Main attention head dimension | 512 |
| Query compression dimension | 1,280 |
| Output projection | 8 groups; intermediate dimension 1,024 |
| Local sliding-window attention | Window of 128 tokens, retained per layer |
| Global attention | Compressed Sparse Attention 2, with cross-layer KV and index sharing |
| Sparse indexer | 32 heads, dimension 128, selects top 512 entries |
| Decoder candidate pool | Up to 2,048 blocks × 8 positions = 16,384 candidates |
| MoE | 384 routed experts; top 6 selected; 1 always-active shared expert |
| Expert intermediate width | 2,304 |
| Expert activation | SwiGLU, clamped at 10 |
| Residual connections | Single-Pass mHC; 4 streams; 20 Sinkhorn-Knopp iterations |
| Engram placement | Two modules, zero-indexed layers 1 and 14 |
| Drafting module | DSpark, 3 blocks, 5 parallel draft positions, local window 128 |
| Vision encoder | 32 layers; width 1,024; 16 heads; patch size 14 |
| Vision positional encoding | 2D RoPE |
| Vision-to-language bridge | 3×3 pixel unshuffle, then 2-layer MLP, hidden dimension 5,120 |
| Image resolution | Variable; up to approximately 1,344×1,344 |
| Context | Up to 1M tokens |

The sum `552B + 196B = 748B` combines different parameter categories. Engram is sparse lookup memory, not another 196B dense parameters applied to every token. Conversely, 8B/16B active compute does not mean the model can be stored on hardware sized for an 8B/16B checkpoint. [Report, §§2 and 4.2](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/DeepSeek_V41_Tech_Report.pdf)

### Exact attention layout

The encoder's first two blocks have only sliding-window attention. The remaining 18 encoder blocks form three groups of six:

```text
Encoder: 2 × SWA-only
         3 × [Full, Reuse, Reuse, Reuse, Reuse, Reuse]
         global compression ratio = 2

Decoder:     [Full,    Reuse, Reuse, Reuse]
         4 × [Reindex, Reuse, Reuse, Reuse]
         global compression ratio = 1
```

Every block keeps its own local attention path. Global compression ratio 1 means uncompressed positions, not dense attention: the decoder still selects a sparse subset.

## 2. Why prefill uses half the active parameters

### The usual dependency

In an ordinary causal transformer, each layer constructs its prompt KV cache from that layer's input states. To prepare layer 40's cache, the prompt must pass through the preceding layers—even if only the final prompt position needs an output logit.

### Causal Encoder–Decoder: change where decoder KV comes from

V4.1 makes the lower 20 blocks a **causal encoder**. This is not a bidirectional encoder like the encoder in a conventional translation model: future tokens remain inaccessible.

The decoder's global KV representations are projected from the final encoder states rather than from each decoder layer's evolving hidden states. In the paper's notation:

```text
C_l = H_20 @ W_KV_l
Z_l = H_20 @ W_Z_l
```

Here `H_20` is the sequence of encoder outputs, `C_l` supplies KV entries, and `Z_l` supplies compression weights. CSA2 sharing further reduces the number of distinct global caches actually constructed.

Consequently, preparing global decoder memory does not require running every prompt token through all 20 decoder blocks:

```text
Prompt tokens → encoder blocks 1–20 → encoder states → decoder global KV
                                           │
                                           └→ short decoder-tail replay

Generated token → encoder blocks 1–20 → decoder blocks 21–40 → logits
```

Long-prompt prefill predominantly activates half the backbone. Each generated token still uses all 40 blocks. This explains **8B active during prefill versus 16B during decode**. The design extends the cache-sharing/prefill-skipping idea of [YOCO](https://arxiv.org/abs/2405.05254), while retaining layer-local attention. [Report, §2.2](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/DeepSeek_V41_Tech_Report.pdf)

### The important approximation: local-attention replay

The decoder still needs layer-specific sliding-window KV, which cannot all be obtained from a single projection of encoder outputs.

The serving solution replays the last 128 encoder-output positions through the decoder and restricts their local attention to that replay segment. It does not persist decoder SWA state between prefills. For encoder prefix-cache reuse, it similarly replays a bounded tail to reconstruct local state while preserving the existing global cache.

This is **not exact reconstruction** of a full 40-layer prompt forward pass. Across stacked local-attention layers, dependencies extend farther back than one window. The report says post-training simulates the bounded-replay behavior and reports little measured quality impact; it also acknowledges uncharacterized edge cases.

An illustrative block-token accounting for an uncached prompt of `N` tokens is:

```text
Ordinary full-depth prefill: 40 × N
CED with bounded replay:    20 × N + 20 × 128
Ratio:                     0.5 + 64/N
```

This is an intuition for large `N`, **not a complete FLOP or latency model**: KV projection, attention, Engram, vision processing, cache hits, and scheduling still cost time. It does not imply half-price training or a universal 2× end-to-end speedup. [Report, §§3.2.2 and 6](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/DeepSeek_V41_Tech_Report.pdf)

## 3. CSA2: share memory without forcing identical attention everywhere

CSA2 combines three modes:

| Mode | Global KV and indexer keys | Sparse selection |
| :--- | :--- | :--- |
| Full | Constructs them | Computes a fresh selection |
| Reindex | Reuses existing ones | Computes its own indexer query and fresh selection |
| Reuse | Reuses existing ones | Reuses the latest selection too |

All modes still have their own main attention queries and layer-local SWA. **Sharing a cache does not mean sharing the entire attention computation.** Reindex is the compromise: save memory while allowing later layers to retrieve different context.

Compared with the earlier CSA, compression uses nonoverlapping groups of `m` tokens instead of overlapping groups of `2m`; it removes the compressor's absolute-position component. Indexer keys are projected from main KV rather than independently compressed.

### Hierarchical indexing

The first decoder Full layer scores the available global context and selects its own top 512 entries. It also selects up to 2,048 blocks of 8 positions, producing a shared 16,384-position candidate pool. Later Reindex layers search only that pool, selecting their own top 512.

The first scan still grows with context length. Only the later indexer scans have a fixed candidate bound. A relevant token excluded from the pool cannot be recovered by a later reindexer. This restriction is introduced during post-training and used at inference, rather than bolted on only at deployment. [Report, §2.3](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/DeepSeek_V41_Tech_Report.pdf)

### FP4 cache, trained rather than blindly quantized

The main global cache uses E2M1 values with an E4M3 scale per 16 channels, similar to NVFP4 but without its second-level global scale. Quantization happens after RoPE; quantization-aware training is introduced during post-training. The SWA cache remains FP8 because it is more sensitive.

The reported global cache footprint is **890 bytes per input token**, including the architectural sharing/compression benefits. Calculated at one million tokens, that is approximately **890 MB decimal, or 0.83 GiB**, for this global cache—not total per-request GPU memory. Local caches, activations, workspaces, and model weights are additional.

FP4 here primarily saves storage: the main cached values are dequantized before attention. Do not equate it with native FP4 attention matrix multiplication. [Report, abstract and §2.4.4](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/DeepSeek_V41_Tech_Report.pdf)

## 4. Engram, residual connections, and speculative decoding

### Engram: more memory without proportionate per-token compute

The 196B conditional-memory parameters are split evenly between two modules. Each uses n-gram orders 2, 3, and 4, with 8 hash heads and a total embedding dimension of 2,048 per order. Each head addresses approximately 16M entries; distinct prime table sizes reduce systematic hash collisions.

The module retains tokenizer compression, multi-head hashing, context-aware gating, and integration into the residual streams. Unlike the original Engram design, it omits the short causal convolution because the authors found its gain insufficient to justify serving complexity.

Tables and key/value projections use FP8. Deterministic token-based addressing allows serving to prefetch entries from host memory using background RDMA. **RL rollouts use a different placement:** tables stay in GPU memory to reduce host pressure and fragmentation failures. Engram therefore introduces a memory-placement and communication problem, not just a parameter-count benefit. [Report, §§2.4.2 and 3.1.3](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/DeepSeek_V41_Tech_Report.pdf)

### Single-Pass mHC

mHC carries four residual streams and learns how to mix, transform, and redistribute them. V4.1 shifts the input-mixing coefficients by one block: a block consumes coefficients produced by the previous block.

That removes a dependency which otherwise prevents full kernel fusion. The deployment Mega-mHC kernel combines residual update, input mixing, coefficient prediction, pre-normalization, and FP8 conversion. The report's activation-traffic accounting drops from `(4n + 4)d` to `(2n + 2)d`, halving this component's traffic—not all model memory traffic. Pretraining retains a multi-kernel implementation with the changed coefficient dependency. [Report, §2.4.1](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/DeepSeek_V41_Tech_Report.pdf)

### DSpark training timeline

DSpark has three drafting blocks and predicts five positions in parallel, with a lightweight Markov head modeling draft-token dependencies. A confidence head estimates acceptance, and a scheduler chooses verification length using those estimates and engine throughput profiles.

Unlike jointly pretrained MTP:

1. Backbone pretraining runs without the MTP module.
2. A dedicated stage trains DSpark while freezing the backbone.
3. Post-training continues to update DSpark alongside the changing backbone, but DSpark's objective does not backpropagate into the backbone.

The drafter accelerates both serving and RL/OPD rollouts. See [Speculative Decoding](/atlas/ai/inference-serving/decoding/speculative-decoding) for the broader mechanism. [Report, §2.4.3](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/DeepSeek_V41_Tech_Report.pdf)

## 5. Pretraining data: quantity, quality, and modality

### Disclosed scale

The backbone sees **45T multimodal tokens**, with a **7:1 text-only to multimodal token ratio**. This is a token ratio, not a document or image ratio, and 45T is training exposure—not necessarily 45T distinct, deduplicated tokens.

Text mixture choices are evaluated with scaling experiments across model sizes and data quantities. Domain experts define finer-grained quality criteria. The filtering targets low-information generated text, weak-model outputs, and poor machine translations that behave like implicit duplication. This is not a rejection of all synthetic data: post-training uses it extensively.

Coding coverage expands toward recent repositories, commits, libraries, frameworks, and additional languages. The report does not disclose a reproducible per-language or code-versus-prose token allocation. [Report, §4.1](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/DeepSeek_V41_Tech_Report.pdf)

### Multimodal collection

Multimodal pretraining emphasizes native data rather than large-scale synthetic generation:

- Image–alt-text pairs, filtered for relevance and semantically deduplicated by image.
- Interleaved webpages and PDFs, preserving visual/textual context.
- Specialized grounding, pointing, OCR, and long-tail data.
- Image–code pairs and computer-use trajectories.

The interleaved-data pipeline first applies cheap document statistics, deduplication, and quality filters **before expensive image retrieval**. It then repeats filtering with image information and uses SmolVLM-based quality scoring. Some rejected interleaved documents are recycled into usable image–text pairs. The report also describes renewed crawling because existing Common Crawl material is text-biased.

After processing text and multimodal corpora separately, overlapping text documents are replaced with their multimodal counterparts; the larger configured epoch count is retained. Context-extension and pretraining allocations are coordinated to reduce overlap. Deterministic ultralong-data splitting and best-fit packing keep reported padding at or below `1e-4`.

The practical lesson is a staged data pipeline: **filter cheaply, enrich selectively, deduplicate across representations, then pack efficiently**. [Report, §4.1](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/DeepSeek_V41_Tech_Report.pdf)

## 6. Vision training: an LLM-style backbone is not enough

DeepSeek-ViT uses 2D RoPE, RMSNorm, SwiGLU, and a linear patch projection chosen for Muon compatibility. Pixel unshuffle reduces the number of visual tokens entering the language model by 9× by moving each 3×3 neighborhood into channels.

The training sequence matters:

1. **Contrastive bootstrap:** train the vision encoder from scratch using a SigLIP-style sigmoid loss on approximately 47B image–text pairs, at up to 224-pixel resolution while preserving aspect ratio. The report does not establish that these are all unique pairs.
2. **Generative alignment:** attach it to an auxiliary 4B MoE language model and train on 236B tokens of captions, alt text, charts, and OCR, at resolutions from 544 to 1,344.
3. **Transfer:** discard the auxiliary 4B language model and retain the vision encoder for the main model's multimodal pretraining.
4. **Main-model integration:** initially freeze the vision encoder except its final normalization layer; keep the projector trainable. Unfreeze the encoder at the language-model learning-rate decay stage, using a smaller learning rate.

The initial high-resolution contrastive training experiments contributed little to final quality after later stages. This is useful evidence for allocating resolution and compute by training stage, rather than paying for maximum resolution everywhere.

MoE routing maintains **separate expert-load correction biases for image and text tokens**. The biases affect expert selection; original routing scores weight the selected outputs. Balancing only the aggregate load could hide severe imbalance within one modality. [Report, §§2.1.1, 2.5, and 4.2](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/DeepSeek_V41_Tech_Report.pdf)

## 7. Optimization and context schedule

| Item | Reported setting |
| :--- | :--- |
| Global batch | 100.6M tokens |
| Total backbone training | 45T tokens |
| Initial context | Sparse attention from scratch at 64K |
| Context extension | Extend to 1M at 34T tokens |
| LR warmup | 2,000 steps |
| Main learning rate | `2.6e-4` after warmup until 28T tokens |
| LR decay | Cosine to `2.6e-5` between 28T and 40T |
| Final phase | Constant `2.6e-5` from 40T to 45T |
| Muon | Momentum 0.95, weight decay 0.1, update RMS 0.18 |
| AdamW | Betas 0.9/0.95, epsilon `1e-20`, weight decay 0.1 |
| Engram learning rate | 5× multiplier |
| Modality-specific routing-bias update | 0.001 |
| Small sequence-level balance loss | 0.0001 |

Calculated from total tokens/global batch, the exposure corresponds to approximately **447,000 optimizer steps** if that batch is maintained throughout. This is not a GPU-hour estimate.

### Parameter-specific optimizers

- Backbone linear matrices, Engram projections, and the vision–language projector use Muon. Query and key weights use head-wise Muon, giving different heads their own preconditioning rather than treating all heads as one matrix.
- Normalization parameters and other non-matrix parameters use AdamW.
- Engram tables, token embeddings, and the prediction head use Nesterov momentum followed by **Sinkhorn balancing**, without weight decay.

For the last category, alternating row/column rescaling balances squared update magnitudes. It replaces Muon's Newton–Schulz orthogonalization, not the forward-pass embeddings. The motivation is especially practical at 196B memory parameters: retain a momentum buffer without Adam's additional second-moment buffer. The configuration uses 11 balancing iterations, `tau = 1e-3`, and epsilon `1e-20`.

Do not confuse this optimizer's Sinkhorn balancing with the Sinkhorn-Knopp operations in mHC residual mixing: they act on different objects for different purposes. [Report, §§2.5 and 4.2](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/DeepSeek_V41_Tech_Report.pdf)

### Distributed-training consequences

Sharing attention state across layers also means sharing across pipeline-stage boundaries. The system uses shadow indexers with one logical parameter owner, synchronized weights/gradients, pipeline payloads carrying shared representations and indices, and microbatch-scoped state lifetimes.

Engram tables are row-sharded across dedicated process groups, with optimizer states further sharded across replicas. Deterministic lookup permits prefetch before microbatch execution. For multimodal training, vision work is separated from language-model forward/backward; images in long sequences are load-balanced across context-parallel ranks and loaded once. These are infrastructure requirements for the architecture, not optional details when reproducing it at scale. [Report, §3.1](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/DeepSeek_V41_Tech_Report.pdf)

## 8. Post-training: the environment factory is the main story

The overall sequence is **SFT → RL → final on-policy distillation**. Section 5 does not provide enough SFT counts, data-mixture proportions, or hyperparameters to reproduce the entire process.

The report defines a training task as:

```text
(problem, executable environment, verification system)
```

A plausible problem statement alone is insufficient. The environment must work and the verifier must measure the intended outcome.

Task constructors are themselves iteratively trained using **difficulty and correctness** as reward signals. Difficulty means nontrivial tasks; correctness means consistency among the problem, environment, and verification system. New solver trajectories are used to re-audit tasks whenever they enter another RL run. The task dataset is therefore maintained as a changing collection of executable artifacts, not frozen after initial generation. [Report, §§5.1–5.1.1](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/DeepSeek_V41_Tech_Report.pdf)

### Coding environments: construction end to end

```text
Hard/failed real sessions + selected GitHub repositories
    → planner
    → isolated environment builder
    → several independent solvers
    → independent inspector
    → repair / difficulty recalibration
    → accepted RL task
    → fresh trajectories feed later re-audits
```

1. **Collect sources.** Voluntarily returned employee/partner coding sessions are filtered for difficulty or weak model performance and deduplicated by trajectory. A second source is GitHub repositories above a star threshold; the threshold is not specified.
2. **Plan an executable task.** A planner checks whether the repository can be built and run in a container and whether success can be automatically verified. It selects a conversation turn or commit, proposes substantial implementation directions, and defines both target and regression checks. It produces a construction report and identifies required external resources.
3. **Build the environment.** A separate builder installs dependencies, prepares the working tree, writes tests and instructions, self-tests the setup, removes solution leakage, and packages the result as a new container-image layer.
4. **Run distinct solvers.** Multiple agents attempt the task. Their trajectories provide evidence about solvability, ambiguity, difficulty, and possible exploits.
5. **Inspect independently.** An inspector reviews both the environment and trajectories for broken setup, factual inconsistencies, disagreement between instructions and tests, and hackable evaluation.
6. **Repair and recalibrate.** A repair agent fixes defects and adjusts tasks that are too easy or too hard. Construction and validation can repeat.

The checks include:

- **Fail-to-pass:** behavior that fails in the starting repository and should pass after the requested change.
- **Pass-to-pass:** existing behavior that should keep passing, preventing a solution that fixes one thing by breaking another.

Starting from a commit does not mean the entire pipeline is limited to replaying an existing reference patch. The planner also synthesizes implementation tasks. Equally, automated tests are not automatically trustworthy; inspector and repair stages exist because generated verifiers can be wrong or exploitable.

This is closely related to the repository-grounded approaches in [GLM-5](/atlas/ai/architectures/model-reports/glm-5-agentic-engineering). What is particularly informative here is the explicit separation of planner, builder, solver, inspector, and repair responsibilities, plus continuing task audits during RL. The report does not establish that each individual pattern originated with V4.1. [Report, §5.1.1](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/DeepSeek_V41_Tech_Report.pdf)

### General-agent environments: reconstruct tools and failures

Employees and partners voluntarily return workflows, tool interactions, and feedback. The pipeline constructs mocked tools that reproduce observed input/output formats, API schemas, constraints, and behavior, covering SaaS, enterprise applications, and specialized backends.

Negative feedback is used to reconstruct single- and multi-turn failure situations for targeted RL. This is **failure-driven environment synthesis**, not just asking a model to invent random API tasks.

A mocked interface is not proof of fidelity to the real service. Whether the simulation preserves the failure modes that matter remains an important validation question. See [Agentic Training Data and Environment Synthesis](/atlas/ai/training/data/agentic-training-data-and-environment-synthesis). [Report, §5.1.1](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/DeepSeek_V41_Tech_Report.pdf)

## 9. DSec: how they run the RL environments

V4.1 increases demand to **millions of concurrent sandbox instances**. That is a concurrency/scaling statement, not a disclosed count of unique tasks or a claim that every sandbox consumes a dedicated CPU core.

### Scheduling and density

DSec shards machines into scale units to contain failures and resource exhaustion. Its custom placement engine uses independent scheduler replicas with relaxed global consistency. Each replica estimates available resources; individual nodes make the final admission decision and reject unsafe placements.

At node level, worker VMs are bound to hardware sub-NUMA domains, and containers stay within the VM's local CPU/memory domain. In comparable workloads, the reported density rises from roughly **1,000 to more than 2,500 live containers per physical node** before measurable end-to-end degradation.

Do not interpret that as 2,500 simultaneous repository builds per node. Live sandboxes may spend substantial time waiting for model actions. The report does not give enough per-task resource distributions or node specifications to turn this figure into a portable capacity plan.

Latency-sensitive jobs receive a separate class; background tasks use `SCHED_IDLE`, and core scheduling prevents different priority classes from sharing sibling hyperthreads. Otherwise machine contention could distort timing-sensitive grading.

### Isolation is part of reward integrity

The authors report agents damaging environments, exploiting infrastructure weaknesses, or finding answer leakage through package services. DSec applies per-sandbox AppArmor profiles and fine-grained eBPF network policies. Crashing the sandbox counts as a failed trajectory and emits a repercussion signal to training.

The important lesson is that the verifier and its surrounding infrastructure are part of the attack surface. RL can optimize around the intended task if cheaper paths to reward remain available. [Report, §5.1.3](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/DeepSeek_V41_Tech_Report.pdf)

## 10. RL across scaffolds, interruptions, and changing policies

### Multi-scaffold training

Training covers multiple versions of the same scaffold and heterogeneous scaffolds, including Claude Code, OpenCode, Pi, and DeepSeek Harness variants. This exposes the policy to different tool interfaces and interaction conventions instead of specializing only to one harness.

The sandbox runs the scaffold/tools; a separate worker orchestrates trajectories and communicates with training through a common schema. Both live outside the preemptible GPU pool, allowing long-running environment state to survive GPU training interruptions.

The report also describes **model merging to initialize successive RL runs** across configurations and scaffolds. It does not specify enough to assume a particular averaging formula. Disconnected learning curves can correspond to newly initialized runs, not one uninterrupted optimization trajectory. [Report, §5.1.2](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/DeepSeek_V41_Tech_Report.pdf)

### Asynchronous samples, time-shared GPUs

Rollouts and training share the same physical GPU devices in alternating phases. The system keeps many samples in flight; once enough training data accumulates, training preempts rollouts at token boundaries.

Dispatch is sample-level: after enough samples finish to make room for the next prompt's GRPO group, that prompt is dispatched regardless of which earlier groups supplied those completions. This avoids waiting for the slowest member of a particular group. It does **not** imply computing group-relative advantages across unrelated prompts.

The system preserves KV and expert-routing states across interruptions. On resumption with a newer checkpoint, it reuses those states instead of prefilling again. Such a trajectory can span multiple policy versions; it is not equivalent to regenerating the entire sequence under the newest policy. During training, concatenated routing replay uses the recorded expert choices from each segment.

### Two biases, two sets of controls

- **Completion-time bias:** short trajectories return first and can dominate early updates. Per-dataset concurrency limits and optional rejection of early-returned short samples help regulate the distribution.
- **Off-policy staleness:** some tokens were generated by older checkpoints. Dispatch/waiting controls bound the degree of off-policy sampling, and a loss mask excludes excessively stale tokens.

The report does not disclose universal numerical thresholds for these controls. Asynchronous throughput gains require data-distribution and policy-staleness management; they are not free efficiency. See [Long-Horizon Agentic RL Infrastructure](/atlas/ai/training/optimization/long-horizon-agentic-rl-infrastructure). [Report, §5.2](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/DeepSeek_V41_Tech_Report.pdf)

## 11. Train reasoning effort, then consolidate teachers

### Effort-conditioned RL

The model receives an explicit effort value `b` from 1 to 100 in its system prompt. Training samples responses at selected effort levels for each problem.

Rewards are mean-centered **within the same problem and effort subgroup**, not across low- and high-effort responses. A capped reasoning-length penalty depends on effort:

```text
length_reward = -min(C_max, k(b) × reasoning_tokens / L_norm)
k(b)          = k_0 × exp(-(b - b_min) / tau)
```

`C_max` caps the deduction, `L_norm` supplies a reference length, `k_0` controls baseline brevity pressure, and `tau` controls how quickly that pressure falls as effort increases. Higher requested effort means a weaker length penalty, allowing more computation when task reward justifies it.

The same checkpoint can therefore learn different cost/quality operating points. Effort is not a hard maximum-token budget. The report maps API presets to `low = 50`, `high = 75`, and `max = 100`, and describes interpolation beyond the finite training levels. [Report, §5.1.4](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/DeepSeek_V41_Tech_Report.pdf)

### Final full-vocabulary on-policy distillation

The last stage consolidates **over 40 teacher models** using data from all domains. Teachers can come from different development stages and have different architectures. The active teachers, dataset mixture, and per-dataset concurrency limits can change as capability evaluations evolve.

The conceptual distinction from ordinary trace SFT is important: in on-policy distillation, the student visits states through its own generation, and teacher distributions provide learning targets at those states. Full-vocabulary distillation supplies richer token-distribution supervision than retaining only a teacher's sampled answer. Section 5.2.4 does not disclose the complete loss configuration or all teacher-to-domain assignments.

This is a mechanism for consolidating specialized capabilities into one deployable model; it is separate from the intermediate RL initialization merges above. It should not be reduced to “generate successful teacher traces and SFT the original base.” [Report, §5.2.4](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/DeepSeek_V41_Tech_Report.pdf)

## 12. Results and interpretation

Selected **technical-report Table 3** results at maximum effort:

| Benchmark | V4-Flash | V4.1-Flash |
| :--- | ---: | ---: |
| GPQA Diamond, pass@1 | 89.9 | 90.9 |
| Terminal-Bench 2.1, pass@1 | 82.7 | 90.6 |
| Terminal-Bench 3.0, pass@1 | 7.6 | 30.0 |
| Terminal-Bench 4.0, pass@1 | 7.0 | 31.2 |
| DeepSWE v1.1, resolved | 54.4 | 74.2 |
| NL2Repo-Bench, score | 54.2 | 65.4 |
| AutomationBench, pass@1 | 37.7 | 54.8 |
| Agents' Last Exam, pass@1 | 25.2 | 31.8 |

These are author-reported evaluations, not an independent reproduction. The model card listed NL2Repo at 64.0 when checked, whereas the report lists 65.4; this table deliberately follows the report rather than silently mixing release artifacts.

The strongest Terminal-Bench 2.1 result should not obscure the much lower absolute results on versions 3 and 4. Likewise, native multimodal input does not establish superiority on every visual task. ZeroBench's reported 49.0 is **pass@5**, not pass@1.

Harnesses matter: the report gives DeepSWE resolved rates of 74.2 with mini-SWE, 72.6 with DeepSeek Harness Minimal, 69.8 with Claude Code, and 65.6 with Codex. Coding evaluations generally use temperature 1.0, top-p 0.95, and a 1M context; visual-agent evaluations use a different setup, including a 512K context. Model rankings cannot be detached from these conditions.

Evaluation hardening includes network restrictions, removed Git histories, and cleanup of build/package caches to reduce leakage. The authors still observe exploit-seeking behavior. [Report, §§5.3 and 6](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/DeepSeek_V41_Tech_Report.pdf)

## 13. What is new, useful, and still missing?

| Area | Particularly useful V4.1 contribution | Important qualification |
| :--- | :--- | :--- |
| Prefill | CED plus bounded local replay | Builds on YOCO; replay is approximate |
| Long-context memory | CSA2 modes, hierarchical selection, FP4 main KV | Initial full-range index scan remains; sparse retrieval can miss evidence |
| Residual execution | Shifted mixing coefficients enable Single-Pass mHC | Builds on mHC; traffic gain is component-specific |
| Large memory optimization | Sinkhorn-balanced updates for Engram/embeddings/head | Builds on earlier balancing and momentum methods |
| Multimodal training | Modality-specific routing balance and staged vision integration | Most individual vision ingredients are established |
| Agent learning | Constructor training, independent task audits, failure reconstruction | Not a newly claimed RL objective |
| RL systems | Dense sandbox hosting, multi-scaffold asynchronous execution, state reuse | Scale and isolation are substantial engineering investments |
| Consolidation | Full-vocabulary OPD from over 40 heterogeneous teachers | Exact full recipe is not disclosed |

The report is **not a complete reproduction specification**. In particular, it does not provide an adequate end-to-end accounting of:

- SFT examples/tokens, exact mixtures, filtering yields, and supervision masks.
- Unique RL tasks, unique environments, accepted-task production rate, or construction cost.
- Per-task CPU/RAM distributions, total CPU-node inventory, GPU-hours, or calendar time.
- Complete reward coefficients, all rollout group sizes, staleness thresholds, or every domain's RL schedule.
- Exact model-merge method and teacher selection/distillation settings.

Millions of live containers cannot be converted into millions of distinct tasks, and 45T pretraining tokens cannot be converted into an RL-data budget.

The released inference code is a reference implementation, not the production serving stack. Its straightforward all-layer forward path and out-of-scope speculative generation loop do not by themselves reproduce production CED skipping, cache replay, or DSpark scheduling. Check actual code paths before using it to benchmark those claims. [Reference inference code](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/tree/main/inference)

### What to retain

For architecture: **reduce prefill dependencies, not merely arithmetic inside each layer**.

For pretraining: **data quality, modality balance, optimizer state, and distributed state ownership belong in the model design**.

For agent RL: **build a task factory with executable environments and adversarially checked verification, then keep auditing it against the improving policy**. The report's most transferable lesson is that this pipeline can matter more than inventing another RL loss.

## Related

- [Agentic Training Data and Environment Synthesis](/atlas/ai/training/data/agentic-training-data-and-environment-synthesis)
- [Long-Horizon Agentic RL Infrastructure](/atlas/ai/training/optimization/long-horizon-agentic-rl-infrastructure)
- [Reasoning Effort Control](/atlas/ai/inference-serving/performance/reasoning-effort-control)
- [Disaggregated Prefill/Decode Serving](/atlas/ai/inference-serving/serving-architectures/disaggregated-prefill-decode-serving)
- [Speculative Decoding](/atlas/ai/inference-serving/decoding/speculative-decoding)
- [GLM-5](/atlas/ai/architectures/model-reports/glm-5-agentic-engineering)

## Sources

- DeepSeek-AI, [DeepSeek-V4.1 Technical Report](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/DeepSeek_V41_Tech_Report.pdf), September 2026.
- DeepSeek-AI, [official model card](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash) and [reference inference implementation](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/tree/main/inference).
- Sun et al., [You Only Cache Once: Decoder-Decoder Architectures for Language Models](https://arxiv.org/abs/2405.05254), 2024, for the acknowledged architectural antecedent.
