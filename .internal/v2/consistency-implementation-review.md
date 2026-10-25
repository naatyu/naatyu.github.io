# Consistency Models implementation checkpoint — 2026-10-24

The preceding goal turn made substantive paper/source-transfer progress. This continuation inspects the relevant released PyTorch loss, wrapper, model-role and sampling paths and transfers missing implementation details. It is not a whole-repository audit, CUDA/checkpoint execution, CIFAR JAX review or replicated benchmark.

## Pinned observations

Official repository HEAD resolved read-only to e32b69ee436d518377db86fb2127a3972d0d8716. Retrieved source files at that exact revision; no install, training command, downloaded Python module or checkpoint was executed. Public repository pages were used for discovery, pinned raw files for inspection.

| File | SHA-256 |
| --- | --- |
| cm/karras_diffusion.py | b8fcf9f53e63cff19db676814545ee7644259364236de5c10ac3d69007ee5177 |
| cm/train_util.py | bf387ed2d2d4582e9ab069c14c762e3797878bb2231551a54e5fbe36176b1cfc |
| cm/script_util.py | 271da181133400aa3d3de4664be8229424e9a6daacb0e93e24efd026a89ebc07 |
| scripts/launch.sh | 740edc540c5fa212b5c8c87f5a1e0851b2b2b0a5824997d8e8a9eab75a11117d |
| scripts/cm_train.py | 0b5185c19b2b22a76dff1326c7c9209df791613361e0921fd63e3878477a256c |
| scripts/image_sample.py | 833af87c3ae6557c4c9d921db96fb8583611ac7bab888851aefb40a250585713 |

Scope read: karras_diffusion.py through the multistep sampling implementation (including ordinary training/progressive-distillation context); complete script_util.py, cm_train.py, image_sample.py and launch.sh; CMTrainLoop construction, target/teacher loading, run/update/forward/backward/save methods and relevant base-loop context; repository README. Editing routines, UNet internals, mixed-precision internals, distributed optimizer behavior and separate CIFAR repository remain outside this review.

AST-only observation436d2f verifies the factory's KarrasDenoiser call keywords (sigma_data, sigma_max, sigma_min, distillation, weight_schedule), with no loss_norm. The CLI entry constructs arguments from model_and_diffusion_defaults, while loss_norm belongs to the separate training defaults. The denoiser therefore keeps its default LPIPS along this path. The CMTrainLoop while condition at line361 is `not self.lr_anneal_steps or self.step < self.lr_anneal_steps or self.global_step < self.total_training_steps`; zero annealing leaves the first term true. These are pinned source-wiring findings, not an executed long training run or a claim about every fork.

CT launch examples specify a teacher checkpoint and the entry copies it into online parameters. The CT loss branch omits the teacher; the CD branch supplies it. Initialization and target construction are separate. The wrapper's boundary flag applies to both consistency modes. Target and evaluation EMAs are distinct; the target update follows a successful optimizer update.

## Transfer and independent checks

Added #consistency-implementation to the existing Diffusion note. Input preconditioning and network time have one explicit display. Model roles have a comparison. The released ImageNet CD index trace [0,22,39] has two prediction calls, not three. Its middle level rounds to1.382368. Python double arithmetic produces a last level0.002000000000000003 and tiny positive final variance1.2705494208814505e-20; public prose says ideally zero, not bitwise zero. The independent scalar reference deliberately defines its cutoff by its final explicit level.

The actual rendered12-line Python reference is tested, not a rewritten test copy.381 exhaustive selected-index/initial-state cases compare against expanded affine composition, a two-call terminal trace checks noise-draw consumption, and12 invalid contracts reject before calling the model. Callbacks have a stated finite-scalar contract; this is not a production tensor sampler. Exact parsed formula, pinned links, initialization/wiring and scope assertions pass. Existing15,904 numerical and10,902 scene-state checks remain.

Reader now40 navigable sections,29 displays+45 inline=74MathML. Publication and updated dates remain2026-06-11/2026-10-24. No original body, route mapping, media asset or interactive numerical model changed. New static code/example behavior is limited to teaching output.

## Final verification

Focused31637 reached exit0 in1f160f; final implementation/build66555 reached exit0 in0b5a17. Full47-script31084 reached terminal exit0 in632e2f after all public/test changes. Static fJnZBZ:54readers,206landings,25notices,3,235anchors,538displays,1,443validMathML,15media,544files,zero old dependencies,377comparison/162code regions. Fresh raw-math queue9a6dca remains59 manual candidates. Whitespace5d8b19 exits0,with the existing untracked-file scope limitation.

Native final CddXu1 at1280×900/390×844: input/time equation, model-role table, trace, code and pinned-code warnings inspected.74math roots,zero KaTeX/page-overflow failures and empty warning/error log. Both600px comparison tables scroll locally40px on ArrowRight inside258px mobile surfaces; the755px code region also scrolls40px with visible focus. The code remains twelve lines, not a full framework listing. No all-reader OS/reduced-motion/BFCache/screen-reader certification inferred. Viewport reset,temporary tab closed,preview18780 stopped130.

Final separate HTTP11424/2ec969 exits0 on all285routes plusHome/Atlas and404/HEAD/query308/privacy/symlink/405/MIME/review-header cases; its server closes internally. Physical originals, the untracked harness recovery exception and production workflow remain intact. No staging,commit,push,publication or retirement occurred. Other Diffusion primary scopes and full corpus/editorial/accessibility/recovery/production-switch requirements remain open; full goal active.
