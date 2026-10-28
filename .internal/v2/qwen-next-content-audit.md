# Qwen3.8-Flash-Next source coverage

Reviewed and integrated on 2026-10-28. This is a content-update audit, not a migration task or publication approval.

## Source and scope

- Primary: Qwen Team, *On the Design of Qwen3.8-Next Architecture: Evaluation, Efficiency, and Training Stability*, dated 2026-08-26.
- Source: https://github.com/QwenLM/Qwen3.8-Flash-Next/blob/main/tech_report.pdf
- Downloaded 28-page PDF SHA-256: `04f263446d74a35cb7cea368574e0c561f3b05c133be2c777ac884404063655d`.
- Read the full technical body, equations, tables, figure captions and conclusion; inspected the reference list. Rendered and visually reviewed architecture Figure 1, QSA Figures 5–6, stability Figures 11–12 and base evaluation Table 11. Text extraction covered the remaining figures and their captions; they were not all individually rendered.
- GitHub README read for release context. The linked Qwen blog returned no readable body; no claims about an undisclosed RL recipe were inferred from it. Linked Canzona/Polar Express/FlashQLA implementations and papers were not freshly reviewed in full; the notes describe this report's disclosures and link the report.
- Assessment of the PDF was previously completed in chat. This pass implements the user's approval to integrate valuable content. No commit, push or deployment requested.

## Canonical ownership

| Source material | Destination | Retained substance |
| --- | --- | --- |
| Abstract, §§1–4, Table 11 | `training/frontier-recipes#qwen-next`, `#qwen-next-evidence` | Connected architecture and pretraining/CPT sequence; 125B backbone, 6B active, separate 51B tables; 14 exact base-score rows, shot/CoT conditions, eight wins against 397B-A17B; interpretation of one-ninth FLOPs; explicit unknowns |
| §2.1.1, Figures 1–2, Table 1 | `models/attention#qwen-gdn` | State orientation and decay-before-prediction recurrence; q/k/v short convolutions, L2 normalization, scalar gates and sigmoid output; zero-centered RMSNorm; 3:1 hybrid; proxy size/exposure/window; RoPE/NoPE late-stage finding |
| §2.1.2, Figures 3–6, Tables 2–3 | `models/attention#qwen-qsa` | Pool-before-RoPE indexing, 4 heads/128 width/64 rotary, r=4/K=2048, causal complete blocks and tail; average-key versus max-teacher pooling; both distillation stages and token arithmetic; selected-support KL; joint adaptation; 35B-A3B compression/head/index-sharing ablations; all long-context score rows; selected short-task evidence and limits |
| §2.2, Tables 5–6, Figure 7 | `models/transformers#qwen-gr` | GatedNorm and GR equations/shapes; elementwise read and scalar write; four branches; no Hres and no duplicate Pre-Norm; static/dynamic quality and loss; Full/Block AttnRes comparison with GN; path analysis and attribution limits; rejected two-branch read; FP8 state and fused read/write |
| §2.3, Tables 7–9 | `training/scaling#qwen-memory` | Fixed-budget allocation versus additive capacity; 300 TPP/250K vocabulary convention; loss/downstream disagreement; selected exact table columns; single-layer placement and Layer-2 prefetch rationale; unsuccessful token-normalization/order/frequency changes; missing implementation details |
| §3.1 | `training/optimization#qwen-muon` | Nesterov .95, Polar Express/eight NS steps/normalization constant; shape scaling; exact optimizer groups and exceptions; per-head versus fused geometry; schematic code and missing coefficients |
| §3.2, Figures 8–9, Table 10 | `training/scaling#qwen-hyperparameters` | Retuning after architecture/optimizer change; all three small-model batch endpoints, LR/batch coupling, 4T exposure; ramp endpoints/524B transition/18.8% extra steps; larger 156B-A7B/419B test and five accuracy means; flat region and limited statistical evidence; unknown law coefficients |
| §3.3, Figures 10–13 | `training/stability#qwen-stress` | Matched stress setup, definitions, 2×/4× LR results, isolated GN pair, production first 276B and gradient statistics; activation-rescaling hypothesis; no activation clipping versus global gradient clipping; late-stage rejection cases |
| §§2–3 efficiency details | `execution/performance#qwen-systems` | FlashQLA baseline and speedup boundary; kernel-only QSA conditions; FP8 residual byte boundary; Layer-2 host overlap; shape-aware NS FLOPs with equal-element counterexample; Canzona DP ownership/TP reconstruction/ZeRO overlap; graph capture versus megakernel; missing cluster/GPU-hour bill |
| §2.1.2, Table 4 | `execution/speculation#qwen-mtp` | All accepted-length rows; reuse selection rather than attention outputs; counting-convention ambiguity; four-step table versus next_n=4 timing; acceptance is not speed; implementation checks |

## Editorial and source boundaries

- Eight existing readers, eleven new stable section anchors. No new model-summary page or category. Original publication dates preserved; substantive updated dates are 2026-10-28. Attention's previously hardcoded visible update date now reads its metadata.
- STE-informed English, connected explanations, exact shapes and conditions, small schematic code, original architecture/GR flow, source-linked tables and a four-step causal QSA illustration.
- The QSA illustration is synthetic: 12 keys, one head and one selected block. It omits the trained projections, partial RoPE and learned normalization. It must not be cited as a quality or latency experiment.
- No PDF figures copied into public assets. Original schematics and attributed selected numeric tables avoid implying an open reuse license for the paper artwork.
- No invented SFT/RL/reward/environment/harness pipeline. Generic README mentions of GRPO/DPO are not proof of production use. Main-run data mixture, absolute total training exposure, full expert/vision specification and scaling coefficients remain explicitly unknown.
- Do not say all costs are reduced ninefold or attention is linear. Do not reinterpret Table 11 as agent evaluation. Do not call an accepted length above four an acceptance probability.
- Source wording issue retained with a correction: 213 clipping-threshold crossings in 19,932 steps is about 1.07%, not clipping on every step, despite “continuously” in the source prose.
- Descriptive residual-path norms are not causal attribution. NoPE and sparse-read failures are recipe-specific. Removing batch-size warmup does not remove LR warmup.

## Verification

- Added `test-qwen-next.mjs`: 48 guarded causal-selector states, future masking, complete blocks, tail, output uniqueness, boundary and input guards; exact source-derived comparisons/budget arithmetic; eight reader integrations, eleven anchors, metadata, search and canonical section links.
- Equations: eight additional displays and two additional inline expressions; total inventory 561 displays / 1,473 MathML roots across 55 readers. Existing scientific math checks retained; baseline-count/date expectations updated specifically where additions change them.
- Final `npm --prefix v2 test` completed with exit 0. Publication-format build/test and local HTTP checks also completed with exit 0. The final preview uses the publication-format artifact `atlas-v2-candidate-Wy6tfl` at localhost:4327. None of these checks deploys the site or reproduces model training.
- Native IAB: desktop scene, keyboard range endpoints, query positions 0/10/11, play/replay; 390×844 QSA and GR layout, local equation keyboard scrolling, zero page-wide overflow; report-to-QSA canonical link; no warning/error log entries in inspected pages. Viewport restored.
- Reduced motion and suspend/dispose behavior use the shared tested `rangePlayback` lifecycle. Native OS reduced-motion setting was not changed. Native testing did not exercise every selector state or every note layout; pure-state checks cover declared states.
- Local-only: no commit, push, or deployment.
