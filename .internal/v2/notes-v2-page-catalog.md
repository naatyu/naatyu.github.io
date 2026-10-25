# Atlas v2 — proposed page catalog

> Superseded by [54 dense topic outlines](dense-notes-catalog.md). This historical 149-page catalog is not the active plan.

Prepared 2026-10-03. Proposed destinations and designs, not implemented readers. Read [the blueprint](notes-v2-blueprint.md) first. All substantive original material must pass the [preservation ledger](notes-v2-preservation.json) before any merge is final.

This initial proposal contains 149 learning pages. Existing exercises are nested examples, not twenty more top-level pages. Scope can grow when full reading reveals material requiring its own page.

## Page families

- AI: 94 proposed pages.
- Systems: 19 proposed pages.
- Algorithms: 20 proposed pages.
- Mathematics: 11 proposed pages.
- Engineering: 3 proposed pages.
- Security: 2 proposed pages.

## All proposed readers

### AI

#### Large Concept Models (LCM)

- Identity: `ai/architectures/concept-models`. Browsing home: `ai/architectures`. Kind: deep-dive.
- Scope and protected material: Preserve all substantive original sections, examples, sources and qualifications. Sentence-embedding versus token generation flow with source scope.
- Teaching treatment: Sentence-embedding versus token generation flow with source scope.
- Original sources: `docs/ai/architectures/model-families/large-concept-models.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Choosing a Transformer Architecture

- Identity: `ai/architectures/design`. Browsing home: `ai/architectures`. Kind: guided-path.
- Scope and protected material: Preserve practical templates, formulas and model comparisons with conditions; don't present historical heuristics as universal rules.
- Teaching treatment: A model-design trade-off matrix connected to attention/MoE/cache notes.
- Original sources: `docs/ai/training/scaling/transformer-scaling-rules.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Frontier Small Language Models (Liquid AI)

- Identity: `ai/architectures/small-models`. Browsing home: `ai/architectures`. Kind: deep-dive.
- Scope and protected material: Preserve all substantive original sections, examples, sources and qualifications. Parameter budget breakdown, embedding tax and small-model training caveats.
- Teaching treatment: Parameter budget breakdown, embedding tax and small-model training caveats.
- Original sources: `docs/ai/architectures/model-families/frontier-small-language-models.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Attention: From Scores to Context

- Identity: `ai/architectures/attention`. Browsing home: `ai/architectures/attention`. Kind: main.
- Scope and protected material: Q/K/V, causal masks, shapes, scaling, saturation, and softmax; advanced entropy and gradient arguments remain expandable, not dropped.
- Teaching treatment: A tiny token-to-token matrix with selectable queries, scores, mask and weights.
- Original sources: `docs/ai/foundations/attention-mechanism.md`; `docs/ai/architectures/transformers/attention-softmax-and-scaling.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Linear Attention

- Identity: `ai/architectures/attention/linear-attention`. Browsing home: `ai/architectures/attention`. Kind: deep-dive.
- Conceptual parent: `ai/architectures/attention`.
- Scope and protected material: Preserve all substantive original sections, examples, sources and qualifications. Recurrent state versus full pair matrix, kernel approximation versus delta-rule distinctions.
- Teaching treatment: Recurrent state versus full pair matrix, kernel approximation versus delta-rule distinctions.
- Original sources: `docs/ai/architectures/transformers/linear-attention.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Attention Scaling Beyond the Variance Argument

- Identity: `ai/architectures/attention/scaling`. Browsing home: `ai/architectures/attention`. Kind: deep-dive.
- Conceptual parent: `ai/architectures/attention`.
- Scope and protected material: Keep variance derivation, entropy-invariance, gradient-maximization and QueryNorm/KeyNorm distinctions.
- Teaching treatment: Dot-product variance and softmax sharpness across head dimensions.
- Original sources: `docs/ai/architectures/transformers/attention-softmax-and-scaling.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Attention Variants and Memory Trade-offs

- Identity: `ai/architectures/attention/variants`. Browsing home: `ai/architectures/attention`. Kind: deep-dive.
- Conceptual parent: `ai/architectures/attention`.
- Scope and protected material: MHA/MQA/GQA/MLA, local/global/cross attention; preserve MLA identity and RoPE caveats.
- Teaching treatment: Aligned head/cache/connectivity diagrams with a dimension calculator.
- Original sources: `docs/ai/architectures/transformers/attention-variants.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### DeepSeek-V4.1-Flash: Cheap Prefill, Multimodal Pretraining, and Agent Environment Scaling

- Identity: `ai/model-studies/deepseek-v4-1-flash`. Browsing home: `ai/architectures/attention`. Kind: model-study.
- Collection(s): model-reports.
- Scope and protected material: Protected standalone report: preserve architecture, data, optimization, precision, context schedule, SFT/RL/rewards, harness/environment systems, results, discrepancies and limitations wherever disclosed. Repeated basics may link to concept pages; report-specific details and source conditions must remain. Do not invent undisclosed recipe.
- Teaching treatment: Source-specific annotated architecture plus training timeline; selected original evidence figures with reading guides, not a decorative statistics dashboard.
- Original sources: `docs/ai/architectures/model-reports/deepseek-v4-1-flash.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### GLM-5.3-Flash: Hybrid Attention at Flash Cost

- Identity: `ai/model-studies/glm-5-3-flash-hybrid-multimodal`. Browsing home: `ai/architectures/attention`. Kind: model-study.
- Collection(s): model-reports.
- Scope and protected material: Protected standalone report: preserve architecture, data, optimization, precision, context schedule, SFT/RL/rewards, harness/environment systems, results, discrepancies and limitations wherever disclosed. Repeated basics may link to concept pages; report-specific details and source conditions must remain. Do not invent undisclosed recipe.
- Teaching treatment: Source-specific annotated architecture plus training timeline; selected original evidence figures with reading guides, not a decorative statistics dashboard.
- Original sources: `docs/ai/architectures/model-reports/glm-5-3-flash-hybrid-multimodal.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Kimi K3: Open Frontier Intelligence

- Identity: `ai/model-studies/kimi-k3-open-frontier-intelligence`. Browsing home: `ai/architectures/attention`. Kind: model-study.
- Collection(s): model-reports.
- Scope and protected material: Protected standalone report: preserve architecture, data, optimization, precision, context schedule, SFT/RL/rewards, harness/environment systems, results, discrepancies and limitations wherever disclosed. Repeated basics may link to concept pages; report-specific details and source conditions must remain. Do not invent undisclosed recipe.
- Teaching treatment: Source-specific annotated architecture plus training timeline; selected original evidence figures with reading guides, not a decorative statistics dashboard.
- Original sources: `docs/ai/architectures/model-reports/kimi-k3-open-frontier-intelligence.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Gemma 4 Technical Report

- Identity: `ai/model-studies/gemma-4-technical-report`. Browsing home: `ai/architectures/efficiency`. Kind: model-study.
- Collection(s): model-reports.
- Scope and protected material: Protected standalone report: preserve architecture, data, optimization, precision, context schedule, SFT/RL/rewards, harness/environment systems, results, discrepancies and limitations wherever disclosed. Repeated basics may link to concept pages; report-specific details and source conditions must remain. Do not invent undisclosed recipe.
- Teaching treatment: Source-specific annotated architecture plus training timeline; selected original evidence figures with reading guides, not a decorative statistics dashboard.
- Original sources: `docs/ai/architectures/model-reports/gemma-4-technical-report.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Nanbeige4-3B Technical Report

- Identity: `ai/model-studies/nanbeige4-3b-technical-report`. Browsing home: `ai/architectures/efficiency`. Kind: model-study.
- Collection(s): model-reports.
- Scope and protected material: Protected standalone report: preserve architecture, data, optimization, precision, context schedule, SFT/RL/rewards, harness/environment systems, results, discrepancies and limitations wherever disclosed. Repeated basics may link to concept pages; report-specific details and source conditions must remain. Do not invent undisclosed recipe.
- Teaching treatment: Source-specific annotated architecture plus training timeline; selected original evidence figures with reading guides, not a decorative statistics dashboard.
- Original sources: `docs/ai/architectures/model-reports/nanbeige4-3b-technical-report.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Third-Generation Apple Foundation Models

- Identity: `ai/model-studies/third-generation-apple-foundation-models`. Browsing home: `ai/architectures/efficiency`. Kind: model-study.
- Collection(s): model-reports.
- Scope and protected material: Protected standalone report: preserve architecture, data, optimization, precision, context schedule, SFT/RL/rewards, harness/environment systems, results, discrepancies and limitations wherever disclosed. Repeated basics may link to concept pages; report-specific details and source conditions must remain. Do not invent undisclosed recipe.
- Teaching treatment: Source-specific annotated architecture plus training timeline; selected original evidence figures with reading guides, not a decorative statistics dashboard.
- Original sources: `docs/ai/architectures/model-reports/third-generation-apple-foundation-models.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Reversible Networks (RevNets)

- Identity: `ai/architectures/memory/reversible-networks`. Browsing home: `ai/architectures/memory`. Kind: deep-dive.
- Scope and protected material: Preserve all substantive original sections, examples, sources and qualifications. Reversible computation and activation rematerialization diagram.
- Teaching treatment: Reversible computation and activation rematerialization diagram.
- Original sources: `docs/ai/architectures/general/reversible-networks.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Mixture of Experts

- Identity: `ai/architectures/moe`. Browsing home: `ai/architectures/moe`. Kind: main.
- Scope and protected material: Introduce sparsity, active/total parameters, routing, expert grouping, auxiliary/loss-free balancing and stability; specialized implementation stays in deep dives.
- Teaching treatment: Token routing, expert occupancy and adjustable capacity; explicit dropped-token state.
- Original sources: `docs/ai/training/optimization/moe-routing-and-load-balancing.md`; `docs/ai/training/optimization/moe-training-stability.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### MoE Routing and Load Balancing

- Identity: `ai/architectures/moe/routing`. Browsing home: `ai/architectures/moe`. Kind: deep-dive.
- Conceptual parent: `ai/architectures/moe`.
- Scope and protected material: Preserve auxiliary versus loss-free control, quantile balancing, z-loss, expert-first execution, shared/fine-grained experts, sequence/modality/network balance and logging.
- Teaching treatment: Expert loads and router scores; separate optimization loss from bias feedback.
- Original sources: `docs/ai/training/optimization/moe-routing-and-load-balancing.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### MoE Training Stability

- Identity: `ai/architectures/moe/stability`. Browsing home: `ai/architectures/moe`. Kind: deep-dive.
- Conceptual parent: `ai/architectures/moe`.
- Scope and protected material: Protect optimizer mismatch, dispatch/combine precision, padding masks, dense early layers and diagnosis.
- Teaching treatment: A failure-source flow from token mask to routing, communication and gradients.
- Original sources: `docs/ai/training/optimization/moe-training-stability.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Output Heads, Weight Tying, and the Softmax Bottleneck

- Identity: `ai/architectures/output-heads`. Browsing home: `ai/architectures/output-heads`. Kind: main.
- Scope and protected material: Keep exact row-shift/rank argument, mixture of softmaxes, tying trade-offs and experimental qualifications.
- Teaching treatment: A context-by-token log-probability matrix and rank/row-shift worked example.
- Original sources: `docs/ai/foundations/softmax-bottleneck.md`; `docs/ai/architectures/transformers/embedding-tying-in-small-llms.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Position in Transformers

- Identity: `ai/architectures/position`. Browsing home: `ai/architectures/position`. Kind: main.
- Scope and protected material: Sinusoidal clocks, paired rotations, relative scores, RoPE scaling and NoPE; no conflation of pure/hybrid/partial variants.
- Teaching treatment: Frequency clocks plus a position shift and rotation explorer.
- Original sources: `docs/ai/architectures/transformers/positional-encoding-sinusoidal-to-rope.md`; `docs/ai/architectures/transformers/rope-scaling.md`; `docs/ai/architectures/transformers/no-positional-embeddings-nope.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### A Group-Theoretic View of Position

- Identity: `ai/architectures/position/group-theory`. Browsing home: `ai/architectures/position`. Kind: deep-dive.
- Conceptual parent: `ai/architectures/position`.
- Scope and protected material: Keep generator classification, rotations, decay/growth, defective blocks, scope and stability restrictions.
- Teaching treatment: An annotated translation-composition diagram with generator block examples.
- Original sources: `docs/ai/architectures/transformers/group-theoretic-positional-encodings.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Recurrent and Looped Transformers

- Identity: `ai/architectures/recurrence`. Browsing home: `ai/architectures/recurrence`. Kind: main.
- Scope and protected material: Physical/unrolled depth, tied weights, early exit, cache costs and compute accounting; preserve Ouro and sparse looping as distinct case studies.
- Teaching treatment: Unrolled loops with weight reuse and cache state; active/total compute comparison.
- Original sources: `docs/ai/architectures/transformers/looped-language-models-ouro.md`; `docs/ai/architectures/transformers/moe-looped-language-models.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### DeepLoop: Stability Under Weight Reuse

- Identity: `ai/architectures/recurrence/deeploop`. Browsing home: `ai/architectures/recurrence`. Kind: deep-dive.
- Conceptual parent: `ai/architectures/recurrence`.
- Scope and protected material: Keep visit alignment derivation, initialization recipe, comparisons, theory restrictions and experiments.
- Teaching treatment: Aligned versus decorrelated visits and loop-aware scale diagram.
- Original sources: `docs/ai/architectures/transformers/deeploop-residual-scaling-for-looped-transformers.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Latent Feedback and Full-Bandwidth Transformers

- Identity: `ai/architectures/recurrence/latent-feedback`. Browsing home: `ai/architectures/recurrence`. Kind: deep-dive.
- Conceptual parent: `ai/architectures/recurrence`.
- Scope and protected material: Keep STANDARD/SOFT/FUSED distinctions, causal timing, multi-pass training, objectives, stability and cost/evidence.
- Teaching treatment: Side-by-side token/latent paths with causal time and cache state.
- Original sources: `docs/ai/architectures/transformers/full-bandwidth-transformer-latent-feedback.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Inference-Time Recirculation

- Identity: `ai/architectures/recurrence/recirculation`. Browsing home: `ai/architectures/recurrence`. Kind: deep-dive.
- Conceptual parent: `ai/architectures/recurrence`.
- Scope and protected material: Not ordinary tied-layer looping: preserve layer choices, mixing, schedule, adaptive policy and limitations.
- Teaching treatment: Step through layer revisits and hidden-state mixing.
- Original sources: `docs/ai/architectures/transformers/recirculation-inference-time-recurrence.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Nanbeige4.2-3B: Unlocking Agentic Capabilities in a Compact Model

- Identity: `ai/model-studies/nanbeige4-2-3b-unlocking-agentic-capabilities`. Browsing home: `ai/architectures/recurrence`. Kind: model-study.
- Collection(s): model-reports.
- Scope and protected material: Protected standalone report: preserve architecture, data, optimization, precision, context schedule, SFT/RL/rewards, harness/environment systems, results, discrepancies and limitations wherever disclosed. Repeated basics may link to concept pages; report-specific details and source conditions must remain. Do not invent undisclosed recipe.
- Teaching treatment: Source-specific annotated architecture plus training timeline; selected original evidence figures with reading guides, not a decorative statistics dashboard.
- Original sources: `docs/ai/architectures/model-reports/nanbeige4-2-3b-unlocking-agentic-capabilities.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Residual Streams, Normalization, and Initialization

- Identity: `ai/architectures/residuals`. Browsing home: `ai/architectures/residuals`. Kind: main.
- Scope and protected material: Pre-/post-norm, residual scaling and initialization; link neural normalization without duplicating its introduction.
- Teaching treatment: Forward/backward depth paths with a labeled scale demonstration.
- Original sources: `docs/ai/architectures/transformers/residual-normalization-and-initialization.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Attention Residuals

- Identity: `ai/architectures/residuals/attention-residuals`. Browsing home: `ai/architectures/residuals`. Kind: deep-dive.
- Conceptual parent: `ai/architectures/residuals`.
- Scope and protected material: Preserve full/block mechanisms, cost, systems and evidence, not just the high-level idea.
- Teaching treatment: Layer-to-layer aggregation weights with full versus block layouts.
- Original sources: `docs/ai/architectures/transformers/attention-residuals.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Long Short-Term Memory Network (LSTM)

- Identity: `ai/architectures/sequence-models/lstm`. Browsing home: `ai/architectures/sequence-models`. Kind: deep-dive.
- Scope and protected material: Preserve all substantive original sections, examples, sources and qualifications. Cell-state/gate stepper with explicit state and tensor shapes.
- Teaching treatment: Cell-state/gate stepper with explicit state and tensor shapes.
- Original sources: `docs/ai/architectures/sequence-models/long-short-term-memory-network.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Support Vector Machines and the Margin

- Identity: `ai/classical-ml/svm`. Browsing home: `ai/classical-ml`. Kind: deep-dive.
- Scope and protected material: Preserve all substantive original sections, examples, sources and qualifications. Margin geometry with soft/hard constraint distinctions.
- Teaching treatment: Margin geometry with soft/hard constraint distinctions.
- Original sources: `docs/ai/modalities/classical-ml/support-vector-machines-and-the-margin.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Jev and Tev: Typed Decision Models, Training, and New Workflows

- Identity: `ai/decision-models/typed-decisions`. Browsing home: `ai/decision-models`. Kind: deep-dive.
- Scope and protected material: Preserve all substantive original sections, examples, sources and qualifications. Typed inputs/outputs, calibration versus confidence, evidence versus hypothesized internals.
- Teaching treatment: Typed inputs/outputs, calibration versus confidence, evidence versus hypothesized internals.
- Original sources: `docs/ai/architectures/jev-tev-typed-decision-models.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Shieldstral: Policy-Adaptive Multimodal Safety Classification

- Identity: `ai/model-studies/shieldstral`. Browsing home: `ai/decision-models`. Kind: model-study.
- Collection(s): model-reports.
- Scope and protected material: Protected standalone report: preserve architecture, data, optimization, precision, context schedule, SFT/RL/rewards, harness/environment systems, results, discrepancies and limitations wherever disclosed. Repeated basics may link to concept pages; report-specific details and source conditions must remain. Do not invent undisclosed recipe.
- Teaching treatment: Source-specific annotated architecture plus training timeline; selected original evidence figures with reading guides, not a decorative statistics dashboard.
- Original sources: `docs/ai/architectures/model-reports/shieldstral.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### K-Fold Cross-Validation

- Identity: `ai/evaluation/cross-validation`. Browsing home: `ai/evaluation`. Kind: deep-dive.
- Scope and protected material: Preserve all substantive original sections, examples, sources and qualifications. Fold partitions with leakage-safe training/evaluation arrows.
- Teaching treatment: Fold partitions with leakage-safe training/evaluation arrows.
- Original sources: `docs/ai/evaluation-experimentation/k-fold-cross-validation.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Neural Network Building Blocks

- Identity: `ai/foundations/neural-building-blocks`. Browsing home: `ai/foundations`. Kind: main.
- Scope and protected material: Activations, normalization, and stop-gradient as distinct operations; preserve parameter and gradient semantics.
- Teaching treatment: An activation curve panel and a computation graph with gradient paths.
- Original sources: `docs/ai/foundations/activation-functions.md`; `docs/ai/foundations/batch-normalization.md`; `docs/ai/foundations/layer-normalization.md`; `docs/ai/foundations/root-mean-square-layer-normalization.md`; `docs/ai/foundations/stop-gradients.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Diffusion and Score-Based Generative Models

- Identity: `ai/generative/diffusion`. Browsing home: `ai/generative/diffusion`. Kind: main.
- Scope and protected material: DDPM derivation plus unifying score/SDE/ODE view; preserve objective parameterization and deterministic/stochastic distinctions.
- Teaching treatment: Forward noising, reverse denoising and alternative sampler paths.
- Original sources: `docs/ai/modalities/diffusion-models/ddpm.md`; `docs/ai/modalities/diffusion-models/unified-diffusion-and-score-models.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Few-Step Diffusion: Consistency and Distillation

- Identity: `ai/generative/diffusion/acceleration`. Browsing home: `ai/generative/diffusion`. Kind: deep-dive.
- Conceptual parent: `ai/generative/diffusion`.
- Scope and protected material: Distinguish consistency training, shortcut/progressive distillation and score identity; retain exact source conditions.
- Teaching treatment: Teacher solver trajectory versus student/consistency mappings.
- Original sources: `docs/ai/modalities/diffusion-models/consistency-and-one-step-diffusion.md`; `docs/ai/modalities/diffusion-models/diffusion-distillation.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Decoding and Sampling

- Identity: `ai/inference/decoding`. Browsing home: `ai/inference/decoding`. Kind: main.
- Scope and protected material: Temperature, top-k/top-p and greedy behavior with exact distribution transformations.
- Teaching treatment: Probability bars with jointly applied filters and normalized final weights.
- Original sources: `docs/ai/inference-serving/decoding/llm-decoding-top-k-sampling-and-temperature.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### LoopCD: Contrastive Decoding from Recurrent Transformer States

- Identity: `ai/inference/decoding/loopcd`. Browsing home: `ai/inference/decoding`. Kind: deep-dive.
- Conceptual parent: `ai/inference/decoding`.
- Scope and protected material: Preserve all substantive original sections, examples, sources and qualifications. Early/late recurrence state guidance and hidden versus logit-space worked comparison.
- Teaching treatment: Early/late recurrence state guidance and hidden versus logit-space worked comparison.
- Original sources: `docs/ai/inference-serving/decoding/loopcd-contrastive-decoding-for-looped-transformers.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### LLM Text Watermarking with SynthID-Text

- Identity: `ai/inference/decoding/watermarking`. Browsing home: `ai/inference/decoding`. Kind: deep-dive.
- Conceptual parent: `ai/inference/decoding`.
- Scope and protected material: Preserve all substantive original sections, examples, sources and qualifications. Tournament sampling/detection diagram with entropy, editing and attribution limits.
- Teaching treatment: Tournament sampling/detection diagram with entropy, editing and attribution limits.
- Original sources: `docs/ai/inference-serving/decoding/llm-text-watermarking-with-synthid-text.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Serving LLMs: Prefill, Decode, and KV Memory

- Identity: `ai/inference/serving`. Browsing home: `ai/inference/serving`. Kind: main.
- Scope and protected material: Retain cache formula/example, capacity versus bandwidth, batching/paging/prefix sharing and disaggregation trade-offs.
- Teaching treatment: Prefill/decode timeline and KV-memory calculator with hardware assumptions.
- Original sources: `docs/ai/inference-serving/caching/kv-cache.md`; `docs/ai/inference-serving/serving-architectures/large-language-model-serving.md`; `docs/ai/inference-serving/serving-architectures/disaggregated-prefill-decode-serving.md`; `docs/ai/inference-serving/performance/llm-inference-economics.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Speculative Decoding

- Identity: `ai/inference/speculation`. Browsing home: `ai/inference/speculation`. Kind: main.
- Scope and protected material: Protect exact accept/residual proof, logit alignment, greedy/sampling differences, bonus token, sampler consistency, history, KV rollback, trees, correctness tests and implementation roadmap.
- Teaching treatment: One exact rejection round; draft tree and cache timeline. Advanced EAGLE/DFlash/DSpark architecture sheets remain connected.
- Original sources: `docs/ai/inference-serving/decoding/speculative-decoding.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Speculative Drafter Architectures

- Identity: `ai/inference/speculation/architectures`. Browsing home: `ai/inference/speculation`. Kind: deep-dive.
- Conceptual parent: `ai/inference/speculation`.
- Scope and protected material: Retain historical Medusa/MTP/EAGLE and parallel DFlash/DFlash2/DSpark mechanisms and chronology; no unsupported SOTA labels.
- Teaching treatment: Aligned feature/token/block/tree drafters; comparison by dependency path.
- Original sources: `docs/ai/inference-serving/decoding/speculative-decoding.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### DSpark: Parallel Drafts and Hardware-Aware Scheduling

- Identity: `ai/inference/speculation/dspark`. Browsing home: `ai/inference/speculation`. Kind: deep-dive.
- Conceptual parent: `ai/inference/speculation`.
- Scope and protected material: Protect backbone, sequential head, confidence head, prefix scheduler, reported conditions and implementation prerequisites.
- Teaching treatment: Draft dependency diagram and prefix-selection cost illustration.
- Original sources: `docs/ai/inference-serving/decoding/speculative-decoding.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Implementing Exact Speculative Decoding

- Identity: `ai/inference/speculation/implementation`. Browsing home: `ai/inference/speculation`. Kind: deep-dive.
- Conceptual parent: `ai/inference/speculation`.
- Scope and protected material: Protect proof, residual sampling, cache lifecycle, alignment, correctness tests, scheduler and benchmark checklist.
- Teaching treatment: Accepted prefix and rejected suffix on a KV timeline; tiny pseudocode steps.
- Original sources: `docs/ai/inference-serving/decoding/speculative-decoding.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### How might LLMs store facts

- Identity: `ai/language/knowledge-storage`. Browsing home: `ai/language`. Kind: reference-to-review.
- Scope and protected material: Preserve all substantive original sections, examples, sources and qualifications. Incomplete source: retain original link/question; only expand after primary-source review, no invented content.
- Teaching treatment: Incomplete source: retain original link/question; only expand after primary-source review, no invented content.
- Original sources: `docs/ai/modalities/nlp/how-might-llms-store-facts.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Tokenization: Words, Bytes, and Latent Patches

- Identity: `ai/language/tokenization`. Browsing home: `ai/language/tokenization`. Kind: main.
- Scope and protected material: BPE and stochastic BytePiece; distinguish segmentation, augmentation and BLT architecture.
- Teaching treatment: Step through merges and alternative segmentations; compare a byte-patch path.
- Original sources: `docs/ai/modalities/nlp/byte-pair-encoding.md`; `docs/ai/modalities/nlp/bytepiece-and-stochastic-tokenization.md`; `docs/ai/architectures/transformers/byte-latent-transformer.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### LoRA versus Full Fine-Tuning

- Identity: `ai/post-training/lora`. Browsing home: `ai/post-training/adaptation`. Kind: deep-dive.
- Scope and protected material: Preserve rank/scaling, MLP/MoE application, batch sensitivity, LR invariances and RL-specific observations.
- Teaching treatment: Low-rank matrix factorization and an annotated capacity/cost comparison.
- Original sources: `docs/ai/training/optimization/lora-vs-full-finetuning.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### GLM-5: From Vibe Coding to Agentic Engineering

- Identity: `ai/model-studies/glm-5-agentic-engineering`. Browsing home: `ai/post-training/agents`. Kind: model-study.
- Collection(s): model-reports.
- Scope and protected material: Protected standalone report: preserve architecture, data, optimization, precision, context schedule, SFT/RL/rewards, harness/environment systems, results, discrepancies and limitations wherever disclosed. Repeated basics may link to concept pages; report-specific details and source conditions must remain. Do not invent undisclosed recipe.
- Teaching treatment: Source-specific annotated architecture plus training timeline; selected original evidence figures with reading guides, not a decorative statistics dashboard.
- Original sources: `docs/ai/architectures/model-reports/glm-5-agentic-engineering.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### MiMo-V2.6: Scaling RL Towards Self-Improvement

- Identity: `ai/model-studies/mimo-v2-6-scaling-rl-towards-self-improvement`. Browsing home: `ai/post-training/agents`. Kind: model-study.
- Collection(s): model-reports.
- Scope and protected material: Protected standalone report: preserve architecture, data, optimization, precision, context schedule, SFT/RL/rewards, harness/environment systems, results, discrepancies and limitations wherever disclosed. Repeated basics may link to concept pages; report-specific details and source conditions must remain. Do not invent undisclosed recipe.
- Teaching treatment: Source-specific annotated architecture plus training timeline; selected original evidence figures with reading guides, not a decorative statistics dashboard.
- Original sources: `docs/ai/architectures/model-reports/mimo-v2-6-scaling-rl-towards-self-improvement.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Agent Training: Tasks, Environments, and Harnesses

- Identity: `ai/post-training/agents`. Browsing home: `ai/post-training/agents`. Kind: main.
- Scope and protected material: Executable task synthesis, environment state, scaffold variation, collection mixture and grading; retain the unpublished multi-harness note without automatically publishing it.
- Teaching treatment: Task/environment/harness/policy separation and effective rollout-mixture diagram.
- Original sources: `docs/ai/training/data/agentic-training-data-and-environment-synthesis.md`; `docs/ai/training/optimization/multi-harness-agentic-rl.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Groupwise Agentic Grading

- Identity: `ai/post-training/agents/grading`. Browsing home: `ai/post-training/agents`. Kind: deep-dive.
- Conceptual parent: `ai/post-training/agents`.
- Scope and protected material: Protect reward synthesis/redistribution, action-level regularization, prompt aggregation, security and failure modes.
- Teaching treatment: Group rubric creation and advantage redistribution with a worked group.
- Original sources: `docs/ai/training/optimization/groupwise-agentic-grading.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Distillation: Targets, Trajectories, and Policies

- Identity: `ai/post-training/distillation`. Browsing home: `ai/post-training/distillation`. Kind: main.
- Scope and protected material: Hard/soft/features, temperature and KL direction; on-policy mismatch, multiple teachers and self-distillation are preserved advanced sections/deep dives.
- Teaching treatment: Teacher/student distribution and on-/off-policy trajectory branching.
- Original sources: `docs/ai/training/losses/knowledge-distillation.md`; `docs/ai/training/optimization/on-policy-distillation.md`; `docs/ai/training/optimization/self-distillation-in-rl-climbs.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### On-Policy Distillation

- Identity: `ai/post-training/distillation/on-policy`. Browsing home: `ai/post-training/distillation`. Kind: deep-dive.
- Conceptual parent: `ai/post-training/distillation`.
- Scope and protected material: Protect reverse-KL derivation, student-policy sampling, teacher token targets, multi-teacher consolidation and failure modes.
- Teaching treatment: Teacher feedback along student-generated branches.
- Original sources: `docs/ai/training/optimization/on-policy-distillation.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Self-Distillation During RL

- Identity: `ai/post-training/distillation/self-distillation`. Browsing home: `ai/post-training/distillation`. Kind: deep-dive.
- Conceptual parent: `ai/post-training/distillation`.
- Scope and protected material: Protect MAI trace selection, diversity, forgetting/failure recovery and evidence qualifiers.
- Teaching treatment: RL search→trace selection→student recovery/consolidation timeline.
- Original sources: `docs/ai/training/optimization/self-distillation-in-rl-climbs.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Preference Optimization

- Identity: `ai/post-training/preferences`. Browsing home: `ai/post-training/preferences`. Kind: main.
- Scope and protected material: DPO objective, reference policy, beta/LR behavior, overfitting and offline/on-policy distinction; retain evidence scope.
- Teaching treatment: Preferred/rejected pair and relative log-odds comparison.
- Original sources: `docs/ai/training/optimization/preference-optimization-for-llms.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Reinforcement Learning for Language Models

- Identity: `ai/post-training/rl`. Browsing home: `ai/post-training/rl`. Kind: main.
- Scope and protected material: Bellman basics are prerequisites, not RLHF algorithms; distinguish optimizer, reward source and rollout policy. Preserve PPO/DPO/RLOO/GRPO/DAPO/GSPO/CISPO/CTPO coverage and compact interview Q&A.
- Teaching treatment: Rollout→reward→advantage→update flow and optimizer/reward axes.
- Original sources: `docs/ai/training/optimization/reinforcement-learning-for-llms.md`; `docs/ai/training/optimization/rl-fine-tuning-for-llms-interview-guide.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Policy Optimization Algorithms Compared

- Identity: `ai/post-training/rl/algorithm-comparison`. Browsing home: `ai/post-training/rl`. Kind: deep-dive.
- Conceptual parent: `ai/post-training/rl`.
- Scope and protected material: Retain PPO/RLOO/GRPO/DAPO/GSPO/CISPO/CTPO derivations, normalization and importance ratio differences. Verification against primary sources is required.
- Teaching treatment: Aligned axes for critics, advantage grouping, ratio unit and clipping.
- Original sources: `docs/ai/training/optimization/rl-fine-tuning-for-llms-interview-guide.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Exploration, Entropy, and the Sharpening Tax

- Identity: `ai/post-training/rl/exploration`. Browsing home: `ai/post-training/rl`. Kind: deep-dive.
- Conceptual parent: `ai/post-training/rl`.
- Scope and protected material: Keep feedback control distinct from PTGS sampling; preserve pass@1/coverage trade-offs and exact integration caveats.
- Teaching treatment: Accuracy/coverage comparison and an entropy control-loop schematic.
- Original sources: `docs/ai/training/optimization/adaptive-entropy-control-in-rl.md`; `docs/ai/training/optimization/sharpening-tax-and-posterior-tempered-group-sampling.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### GRPO and Group-Based Policy Updates

- Identity: `ai/post-training/rl/grpo`. Browsing home: `ai/post-training/rl`. Kind: deep-dive.
- Conceptual parent: `ai/post-training/rl`.
- Scope and protected material: Preserve response/token normalization, old/reference policies, importance ratios, clipping, length/difficulty biases and report modifications.
- Teaching treatment: A small response group with computed advantages and clipping regions.
- Original sources: `docs/ai/training/optimization/group-relative-policy-optimization.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Verifiers and Reward Design

- Identity: `ai/post-training/rl/rewards`. Browsing home: `ai/post-training/rl`. Kind: deep-dive.
- Conceptual parent: `ai/post-training/rl`.
- Scope and protected material: RLVR is a reward choice, not an optimizer; preserve outcome/process rewards, curriculum, verifier exploitation and pipeline variants.
- Teaching treatment: An answer-verification pipeline with adversarial failure examples.
- Original sources: `docs/ai/training/optimization/reinforcement-learning-with-verifiable-rewards.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Why Sparse-Reward RL Can Work

- Identity: `ai/post-training/rl/sparse-rewards`. Browsing home: `ai/post-training/rl`. Kind: deep-dive.
- Conceptual parent: `ai/post-training/rl`.
- Scope and protected material: Protect the bits-per-rollout argument, SNR distinctions, pretrained prior, credit assignment and speculative boundaries.
- Teaching treatment: Dense token targets versus sparse outcome signal with objective-alignment annotations.
- Original sources: `docs/ai/training/optimization/why-sparse-reward-llm-rl-can-work.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Supervised Fine-Tuning and Interface Contracts

- Identity: `ai/post-training/sft`. Browsing home: `ai/post-training/sft`. Kind: main.
- Scope and protected material: Assistant-only masking, templates, terminal tokens, parser constraints and special-token initialization/warmup; preserve exact mismatch failures.
- Teaching treatment: A dialogue token stream with loss mask and deployment parser.
- Original sources: `docs/ai/training/optimization/supervised-fine-tuning-for-llms.md`; `docs/ai/inference-serving/chat-templates-for-llms.md`; `docs/ai/training/optimization/special-token-initialization-in-post-training.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Reasoning Effort and Test-Time Compute

- Identity: `ai/reasoning/effort`. Browsing home: `ai/reasoning`. Kind: main.
- Scope and protected material: Separate sequential/parallel compute, learned effort and hard budgets; preserve proposer/verifier and hybrid model data/interface consequences.
- Teaching treatment: A cost/effort decision map plus parallel voting versus longer trajectories.
- Original sources: `docs/ai/inference-serving/performance/reasoning-effort-control.md`; `docs/ai/inference-serving/performance/test-time-compute.md`; `docs/ai/architectures/hybrid-reasoning-models.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Build a Reasoning Model: The End-to-End Learning Path

- Identity: `ai/reasoning/from-scratch`. Browsing home: `ai/reasoning`. Kind: guided-path.
- Scope and protected material: Protect the purchased-book-derived pipeline, evaluator, sampling/voting/refinement, log probabilities, RLVR/GRPO stabilization and distillation. Main stages remain self-contained; source-specific teaching is not reduced to links.
- Teaching treatment: A stage navigator showing reuse of evaluator and log-probability primitives.
- Original sources: `docs/ai/training/build-a-reasoning-model-from-scratch.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### LLMs Can't Jump: Abduction and Scientific Invention

- Identity: `ai/research/scientific-invention`. Browsing home: `ai/research`. Kind: deep-dive.
- Scope and protected material: Preserve all substantive original sections, examples, sources and qualifications. Hypothesis/testing loop and explicit separation of thesis, historical case and evidence.
- Teaching treatment: Hypothesis/testing loop and explicit separation of thesis, historical case and evidence.
- Original sources: `docs/ai/foundations/llms-cant-jump-abduction-and-scientific-invention.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### The Bellman Equation

- Identity: `ai/rl-foundations/bellman`. Browsing home: `ai/rl-foundations`. Kind: deep-dive.
- Scope and protected material: Preserve all substantive original sections, examples, sources and qualifications. State/action transition example with reward and discounted value.
- Teaching treatment: State/action transition example with reward and discounted value.
- Original sources: `docs/ai/modalities/reinforcement-learning/the-bellman-equation.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### MAI-Thinking-1: Building a Hill-Climbing Machine

- Identity: `ai/model-studies/mai-thinking-1-building-a-hill-climbing-machine`. Browsing home: `ai/training`. Kind: model-study.
- Collection(s): model-reports.
- Scope and protected material: Protected standalone report: preserve architecture, data, optimization, precision, context schedule, SFT/RL/rewards, harness/environment systems, results, discrepancies and limitations wherever disclosed. Repeated basics may link to concept pages; report-specific details and source conditions must remain. Do not invent undisclosed recipe.
- Teaching treatment: Source-specific annotated architecture plus training timeline; selected original evidence figures with reading guides, not a decorative statistics dashboard.
- Original sources: `docs/ai/architectures/model-reports/mai-thinking-1-building-a-hill-climbing-machine.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Qwen 2.5 (Technical Deep Dive)

- Identity: `ai/model-studies/qwen2-5-technical-report`. Browsing home: `ai/training`. Kind: model-study.
- Collection(s): model-reports.
- Scope and protected material: Protected standalone report: preserve architecture, data, optimization, precision, context schedule, SFT/RL/rewards, harness/environment systems, results, discrepancies and limitations wherever disclosed. Repeated basics may link to concept pages; report-specific details and source conditions must remain. Do not invent undisclosed recipe.
- Teaching treatment: Source-specific annotated architecture plus training timeline; selected original evidence figures with reading guides, not a decorative statistics dashboard.
- Original sources: `docs/ai/architectures/model-reports/qwen2-5-technical-report.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### The Llama 3 Herd of Models (Technical Deep Dive)

- Identity: `ai/model-studies/the-llama-3-herd-of-models`. Browsing home: `ai/training`. Kind: model-study.
- Collection(s): model-reports.
- Scope and protected material: Protected standalone report: preserve architecture, data, optimization, precision, context schedule, SFT/RL/rewards, harness/environment systems, results, discrepancies and limitations wherever disclosed. Repeated basics may link to concept pages; report-specific details and source conditions must remain. Do not invent undisclosed recipe.
- Teaching treatment: Source-specific annotated architecture plus training timeline; selected original evidence figures with reading guides, not a decorative statistics dashboard.
- Original sources: `docs/ai/architectures/model-reports/the-llama-3-herd-of-models.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Designing a Pretraining Run

- Identity: `ai/training/design-guide`. Browsing home: `ai/training`. Kind: guided-path.
- Scope and protected material: Protect worked prompt, all follow-up Q&A, preparation checklist and resource/capability decision sequence; technical details remain in canonical notes.
- Teaching treatment: A training-run decision worksheet with assumptions and gates.
- Original sources: `docs/ai/training/pretraining-system-design-interview-guide.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Building a Language Model: The Learning Path

- Identity: `ai/training/from-scratch`. Browsing home: `ai/training`. Kind: guided-path.
- Scope and protected material: Preserve original GPT lesson/source, bigram baseline, attention, transformer and generation sequence; snippets teach individual steps.
- Teaching treatment: A staged architecture diagram with tiny executable examples.
- Original sources: `docs/ai/architectures/transformers/lets-build-gpt-from-scratch.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### An End-to-End Training Playbook

- Identity: `ai/training/playbook`. Browsing home: `ai/training`. Kind: guided-path.
- Scope and protected material: Preserve full Smol source-specific methodology and examples. Link canonical concepts while retaining the connected decision narrative.
- Teaching treatment: A phase timeline with experiment, data, scale-up and post-training gates.
- Original sources: `docs/ai/training/smol-training-playbook.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Training for Long Context

- Identity: `ai/training/context-extension`. Browsing home: `ai/training/context`. Kind: main.
- Scope and protected material: Preserve staged extension, repacking, stage-specific evaluation and positional links; don't merge away source recipes.
- Teaching treatment: A stage timeline with context length, token budget and evaluation gates.
- Original sources: `docs/ai/training/scaling/progressive-context-extension.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Training Data: Mixtures, Novelty, and Memorization

- Identity: `ai/training/data`. Browsing home: `ai/training/data`. Kind: main.
- Scope and protected material: Mixture search and dedup overview; preserve source-specific repetition caps, token/example balance, search recipes and contamination caveats.
- Teaching treatment: Mixture allocation simplex and dedup/novel-token pipeline.
- Original sources: `docs/ai/training/data/data-mixture-optimization.md`; `docs/ai/training/data/deduplication-and-memorization-control.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Optimizing a Data Mixture

- Identity: `ai/training/data/mixture-search`. Browsing home: `ai/training/data`. Kind: deep-dive.
- Conceptual parent: `ai/training/data`.
- Scope and protected material: Preserve Pareto fronts, local/global/surrogate search, annealing ablations, cross-dataset interactions and report provenance.
- Teaching treatment: A bounded mixture search with all demonstration values labeled synthetic.
- Original sources: `docs/ai/training/data/data-mixture-optimization.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Training Stability and Checkpoint Selection

- Identity: `ai/training/diagnostics`. Browsing home: `ai/training/diagnostics`. Kind: main.
- Scope and protected material: Gradient norm/clipping, spike taxonomy, resume effects and generalization fluctuations. Main actionable guide plus retained measured checkpoint study.
- Teaching treatment: Annotated loss/gradient timeline and measured checkpoint comparison with source conditions.
- Original sources: `docs/ai/training/optimization/gradient-norm-and-training-dynamics.md`; `docs/ai/training/optimization/gradient-clipping.md`; `docs/ai/training/optimization/training-loss-patterns.md`; `docs/ai/training/optimization/generalization-dynamics-and-checkpoint-selection.mdx`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Generalization Fluctuations and Checkpoint Choice

- Identity: `ai/training/diagnostics/checkpoint-study`. Browsing home: `ai/training/diagnostics`. Kind: case-study.
- Conceptual parent: `ai/training/diagnostics`.
- Scope and protected material: Retain existing MDX figures/components data, measured findings and limitations; never replace with invented curves.
- Teaching treatment: Original measured checkpoint/transfer comparison with interpretation.
- Original sources: `docs/ai/training/optimization/generalization-dynamics-and-checkpoint-selection.mdx`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Designing Reliable Training Experiments

- Identity: `ai/training/experimentation`. Browsing home: `ai/training/experimentation`. Kind: main.
- Scope and protected material: Compass, cheap baselines, ablations, scale transfer, budget matching, ladders and efficiency gain; keep book/playbook provenance.
- Teaching treatment: An experiment decision loop with a scale-transfer counterexample.
- Original sources: `docs/ai/evaluation-experimentation/llm-ablation-strategy.md`; `docs/ai/training/scaling/scaling-ladders-and-efficiency-gain.md`; `docs/ai/training/optimization/rules-of-engagement-for-llm-training.md`; `docs/ai/training/smol-training-playbook-foundations.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Low-Precision Attention Rounding Bias

- Identity: `ai/training/numerics/attention-rounding-bias`. Browsing home: `ai/training/numerics`. Kind: deep-dive.
- Scope and protected material: Preserve all substantive original sections, examples, sources and qualifications. PV error path, biased versus centered rounding, accumulation and diagnostics.
- Teaching treatment: PV error path, biased versus centered rounding, accumulation and diagnostics.
- Original sources: `docs/ai/training/precision/low-precision-attention-rounding-bias.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Low-Precision Training and Quantization

- Identity: `ai/training/precision`. Browsing home: `ai/training/numerics`. Kind: main.
- Scope and protected material: FP8 format/scaling and QAT distinction; keep rounding-bias diagnosis as a separate linked deep dive.
- Teaching treatment: Quantization bins and tensor/row/channel/block scale comparison.
- Original sources: `docs/ai/training/precision/fp8-training.md`; `docs/ai/training/precision/quantization-aware-training.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Losses and Objectives

- Identity: `ai/training/losses`. Browsing home: `ai/training/objectives`. Kind: main.
- Scope and protected material: CE/BCE and regression essentials; retain coding example, gradient derivation and numerical stability. Split norms/normalization into geometry; scrutinize nonstandard inverse-loss claims.
- Teaching treatment: Regression outlier explorer and CE=entropy+KL distribution bars.
- Original sources: `docs/ai/training/losses/cross-entropy-loss.md`; `docs/ai/training/losses/binary-cross-entropy-loss.md`; `docs/ai/training/losses/l2-norm-and-loss.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Proper Scoring Rules and Fenchel–Young Losses

- Identity: `ai/training/objectives/proper-scoring`. Browsing home: `ai/training/objectives`. Kind: deep-dive.
- Conceptual parent: `ai/training/losses`.
- Scope and protected material: Preserve probability-space versus logit-space gradients, matched maps, sparsity and hypotheses.
- Teaching treatment: CE/Brier loss and gradient comparison with confidence; matched-map diagram.
- Original sources: `docs/ai/training/losses/proper-scoring-rules-and-fenchel-young-losses.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Batch Size, Learning Rate, and Schedules

- Identity: `ai/training/hyperparameters`. Browsing home: `ai/training/optimization`. Kind: main.
- Scope and protected material: Signal/noise, saturation, conditional scaling rules, warmup and WSD; preserve non-universal LR caveats and MuP links.
- Teaching treatment: LR schedules plus a labeled synthetic batch/noise exploration.
- Original sources: `docs/ai/training/optimization/batch-size-and-learning-rate.md`; `docs/ai/training/optimization/learning-rate-warmup.md`; `docs/ai/training/optimization/warmup-stable-decay-learning-rate-schedule.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Muon: Matrix Updates and Newton–Schulz

- Identity: `ai/training/optimization/muon`. Browsing home: `ai/training/optimization`. Kind: deep-dive.
- Conceptual parent: `ai/training/optimizers`.
- Scope and protected material: Preserve exact algorithm, scale matching, per-head handling, parameter assignment and evidence boundaries.
- Teaching treatment: Singular-value transformation and a short update walkthrough.
- Original sources: `docs/ai/training/optimization/muon-optimizer.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Optimizers: AdamW and Muon

- Identity: `ai/training/optimizers`. Browsing home: `ai/training/optimization`. Kind: main.
- Scope and protected material: Distinct elementwise versus matrixwise updates; preserve bias correction, decoupled decay, Newton–Schulz and parameter assignment in advanced sections.
- Teaching treatment: A small matrix update comparison plus EMA memory illustration.
- Original sources: `docs/ai/training/optimization/adamw.md`; `docs/ai/training/optimization/muon-optimizer.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Scaling Laws and Compute Allocation

- Identity: `ai/training/scaling`. Browsing home: `ai/training/scaling`. Kind: main.
- Scope and protected material: Kaplan/Chinchilla, repetition and inference-aware overtraining; preserve assumptions, fitting recipes, source-conditioned constants and deployment objective.
- Teaching treatment: N/D budget plane and Pareto curves; measured versus illustrative data explicitly distinguished.
- Original sources: `docs/ai/training/scaling/scaling-laws.md`; `docs/ai/training/scaling/data-constrained-scaling-laws.md`; `docs/ai/training/scaling/overtraining-and-inference-aware-scaling.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Decomposing Scaling Laws

- Identity: `ai/training/scaling/decomposition`. Browsing home: `ai/training/scaling`. Kind: deep-dive.
- Conceptual parent: `ai/training/scaling`.
- Scope and protected material: Preserve optimization/architecture/data gaps, K meaning and coefficient/exponent distinctions.
- Teaching treatment: Three-gap decomposition and fixed-budget trade-off schematic.
- Original sources: `docs/ai/training/scaling/decomposing-scaling-laws.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Hyperparameter Transfer Across Scale

- Identity: `ai/training/scaling/hyperparameter-transfer`. Browsing home: `ai/training/scaling`. Kind: deep-dive.
- Conceptual parent: `ai/training/scaling`.
- Scope and protected material: Learning-rate/batch extrapolation, MuP and broad sweet spots; distinguish experimental transfer from universal laws.
- Teaching treatment: A small-model ladder with held-fixed parameterization and confidence bands.
- Original sources: `docs/ai/training/scaling/hyperparameter-scaling-laws-for-llm-training.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Coupled Model–Data Scaling

- Identity: `ai/training/scaling/skaling`. Browsing home: `ai/training/scaling`. Kind: deep-dive.
- Conceptual parent: `ai/training/scaling`.
- Scope and protected material: Preserve cross terms, profiling grid, fit identifiability, reported evidence and version inconsistency.
- Teaching treatment: Additive versus coupled response surfaces and profiling samples.
- Original sources: `docs/ai/training/scaling/skaling-coupled-model-data-scaling-laws.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Non-Maximum Suppression (NMS)

- Identity: `ai/vision/detection/nms`. Browsing home: `ai/vision/detection`. Kind: deep-dive.
- Scope and protected material: Preserve all substantive original sections, examples, sources and qualifications. Box-overlap suppression stepper with IoU and variant caveats.
- Teaching treatment: Box-overlap suppression stepper with IoU and variant caveats.
- Original sources: `docs/ai/modalities/computer-vision/non-maximum-suppression.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Self-Supervised Vision Representation Learning

- Identity: `ai/vision/representation-learning`. Browsing home: `ai/vision/representation-learning`. Kind: main.
- Scope and protected material: DINO/iBOT/LeJEPA remain distinct methods; verify objectives and teacher/centering claims against primary sources before migration.
- Teaching treatment: Teacher/student views, global/patch targets and collapse-prevention mechanisms.
- Original sources: `docs/ai/modalities/computer-vision/models/dinov2.md`; `docs/ai/training/losses/self-supervised/ibot.md`; `docs/ai/training/losses/self-supervised/lejepa.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### DINOv2: Learning Reusable Vision Features

- Identity: `ai/vision/representation-learning/dinov2`. Browsing home: `ai/vision/representation-learning`. Kind: case-study.
- Conceptual parent: `ai/vision/representation-learning`.
- Scope and protected material: Retain global/patch objectives, teacher EMA, centering, sharpening and disclosed stabilizers.
- Teaching treatment: Global and patch target paths with mechanism annotations.
- Original sources: `docs/ai/modalities/computer-vision/models/dinov2.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### iBOT: Patch Targets and Online Tokenization

- Identity: `ai/vision/representation-learning/ibot`. Browsing home: `ai/vision/representation-learning`. Kind: case-study.
- Conceptual parent: `ai/vision/representation-learning`.
- Scope and protected material: Preserve iBOT/iBOT++/TIPSv2 distinctions and supplied evidence; primary-source correction before importing existing formulas or DINO comparison.
- Teaching treatment: Masked patches and teacher/student target flow.
- Original sources: `docs/ai/training/losses/self-supervised/ibot.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### LeJEPA: Agreement and Distributional Regularization

- Identity: `ai/vision/representation-learning/lejepa`. Browsing home: `ai/vision/representation-learning`. Kind: case-study.
- Conceptual parent: `ai/vision/representation-learning`.
- Scope and protected material: Preserve predictive objective, SIGReg connection and comparisons; qualify theorem assumptions and collapse claims.
- Teaching treatment: Agreement vectors plus projected distribution constraint.
- Original sources: `docs/ai/training/losses/self-supervised/lejepa.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### SIGReg and Distributional Regularization

- Identity: `ai/vision/representation-learning/sigreg`. Browsing home: `ai/vision/representation-learning`. Kind: deep-dive.
- Conceptual parent: `ai/vision/representation-learning`.
- Scope and protected material: Protect sketching, characteristic-function target, quadrature, Epps–Pulley details; qualify Gaussian-optimality claims and repair placeholder citations.
- Teaching treatment: Projected embedding distributions versus target characteristic functions.
- Original sources: `docs/ai/training/losses/regularization/sketched-isotropic-gaussian-regularization.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

### Systems

#### Low-Latency GPU Collectives

- Identity: `systems/communication/low-latency`. Browsing home: `systems/communication`. Kind: deep-dive.
- Scope and protected material: Protect push/pull, one-/two-shot, synchronization, sentinel/double buffering, LL/LL128 and hardware assumptions.
- Teaching treatment: Per-GPU read/write arrows with explicit owner, barrier and visibility states.
- Original sources: `docs/systems/parallel-computing/low-latency-gpu-collectives.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Inside NCCL

- Identity: `systems/communication/nccl`. Browsing home: `systems/communication`. Kind: deep-dive.
- Scope and protected material: Keep protocols/algorithms/transports distinct, channels, buffers, slots, primitives and benchmarking/debugging findings.
- Teaching treatment: API→channels→chunks→protocol→transport flow with ring/tree timelines.
- Original sources: `docs/systems/parallel-computing/nccl-internals-protocols-algorithms-and-transports.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Designing a Video Platform

- Identity: `systems/design/content-platform`. Browsing home: `systems/design`. Kind: case-study.
- Scope and protected material: Keep requirements, architecture decisions and original details; link concepts instead of repeating basics.
- Teaching treatment: A request/upload/transcode/playback architecture with read/write paths.
- Original sources: `docs/interview-prep/system-design/design-youtube-system-design-interview.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Reasoning About System Design

- Identity: `systems/design/reasoning-checklist`. Browsing home: `systems/design`. Kind: guided-path.
- Scope and protected material: Retain read/write workload, bottleneck and failure prompts; clarify placeholders rather than publishing them unchanged.
- Teaching treatment: A workload→bottleneck→candidate trade-off checklist.
- Original sources: `docs/interview-prep/system-design/8-most-important-system-design-concepts-you-should-know.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Distributed Services: Scaling and Reliability

- Identity: `systems/distributed-services`. Browsing home: `systems/distributed-services`. Kind: main.
- Scope and protected material: CAP conditions, PACELC, replication/quorums/failover, sharding and load-balancing; preserve conceptual distinctions and source examples.
- Teaching treatment: Replica state/failure examples and request/data routing diagrams.
- Original sources: `docs/systems/distributed-systems/availability-vs-consistency-cap.md`; `docs/systems/distributed-systems/consistency-patterns.md`; `docs/systems/distributed-systems/availability-patterns.md`; `docs/systems/distributed-systems/database-sharding.md`; `docs/systems/distributed-systems/load-balancer.md`; `docs/systems/distributed-systems/scalability.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Training Compute and Memory Accounting

- Identity: `systems/distributed-training/capacity`. Browsing home: `systems/distributed-training`. Kind: deep-dive.
- Scope and protected material: Protect einsum counting, 2P/6P limits, quadratic attention, active/total MoE costs, memory, checkpoint/reliability arithmetic and all worked examples.
- Teaching treatment: A parameter/token/memory worksheet with visible assumptions and units.
- Original sources: `docs/ai/training/scaling/transformer-performance-accounting.md`; `docs/ai/training/scaling/llm-training-capacity-planning.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Tensor Layouts, Collectives, and Topology

- Identity: `systems/distributed-training/layouts`. Browsing home: `systems/distributed-training`. Kind: deep-dive.
- Conceptual parent: `systems/distributed-training/parallelism`.
- Scope and protected material: Protect four sharded-matmul cases, communication transformations, overlap, roofline inequalities and achieved network constraints.
- Teaching treatment: A sharded matmul/layout transform explorer with named mesh axes.
- Original sources: `docs/systems/parallel-computing/sharded-matrix-multiplication-and-collectives.md`; `docs/systems/parallel-computing/llm-training-parallelism-rooflines.md`; `docs/systems/parallel-computing/hardware-topology-and-parallelism.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Sequence and Context Parallelism

- Identity: `systems/distributed-training/long-sequences`. Browsing home: `systems/distributed-training`. Kind: deep-dive.
- Conceptual parent: `systems/distributed-training/parallelism`.
- Scope and protected material: Protect SP versus CP distinction, ring attention, zig-zag balance and communication costs.
- Teaching treatment: Sequence shards and token circulation with causal load balancing.
- Original sources: `docs/systems/parallel-computing/sequence-parallelism.md`; `docs/systems/parallel-computing/context-parallelism.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Parallelism for Model Training

- Identity: `systems/distributed-training/parallelism`. Browsing home: `systems/distributed-training`. Kind: main.
- Scope and protected material: All DP/TP/PP/SP/CP/EP and optimizer-state sharding; preserve communication, bubbles, zig-zag CP, ZeRO stages and hybrid interactions.
- Teaching treatment: A named-device mesh with tensors/batch/sequence/layers/expert partitioning.
- Original sources: `docs/systems/parallel-computing/data-parallelism.md`; `docs/systems/parallel-computing/tensor-parallelism.md`; `docs/systems/parallel-computing/pipeline-parallelism.md`; `docs/systems/parallel-computing/sequence-parallelism.md`; `docs/systems/parallel-computing/context-parallelism.md`; `docs/ai/training/distributed-optimization/zero.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Pipeline Schedules and Bubbles

- Identity: `systems/distributed-training/pipelines`. Browsing home: `systems/distributed-training`. Kind: deep-dive.
- Conceptual parent: `systems/distributed-training/parallelism`.
- Scope and protected material: Preserve GPipe, 1F1B, interleaving, zero-bubble, stage balance and inference caveat.
- Teaching treatment: GPU-stage/microbatch timeline with bubbles and live activations.
- Original sources: `docs/systems/parallel-computing/pipeline-parallelism.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### ZeRO and Sharded Training State

- Identity: `systems/distributed-training/state-sharding`. Browsing home: `systems/distributed-training`. Kind: deep-dive.
- Conceptual parent: `systems/distributed-training/parallelism`.
- Scope and protected material: Preserve ZeRO stages, OSG ownership, communication and prefetch ordering.
- Teaching treatment: Optimizer/gradient/parameter ownership across stages.
- Original sources: `docs/ai/training/distributed-optimization/zero.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Tensor Parallelism in Detail

- Identity: `systems/distributed-training/tensor-parallelism`. Browsing home: `systems/distributed-training`. Kind: deep-dive.
- Conceptual parent: `systems/distributed-training/parallelism`.
- Scope and protected material: Preserve row/column projection order, activation layouts, attention/MLP/SP interaction, roofline and failures.
- Teaching treatment: Paired projections with exact communication boundaries.
- Original sources: `docs/systems/parallel-computing/tensor-parallelism.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### High-Density GPU Infrastructure

- Identity: `systems/hardware/gpu-facilities`. Browsing home: `systems/hardware`. Kind: deep-dive.
- Scope and protected material: Preserve all substantive original sections, examples, sources and qualifications. Power/cooling/support infrastructure flow with failure cases.
- Teaching treatment: Power/cooling/support infrastructure flow with failure cases.
- Original sources: `docs/systems/infrastructure/high-density-gpu-infrastructure.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### FlashAttention

- Identity: `systems/kernels/flashattention`. Browsing home: `systems/kernels`. Kind: deep-dive.
- Conceptual parent: `ai/architectures/attention`.
- Scope and protected material: Preserve all substantive original sections, examples, sources and qualifications. Tiled attention/online softmax with HBM/SRAM traffic; preserve backward and version evidence.
- Teaching treatment: Tiled attention/online softmax with HBM/SRAM traffic; preserve backward and version evidence.
- Original sources: `docs/ai/architectures/transformers/flashattention.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### DNS, CDNs, and Content Delivery

- Identity: `systems/networking/delivery`. Browsing home: `systems/networking`. Kind: main.
- Scope and protected material: DNS lookup/caching and CDN request path remain distinct stages.
- Teaching treatment: Annotated client→resolver→edge→origin path with cold/warm states.
- Original sources: `docs/systems/networking/domain-name-system-dns.md`; `docs/systems/distributed-systems/content-delivery-network.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Performance, Throughput, and Rooflines

- Identity: `systems/performance`. Browsing home: `systems/performance`. Kind: main.
- Scope and protected material: Latency/throughput/scalability distinctions, MFU numerator and goodput link; preserve all worked roofline examples and practical caveats.
- Teaching treatment: Arithmetic-intensity roofline plus batch/latency/throughput trade-off.
- Original sources: `docs/systems/performance/performance-vs-scalability.md`; `docs/systems/performance/latency-vs-throughput.md`; `docs/systems/performance/roofline-model.md`; `docs/systems/performance/model-flops-utilization-mfu.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Asynchronous RL Systems

- Identity: `systems/rl/architecture`. Browsing home: `systems/rl`. Kind: main.
- Scope and protected material: Protect learner/rollout synchronization, staleness, runtime numerics, partial rollouts, environment suspension, KV lifecycle, backpressure and verifier isolation.
- Teaching treatment: Learner/rollout/environment timeline showing policy versions and unfinished trajectories.
- Original sources: `docs/systems/infrastructure/asynchronous-rl-infrastructure.md`; `docs/ai/training/optimization/long-horizon-agentic-rl-infrastructure.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### TTS Concurrent Real-Time Stream Capacity

- Identity: `systems/serving/tts-capacity`. Browsing home: `systems/serving`. Kind: deep-dive.
- Scope and protected material: Preserve all substantive original sections, examples, sources and qualifications. Compute/memory/network stream-capacity worksheet and bottleneck example.
- Teaching treatment: Compute/memory/network stream-capacity worksheet and bottleneck example.
- Original sources: `docs/ai/inference-serving/performance/tts-stream-capacity.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Reliable Training Operations

- Identity: `systems/training-operations`. Browsing home: `systems/training-operations`. Kind: main.
- Scope and protected material: Goodput, determinism, fault tolerance and framework selection remain operational decisions, not reduced to MFU.
- Teaching treatment: Checkpoint/restart timeline and useful-work accounting.
- Original sources: `docs/systems/infrastructure/goodput-determinism-and-fault-tolerance.md`; `docs/systems/infrastructure/choosing-an-llm-training-framework.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

### Algorithms

#### Heaps and Priority Queues

- Identity: `algorithms/data-structures/heaps`. Browsing home: `algorithms/data-structures`. Kind: main.
- Scope and protected material: Unify abstraction versus implementation, core operations, Python tie-breakers, bounded queues, scheduling and lazy deletion.
- Teaching treatment: Insertion/pop heap animation and a queue/heap distinction panel.
- Original sources: `docs/algorithms/data-structures/heap.md`; `docs/algorithms/data-structures/priority-queues.md`; `docs/interview-prep/neetcode-roadmap/heap-priority-queue.md`; `docs/interview-prep/leetcode/1046-last-stone-weight.md`.
- Integrated examples: 1046 - Last Stone Weight (`#exercise-1046-last-stone-weight`). Preserve each original solution and route.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Linked List

- Identity: `algorithms/data-structures/linked-lists`. Browsing home: `algorithms/data-structures`. Kind: main.
- Collection(s): neetcode.
- Scope and protected material: Preserve recognition signals, invariants, proof/complexity, variants, mistakes and practice progression. Pointer ownership, dummy node, reverse, merge and fast/slow steps.
- Teaching treatment: Pointer ownership, dummy node, reverse, merge and fast/slow steps.
- Original sources: `docs/interview-prep/neetcode-roadmap/linked-list.md`; `docs/interview-prep/leetcode/21-merge-two-sorted-lists.md`.
- Integrated examples: 21 - Merge Two Sorted Lists (`#exercise-21-merge-two-sorted-lists`). Preserve each original solution and route.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Stack

- Identity: `algorithms/data-structures/stacks`. Browsing home: `algorithms/data-structures`. Kind: main.
- Collection(s): neetcode.
- Scope and protected material: Preserve recognition signals, invariants, proof/complexity, variants, mistakes and practice progression. Unresolved work and monotonic stack push/pop trace.
- Teaching treatment: Unresolved work and monotonic stack push/pop trace.
- Original sources: `docs/interview-prep/neetcode-roadmap/stack.md`; `docs/interview-prep/leetcode/20-valid-parentheses.md`.
- Integrated examples: 20 - Valid Parentheses (`#exercise-20-valid-parentheses`). Preserve each original solution and route.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Trees: Traversal and Recursive Reasoning

- Identity: `algorithms/data-structures/trees`. Browsing home: `algorithms/data-structures`. Kind: main.
- Scope and protected material: Merge duplicated tree notes but preserve DFS orders, call stack, BFS, subtree return/state, BST and LCA patterns.
- Teaching treatment: Step-through DFS/BFS with stack/queue and bottom-up return values.
- Original sources: `docs/algorithms/data-structures/trees.md`; `docs/interview-prep/neetcode-roadmap/trees.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Tries

- Identity: `algorithms/data-structures/tries`. Browsing home: `algorithms/data-structures`. Kind: main.
- Collection(s): neetcode.
- Scope and protected material: Preserve recognition signals, invariants, proof/complexity, variants, mistakes and practice progression. Prefix branching, terminal metadata and wildcard/backtracking path.
- Teaching treatment: Prefix branching, terminal metadata and wildcard/backtracking path.
- Original sources: `docs/interview-prep/neetcode-roadmap/tries.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Graphs

- Identity: `algorithms/graphs/traversal-and-connectivity`. Browsing home: `algorithms/graphs`. Kind: main.
- Collection(s): neetcode.
- Scope and protected material: Preserve recognition signals, invariants, proof/complexity, variants, mistakes and practice progression. DFS/BFS, multi-source, cycles, topo/Union-Find with stack/queue/dependency visuals.
- Teaching treatment: DFS/BFS, multi-source, cycles, topo/Union-Find with stack/queue/dependency visuals.
- Original sources: `docs/interview-prep/neetcode-roadmap/graphs.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Advanced Graphs

- Identity: `algorithms/graphs/weighted-and-structured`. Browsing home: `algorithms/graphs`. Kind: main.
- Collection(s): neetcode.
- Scope and protected material: Preserve recognition signals, invariants, proof/complexity, variants, mistakes and practice progression. Choose algorithms by edge weights/objective; shortest paths, MST, Euler tour and all-pairs remain distinct labeled sections.
- Teaching treatment: Choose algorithms by edge weights/objective; shortest paths, MST, Euler tour and all-pairs remain distinct labeled sections.
- Original sources: `docs/interview-prep/neetcode-roadmap/advanced-graphs.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Arrays and Hashing

- Identity: `algorithms/patterns/arrays-and-hashing`. Browsing home: `algorithms/patterns`. Kind: main.
- Collection(s): neetcode.
- Scope and protected material: Preserve recognition signals, invariants, proof/complexity, variants, mistakes and practice progression. Complement/frequency/canonical keys and prefix/suffix state visualization.
- Teaching treatment: Complement/frequency/canonical keys and prefix/suffix state visualization.
- Original sources: `docs/interview-prep/neetcode-roadmap/arrays-and-hashing.md`; `docs/interview-prep/leetcode/1-two-sum.md`; `docs/interview-prep/leetcode/121-best-time-to-buy-and-sell.md`; `docs/interview-prep/leetcode/14-longest-common-prefix.md`; `docs/interview-prep/leetcode/169-majority-element.md`; `docs/interview-prep/leetcode/380-insert-delete-getrandom-o-1.md`.
- Integrated examples: 1 - Two sum (`#exercise-1-two-sum`); 121 - Best time to buy and sell (`#exercise-121-best-time-to-buy-and-sell`); 14 - Longest common prefix (`#exercise-14-longest-common-prefix`); 169 - Majority Element (`#exercise-169-majority-element`); 380 - Insert Delete GetRandom O(1) (`#exercise-380-insert-delete-getrandom-o-1`). Preserve each original solution and route.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Backtracking

- Identity: `algorithms/patterns/backtracking`. Browsing home: `algorithms/patterns`. Kind: main.
- Collection(s): neetcode.
- Scope and protected material: Preserve recognition signals, invariants, proof/complexity, variants, mistakes and practice progression. Choose→explore→undo and pruning tree with visible state restoration.
- Teaching treatment: Choose→explore→undo and pruning tree with visible state restoration.
- Original sources: `docs/interview-prep/neetcode-roadmap/backtracking.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Binary Search

- Identity: `algorithms/patterns/binary-search`. Browsing home: `algorithms/patterns`. Kind: main.
- Collection(s): neetcode.
- Scope and protected material: Preserve recognition signals, invariants, proof/complexity, variants, mistakes and practice progression. Boundary/monotonic predicate stepper, answer search and rotated-space caveats.
- Teaching treatment: Boundary/monotonic predicate stepper, answer search and rotated-space caveats.
- Original sources: `docs/interview-prep/neetcode-roadmap/binary-search.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Bit Manipulation and Alignment

- Identity: `algorithms/patterns/bits`. Browsing home: `algorithms/patterns`. Kind: main.
- Scope and protected material: XOR/subsets/fixed widths plus power-of-two alignment; preserve positive-integer and overflow/negative caveats.
- Teaching treatment: Bit rows and alignment masks with explicitly selected width.
- Original sources: `docs/interview-prep/neetcode-roadmap/bit-manipulation.md`; `docs/programming/python/bit-tricks-powers-of-two-and-alignment.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Dynamic Programming: State, Transitions, and Order

- Identity: `algorithms/patterns/dynamic-programming`. Browsing home: `algorithms/patterns`. Kind: main.
- Scope and protected material: 1D/2D are state dimensions, not unrelated techniques; preserve grid/LCS/edit/knapsack/interval cases and space-compression hazards.
- Teaching treatment: Recursion→memoization→table stepper with dependencies and rolling-state comparison.
- Original sources: `docs/interview-prep/neetcode-roadmap/one-dimensional-dynamic-programming.md`; `docs/interview-prep/neetcode-roadmap/two-dimensional-dynamic-programming.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Greedy

- Identity: `algorithms/patterns/greedy`. Browsing home: `algorithms/patterns`. Kind: main.
- Collection(s): neetcode.
- Scope and protected material: Preserve recognition signals, invariants, proof/complexity, variants, mistakes and practice progression. Exchange/dominance/stay-ahead proofs and a counterexample; no local-choice guarantee without proof.
- Teaching treatment: Exchange/dominance/stay-ahead proofs and a counterexample; no local-choice guarantee without proof.
- Original sources: `docs/interview-prep/neetcode-roadmap/greedy.md`; `docs/interview-prep/leetcode/122-best-time-to-buy-and-sell-stock-ii.md`; `docs/interview-prep/leetcode/45-jump-game-ii.md`; `docs/interview-prep/leetcode/55-jump-game.md`.
- Integrated examples: 122 - Best time to buy and sell stock II (`#exercise-122-best-time-to-buy-and-sell-stock-ii`); 45 - Jump Game II (`#exercise-45-jump-game-ii`); 55 - Jump Game (`#exercise-55-jump-game`). Preserve each original solution and route.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Intervals

- Identity: `algorithms/patterns/intervals`. Browsing home: `algorithms/patterns`. Kind: main.
- Collection(s): neetcode.
- Scope and protected material: Preserve recognition signals, invariants, proof/complexity, variants, mistakes and practice progression. Overlap/merge/sweep/meeting-room timelines with boundary conventions.
- Teaching treatment: Overlap/merge/sweep/meeting-room timelines with boundary conventions.
- Original sources: `docs/interview-prep/neetcode-roadmap/intervals.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Math and Geometry

- Identity: `algorithms/patterns/numbers-and-geometry`. Browsing home: `algorithms/patterns`. Kind: main.
- Collection(s): neetcode.
- Scope and protected material: Preserve recognition signals, invariants, proof/complexity, variants, mistakes and practice progression. GCD, modular arithmetic, matrix traversal, exact slope and signed area examples.
- Teaching treatment: GCD, modular arithmetic, matrix traversal, exact slope and signed area examples.
- Original sources: `docs/interview-prep/neetcode-roadmap/math-and-geometry.md`; `docs/interview-prep/leetcode/13-roman-to-integer.md`; `docs/interview-prep/leetcode/2-palindrome-number.md`.
- Integrated examples: 13 - Roman to integer (`#exercise-13-roman-to-integer`); 2 - Palindrome number (`#exercise-2-palindrome-number`). Preserve each original solution and route.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Top-K, Selection, and Sorted Streams

- Identity: `algorithms/patterns/selection-merging`. Browsing home: `algorithms/patterns`. Kind: deep-dive.
- Scope and protected material: Retain top-k, quickselect average/worst guarantees, k-way merge and two-heap median invariants as separate modes.
- Teaching treatment: Partition step, merge frontier and two-heap balance examples.
- Original sources: `docs/algorithms/patterns/top-k-pattern.md`; `docs/algorithms/selection/quickselect.md`; `docs/algorithms/patterns/k-way-merge.md`; `docs/algorithms/patterns/two-heaps-pattern.md`; `docs/interview-prep/leetcode/215-kth-largest-element-in-an-array.md`; `docs/interview-prep/leetcode/274-h-index.md`.
- Integrated examples: 215 - Kth Largest Element in an Array (`#exercise-215-kth-largest-element-in-an-array`); 274 - H-Index (`#exercise-274-h-index`). Preserve each original solution and route.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Sliding Window

- Identity: `algorithms/patterns/sliding-window`. Browsing home: `algorithms/patterns`. Kind: main.
- Collection(s): neetcode.
- Scope and protected material: Preserve recognition signals, invariants, proof/complexity, variants, mistakes and practice progression. Window boundaries with validity invariant, frequency state and negative-value caveats.
- Teaching treatment: Window boundaries with validity invariant, frequency state and negative-value caveats.
- Original sources: `docs/interview-prep/neetcode-roadmap/sliding-window.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Two Pointers

- Identity: `algorithms/patterns/two-pointers`. Browsing home: `algorithms/patterns`. Kind: main.
- Collection(s): neetcode.
- Scope and protected material: Preserve recognition signals, invariants, proof/complexity, variants, mistakes and practice progression. Opposite/read-write/fast-slow/center-expansion invariants as selectable small traces.
- Teaching treatment: Opposite/read-write/fast-slow/center-expansion invariants as selectable small traces.
- Original sources: `docs/interview-prep/neetcode-roadmap/two-pointers.md`; `docs/interview-prep/leetcode/189-rotate-array.md`; `docs/interview-prep/leetcode/26-remove-duplicates-from-sorted-array.md`; `docs/interview-prep/leetcode/27-remove-element.md`; `docs/interview-prep/leetcode/80-remove-duplicates-from-sorted-array-ii.md`; `docs/interview-prep/leetcode/88-merge-sorted-array.md`.
- Integrated examples: 189 - Rotate Array (`#exercise-189-rotate-array`); 26 - Remove Duplicates from Sorted Array (`#exercise-26-remove-duplicates-from-sorted-array`); 27 - Remove Element (`#exercise-27-remove-element`); 80 - Remove duplicates from sorted array II (`#exercise-80-remove-duplicates-from-sorted-array-ii`); 88 - Merge sorted array (`#exercise-88-merge-sorted-array`). Preserve each original solution and route.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Sorting: Insertion, Merge, and Partition

- Identity: `algorithms/sorting`. Browsing home: `algorithms/patterns`. Kind: deep-dive.
- Scope and protected material: Preserve existing sorting diagrams/examples, correct oversimplified complexity and optimality claims; link quickselect partitioning.
- Teaching treatment: Tiny array steps for three strategies with auxiliary memory shown.
- Original sources: `docs/interview-prep/algorithms/interview-algorithms.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Choosing an Algorithm

- Identity: `algorithms/selection-guide`. Browsing home: `algorithms/problem-solving`. Kind: main.
- Scope and protected material: Preserve constraint table, decision tree, negative-window caveat, query/memory dimensions and worked subset-sum examples; consolidate short overview placeholders without losing sorting material.
- Teaching treatment: A decision tree that shows necessary structure/proof conditions, not a guaranteed classifier.
- Original sources: `docs/interview-prep/neetcode-roadmap/choosing-algorithms-from-constraints.md`; `docs/interview-prep/algorithms/top-6-coding-interview-concepts.md`; `docs/interview-prep/algorithms/interview-algorithms.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

### Mathematics

#### Derivatives, Gradients, and Backpropagation

- Identity: `math/calculus/differentiation`. Browsing home: `math/calculus`. Kind: main.
- Scope and protected material: Partial/product/chain rules, gradient direction/magnitude, examples and backward accumulation; preserve assumptions and geometry.
- Teaching treatment: A tiny computational graph and contour plot with forward/backward steps.
- Original sources: `docs/math/calculus/partial-derivatives.md`; `docs/math/calculus/product-rule.md`; `docs/math/calculus/chain-rule.md`; `docs/math/calculus/gradient-direction-and-magnitude.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Cross Product

- Identity: `math/geometry/cross-product`. Browsing home: `math/geometry`. Kind: deep-dive.
- Scope and protected material: Preserve all substantive original sections, examples, sources and qualifications. Vector orientation and parallelogram area; distinguish 2D signed determinant in algorithm notes.
- Teaching treatment: Vector orientation and parallelogram area; distinguish 2D signed determinant in algorithm notes.
- Original sources: `docs/math/linear-algebra/cross-product.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Norms, Normalization, and Embedding Geometry

- Identity: `math/geometry/embeddings`. Browsing home: `math/geometry`. Kind: main.
- Conceptual parent: `ai/training/losses`.
- Scope and protected material: Separate vector norm, unit normalization, prediction loss and parameter penalties; preserve embedding context while fixing unsupported collapse claims.
- Teaching treatment: Vectors on a unit circle and norm/distance comparison.
- Original sources: `docs/ai/training/losses/l2-norm-and-loss.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Entropy, Cross-Entropy, and Divergence

- Identity: `math/information-theory`. Browsing home: `math/information-theory`. Kind: main.
- Scope and protected material: Protect coding derivation, units, KL support/asymmetry/direction, JSD bounds and mutual-information interpretation; CE training details link to losses.
- Teaching treatment: Distribution bars, code lengths and entropy+KL stacked cost; non-overlap shows infinite KL.
- Original sources: `docs/math/probability/entropy.md`; `docs/math/probability/kullback-leibler-divergence.md`; `docs/math/probability/jensen-shannon-divergence.md`; `docs/ai/foundations/prediction-compression-and-entropy.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Compression-Based Similarity and Language Trees

- Identity: `math/information-theory/compression-similarity`. Browsing home: `math/information-theory`. Kind: deep-dive.
- Conceptual parent: `math/information-theory`.
- Scope and protected material: Preserve all substantive original sections, examples, sources and qualifications. Directional compression costs and clustering; preserve compressor/order/topic/encoding caveats.
- Teaching treatment: Directional compression costs and clustering; preserve compressor/order/topic/encoding caveats.
- Original sources: `docs/ai/foundations/compression-based-similarity-and-language-trees.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Local Minima in High-Dimensional Landscapes

- Identity: `math/optimization/high-dimensional-landscapes`. Browsing home: `math/optimization`. Kind: deep-dive.
- Scope and protected material: Preserve all substantive original sections, examples, sources and qualifications. Curvature/eigenvalue picture; preserve random-matrix/Kac–Rice/Morse conditions and caveats.
- Teaching treatment: Curvature/eigenvalue picture; preserve random-matrix/Kac–Rice/Morse conditions and caveats.
- Original sources: `docs/ai/training/optimization/local-minima-in-high-dimensional-landscapes.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Conditioning, Bayes, and Total Probability

- Identity: `math/probability/conditioning`. Browsing home: `math/probability`. Kind: main.
- Scope and protected material: Total probability diagnostic-test example preserved; Bayes/conditioning overview supported by toolkit sections.
- Teaching treatment: A probability tree with population counts and base rates.
- Original sources: `docs/math/probability/law-of-total-probability.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Distributions: CDFs and Characteristic Functions

- Identity: `math/probability/distributions`. Browsing home: `math/probability`. Kind: main.
- Scope and protected material: Preserve PMF/PDF/CDF/quantile relations, characteristic-function uniqueness/moments, empirical forms and normality-testing link.
- Teaching treatment: Probability mass/cumulative view plus a frequency-space comparison.
- Original sources: `docs/math/probability/cumulative-distribution-function.md`; `docs/math/probability/characteristic-function.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### A Toolkit for Mathematical Problem Solving

- Identity: `math/problem-solving`. Browsing home: `math/problem-solving`. Kind: guided-path.
- Scope and protected material: Protect counting, expectation/indicators, Poisson processes, information bounds, pigeonhole, invariants, monovariants, rates and worked examples. Keep a concise main guide with anchored derivations.
- Teaching treatment: Worked-example cards with revealable reasoning and a small Poisson arrival diagram.
- Original sources: `docs/interview-prep/brain-teaser-problem-solving-toolkit.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Expectation, Covariance, and Online Estimation

- Identity: `math/statistics/estimation`. Browsing home: `math/statistics`. Kind: main.
- Scope and protected material: Protect joint-PMF covariance worked example and incremental-average derivation; distinguish dependence from covariance.
- Teaching treatment: Joint probability grid and sequential running-average update.
- Original sources: `docs/math/probability/covariance-from-joint-pmf.md`; `docs/math/statistics/incremental-average-formula.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Sampling, Uncertainty, and Statistical Tests

- Identity: `math/statistics/experiments`. Browsing home: `math/statistics`. Kind: main.
- Scope and protected material: Sampling distributions/CLT conditions, power/type errors and A/B practical impact; retain source-specific formulas and pitfalls.
- Teaching treatment: Repeated-sampling simulation plus error/power decision diagram.
- Original sources: `docs/math/statistics/sampling-distribution-of-the-mean.md`; `docs/math/statistics/statistical-power-and-type-i-ii-errors.md`; `docs/ai/evaluation-experimentation/a-b-testing.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

### Engineering

#### GDB

- Identity: `engineering/debugging/gdb`. Browsing home: `engineering/debugging`. Kind: reference-to-review.
- Scope and protected material: Preserve all substantive original sections, examples, sources and qualifications. Incomplete reference: retain original material, develop a tiny breakpoint/stack inspection walkthrough.
- Teaching treatment: Incomplete reference: retain original material, develop a tiny breakpoint/stack inspection walkthrough.
- Original sources: `docs/tooling/debugging/gdb.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Wireshark

- Identity: `engineering/network-analysis/wireshark`. Browsing home: `engineering/network-analysis`. Kind: reference-to-review.
- Scope and protected material: Preserve all substantive original sections, examples, sources and qualifications. Incomplete reference: preserve original link, then a source-verified packet trace with field labels.
- Teaching treatment: Incomplete reference: preserve original link, then a source-verified packet trace with field labels.
- Original sources: `docs/tooling/network-analysis/wireshark.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### Profiling GPU Programs

- Identity: `engineering/profiling`. Browsing home: `engineering/profiling`. Kind: main.
- Scope and protected material: Keep PyTorch op→kernel ownership versus Nsight cross-system timeline; protect steady-state setup, fusion taxonomy, compile traces and nsys/ncu distinctions.
- Teaching treatment: An annotated representative trace with launch, compute, copy and sync regions.
- Original sources: `docs/tooling/profiling/nsys-profiler.md`; `docs/tooling/profiling/pytorch-profiler-and-gpu-trace-reading.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

### Security

#### ELF x86 - Race condition

- Identity: `security/concurrency/race-condition-lab`. Browsing home: `security/concurrency`. Kind: reference-to-review.
- Scope and protected material: Preserve all substantive original sections, examples, sources and qualifications. Preserve challenge steps, command/output provenance and timing diagram; distinguish observed and planned steps.
- Teaching treatment: Preserve challenge steps, command/output provenance and timing diagram; distinguish observed and planned steps.
- Original sources: `docs/security/writeups/elf-x86-race-condition.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.

#### ELF ARM - Stack buffer overflow - basic

- Identity: `security/memory-safety/arm-stack-lab`. Browsing home: `security/memory-safety`. Kind: reference-to-review.
- Scope and protected material: Preserve all substantive original sections, examples, sources and qualifications. Preserve original lab/source as unfinished; only describe verified progress, never invent successful exploitation.
- Teaching treatment: Preserve original lab/source as unfinished; only describe verified progress, never invent successful exploitation.
- Original sources: `docs/security/writeups/elf-arm-stack-buffer-overflow-basic.md`.
- Migration status: proposed; full reading, factual/source verification, section retention, rendering and route QA pending.
