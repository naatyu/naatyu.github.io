# Shortcut Models source and transfer — 2026-10-24/25

State: source-reviewed extension of a local draft. Not production-ready or full migration closure.

## Source scope

Primary: https://arxiv.org/pdf/2410.12557v3, dated 23 June 2025; first publication 16 October 2024. Local PDF `/private/tmp/atlas-shortcut-2410-12557v3.pdf`, 17 pages, 11,422,475 bytes, SHA-256 `70ab8146e470dd92d136b2e956a70e9fa1e7b12a0bedd07c45a3b4444201b4ca`.

Substantive main text and Algorithms 1–2 were read in the preceding continuation via v3 HTML. Appendix B was extracted/read from the PDF. This continuation visually inspected actual rendered pages 1,3–10,14–17: all nine figures and all three numbered tables, including the unnumbered robot result table. Bibliography is not freshly line-reviewed. Renderings are under `/private/tmp/atlas-shortcut-figures-m99WZ5/`. No source image imported or reuse rights assumed.

The official implementation lookup was interrupted before execution by an approval-service usage-limit failure. It was not bypassed. No repository revision, released-code review, JAX execution, autograd verification or image benchmark replication is claimed.

## Corrections and content transferred

- `#shortcut` explicitly reverses the preceding FGM convention: noise is time zero and data is time one.
- `#shortcut-training` gives empirical grounding, stopped EMA bootstrap target, the predicted midpoint and advanced second time, and the 75% empirical /25% bootstrap split.
- The eight positive dyadic lengths span 1/128 through 1. Half-step construction ends at 1/2. The smallest half-step queries conditioning zero but still integrates by 1/128. Exact released grid sampling remains uninspected; the reference checks only dyadic length and time bounds.
- A 13-line scalar target kernel and static nonautonomous example make state/time advancement inspectable. This has no autodiff branch; public prose requires explicit stopped/frozen targets in a tensor implementation.
- EMA .999, AdamW learning rate .0001, weight decay .1, guidance only at zero-step queries and guidance scale chosen before training are explicit.
- The 16.7% overhead is the paper's forward-equivalent estimate, not measured runtime.
- `#shortcut-evidence` gives assigned DiT-B ImageNet FID-50k rows, unsupported-budget flags, model/data/evaluation settings, one-step quality gap and call-count-versus-latency distinction. Dates and four original bodies are unchanged.

Published inconsistencies: Eq.4/Algorithm1 advance time while the Eq.5 displayed target still shows old time. Algorithm1's first-k empirical label differs from §3.1's k bootstrap fraction. Table3's empirical-to-bootstrap label is ambiguous; §3.1 and AppendixB.2 establish the intended .75 empirical fraction. Reader follows the composed step and explicit recipe, not the conflicting shorthand.

## Figure and evidence interpretation retained for future work

Figure2 distinguishes intersecting empirical pairings from the curved marginal ODE. Figure3 shows simultaneous grounding and binary bootstrap, not a separate pretrained-teacher pipeline. Figure4's curve differs slightly from Table1 in a few plotted labels; new evidence table uses Table1. Figure5 is limited model-size evidence, not a universal scaling theorem. Figures1/8/9 hold noise fixed within a column, with approximate semantic rather than pixel preservation. Figure9 specifies XL samples while Table1 is B; do not conflate them.

Table2 XL values are FID3.8/7.8/10.6 at128/4/1 calls,676M parameters,250 epochs. Other rows differ architecture/compute/epochs and do not support a matched causal comparison. Figure6 uses variance-preserving interpolation of independent Gaussian seeds, not existing-image editing. Figure7's selected Push-T/Transport tasks report shortcut one-step success .87/.80 versus diffusion100-step .95/1.00; not equivalent success or a comprehensive robotics benchmark. These extensions are source-reviewed but are not inserted as disconnected new public cards.

AppendixB baseline details: Reflow uses50k/1M synthetic targets and128 calls each; progressive distillation uses400k updates split among eight stages; Live Reflow uses8-step target rollouts and over4× compute. Thus same architecture/codebase does not mean exactly equal FLOPs for every baseline. No blanket compute-matched claim is added.

## Verification

- `test-shortcut-reference.mjs`:378 independent affine nonautonomous expansions, exact callback traces/conditioning/time bounds, worked values, finite/domain rejection and parsed recipe/evidence/math/code checks. First overflow fixture was still representable; corrected the fixture to Number.MAX_VALUE, not the valid arithmetic.
- Focused Diffusion22658 reached terminal0:15,904 existing numerical cases,10,902 rendered states,49 sections/four scenes,16,022 words; the new378 cases run in its imported test.
- Full47-script suite44715 reached terminal0 (f28ecb). No public edits occurred during the run.
- Build48873 terminal0, isolated candidateTaM2QS. Full staticSnaBz0:54 readers,206 legacy landings,25 notices,3,235 reviewed anchors,547 displays,1,452 namespace-valid MathML roots,387 comparison/diagram regions,165 code regions,15 media,544 files,zero old dependencies. Diffusion38 displays+45 inline=83 MathML.
- HTTP57427 terminal0:285 routes plus Home/Atlas and private/security responses pass.
- `git diff --check` exits0, but v2 is untracked so this is not an exhaustive untracked whitespace check.
- Native verification NOT complete: temporary tab8 loaded the candidate and hydrated section navigation, but Enter/screenshot/cleanup requests then timed out and reset the browser runtime. No desktop/mobile visual or keyboard-scroll pass is claimed. Viewport had been set to1280×900; its reset and explicit tab close could not be confirmed. Agent-created temporary tabs are normally closed by the product at turn end. Local server60931 was stopped withCtrl-C, terminal130.

## Remaining

Retry native desktop/narrow formula/code/table checks when browser control recovers. Review the released Shortcut core path without bypassing the approval interruption. Continue remaining Su source scopes and the corpus-wide semantic/coherence/accessibility/recovery/release gates. The local untracked multi-harness original remains the sole missing Git recovery. No original removed, commit, push, deployment or production switch.
