# Atlas v2 — 54 dense topic outlines

Authoritative revised catalog, 2026-10-03. Supersedes the old 149-page catalog. Every item below is **one substantial public note**; its mechanisms and advanced material are sections, not automatically separate pages. This is a proposal, not converted content.

See [the dense blueprint](dense-notes-blueprint.md) and [source map](dense-source-map.md). There is no fixed short-page word target, no course requirement, and no public problem-solution archive.

## Models

### Transformer Architecture

Identity: `models/transformers`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- Residual streams.
- activations.
- normalization.
- initialization.
- Attention Residuals.
- output heads.
- embedding tying.
- softmax bottleneck.
- reversible activation storage..

Visual treatment: Block anatomy and depth mixing; output-rank worked example.

Connected topics: Attention

Sources absorbed:

- `docs/ai/architectures/general/reversible-networks.md`
- `docs/ai/architectures/transformers/attention-residuals.md`
- `docs/ai/architectures/transformers/embedding-tying-in-small-llms.md`
- `docs/ai/architectures/transformers/lets-build-gpt-from-scratch.md`
- `docs/ai/architectures/transformers/residual-normalization-and-initialization.md`
- `docs/ai/foundations/activation-functions.md`
- `docs/ai/foundations/batch-normalization.md`
- `docs/ai/foundations/layer-normalization.md`
- `docs/ai/foundations/root-mean-square-layer-normalization.md`
- `docs/ai/foundations/softmax-bottleneck.md`
- `docs/ai/foundations/stop-gradients.md`
- `docs/ai/training/scaling/transformer-scaling-rules.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Attention

Identity: `models/attention`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- Q/K/V and shapes.
- masks.
- sqrt(d) derivation and alternative scaling arguments.
- MHA/MQA/GQA/MLA.
- local/global/cross attention.
- linear/delta-rule attention.
- FlashAttention online softmax and memory traffic..

Visual treatment: Score-to-weight matrix; head/cache layouts; recurrent state; tiled HBM/SRAM path.

Connected topics: Positional Encodings; Transformer Architecture; Compute, Memory, and Performance; Profiling and Kernel Optimization

Sources absorbed:

- `docs/ai/architectures/model-reports/deepseek-v4-1-flash.md`
- `docs/ai/architectures/model-reports/glm-5-3-flash-hybrid-multimodal.md`
- `docs/ai/architectures/model-reports/glm-5-agentic-engineering.md`
- `docs/ai/architectures/model-reports/kimi-k3-open-frontier-intelligence.md`
- `docs/ai/architectures/model-reports/mai-thinking-1-building-a-hill-climbing-machine.md`
- `docs/ai/architectures/transformers/attention-softmax-and-scaling.md`
- `docs/ai/architectures/transformers/attention-variants.md`
- `docs/ai/architectures/transformers/flashattention.md`
- `docs/ai/architectures/transformers/linear-attention.md`
- `docs/ai/foundations/attention-mechanism.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Positional Encodings

Identity: `models/position`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- Sinusoidal clocks.
- RoPE.
- interpolation/extrapolation and extension methods.
- pure/hybrid NoPE.
- group representations and generators.
- stability/causality caveats..

Visual treatment: Rotation/frequency explorer plus relative-position and generator-block diagrams.

Connected topics: Attention

Sources absorbed:

- `docs/ai/architectures/transformers/group-theoretic-positional-encodings.md`
- `docs/ai/architectures/transformers/no-positional-embeddings-nope.md`
- `docs/ai/architectures/transformers/positional-encoding-sinusoidal-to-rope.md`
- `docs/ai/architectures/transformers/rope-scaling.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Mixture of Experts

Identity: `models/moe`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- Dense versus sparse computation.
- active/total parameters.
- routing/weights.
- expert-first execution.
- auxiliary losses.
- loss-free and quantile balancing.
- shared/fine-grained experts.
- capacity/drop policy.
- modality/network balance.
- precision.
- collapse.
- optimizer mismatch.
- monitoring.
- expert-parallel implications..

Visual treatment: Routing and occupancy explorer; auxiliary-gradient versus bias-controller comparison; expert dispatch/combine diagram.

Connected topics: Distributed Training and Parallelism; Optimization; Training Stability and Generalization; Speculative Decoding; Recurrent and Looped Models

Sources absorbed:

- `docs/ai/architectures/model-reports/glm-5-3-flash-hybrid-multimodal.md`
- `docs/ai/architectures/model-reports/glm-5-agentic-engineering.md`
- `docs/ai/architectures/model-reports/kimi-k3-open-frontier-intelligence.md`
- `docs/ai/architectures/model-reports/mai-thinking-1-building-a-hill-climbing-machine.md`
- `docs/ai/architectures/model-reports/mimo-v2-6-scaling-rl-towards-self-improvement.md`
- `docs/ai/architectures/model-reports/third-generation-apple-foundation-models.md`
- `docs/ai/training/optimization/moe-routing-and-load-balancing.md`
- `docs/ai/training/optimization/moe-training-stability.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Recurrent and Looped Models

Identity: `models/recurrence`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- RNN/LSTM state and gates.
- tied versus untied depth.
- Ouro.
- sparse looping.
- early exit.
- DeepLoop/alignment.
- Recirculation.
- latent feedback STANDARD/SOFT/FUSED.
- cache timing.
- training and evidence..

Visual treatment: Unrolled weight reuse, cache timeline, selectable recurrence mechanisms and stability scaling.

Connected topics: Mixture of Experts; Speculative Decoding

Sources absorbed:

- `docs/ai/architectures/model-reports/nanbeige4-2-3b-unlocking-agentic-capabilities.md`
- `docs/ai/architectures/sequence-models/long-short-term-memory-network.md`
- `docs/ai/architectures/transformers/deeploop-residual-scaling-for-looped-transformers.md`
- `docs/ai/architectures/transformers/full-bandwidth-transformer-latent-feedback.md`
- `docs/ai/architectures/transformers/looped-language-models-ouro.md`
- `docs/ai/architectures/transformers/moe-looped-language-models.md`
- `docs/ai/architectures/transformers/recirculation-inference-time-recurrence.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Tokenization and Input Representations

Identity: `models/tokenization`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- BPE.
- stochastic BytePiece.
- bytes and BLT patches.
- concept/sentence representations.
- segmentation trade-offs and disclosed evidence..

Visual treatment: Merge/segmentation steps and token/byte/patch/concept pipelines.

Connected topics: Add a few relevant section links during full-body review.

Sources absorbed:

- `docs/ai/architectures/model-families/large-concept-models.md`
- `docs/ai/architectures/transformers/byte-latent-transformer.md`
- `docs/ai/modalities/nlp/byte-pair-encoding.md`
- `docs/ai/modalities/nlp/bytepiece-and-stochastic-tokenization.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Small and On-Device Model Recipes

Identity: `models/compact-recipes`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- Small-model trade-offs.
- embedding tax.
- Nanbeige 4/4.2, Gemma and Apple profiles.
- architecture, data, schedule, agentic post-training and deployment detail.
- distinguish different releases..

Visual treatment: Parameter budget, fixed-loop cache and on-device/server recipe comparisons.

Connected topics: Add a few relevant section links during full-body review.

Sources absorbed:

- `docs/ai/architectures/model-families/frontier-small-language-models.md`
- `docs/ai/architectures/model-reports/gemma-4-technical-report.md`
- `docs/ai/architectures/model-reports/nanbeige4-2-3b-unlocking-agentic-capabilities.md`
- `docs/ai/architectures/model-reports/nanbeige4-3b-technical-report.md`
- `docs/ai/architectures/model-reports/third-generation-apple-foundation-models.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Structured Decision and Safety Models

Identity: `models/decision-models`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- Typed Jev/Tev decisions, disclosed versus hypothesized architecture, calibration.
- Shieldstral conditional safety formulation, data/templates/hard negatives, multimodal policy, specialization/merging and limitations..

Visual treatment: Typed decision paths, probability versus confidence, and conditional-policy examples.

Connected topics: Add a few relevant section links during full-body review.

Sources absorbed:

- `docs/ai/architectures/jev-tev-typed-decision-models.md`
- `docs/ai/architectures/model-reports/shieldstral.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Self-Supervised Vision Learning

Identity: `models/vision`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- DINOv2/iBOT/iBOT++/TIPSv2/LeJEPA distinctions.
- global/patch/masked targets.
- teachers/stop-grad/centering/sharpening.
- agreement and collapse.
- SIGReg sketches, characteristic functions, quadrature/Epps–Pulley.
- backbone-use and evidence..

Visual treatment: Teacher/student/patch paths; collapse/regularization embedding views and projected distributions.

Connected topics: Losses and Objectives; Probability and Distributions

Sources absorbed:

- `docs/ai/architectures/model-reports/deepseek-v4-1-flash.md`
- `docs/ai/architectures/model-reports/gemma-4-technical-report.md`
- `docs/ai/architectures/model-reports/glm-5-3-flash-hybrid-multimodal.md`
- `docs/ai/architectures/model-reports/kimi-k3-open-frontier-intelligence.md`
- `docs/ai/architectures/model-reports/nanbeige4-3b-technical-report.md`
- `docs/ai/architectures/model-reports/shieldstral.md`
- `docs/ai/architectures/model-reports/third-generation-apple-foundation-models.md`
- `docs/ai/modalities/computer-vision/models/dinov2.md`
- `docs/ai/training/losses/regularization/sketched-isotropic-gaussian-regularization.md`
- `docs/ai/training/losses/self-supervised/ibot.md`
- `docs/ai/training/losses/self-supervised/lejepa.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Detection and Spatial Predictions

Identity: `models/vision-detection`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- Boxes, IoU, NMS/soft and other variants.
- runtime complexity.
- precision/recall implications. Keep as one detection reference rather than isolated operator fragments..

Visual treatment: Step-through overlapping boxes and suppression.

Connected topics: Add a few relevant section links during full-body review.

Sources absorbed:

- `docs/ai/modalities/computer-vision/non-maximum-suppression.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Diffusion and Score-Based Generation

Identity: `models/diffusion`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- DDPM forward/reverse derivations.
- score/SDE/ODE unity.
- objective parameterization.
- stochastic/deterministic sampling.
- consistency/shortcut/progressive/score-identity distillation.
- few-step trade-offs..

Visual treatment: Forward/reverse and solver trajectories with distinct acceleration objectives.

Connected topics: Distillation

Sources absorbed:

- `docs/ai/modalities/diffusion-models/consistency-and-one-step-diffusion.md`
- `docs/ai/modalities/diffusion-models/ddpm.md`
- `docs/ai/modalities/diffusion-models/diffusion-distillation.md`
- `docs/ai/modalities/diffusion-models/unified-diffusion-and-score-models.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Learning, Abduction, and Scientific Discovery

Identity: `models/scientific-discovery`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- Preserve the historical case, interactive-world-model hypothesis, induction/abduction distinction, testable research proposal and limitations.
- do not turn a thesis into an impossibility theorem..

Visual treatment: Hypothesis/test/discovery loop with evidence-versus-hypothesis labels.

Connected topics: Add a few relevant section links during full-body review.

Sources absorbed:

- `docs/ai/foundations/llms-cant-jump-abduction-and-scientific-invention.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

## Training

### Losses and Objectives

Identity: `training/objectives`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- MSE/L1 distinctions.
- CE/BCE.
- logits and gradients.
- entropy/KL relation.
- soft targets.
- proper scoring and Brier.
- Fenchel–Young maps/sparsity.
- SVM margins.
- regularization versus prediction loss.
- links to SSL/RL-specific objectives..

Visual treatment: Outlier-sensitive regression; entropy+KL cost bars; confidence/gradient comparison; margin diagram.

Connected topics: Information Theory and Compression; Self-Supervised Vision Learning; Reinforcement Learning; Vectors and Geometry

Sources absorbed:

- `docs/ai/modalities/classical-ml/support-vector-machines-and-the-margin.md`
- `docs/ai/training/losses/binary-cross-entropy-loss.md`
- `docs/ai/training/losses/cross-entropy-loss.md`
- `docs/ai/training/losses/l2-norm-and-loss.md`
- `docs/ai/training/losses/proper-scoring-rules-and-fenchel-young-losses.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Optimization

Identity: `training/optimization`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- AdamW EMA/bias correction/decay.
- Muon matrix updates/Newton–Schulz/scaling.
- batch/LR/noise.
- warmup/WSD.
- hyperparameter transfer/MuP.
- clipping.
- parameter-group choices and limitations..

Visual treatment: EMA memory; matrix singular values; batch-noise and schedule explorer.

Connected topics: Mixture of Experts; Differentiation and Optimization Geometry

Sources absorbed:

- `docs/ai/architectures/model-reports/deepseek-v4-1-flash.md`
- `docs/ai/architectures/model-reports/glm-5-agentic-engineering.md`
- `docs/ai/architectures/model-reports/mai-thinking-1-building-a-hill-climbing-machine.md`
- `docs/ai/architectures/model-reports/mimo-v2-6-scaling-rl-towards-self-improvement.md`
- `docs/ai/training/optimization/adamw.md`
- `docs/ai/training/optimization/batch-size-and-learning-rate.md`
- `docs/ai/training/optimization/learning-rate-warmup.md`
- `docs/ai/training/optimization/muon-optimizer.md`
- `docs/ai/training/optimization/warmup-stable-decay-learning-rate-schedule.md`
- `docs/ai/training/scaling/hyperparameter-scaling-laws-for-llm-training.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Scaling Laws

Identity: `training/scaling`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- Kaplan/Chinchilla.
- compute allocation.
- data repetition.
- overtraining/deployment objective.
- decomposition and K meaning.
- model-data coupling/Skaling.
- fitting grids and uncertainty..

Visual treatment: Model/token budget plane; additive versus coupled surfaces; gap decomposition.

Connected topics: Pretraining: Experiments and Run Design

Sources absorbed:

- `docs/ai/architectures/model-reports/mai-thinking-1-building-a-hill-climbing-machine.md`
- `docs/ai/architectures/model-reports/mimo-v2-6-scaling-rl-towards-self-improvement.md`
- `docs/ai/architectures/model-reports/nanbeige4-3b-technical-report.md`
- `docs/ai/architectures/model-reports/the-llama-3-herd-of-models.md`
- `docs/ai/training/scaling/data-constrained-scaling-laws.md`
- `docs/ai/training/scaling/decomposing-scaling-laws.md`
- `docs/ai/training/scaling/overtraining-and-inference-aware-scaling.md`
- `docs/ai/training/scaling/scaling-laws.md`
- `docs/ai/training/scaling/skaling-coupled-model-data-scaling-laws.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Training Data

Identity: `training/data`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- Mixture objectives/Pareto fronts.
- token versus example weight.
- search/surrogates/annealing.
- dedup types.
- repetition caps.
- memorization/contamination.
- pipeline and report-specific evidence..

Visual treatment: Mixture allocations and novelty/dedup pipeline with explicit assumptions.

Connected topics: Pretraining: Experiments and Run Design

Sources absorbed:

- `docs/ai/architectures/model-reports/deepseek-v4-1-flash.md`
- `docs/ai/architectures/model-reports/glm-5-agentic-engineering.md`
- `docs/ai/architectures/model-reports/mai-thinking-1-building-a-hill-climbing-machine.md`
- `docs/ai/architectures/model-reports/mimo-v2-6-scaling-rl-towards-self-improvement.md`
- `docs/ai/architectures/model-reports/nanbeige4-2-3b-unlocking-agentic-capabilities.md`
- `docs/ai/architectures/model-reports/nanbeige4-3b-technical-report.md`
- `docs/ai/architectures/model-reports/qwen2-5-technical-report.md`
- `docs/ai/architectures/model-reports/shieldstral.md`
- `docs/ai/architectures/model-reports/the-llama-3-herd-of-models.md`
- `docs/ai/training/data/data-mixture-optimization.md`
- `docs/ai/training/data/deduplication-and-memorization-control.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Training Stability and Generalization

Identity: `training/stability`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- Loss-pattern taxonomy.
- gradient norms/clipping.
- resume effects.
- distribution-specific losses.
- checkpoint selection.
- measured generalization fluctuation and transfer findings..

Visual treatment: Annotated loss/gradient timelines and preserved original checkpoint-study figures.

Connected topics: Mixture of Experts; Pretraining: Experiments and Run Design

Sources absorbed:

- `docs/ai/training/optimization/generalization-dynamics-and-checkpoint-selection.mdx`
- `docs/ai/training/optimization/gradient-clipping.md`
- `docs/ai/training/optimization/gradient-norm-and-training-dynamics.md`
- `docs/ai/training/optimization/training-loss-patterns.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Distributed Training and Parallelism

Identity: `training/parallelism`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- DP/TP/PP/SP/CP/EP.
- ZeRO/state sharding.
- named device meshes.
- four matmul layouts.
- row/column projections.
- collectives.
- pipeline schedules/bubbles.
- sequence/context/zig-zag.
- topology.
- overlap and communication rooflines.
- hybrid recipes..

Visual treatment: Unified partitioning explorer; sharded matmul; pipeline timeline; sequence ring; MoE dispatch.

Connected topics: Mixture of Experts; GPU Communication; Compute, Memory, and Performance; GPU Infrastructure

Sources absorbed:

- `docs/ai/architectures/model-reports/deepseek-v4-1-flash.md`
- `docs/ai/architectures/model-reports/gemma-4-technical-report.md`
- `docs/ai/architectures/model-reports/glm-5-agentic-engineering.md`
- `docs/ai/architectures/model-reports/kimi-k3-open-frontier-intelligence.md`
- `docs/ai/architectures/model-reports/mai-thinking-1-building-a-hill-climbing-machine.md`
- `docs/ai/architectures/model-reports/mimo-v2-6-scaling-rl-towards-self-improvement.md`
- `docs/ai/architectures/model-reports/the-llama-3-herd-of-models.md`
- `docs/ai/training/distributed-optimization/zero.md`
- `docs/systems/parallel-computing/context-parallelism.md`
- `docs/systems/parallel-computing/data-parallelism.md`
- `docs/systems/parallel-computing/hardware-topology-and-parallelism.md`
- `docs/systems/parallel-computing/llm-training-parallelism-rooflines.md`
- `docs/systems/parallel-computing/pipeline-parallelism.md`
- `docs/systems/parallel-computing/sequence-parallelism.md`
- `docs/systems/parallel-computing/sharded-matrix-multiplication-and-collectives.md`
- `docs/systems/parallel-computing/tensor-parallelism.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Pretraining: Experiments and Run Design

Identity: `training/practice`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- Training compass.
- cheap baselines.
- ablations/ladders/efficiency gain.
- scale transfer.
- recipe freezing.
- progressive context extension.
- end-to-end Smol playbook.
- worked pretraining design.
- framework choice.
- goodput/determinism/checkpoints/fault recovery..

Visual treatment: Decision/experiment timeline and a run-design worksheet; context/recovery stages.

Connected topics: Training Data; Scaling Laws; Precision and Quantization; Training Stability and Generalization

Sources absorbed:

- `docs/ai/architectures/model-reports/deepseek-v4-1-flash.md`
- `docs/ai/architectures/model-reports/mai-thinking-1-building-a-hill-climbing-machine.md`
- `docs/ai/evaluation-experimentation/llm-ablation-strategy.md`
- `docs/ai/training/optimization/rules-of-engagement-for-llm-training.md`
- `docs/ai/training/pretraining-system-design-interview-guide.md`
- `docs/ai/training/scaling/progressive-context-extension.md`
- `docs/ai/training/scaling/scaling-ladders-and-efficiency-gain.md`
- `docs/ai/training/smol-training-playbook.md`
- `docs/ai/training/smol-training-playbook-foundations.md`
- `docs/systems/infrastructure/choosing-an-llm-training-framework.md`
- `docs/systems/infrastructure/goodput-determinism-and-fault-tolerance.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Precision and Quantization

Identity: `training/numerics`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- FP8/MX formats.
- scale granularity.
- sensitive operations.
- current/delayed scales.
- QAT versus PTQ.
- fake quantization.
- biased attention rounding.
- communication/inference mismatch.
- source-conditioned recipes..

Visual treatment: Quantization bins and scale blocks; attention error path and bias/variance.

Connected topics: Pretraining: Experiments and Run Design

Sources absorbed:

- `docs/ai/architectures/model-reports/deepseek-v4-1-flash.md`
- `docs/ai/architectures/model-reports/gemma-4-technical-report.md`
- `docs/ai/architectures/model-reports/mai-thinking-1-building-a-hill-climbing-machine.md`
- `docs/ai/training/precision/fp8-training.md`
- `docs/ai/training/precision/low-precision-attention-rounding-bias.md`
- `docs/ai/training/precision/quantization-aware-training.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Frontier Model Training Recipes

Identity: `training/frontier-recipes`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- Cross-model design/training comparison with source-scoped profiles for MAI, MiMo, Kimi, DeepSeek, GLM, Llama and Qwen.
- architecture/data/optimizer/SFT/RL/reward/infrastructure/evidence/unknowns retained..

Visual treatment: Comparable recipe timelines and architecture panels; original evidence with conditions. Concept chapters link to canonical topic sections.

Connected topics: Add a few relevant section links during full-body review.

Sources absorbed:

- `docs/ai/architectures/model-reports/deepseek-v4-1-flash.md`
- `docs/ai/architectures/model-reports/glm-5-3-flash-hybrid-multimodal.md`
- `docs/ai/architectures/model-reports/glm-5-agentic-engineering.md`
- `docs/ai/architectures/model-reports/kimi-k3-open-frontier-intelligence.md`
- `docs/ai/architectures/model-reports/mai-thinking-1-building-a-hill-climbing-machine.md`
- `docs/ai/architectures/model-reports/mimo-v2-6-scaling-rl-towards-self-improvement.md`
- `docs/ai/architectures/model-reports/qwen2-5-technical-report.md`
- `docs/ai/architectures/model-reports/the-llama-3-herd-of-models.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

## Post-training

### Supervised Fine-Tuning and Adaptation

Identity: `post-training/sft`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- SFT data/baselines.
- assistant masks.
- template/parser contract.
- special tokens.
- LoRA versus FullFT rank/scaling/LR/batch/parameter choices.
- deployment checks..

Visual treatment: Dialog mask/template and low-rank update diagrams.

Connected topics: Add a few relevant section links during full-body review.

Sources absorbed:

- `docs/ai/inference-serving/chat-templates-for-llms.md`
- `docs/ai/training/optimization/lora-vs-full-finetuning.md`
- `docs/ai/training/optimization/special-token-initialization-in-post-training.md`
- `docs/ai/training/optimization/supervised-fine-tuning-for-llms.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Preference Optimization

Identity: `post-training/preferences`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- DPO objective/reference policy.
- beta/LR.
- alternatives.
- data size and overfit.
- offline/on-policy.
- boundaries versus RL..

Visual treatment: Preferred/rejected log-odds comparison and reference-policy role.

Connected topics: Reinforcement Learning

Sources absorbed:

- `docs/ai/training/optimization/preference-optimization-for-llms.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Reinforcement Learning

Identity: `post-training/rl`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- Bellman/state/action foundations.
- LLM policy gradients.
- rewards versus optimizer.
- PPO/RLOO/GRPO/DAPO/GSPO/CISPO/CTPO.
- critic/old/reference policy.
- token/sequence ratios.
- normalization/clipping.
- RLVR.
- verifier/process rewards.
- entropy/PTGS/coverage.
- sparse-reward argument.
- async rollout/learner staleness/runtime numerics.
- monitoring and compact Q&A..

Visual treatment: Small response group/advantages; ratio/clipping comparison; verifier pipeline; policy-version timeline; entropy/coverage examples.

Connected topics: Losses and Objectives; Agent Training and Environments; Distillation; Preference Optimization; Building and Controlling Reasoning Models

Sources absorbed:

- `docs/ai/architectures/model-reports/deepseek-v4-1-flash.md`
- `docs/ai/architectures/model-reports/glm-5-agentic-engineering.md`
- `docs/ai/architectures/model-reports/kimi-k3-open-frontier-intelligence.md`
- `docs/ai/architectures/model-reports/mai-thinking-1-building-a-hill-climbing-machine.md`
- `docs/ai/architectures/model-reports/mimo-v2-6-scaling-rl-towards-self-improvement.md`
- `docs/ai/architectures/model-reports/nanbeige4-2-3b-unlocking-agentic-capabilities.md`
- `docs/ai/architectures/model-reports/nanbeige4-3b-technical-report.md`
- `docs/ai/architectures/model-reports/qwen2-5-technical-report.md`
- `docs/ai/modalities/reinforcement-learning/the-bellman-equation.md`
- `docs/ai/training/optimization/adaptive-entropy-control-in-rl.md`
- `docs/ai/training/optimization/group-relative-policy-optimization.md`
- `docs/ai/training/optimization/long-horizon-agentic-rl-infrastructure.md`
- `docs/ai/training/optimization/reinforcement-learning-for-llms.md`
- `docs/ai/training/optimization/reinforcement-learning-with-verifiable-rewards.md`
- `docs/ai/training/optimization/rl-fine-tuning-for-llms-interview-guide.md`
- `docs/ai/training/optimization/sharpening-tax-and-posterior-tempered-group-sampling.md`
- `docs/ai/training/optimization/why-sparse-reward-llm-rl-can-work.md`
- `docs/systems/infrastructure/asynchronous-rl-infrastructure.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Distillation

Identity: `post-training/distillation`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- Hard/soft/feature targets.
- temperature and tau².
- forward/reverse KL.
- student/on-policy distribution.
- multi-teacher consolidation.
- self-distillation during RL.
- trace selection/diversity/forgetting/recovery.
- practical failures..

Visual treatment: Teacher/student distributions and on-/off-policy trajectory branching.

Connected topics: Reinforcement Learning; Diffusion and Score-Based Generation

Sources absorbed:

- `docs/ai/architectures/model-reports/deepseek-v4-1-flash.md`
- `docs/ai/architectures/model-reports/kimi-k3-open-frontier-intelligence.md`
- `docs/ai/architectures/model-reports/mai-thinking-1-building-a-hill-climbing-machine.md`
- `docs/ai/architectures/model-reports/nanbeige4-3b-technical-report.md`
- `docs/ai/training/losses/knowledge-distillation.md`
- `docs/ai/training/optimization/on-policy-distillation.md`
- `docs/ai/training/optimization/self-distillation-in-rl-climbs.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Agent Training and Environments

Identity: `post-training/agents`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- Executable task/data synthesis.
- coding/tool/office environments.
- harness families/mixtures.
- collection versus effective gradient contribution.
- long trajectories/suspension/forking/KV lifecycle/backpressure.
- groupwise reward synthesis/redistribution.
- action-level regularization.
- verifier isolation/reward hacking.
- measured limits..

Visual treatment: Task/environment/harness/policy diagram; grouped grading example and environment lifecycle.

Connected topics: Reinforcement Learning

Sources absorbed:

- `docs/ai/architectures/model-reports/deepseek-v4-1-flash.md`
- `docs/ai/architectures/model-reports/glm-5-3-flash-hybrid-multimodal.md`
- `docs/ai/architectures/model-reports/glm-5-agentic-engineering.md`
- `docs/ai/architectures/model-reports/kimi-k3-open-frontier-intelligence.md`
- `docs/ai/architectures/model-reports/mimo-v2-6-scaling-rl-towards-self-improvement.md`
- `docs/ai/architectures/model-reports/nanbeige4-2-3b-unlocking-agentic-capabilities.md`
- `docs/ai/training/data/agentic-training-data-and-environment-synthesis.md`
- `docs/ai/training/optimization/groupwise-agentic-grading.md`
- `docs/ai/training/optimization/multi-harness-agentic-rl.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Building and Controlling Reasoning Models

Identity: `post-training/reasoning`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- Preserve the purchased-book pipeline.
- extraction/verification and held-out evaluation.
- sampling/voting/refinement.
- sequential/parallel test-time compute.
- learned effort versus hard budget.
- hybrid thinking/template consequences.
- RL stabilization and distillation roles..

Visual treatment: End-to-end pipeline with reused primitives; voting/effort/cost illustrations. No reduction of the book to a reading list.

Connected topics: Reinforcement Learning

Sources absorbed:

- `docs/ai/architectures/hybrid-reasoning-models.md`
- `docs/ai/inference-serving/performance/reasoning-effort-control.md`
- `docs/ai/inference-serving/performance/test-time-compute.md`
- `docs/ai/training/build-a-reasoning-model-from-scratch.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

## Execution

### Decoding and Sampling

Identity: `execution/decoding`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- Greedy/temperature/top-k/top-p.
- LoopCD hidden/logit guidance.
- watermark tournament sampling/detection, entropy capacity, editing and security limits..

Visual treatment: Probability transformations; contrastive guidance example; watermark generation/detection flow.

Connected topics: Speculative Decoding

Sources absorbed:

- `docs/ai/inference-serving/decoding/llm-decoding-top-k-sampling-and-temperature.md`
- `docs/ai/inference-serving/decoding/llm-text-watermarking-with-synthid-text.md`
- `docs/ai/inference-serving/decoding/loopcd-contrastive-decoding-for-looped-transformers.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Speculative Decoding

Identity: `execution/speculation`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- Exact accept/residual proof, greedy/sampling, alignment and bonus token.
- history.
- chain/tree.
- Medusa/MTP/EAGLE.
- DFlash/DFlash2/DSpark architecture and scheduler.
- training.
- cache lifecycle.
- correctness tests.
- roadmap and benchmarks..

Visual treatment: One exact sampling round; draft tree; feature/block dependencies; accepted/rejected KV timeline; DSpark prefix scheduler.

Connected topics: Mixture of Experts; Decoding and Sampling; Serving Models; GPU Communication; Recurrent and Looped Models

Sources absorbed:

- `docs/ai/architectures/model-reports/deepseek-v4-1-flash.md`
- `docs/ai/architectures/model-reports/gemma-4-technical-report.md`
- `docs/ai/architectures/model-reports/glm-5-agentic-engineering.md`
- `docs/ai/architectures/model-reports/mimo-v2-6-scaling-rl-towards-self-improvement.md`
- `docs/ai/inference-serving/decoding/speculative-decoding.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Serving Models

Identity: `execution/serving`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- Prefill/decode.
- KV formula/example/capacity/bandwidth.
- batching/paging/prefix reuse.
- sharding/disaggregation.
- inference economics/critical batch.
- TTS stream capacity as a source-scoped deployment example..

Visual treatment: KV/memory and phase timelines; batching/capacity worksheet and service bottlenecks.

Connected topics: Speculative Decoding

Sources absorbed:

- `docs/ai/architectures/model-reports/deepseek-v4-1-flash.md`
- `docs/ai/architectures/model-reports/gemma-4-technical-report.md`
- `docs/ai/architectures/model-reports/glm-5-3-flash-hybrid-multimodal.md`
- `docs/ai/architectures/model-reports/glm-5-agentic-engineering.md`
- `docs/ai/architectures/model-reports/kimi-k3-open-frontier-intelligence.md`
- `docs/ai/architectures/model-reports/nanbeige4-2-3b-unlocking-agentic-capabilities.md`
- `docs/ai/architectures/model-reports/shieldstral.md`
- `docs/ai/inference-serving/caching/kv-cache.md`
- `docs/ai/inference-serving/performance/llm-inference-economics.md`
- `docs/ai/inference-serving/performance/tts-stream-capacity.md`
- `docs/ai/inference-serving/serving-architectures/disaggregated-prefill-decode-serving.md`
- `docs/ai/inference-serving/serving-architectures/large-language-model-serving.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Compute, Memory, and Performance

Identity: `execution/performance`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- Einsum/per-layer/MoE accounting.
- 2P/6P estimates and limits.
- quadratic attention.
- activations/checkpoints.
- budget/throughput/cost/reliability arithmetic.
- roofline examples.
- latency versus throughput/scalability.
- MFU versus goodput..

Visual treatment: Visible-unit resource calculator; roofline; performance/batch examples.

Connected topics: Distributed Training and Parallelism; Attention

Sources absorbed:

- `docs/ai/training/scaling/llm-training-capacity-planning.md`
- `docs/ai/training/scaling/transformer-performance-accounting.md`
- `docs/systems/performance/latency-vs-throughput.md`
- `docs/systems/performance/model-flops-utilization-mfu.md`
- `docs/systems/performance/performance-vs-scalability.md`
- `docs/systems/performance/roofline-model.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### GPU Communication

Identity: `execution/communication`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- NCCL algorithms/protocols/transports.
- channels/buffers/slots/primitives.
- ring/tree.
- push/pull, one-/two-shot.
- barriers/sentinels/visibility/double buffers.
- LL/LL128.
- device-initiated/symmetric memory/multicast.
- source-scoped bounds and evidence..

Visual treatment: Per-GPU reads/writes and synchronization; NCCL pipeline; latency/bandwidth regimes.

Connected topics: Speculative Decoding; Distributed Training and Parallelism

Sources absorbed:

- `docs/systems/parallel-computing/low-latency-gpu-collectives.md`
- `docs/systems/parallel-computing/nccl-internals-protocols-algorithms-and-transports.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Profiling and Kernel Optimization

Identity: `execution/profiling`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- PyTorch op→kernel dispatch.
- Nsight timelines.
- steady-state bounded captures.
- startup artifacts.
- fusion taxonomy/compile traces.
- memory/copy/sync/communication classification.
- nsys/ncu distinctions..

Visual treatment: Annotated representative traces with operations/kernels/idle gaps and investigation steps.

Connected topics: Attention

Sources absorbed:

- `docs/tooling/profiling/nsys-profiler.md`
- `docs/tooling/profiling/pytorch-profiler-and-gpu-trace-reading.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### GPU Infrastructure

Identity: `execution/hardware`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- Topology links.
- power/cooling/density/facilities.
- water/flow/control and operational failure modes.
- compute opportunity cost..

Visual treatment: Power/cooling/compute dependencies and failure-path diagram.

Connected topics: Distributed Training and Parallelism

Sources absorbed:

- `docs/systems/infrastructure/high-density-gpu-infrastructure.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

## Mathematics

### Information Theory and Compression

Identity: `math/information`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- Entropy/coding.
- cross-entropy/KL decomposition.
- support/direction/units.
- JSD mutual information.
- entropy rates.
- prediction/compression.
- compressor-based similarity/language trees and non-metric/encoding/topic caveats..

Visual treatment: Code-length/cost bars; divergence examples; directional compression and clustering.

Connected topics: Losses and Objectives

Sources absorbed:

- `docs/ai/foundations/compression-based-similarity-and-language-trees.md`
- `docs/ai/foundations/prediction-compression-and-entropy.md`
- `docs/math/probability/entropy.md`
- `docs/math/probability/jensen-shannon-divergence.md`
- `docs/math/probability/kullback-leibler-divergence.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Probability and Distributions

Identity: `math/probability`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- Conditioning/Bayes/total probability.
- PMF/PDF/CDF/quantiles.
- characteristic functions/moments.
- covariance/joint tables.
- Poisson/expectation toolkit references..

Visual treatment: Probability trees, joint grid, cumulative and frequency-domain distribution views.

Connected topics: Self-Supervised Vision Learning

Sources absorbed:

- `docs/math/probability/characteristic-function.md`
- `docs/math/probability/covariance-from-joint-pmf.md`
- `docs/math/probability/cumulative-distribution-function.md`
- `docs/math/probability/law-of-total-probability.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Statistics and Evaluation

Identity: `math/statistics`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- Online mean.
- sampling distributions/CLT.
- uncertainty/power/type errors.
- A/B practical impact.
- k-fold/leakage/time-order conditions.
- experiment interpretation..

Visual treatment: Repeated sampling, fold assignment and power/error decision diagrams.

Connected topics: Add a few relevant section links during full-body review.

Sources absorbed:

- `docs/ai/evaluation-experimentation/a-b-testing.md`
- `docs/ai/evaluation-experimentation/k-fold-cross-validation.md`
- `docs/math/statistics/incremental-average-formula.md`
- `docs/math/statistics/sampling-distribution-of-the-mean.md`
- `docs/math/statistics/statistical-power-and-type-i-ii-errors.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Differentiation and Optimization Geometry

Identity: `math/calculus`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- Partial/product/chain rules.
- backpropagation.
- gradients/curvature.
- high-dimensional minima/saddles.
- random-matrix/Kac–Rice/Morse caveats and model applicability..

Visual treatment: Computational graph with backward accumulation; contours and curvature/eigenvalue examples.

Connected topics: Optimization

Sources absorbed:

- `docs/ai/training/optimization/local-minima-in-high-dimensional-landscapes.md`
- `docs/math/calculus/chain-rule.md`
- `docs/math/calculus/gradient-direction-and-magnitude.md`
- `docs/math/calculus/partial-derivatives.md`
- `docs/math/calculus/product-rule.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Vectors and Geometry

Identity: `math/geometry`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- Norm versus loss/penalty.
- unit normalization/embedding distances.
- cross products/signed area/orientation.
- correct collapse limitations..

Visual treatment: Vector/norm/circle and oriented-area explorer.

Connected topics: Losses and Objectives

Sources absorbed:

- `docs/ai/training/losses/l2-norm-and-loss.md`
- `docs/math/linear-algebra/cross-product.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Mathematical Problem Solving

Identity: `math/problem-solving`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- Counting, conditional probability, indicators/expectation, Poisson arrivals, information bounds, pigeonhole, invariants/monovariants, symmetry, rates/units, algebra, assumptions and worked reasoning..

Visual treatment: Compact worked cases, probability/arrival examples and invariant diagrams.

Connected topics: Add a few relevant section links during full-body review.

Sources absorbed:

- `docs/interview-prep/brain-teaser-problem-solving-toolkit.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

## Algorithms

### Choosing Algorithms

Identity: `algorithms/choosing`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- Full decision tree/constraint table.
- brute-force work.
- all dimensions/queries/memory.
- proof conditions.
- negative-window caveat.
- subset-sum regimes and problem-solving workflow..

Visual treatment: Searchable decision tree with counterexamples and complexity estimates.

Connected topics: Graph Algorithms; Dynamic Programming; Greedy and Interval Algorithms

Sources absorbed:

- `docs/interview-prep/algorithms/interview-algorithms.md`
- `docs/interview-prep/algorithms/top-6-coding-interview-concepts.md`
- `docs/interview-prep/neetcode-roadmap/choosing-algorithms-from-constraints.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Arrays and Hashing

Identity: `algorithms/arrays`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- Membership/frequencies/complements/canonical keys.
- prefix/suffix state.
- invariants and complexity.
- purposeful conceptual examples, no exercise inventory..

Visual treatment: Array/map state and lookup/update traces.

Connected topics: Add a few relevant section links during full-body review.

Sources absorbed:

- `docs/interview-prep/neetcode-roadmap/arrays-and-hashing.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Pointers and Sliding Windows

Identity: `algorithms/windows`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- Opposite/read-write/center-expansion.
- fixed/variable/required-frequency/at-most-K windows.
- monotonic validity and signed-value failures..

Visual treatment: Boundary/state traces that display why a move is valid.

Connected topics: Add a few relevant section links during full-body review.

Sources absorbed:

- `docs/interview-prep/neetcode-roadmap/sliding-window.md`
- `docs/interview-prep/neetcode-roadmap/two-pointers.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Ordering, Heaps, and Selection

Identity: `algorithms/ordering`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- Insertion/merge/partition sorting.
- heap versus priority queue.
- top-k/quickselect.
- k-way merge.
- two-heap median.
- scheduling/lazy deletion/tie breakers.
- worst/average complexity distinctions..

Visual treatment: Heap/partition/merge frontiers and median invariants; tiny worked states.

Connected topics: Add a few relevant section links during full-body review.

Sources absorbed:

- `docs/algorithms/data-structures/heap.md`
- `docs/algorithms/data-structures/priority-queues.md`
- `docs/algorithms/patterns/k-way-merge.md`
- `docs/algorithms/patterns/top-k-pattern.md`
- `docs/algorithms/patterns/two-heaps-pattern.md`
- `docs/algorithms/selection/quickselect.md`
- `docs/interview-prep/algorithms/interview-algorithms.md`
- `docs/interview-prep/neetcode-roadmap/heap-priority-queue.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Stacks and Monotonic Structures

Identity: `algorithms/stacks`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- Unresolved work.
- delimiter/simulation/expression stacks.
- monotonic stack invariant and amortized reasoning..

Visual treatment: Push/pop trace showing unresolved candidates.

Connected topics: Add a few relevant section links during full-body review.

Sources absorbed:

- `docs/interview-prep/neetcode-roadmap/stack.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Trees and Prefix Structures

Identity: `algorithms/trees`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- DFS orders/call stack.
- BFS.
- subtree returns versus path state.
- BST/LCA.
- tries/prefix/wildcard/board search.
- complexity..

Visual treatment: Tree traversal with stack/queue/return values; trie branch example.

Connected topics: Add a few relevant section links during full-body review.

Sources absorbed:

- `docs/algorithms/data-structures/trees.md`
- `docs/interview-prep/neetcode-roadmap/trees.md`
- `docs/interview-prep/neetcode-roadmap/tries.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Graph Algorithms

Identity: `algorithms/graphs`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- Representations.
- DFS/BFS/multi-source.
- cycles/topological/Union-Find.
- weighted paths.
- Dijkstra/Bellman–Ford/Floyd–Warshall.
- MST.
- Euler tours.
- selection by edge/objective conditions..

Visual treatment: Traversal/frontier and weighted relaxation steps; connectivity/dependency examples.

Connected topics: Choosing Algorithms

Sources absorbed:

- `docs/interview-prep/neetcode-roadmap/advanced-graphs.md`
- `docs/interview-prep/neetcode-roadmap/graphs.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Dynamic Programming

Identity: `algorithms/dp`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- State/transition/order/base case.
- memoization/tabulation.
- 1D/2D.
- segmentation/grid/LCS/edit/knapsack/interval.
- rolling memory correctness.
- DP versus greedy/backtracking..

Visual treatment: Decision tree→DAG→table; dependency/rolling-array steps.

Connected topics: Choosing Algorithms

Sources absorbed:

- `docs/interview-prep/neetcode-roadmap/one-dimensional-dynamic-programming.md`
- `docs/interview-prep/neetcode-roadmap/two-dimensional-dynamic-programming.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Greedy and Interval Algorithms

Identity: `algorithms/greedy`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- Exchange/dominance/stay-ahead.
- frontier/reset/count choices.
- merge/insert/scheduling/sweep intervals.
- endpoints and heaps.
- optimality versus heuristic caveats..

Visual treatment: Interval/frontier timelines and a greedy counterexample/proof.

Connected topics: Choosing Algorithms

Sources absorbed:

- `docs/interview-prep/neetcode-roadmap/greedy.md`
- `docs/interview-prep/neetcode-roadmap/intervals.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Backtracking and Search

Identity: `algorithms/backtracking`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- Choose/explore/undo.
- subsets/combinations/permutations.
- constraints/grids.
- pruning.
- duplicated choices/state restoration.
- distinction from DP..

Visual treatment: Branch/prune stepper with owned mutable state.

Connected topics: Add a few relevant section links during full-body review.

Sources absorbed:

- `docs/interview-prep/neetcode-roadmap/backtracking.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Binary and Monotonic Search

Identity: `algorithms/binary-search`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- Exact/boundary/answer-space/transformed sorted searches.
- predicates.
- bounds and invariants.
- correctness versus mere O(log n) promise..

Visual treatment: Boundary/monotonic-predicate stepper.

Connected topics: Add a few relevant section links during full-body review.

Sources absorbed:

- `docs/interview-prep/neetcode-roadmap/binary-search.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Linked Lists and Pointer Ownership

Identity: `algorithms/linked-lists`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- Dummy/tail.
- reverse.
- fast/slow.
- merges.
- structural multi-pass.
- preserving the remainder and complexity..

Visual treatment: Pointer rewiring with explicit saved next/ownership.

Connected topics: Add a few relevant section links during full-body review.

Sources absorbed:

- `docs/interview-prep/neetcode-roadmap/linked-list.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

### Bits, Numbers, and Geometric Patterns

Identity: `algorithms/numbers`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- XOR/masks/fixed widths.
- powers/alignment/overflow/negative caveats.
- GCD/modular/digits.
- matrix boundaries/rotation.
- exact slopes and cross-product links..

Visual treatment: Bit rows/alignment, matrix boundary state and exact coordinate examples.

Connected topics: Add a few relevant section links during full-body review.

Sources absorbed:

- `docs/interview-prep/neetcode-roadmap/bit-manipulation.md`
- `docs/interview-prep/neetcode-roadmap/math-and-geometry.md`
- `docs/programming/python/bit-tricks-powers-of-two-and-alignment.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.

## General Computing

### Distributed Services and System Design

Identity: `computing/services`. One dense topic reader, with stable section anchors and a searchable internal index.

Proposed sections:

- CAP/PACELC.
- consistency/quorums/replication/failover/sharding/load balancing.
- DNS/CDN.
- workload/bottleneck reasoning.
- video-platform case as an embedded worked design, not an interview page..

Visual treatment: Request/replica/delivery paths and a workload/failure case.

Connected topics: Add a few relevant section links during full-body review.

Sources absorbed:

- `docs/interview-prep/system-design/8-most-important-system-design-concepts-you-should-know.md`
- `docs/interview-prep/system-design/design-youtube-system-design-interview.md`
- `docs/systems/distributed-systems/availability-patterns.md`
- `docs/systems/distributed-systems/availability-vs-consistency-cap.md`
- `docs/systems/distributed-systems/consistency-patterns.md`
- `docs/systems/distributed-systems/content-delivery-network.md`
- `docs/systems/distributed-systems/database-sharding.md`
- `docs/systems/distributed-systems/load-balancer.md`
- `docs/systems/distributed-systems/scalability.md`
- `docs/systems/networking/domain-name-system-dns.md`

Preservation: retain unique derivations, examples, numeric conditions, evidence, code details, figures, sources and caveats. Repeated basics may link to their canonical owner; do not shorten away useful detail.
Status: proposed. Full-body/primary-source/asset/retention review and rendered interactions remain pending.
