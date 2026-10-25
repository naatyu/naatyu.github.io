# Supervised Fine-Tuning and Adaptation — source and model audit

## Notation and worked comparison — 2026-10-14

Reviewed the current reader's normalization, LoRA, scaling and coordinate-invariance sections in context. Thirteen inline expressions now use the shared renderer, in addition to the existing three shape/count expressions. The old vocabulary partition is defined explicitly; normalization shrinkage and KL drift retain the fixed-logit/input-row caveat. Merging retains dropout/arithmetic/rounding conditions. Standard and rank-stabilized scaling are distinct.

The dense rescaling paragraph is now a four-row comparison with the same assigned settings. Both resulting coordinates are shown explicitly:0.0002 and100. Optimizer-state,epsilon,clipping,decay,precision and dropout caveats remain. The table's1/3 uses a full-size fraction after native inspection found the ordinary inline fraction too small. Removed duplicate arrows from related links. No empirical result or heuristic changed.

`test-sft-notation.mjs` checks thirteen exact annotations,the parsed twelve table cells and retained conditions. Forty-one independent weighted KL calculations agree with the new-token demonstration;the assigned LoRA rescaling values and coordinates are checked separately. Existing299 model cases remain. The first generated edit incorrectly escaped the table fraction;KaTeX rejected it,then the source was corrected before focused10771/29527 passes. SFT now has24sections,10display+16inline=26MathML roots. Final suite evidence is in migration-progress.md.

Native finalcandidate0hYBHo at1280/390px: rescaling table,new-token partition/probability/KL and caveat screenshots inspected;26math roots,no errors/foreign namespaces/page overflow;mobile table fits258px. Existing long displays retain local scrolling. These checks are not full dynamic/accessibility/source/figure certification. Finalpreview93108 stopped130;earlier43600 stopped130;temporary tab closed,viewport reset,warning/error logs empty. Global raw queue175manual candidates;SFTone intentional LoRA scene summary. Original bodies/production unchanged,no retirement,commit,push/deploy. Historical38-reader count below is not the current54-reader corpus status. Full source/editorial/native/release requirements remain.

Updated 2026-10-05. A local draft reader is now integrated in the atlas as `post-training/sft`. The registry contains 38 readers (one reviewed pilot and 37 drafts), with 16 topics not started. Zero production-ready/deployed. No originals are retired.

## Scope and preservation

Read all four original bodies completely: Supervised Fine-Tuning for LLMs, Chat Templates for LLMs, Special Token Initialization in Post-Training and LoRA vs Full Fine-Tuning. All four hashes match the baseline ledger. Targeted image/import/component scan found no embedded asset references. Read the Smol playbook's adjacent SFT/template/baseline section as supporting context; this does not constitute a new full-body review of that report.

| Source | SHA-256 |
| --- | --- |
| Chat Templates | be293a1ac5725ba71b58432032141edd62074a8671fcfb887aef3329a9e35349 |
| LoRA vs FullFT | f872638864e1085b2384cba22d1aff0051056cd27ca4d82a5caa94ec2a7845f7 |
| Special Token Initialization | 1aa87415e7c4b33996f7213b773d69a6200428757a7364c01b362b111522e28a |
| SFT | bf09d361bfade607720347474f816ec710e2b7583c521348cfccaee2349705d8 |

## Fresh primary checks

- Thinking Machines, LoRA Without Regret: main experimental setup, rank/layer/batch/RL results, hyperparameter scaling and conditional information argument. Ranks 1–512, separate LR sweeps, constant schedules, Llama/Qwen families, Tulu3/OpenThoughts and math-RL are source conditions. Curves formed by pointwise minima over LR are not one realizable run. This pass did not complete the entire figure/appendix or implementation review.
- Current Transformers chat-template documentation: direct tokenization versus extra BOS/EOS; generation prompt versus continuation; checkpoint-specific behavior.
- Current TRL SFT documentation: conversational assistant masks require generation-region templates; supported automatic patches and versions vary. Prompt/completion loss is a distinct policy. Inspect actual labels rather than assuming a flag works.
- Current PEFT configuration documentation: standard alpha/r versus rank-stabilized alpha/sqrt(r); default zero B; target module selection, trainable/saved nonadapter modules and weight-tying caveats. Broad current API surface was not fully audited.
- Laguna token initialization/warmup and rollout-template claims are preserved as the original's report-attributed recipe. The underlying PDF/code has not been freshly reviewed in this pass; do not claim replication or exact warmup hyperparameters.

## Required reader spine and section-level preservation map

The reader question is: how do desired assistant behaviors become exact token targets and controlled parameter updates, then survive export and serving? Publication lineage starts at 2026-06-08. Keep the complete explanations navigable in one `post-training/sft` reader, not separate short LoRA/template pages.

| Proposed stable section | Content to preserve and explain |
| --- | --- |
| purpose | SFT assistant prior; demonstrations versus preference/online feedback; default starting point with exceptions; representative deployable base selection |
| baseline | Baby baseline; preserved system role, tools, mode changes, multi-turn behavior; direct conversation/style tests and held-out suite |
| data | Behavior rather than prestige; greeting/equation counterexample; response length/target mass; generalization and base checkpoint effects |
| serialization | Messages→template→IDs→mask→shift; ChatML/Qwen defaults as requirements-based examples, not replacement for trained contract; BOS/EOS, generation prompt and continuation |
| mask | Assistant-only/all/final policies; headers and endings; target t predicted from position t−1; retained context and indirect gradients |
| reduction | Sum versus token/example means; microbatch/rank numerator and denominator; padding/EOS identity collision; ignored labels and empty batches; 5–10-line conceptual shifted-loss snippet |
| packing | Cross-example context versus block isolation; separator is not attention barrier; positions/boundaries; truncation of structure; actual generated assistant masks |
| reasoning | Retaining versus stripping prior traces; mode and tool schemas/IDs/response context; Gemma checkpoint-specific termination and channels; exact rollout/deployment equality under declared history policy |
| parsers | Multi-token/buffered deltas; split and multiple boundaries; retained suffixes; quoting/control-ID distinctions; partition-invariance tests |
| tokens | New atomic IDs; old segmentation before registration; input/head resize and save; possible gradient/routing failures without asserting guaranteed dead experts |
| initialization | Subtoken mean with nonempty valid IDs; separate untied output rule; cancellation/norm caveats; new softmax mass changes old probabilities |
| warmup | Laguna frozen-body input/head adaptation; all rows versus selective rows; optimizer/tied ownership; trained vocabulary state in adapters; actual formatting/termination/old-task checks |
| choice | FullFT versus LoRA: capacity, memory/layout, transfer/checkpoint and multi-tenant serving; complete decision framework |
| lora | W+alpha/r BA; shapes, matrix branch and trainable counts; rank upper bound; merged exact arithmetic and dropout conditions |
| gradients | Nonzero A/zero B; first B gradient versus zero adapter-path A gradient; later interaction; decay/other losses; backward-input through frozen W |
| capacity | High-rank parity versus early-follow/late efficiency gap, not hard floor; dataset scale; information inequality explicitly heuristic; MLP/MoE coverage versus attention-only matched count; eNTK expression as explanatory hypothesis |
| scaling | Sum of rank-one components, expected early average under standard alpha/r; no full-trajectory identity; rsLoRA alternative and rank/LR conditions |
| invariance | Positive p/q transformation alpha, init_A, LR_A, LR_B; useful initial-effect/timescale coordinates; idealized Adam epsilon and breaking conditions |
| batch | Empirical ~10× FullFT LR and preliminary ~15× short-run heuristic; implicit early schedule; rank not necessarily fixing large-batch gaps; matched target exposure and independent LR/batch sweeps |
| rl | Scalar advantage channel versus supervised token targets; exact conditional information inequality; independence assumption, finite-bin entropy bound and zero-advantage case; no literal one-bit/parameter rule or universal rank-one conclusion |
| compute | 3N² versus 2N²+6Nr matrix multiply–adds; low-rank limit ~2/3; r<N/6 savings condition; retained base/activation/attention work, no wall-clock claim; merged/unmerged and quantized paths |
| deployment | Base/tokenizer/template/module/rank/state manifest; fresh reload; exact prefixes, parser partitions and numerical tolerances; multimodal/MoE ownership requirements |
| checklist | Ordered debug→baseline→matched sweep→held-out transfer→export workflow |
| sources | All four complete originals plus primary references; no aliases/retirement until coverage/routes verified |

## Tested foundations now on disk

`sft-model.js` contains a schematic 18-atom dialogue with assigned probabilities, exact shifted targets, a 4×3 low-rank forward computation, square-matrix budget, positive scale-coordinate identities and a new-vocabulary normalization example. These are analytical teaching models, not tokenizer traces, learned curves or latency measurements.

`test-sft-model.mjs` passes 299 policy/position, factorization/merge, operation-budget, scale-coordinate and normalization cases. Default assistant/body-and-end targets are [7,8,13,14,15]. Independent merged-matrix multiplication matches the factor branch. PAD and index-zero targets are excluded. Mean new input row is [0.5,1], and retained/new probability mass sums to one.

The model script is now imported by `test-sft.mjs`, which also checks all 24 unique section anchors, earliest publication lineage, original/canonical destinations, semantic search and source-conditioned claims. The integrated thirty-script local test suite passes. The earlier reader additions failed before writing; the current reader is registered and syntax checked.

## Reader and browser verification

The connected draft follows demonstrations → interface → targets → parameter updates → export. Native controls exercise all 162 target-policy/boundary/position combinations, all 12 rank/forward-step states and all 41 vocabulary hidden-coordinate states. Target indexes, current-position cues, trainable counts and new logits agree with independent expected browser observations. Play/pause/replay and filtered section navigation work. Desktop 1280×1000 and narrow 390×844 layouts inspected; no document/scene horizontal overflow. Buttons were corrected after screenshot inspection revealed poor native contrast. Comparison tables are keyboard-focusable local-scroll regions. Browser warning/error logs empty.

Saved proof: `sft-v2-check.png` in the Codex workspace. All four original hashes were rechecked and match. Existing originals remain available through explicit links; no aliases redirect them prematurely. These checks do not constitute whole-paper review, every legacy inbound route verification or production readiness.

## Remaining gates

Complete primary figures/captions/reuse and Laguna protocol; full unique-detail/source-to-section coverage and legacy routes; further editorial review of experimental conditions and concrete template conventions; real reduced-motion/offscreen/disposal checks beyond the shared lifecycle harness; static production rendering, privacy and final metadata/search review. Full-curve/appendix reproduction is not claimed. No commit, push, deployment or source retirement.

## Four-source reconciliation and equation pass — 2026-10-06

All four complete original bodies reread against the actual reader; no embedded image/JSX assets. Every current body equals committed HEAD and its baseline hash. Restored deployment-oriented base-selection axes, exact Gemma interface spellings/BOS distinction, new-marker examples and explicit rank-one LoRA sum. Corrected/qualified source heuristics remain intact: parameter counts are not bits; scalar feedback is not universally one bit; scale symmetry is idealized; no universal warmup/rank/LR guarantee.

Fresh primary check: Gemma §3 PT/IT termination and Table11 markers/BOS instruction; LoRA Without Regret conditional information argument. Full report/figure/API/implementation/Laguna review remains a gate. All57 actual old headings map to covered sections; all four local duplicate catalog identities and the public originals block are removed. Source references and canonical related topics remain.

Ten display formulas and three inline shape/count expressions use explicit TeX/MathML. The serialization pseudo-equation is instead a five-stage semantic flow figure, not mathematical notation. Positive target counts, rank/count domains, signed-gradient conventions, finite discrete support and distinct history𝓗 versus entropyH are stated.

Dedicated SFT/math checks pass, including299 analytical cases and exact markers/shape/count/legacy-link assertions. Desktop1280px and narrow390px show13 MathML formulas,zero math errors,no page overflow or escaped inline formulas. Native rank3/final-step endpoint works. Incoming old Gemma checkpoint-token heading resolves to #reasoning. Browser logs empty,viewport reset. Proof: /Users/nathan/Documents/Codex/2026-07-20/new-chat/sft-typeset.png. Full46-script suite passed after source/navigation integration; final inline math received dedicated and browser reruns.

Physical source removal/production routes await the validated production switch. No commit,push,deployment or source deletion. These checks close original-body/local-route preservation, not every primary or production gate.
