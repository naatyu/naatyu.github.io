---
title: "GLM-5: From Vibe Coding to Agentic Engineering"
date: 2026-08-25
lastmod: 2026-08-26
tags:
  - ai/llm
  - models
  - mixture-of-experts
  - sparse-attention
  - coding
  - agents
draft: false
---

## Summary

GLM-5 is a decoder-only sparse Mixture-of-Experts language model aimed at coding and long-horizon agents. It has `744B` reported parameters, activates about `40B` parameters per token, and was trained on about `28.5T` tokens. Its released checkpoint uses `78` decoder blocks, a hidden width of `6,144`, Multi-head Latent Attention (MLA), DeepSeek Sparse Attention (DSA), and `256` routed experts in every MoE block.

The most useful lesson is not simply that scaling produced a stronger model. GLM-5 coordinates:

- a much larger but sparse backbone
- compressed latent attention plus learned top-`2,048` token selection
- a continued-training procedure that converts dense attention into sparse attention
- parameter-shared Multi-Token Prediction (MTP)
- repository-, terminal-, browser-, and tool-based training environments
- asynchronous, on-policy reinforcement learning at more than `1,000` concurrent rollouts
- cross-stage on-policy distillation to consolidate specialized checkpoints

This is also an unusually useful report for separating **model architecture** from the surrounding **agent system**. Many headline coding results depend on prompts, harnesses, tools, sandboxes, context management, and verification—not only on the weights.

## 1. Architecture at a glance

The table below combines Appendix A of the paper with the official released checkpoint configuration. Values marked **checkpoint** are not all present in the paper's architecture table.

| Component | GLM-5 |
| :--- | ---: |
| Architecture | Decoder-only causal LM, sparse MoE |
| Total parameters | `744B` reported |
| Activated parameters | `40B` reported per token |
| Decoder blocks | `78` in the checkpoint: `3` dense + `75` MoE |
| MTP modules | `1` parameterized module |
| Hidden dimension | `6,144` |
| Dense FFN intermediate dimension | `12,288` |
| MoE expert intermediate dimension | `2,048` |
| Attention | MLA + DSA in every block |
| Query heads | `64` |
| Query latent rank | `2,048` |
| KV latent rank | `512` |
| Q/K dimensions per head | `192` NoPE + `64` RoPE = `256` |
| Value dimension per head | `256` |
| DSA indexer heads | `32` |
| DSA indexer head dimension | `128` |
| DSA selected keys | top `2,048` per query |
| Routed experts per MoE block | `256` |
| Active routed experts per token | `8` |
| Shared experts | `1`, always active |
| Router | sigmoid scores, loss-free correction bias |
| Activation | SiLU-gated MLP, effectively SwiGLU |
| Normalization | pre-RMSNorm, epsilon `1e-5` |
| Positional encoding | partial, interleaved RoPE |
| RoPE base | `1,000,000` |
| Vocabulary | `154,880` |
| Maximum positions | `202,752` |
| Checkpoint dtype | BF16 |
| Input/output embeddings | untied |
| Attention bias/dropout | no bias, dropout `0` |
| License | MIT |

### Two source discrepancies worth preserving

The report prose says that GLM-5 reduces the layer count to `80`. Appendix A, however, lists `3` dense blocks, `75` MoE blocks, and one MTP module. The released configuration specifies `num_hidden_layers=78` and `num_nextn_predict_layers=1`. The most defensible implementation description is therefore **78 decoder blocks plus one parameterized MTP module**; the prose's `80` is not reconciled by the published table.

The paper's architecture table gives a QK head dimension of `192`, but the released implementation defines:

```text
qk_nope_head_dim = 192
qk_rope_head_dim = 64
qk_head_dim      = 256
```

Thus `192` is the non-rotary QK slice, not the complete query/key head width. This agrees with the main text, which says the full head dimension was increased from `192` to `256`.

## 2. Complete decoder block

At a high level, decoder block `l` is:

```text
x_l: [batch, sequence, 6144]
  |
  +-> RMSNorm
  |     |
  |     +-> query compression:       6144 -> 2048
  |     |       RMSNorm
  |     |       query expansion:     2048 -> 64 x 256
  |     |
  |     +-> KV compression:          6144 -> 512 + 64 rotary dims
  |     |       RMSNorm on 512 latent
  |     |       KV expansion:        512 -> 64 x (192 key + 256 value)
  |     |
  |     +-> DSA indexer:             choose <= 2048 causal keys/query
  |     |
  |     +-> sparse MLA attention
  |             output projection:   64 x 256 -> 6144
  |
  +-> residual add
  |
  +-> RMSNorm
  |     |
  |     +-> dense SwiGLU, blocks 0..2
  |     |       6144 -> 12288 -> 6144
  |     |
  |     +-> sparse MoE, blocks 3..77
  |             route to 8 of 256 experts
  |             + 1 always-active shared expert
  |             each expert: 6144 -> 2048 -> 6144
  |
  +-> residual add
  |
x_(l+1): [batch, sequence, 6144]
```

After the final block, the model applies a final RMSNorm and an untied vocabulary projection to `154,880` logits.

The first three blocks replace the MoE sublayer with a dense gated MLP. Every later block contains both sparse DSA attention and sparse expert routing; these are two independent forms of sparsity.

## 3. Multi-head Latent Attention

MLA compresses the query and KV representations before expanding them into attention heads. The query path is:

$$
x
\in \mathbb{R}^{6144}
\rightarrow
c^Q
\in \mathbb{R}^{2048}
\rightarrow
64 \times 256
$$

The KV path is:

$$
x
\in \mathbb{R}^{6144}
\rightarrow
\left[c^{KV}\in\mathbb{R}^{512};\ k^R\in\mathbb{R}^{64}\right]
$$

The `512`-dimensional latent is normalized and expanded into, for every head:

```text
non-rotary key: 192 dimensions
value:          256 dimensions
```

The separate `64`-dimensional rotary key is shared before being expanded across the heads. Each query is split into the corresponding parts:

```text
query head = [192 NoPE dimensions | 64 RoPE dimensions]
key head   = [192 NoPE dimensions | 64 RoPE dimensions]
```

RoPE is applied only to the final `64` dimensions. The remaining `192` dimensions carry content without an explicit rotation. The checkpoint uses interleaved RoPE pairs with base `1,000,000` and no configured scaling rule.

Calling `num_key_value_heads=64` ordinary full multi-head attention would be misleading. The important storage and computation structure is the low-rank MLA factorization, not conventional independent KV projections.

## 4. DeepSeek Sparse Attention

Dense causal attention lets each query compare against every preceding token. DSA first runs a cheaper indexer and then computes the main MLA operation only on selected tokens.

For sequence length `L` and selected-key count `k=2,048`:

$$
\text{main sparse attention cost}=O(Lk)
$$

rather than `O(L^2)`. The indexer still makes all-pairs comparisons, but in a much smaller representation.

### Indexer architecture

For every query token, the released GLM-5 indexer uses:

- `32` indexer heads
- `128` dimensions per head
- `64` rotary and `64` pass-through dimensions
- a learned scalar mixture over the `32` head scores
- a ReLU before the head mixture
- a causal mask followed by top-`2,048` selection

Conceptually:

```text
query latent [2048]
    -> 32 indexer queries x 128

hidden state [6144]
    -> one indexer key x 128
    -> LayerNorm

32 query-key scores
    -> ReLU
    -> learned token-dependent mixture of the 32 scores
    -> causal mask
    -> top 2048 key positions
    -> main MLA attends only to those positions
```

The selected positions are discrete. During RL the authors found that nondeterministic GPU top-k implementations caused training/inference mismatches, rapid entropy collapse, and degraded performance. Their stable recipe used deterministic `torch.topk` and froze the indexer during RL.

### Conversion from dense MLA to DSA

GLM-5 did not train sparse attention from the first token. DSA was introduced through continued training:

1. **Indexer warm-up:** freeze the main model and train the indexer for `1,000` steps. Each step uses `14` sequences of length `202,752`; learning rate decays from `5e-3` to `2e-4`.
2. **Sparse adaptation:** jointly train model and indexer for `20B` tokens at constant learning rate `1e-5` while using sparse attention.

The authors report long-context accuracy close to dense MLA and approximately `1.5–2x` lower long-sequence attention compute. Their phrase “lossless by construction” should not be interpreted mathematically: top-k selection can omit relevant keys. The evidence is empirical recovery after adaptation, not guaranteed equality with dense attention.

## 5. Mixture-of-Experts layer

Each of the `75` MoE blocks contains:

- `256` routed experts
- top-`8` routed experts for each token
- `1` shared expert that runs for every token
- a `2,048`-dimensional gated intermediate representation per expert

Each expert contains gate, up, and down matrices, so its main weight count is approximately:

$$
3 \times 6144 \times 2048
\approx 37.75\text{M parameters}
$$

With `256` routed plus one shared expert:

$$
257 \times 37.75\text{M}
\approx 9.70\text{B parameters per MoE block}
$$

Across `75` blocks, expert matrices alone account for roughly `727B` parameters. Only nine expert networks—eight routed and one shared—execute for a token:

$$
9 \times 37.75\text{M} \times 75
\approx 25.5\text{B active expert parameters}
$$

Attention projections, dense blocks, norms, routers, MTP, and other weights bring the paper's active count to about `40B` and total count to `744B`. This arithmetic is explanatory rather than an exact reconstruction; the paper's count includes MTP but excludes embeddings and the output head.

### Router behavior

The router applies independent sigmoid scores rather than a softmax over experts. It selects eight experts, normalizes their selected weights, and multiplies them by a routed scaling factor of `2.5`.

The checkpoint uses the `noaux_tc` loss-free balancing method. A learned correction bias affects expert choice to improve load balance without adding the usual auxiliary balancing loss to the language-model objective. The uncorrected sigmoid scores determine the selected experts' mixture weights.

## 6. Multi-Token Prediction

GLM-5 has one parameterized MTP module used as a draft model for speculative decoding. The report describes sharing this module's parameters across three training unroll positions. Parameter sharing keeps the memory footprint close to one extra layer while teaching several future-token predictions.

With four speculative steps, the paper reports an average accepted length of `2.76`, compared with `2.55` for DeepSeek-V3.2 in its setup. Acceptance length is serving-stack dependent, so this is not a universal throughput number.

## 7. Pretraining data and schedule

GLM-5 reports about `28.5T` training tokens. The main pretraining corpus is described as `27T` tokens, followed by long-context mid-training:

| Stage | Sequence length | Tokens |
| :--- | ---: | ---: |
| Main pretraining | mixed | about `27T` |
| Mid-training | `32K` | `1T` |
| Mid-training | `128K` | `500B` |
| Mid-training | about `200K` | `50B` |

The rounded stages sum to `28.55T`, consistent with the reported approximate `28.5T` total.

The data work emphasizes:

- code and reasoning data early in training
- learned web-quality classifiers
- a world-knowledge classifier
- fuzzy deduplication that increased unique code tokens by `28%`
- language-specific quality classifiers for lower-resource languages
- high-quality mathematics and science filtering
- natural long documents plus synthetic long-range dependency tasks

For software engineering, the corpus combines repository files with commits, issues, pull requests, and related source state. The team collected about `10M` issue–pull-request pairs and retained about `160B` unique tokens after filtering. This is qualitatively different from training only on isolated source files: the model sees a problem statement, a changing repository, and the patch that resolved it.

### Optimization

GLM-5 follows the GLM-4.5 recipe with Muon, cosine decay, and batch-size warm-up:

- pretraining LR warms from `0` to `2e-4`, then decays to `4e-5`
- mid-training LR decays linearly from `4e-5` to `1e-5`
- DSA warm-up LR decays from `5e-3` to `2e-4`
- DSA sparse adaptation uses constant `1e-5`

The authors introduce **Muon Split** for MLA. Q, K, and V up-projections are orthogonalized independently by head rather than treating the combined matrix as one object. They report that this lets MLA match a GQA-8 baseline while keeping attention logits stable without clipping.

## 8. Training systems

The model's scale requires more than ordinary data parallelism. The report describes:

- interleaved pipeline parallelism
- flexible placement of the MTP module with a shared main output head
- pipeline-aware ZeRO-2 gradient sharding with rolling full-gradient buffers
- communication that avoids redundant Muon synchronization
- layer-granular activation offload to CPU and selective recomputation
- sequence-chunked vocabulary projection and loss
- deferred weight-gradient computation
- workload-aware sequence reordering
- dynamic attention redistribution and flexible context-parallel groups
- hierarchical all-to-all for MoE communication

The team also applies INT4 quantization-aware training during SFT and reports a bitwise-identical offline quantization/training kernel. This is part of the model-building recipe, not a property automatically obtained by quantizing the published BF16 checkpoint.

## 9. Post-training pipeline

The stages are:

```text
Supervised fine-tuning
    -> reasoning RL
    -> agentic RL
    -> general RL
    -> on-policy cross-stage distillation
```

SFT uses a maximum context of `202,752` and mixes general conversation, reasoning, coding, and agent trajectories. Agent data is generated in executable environments with expert models and rejection sampling. When a trajectory contains a recoverable mistake, the erroneous segment may remain in context while its loss is masked, allowing the model to learn the later correction without imitating the error.

The model supports interleaved thinking before ordinary responses and tool calls, preserved thinking across turns, and per-turn control over whether reasoning is emitted.

### Reasoning RL

Reasoning RL uses GRPO-style optimization with fully on-policy groups:

- group size `32`
- batch size `32`
- roughly balanced mathematics, science, code, and tool-integrated reasoning
- mainly binary outcome rewards
- no KL penalty
- PPO clipping with lower epsilon `0.20` and upper epsilon `0.28`
- an IcePop-style training/inference likelihood-ratio cutoff of `2`

The absence of a KL penalty does not mean the update is unconstrained: clipping and the mismatch cutoff still bound damaging off-policy updates.

### Asynchronous agentic RL

Agent trajectories vary enormously in duration. GLM-5 decouples rollout and training so that slow environments do not stall every learner step. Its `slime` infrastructure includes:

- a central multi-task rollout orchestrator
- more than `1,000` simultaneous rollouts
- exact token-ID and metadata recording through the TITO gateway
- direct double-sided importance sampling using rollout log-probabilities
- policy-version staleness filtering
- invalid sandbox-run filtering
- incomplete-group padding when enough members remain, otherwise group dropping
- periodic weight synchronization and optimizer reset after rollout-engine updates
- rollout-ID-aware consistent hashing to preserve KV-cache locality
- FP8 inference, MTP, and prefill/decode disaggregation

Recording exact token IDs is important. Retokenizing generated text can produce a sequence different from the one actually sampled, invalidating the behavior-policy probabilities used by the RL objective.

## 10. Agent environments

The reported environment collection includes:

- more than `10,000` verifiable software-engineering tasks from thousands of repositories
- nine programming languages: Python, Java, Go, C, C++, JavaScript, TypeScript, PHP, and Ruby
- thousands of terminal tasks packaged in Docker or Harbor, with over `90%` reported build success
- search tasks grounded in a web knowledge graph of more than `2M` pages
- slide-generation tasks scored with static, runtime, and perceptual checks

This is one of the report's central practical lessons: strong agent RL needs executable initial states, tools, deterministic or robust graders, isolation, and enough task diversity to prevent learning benchmark shortcuts. A prompt-and-answer dataset alone cannot provide environment interaction.

## 11. Consolidating specialist policies

After the sequential RL stages, GLM-5 uses on-policy cross-stage distillation. Final checkpoints from previous stages act as teachers, and prompts from their RL domains are mixed together.

The student samples its own trajectory. For each token, the selected teacher evaluates that same student-generated prefix. The teacher–student log-probability gap replaces the usual reward advantage. The reported setup uses group size `1` and batch size `1,024`.

This is how specialized behavior is merged without parameter averaging: one student is trained to reproduce several teachers on its own state distribution. It avoids some brittleness of weight merging and avoids requiring each specialist to generate an offline SFT corpus first.

## 12. Context management for search agents

Long context alone does not make unlimited tool transcripts useful. On BrowseComp, keeping only the five most recent interaction rounds and folding older tool observations improves the reported score from `55.3` to `62.0`. Combining this with a discard-all rule beyond a `32K` threshold raises it to `75.9`.

This gain belongs to the inference agent, not the base model architecture. It shows why model and harness results must be separated: context policy can move a benchmark by more than many architecture changes.

## 13. Reported results

Selected headline results from the paper are:

| Area | Benchmark | GLM-5 |
| :--- | :--- | ---: |
| Reasoning | HLE | `30.5` |
| Reasoning + tools | HLE | `50.4` |
| Mathematics | AIME 2026 I | `92.7` |
| Science | GPQA-Diamond | `86.0` |
| Long context | LongBench v2 | `64.5` |
| Coding | SWE-bench Verified | `77.8` |
| Multilingual coding | SWE-bench Multilingual | `73.3` |
| Terminal agent | Terminal-Bench 2, Terminus | `56.2` (`60.7` on their verified subset) |
| Search agent | BrowseComp | `62.0` (`75.9` with context management) |
| Tool use | tau2 | `89.7` |
| Tool use | MCP Atlas | `67.8` |

The report's more diagnostic CCBenchV2 results are less uniformly dominant. GLM-5 scores `42.1 ± 1.21` resolved on SWE-rebench January 2026, `52.3` on chained tasks, and `25.8` pass@1 on its backend benchmark. It substantially improves over GLM-4.7 and is a strong open-weight model, but it does not beat every proprietary reference on every software-engineering task.

## 14. What the report does and does not establish

The strongest supported conclusions are:

- a very large sparse MoE can keep active parameters around `40B`
- DSA can be added through a short indexer warm-up plus a much smaller sparse-adaptation phase than full pretraining
- deterministic token selection matters during on-policy RL
- issue/PR/repository data and executable environments are core coding-model assets
- asynchronous rollout infrastructure is essential for heterogeneous agent tasks
- on-policy distillation can consolidate sequential specialist checkpoints

Important limitations:

- architecture, data, scale, post-training, harness, and inference policy change together, so benchmark gains cannot be assigned causally to one component
- many agent benchmarks use tailored prompts, custom harnesses, repaired subsets, or model judges
- internal data and several evaluation environments cannot be independently reproduced
- DSA's quality claim is empirical, while its indexer remains quadratic
- `744B total / 40B active` understates the deployment challenge: all expert weights must still be stored or distributed
- context-management scores are system results, not raw model results

## 15. GLM-5.2 follow-up: IndexShare

GLM-5.2 is a later long-context update that retains the main GLM-5 family backbone and extends the configured context from about `200K` to `1,048,576` tokens. Sebastian Raschka's architectural note gives a particularly clear explanation of its main change: **IndexShare**.

### Why the DSA indexer becomes the bottleneck

DSA makes the expensive main attention computation sparse, but each layer's lightweight indexer still compares every query with all preceding keys:

```text
main sparse attention: O(L x 2048)
indexer selection:     O(L^2), with a much smaller constant
```

At `200K` tokens the small constant helps greatly. At `1M` tokens, repeating even the lightweight quadratic indexer in every block becomes significant. Adjacent sparse-attention layers also tend to choose highly overlapping key positions.

### The four-layer sharing pattern

IndexShare computes selected positions once and reuses them across a four-layer group:

```text
layer n:     full indexer -> compute top-k indices
layer n + 1: shared       -> reuse the same indices
layer n + 2: shared       -> reuse the same indices
layer n + 3: shared       -> reuse the same indices
```

Here **full** means “run a full indexer,” not “run dense attention.” Every layer still performs its own:

- query computation
- attention weights over selected positions
- value aggregation
- output projection
- residual update
- MoE computation

Only the integer list of selected token positions is reused. GLM-5.2 was continued-trained with this pattern from the `128K` mid-training stage, allowing the retained indexers to adapt to the neighboring blocks that consume their selections. It is therefore not equivalent to turning on an inference cache for an unmodified GLM-5 checkpoint.

The release reports a `2.9x` reduction in per-token FLOPs at `1M` context. This is **not** a `2.9x` end-to-end throughput claim. IndexShare does not reduce KV-cache memory proportionally, and ultra-long serving remains constrained by cache capacity and transfer, attention kernels, scheduling, and CPU overhead.

### MTP IndexShare and KVShare

GLM-5.2 also reuses the first MTP draft step's indices and target-model KV state across later draft steps. This removes a train/inference mismatch in which later MTP steps otherwise mix KV entries produced by the target model with entries produced by the draft module.

The reported coding ablation, with seven MTP steps, is cumulative:

| MTP setup | Average accepted length |
| :--- | ---: |
| Baseline | `4.56` |
| + IndexShare + KVShare | `5.10` |
| + rejection sampling | `5.29` |
| + end-to-end total-variation loss | `5.47` |

The final improvement is about `20%`, but the table does not isolate IndexShare's contribution from KVShare or the later additions.

### General lesson

Sparse attention has two separate costs:

1. deciding **which** tokens to retrieve
2. computing attention **over** those tokens

DSA primarily reduces the second. IndexShare exploits cross-layer similarity to amortize the first. This is a broadly reusable pattern: if neighboring layers make similar discrete routing decisions, train the model to share those decisions rather than independently rediscovering them.

## Related notes

- [GLM-5.3-Flash: Hybrid Attention at Flash Cost](/atlas/ai/architectures/model-reports/glm-5-3-flash-hybrid-multimodal)
- [Attention Variants](../transformers/attention-variants.md)
- [No Positional Embeddings (NoPE)](../transformers/no-positional-embeddings-nope.md)
- [Mixture-of-Experts Routing and Load Balancing](../../training/optimization/moe-routing-and-load-balancing.md)
- [Muon Optimizer](../../training/optimization/muon-optimizer.md)
- [On-Policy Distillation](../../training/optimization/on-policy-distillation.md)
- [Long-Horizon Agentic RL Infrastructure](../../training/optimization/long-horizon-agentic-rl-infrastructure.md)
- [Agentic Training Data and Environment Synthesis](../../training/data/agentic-training-data-and-environment-synthesis.md)

## Sources

- [GLM-5 technical report](https://arxiv.org/abs/2602.15763)
- [Official GLM-5 checkpoint and model card](https://huggingface.co/zai-org/GLM-5)
- [Official GLM-5 checkpoint configuration](https://huggingface.co/zai-org/GLM-5/blob/main/config.json)
- [Transformers GLM-MoE-DSA implementation](https://github.com/huggingface/transformers/blob/main/src/transformers/models/glm_moe_dsa/modeling_glm_moe_dsa.py)
- [Official GLM-5 repository](https://github.com/zai-org/GLM-5)
- [GLM-5.2 release: Built for Long-Horizon Tasks](https://huggingface.co/blog/zai-org/glm-52-blog)
- [Sebastian Raschka: GLM-5.2 and IndexShare for Long-Context Sparse Attention](https://sebastianraschka.com/blog/2026/glm-5-2-indexshare.html)
- [IndexCache: Accelerating Sparse Attention via Cross-Layer Index Reuse](https://arxiv.org/abs/2603.12201)
