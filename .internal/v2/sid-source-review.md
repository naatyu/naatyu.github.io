# SiD source, recipe and evidence checkpoint — 2026-10-24

## Authoritative source and scope

Official v2: https://arxiv.org/abs/2404.04057v2 , dated6May2024. Local read-only PDF /private/tmp/atlas-sid-2404-04057v2.pdf,25pages,53,277,609bytes,SHA256 e1670c7ad9012cbce59f3703b8e63a2b48f40935e89487c8a5b3e8c2034601ed. No repository/checkpoint code executed or paper assets imported. Reuse rights were not inferred from arXiv hosting.

Substantive main/AppendicesA–E text/equation/table inspection is now complete across the preceding scoped reviews and this fresh pass. Freshly read PDF1,3–6,9–10,14,16–19; main7–8 and20–25 were read as actual rendered pages/captions plus the relevant HTML text. Page2 actual rendered related-work text/figure inspected. Bibliography11–12 is not freshly line-read; no cited result in those references is independently certified. This is source inspection, not proof formalization or experiment reproduction.

The HTML conversion loses main figure/table numbering and calls Appendix figures2–11 and Table1. The PDF contains17figures and6tables. Public new references use PDF numbering. Do not infer that an HTML cross-reference label is the actual numbered PDF figure.

All25pages rendered with Poppler into /private/tmp/atlas-sid-figures-02ui47/page-01.png ...page-25.png using the existing task Fontconfig file. Render30420 terminal0 (e8ea90), avoiding the prior default Fontconfig warning flood. Actual viewed pages2,7,8,15,19,20,21–25 cover all17figures and six tables.

## Figure and table interpretation

- Figure1/page2: same noise seeds at successive ImageNet checkpoints; FID153.52→34.83→37.42 is already nonmonotone. Neither seed coupling nor displayed sample diversity proves distributional coverage.
- Figures2–6/pages7–8: FID against iterated k-images, not wall-clock time. Two lambda settings; conditions differ by dataset. ImageNet-64 has teacher35? No: actual Table3 reports511/1.36 and79/2.64; do not import the CIFAR35NFE convention. The student comparisons are the same student against two teacher inference budgets, not separate training runs.
- Figure7/page15: seven mixing settings and four training budgets. The1.5 column degrades severely; stable-looking0/0.5 grids do not imply goodFID. Figure8: IS and FID differ, ablation plots' x-axis saysIterations while caption saysk-images; text says8000iterations=1.024Mimages despite batch256, an arithmetic inconsistency. No exact ablation-axis-derived measurement imported.
- Figure9/page20: batch1024/LR5e−6 divergence. Figure4 is batch8192/LR4e−6. This joint change is not a batch-only causal ablation. FP16 explanation is author hypothesis; FP32 remedy was not tested.
- Figures10–12/page20: same-seed quality progress and transient exaggerated feature/artifact spikes; not guaranteed monotonic improvement. Figure11's10M FID78.92 spike is real source evidence, not a typo to smooth out.
- Figures13–17/pages21–25: final unconditional/conditionalCIFAR,ImageNet,FFHQ,AFHQ grids. FID labels1.923/1.710/1.524/1.550/1.628 agree with selected rows. Not evidence of full coverage or memorization safety.
- Tables1–5/pages7–8: reviewed conditions,NFE and reportedFID/IS/precision/recall. Only compact CIFAR-unconditional and conditionalImageNet rows added publicly; other source numbers not duplicated gratuitously.
- Table6/page19: recipe/memory/time. Costs exclude FID evaluation. Narrative percentage overheads are rough and do not exactly match all rounded table ratios; no new universal overhead percentage imported. Main prose says log–log linearity implies exponential decay; mathematically the local fitted form is a power law, not an exponential convergence theorem.
- AppendixA FFHQ generatorAdam beta1=1 prose conflicts with Table6 beta1=.9. Do not prescribe1. Future released-code review must resolve the implemented setting.

## Public transfer

Diffusion gains #sid-recipe and #sid-evidence, retaining the same owning note rather than creating a report page. Original publication2026-06-11 preserved;updated2026-10-24.43sections,32display+45inline=77MathML,four unchanged synthetic scenes.

Recipe separates EDM auxiliary corruption/weighting from uniform generator sampling, auxiliary-first update ownership, pretrained initialization and live frozen-denoiser input gradients. Two typeset displays add the auxiliary objective and detached adaptive weight plus the algebraically equivalent rising noise schedule. C retains the paper's pixel-count wording; exact channel reduction/released normalization remains for implementation inspection. No arbitrary denominator epsilon was invented. A six-line self-contained scalar kernel rejects invalid generator times and computes three assigned table levels:0→.002000,.4→.965417,.8→24.408342. The80 endpoint parameter is not reached by the reported generator time cutoff.

Evidence retains50kFID reference convention, EMA checkevery500ksynthetic images/best selection, ten re-evaluations versus ten independently trained seeds,500M/1Btraining exposure, paired teacher budgets, joint batch/LR change, FP16 hypothesis and cost exclusion. The table is reported evidence, not a reconstructed synthetic experiment.

## Verification

- New test-sid-recipe.mjs:1,00170-digit Decimal reference noise levels using the paper's original schedule orientation, executed actual rendered JS kernel, monotonicity and10invalid-domain guards. Exact parsedFID rows/formulas/conditions/date/nav pass. Existing735SiDgradient cases,15,904diffusion model cases and10,902scene states remain.
- Focused11583 terminal0 (689d48) before final exposure sentence. Final full47-script42687 terminal0 (5ec7ca) covers all final public edits,43sections/13,548rendered words.
- Explicit build99487 terminal0 (4e3044),e7y4hi. Fullsuite static9wF747:54readers/206landings/25notices/3,235reviewed legacy anchors/541displays/1,446namespace-validMathML/15media/544files/zero old dependencies;380comparison/163code regions.
- HTTP41243 terminal0 (19be40):285routes plus Home/Atlas,custom404,HEAD,query-preserving308,private/symlink exclusion,405,MIME/no-store/noindex/nosniff.
- Native e7y4hi1280×900 split and full-width screenshots,390×844 new recipe/code/table/evidence screenshots inspected.77MathML,no KaTeX errors/document overflow,emptywarn/error logs. Auxiliary formula239pxinside232px scrolls7px;generator equation fits232. Code459inside258 and both600px tablesinside258 settle40px per keyboardRight. No OSreduced-motion/BFCache/screen-reader/fullcorpus certification. Viewportreset;temporary tabclosed;4324server8559 stopped130.
- Rawreviewqueue61: new evidence training-budget lambda setting is an intentional plain parameter label, not a missing derivation. Whitespacecheckb42effexit0;gitdiffcheck does not fully cover untrackedv2.

## Next and boundaries

Inspect pinned releasedSiD loss/training/parameterization paths, resolve paper ambiguities against that code without assuming the current repository matches2024 exactly. FGM/Shortcut/Su remaining source scopes and broader corpus/editorial/native/recovery/release requirements remain open. No physical source removal,commit,push,deploy or production switch.232originals intact,231Git-equal recoveries and local/untracked harness exception unchanged.
