# Vectors and Geometry — draft audit

## Inline formula and comparison-table verification — 2026-10-11

The two original bodies were reread during this checkpoint. Converted 17 inline formulas, including the two norm gradients, the positive-ray convexity counterexample, sum/mean error reductions, isotropic covariance and cross-product identities. Seven display groups remain unchanged. Three comparison tables now have named, focusable local scroll regions and a readable minimum width.

Independent checks cover 30 coordinate central differences for both gradients and 15 positive-ray equalities, in addition to the existing 361 angle states and cross-product/normalization regressions. Actual rendered DOM tests require 24 MathML objects, 17 inline formulas and all three keyboard table regions. Focused Geometry and corpus math tests exit successfully; global display count remains 521. The raw-text review queue falls from 245 to 236 candidates and finds none in Geometry. This heuristic does not certify mathematical correctness or undetected raw scene/prose notation.

Fresh static candidate 41MiED builds successfully. Native 1280×900 and 390×844 inspection shows zero page-level overflow and zero parser errors. The mobile objectives table retains focus and scrolls 40px with ArrowRight. Convexity formulas wrap inside the prose without page overflow. Browser warning/error logs are empty. Proofs: `geometry-math-desktop.png`, `geometry-math-mobile.png`, and `geometry-convexity-mobile.png` in the task workspace. Temporary viewport reset; preview session 36649 stopped with exit130. Connected Vision primary, corpus-wide editorial/accessibility and production-switch gates remain open. No original removal or publication.

Updated 2026-10-06. `math/geometry`, original publication 2026-04-10. Both assigned source bodies read fully and reread during reconciliation. No original images/components found. Local semantic destinations now replace redundant entries; no production retirement or publication.

## Reconciliation and mathematics — 2026-10-06

Reread complete Cross Product and L2 bodies. All unique derivations/examples/applications are covered with the corrections below; L2's more detailed proof/penalty material has Losses as its canonical owner. Cross Product's ten heading fragments now map to meaningful Geometry sections. L2's eleven already-reviewed fragments map to Losses. Both sources are tracked, equal HEAD and match hashes below. One old inbound Cross Product link exists in the original SVM note. No production redirects activated.

Removed the public originals block and old LeJEPA/SIGReg links in Geometry; Vision is the canonical connected owner. Seven display formulas are explicit TeX/MathML. Gaussian likelihood now states n-dimensional positive-definite covariance and its normalization constant. Native390px check shows no page overflow, escaped equation regions or parser errors; wide formulas scroll locally. Numerical geometry regression passes. Complete Vision primary-review and production gates remain separate.

## Coverage and corrections

| Original | Preserved in reader |
| --- | --- |
| Cross Product | `#cross`–`#applications`: determinant/component signs, area/right-hand direction, anticommutation/distribution/scalars, collinear degeneracy, graphics normals, torque/angular momentum, orientation and short geometry procedure |
| L2 Norm and Loss | `#magnitude`–`#ridge`: magnitude/direction, normalization and zero policy, embeddings/LeJEPA/FaceNet context, square root versus squared derivative, L1 comparison, Gaussian likelihood, Gram-matrix ridge correction, prior precision and ambiguity of “inverse loss” |

Corrected: unit normalization does not prevent collapse; a constant unit embedding is a counterexample. A strictly convex Euclidean ball does not make the norm function strictly convex along rays. Squared linear least squares requires full column rank for strict convexity; positive ridge in the fully penalized linear problem restores it, not in arbitrary neural objectives. L1's dual norm is L∞, not L2. Norm/distance/squared error/parameter penalty and sum/mean scaling are separated. A Gaussian interpretation requires stated covariance conditions. Ridge adds to the feature Gram matrix, not any covariance without context.

The 3D triangle example is conceptual pseudocode, not an executable library implementation. Numerical tolerance is application/scale dependent; robust orientation may require exact/adaptive predicates.

## Evidence and limits

Math Insight cross-product text checked for geometry/direction/properties. Stanford Stats305b Ridge formulation and Gaussian-prior precision paragraphs checked. No original applet or primary figure reused; no numerical benchmark claim introduced. Full LeJEPA/FaceNet primary objective review remains part of vision ownership, not claimed fresh here.

Original visual: fixed-scale parallelogram with solid blue a, dashed burgundy b; signed angle distinguishes dot alignment from nonnegative area and signed normal. Default state is meaningful without playback. Opt-in animation and manual states use shared reduced-motion/offscreen/disposal handling.

Tests: normalization (including extreme finite input scales), unit distance identity, cross-product orthogonality/antisymmetry/distribution/scalars/Lagrange identity, signed orientation/translation, 361 angle states, zero/invalid inputs, anchors/routes/search and source visibility pass. Browser: desktop and 390×844 checked, slider endpoints ±180 report zero area/no unique normal; 46° gives dot 4.168, signed/area 4.316 and cosine .695. Mobile document width remains 390, scene 306; no warning/error logs. Temporary viewport reset. Screenshot `geometry-v2.png` in task directory. Actual OS reduced-motion preference check pending; shared lifecycle harness passes.

Remaining: final complete preservation/primary checks, static production rendering/routes and publication gates. No production-ready/deployed claim.

## Source hashes

Final checkpoint regression:all47 default scripts in session61604 exit0 after the Geometry edits. Fresh static outputsjjoA4 contains54readers/206reviewed landings/25retirement notices/3235reviewed anchors/521displays/14images/541files/zero old dependencies. Read-only corpus2116 exit0 confirms original fingerprints unchanged. These are structural/numerical checks,not full external-primary or production certification.

- Cross Product: `260f333eb48d52e0499be396e65e891beeb3098961cd7361e258d461cad1a354`
- L2: `7aeb1de11b82337c38bd641890aef580539e319d7af1bf8d6b570203aa3fa8ea`
