# Released SiD core-path checkpoint — 2026-10-24

Previous goal turn was progress: actual primary source/figure review and public recipe/evidence transfer with final validation. This continuation resolved implementation ambiguities rather than restating status.

## Pinned official source

Official paper-linked repository https://github.com/mingyuanzhou/SiD . HEAD resolved read-only to01fbb13cf18411e5f70d187c8fb2559567e5ae1c. This is a pinned current main-branch snapshot, not an asserted original conference-release tag. README explicitly separates main SiD from the adversarial sida branch. No sidenote report/new method imported from that branch.

Downloaded read-only files in /private/tmp/atlas-sid-code-Py0ZrT. SHA256:

| File | Hash |
|---|---|
| README.md | 2a545653240fc6d8d001ee2544e516c2a1d29d19241063850b3571a0e7ae3c89 |
| training/sid_loss.py | fa47caa3b2a65d3182d4feca2eddec102498d0aa471a66f8b0425cf1bf4b02c5 |
| training/sid_training_loop.py | a8af28b9267192dfe4764a6d8a82f675e2912565c42bfe745355f0f53797c8da |
| sid_train.py | 5f355571d1a60edb72ef6e6da8324bb33875bcb9bdee791c6151ef4583710bac |
| run_sid.sh | afefa8d2224f4ef2a0ecdae9dbf11461dff227e7cefc0e116f969bdd92f29f0d |
| training/networks.py | 2c02ea22779577e80489c3f8861489dab0a0e88164f5c2b6e7a3cc0fec5a38c6 |
| generate_onestep.py | 94e58b8239388351eb3fb53bd56ec0407a6e54a9e82b8c0ef8fcd173f0ea8f42 |

Completely read README, loss, training loop, entry point, launch and generation files. Read complete EDMPrecond constructor/forward/round_sigma block; did not line-review all U-Net/low-level ops. PythonAST parsed all five Python files, without importing or executing them. AST/string assertions9ac695 confirm detached mean/floor, NaN-not-isfinite screening and optimizer order. No checkpoint unpickled, package installed, CUDA/tensor/autograd run, metric pipeline replication or distributed performance claim.

## Resolved mechanism and public transfer

Added #sid-implementation inside the same Diffusion reader, with two typeset displays, a12-line independent scalar adaptation, assigned two-coordinate comparison and update-ownership table.44sections,34display+45inline=79MathML. Original publication2026-06-11 retained;updated2026-10-24.

- Generator loss cancels the explicit sigma fourth-power factor. Source denominator is per-example mean absolute residual over C,H,W in float32, under no_grad, floored at1e−5. It is not an unfloored paper L1 sum or differentiable normalization. The reader now distinguishes the paper formula from this implemented safeguard.
- Numerator source form delta*((teacher−y)−lambda*delta) equals delta*((1−lambda)*delta+aux−y). Source sums all coordinates/samples and multiplies by loss_scale/per-rank total batch before DDP averaging; a pixel mean would change gradient magnitude. Accumulated microbatches precede each optimizer step.
- Auxiliary step: generator frozen/eval, auxiliary train, optional augmentation; generator step: fresh latent/data/corruption, generator train, teacher and auxiliary frozen/eval, generator augmentation explicitlyNone, input gradients remain live. Teacher is always frozen/eval. Evaluation usesGEMA and fixed-noise preconditioned call, not raw U-Net output.
- Auxiliary defaults are exp(−1.2+1.2Z), data sigma.5 and EDM denoising weight. This differs from the bounded uniform generator-time schedule. No sampler distribution substitution is implied.
- Generator inputs and both denoiser wrapper outputs usefloat32 boundaries; CUDA U-Net may usefp16. The scalar Number reference does not imitate these rounding details.
- Source NaN filtering can remove examples; it is not comprehensive isfinite validation. Gradients are also passed throughnan_to_num before optimizer steps. All-filtered/nonfinite behavior has not been executed; public text requests review rather than certifying robustness. Scalar reference rejects nonfinite or misaligned inputs and nonfinite outputs explicitly, a stricter declared contract.
- Runner loads real dataset arrays and labels, normalizes pixels then overwrites images with generated samples before both losses. Dataset remains involved in shapes, labels, real sample grids and evaluation. README suggests dummy data when metrics are disabled. No claim that an unmodified conditional runner needs no label distribution.
- FFHQ launchg_beta1=.9 and entry-point optimizer wiring agree with Table6, not AppendixA's1. No invalidbeta1=1 recommendation copied.
- Current launch uses4GPUs versus Table6's16; accumulation formula adapts effective batch. No assumption of matching wall-clock overhead or metric cadence. Paper-reported500k cadence remains identified as paper evidence; current launch tick/snapshot/early-tick conditions differ.

## Independent verification

New test-sid-implementation.mjs executes the actual rendered scalar function in a fresh JS context.648 coordinate/mixing/scale cases compare to70-digit Decimal calculation using the source's alternate numerator form. Duplicate-coordinate checks show unchanged mean denominator and doubled coordinate-summed loss. Nine invalid/missing/sparse/nonfinite/overflow domains fail closed. Parsed formula, floor, ownership, source-revision links, explicit tensor limits and exact two-row example pass. It tests scalar loss values, not stop-gradient/autograd behavior. No claim that parsing source or fixed-weight finite differences certify real neural training.

- Final focused56994 terminal0(4c6bdc):44sections/four scenes/14,168rendered words. Earlier92117 terminal0 only covered the pre-auxiliary-formula version.
- Final full47-script54957 terminal0(0820bb), no later public edits.
- Explicit buildtpWTTK terminal0(938161). Full-suite staticJyT6ph:54readers/206landings/25notices/3,235reviewed legacy anchors/543displays/1,448namespace-validMathML/15media/544files/zero old dependencies.382comparison/164code regions.
- HTTP77299 terminal0(8ecce7):285routes plusHome/Atlas,404/HEAD/query308/private/symlink/405/MIME/review headers.
- Native tpWTTK1280×900 split/fullwidth and390×844 screenshots inspected: released loss, code/two-row table, ownership table and auxiliary equation.79MathML,zeroKaTeX/document overflow,emptywarn/error logs. Loss304pxinside232,auxiliary252inside232;loss/code712inside258/both600px tablesinside258 settle40px keyboardRight. Auxiliary equation reaches its20.5px end. Focus visible. No full-corpus/screen-reader/BFCache/OS-motion/tensor certification. Viewportreset,temporarytabclosed,4324server36501 stopped130.
- Rawqueue62: new beta1=.9 recipe setting is intentional plain notation,not a missed complex derivation.0abb30whitespacecheckexit0;untrackedv2 caveat remains.

## Next / boundaries

Relevant SiD paper and released core-path inspection now complete to the scope above. No requirement to run expensive image training inferred. Continue remaining FGM/Shortcut/Su source-transfer scopes and corpus-wide editorial/native/recovery/release audits. All232originals intact;231Git-equal recoveries plus the local/untracked multi-harness exception unchanged. No physical retirement,commit,push,deploy or production switch.
