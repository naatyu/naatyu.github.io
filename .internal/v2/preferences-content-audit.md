# Preference Optimization — content audit

## Inline notation review — 2026-10-14

Reviewed the complete current reader and the raw-math candidates. Twelve inline expressions now use the shared mathematical renderer: equal policy/reference, zero margin, initial probability/loss, the three-response margin, path position, fixed-reward objective/optimum and the local beta derivative. Fractions use TeX layout. The reference, support, score-coordinate and finite-update caveats remain. No empirical result or heuristic was changed. The note remains a local draft, not production-ready.

`test-transfer-notation.mjs` checks exact annotations and parsed assumptions for this reader and Distillation; the existing1,017 preference-model checks retain independent finite-difference and fixed-reward tests. Five displays plus12inline expressions give17MathML roots. Four raw candidates remain as intentional numeric scene summaries; dynamic notation is not certified by this static pass.

Final47-script run29949 exits0; exportl23YJp retains54readers/206landings/25notices/3235anchors/535displays/544files/zero old dependencies and1,119 namespace-valid static formulas. Native finalF0sNOW at1280/390px: reference/optimum and beta-derivative screenshots inspected,17math roots,no errors/foreign namespaces/page overflow. Layout checks are scoped,not whole-reader accessibility certification. The prior63347 run passed before fraction refinements and is not the final evidence. Original content and production are unchanged. Whole-primary/editorial/native/release gates remain.

Updated 2026-10-06. Integrated local draft at post-training/preferences; not production-ready. The reconciled original is excluded from local public navigation; production is unchanged.

## Read scope

Read the full original Preference Optimization for LLMs body, including all ten numbered sections, related links and playbook citation. Read the adjacent Smol playbook preference section as supporting context, not a new full-report audit. Baseline SHA-256 e03e8a053c5b5b7fcd269abfa9682e2e7626e7f0bdb82cb0d75881a9a7bbc499 matches. Original contains no embedded image/import references.

Fresh targeted primary checks: DPO main equations 3–7, score gradient, reward reparameterization and implementation appendix; current TRL DPO objective, loss variants and reference/cache constraints; ORPO abstract and official trainer; KTO introductory feedback/limitations and objective context. These were targeted checks, not whole-paper/figure/appendix audits. ArXiv HTML's DPO Appendix A.4 displayed sign inconsistencies; the reader uses the main loss and independently differentiates it rather than copying the appendix gradient.

## Unique source-to-reader map

| Original content | Destination / treatment |
| --- | --- |
| SFT versus comparisons; behavior/style/alignment | motivation, pairs; no blanket stability/cost guarantee |
| Common SFT → preferences → RL workflow | motivation, online, checklist; optional progression |
| DPO baseline/reference | margin, reference, implementation; exact masked score and stable loss added |
| APO/ORPO/KTO alternatives | alternatives; different feedback contracts, no superiority claim |
| SFT LR divided by roughly 5–20 | tuning; source heuristic, matched sweeps |
| β convention and [0.01,0.5] range | beta; fixed-reward anchoring separated from local classifier gradient |
| Small data can improve behavior | pairs, tuning; no invented count |
| Fast overfit, sometimes one epoch; shuffled slices | overfit; not a universal threshold or leak remedy |
| Reasoning improvements without immediate RL | reasoning; verifier/style/process distinctions |
| Offline versus refreshed/on-policy comparisons | online; collection and update axes separated |
| Practical heuristics and links | checklist, sources and canonical connected-topic links; no original fallback |

Corrections: DPO ratio improvement does not guarantee preferred-response probability increases; fixed-reward larger-β anchoring does not imply every finite DPO step is smaller; reward-relative metrics do not establish absolute quality. Preserve teacher/judge/template/length conditions rather than interpreting pair loss as a benchmark.

## Analytical and browser evidence

Two normalized three-response demonstrations, not measured curves. A chosen/rejected/other logit sweep exposes relative versus absolute probability. A fixed-reward exact optimum exposes β and KL. All probabilities and gradients derive from a pure model.

1,017 model cases pass: central finite differences, normalized mass, margin algebra, saturated log-sigmoid, fixed-reward KL monotonicity, mask domains and common-logit-shift invariance. Reader tests cover all 16 unique sections, publication date 2026-06-08, public draft visibility, original/canonical links, search and conditioned wording.

Native browser checks: all 648 path/mode/β states plus all 196 KL-coefficient states; selected values and displayed margins agree, probability bars conserve mass at browser-serialized display precision. Caption float comparisons corrected to avoid calling initial unchanged probabilities a decline. Play/pause/replay and filtered section links work; navigating to another section preserves the path position. Desktop and 390×844 inspected with no page/scene overflow. Tables are native keyboard-focusable local-scroll regions. Shared playback honors reduced motion and disposal; real preference-specific OS/reduced-motion/offscreen tests remain open.

Saved desktop proof: `preferences-v2-check.png` in the Codex workspace. Browser warning/error log empty. The full thirty-one-script suite passes after the caption correction and reader assertion update.

## Equation and source-link reconciliation — 2026-10-06

The entire original was reread against the actual reader. Its tracked bytes equal HEAD and the baseline hash. All substantive content, numerical heuristics, alternative-objective distinctions and the playbook citation survive. Unqualified cost/stability and preferred-probability claims retain the explicit corrections above. Related reasoning/RL/distillation links now point directly to v2 owners. The broad playbook original is not aliased through this single preference scope.

Five display equations now use explicit TeX/MathML: masked sequence score, reference-relative margin, stable DPO loss, paired score derivatives and reward reparameterization. The completion mask is explicit. The derivative is a score-coordinate partial, not a claim about each optimizer update. Removed the public original/context block while retaining its external playbook source and heuristic qualification. The original identity and all14 headings locally resolve to meaningful sections; production HTTP redirects and physical removal remain pending.

The1,017 numerical cases and16-section reader tests pass. Desktop1280px and narrow390px rendering have5 MathML displays, no KaTeX errors, no page overflow and no escaped math-scroll surfaces. Native beta End control displays β=2 with the expected normalized probability/reward/KL values. The incoming beta source heading normalizes to #beta. Full primary audits are not inferred from this math or preservation pass.

## Remaining gates

Complete primary/reuse/figure and source-conditioned experiment review; deeper APO/ORPO/KTO equations if needed; production HTTP routes; real reduced-motion/offscreen/disposal checks; static production rendering, accessibility, privacy and metadata/index final review. No production build, commit, push, deployment or physical original retirement.
