---
title: "Kimi K3: Open Frontier Intelligence"
date: 2026-07-27
lastmod: 2026-07-27
tags:
  - ai/llm
  - models
  - mixture-of-experts
  - multimodal
  - agents
draft: false
---

## Summary

Kimi K3 is an open-weight, native multimodal Mixture-of-Experts model with `2.78T` total parameters, `104.2B` activated parameters, and a `1M`-token context window. Its significance is not one isolated invention but the way several architectural, optimization, data, reinforcement-learning, and serving techniques are co-designed for frontier-scale agentic workloads.

The architecture combines:

- recurrent linear attention for cheap long-range state
- periodic global attention for precise retrieval
- learned attention over residual blocks
- an extremely sparse but stabilized MoE
- a vision encoder trained jointly from scratch

Post-training uses specialized reinforcement-learning teachers for different domains and reasoning budgets, then consolidates them into one model with multi-teacher on-policy distillation. The accompanying systems work targets the actual bottlenecks of long agent trajectories: stragglers, environment suspension, KV-cache pressure, expert imbalance, and speculative-decoding rollback.

The report is unusually valuable because it describes an entire model-building stack. Its main limitation is the same: most gains are attributed to the combined system, so the contribution of each technique is difficult to isolate.

## Concepts

- **Hybrid attention:** alternating linear and global attention layers to combine fixed-state efficiency with exact token retrieval.
- **Attention Residuals:** learned attention over earlier layer or block outputs instead of uniform residual accumulation.
- **LatentMoE:** routing and expert computation in a narrower latent space, followed by projection to the model width.
- **Quantile Balancing:** loss-free expert balancing that computes router biases directly from score-margin quantiles.
- **Multi-teacher on-policy distillation:** the student samples trajectories and receives token-level feedback from a teacher selected for the current domain and reasoning effort.
- **Autonomous Execution Task:** an environment-defined task with tools, constraints, budgets, and an independent verifier, but no reference trajectory.

## 1. Model at a glance

| Property | Kimi K3 |
| :--- | ---: |
| Total parameters | `2.78T` |
| Activated parameters | `104.2B` |
| Layers | `93` |
| Hidden dimension | `7,168` |
| Attention heads | `96` |
| Routed experts | `896` |
| Active routed experts per token | `16` |
| Shared experts | `2` |
| Vocabulary | `160K` |
| Maximum context | `1M` tokens |
| Vision encoder | MoonViT-V2, about `401M` parameters |

The expert sparsity is:

$$
\frac{896}{16}=56
$$

so only about one routed expert in `56` is active for a token. This lets the model store enormous parameter capacity while keeping active compute closer to a roughly `100B`-parameter model.

The authors report approximately `2.5\times` scaling efficiency over Kimi K2. This should be read as a result for the complete recipe, not as an ablation-backed gain from one component.

## 2. Hybrid KDA and global attention

Kimi K3 repeats a four-layer pattern:

1. three Kimi Delta Attention layers
2. one Gated Multi-head Latent Attention layer

Across the model this gives `69` KDA layers and `24` global-attention layers, with a final global layer at the top.

### Kimi Delta Attention

KDA is a delta-rule recurrent attention mechanism. Rather than retaining every previous key and value, it updates a fixed-size state:

$$
S_t
=
\alpha_t \odot S_{t-1}
+
\beta_t k_t
\left(
v_t-S_{t-1}^{\top}k_t
\right)^{\top}
$$

The correction term writes the difference between the new value and what the current memory already predicts for the key. This makes the state more selective than a simple additive memory.

K3 introduces a lower-bounded log decay:

$$
g_t
=
g_{\min}
\operatorname{Sigmoid}
\left(
e^A z_t
\right),
\qquad
g_{\min}=-5
$$

$$
\alpha_t=e^{g_t}
$$

Therefore:

$$
\alpha_t > e^{-5}
$$

The bound is a numerical and kernel-design constraint, not merely a modeling choice. It keeps reciprocal rescaling representable in BF16 and lets more of the algorithm use dense Tensor Core matrix multiplications.

### Why retain global attention

A recurrent state is efficient but compresses the past. Exact softmax attention remains better at sharply selecting individual tokens. Periodic Gated MLA layers restore global token-to-token retrieval while caching a low-dimensional latent representation.

The model therefore separates two jobs:

$$
\text{KDA}
\rightarrow
\text{cheap long-range accumulation}
$$

$$
\text{Gated MLA}
\rightarrow
\text{precise global retrieval}
$$

Both mechanisms use full-rank output gates, allowing the model to regulate how much retrieved information enters the residual stream.

K3 uses no positional embeddings. KDA supplies recency information through its decay dynamics, while the global NoPE layers need no RoPE interpolation when the context is extended.

## 3. Attention Residuals

A standard residual stack gives layer $\ell$ one accumulated state:

$$
x_\ell
=
x_0
+
\sum_{i<\ell}F_i(x_i)
$$

All earlier contributions have already been merged with equal additive weight. The next layer cannot directly choose which depth representation it wants.

Attention Residuals instead let a layer learn a pseudo-query and attend over previous representations:

$$
r_\ell
=
\sum_{i<\ell}
\operatorname{softmax}_i
\left(
q_\ell^\top k_i
\right)
v_i
$$

Full layer-wise attention would add substantial activation memory and communication. K3 groups layers into blocks and sums within each block before attention. It uses eight blocks of twelve layers, plus the embedding as another source.

This reduces residual-source storage from:

$$
O(Ld)
$$

to:

$$
O(Nd)
$$

where $N$ is the number of blocks.

The useful interpretation is that the architecture gives the model selective depth access. Later layers can retrieve a lower-level or intermediate representation rather than relying only on the uniformly accumulated stream.

## 4. Stable LatentMoE

K3 performs routed expert computation in a latent space of width `3,584`, half the main hidden dimension:

$$
x
\xrightarrow{\text{down projection}}
z
\xrightarrow{\text{sparse experts}}
\tilde z
\xrightarrow{\text{RMSNorm}}
\xrightarrow{\text{up projection}}
y
$$

The narrower expert space reduces the cost of storing and activating `896` routed experts. Two shared experts remain at full width.

Extreme sparsity and the nearly four-matrix routed path make activation growth dangerous. Stable LatentMoE combines three controls:

1. RMSNorm before the routed up-projection
2. bounded SiTU-GLU activations
3. Quantile Balancing for expert load

SiTU-GLU soft-caps both branches:

$$
\left[
\beta_1
\tanh
\left(
\frac{W_gx}{\beta_1}
\right)
\odot
\sigma(W_gx)
\right]
\odot
\left[
\beta_2
\tanh
\left(
\frac{W_ux}{\beta_2}
\right)
\right]
$$

with $\beta_1=4$ and $\beta_2=25$. It behaves similarly to SwiGLU around zero while bounding extreme outputs.

## 5. Native multimodal pretraining

MoonViT-V2 is trained jointly with the language model from the beginning using next-token prediction. It is not initialized from a contrastive SigLIP checkpoint and later aligned to an already-trained LLM.

The encoder:

- has `27` layers and about `401M` parameters
- uses `14 \times 14` patches
- shares parameters across images and video
- factorizes spatial and temporal attention
- applies `2 \times 2` pixel shuffle to reduce visual tokens by four
- accepts images up to `3,584 \times 3,584`

The authors report that from-scratch joint training matches their SigLIP-initialized baseline while showing lower gradient norms and fewer spikes. The practical claim is that contrastive initialization may be unnecessary when native multimodal training is sufficiently large and well balanced.

The visual data mixture is broad: captions, interleaved documents, OCR, perception, video, visual coding, and code-rendered material such as SVG, web pages, games, 3D scenes, and CAD. This matters because a native vision model intended for agents must understand interfaces, documents, plots, and rendered artifacts, not only natural images.

## 6. Pretraining recipe

K3 pretrains on web text, code, mathematics, knowledge data, and vision. Rewritten knowledge and math examples vary style and perspective while being checked for fidelity.

Two methodological details are particularly reusable.

### Tune schedules independently

The team separately retunes learning rate and related hyperparameters for cosine decay and Warmup-Stable-Decay. Cosine performs better in their comparison.

This is a useful experimental lesson:

> Comparing training schedules with one shared hyperparameter setting can measure tuning bias instead of schedule quality.

### Extend context progressively

The main pretraining context grows from `8K` to `64K`; cooldown then extends it from `256K` to `1M`.

Long examples are not only long documents. The team also concatenates and permutes multimodal documents and subtasks so that solving the example requires information distributed across the full context. This trains dependency length rather than merely presenting padded or weakly connected tokens.

## 7. Specialized RL and multi-teacher consolidation

Post-training has three stages:

1. supervised fine-tuning
2. specialized reinforcement-learning teachers
3. Multi-teacher On-Policy Distillation

The specialized teachers cover:

- general reasoning and vision
- search and knowledge work
- long-horizon general agents
- coding agents

Each family is also trained for different reasoning efforts. The resulting nine teachers are consolidated into one student.

For a sampled domain $d$ and effort $e$, the student generates the trajectory and the matching teacher scores the same tokens. K3 uses a clipped, stop-gradient log-probability ratio as dense token reward:

$$
r_t
=
\operatorname{clip}
\left(
\operatorname{stopgrad}
\left[
\log\pi_T(a_t\mid s_t)
-
\log\pi_\theta(a_t\mid s_t)
\right]
\right)
$$

Task reward and dense teacher feedback are optimized together. The important systems property is modularity: specialists can improve independently, then be merged without generating a large fixed teacher-trajectory dataset.

### Reasoning effort as a training constraint

K3 trains `low`, `high`, and `max` effort policies. For each problem, a cold-start policy supplies an initial token budget $b_0(x)$. If a rollout exceeds a multiple of that budget, the task reward is replaced by `-1`:

$$
T(y)>\tau b_0(x)
\quad\Rightarrow\quad
R(y)=-1
$$

The multiplier $\tau$ is large for `max` and annealed downward for lower-effort teachers. For agents, the budget includes cumulative model output and tool arguments, not only hidden reasoning.

This turns reasoning effort into an explicit optimization constraint rather than only a prompt-time instruction.

## 8. Long-horizon agent training

K3 represents the agent harness as configurable modules:

- tools
- system prompts
- context management
- skills and memories
- subagents

The same environment layer can instantiate different scaffolds, reducing overfitting to one interface.

Task synthesis uses a self-expanding hierarchical knowledge graph. Agents retrieve public material, add progressively finer concepts, reuse related existing nodes, and synthesize tasks from combinations of graph nodes.

Autonomous Execution Tasks specify:

$$
(
\text{initial state},
\text{goal},
\text{tools},
\text{budgets},
\text{verifier}
)
$$

but provide no reference trajectory. Agents must decompose, execute, recover, and decide when to stop. Public diagnostic checks are separated from hidden final verification to reduce reward hacking.

### Partial rollouts

Very long trajectories create stragglers. K3 samples multiple trajectories, stops a rollout phase after a fraction complete, pauses the unfinished trajectories, and resumes them in later iterations.

This keeps GPUs busy but makes resumed tokens partly off-policy because the model may have changed. The method therefore depends on updates being local enough that importance-style corrections remain stable.

## 9. Systems co-design

Several infrastructure choices are inseparable from the model design:

- **FlashKDA:** optimized recurrent-attention kernels and associative context parallelism.
- **MoonEP:** dynamic redundant experts and online routing plans for balanced expert-parallel communication.
- **Activation manager:** pluggable recomputation, FP8 quantization, and remote offload.
- **AgentENV:** checkpointable Firecracker microVMs that can pause, resume, fork for judging, and recover from snapshots.
- **External KV pool:** evicted idle prefixes are written to CPU memory while active state stays on GPU.

The report states that AgentENV served more than `51M` sandboxes and `1.5M` images. Pause and resume are especially important because an agent may spend most of its lifetime waiting for model inference; retaining a full live environment during that idle time wastes resources.

For inference, K3 jointly manages:

- fixed-size KDA recurrent states
- sequence-growing MLA KV cache

During speculative decoding it does not snapshot every recurrent state. It caches projected draft inputs and replays only the accepted prefix, avoiding expensive state-copy rollback.

## 10. Deployment

Routed expert weights use MXFP4 and expert activations use MXFP8, while more sensitive non-expert components stay at higher precision. Quantization-aware training continues through SFT and RL so rollout inference and training observe the same quantization scheme.

The multi-token-prediction layer is adapted into a one-layer EAGLE-3 draft model. Its loss directly optimizes overlap between draft and target distributions:

$$
\mathcal{L}_{LK}
=
-
\log
\sum_x
\min
\left(
p(x),q(x)
\right)
$$

The overlap is the quantity that determines speculative-decoding acceptance, so this objective is more deployment-aligned than minimizing KL divergence alone.

## 11. Results and interpretation

The report shows strong results in reasoning, coding, search, knowledge work, vision, and agent tasks. Examples include:

| Benchmark | Score |
| :--- | ---: |
| GPQA Diamond | `93.5` |
| BrowseComp | `91.2` |
| DeepSearchQA | `95.0` |
| TerminalBench 2.1 | `88.3` |
| FrontierSWE | `81.2` |
| MathVision | `94.3`, `97.8` with tools |
| WebDev Arena | `1,678 Elo`, reported rank `1/99` |

The authors position K3 near the proprietary frontier while remaining open weight and relatively cost-efficient.

These numbers require cautious reading:

- harnesses and tool budgets differ across models
- all K3 evaluations use maximum reasoning effort
- some results use model judges or internal harnesses
- some tables select the best result across multiple harnesses
- the report changes architecture, data, optimizer, RL, and systems together

The benchmark suite supports the claim that the complete system is competitive. It does not cleanly tell us which individual innovation caused each gain.

## 12. Main takeaways

1. Hybrid architectures are becoming systems designs, not only layer designs. Recurrent attention, exact attention, MoE routing, kernels, cache layout, and decoding must fit together.
2. Extreme sparsity needs explicit numerical and routing controls. Latent width alone does not make a trillion-parameter MoE stable.
3. Native multimodal training can be simpler than staged alignment when vision data and compute are available from the start.
4. Specialized RL followed by on-policy consolidation is a plausible alternative to training one policy on every objective simultaneously.
5. Long-horizon agent training is constrained as much by environments, suspension, verification, and scheduling as by the RL algorithm.
6. Deployment objectives should optimize deployment quantities directly, such as speculative acceptance and quantized rollout behavior.

## Related

- [Linear Attention](/atlas/ai/architectures/transformers/linear-attention)
- [Attention Residuals](/atlas/ai/architectures/transformers/attention-residuals)
- [MoE Routing and Load Balancing](/atlas/ai/training/optimization/moe-routing-and-load-balancing)
- [MoE Training Stability](/atlas/ai/training/optimization/moe-training-stability)
- [Muon Optimizer](/atlas/ai/training/optimization/muon-optimizer)
- [On-Policy Distillation](/atlas/ai/training/optimization/on-policy-distillation)
- [Agentic Training Data and Environment Synthesis](/atlas/ai/training/data/agentic-training-data-and-environment-synthesis)
- [Long-Horizon Agentic RL Infrastructure](/atlas/ai/training/optimization/long-horizon-agentic-rl-infrastructure)
- [Progressive Context Extension](/atlas/ai/training/scaling/progressive-context-extension)
- [Reasoning Effort Control](/atlas/ai/inference-serving/performance/reasoning-effort-control)
- [Quantization-Aware Training](/atlas/ai/training/precision/quantization-aware-training)
- [Speculative Decoding](/atlas/ai/inference-serving/decoding/speculative-decoding)
- [Chat Templates for LLMs](/atlas/ai/inference-serving/chat-templates-for-llms)
- [No Positional Embeddings (NoPE)](/atlas/ai/architectures/transformers/no-positional-embeddings-nope)

## Sources

- Kimi Team, [Kimi K3: Open Frontier Intelligence — Technical Report](https://github.com/MoonshotAI/Kimi-K3/blob/main/k3_tech_report.pdf)
- Kimi Team, [Kimi K3 Tech Blog](https://www.kimi.com/blog/kimi-k3)
- Moonshot AI, [Kimi K3 model weights](https://huggingface.co/moonshotai/Kimi-K3)
