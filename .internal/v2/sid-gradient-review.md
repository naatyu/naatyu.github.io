# SiD generator-gradient checkpoint — 2026-10-24

## Source scope

Primary: https://arxiv.org/html/2404.04057v2 . Read main setup/identities and selected main/appendix windows in the preceding continuation; freshly verified §4.4 equations21–24, §4.5 equations25–26 and AppendixD equations35–36 and its remaining derivation. This is a scoped gradient review, not a completed whole-paper/figure/released-code review. No image, external implementation or model checkpoint imported or executed.

The reader's equation23 transcription is retained: weights frozen for the teacher/auxiliary generator step, but both input Jacobians remain live. Added #sid-gradient-example after #sid and before FGM. It uses the paper's Gaussian family and our explicitly constant-weight evaluation of the fused expression. The real recipe's detached adaptive weight is different. No benchmark or neural convergence claim is added.

## Transfer and independent evidence

Real clean law N(0,1), generated law N(theta,1), positive sigma and v=1+sigma². Auxiliary mean psi is independent/fixed for the generator update. Teacher D(u)=u/v, auxiliary D(u)=(u+psi sigma²)/v. The naive difference norm has zero theta derivative even when psi numerically equals theta. The constant-weight fused expectation is (psi theta−lambda psi²)/v², with theta derivative psi/v². For theta=psi=2,sigma=1,lambda=1, the ideal/naive/fused value-gradient pairs are (1,1),(1,0),(0,.5). Equal values are not graph equivalence; a zero surrogate value need not mean a zero update. Lambda's constant-only role in this affine example is not generalized to neural networks.

New test-sid-gradient.mjs checks parsed source conditions/formulas/table/nav.735 independent cases use four symmetric nodes to exactly integrate these degree-two Gaussian expressions from affine denoiser evaluations. Closed forms and fixed-psi finite differences agree for seven theta values,seven psi values,five positive noise levels and three lambda values. This does not simulate training or execute autograd/neural models. Existing15,904 numerical cases and10,902 rendered states remain unchanged.

## Verification

- Focused94597 terminal0 (0091d6):41sections,four scenes,13,052 rendered words.
- Final full47-script26075 terminal0 (4c2acc); no later public edits.
- Explicit build34445 terminal0 (a45cd1):xRK6cf,54readers/206legacy landings/25notices/252resources/15media/zero old dependencies.
- Full-suite static mShpdw:3,235reviewed legacy anchors,539displays,1,444namespace-validMathML,378comparison/162code regions,544files. The new non-legacy anchor does not change the reviewed legacy-anchor count.
- HTTP43268 terminal0 (721f74):285routes plus Home/Atlas,404/HEAD/query308/private/symlink/405/MIME/review headers.
- Native xRK6cf:1280×900 screenshot of new section and390×844 screenshots of equation/table/prose.75readerMathML,zero KaTeX errors/document overflow,empty warn/error logs. Math local surface328px inside232px;table600inside258. Both keyboard ArrowRight settle40px;second table press/screenshot exposes expected-value column with visible focus. These are scoped checks,not full reader/a11y/BFCache/OS reduced-motion certification. Viewport reset,temporary tabclosed,4324server81530 stopped130.
- Raw heuristic queue60,upfrom59 solely due the new synthetic table's assigned parameter settings. That candidate is intentional,not an untypeset derivation. Display and namespace guards pass. Current whitespace check exits0;as v2 is untracked,git diff --check is not a complete untracked whitespace check.

## Remaining

Finish SiD full text/figure/released-code scope, then remaining FGM/Shortcut/Su source scopes and corpus-wide editorial/native/recovery/release requirements. Do not describe this checkpoint as full migration or production readiness. All232originals intact;231verified Git recoveries plus the local/untracked multi-harness exception remain. No retirement,commit,push,deploy or production switch.
