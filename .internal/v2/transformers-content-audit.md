# Transformer Architecture — local content audit

## Output-head, history and budget notation — 2026-10-14

Reviewed the remaining depth/history,rank,mixture andbudget prose candidates in context. Thirty-six more inline expressions now use the shared renderer,including exact fractions in the positive-target counterexample. Retained bias-free support/rank conditions,row shifts,probability-versus-log-probability distinction,MoC/MoS operation order,residual-only traffic estimates and conventional head geometry. No reported result or numerical configuration changed.

The counterexample is a560px local comparison with full-size fractions. Native inspection also found the existing budget table wrapping numbers one digit per line at390px;that table now uses the same local-scroll treatment. Tests verify all20geometry cells,the eight counterexample math annotations,the determinant and both FFN budget examples independently. This fixes readability without changing the architecture choices.

Reader remains24sections and now has21display+59inline=80MathML. Focused3480 and final47-script60360 exit0. Earlier34452 passed before the budget-layout refinement and is not final static evidence. FinalstaticqKMUDW:54readers/206landings/25notices/3235anchors/535displays/15images/544files/zero original dependencies/1,191namespace-valid static formulas. Global raw queue160manual candidates;Transformer3remain as scene parameters/numeric summaries. The prose queue is closed,not a claim that every SVG,dynamic state,source figure or mathematical statement is certified.

Native finalcandidateRYsjjh1280/390px rank/history/mixture/budget checks:80math roots,no math errors/foreign namespaces/page overflow;560px tables within258px mobile surfaces. Rank and budget keyboard scroll settle at40px out of302px;pointer scrolling exposes final budget columns with intact128/64 and14,336 values. Desktop/narrow screenshots inspected,warning/error logs empty. Initialcandidate9djnKr exposed the digit-wrapping defect;it is not final layout evidence. Previews61865/70612 stopped130,temporarytabclosed,viewportreset. Originals/production unchanged,no retirement,commit,push/deploy. Full-primary/figure/editorial/native/recovery/release gates remain active.

## Block, normalization and activation notation — 2026-10-14

Reviewed the current block/residual/normalization/placement/initialization/activation explanations and their raw-math candidates. Twenty-three inline formulas now use the shared renderer. The additive attention mask is named; residual accumulation has explicit summation bounds. DeepNorm's decoder-only gains retain their source configuration, while generic width/depth heuristics remain conditional. Activation definitions retain their original meaning and derivative caveats. No empirical claim changed.

The activation and placement comparisons use560px minimum-width local tables rather than squeezing formulas and prose into mobile columns. Native inspection prompted a full-size sigmoid fraction. Normalization parameters are in adjacent mathematical text rather than the table caption, preventing the scroll-region name from duplicating KaTeX's visual/MathML/TeX text. The resulting label is “One token, four features”.

`test-transformers-notation.mjs` checks23exact annotations,parsed conditions and comparison width. Existing tests retain1,620normalization cases,567activation values,1,944Jacobian checks and twelve-source/145-fragment closure. Reader remains24sections/21display+23inline=44MathML. Focused76628 exits0;final47-script44169 exits0. Earlier23504 passed before final label/fraction refinements and is not final static evidence. FinalstaticJG1a7S retains54readers/206landings/25notices/3235anchors/535displays/544files/zero original dependencies and1,155namespace-valid static formulas.

Native finalcandidatekTq40T at1280/390px: activation/placement screenshots,560px tables within258px local surfaces,settled keyboard scroll40px out of302px,44math roots,no errors/foreign namespaces/page overflow. All nine normalization offsets−4…4 redraw with44math roots,no math/namespace errors and the same clean label. Warning/error logs empty. Previews38757/32646 stopped130,temporary tab closed,viewport reset.

Global raw queue166manual candidates;Transformer has9remaining candidates. Three are scene summaries;the remaining depth/history,rank,mixture andbudget notation needs its own context pass. This checkpoint does not claim whole-reader mathematical/editorial/source/figure/accessibility certification. Originals and production unchanged,no retirement,commit,push/deploy;broader release requirements remain active.

Updated 2026-10-09. All twelve original bodies reconciled into the local reader; six activation PNG replacements verified against Git. Not production-ready or deployed. Physical production originals remain untouched.

## Decision and explanatory spine

Merge into `models/transformers`. Preserve publication 2024-09-27 from the GPT source. Twenty-four searchable sections follow the state through block anatomy, skips, normalization, nonlinear updates, depth retrieval, vocabulary decisions, reversible storage and budget design. Attention, Position, MoE, Losses and Parallelism remain linked owners. All twelve aliases and 145 exact Markdown fragment destinations are now activated locally. No public original archive or duplicate entries remain for this topic. Production HTTP redirects are separate.

| Original | Unique material and destination |
| --- | --- |
| Building GPT | Bigram baseline, embeddings, Q/K/V, causal masking, multihead projection, FFN, residual/norm, shifted targets, autoregressive generation and position distinction → `block`; seven-line shape pseudocode added |
| Residual/normalization/initialization | Identity Jacobian, accumulated sum, correlated versus uncorrelated growth, Pre-/Post-Norm dilution, width variance, BERT 0.02 comparison, residual scaling, DeepNorm, tanh-versus-norm derivative distinction, coupled monitoring → `residual`, `placement`, `initialization`, `normalization-lab`, `checks`; five original blog citations retained |
| Activation functions | ReLU/dying units, Leaky, sigmoid/tanh saturation, GELU exact/approximate, Swish/SiLU, GLU/SwiGLU and parameter matching, Hardtanh/boundaries, softmax/sparse alternatives → `activations`, `gates`; original French explanations translated with corrected scope |
| BatchNorm | Batch/spatial feature statistics, affine parameters, running train/inference statistics, microbatch and synchronization limits, historical motivation → `normalization` |
| LayerNorm | Per-token hidden-axis mean/variance, gain/bias, batch-independent statistics, sequence and affine invariance conditions → `normalization`, `normalization-lab` |
| RMSNorm | Mean-square rather than centered variance, scale/gain/epsilon, computational distinction and conditional runtime evidence → `normalization`, `normalization-lab`; no unverified universal speedup or architecture-list claim |
| Attention Residuals | Unit depth mixing, dilution, pseudo-query/key normalization, token dependence, Full/Block recurrence/limits/storage, ~8-block/window ablations, input-query tradeoff, all eleven ablation values, pipeline caching, two-phase merge, residual I/O, prefill/sharding, three scaling fits/conditions, largest proxy losses, full large-run setup and all nine benchmarks, learned depth patterns/sinks, comparison families and limitations → `depth` through `attnres-evidence` |
| Embedding tying | Shared shapes, Vd savings, small/large budget fraction, same-backbone versus same-total-budget comparison, quality caveats → `tying` |
| Softmax bottleneck | Logit/log-probability bounds, row-shift family/necessary condition, log-odds, deeper/MLP limits, MoS/MoC equations/order, nine output-modification cases, tying distinction, PTB rank/threshold/runtime conditions, exact-versus-useful rank and full diagnostic → `head`, `rank`, `mixtures`, `head-evidence`; added bias-free worked counterexample |
| Stop gradients | Forward identity/backward boundary, detached matching derivatives, shared parameter paths, EMA distinction, SimSiam versus BYOL/DINO, collapse and storage limits → `stop-gradient`; method-specific vision details retained by originals |
| Reversible networks | Additive coupling and ordered inverse, noninvertible branch functions permitted, O(1)-in-depth boundary activation qualification, recomputation/custom backward, operation-count versus GPU overhead, rounding/RNG/nonreversible boundaries → `reversible`; five opt-in execution steps |
| Transformer scaling rules | Conventional d=hp, attention/ordinary/gated FFN counts, KV formula, depth/width costs, four valid example geometries, GQA/kernel candidates, tying/MoE/looped parameter versus compute, local/global eviction, model-specific exceptions, batch/precision and latency checks → `budget`; full original report/performance references retained rather than claiming those reports reviewed |

## Assets and evidence scope

All six activation PNGs visually inspected: ReLU, Leaky ReLU, sigmoid, tanh, GELU and Swish. They are scalar curve illustrations, not measurements. Several are cropped and omit formula/parameter labels. The new SVG explicitly states axes and parameters, includes Hardtanh and uses a labeled GELU tanh approximation rather than claiming pixel identity with the original GELU curve. Original files are Git-equal and recoverable, not linked in the public v2 reader; no assets physically removed or copied into public v2 bundles. No JSX components in these twelve sources.

Fresh selected primary checks: RMSNorm abstract's 7–64% conditional runtime report; BatchNorm/LayerNorm publication history and axis descriptions; DeepNet PDF Figure 2 and decoder-only formulas; RevNet coupling, operation counts, GPU timing distinction and custom-backward discussion; SimSiam abstract's no-momentum-teacher condition; Yang et al. theory, MoS/MoC and PTB rank tables. Attention Residuals PDF text excerpts confirm recurrence implementation, proxy table and depth patterns. PDF screenshot calls returned references without usable image content in this tool session: do not count that as visual figure review. Its complete original atlas body is read and retained, but a fresh complete 21-page primary/appendix/figure audit remains pending. Smol playbook's Space shell was accessible, not its full content; no new source-specific performance claim inferred from it. Original kexue, nonlinear-logit papers and linked model reports were not freshly audited in full.

## Corrections and qualifications

- Residual identity paths help but do not guarantee nonvanishing/nonexploding gradients.
- Independent zero-mean equal-energy updates yield square-root RMS growth; aligned updates can grow linearly. Neither is unconditional.
- DeepNorm uses amplified skip plus selected initialization gains, not the generic small residual-branch multiplier.
- Unrestricted self-attention without positions is equivariant, not invariant; a causal mask breaks unrestricted permutation symmetry.
- BatchNorm does not universally fail in NLP; statistics axes, causal masking and microbatch behavior must be specified.
- Replace unsupported RMSNorm 10–40% blanket claim with the actual report's conditional 7–64% range.
- GLU gates are not sampled neuron-firing probabilities; SwiGLU gate values are not restricted to [0,1]. Hardtanh endpoints are nondifferentiable.
- SimSiam has no EMA teacher; stop-gradient alone neither freezes all shared parameter paths nor proves absence of collapse.
- Correct d/head-size inconsistencies in old configuration templates. Declare conventional attention-width assumptions and omitted parameters.
- Attention Residuals matches MMLU-Pro rather than improving every benchmark. Preserve fitted-versus-measured compute and system-specific overhead limits.
- Softmax rank applies to logits/log probabilities or log-odds, not directly to probability matrix rank. State bias-free assumptions; output bias changes exact bounds.
- RevNet's ~33% operation estimate and ~50% equal-forward/backward-cost estimate are distinct, not universal measured speed costs.

## Verification and remaining gates

Pure numerical tests: 1,620 shifted/scaled normalization cases against closed-form moments; 567 activation values and saturation/endpoint checks; 81 exact depth queries and convex-value/weight conservation; 21 output mixtures including identical endpoint distributions; positive rank-two log-odds counterexample; 10,201 reversible roundtrips; valid geometry/cache/parameter/tied-saving calculations; invalid domains, unique anchors, original/related routes, metadata and semantic search. All twenty local test scripts passed when run together; new suite integrated into `npm test`. Shape pseudocode is illustrative, not an executed tensor-library implementation.

Browser native controls: nine offset states, seven activation choices, five depth queries, twenty-one mixture weights, all five reconstruction steps; Play/Pause and Replay; filtered section links preserve offset/function/query/mixture state. Desktop 1280×900 and mobile 390×844 inspected. Local wide mixture table scrolls without document overflow. Fixed scene table-heading contrast and shortened mobile normalization label. Shared reduced-motion/lifecycle harness passes; actual OS-preference check and training-gradient equivalence remain pending. Final browser logs and latest screenshot recorded after final edits.

All twelve source SHA-256 values rechecked and match `dense-preservation.json` unchanged. Thus the ledger fingerprints remain current. Original sources and unrelated unpublished multi-harness work untouched. Final corpus editorial, complete primary/figure audit, source/route coverage, actual reduced-motion and production/search/privacy gates remain open. No commit, push, deployment, source retirement or archiving.

## Equation pass — 2026-10-06
Historical entry below; current count is 21 typeset displays.

## Complete original-body closure — 2026-10-09

Freshly reread all twelve complete bodies. `transformers-core-closure.json` records SHA/Git recovery, all 145 exact headings, their owning sections, and six Git-verified activation replacements. The default Transformer test checks citation retention, every fragment, no public original dependency, 1,944 independent finite-difference LN/RMS Jacobian comparisons, batch-axis statistics and EMA endpoints.

Added typeset BatchNorm feature-axis statistics, LN/RMS/tanh Jacobians, general Hardtanh clipping/derivative and EMA update. Restored the three Attention Residuals proxy fits with units/domain and logit/log-probability rank derivation. Retained eleven ablation losses and nine benchmark rows, including the MMLU-Pro tie. Fit comparisons are not measured wall-clock savings; high log-probability rank is not proof of high useful rank or an optimal output head.

The new budget-design section preserves dense baseline, local/global hybrid, dense/MoE interleaving, shared-expert/drop-policy and looped-MoE decisions. Separate unique storage, active arithmetic and repeated compute; qualify early exit and critical batch assumptions. The old bare model-name inventory is not used as empirical evidence. Its nonuniform-width, latent-compression, state-space and multimodal exceptions remain connected to canonical owners. Full linked-model report reviews are not claimed.

Full47-script suite13071 exited0:54 readers,168 legacy routes,2523 reviewed anchors,507 math displays,457 static files and5 old-dependent readers. Native desktop/390px checks:21MathML,zero math errors or page overflow; legacy scaling,rank diagnostic andprefill anchors resolve correctly; offset endpoints±4 update values; local equation keyboard scroll moves within82px overflow; no console warnings/errors. Screenshot proofs recorded in migration progress. Full lifecycle, accessibility/real-OS reduced motion, primary and production gates remain separate.

Fresh BatchNorm smoothness check covers the Santurkar et al. abstract only. Prior selected primary/figure checks remain as scoped above; complete external-primary, figure/rights and production gates remain open. Source-body closure does not certify every external report.


Fifteen displays manually converted to explicit TeX/MathML. Captions preserve axes and shapes; positive d/epsilon, equal expected update energy and uncorrelated accumulation, online-softmax nonempty groups and positive denominator, and byte-storage units are explicit. Fully masked groups must be skipped; both-empty groups need an explicit masked-row policy. This is not source/old-fragment closure.

Dedicated Transformer/math tests pass (1,620 normalization,567 activation,81 depth-query,21 mixture and10,201 reconstruction cases). Native1280px/390px checks show15 MathML displays,zero parser errors and no page overflow. Normalization offset endpoint reaches4; no browser warning/error logs, viewport reset. Proof: /Users/nathan/Documents/Codex/2026-07-20/new-chat/transformers-typeset.png.
